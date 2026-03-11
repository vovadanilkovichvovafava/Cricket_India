// Default fallback color for unknown teams (yellow-green)
const DEFAULT_COLOR = '#8DB600';
const DEFAULT_TEAM = { color: DEFAULT_COLOR, bg: DEFAULT_COLOR, text: '#000' };

export const IPL_TEAMS = {
  CSK:  { name: 'Chennai Super Kings', short: 'CSK', city: 'Chennai', color: '#FCCA06', bg: '#FCCA06', text: '#000' },
  MI:   { name: 'Mumbai Indians', short: 'MI', city: 'Mumbai', color: '#004BA0', bg: '#004BA0', text: '#fff' },
  RCB:  { name: 'Royal Challengers Bengaluru', short: 'RCB', city: 'Bengaluru', color: '#EC1C24', bg: '#EC1C24', text: '#fff' },
  KKR:  { name: 'Kolkata Knight Riders', short: 'KKR', city: 'Kolkata', color: '#3A225D', bg: '#3A225D', text: '#fff' },
  DC:   { name: 'Delhi Capitals', short: 'DC', city: 'Delhi', color: '#004C93', bg: '#004C93', text: '#fff' },
  SRH:  { name: 'Sunrisers Hyderabad', short: 'SRH', city: 'Hyderabad', color: '#F7A721', bg: '#F7A721', text: '#000' },
  RR:   { name: 'Rajasthan Royals', short: 'RR', city: 'Jaipur', color: '#EA1A85', bg: '#EA1A85', text: '#fff' },
  PBKS: { name: 'Punjab Kings', short: 'PBKS', city: 'Mohali', color: '#ED1B24', bg: '#ED1B24', text: '#fff' },
  LSG:  { name: 'Lucknow Super Giants', short: 'LSG', city: 'Lucknow', color: '#A72056', bg: '#A72056', text: '#fff' },
  GT:   { name: 'Gujarat Titans', short: 'GT', city: 'Ahmedabad', color: '#1C1C1C', bg: '#1C1C1C', text: '#fff' },
};

// Comprehensive color database: code → hex color
// IPL, International, BBL, PSL, CPL, SA20, The Hundred, SA domestic, ILT20
const GLOBAL_COLORS = {
  // ── IPL ──
  CSK: '#FCCA06', MI: '#004BA0', RCB: '#EC1C24', KKR: '#3A225D',
  DC: '#004C93', SRH: '#F7A721', RR: '#EA1A85', PBKS: '#ED1B24',
  LSG: '#A72056', GT: '#1C1C1C',
  // ── International ──
  IND: '#0078D7', AUS: '#FFCD00', ENG: '#002147', PAK: '#006629',
  SA: '#006A4D', RSA: '#006A4D', NZ: '#000000', NZL: '#000000',
  WI: '#7B0041', SL: '#003478', SRI: '#003478',
  BAN: '#006A4D', AFG: '#0066B3', ZIM: '#D40000',
  IRE: '#169B62', NED: '#FF6600', SCO: '#003078',
  NEP: '#003893', UAE: '#003B70', OMN: '#C8102E',
  NAM: '#002D6E', USA: '#002868', CAN: '#FF0000',
  PNG: '#CE1126', HK: '#DE2910', KEN: '#006600',
  // ── Big Bash League (BBL) ──
  SIX: '#EC2A90', THU: '#97D700', STA: '#287246', REN: '#EE343F',
  // SCO: '#FF6600' (Scorchers — conflicts with Scotland, handled by name)
  HEA: '#27A6B0', HUR: '#674398', STR: '#0084D6',
  // ── Pakistan Super League (PSL) ──
  KAR: '#0752C2', LAH: '#78FF06', ISL: '#FF0000', PES: '#FFFF00',
  QUE: '#5F0182', MUL: '#589F28',
  // ── Caribbean Premier League (CPL) ──
  TKR: '#D50032', JAM: '#009B3A', BR: '#E74093', SNP: '#CF142B',
  GAW: '#009E49', SLK: '#0057B7', ABF: '#000080',
  // ── SA20 (South Africa franchise) ──
  MICT: '#004B8D', DSG: '#A72056', JSK: '#F9CD05',
  PR: '#EA1A85', PC: '#004C93', SEC: '#F26522',
  // ── South African domestic (CSA) ──
  WAR: '#556B2F', TIT: '#00BFFF', LIONS: '#CC0000', LIO: '#CC0000',
  DOL: '#1C1C6B', KNG: '#FF6600', KNI: '#FF6600',
  COB: '#006400', NWD: '#8B0000', ERD: '#8B0000',
  // ── The Hundred (UK) ──
  OI: '#00A651', TR: '#00584C', SB: '#002B5C', BP: '#D4213D',
  MO: '#4A4A4A', LS: '#00A3E0', WF: '#E4003B', NS: '#FFD700',
  // ── ILT20 (UAE) ──
  GG: '#E87722', DUB: '#CC0033', MIE: '#004B8D',
  ADKR: '#3A225D', DV: '#CC0000', SW: '#5F0182',
};

