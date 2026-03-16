/**
 * Analytics Tracker — full in-app analytics (sessions, pages, events).
 *
 * Singleton that batches events and flushes every 10s or on tab close.
 * Replaces Yandex Metrika with own data in our DB.
 */

import { ENV } from '../config/env';

const FLUSH_INTERVAL = 10_000; // 10 seconds
const MAX_BUFFER = 20;

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getToken() {
  try { return localStorage.getItem('auth_token'); } catch { return null; }
}

function getUTMParams() {
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source') || undefined,
      utm_medium: params.get('utm_medium') || undefined,
      utm_campaign: params.get('utm_campaign') || undefined,
    };
  } catch { return {}; }
}

class AnalyticsTracker {
  constructor() {
    this.sessionId = null;
    this.sessionStart = null;
    this.pageHistory = [];
    this.currentPage = null;
    this.currentPageEnter = null;
    this.eventBuffer = [];
    this.flushTimer = null;
    this.initialized = false;
  }

  /** Call once in App.jsx */
  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Session: persist in sessionStorage so it survives SPA navigation but dies with tab
    try {
      this.sessionId = sessionStorage.getItem('_at_sid');
      if (!this.sessionId) {
        this.sessionId = uuid();
        sessionStorage.setItem('_at_sid', this.sessionId);
      }
    } catch {
      this.sessionId = uuid();
    }

    this.sessionStart = Date.now();

    // Session start event
    this._push('session_start', {
      landing_page: window.location.pathname,
      referrer: document.referrer || undefined,
      ...getUTMParams(),
    });

    // Flush timer
    this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL);

    // Flush on tab close / hide
    const onLeave = () => this._onLeave();
    window.addEventListener('pagehide', onLeave);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this._onLeave();
    });
  }

  /** Track a page view — call on every route change */
  trackPageView(path) {
    // Close previous page
    if (this.currentPage && this.currentPageEnter) {
      const duration = Date.now() - this.currentPageEnter;
      this._push('page_view', {
        path: this.currentPage,
        duration_ms: duration,
        prev_page: this.pageHistory.length > 1
          ? this.pageHistory[this.pageHistory.length - 2]
          : undefined,
      });
    }

    // Start new page
    this.currentPage = path;
    this.currentPageEnter = Date.now();
    this.pageHistory.push(path);

    // Cap history at 50 entries
    if (this.pageHistory.length > 50) this.pageHistory = this.pageHistory.slice(-50);
  }

  /** Track generic event */
  trackEvent(type, data = {}) {
    this._push(type, data);
  }

  /** Track share (referral or prediction) */
  trackShare(shareType, channel, context = {}) {
    this._push(shareType === 'referral' ? 'share_referral' : 'share_prediction', {
      channel,
      ...context,
    });
  }

  /** Track banner click with session context */
  trackBannerClick(bannerId, page, matchId) {
    this._push('banner_click', {
      banner_id: bannerId,
      page,
      match_id: matchId || undefined,
      session_duration_ms: Date.now() - (this.sessionStart || Date.now()),
      pages_before: this.pageHistory.slice(-10),
      referrer_page: this.currentPage,
      bookmaker: ENV.BOOKMAKER_NAME || 'partner',
    });
    // Flush immediately for banner clicks — important event
    this.flush();
  }

  /** Get session info for external use */
  getSessionContext() {
    return {
      session_id: this.sessionId,
      session_duration_ms: Date.now() - (this.sessionStart || Date.now()),
      pages_visited: this.pageHistory.length,
      current_page: this.currentPage,
    };
  }

  // --- Internal ---

  _push(type, data) {
    this.eventBuffer.push({
      type,
      data,
      ts: Date.now(),
    });
    if (this.eventBuffer.length >= MAX_BUFFER) this.flush();
  }

  _onLeave() {
    // Close current page
    if (this.currentPage && this.currentPageEnter) {
      const duration = Date.now() - this.currentPageEnter;
      this.eventBuffer.push({
        type: 'page_view',
        data: {
          path: this.currentPage,
          duration_ms: duration,
          prev_page: this.pageHistory.length > 1
            ? this.pageHistory[this.pageHistory.length - 2]
            : undefined,
        },
        ts: Date.now(),
      });
      this.currentPageEnter = null;
    }

    // Session end
    this.eventBuffer.push({
      type: 'session_end',
      data: {
        duration_ms: Date.now() - (this.sessionStart || Date.now()),
        pages_visited: this.pageHistory.length,
        page_path: this.pageHistory.slice(-20),
      },
      ts: Date.now(),
    });

    this._flushBeacon();
  }

  /** Regular flush via fetch */
  flush() {
    if (!this.eventBuffer.length) return;

    const events = this.eventBuffer.splice(0);
    const payload = JSON.stringify({
      session_id: this.sessionId,
      events,
    });

    const url = `${ENV.API_URL}/analytics/events`;
    const token = getToken();

    try {
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    } catch { /* fire and forget */ }
  }

  /** Flush via sendBeacon (for tab close) */
  _flushBeacon() {
    if (!this.eventBuffer.length && !this.eventBuffer.length) {
      // Check if we already moved events to the beacon payload
    }

    const events = this.eventBuffer.splice(0);
    if (!events.length) return;

    const payload = JSON.stringify({
      session_id: this.sessionId,
      events,
    });

    const url = `${ENV.API_URL}/analytics/events`;

    try {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    } catch {
      // Fallback to fetch
      try {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      } catch { /* lost events — acceptable */ }
    }
  }

  /** Cleanup */
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this._onLeave();
    this.initialized = false;
  }
}

// Singleton
const analyticsTracker = new AnalyticsTracker();
export default analyticsTracker;
