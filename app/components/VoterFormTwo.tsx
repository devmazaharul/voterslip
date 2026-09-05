'use client';

import axios from 'axios';
import React, {
  useState,
  useRef,
  useEffect,
  FormEvent,
  ChangeEvent,
} from 'react';
import {
  Search, User, MapPin, Calendar, Loader2, AlertCircle,
  Sparkles, Heart, Fingerprint, Building2, Clock,
  BadgeCheck, ChevronDown, Globe, CheckCircle2, X,
  ArrowRight, Copy, Check, Database, Wifi, List,
  Shield, Hash, Users, CloudOff, ServerCrash, Coffee,
} from 'lucide-react';
import { VillageOption, VILLAGES_NEW } from '../api/newvoter/utils';

interface VoterInfo {
  _id: string;
  name: string;
  dateOfBirth: string;
  serialNumber: number;
  voterNumber: number;
  village: string;
  motherName: string;
  fatherOrHusbandName: string;
  pollingCenter: string;
  addedBy: 'system' | 'self';
}

interface ApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  total: number;
  data: VoterInfo[];
  source?: string;
  db?: { total: number; newSaved: number; existing: number };
  timestamp?: string;
}

const API_URL = '/api/newvoter';

// ═══════════════════════════════════════════
// ফানি CLIENT-SIDE MESSAGES 😎
// ═══════════════════════════════════════════
const FUN_MSG = {
  NO_VILLAGE: 'আগে গ্রাম সিলেক্ট করো ভাই! গ্রাম ছাড়া ভোটার খুঁজবো কোথায়, মঙ্গল গ্রহে? 🪐',
  BAD_DOB: 'তারিখটা ঠিকমতো দাও ভাই! DD/MM/YYYY — এত কঠিন? 🤦‍♂️',
  NETWORK_DEAD: 'ইন্টারনেট কি ঘুমাচ্ছে নাকি? 😴 WiFi চেক করো ভাই!',
  UNKNOWN_ERROR: 'কী হইলো বুঝলাম না! 🤯 আবার চেষ্টা করো, এইবার হয়তো হবে!',
  LOADING_TEXTS: [
    'ভোটার খুঁজছি... ওরা কোথায় লুকাইছে? 🔍',
    'ডাটাবেস ঘেঁটে দেখছি... একটু সবুর করো! ⏳',
    'সার্ভারকে জিজ্ঞেস করছি... সে ভাবছে... 🤔',
    'খুঁজছি খুঁজছি... হারিয়ে যায়নি তো? 🕵️',
  ],
  EMPTY_RESULTS: [
    'খালি হাতে ফিরলাম! 🤷‍♂️ এই তথ্যে কেউ নাই ভাই!',
    'ভোটার পাওয়া যায়নি! ভুল তারিখ দিওনি তো? 🧐',
    'কেউ নাই, কেউ নাই! শুনশান! 🦗 তথ্য চেক করো!',
  ],
} as const;

const getRandomItem = <T,>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════
const bangDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
const toBanglaDigits = (v: string | number): string =>
  String(v).replace(/[0-9]/g, d => bangDigits[Number(d)]);

const formatDateInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return digits.slice(0,2) + '/' + digits.slice(2);
  return digits.slice(0,2) + '/' + digits.slice(2,4) + '/' + digits.slice(4);
};

const convertToBanglaDOB = (dob: string): string => toBanglaDigits(dob);

const BANGLA_MONTHS = [
  'জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল',
  'মে','জুন','জুলাই','আগস্ট',
  'সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর',
];

const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '';
  let day: number, month: number, year: number;
  if (dateStr.includes('/')) {
    const p = dateStr.split('/');
    day = parseInt(p[0]); month = parseInt(p[1]); year = parseInt(p[2]);
  } else {
    const d = new Date(dateStr);
    day = d.getUTCDate(); month = d.getUTCMonth()+1; year = d.getUTCFullYear();
  }
  if (isNaN(day)||isNaN(month)||isNaN(year)) return dateStr;
  return `${toBanglaDigits(day)} ${BANGLA_MONTHS[month-1]} ${toBanglaDigits(year)}`;
};

