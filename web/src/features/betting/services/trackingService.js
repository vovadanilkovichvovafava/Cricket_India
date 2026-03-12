/**
 * Tracking Service — builds affiliate links with user tracking params.
 *
 * When a user clicks an affiliate link, we append their userId as external_id
 * and sub_id_10 so the bookmaker can include it in postback calls.
 * This allows us to match postbacks to users and activate premium.
 */

import { ENV } from '../../../shared/config/env';

/**
 * Build a tracked affiliate link for a user.
 * @param {number|string} userId - User's database ID
 * @param {string} [banner='default'] - Banner/placement identifier for analytics
 * @returns {string} Full affiliate URL with tracking params
 */
export function getTrackingLink(userId, banner = 'default') {
  const base = ENV.OFFER_URL || ENV.BOOKMAKER_LINK || '#';

  if (!base || base === '#') return '#';

  return addTrackingToUrl(base, userId, banner);
}

/**
 * Append tracking parameters to any URL.
 * @param {string} url - Base URL to add params to
 * @param {number|string} userId - User's database ID
 * @param {string} [banner='default'] - Banner/placement identifier
 * @returns {string} URL with tracking params appended
 */
export function addTrackingToUrl(url, userId, banner = 'default') {
  if (!url || url === '#') return url;

  try {
    const u = new URL(url);

    // Core tracking — bookmaker sends these back in postback
    u.searchParams.set('external_id', String(userId));
    u.searchParams.set('sub_id_10', String(userId));

    // UTM params for our analytics
    u.searchParams.set('utm_source', 'cricketbaazi');
    u.searchParams.set('utm_medium', banner);
    u.searchParams.set('utm_campaign', 'ipl2026');

    return u.toString();
  } catch {
    // If URL parsing fails, append manually
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}external_id=${userId}&sub_id_10=${userId}&utm_source=cricketbaazi&utm_medium=${banner}`;
  }
}

/**
 * Get the base offer URL (without tracking).
 * @returns {string}
 */
export function getOfferUrl() {
  return ENV.OFFER_URL || ENV.BOOKMAKER_LINK || '#';
}
