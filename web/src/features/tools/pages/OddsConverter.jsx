import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BottomNav from '../../../shared/components/BottomNav';

// Conversion functions
function decimalToFractional(dec) {
  if (dec <= 1) return '0/1';
  const num = dec - 1;
  // Find closest simple fraction
  for (let d = 1; d <= 100; d++) {
    const n = Math.round(num * d);
    if (Math.abs(n / d - num) < 0.005) return `${n}/${d}`;
  }
  return `${Math.round(num * 100)}/100`;
}

function decimalToAmerican(dec) {
  if (dec <= 1) return 0;
  if (dec >= 2) return Math.round((dec - 1) * 100);
  return Math.round(-100 / (dec - 1));
}

function decimalToImplied(dec) {
  if (dec <= 0) return 0;
  return (1 / dec) * 100;
}

function americanToDecimal(am) {
  if (am > 0) return am / 100 + 1;
  if (am < 0) return 100 / Math.abs(am) + 1;
  return 0;
}

function impliedToDecimal(pct) {
  if (pct <= 0 || pct >= 100) return 0;
  return 100 / pct;
}

function fractionalToDecimal(frac) {
  const parts = frac.split('/');
  if (parts.length !== 2) return 0;
  const num = parseFloat(parts[0]);
  const den = parseFloat(parts[1]);
  if (!den) return 0;
  return num / den + 1;
}

export default function OddsConverter() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [activeField, setActiveField] = useState('decimal');
  const [decimal, setDecimal] = useState('1.85');
  const [fractional, setFractional] = useState('17/20');
  const [american, setAmerican] = useState('-118');
  const [implied, setImplied] = useState('54.05');

  function updateFromDecimal(val) {
    const dec = parseFloat(val);
    if (!dec || dec <= 1) return;
    setDecimal(val);
    setFractional(decimalToFractional(dec));
    setAmerican(String(decimalToAmerican(dec)));
    setImplied(decimalToImplied(dec).toFixed(2));
  }

  function updateFromAmerican(val) {
    setAmerican(val);
    const am = parseFloat(val);
    if (!am) return;
    const dec = americanToDecimal(am);
    setDecimal(dec.toFixed(2));
    setFractional(decimalToFractional(dec));
    setImplied(decimalToImplied(dec).toFixed(2));
  }

  function updateFromImplied(val) {
    setImplied(val);
    const pct = parseFloat(val);
    if (!pct) return;
    const dec = impliedToDecimal(pct);
    setDecimal(dec.toFixed(2));
    setFractional(decimalToFractional(dec));
    setAmerican(String(decimalToAmerican(dec)));
  }

  function updateFromFractional(val) {
    setFractional(val);
    const dec = fractionalToDecimal(val);
    if (!dec || dec <= 1) return;
    setDecimal(dec.toFixed(2));
    setAmerican(String(decimalToAmerican(dec)));
    setImplied(decimalToImplied(dec).toFixed(2));
  }

  const fields = [
    { key: 'decimal', label: t('tools.odds.decimal'), value: decimal, onChange: updateFromDecimal, placeholder: '1.85', type: 'number' },
    { key: 'fractional', label: t('tools.odds.fractional'), value: fractional, onChange: updateFromFractional, placeholder: '17/20', type: 'text' },
    { key: 'american', label: t('tools.odds.american'), value: american, onChange: updateFromAmerican, placeholder: '-118', type: 'number' },
    { key: 'implied', label: t('tools.odds.implied'), value: implied, onChange: updateFromImplied, placeholder: '54.05', suffix: '%', type: 'number' },
  ];

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
            <h1 className="text-xl font-bold text-white">{t('tools.odds.title')}</h1>
            <p className="text-blue-200/60 text-xs">{t('tools.odds.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-3 pb-6 space-y-3">
        {fields.map(field => (
          <div key={field.key}
            className={`bg-white rounded-2xl shadow-sm p-4 transition-all ${
              activeField === field.key ? 'ring-2 ring-[#FF9933]/30' : ''
            }`}>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{field.label}</label>
            <div className="relative">
              <input
                type={field.type}
                step={field.type === 'number' ? '0.01' : undefined}
                value={field.value}
                onFocus={() => setActiveField(field.key)}
                onChange={e => field.onChange(e.target.value)}
                className="w-full text-2xl font-bold text-[#0B1E4D] bg-transparent border-none outline-none p-0"
                placeholder={field.placeholder}
              />
              {field.suffix && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-lg text-gray-400">{field.suffix}</span>
              )}
            </div>
          </div>
        ))}

        {/* Quick examples */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('tools.odds.quickExamples')}</h3>
          <div className="space-y-2">
            {[
              { label: 'CSK to win', odds: '1.85' },
              { label: 'MI to win', odds: '2.10' },
              { label: 'Draw/Tie', odds: '6.00' },
            ].map(ex => (
              <button
                key={ex.odds}
                onClick={() => updateFromDecimal(ex.odds)}
                className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl active:bg-gray-100 transition-colors"
              >
                <span className="text-sm text-gray-600">{ex.label}</span>
                <span className="text-sm font-bold text-[#FF9933]">{ex.odds}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