const useCopy = () => {
  const [copied, setCopied] = useState<string|null>(null);
  const copy = (text: string|number, id: string) => {
    navigator.clipboard.writeText(String(text));
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };
  return { copied, copy };
};

// ═══════════════════════════════════════════
// ERROR TYPE DETECTION — কোন ধরনের error?
// ═══════════════════════════════════════════
type ErrorType = 'validation' | 'network' | 'server' | 'notfound' | 'general';

const detectErrorType = (msg: string): ErrorType => {
  const lower = msg.toLowerCase();
  if (lower.includes('dob') || lower.includes('ward') || lower.includes('জন্মতারিখ') || lower.includes('গ্রাম') || lower.includes('ফরম্যাট'))
    return 'validation';
  if (lower.includes('ঘুমে') || lower.includes('timeout') || lower.includes('নেটওয়ার্ক') || lower.includes('wifi') || lower.includes('ইন্টারনেট') || lower.includes('সাড়া'))
    return 'network';
  if (lower.includes('সার্ভার') || lower.includes('মাথা গরম') || lower.includes('চা') || lower.includes('server'))
    return 'server';
  if (lower.includes('পাওয়া যায়নি') || lower.includes('খুঁজে') || lower.includes('নাই'))
    return 'notfound';
  return 'general';
};

// ═══════════════════════════════════════════
// CONSISTENT COLOR SYSTEM
// primary = indigo, neutral = slate, success = emerald,
// caution = amber, danger/critical = rose
// ═══════════════════════════════════════════
const errorConfig: Record<ErrorType, {
  icon: React.ReactNode;
  bg: string;
  border: string;
  iconBg: string;
  textColor: string;
  label: string;
}> = {
  validation: {
    icon: <AlertCircle className="w-4 h-4" />,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
    textColor: 'text-amber-700',
    label: 'ভুল তথ্য 🤦‍♂️',
  },
  network: {
    icon: <CloudOff className="w-4 h-4" />,
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    iconBg: 'bg-slate-100',
    textColor: 'text-slate-600',
    label: 'কানেকশন সমস্যা 📡',
  },
  server: {
    icon: <ServerCrash className="w-4 h-4" />,
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    iconBg: 'bg-rose-100',
    textColor: 'text-rose-700',
    label: 'সার্ভার সমস্যা 🔥',
  },
  notfound: {
    icon: <Search className="w-4 h-4" />,
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    iconBg: 'bg-indigo-100',
    textColor: 'text-indigo-700',
    label: 'খুঁজে পাইনি 🤷‍♂️',
  },
  general: {
    icon: <AlertCircle className="w-4 h-4" />,
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    iconBg: 'bg-rose-100',
    textColor: 'text-rose-700',
    label: 'ত্রুটি ⚠️',
  },
};

