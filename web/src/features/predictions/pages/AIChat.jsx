import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePremium } from '../../../shared/context/PremiumContext';
import api from '../../../shared/api';
import { parseMarkdown, formatInline } from '../../../shared/utils/parseMarkdown';
import { ChatBotIcon, LockIcon, SparkleIcon, ShieldCheckIcon, FireIcon, LightningIcon, TargetIcon } from '../../../shared/components/Icons';
import BetPromoHook from '../../../shared/components/BetPromoHook';

// --- Follow-up suggestions ---
function generateFollowUps(userMessage) {
  const lower = userMessage.toLowerCase();
  if (lower.includes('csk') || lower.includes('chennai'))
    return ['CSK key players', 'CSK vs MI odds', 'CSK home record'];
  if (lower.includes('mi') || lower.includes('mumbai'))
    return ['MI batting lineup', 'MI bowling analysis', 'MI away record'];
  if (lower.includes('value') || lower.includes('bet'))
    return ['Explain value betting', "Today's best odds", 'Kelly calculator'];
  if (lower.includes('batsman') || lower.includes('batter'))
    return ['Orange Cap predictions', 'Best strike rates', 'Power-play batsmen'];
  return ['Best value bets today', 'Upcoming match preview', 'Top batsman picks'];
}

// --- Inline markdown rendering ---
function InlineText({ text }) {
  const parts = formatInline(text);
  return (
    <>
      {parts.map((p, i) => {
        if (p.type === 'bold') return <strong key={i} className="font-semibold">{p.content}</strong>;
        if (p.type === 'italic') return <em key={i}>{p.content}</em>;
        return <span key={i}>{p.content}</span>;
      })}
    </>
  );
}

function MessageContent({ text, isUser }) {
  if (isUser) return <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>;

  const blocks = parseMarkdown(text);
  return (
    <div className="space-y-1.5">
      {blocks.map((block, i) => {
        if (block.type === 'break') return <div key={i} className="h-1" />;
        if (block.type === 'ul') {
          return (
            <ul key={i} className="space-y-1 ml-1">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2 text-sm leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-gray-300" />
                  <span><InlineText text={item} /></span>
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === 'ol') {
          return (
            <ol key={i} className="space-y-1 ml-1">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2 text-sm leading-relaxed">
                  <span className="text-[11px] font-bold mt-0.5 shrink-0 text-gray-400">{j + 1}.</span>
                  <span><InlineText text={item} /></span>
                </li>
              ))}
            </ol>
          );
        }
        return <p key={i} className="text-sm leading-relaxed"><InlineText text={block.content} /></p>;
      })}
    </div>
  );
}

// --- Risk styling helper ---
function riskStyle(risk) {
  if (risk === 'Low') return { bg: 'bg-green-100', text: 'text-green-700', glow: '#22c55e', Icon: ShieldCheckIcon };
  if (risk === 'High') return { bg: 'bg-red-100', text: 'text-red-700', glow: '#ef4444', Icon: FireIcon };
  return { bg: 'bg-yellow-100', text: 'text-yellow-700', glow: '#FF9933', Icon: LightningIcon };
}

