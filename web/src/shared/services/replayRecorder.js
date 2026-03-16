/**
 * Replay Recorder — captures rrweb DOM snapshots for session replay.
 *
 * Singleton that buffers rrweb events and flushes them every 20s
 * to POST /analytics/replay. Shares session_id with analyticsTracker.
 * Data is gzip-compressed on backend, replayed via rrweb-player in admin.
 */

import { ENV } from '../config/env';

const FLUSH_INTERVAL = 20_000; // 20 seconds
const MAX_SIZE = 2 * 1024 * 1024; // 2MB client-side cap

function getToken() {
  try { return localStorage.getItem('auth_token'); } catch { return null; }
}

class ReplayRecorder {
  constructor() {
    this.stopFn = null;
    this.buffer = [];
    this.flushTimer = null;
    this.sessionId = null;
    this.totalSize = 0;
    this.capped = false;
    this._fullSnapshotSent = false;
    this._boundLeave = null;
  }

  /**
   * Start rrweb recording. Call after analyticsTracker.init().
   * @param {string} sessionId — shared session ID from analyticsTracker
   */
  init(sessionId) {
    if (this.stopFn || !sessionId) return;
    this.sessionId = sessionId;
    this.buffer = [];
    this.totalSize = 0;
    this.capped = false;
    this._fullSnapshotSent = false;

    // Dynamic import to keep rrweb out of the main bundle for non-recorded pages
    import('rrweb').then(({ record }) => {
      if (this.capped) return; // init may have been called and destroyed

      this.stopFn = record({
        emit: (event) => this._onEvent(event),
        maskAllInputs: true,
        blockClass: 'rr-block',
        sampling: {
          mousemove: 50,
          mouseInteraction: true,
          scroll: 150,
          input: 'last',
        },
        recordCanvas: false,
        recordCrossOriginIframes: false,
        inlineStylesheet: true,
        slimDOMOptions: {
          script: true,
          comment: true,
          headFavicon: true,
          headWhitespace: true,
          headMetaDescKeywords: true,
          headMetaSocial: true,
          headMetaRobots: true,
          headMetaHttpEquiv: true,
          headMetaAuthorship: true,
          headMetaVerif: true,
        },
      });

      // Periodic flush
      this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL);

      // Flush on tab close / hide
      this._boundLeave = () => this._onLeave();
      window.addEventListener('pagehide', this._boundLeave);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') this._onLeave();
      });
    }).catch(() => {
      // rrweb failed to load — silently skip
    });
  }

  _onEvent(event) {
    if (this.capped) return;

    // Estimate event size
    try {
      const size = JSON.stringify(event).length;
      this.totalSize += size;
    } catch {
      this.totalSize += 500; // estimate
    }

    this.buffer.push(event);

    // Flush FullSnapshot (type 2) immediately — it's critical for replay
    if (event.type === 2 && !this._fullSnapshotSent) {
      this._fullSnapshotSent = true;
      this.flush(false);
      return;
    }

    // Client-side cap
    if (this.totalSize >= MAX_SIZE) {
      this.capped = true;
      this.flush(true); // final flush
      if (this.stopFn) {
        this.stopFn();
        this.stopFn = null;
      }
    }
  }

  flush(isFinal = false) {
    if (!this.buffer.length || !this.sessionId) return;

    const events = this.buffer.splice(0);
    const payload = JSON.stringify({
      session_id: this.sessionId,
      events,
      is_final: isFinal,
    });

    const url = `${ENV.API_URL}/analytics/replay`;
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      fetch(url, {
        method: 'POST',
        headers,
        body: payload,
        keepalive: true,
      }).catch(() => {});
    } catch {
      // silently fail — don't affect user experience
    }
  }

  _onLeave() {
    if (!this.buffer.length || !this.sessionId) return;

    const events = this.buffer.splice(0);
    const payload = JSON.stringify({
      session_id: this.sessionId,
      events,
      is_final: true,
    });

    const url = `${ENV.API_URL}/analytics/replay`;
    const token = getToken();

    // sendBeacon for reliable delivery on tab close
    try {
      const blob = new Blob([payload], { type: 'application/json' });
      const sent = navigator.sendBeacon(url, blob);
      if (!sent) {
        // Fallback to fetch
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // last resort
    }
  }

  destroy() {
    if (this.stopFn) {
      this.stopFn();
      this.stopFn = null;
    }
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    if (this._boundLeave) {
      window.removeEventListener('pagehide', this._boundLeave);
      this._boundLeave = null;
    }
    // Final flush
    this.flush(true);
    this.buffer = [];
    this.sessionId = null;
  }
}

const replayRecorder = new ReplayRecorder();
export default replayRecorder;