// Team name → code lookup
const NAME_TO_CODE = {
  // IPL
  'chennai super kings': 'CSK', 'mumbai indians': 'MI',
  'royal challengers bengaluru': 'RCB', 'royal challengers bangalore': 'RCB',
  'kolkata knight riders': 'KKR', 'delhi capitals': 'DC',
  'sunrisers hyderabad': 'SRH', 'rajasthan royals': 'RR',
  'punjab kings': 'PBKS', 'kings xi punjab': 'PBKS',
  'lucknow super giants': 'LSG', 'gujarat titans': 'GT',
  // International
  'india': 'IND', 'australia': 'AUS', 'england': 'ENG',
  'pakistan': 'PAK', 'south africa': 'SA', 'new zealand': 'NZ',
  'west indies': 'WI', 'sri lanka': 'SL', 'bangladesh': 'BAN',
  'afghanistan': 'AFG', 'zimbabwe': 'ZIM', 'ireland': 'IRE',
  'netherlands': 'NED', 'scotland': 'SCO', 'nepal': 'NEP',
  'oman': 'OMN', 'namibia': 'NAM', 'usa': 'USA', 'canada': 'CAN',
  'united states': 'USA', 'united arab emirates': 'UAE',
  'papua new guinea': 'PNG', 'hong kong': 'HK', 'kenya': 'KEN',
  // BBL
  'sydney sixers': 'SIX', 'sydney thunder': 'THU',
  'melbourne stars': 'STA', 'melbourne renegades': 'REN',
  'perth scorchers': 'SCO', 'brisbane heat': 'HEA',
  'hobart hurricanes': 'HUR', 'adelaide strikers': 'STR',
  // PSL
  'karachi kings': 'KAR', 'lahore qalandars': 'LAH',
  'islamabad united': 'ISL', 'peshawar zalmi': 'PES',
  'quetta gladiators': 'QUE', 'multan sultans': 'MUL',
  // CPL
  'trinbago knight riders': 'TKR', 'jamaica tallawahs': 'JAM',
  'barbados royals': 'BR', 'guyana amazon warriors': 'GAW',
  'st lucia kings': 'SLK',
  // SA20
  'mi cape town': 'MICT', 'durban super giants': 'DSG',
  'joburg super kings': 'JSK', 'paarl royals': 'PR',
  'pretoria capitals': 'PC', 'sunrisers eastern cape': 'SEC',
  // SA domestic
  'warriors': 'WAR', 'titans': 'TIT', 'lions': 'LIO',
  'dolphins': 'DOL', 'knights': 'KNI', 'cape cobras': 'COB',
  'north west dragons': 'NWD', 'north west': 'NWD',
  // The Hundred
  'oval invincibles': 'OI', 'trent rockets': 'TR',
  'southern brave': 'SB', 'birmingham phoenix': 'BP',
  'manchester originals': 'MO', 'london spirit': 'LS',
  'welsh fire': 'WF', 'northern superchargers': 'NS',
  // ILT20
  'gulf giants': 'GG', 'dubai capitals': 'DUB',
  'mi emirates': 'MIE', 'abu dhabi knight riders': 'ADKR',
  'desert vipers': 'DV', 'sharjah warriorz': 'SW',
};

// Determine text color based on bg brightness
function textForBg(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140 ? '#000' : '#fff';
}

export function getTeamByName(name) {
  const n = (name || '').toLowerCase();

  // 1. Try IPL teams first (exact match)
  const ipl = Object.values(IPL_TEAMS).find(t =>
    n.includes(t.name.toLowerCase()) || n.includes(t.short.toLowerCase())
  );
  if (ipl) return ipl;

  // 2. Try full name lookup
  if (NAME_TO_CODE[n] && GLOBAL_COLORS[NAME_TO_CODE[n]]) {
    const color = GLOBAL_COLORS[NAME_TO_CODE[n]];
    return { name, short: NAME_TO_CODE[n], color, bg: color, text: textForBg(color) };
  }

  // 3. Try code from GLOBAL_COLORS directly
  const upper = (name || '').trim().toUpperCase();
  if (GLOBAL_COLORS[upper]) {
    const color = GLOBAL_COLORS[upper];
    return { name, short: upper, color, bg: color, text: textForBg(color) };
  }

  // 4. Try partial name match
  for (const [key, code] of Object.entries(NAME_TO_CODE)) {
    if (n.includes(key) || key.includes(n)) {
      const color = GLOBAL_COLORS[code];
      if (color) return { name, short: code, color, bg: color, text: textForBg(color) };
    }
  }

  // 5. Yellow-green default for unknown teams
  return { name, short: name?.slice(0, 3)?.toUpperCase() || '???', ...DEFAULT_TEAM };
}

// Quick lookup by team code (for frontend use when API color is missing/gray)
export function getTeamColor(code) {
  return GLOBAL_COLORS[code?.toUpperCase()] || DEFAULT_COLOR;
}

// Cricket-specific bet market names
export const CRICKET_MARKETS = {
  match_winner: 'Match Winner',
  top_batsman: 'Top Batsman',
  top_bowler: 'Top Bowler',
  total_runs_ou: 'Total Runs O/U',
  first_innings: 'First Innings Score',
  match_fours: 'Match Fours',
  match_sixes: 'Match Sixes',
  toss_winner: 'Toss Winner',
  motm: 'Man of the Match',
  highest_partnership: 'Highest Partnership',
  first_wicket: 'Fall of 1st Wicket',
};
