const rc = window.__APP_CONFIG__ || {};

// Domain → traffic source + offer URL mapping
const DOMAIN_CONFIG = {
  'prescore.vip': {
    source: 'google',
    offerUrl: 'https://siteofficialred.com/XNRCrhCZ',
  },
  'www.prescore.vip': {
    source: 'google',
    offerUrl: 'https://siteofficialred.com/XNRCrhCZ',
  },
  'prescoreai.app': {
    source: 'organic',
    offerUrl: 'https://siteofficialred.com/Qhs6z2nP',
  },
  'www.prescoreai.app': {
    source: 'organic',
    offerUrl: 'https://siteofficialred.com/Qhs6z2nP',
  },
};

const _hostname = typeof window !== 'undefined' ? window.location.hostname : '';
const _domainCfg = DOMAIN_CONFIG[_hostname] || {};

export const APP_DOMAIN = 'prescoreai.app';
export const TRAFFIC_SOURCE = _domainCfg.source || 'organic';
export const ENV = {
  API_URL:          rc.API_URL          || import.meta.env.VITE_API_URL          || '/api/v1',
  CRICKET_API_KEY:  rc.CRICKET_API_KEY  || import.meta.env.VITE_CRICKET_API_KEY  || '',
  ODDS_API_KEY:     rc.ODDS_API_KEY     || import.meta.env.VITE_ODDS_API_KEY     || '',
  GEO_SERVER_URL:   rc.GEO_SERVER_URL   || import.meta.env.VITE_GEO_SERVER_URL   || 'http://localhost:3001',
  TRACKING_API:     rc.TRACKING_API     || import.meta.env.VITE_TRACKING_API     || '',
  OFFER_URL:        _domainCfg.offerUrl || rc.OFFER_URL || import.meta.env.VITE_OFFER_URL || '',
  BOOKMAKER_NAME:   rc.BOOKMAKER_NAME   || import.meta.env.VITE_BOOKMAKER_NAME   || 'Partner',
  BOOKMAKER_LINK:   _domainCfg.offerUrl || rc.BOOKMAKER_LINK || import.meta.env.VITE_BOOKMAKER_LINK || '',
  BOOKMAKER_BONUS:  rc.BOOKMAKER_BONUS  || import.meta.env.VITE_BOOKMAKER_BONUS  || '',
  BOOKMAKER_CTA:    rc.BOOKMAKER_CTA    || import.meta.env.VITE_BOOKMAKER_CTA    || '',
};
