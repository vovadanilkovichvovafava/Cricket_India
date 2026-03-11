import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BottomNav from '../../../shared/components/BottomNav';

const CATEGORIES = ['all', 'batting', 'bowling', 'fielding', 'betting'];

// Glossary terms with category
const TERMS = [
  // Batting
  { key: 'six', cat: 'batting' },
  { key: 'four', cat: 'batting' },
  { key: 'century', cat: 'batting' },
  { key: 'halfCentury', cat: 'batting' },
  { key: 'duck', cat: 'batting' },
  { key: 'goldenDuck', cat: 'batting' },
  { key: 'strikeRate', cat: 'batting' },
  { key: 'battingAverage', cat: 'batting' },
  { key: 'powerplay', cat: 'batting' },
  { key: 'deathOvers', cat: 'batting' },
  { key: 'superOver', cat: 'batting' },
  { key: 'runRate', cat: 'batting' },
  { key: 'nrr', cat: 'batting' },
  // Bowling
  { key: 'wicket', cat: 'bowling' },
  { key: 'over', cat: 'bowling' },
  { key: 'maiden', cat: 'bowling' },
  { key: 'economyRate', cat: 'bowling' },
  { key: 'bowlingAverage', cat: 'bowling' },
  { key: 'wide', cat: 'bowling' },
  { key: 'noBall', cat: 'bowling' },
  { key: 'yorker', cat: 'bowling' },
  { key: 'bouncer', cat: 'bowling' },
  { key: 'googly', cat: 'bowling' },
  { key: 'hattrick', cat: 'bowling' },
  // Fielding
  { key: 'lbw', cat: 'fielding' },
  { key: 'caught', cat: 'fielding' },
  { key: 'runOut', cat: 'fielding' },
  { key: 'stumped', cat: 'fielding' },
  { key: 'drs', cat: 'fielding' },
  { key: 'extras', cat: 'fielding' },
  // Betting markets
  { key: 'matchWinner', cat: 'betting' },
  { key: 'topBatsman', cat: 'betting' },
  { key: 'topBowler', cat: 'betting' },
  { key: 'totalRuns', cat: 'betting' },
  { key: 'firstInningsScore', cat: 'betting' },
  { key: 'tossWinner', cat: 'betting' },
  { key: 'manOfMatch', cat: 'betting' },
  { key: 'valueBet', cat: 'betting' },
  { key: 'accumulator', cat: 'betting' },
  { key: 'impliedProbability', cat: 'betting' },
];

export default function CricketGlossary() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [expanded, setExpanded] = useState(null);

  const filteredTerms = useMemo(() => {
    return TERMS.filter(term => {
      if (category !== 'all' && term.cat !== category) return false;
      if (search) {
        const termName = t(`tools.glossary.terms.${term.key}.name`).toLowerCase();
        return termName.includes(search.toLowerCase());
      }
      return true;
    });
  }, [search, category, t]);

  const catColors = {
    batting: 'bg-blue-100 text-blue-700',
    bowling: 'bg-red-100 text-red-700',
    fielding: 'bg-green-100 text-green-700',
    betting: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="min-h-dvh bg-[#F0F2F5]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0B1E4D] to-[#162D6B] px-5 pt-6 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/settings')}
            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center active:scale-95 transition-transform">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{t('tools.glossary.title')}</h1>
            <p className="text-blue-200/60 text-xs">{t('tools.glossary.subtitle')}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('tools.glossary.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-white/10 text-white placeholder-blue-200/40 rounded-xl text-sm outline-none focus:bg-white/15 transition-colors"
          />
        </div>
      </div>

      <div className="px-5 -mt-1 pb-6">
        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                category === cat
                  ? 'bg-[#FF9933] text-white'
                  : 'bg-white text-gray-500 shadow-sm'
              }`}
            >
              {t(`tools.glossary.categories.${cat}`)}
            </button>
          ))}
        </div>

        {/* Count */}
        <p className="text-xs text-gray-400 mb-3">
          {filteredTerms.length} {t('tools.glossary.termsCount')}
        </p>

        {/* Terms list */}
        <div className="space-y-2">
          {filteredTerms.map(term => {
            const isExpanded = expanded === term.key;
            return (
              <button
                key={term.key}
                onClick={() => setExpanded(isExpanded ? null : term.key)}
                className="w-full text-left bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden transition-all"
              >
                <div className="flex items-center gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {t(`tools.glossary.terms.${term.key}.name`)}
                    </p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${catColors[term.cat]}`}>
                    {t(`tools.glossary.categories.${term.cat}`)}
                  </span>
                  <svg className={`w-4 h-4 text-gray-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {t(`tools.glossary.terms.${term.key}.desc`)}
                      </p>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {filteredTerms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">{t('tools.glossary.noResults')}</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
