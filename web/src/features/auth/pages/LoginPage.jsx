import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { SparkleIcon, GiftIcon } from '../../../shared/components/Icons';

// Country codes with phone format info
// digits = expected digit count (local number), placeholder = formatted example
const COUNTRIES = [
  { code: '+91',  flag: '🇮🇳', name: 'India',        digits: 10, placeholder: '98765 43210',  format: [5, 5] },
  { code: '+92',  flag: '🇵🇰', name: 'Pakistan',      digits: 10, placeholder: '(312) 345 6789', format: [3, 3, 4] },
  { code: '+94',  flag: '🇱🇰', name: 'Sri Lanka',     digits: 9,  placeholder: '(71) 234 5678',  format: [2, 3, 4] },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh',    digits: 10, placeholder: '(1712) 345678',  format: [4, 6] },
  { code: '+977', flag: '🇳🇵', name: 'Nepal',         digits: 10, placeholder: '(9812) 345678',  format: [4, 6] },
  { code: '+93',  flag: '🇦🇫', name: 'Afghanistan',   digits: 9,  placeholder: '(70) 123 4567',  format: [2, 3, 4] },
  { code: '+971', flag: '🇦🇪', name: 'UAE',           digits: 9,  placeholder: '(50) 123 4567',  format: [2, 3, 4] },
  { code: '+44',  flag: '🇬🇧', name: 'UK',            digits: 10, placeholder: '(7911) 123456',  format: [4, 6] },
  { code: '+1',   flag: '🇺🇸', name: 'USA',           digits: 10, placeholder: '(555) 123-4567', format: [3, 3, 4] },
  { code: '+61',  flag: '🇦🇺', name: 'Australia',     digits: 9,  placeholder: '(412) 345 678',  format: [3, 3, 3] },
  { code: '+27',  flag: '🇿🇦', name: 'South Africa',  digits: 9,  placeholder: '(71) 234 5678',  format: [2, 3, 4] },
  { code: '+64',  flag: '🇳🇿', name: 'New Zealand',   digits: 9,  placeholder: '(21) 234 5678',  format: [2, 3, 4] },
  { code: '+263', flag: '🇿🇼', name: 'Zimbabwe',      digits: 9,  placeholder: '(71) 234 5678',  format: [2, 3, 4] },
];

// Auto-detect country from browser language
function detectCountryCode() {
  const lang = (navigator.language || navigator.userLanguage || '').toLowerCase();
  if (lang.startsWith('hi') || lang.includes('-in')) return '+91';   // Hindi / en-IN
  if (lang.startsWith('ur') || lang.includes('-pk')) return '+92';   // Urdu / en-PK
  if (lang.startsWith('bn') || lang.includes('-bd')) return '+880';  // Bengali / en-BD
  if (lang.startsWith('si') || lang.includes('-lk')) return '+94';   // Sinhala / en-LK
  if (lang.startsWith('ne') || lang.includes('-np')) return '+977';  // Nepali
  if (lang.startsWith('ps') || lang.includes('-af')) return '+93';   // Pashto / Afghan
  if (lang.includes('-ae')) return '+971';                           // en-AE
  if (lang.includes('-gb') || lang === 'en-gb') return '+44';       // en-GB
  if (lang.includes('-au')) return '+61';                            // en-AU
  if (lang.includes('-za')) return '+27';                            // en-ZA
  if (lang.includes('-nz')) return '+64';                            // en-NZ
  if (lang.includes('-us') || lang === 'en') return '+1';           // en-US / plain en
  return '+91'; // default India
}

// Format phone digits according to country format pattern
// Parentheses on first group only if it's a short operator/area code (≤4 digits)
function formatPhone(digits, format) {
  const useParens = format[0] <= 4;
  let result = '';
  let pos = 0;
  for (let i = 0; i < format.length && pos < digits.length; i++) {
    const chunk = digits.slice(pos, pos + format[i]);
    if (i === 0 && useParens) {
      const complete = chunk.length === format[i];
      result = complete ? `(${chunk})` : `(${chunk}`;
    } else {
      result += (result ? ' ' : '') + chunk;
    }
    pos += format[i];
  }
  if (pos < digits.length) result += ' ' + digits.slice(pos);
  return result;
}

