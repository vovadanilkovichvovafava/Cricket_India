const rc = window.__APP_CONFIG__ || {};
export const ENV = {
  API_URL:          rc.API_URL          || import.meta.env.VITE_API_URL          || '/api/v1',
  CRICKET_API_KEY:  rc.CRICKET_API_KEY  || import.meta.env.VITE_CRICKET_API_KEY  || '',
  ODDS_API_KEY:     rc.ODDS_API_KEY     || import.meta.env.VITE_ODDS_API_KEY     || '',
  GEO_SERVER_URL:   rc.GEO_SERVER_URL   || import.meta.env.VITE_GEO_SERVER_URL   || 'http://localhost:3001',
  TRACKING_API:     rc.TRACKING_API     || import.meta.env.VITE_TRACKING_API     || '',
  OFFER_URL:        rc.OFFER_URL        || import.meta.env.VITE_OFFER_URL        || '#',
  BOOKMAKER_NAME:   rc.BOOKMAKER_NAME   || import.meta.env.VITE_BOOKMAKER_NAME   || 'Partner',
  BOOKMAKER_LINK:   rc.BOOKMAKER_LINK   || import.meta.env.VITE_BOOKMAKER_LINK   || '#',
  BOOKMAKER_BONUS:  rc.BOOKMAKER_BONUS  || import.meta.env.VITE_BOOKMAKER_BONUS  || '',
  BOOKMAKER_CTA:    rc.BOOKMAKER_CTA    || import.meta.env.VITE_BOOKMAKER_CTA    || '',
};
