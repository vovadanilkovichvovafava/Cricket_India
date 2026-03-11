import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import api from '../api';

// Simple markdown: **bold**, *italic*, bullet lists
function formatText(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

export default function SupportChat() {
  const { t } = useTranslation();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(true);
  const messagesEnd = useRef(null);
  const inputRef = useRef(null);

  // Hide on login/onboarding pages
  const hiddenPaths = ['/login', '/onboarding'];
  if (hiddenPaths.includes(location.pathname)) return null;

  const scrollToBottom = () => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, open]);

  // Stop pulse after first open
  useEffect(() => {
    if (open) setPulse(false);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const quickQuestions = [
    { key: 'howApp', label: t('support.quick.howApp') },
    { key: 'whatOdds', label: t('support.quick.whatOdds') },
    { key: 'howKelly', label: t('support.quick.howKelly') },
    { key: 'whatValueBet', label: t('support.quick.whatValueBet') },
  ];

  async function sendMessage(text) {
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await api.supportChat({ message: text.trim() });
      const reply = data.response || data.message || t('support.fallback');
      setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: t('support.fallback') }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleQuickQuestion(q) {
    sendMessage(q.label);
  }

  return (
    <>
      {/* Floating bubble — bottom-left, above BottomNav */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-[88px] left-4 z-30 w-14 h-14 bg-gradient-to-br from-[#0B1E4D] to-[#1a3a7a] text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-transform"
          aria-label={t('support.title')}
        >
          {/* Headset icon */}
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-.707.707M6.343 5.636l.707.707M3 12a9 9 0 1118 0M3 12v4a2 2 0 002 2h1a1 1 0 001-1v-3a1 1 0 00-1-1H5m14 0h-1a1 1 0 00-1 1v3a1 1 0 001 1h1a2 2 0 002-2v-4" />
          </svg>
          {/* Pulse ring */}
          {pulse && (
            <span className="absolute inset-0 rounded-full border-2 border-[#FF9933] animate-ping opacity-40" />
          )}
        </button>
      )}

      {/* Chat drawer — slides up from bottom */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

          {/* Chat panel */}
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl flex flex-col animate-slide-up"
               style={{ maxHeight: '85dvh', height: '85dvh' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#0B1E4D] to-[#1a3a7a] rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-.707.707M6.343 5.636l.707.707M3 12a9 9 0 1118 0M3 12v4a2 2 0 002 2h1a1 1 0 001-1v-3a1 1 0 00-1-1H5m14 0h-1a1 1 0 00-1 1v3a1 1 0 001 1h1a2 2 0 002-2v-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('support.title')}</h3>
                  <p className="text-[11px] text-green-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                    {t('support.online')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {/* Welcome message */}
              {messages.length === 0 && (
                <div className="space-y-4">
                  {/* Welcome bubble */}
                  <div className="flex gap-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-[#0B1E4D] to-[#1a3a7a] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-.707.707M6.343 5.636l.707.707M3 12a9 9 0 1118 0M3 12v4a2 2 0 002 2h1a1 1 0 001-1v-3a1 1 0 00-1-1H5m14 0h-1a1 1 0 00-1 1v3a1 1 0 001 1h1a2 2 0 002-2v-4" />
                      </svg>
                    </div>
                    <div className="bg-gray-50 rounded-2xl rounded-tl-md px-3.5 py-2.5 max-w-[85%]">
                      <p className="text-sm text-gray-800 leading-relaxed">{t('support.welcome')}</p>
                    </div>
                  </div>

                  {/* Quick questions */}
                  <div className="pl-9">
                    <p className="text-[11px] text-gray-400 mb-2 font-medium">{t('support.quickQuestionsLabel')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {quickQuestions.map(q => (
                        <button
                          key={q.key}
                          onClick={() => handleQuickQuestion(q)}
                          className="text-xs bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full hover:bg-[#FF9933]/5 hover:border-[#FF9933]/30 hover:text-[#FF9933] transition-colors active:scale-95"
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Chat messages */}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'gap-2'}`}>
                  {msg.role === 'ai' && (
                    <div className="w-7 h-7 bg-gradient-to-br from-[#0B1E4D] to-[#1a3a7a] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-.707.707M6.343 5.636l.707.707M3 12a9 9 0 1118 0M3 12v4a2 2 0 002 2h1a1 1 0 001-1v-3a1 1 0 00-1-1H5m14 0h-1a1 1 0 00-1 1v3a1 1 0 001 1h1a2 2 0 002-2v-4" />
                      </svg>
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 max-w-[85%] ${
                      msg.role === 'user'
                        ? 'bg-[#0B1E4D] text-white rounded-tr-md'
                        : 'bg-gray-50 text-gray-800 rounded-tl-md'
                    }`}
                  >
                    <p
                      className="text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
                    />
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-[#0B1E4D] to-[#1a3a7a] rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-.707.707M6.343 5.636l.707.707M3 12a9 9 0 1118 0M3 12v4a2 2 0 002 2h1a1 1 0 001-1v-3a1 1 0 00-1-1H5m14 0h-1a1 1 0 00-1 1v3a1 1 0 001 1h1a2 2 0 002-2v-4" />
                    </svg>
                  </div>
                  <div className="bg-gray-50 rounded-2xl rounded-tl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEnd} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 shrink-0 safe-bottom">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={t('support.placeholder')}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B1E4D]/20"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="w-10 h-10 bg-[#0B1E4D] text-white rounded-full flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-up animation */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
