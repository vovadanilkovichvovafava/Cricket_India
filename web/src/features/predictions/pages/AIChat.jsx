import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../shared/api';
import { parseMarkdown, formatInline } from '../../../shared/utils/parseMarkdown';
import { ChatBotIcon } from '../../../shared/components/Icons';

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

// --- Main AIChat ---
export default function AIChat() {
  const navigate = useNavigate();
  const { t } = useTranslation();

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

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setShowQuick(false);
    setIsTyping(true);

    try {
      const response = await api.chat({ message: text.trim() });
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.message || response.response || response.content || 'I received your message but could not generate a proper response.',
        hasData: true,
        suggestions: response.follow_ups || generateFollowUps(text),
      }]);
    } catch {
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: getFallbackResponse(text),
        suggestions: generateFollowUps(text),
      }]);
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
      {/* Header — clean white like football */}
      <div className="bg-white px-4 flex items-center justify-between border-b border-gray-100 shrink-0 py-3">
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
            <h1 className="font-bold text-gray-900 leading-none">{t('aiChat.title')}</h1>
            <p className="text-[10px] text-green-500 font-medium">{t('aiChat.online')}</p>
          </div>
        </div>
        <button onClick={clearChat} className="w-8 h-8 flex items-center justify-center text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id}>
            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#0B1E4D] text-white rounded-tr-sm'
                  : 'bg-white text-gray-800 rounded-tl-sm shadow-sm'
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
            {/* Follow-up chips */}
            {msg.role === 'assistant' && msg.suggestions && msg.id !== 'welcome' && !isTyping && (
              <div className="flex flex-wrap gap-2 mt-2 ml-1">
                {msg.suggestions.map(s => (
                  <button key={s} onClick={() => sendMessage(s)}
                    className="bg-white text-gray-700 text-sm px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm">
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

      {/* Quick questions */}
      {showQuick && messages.length <= 1 && (
        <div className="px-5 pb-2 shrink-0">
          <p className="text-xs text-gray-400 mb-2">{t('aiChat.tryAsking')}</p>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => sendMessage(t('aiChat.suggestions.analyzeCSKvsMI'))}
              disabled={isTyping}
              className="flex-1 text-sm px-3 py-2.5 rounded-xl font-medium disabled:opacity-50 bg-[#0B1E4D] text-white"
            >
              {t('aiChat.suggestions.analyzeCSKvsMI')}
            </button>
            <button
              onClick={() => sendMessage(t('aiChat.suggestions.bestValueBets'))}
              disabled={isTyping}
              className="flex-1 text-sm px-3 py-2.5 rounded-xl font-medium disabled:opacity-50 bg-[#FF9933] text-white"
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
                className="bg-white text-gray-700 text-sm px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input — compact like Telegram */}
      <div className="px-4 bg-white border-t border-gray-100 shrink-0 py-2.5"
        style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isTyping && sendMessage(input)}
            placeholder={t('aiChat.inputPlaceholder')}
            className="flex-1 bg-gray-50 rounded-full px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#FF9933]/30"
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
    </div>
  );
}