// --- Value Bet Cards (same design as MatchDetail) ---
function ValueBetCards({ bets, onBetClick }) {
  if (!bets || bets.length === 0) return null;

  const gradients = [
    'from-[#0B1E4D] via-[#1a3a7a] to-[#0d2b5e]',
    'from-[#1a1a2e] via-[#2d1b4e] to-[#1a1a2e]',
    'from-[#0f3460] via-[#1a5276] to-[#0f3460]',
  ];

  // Normalize bet fields (backend returns selection/reasoning, frontend expects pick/value)
  const normalized = bets.map(b => ({
    market: b.market,
    pick: b.pick || b.selection,
    odds: b.odds,
    risk: b.risk || 'Medium',
    value: b.value || b.reasoning || '',
    confidence: typeof b.confidence === 'number'
      ? (b.confidence >= 0.7 ? 'High' : b.confidence >= 0.5 ? 'Medium' : 'Low')
      : (b.confidence || 'Medium'),
  }));

  return (
    <div className="space-y-2.5 mt-3">
      <div className="flex items-center gap-1.5 px-0.5">
        <TargetIcon className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">AI Recommended Bets</span>
      </div>
      {normalized.map((bet, i) => {
        const rc = riskStyle(bet.risk);
        return (
          <div
            key={i}
            onClick={onBetClick}
            className={`block bg-gradient-to-r ${gradients[i % 3]} rounded-xl p-3.5 shadow-lg active:scale-[0.98] transition-transform overflow-hidden relative cursor-pointer`}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent -skew-x-12"
              style={{ animation: `shimmer ${2 + i * 0.3}s ease-in-out infinite` }} />
            {/* Glow */}
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20"
              style={{ background: `radial-gradient(circle, ${rc.glow} 0%, transparent 70%)` }} />

            <div className="relative z-10">
              {/* Market + Risk */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] text-white/50 font-medium uppercase tracking-wider">{bet.market}</span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-0.5 ${rc.bg} ${rc.text}`}>
                  <rc.Icon className="w-2.5 h-2.5" /> {bet.risk}
                </span>
              </div>

              {/* Pick + Odds */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold text-white">{bet.pick}</span>
                <span className="text-lg font-black text-[#FF9933] tracking-tight">@{bet.odds}</span>
              </div>

              {/* Confidence bar */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${(bet.confidence === 'High' ? 82 : bet.confidence === 'Medium' ? 58 : 35)}%`,
                      background: 'linear-gradient(90deg, #FF9933, #138808)',
                    }} />
                </div>
                <span className="text-[9px] font-bold text-white/70">{bet.confidence}</span>
              </div>

              {/* Reasoning */}
              {bet.value && <p className="text-[10px] text-white/40 leading-relaxed mb-2">{bet.value}</p>}

              {/* CTA */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-white/30">Tap to place bet</span>
                <div className="flex items-center gap-1 bg-[#FF9933] px-2.5 py-1 rounded-lg">
                  <span className="text-[10px] font-bold text-white">Bet Now</span>
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// No fallback bets — only real AI-generated bets from Claude API

// BetPromoHook imported from shared component

// --- Main AIChat ---
export default function AIChat() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { canUseAI, useAIRequest, isPro } = usePremium();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const fallbackResponses = useMemo(() => ({
    default: t('aiChat.fallback.default'),
    csk: t('aiChat.fallback.csk'),
    mi: t('aiChat.fallback.mi'),
    value: t('aiChat.fallback.value'),
    batsman: t('aiChat.fallback.batsman'),
  }), [t]);

  function getFallbackResponse(message) {
    const lower = message.toLowerCase();
    if (lower.includes('csk') || lower.includes('chennai')) return fallbackResponses.csk;
    if (lower.includes('mi') || lower.includes('mumbai')) return fallbackResponses.mi;
    if (lower.includes('value') || lower.includes('bet')) return fallbackResponses.value;
    if (lower.includes('batsman') || lower.includes('batter') || lower.includes('runs')) return fallbackResponses.batsman;
    return fallbackResponses.default;
  }

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Welcome message
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: t('aiChat.welcomeMessage'),
    }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  async function sendMessage(text) {
    if (!text.trim() || isTyping) return;

    // Check AI request limit (client-side fast check)
    if (!canUseAI()) {
      setShowUpgradeModal(true);
      return;
    }

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setShowQuick(false);
    setIsTyping(true);

    // Count this request (client-side, synced with backend)
    useAIRequest();

    try {
      const response = await api.chat({ message: text.trim() });
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.message || response.response || response.content || 'I received your message but could not generate a proper response.',
        hasData: true,
        suggestions: response.follow_ups || generateFollowUps(text),
        valueBets: response.value_bets || [],
      }]);
    } catch (err) {
      console.error('AI Chat error:', err);

      // Backend rate limit → show upgrade modal
      if (err.status === 429) {
        setShowUpgradeModal(true);
        setMessages(prev => prev.filter(m => m.id !== userMessage.id)); // Remove user msg
      } else {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'assistant',
          content: getFallbackResponse(text),
          suggestions: generateFollowUps(text),
          valueBets: [],
        }]);
      }
    } finally {
      setIsTyping(false);
    }
  }

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: t('aiChat.welcomeMessage'),
    }]);
    setShowQuick(true);
  };

  return (
    <div className="flex flex-col" style={{ height: '100dvh' }}>
      {/* Upgrade Modal — limit reached */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0 animate-fade-in" onClick={() => setShowUpgradeModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Top gradient banner */}
            <div className="bg-gradient-to-br from-[#0B1E4D] via-[#162D6B] to-[#1a3a7a] px-6 pt-7 pb-6 text-center relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 bg-[#FF9933] blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full opacity-10 bg-[#138808] blur-xl" />
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/10">
                <LockIcon className="w-8 h-8 text-white/90" />
              </div>
              <h3 className="text-xl font-black text-white">{t('premium.limitReached')}</h3>
              <p className="text-sm text-white/60 mt-2 leading-relaxed">{t('premium.limitReachedDesc')}</p>
            </div>

            <div className="p-5 space-y-3">
              {/* Option 1: Get Pro — big CTA */}
              <button
                onClick={() => { setShowUpgradeModal(false); navigate('/pro'); }}
                className="block w-full p-4 bg-gradient-to-r from-[#FF9933] to-[#FF8800] rounded-xl active:scale-[0.98] transition-transform shadow-lg shadow-orange-200/50 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <SparkleIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-[15px] font-bold text-white">{t('premium.getProNow')}</p>
                    <p className="text-[11px] text-white/70 mt-0.5">{t('premium.getProDesc')}</p>
                  </div>
                  <svg className="w-5 h-5 text-white/70 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
                {/* Pro features list */}
                <div className="mt-3 pt-3 border-t border-white/20 flex flex-wrap gap-x-4 gap-y-1">
                  {['proFeature1', 'proFeature2', 'proFeature3'].map(key => (
                    <div key={key} className="flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-white/80" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[11px] text-white/80">{t(`premium.${key}`)}</span>
                    </div>
                  ))}
                </div>
              </button>

              {/* Option 2: Wait for reset */}
              <div className="flex items-center gap-3 p-3.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('premium.waitForReset')}</p>
                  <p className="text-[11px] text-gray-400">{t('premium.resetsIn24h')}</p>
                </div>
              </div>

              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-2.5 text-gray-400 text-sm font-medium"
              >
                {t('common.close', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header — clean white like football */}
      <div className="bg-white dark:bg-gray-800 px-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 shrink-0 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="w-8 h-8 bg-[#0B1E4D] rounded-lg flex items-center justify-center">
            <ChatBotIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white leading-none">{t('aiChat.title')}</h1>
            <p className="text-[10px] text-green-500 font-medium">{t('aiChat.online')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clearChat} className="w-8 h-8 flex items-center justify-center text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4 dark:bg-gray-900">
        {messages.map(msg => (
          <div key={msg.id}>
            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#0B1E4D] text-white rounded-tr-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm shadow-sm'
              }`}>
                {/* Data badge */}
                {msg.hasData && msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-medium flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      AI Analysis
                    </span>
                  </div>
                )}
                <MessageContent text={msg.content} isUser={msg.role === 'user'} />
              </div>
            </div>
            {/* Value Bet Cards */}
            {msg.role === 'assistant' && msg.valueBets && msg.valueBets.length > 0 && !isTyping && (
              <div className="mt-2 max-w-[92%]">
                <ValueBetCards bets={msg.valueBets} onBetClick={() => navigate('/offer')} />
              </div>
            )}
            {/* Bet Promo Hook — after value bets, non-pro only */}
            {msg.role === 'assistant' && msg.valueBets && msg.valueBets.length > 0 && !isTyping && !isPro && (
              <div className="mt-2 max-w-[95%]">
                <BetPromoHook
                  matchContext={msg.content?.match(/(?:CSK|MI|RCB|KKR|DC|SRH|RR|PBKS|LSG|GT)\s*(?:vs?\.?\s*)(?:CSK|MI|RCB|KKR|DC|SRH|RR|PBKS|LSG|GT)/i)?.[0] || null}
                  confidence={msg.valueBets?.[0]?.confidence ? parseInt(msg.valueBets[0].confidence) : null}
                  onCtaClick={() => navigate('/offer')}
                />
              </div>
            )}
            {/* Follow-up chips — hidden when limit reached */}
            {msg.role === 'assistant' && msg.suggestions && msg.id !== 'welcome' && !isTyping && canUseAI() && (
              <div className="flex flex-wrap gap-2 mt-2 ml-1">
                {msg.suggestions.map(s => (
                  <button key={s} onClick={() => sendMessage(s)}
                    className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                Analyzing...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick questions — hidden when limit reached */}
      {showQuick && messages.length <= 1 && canUseAI() && (
        <div className="px-5 pb-2 shrink-0">
          <p className="text-xs text-gray-400 mb-2">{t('aiChat.tryAsking')}</p>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => navigate('/offer')}
              className="flex-1 text-sm px-3 py-2.5 rounded-xl font-medium bg-[#FF9933] text-white flex items-center justify-center gap-1.5"
            >
              🎁 {t('betHook.freeBetButton')}
            </button>
            <button
              onClick={() => sendMessage(t('aiChat.suggestions.bestValueBets'))}
              disabled={isTyping}
              className="flex-1 text-sm px-3 py-2.5 rounded-xl font-medium disabled:opacity-50 bg-[#0B1E4D] text-white"
            >
              {t('aiChat.suggestions.bestValueBets')}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              t('aiChat.suggestions.topBatsman'),
              t('aiChat.suggestions.whichTeam'),
              t('aiChat.suggestions.darkHorses'),
            ].map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={isTyping}
                className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom area: input OR limit-reached banner */}
      {!canUseAI() ? (
        /* Limit reached — replace input with upgrade banner */
        <div className="px-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shrink-0 py-3"
          style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="w-full flex items-center gap-3 bg-gradient-to-r from-[#0B1E4D] to-[#1a3a7a] rounded-xl px-4 py-3 active:scale-[0.98] transition-transform"
          >
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
              <LockIcon className="w-4 h-4 text-white/70" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-bold text-white">{t('premium.limitReached')}</p>
              <p className="text-[10px] text-white/50">{t('premium.tapToUpgrade', 'Tap to get Pro or wait for daily reset')}</p>
            </div>
            <div className="bg-[#FF9933] px-3 py-1.5 rounded-lg shrink-0">
              <span className="text-[11px] font-bold text-white">{t('premium.getPro')}</span>
            </div>
          </button>
        </div>
      ) : (
        /* Normal input — compact like Telegram */
        <div className="px-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shrink-0 py-2.5"
          style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isTyping && sendMessage(input)}
              placeholder={t('aiChat.inputPlaceholder')}
              className="flex-1 bg-gray-50 dark:bg-gray-700 dark:text-white rounded-full px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#FF9933]/30"
              disabled={isTyping}
              autoComplete="off"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={isTyping || !input.trim()}
              className="w-10 h-10 bg-[#FF9933] text-white rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 active:scale-95 transition-transform"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