// ═══════════════════════════════════════════
// ERROR DISPLAY COMPONENT
// ═══════════════════════════════════════════
const FunError: React.FC<{
  message: string;
  onClose: () => void;
}> = ({ message, onClose }) => {
  const type = detectErrorType(message);
  const config = errorConfig[type];

  return (
    <div className={`mt-4 relative overflow-hidden rounded-xl ${config.bg} border ${config.border} shadow-2xl shadow-gray-100 animate-[shake_0.4s_ease]`}>
      {/* Top colored line */}
      <div className={`h-[3px] w-full ${
        type === 'validation' ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400/0' :
        type === 'network' ? 'bg-gradient-to-r from-slate-400 via-slate-300 to-slate-400/0' :
        type === 'server' ? 'bg-gradient-to-r from-rose-400 via-rose-300 to-rose-400/0' :
        type === 'notfound' ? 'bg-gradient-to-r from-indigo-400 via-indigo-300 to-indigo-400/0' :
        'bg-gradient-to-r from-rose-400 via-rose-300 to-rose-400/0'
      }`} />

      <div className="px-3.5 py-3 flex items-start gap-3">
        {/* Icon */}
        <div className={`w-8 h-8 rounded-lg ${config.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
          <span className={config.textColor}>{config.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-[9px] font-bold uppercase tracking-widest ${config.textColor} opacity-80 mb-1`}>
            {config.label}
          </p>
          <p className={`text-[11px] font-medium ${config.textColor} leading-relaxed`}>
            {message}
          </p>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className={`p-1 rounded-md hover:bg-black/[0.04] transition-colors cursor-pointer shrink-0 mt-0.5`}
        >
          <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
// BACKGROUND
// ═══════════════════════════════════════════
const BG = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden">
    <div className="absolute -top-[35%] -left-[25%] w-[70%] h-[70%] rounded-full bg-indigo-200/25 blur-[140px]" />
    <div className="absolute -bottom-[35%] -right-[25%] w-[70%] h-[70%] rounded-full bg-indigo-200/20 blur-[140px]" />
    <div className="absolute top-[30%] right-[5%] w-[30%] h-[30%] rounded-full bg-indigo-100/25 blur-[100px]" />
    <div
      className="absolute inset-0 opacity-[0.4]"
      style={{
        backgroundImage: `radial-gradient(rgba(79,70,229,0.06) 1px, transparent 1px)`,
        backgroundSize: '44px 44px',
      }}
    />
    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-300/40 to-transparent" />
  </div>
);

// ═══════════════════════════════════════════
// CUSTOM SELECT
// ═══════════════════════════════════════════
const CustomSelect: React.FC<{
  value: string;
  onChange: (val: string) => void;
  options: VillageOption[];
}> = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.id === value);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer ${
          open
            ? 'bg-indigo-50 border border-indigo-300 ring-2 ring-indigo-100'
            : value
              ? 'bg-indigo-50/60 border border-indigo-200'
              : 'bg-slate-50 border border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
          value ? 'bg-indigo-100' : 'bg-slate-100'
        }`}>
          <MapPin className={`w-3.5 h-3.5 ${value ? 'text-indigo-600' : 'text-slate-400'}`} />
        </div>
        <span className={`flex-1 text-[13px] truncate ${
          selected ? 'font-semibold text-slate-900' : 'text-slate-400'
        }`}>
          {selected ? selected.name : 'গ্রাম নির্বাচন করুন'}
        </span>
        {value && (
          <button type="button"
            onClick={e => { e.stopPropagation(); onChange(''); }}
            className="p-0.5 rounded hover:bg-black/[0.05] cursor-pointer"
          >
            <X className="w-3 h-3 text-slate-400 hover:text-rose-500 transition-colors" />
          </button>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
          open ? 'rotate-180 text-indigo-600' : ''
        }`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-300/40 overflow-hidden animate-[drop_0.15s_ease]">
            <div className="max-h-52 overflow-y-auto py-1 px-1 scrl">
              {options.map((opt, i) => {
                const sel = opt.id === value;
                return (
                  <button key={opt.id} type="button"
                    onClick={() => { onChange(opt.id); setOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all cursor-pointer mb-px ${
                      sel ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center shrink-0 ${
                      sel ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {sel ? <Check className="w-3 h-3" /> : toBanglaDigits(i + 1)}
                    </span>
                    <span className="text-[12px] font-medium truncate flex-1">{opt.name}</span>
                    {sel && <BadgeCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50/70">
              <p className="text-[9px] text-slate-400 text-center font-medium">
                মোট <span className="text-indigo-600 font-semibold">{toBanglaDigits(options.length)}</span> টি
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════
// STEPS
// ═══════════════════════════════════════════
const Steps: React.FC<{ s1: boolean; s2: boolean }> = ({ s1, s2 }) => (
  <div className="flex items-center gap-0 mb-5">
    {[
      { done: s1, label: 'গ্রাম', n: '১' },
      { done: s2, label: 'তারিখ', n: '২' },
      { done: s1 && s2, label: 'খুঁজুন', n: '৩' },
    ].map((s, i, a) => (
      <React.Fragment key={i}>
        <div className="flex items-center gap-1.5">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-300 ${
            s.done
              ? 'bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200'
              : i === 0 || a[i-1]?.done
                ? 'bg-indigo-100 text-indigo-600 ring-1 ring-indigo-200'
                : 'bg-slate-100 text-slate-400'
          }`}>
            {s.done ? <Check className="w-3 h-3" /> : s.n}
          </div>
          <span className={`text-[9px] font-semibold transition-colors ${
            s.done ? 'text-emerald-600' : 'text-slate-400'
          }`}>
            {s.label}
          </span>
        </div>
        {i < 2 && (
          <div className="flex-1 mx-3 h-px bg-slate-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${
              s.done ? 'w-full bg-emerald-400' : 'w-0'
            }`} />
          </div>
        )}
      </React.Fragment>
    ))}
  </div>
);

// ═══════════════════════════════════════════
// VOTER CARD
// ═══════════════════════════════════════════
const VoterCard: React.FC<{ voter: VoterInfo; index: number }> = ({ voter, index }) => {
  const { copied, copy } = useCopy();

  return (
    <div
      className="group rounded-xl bg-white border border-slate-50 hover:border-indigo-300 shadow-2xl shadow-gray-100 hover:shadow-md transition-all duration-300 overflow-hidden"
      style={{
        animationDelay: `${index * 80}ms`,
        animation: 'reveal 0.4s ease forwards',
        opacity: 0,
      }}
    >
      <div className="h-[3px] w-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-400/0" />

      <div className="px-4 pt-3.5 pb-2.5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-sm font-bold text-indigo-700 shrink-0 group-hover:scale-105 transition-transform duration-300">
          {voter.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-bold text-slate-900 truncate leading-tight">{voter.name}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[8px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-[2px] rounded border border-indigo-100">
              📍 {voter.village}
            </span>
            <span className={`text-[7px] font-bold px-1.5 py-[2px] rounded uppercase tracking-wider ${
              voter.addedBy === 'system'
                ? 'text-amber-700 bg-amber-50 border border-amber-100'
                : 'text-emerald-700 bg-emerald-50 border border-emerald-100'
            }`}>
              {voter.addedBy}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-4 mb-3">
        <div className="relative overflow-hidden flex items-center gap-3 px-3 py-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100">
          <div className="absolute left-0 top-1 bottom-1 w-[2px] bg-indigo-400 rounded-full" />
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
            <Fingerprint className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0 pl-0.5">
            <p className="text-[7px] font-bold text-slate-500 uppercase tracking-[0.15em]">ভোটার নম্বর</p>
            <p className="text-[14px] font-mono font-bold text-slate-900 tracking-wider mt-px">
              {toBanglaDigits(voter.voterNumber)}
            </p>
          </div>
          <button
            onClick={() => copy(voter.voterNumber, `nid-${voter._id}`)}
            className="p-1.5 rounded-md hover:bg-indigo-100 transition-all cursor-pointer active:scale-90"
          >
            {copied === `nid-${voter._id}` ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-600 transition-colors" />
            )}
          </button>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'সিরিয়াল', value: toBanglaDigits(voter.serialNumber), icon: <Hash className="w-3 h-3" />, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
            { label: 'জন্ম তারিখ', value: formatDisplayDate(voter.dateOfBirth), icon: <Clock className="w-3 h-3" />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', mono: true },
            { label: 'পিতা/স্বামী', value: voter.fatherOrHusbandName, icon: <User className="w-3 h-3" />, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
            { label: 'মাতা', value: voter.motherName, icon: <Heart className="w-3 h-3" />, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
          ].map(item => (
            <div key={item.label}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg ${item.bg} border ${item.border} hover:border-slate-300 transition-all group/i`}
            >
              <div className={`w-6 h-6 rounded-md bg-white/70 flex items-center justify-center shrink-0 group-hover/i:scale-110 transition-transform`}>
                <span className={item.color}>{item.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</p>
                <p className={`text-[11px] font-semibold text-slate-900 truncate mt-px ${item.mono ? 'font-mono' : ''}`}>
                  {item.value || '—'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {voter.pollingCenter && (
        <div className="mx-4 mb-3">
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-emerald-50 border border-emerald-100">
            <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center shrink-0">
              <Building2 className="w-3 h-3 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">ভোটকেন্দ্র</p>
              <p className="text-[11px] font-semibold text-emerald-700 truncate mt-px">{voter.pollingCenter}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SourceBadge: React.FC<{ source: string | null }> = ({ source }) => {
  if (!source) return null;
  const isDB = source === 'database';
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-md border ${
      isDB
        ? 'text-indigo-700 bg-indigo-50 border-indigo-200'
        : 'text-slate-600 bg-slate-50 border-slate-200'
    }`}>
      {isDB ? <Database className="w-2.5 h-2.5" /> : <Wifi className="w-2.5 h-2.5" />}
      {isDB ? 'ক্যাশ' : 'API'}
    </span>
  );
};

// ═══════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════
const VoterFormTwo: React.FC = () => {
  const [wardId, setWardId] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<VoterInfo[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState('');

  // ── Rotate loading text ──
  useEffect(() => {
    if (!loading) return;
    setLoadingText(getRandomItem(FUN_MSG.LOADING_TEXTS));
    const interval = setInterval(() => {
      setLoadingText(getRandomItem(FUN_MSG.LOADING_TEXTS));
    }, 2500);
    return () => clearInterval(interval);
  }, [loading]);

  const handleDobChange = (e: ChangeEvent<HTMLInputElement>) =>
    setDob(formatDateInput(e.target.value));
  const isDobValid = /^\d{2}\/\d{2}\/\d{4}$/.test(dob);
  const canSubmit = !loading && isDobValid && wardId !== '';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setResults([]); setSearched(false); setDataSource(null);

    // ── Client-side fun validation ──
    if (!wardId) return setError(FUN_MSG.NO_VILLAGE);
    if (!isDobValid) return setError(FUN_MSG.BAD_DOB);

    setLoading(true);
    try {
      const { data } = await axios.post<ApiResponse>(API_URL, {
        DOB: convertToBanglaDOB(dob), Ward: wardId,
      });
      setSearched(true);
      setDataSource(data.source || null);
      if (data.success) {
        setResults(data.data || []);
        // ── Backend fun message পাস করো ──
        if (!data.data?.length) setError(data.message || getRandomItem(FUN_MSG.EMPTY_RESULTS));
      } else {
        // ── Backend এর ফানি message সরাসরি দেখাও ──
        setError(data.message || 'কিছু একটা হইলো ভাই! 🤔');
      }
    } catch (err: unknown) {
      setSearched(true);
      if (axios.isAxiosError(err)) {
        // ── Backend থেকে আসা ফানি message দেখাও ──
        const serverMsg = err.response?.data?.message;
        setError(serverMsg || FUN_MSG.NETWORK_DEAD);
      } else {
        setError(FUN_MSG.UNKNOWN_ERROR);
      }
    } finally { setLoading(false); }
  };

  const reset = () => {
    setWardId(''); setDob(''); setResults([]);
    setSearched(false); setError(''); setDataSource(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50/40 text-slate-900 relative">
      <BG />

      <div className="relative z-10 min-h-screen flex items-start justify-center px-3 py-6 sm:px-4 sm:py-8">
        <div className="w-full max-w-xl">

          {/* ═══ HEADER ═══ */}
          <div className="mb-5">
            <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-2xl shadow-gray-100">
              <div className="relative px-5 py-5 sm:px-6 sm:py-6">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/70 to-transparent" />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative rounded-full h-1.5 w-1.5 bg-emerald-500" />
                      </span>
                      <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-[0.15em]">
                        যশোর সদর — সক্রিয়
                      </span>
                    </div>
                    <div>
                      <h1 className="text-[22px] sm:text-[26px] font-black tracking-tight leading-tight">
                        <span className="text-slate-900">ভোটার তথ্য </span>
                        <span className="bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
                          অনুসন্ধান
                        </span>
                      </h1>
                      <p className="text-[11px] text-slate-500 mt-1.5 font-medium max-w-xs">
                        গ্রাম ও জন্ম তারিখ দিয়ে ভোটকেন্দ্রসহ সকল তথ্য দেখুন
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block shrink-0 mt-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-[9px] font-semibold border border-slate-200">
                      <MapPin className="w-3 h-3 text-indigo-600" />
                      ১৪ নং নরেন্দ্রপুর
                    </span>
                  </div>
                </div>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
            </div>
          </div>

          {/* ═══ FORM ═══ */}
          <div className="bg-white border border-slate-100 shadow-2xl shadow-gray-100 rounded-xl p-4 sm:p-5 mb-5">
            <Steps s1={!!wardId} s2={isDobValid} />

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Village */}
              <div>
                <label className="flex items-center gap-1.5 text-[9px] font-semibold text-slate-500 uppercase tracking-widest mb-2 pl-0.5">
                  <MapPin className="w-3 h-3 text-indigo-500" />
                  ধাপ ১: গ্রাম
                </label>
                <CustomSelect value={wardId} onChange={setWardId} options={VILLAGES_NEW} />
                {wardId && (
                  <p className="mt-1.5 text-[9px] text-slate-500 pl-0.5 flex items-center gap-1 animate-[fadeIn_0.2s]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    গ্রাম: <span className="font-mono font-semibold text-emerald-600">{wardId}</span>
                  </p>
                )}
              </div>

              {/* DOB */}
              <div>
                <label htmlFor="dob"
                  className="flex items-center gap-1.5 text-[9px] font-semibold text-slate-500 uppercase tracking-widest mb-2 pl-0.5"
                >
                  <Calendar className="w-3 h-3 text-indigo-500" />
                  ধাপ ২: জন্ম তারিখ
                </label>
                <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-200 ${
                  isDobValid
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-slate-50 border-slate-200 focus-within:border-indigo-300 focus-within:bg-indigo-50/50 focus-within:ring-2 focus-within:ring-indigo-100'
                }`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isDobValid ? 'bg-emerald-100' : 'bg-slate-100'
                  }`}>
                    <Calendar className={`w-3.5 h-3.5 ${
                      isDobValid ? 'text-emerald-600' : dob ? 'text-indigo-500' : 'text-slate-400'
                    }`} />
                  </div>
                  <input
                    id="dob" type="text" inputMode="numeric"
                    value={dob} onChange={handleDobChange}
                    placeholder="DD/MM/YYYY" autoComplete="off"
                    className="flex-1 bg-transparent text-[13px] font-semibold text-slate-900 placeholder:text-slate-300 focus:outline-none font-mono tracking-widest"
                  />
                  {isDobValid && (
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center animate-[pop_0.25s_ease]">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                  )}
                </div>
                <p className="mt-1.5 text-[9px] text-slate-500 pl-0.5 flex items-center gap-1">
                  <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                  {isDobValid ? (
                    <>বাংলায়: <span className="font-mono font-semibold text-indigo-600">{convertToBanglaDOB(dob)}</span></>
                  ) : (
                    <>উদাহরণ: <span className="font-mono text-slate-400">01/01/2001</span></>
                  )}
                </p>
              </div>

              {/* Submit */}
              <button type="submit" disabled={!canSubmit}
                className={`w-full py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer active:scale-[0.98] overflow-hidden relative group/btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 ${
                  !canSubmit
                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200'
                    : 'bg-indigo-600 text-white border border-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/25'
                }`}
              >
                {canSubmit && !loading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.15] to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                )}
                <span className="relative flex items-center gap-2">
                  {loading ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> অনুসন্ধান চলছে...</>
                  ) : (
                    <><Search className="w-3.5 h-3.5" /> তথ্য খুঁজুন</>
                  )}
                </span>
              </button>
            </form>

            {/* ═══ FUN ERROR DISPLAY ═══ */}
            {error && <FunError message={error} onClose={() => setError('')} />}
          </div>

          {/* ═══ TAGS ═══ */}
          {(wardId || dob) && (
            <div className="flex flex-wrap items-center gap-1.5 mb-4 px-1 animate-[fadeIn_0.2s]">
              <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-widest mr-1">ফিল্টার:</span>
              {wardId && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-[9px] font-medium text-indigo-700">
                  <MapPin className="w-2.5 h-2.5" />{wardId}
                </span>
              )}
              {dob && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-[9px] font-mono font-medium text-indigo-700">
                  <Calendar className="w-2.5 h-2.5" />{dob}
                  {isDobValid && <Check className="w-2.5 h-2.5 text-emerald-500" />}
                </span>
              )}
              {searched && results.length > 0 && (
                <button onClick={reset}
                  className="ml-auto text-[9px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md border border-slate-200 cursor-pointer transition-all"
                >
                  রিসেট
                </button>
              )}
            </div>
          )}

          {/* ═══ RESULTS ═══ */}
          <div className="bg-white border border-slate-100 shadow-2xl shadow-gray-100  rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  searched && results.length > 0
                    ? 'bg-emerald-50 border border-emerald-100'
                    : 'bg-slate-50 border border-slate-200'
                }`}>
                  <Users className={`w-4 h-4 ${
                    searched && results.length > 0 ? 'text-emerald-500' : 'text-slate-300'
                  }`} />
                </div>
                <div>
                  <h2 className="text-[13px] font-bold text-slate-800">ফলাফল</h2>
                  <p className="text-[9px] text-slate-400 font-medium mt-px">
                    {searched && results.length > 0
                      ? `🎉 ${toBanglaDigits(results.length)} জন ধরা পড়েছে!`
                      : 'ফলাফল এখানে দেখুন'}
                  </p>
                </div>
              </div>
              {searched && results.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <SourceBadge source={dataSource} />
                  <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    {toBanglaDigits(results.length)} জন
                  </span>
                </div>
              )}
            </div>

            <div className="p-4">
              {/* Empty */}
              {!searched && !loading && (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-3">
                    <Search className="w-6 h-6 text-indigo-300" />
                  </div>
                  <p className="text-[12px] font-semibold text-slate-500 mb-1">ভোটার খুঁজতে চাও? 🤔</p>
                  <p className="text-[10px] text-slate-400">গ্রাম সিলেক্ট করো, জন্ম তারিখ দাও, ব্যাস! 🚀</p>
                  <div className="flex items-center justify-center gap-3 mt-4 text-[9px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-emerald-400" /> নিরাপদ</span>
                    <span className="text-slate-200">·</span>
                    <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-indigo-400" /> ঝটপট</span>
                  </div>
                </div>
              )}

              {/* ═══ FUN LOADING ═══ */}
              {loading && (
                <div className="text-center py-12">
                  <div className="relative w-14 h-14 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full border border-slate-200" />
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                    <div className="absolute inset-2.5 rounded-full border border-indigo-300 border-b-transparent animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-[12px] font-semibold text-slate-600 animate-pulse">
                    {loadingText}
                  </p>
                  <p className="text-[9px] text-slate-400 mt-1.5">ধৈর্য ধরো ভাই... ⏳</p>
                </div>
              )}

              {/* Results */}
              {searched && !loading && results.length > 0 && (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-0.5 scrl">
                  {results.map((voter, i) => (
                    <VoterCard key={voter._id || voter.voterNumber || i} voter={voter} index={i} />
                  ))}
                </div>
              )}

              {/* ═══ FUN NO RESULTS ═══ */}
              {searched && !loading && results.length === 0 && !error && (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🤷‍♂️</span>
                  </div>
                  <p className="text-[12px] font-semibold text-slate-600 mb-1">
                    {getRandomItem(FUN_MSG.EMPTY_RESULTS)}
                  </p>
                  <p className="text-[10px] text-slate-400 mb-4">
                    তারিখ বা গ্রাম ভুল হলে ঠিক করে আবার চেষ্টা করো!
                  </p>
                  <button onClick={reset}
                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-100 cursor-pointer transition-all inline-flex items-center gap-1.5"
                  >
                    <ArrowRight className="w-3 h-3 rotate-180" />
                    আবার চেষ্টা করো ভাই! 💪
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
              {/* MazaSoft Branding */}
              <p className="text-[9px] text-slate-400">
                <span>না ঘুমিয়ে, না খেয়ে বানানো - </span>
                <a
                  href="https://bymaza.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 text-[10px] hover:text-indigo-700 transition-colors font-medium"
                >
                  মাজহারুল
                </a>
              </p>
            </div>
          </div>

        </div>
      </div>

      <style jsx>{`
        @keyframes drop {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes reveal {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pop {
          0% { opacity: 0; transform: scale(0.5); }
          70% { transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          15% { transform: translateX(-5px); }
          30% { transform: translateX(5px); }
          45% { transform: translateX(-3px); }
          60% { transform: translateX(3px); }
          75% { transform: translateX(-2px); }
          90% { transform: translateX(1px); }
        }
        .scrl::-webkit-scrollbar { width: 3px; }
        .scrl::-webkit-scrollbar-track { background: transparent; }
        .scrl::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.25); border-radius: 3px; }
        .scrl::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.4); }
      `}</style>
    </div>
  );
};

export default VoterFormTwo;