// Fake recent winners for social proof ticker
const RECENT_WINNERS = [
  { name: 'Rahul', amount: '+₹2,400' },
  { name: 'Priya', amount: '+₹890' },
  { name: 'Amit', amount: '+₹5,100' },
  { name: 'Sneha', amount: '+₹1,350' },
  { name: 'Vikram', amount: '+₹3,200' },
  { name: 'Ananya', amount: '+₹760' },
  { name: 'Arjun', amount: '+₹4,500' },
  { name: 'Deepak', amount: '+₹1,800' },
];

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, register, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();

  // Already logged in — redirect to home
  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);
  const refCode = searchParams.get('ref') || '';

  const [isRegister, setIsRegister] = useState(true); // default to register
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState(() => detectCountryCode());
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const pickerRef = useRef(null);

  // Close country picker on outside click
  useEffect(() => {
    function handleClick(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowCountryPicker(false);
      }
    }
    if (showCountryPicker) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showCountryPicker]);

  const currentCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Validation
    const digits = phone.replace(/\D/g, '');
    if (!digits || digits.length < 5) return setError(t('auth.phoneRequired'));
    if (password.length < 6) return setError(t('auth.passwordMinLength'));
    if (isRegister && !name.trim()) return setError(t('auth.nameRequired'));

    setLoading(true);
    try {
      if (isRegister) {
        await register(digits, password, name, countryCode, refCode || null);
        navigate('/onboarding', { replace: true });
      } else {
        await login(digits, password, countryCode);
        navigate('/', { replace: true });
      }
    } catch (err) {
      // Map backend error codes to user-friendly translated messages
      const detail = err?.detail || err?.message || '';
      const errorMap = {
        'phone_already_registered': t('auth.phoneAlreadyTaken'),
        'invalid_credentials': t('auth.invalidCredentials'),
        'password_too_short': t('auth.passwordTooShort'),
        'password_needs_letter': t('auth.passwordNeedsLetter'),
        'password_needs_digit': t('auth.passwordNeedsDigit'),
      };
      const mapped = errorMap[detail];
      if (mapped) {
        setError(mapped);
      } else if (detail.includes('429') || detail.includes('rate') || detail.includes('Too Many')) {
        setError(t('auth.tooManyAttempts'));
      } else {
        setError(isRegister ? t('auth.registerError') : t('auth.loginError'));
      }
      console.error('Auth error:', detail);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#0B1E4D] via-[#162D6B] to-[#0B1E4D] flex flex-col">
      {/* Hero section */}
      <div className="flex flex-col items-center pt-10 pb-6 px-6">
        {/* Cricket ball */}
        <div className="relative mb-4">
          <svg className="w-14 h-14" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="44" fill="#C0392B" />
            <circle cx="50" cy="50" r="44" stroke="#A93226" strokeWidth="2" />
            <path d="M30 15c5 12 5 25 0 35s-5 25 0 35" stroke="#FFE0D0" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M70 15c-5 12-5 25 0 35s5 25 0 35" stroke="#FFE0D0" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M32 20l-4 3M31 28l-5 2M30 36l-5 1M31 44l-5-1M32 52l-5-2M33 60l-4-3" stroke="#FFE0D0" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M68 20l4 3M69 28l5 2M70 36l5 1M69 44l5-1M68 52l5-2M67 60l4-3" stroke="#FFE0D0" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 w-14 h-14 bg-[#FF9933]/20 rounded-full blur-xl" />
        </div>

        <h1 className="text-xl font-black text-white tracking-tight">
          {t('auth.heroTitle')}
        </h1>
        <p className="text-blue-200/50 text-xs mt-1">{t('auth.heroSubtitle')}</p>

        {/* Stats badges */}
        <div className="flex items-center gap-2 mt-4">
          <div className="flex items-center gap-1 bg-white/10 rounded-full px-2.5 py-1">
            <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-[10px] text-white/80 font-medium">{t('auth.statPicks')}</span>
          </div>
          <div className="flex items-center gap-1 bg-white/10 rounded-full px-2.5 py-1">
            <SparkleIcon className="w-2.5 h-2.5 text-[#FF9933]" />
            <span className="text-[10px] text-white/80 font-medium">{t('auth.statAccuracy')}</span>
          </div>
          <div className="flex items-center gap-1 bg-white/10 rounded-full px-2.5 py-1">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            <span className="text-[10px] text-white/80 font-medium">{t('auth.statOnline')}</span>
          </div>
        </div>

        {/* Recent winners ticker */}
        <div className="mt-3 w-full overflow-hidden">
          <div className="flex gap-4 animate-marquee">
            {[...RECENT_WINNERS, ...RECENT_WINNERS].map((w, i) => (
              <div key={i} className="flex items-center gap-1.5 shrink-0">
                <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-[10px] text-white/60 whitespace-nowrap">{w.name}</span>
                <span className="text-[10px] text-emerald-400 font-semibold whitespace-nowrap">{w.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-t-3xl px-6 pt-6 pb-6">
        {/* Referral invite badge */}
        {refCode && isRegister && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2">
            <GiftIcon className="w-5 h-5 text-[#FF9933]" />
            <p className="text-sm text-emerald-700 font-medium">{t('auth.invitedBy', { code: refCode })}</p>
          </div>
        )}
        {/* Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1 mb-5">
          <button
            onClick={() => { setIsRegister(false); setError(''); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              !isRegister ? 'bg-white dark:bg-gray-600 text-[#0B1E4D] dark:text-white shadow-sm' : 'text-gray-400'
            }`}
          >
            {t('auth.login')}
          </button>
          <button
            onClick={() => { setIsRegister(true); setError(''); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              isRegister ? 'bg-white dark:bg-gray-600 text-[#0B1E4D] dark:text-white shadow-sm' : 'text-gray-400'
            }`}
          >
            {t('auth.register')}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name (register only) */}
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.name')}</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('auth.namePlaceholder')}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933]/30 focus:border-[#FF9933] transition-all"
                />
              </div>
            </div>
          )}

          {/* Phone with country code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.phone')}</label>
            <div className="flex gap-2">
              {/* Country code picker */}
              <div className="relative" ref={pickerRef}>
                <button
                  type="button"
                  onClick={() => setShowCountryPicker(!showCountryPicker)}
                  className="flex items-center gap-1 h-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm hover:bg-gray-100 transition-colors min-w-[85px]"
                >
                  <span className="text-base">{currentCountry.flag}</span>
                  <span className="text-sm font-medium text-gray-700">{countryCode}</span>
                  <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showCountryPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {/* Dropdown */}
                {showCountryPicker && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                    {COUNTRIES.map(c => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => { setCountryCode(c.code); setPhone(''); setShowCountryPicker(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                          countryCode === c.code ? 'bg-[#FF9933]/5' : ''
                        }`}
                      >
                        <span className="text-lg">{c.flag}</span>
                        <span className="text-sm text-gray-700 flex-1">{c.name}</span>
                        <span className="text-xs text-gray-400 font-mono">{c.code}</span>
                        {countryCode === c.code && (
                          <svg className="w-4 h-4 text-[#FF9933]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Phone input with formatting */}
              <input
                type="tel"
                value={phone}
                onChange={e => {
                  const raw = e.target.value.replace(/\D/g, '');
                  const limited = raw.slice(0, currentCountry.digits || 15);
                  setPhone(formatPhone(limited, currentCountry.format));
                }}
                placeholder={currentCountry.placeholder}
                autoComplete="tel"
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933]/30 focus:border-[#FF9933] transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.password')}</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933]/30 focus:border-[#FF9933] transition-all"
              />
              {/* Toggle password visibility */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-[#FF9933] to-[#FF8800] text-white font-bold rounded-xl text-sm shadow-lg shadow-[#FF9933]/30 active:scale-[0.98] transition-all disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isRegister ? t('auth.registerButton') : t('auth.loginButton')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Perks */}
        {isRegister && (
          <p className="text-center text-[11px] text-gray-400 mt-3">
            {t('auth.freeNote')}
          </p>
        )}

        {/* Switch link */}
        <p className="text-center text-sm text-gray-400 mt-5">
          {isRegister ? t('auth.hasAccount') : t('auth.noAccount')}{' '}
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-[#FF9933] font-semibold"
          >
            {isRegister ? t('auth.login') : t('auth.register')}
          </button>
        </p>

        {/* Responsible gaming footer */}
        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <svg className="w-3.5 h-3.5 text-[#138808]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <span className="text-[10px] text-[#138808] font-medium">{t('app.responsibleGaming')}</span>
          </div>
          <p className="text-[9px] text-gray-400">{t('app.disclaimer')}</p>
        </div>
      </div>

      {/* Marquee animation style */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
