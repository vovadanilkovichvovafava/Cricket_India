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

export function getTeamByName(name) {
  const n = (name || '').toLowerCase();
  return Object.values(IPL_TEAMS).find(t =>
    n.includes(t.name.toLowerCase()) || n.includes(t.short.toLowerCase())
  ) || { name, short: name?.slice(0, 3)?.toUpperCase() || '???', color: '#6B7280', bg: '#6B7280', text: '#fff' };
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
