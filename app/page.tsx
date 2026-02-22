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
  Shield, Hash, Users,
} from 'lucide-react';
import { VillageOption, VILLAGES_NEW } from './api/newvoter/utils';

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
// BACKGROUND
// ═══════════════════════════════════════════
const BG = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden">
    <div className="absolute -top-[35%] -left-[25%] w-[70%] h-[70%] rounded-full bg-indigo-600/[0.04] blur-[140px]" />
    <div className="absolute -bottom-[35%] -right-[25%] w-[70%] h-[70%] rounded-full bg-violet-600/[0.035] blur-[140px]" />
    <div className="absolute top-[30%] right-[5%] w-[30%] h-[30%] rounded-full bg-sky-600/[0.025] blur-[100px]" />
    <div
      className="absolute inset-0 opacity-[0.012]"
      style={{
        backgroundImage: `radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)`,
        backgroundSize: '44px 44px',
      }}
    />
    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/15 to-transparent" />
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
            ? 'bg-indigo-500/[0.06] border border-indigo-500/20 ring-1 ring-indigo-500/10'
            : value
              ? 'bg-indigo-500/[0.04] border border-indigo-500/10'
              : 'bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1]'
        }`}
      >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
          value ? 'bg-indigo-500/15' : 'bg-white/[0.04]'
        }`}>
          <MapPin className={`w-3.5 h-3.5 ${value ? 'text-indigo-400' : 'text-white/25'}`} />
        </div>
        <span className={`flex-1 text-[13px] truncate ${
          selected ? 'font-semibold text-white/90' : 'text-white/30'
        }`}>
          {selected ? selected.name : 'গ্রাম নির্বাচন করুন'}
        </span>
        {value && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange(''); }}
            className="p-0.5 rounded hover:bg-white/[0.06] cursor-pointer"
          >
            <X className="w-3 h-3 text-white/20 hover:text-red-400/60 transition-colors" />
          </button>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-white/20 transition-transform duration-200 ${
          open ? 'rotate-180 text-indigo-400' : ''
        }`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 top-full left-0 right-0 mt-1.5 bg-[#0f0f14] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-[drop_0.15s_ease]">
            <div className="max-h-52 overflow-y-auto py-1 px-1 scrl">
              {options.map((opt, i) => {
                const sel = opt.id === value;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { onChange(opt.id); setOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all cursor-pointer mb-px ${
                      sel
                        ? 'bg-indigo-500/10 text-indigo-300'
                        : 'text-white/60 hover:bg-white/[0.04] hover:text-white/80'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center shrink-0 ${
                      sel
                        ? 'bg-indigo-500 text-white'
                        : 'bg-white/[0.04] text-white/25'
                    }`}>
                      {sel ? <Check className="w-3 h-3" /> : toBanglaDigits(i + 1)}
                    </span>
                    <span className="text-[12px] font-medium truncate flex-1">{opt.name}</span>
                    {sel && <BadgeCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="px-3 py-1.5 border-t border-white/[0.06] bg-white/[0.01]">
              <p className="text-[9px] text-white/25 text-center font-medium">
                মোট <span className="text-indigo-400">{toBanglaDigits(options.length)}</span> টি
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
              ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/20'
              : i === 0 || a[i-1]?.done
                ? 'bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/15'
                : 'bg-white/[0.03] text-white/20'
          }`}>
            {s.done ? <Check className="w-3 h-3" /> : s.n}
          </div>
          <span className={`text-[9px] font-semibold transition-colors ${
            s.done ? 'text-emerald-400/60' : 'text-white/20'
          }`}>
            {s.label}
          </span>
        </div>
        {i < 2 && (
          <div className="flex-1 mx-3 h-px bg-white/[0.04] rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${
              s.done ? 'w-full bg-emerald-500/30' : 'w-0'
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
      className="group rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/15 transition-all duration-300 overflow-hidden"
      style={{
        animationDelay: `${index * 80}ms`,
        animation: 'reveal 0.4s ease forwards',
        opacity: 0,
      }}
    >
      {/* Top accent */}
      <div className="h-[2px] w-full bg-gradient-to-r from-indigo-500/40 via-violet-500/30 to-indigo-500/0" />

      {/* Header */}
      <div className="px-4 pt-3.5 pb-2.5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/10 border border-indigo-500/10 flex items-center justify-center text-sm font-bold text-indigo-300/80 shrink-0 group-hover:scale-105 transition-transform duration-300">
          {voter.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-bold text-white/90 truncate leading-tight">
            {voter.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[8px] font-semibold text-indigo-300/50 bg-indigo-500/8 px-1.5 py-[2px] rounded border border-indigo-500/8">
              📍 {voter.village}
            </span>
            <span className={`text-[7px] font-bold px-1.5 py-[2px] rounded uppercase tracking-wider ${
              voter.addedBy === 'system'
                ? 'text-amber-400/40 bg-amber-500/5 border border-amber-500/8'
                : 'text-emerald-400/40 bg-emerald-500/5 border border-emerald-500/8'
            }`}>
              {voter.addedBy}
            </span>
          </div>
        </div>
      </div>

      {/* Voter Number */}
      <div className="mx-4 mb-3">
        <div className="relative overflow-hidden flex items-center gap-3 px-3 py-2.5 rounded-lg bg-indigo-500/[0.04] border border-indigo-500/8">
          <div className="absolute left-0 top-1 bottom-1 w-[2px] bg-indigo-500/30 rounded-full" />
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
            <Fingerprint className="w-4 h-4 text-indigo-400/60" />
          </div>
          <div className="flex-1 min-w-0 pl-0.5">
            <p className="text-[7px] font-bold text-white/60 uppercase tracking-[0.15em]">ভোটার নম্বর</p>
            <p className="text-[14px] font-mono font-bold text-white/90 tracking-wider mt-px">
              {toBanglaDigits(voter.voterNumber)}
            </p>
          </div>
          <button
            onClick={() => copy(voter.voterNumber, `nid-${voter._id}`)}
            className="p-1.5 rounded-md hover:bg-indigo-500/10 transition-all cursor-pointer active:scale-90"
          >
            {copied === `nid-${voter._id}` ? (
              <Check className="w-3.5 h-3.5 text-emerald-400/70" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-white/20 hover:text-indigo-400/60 transition-colors" />
            )}
          </button>
        </div>
      </div>

      {/* Info Grid */}
      <div className="px-4 pb-3">
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              label: 'সিরিয়াল',
              value: toBanglaDigits(voter.serialNumber),
              icon: <Hash className="w-3 h-3" />,
              color: 'text-sky-400/50',
              bg: 'bg-sky-500/6',
              border: 'border-sky-500/6',
            },
            {
              label: 'জন্ম তারিখ',
              value: formatDisplayDate(voter.dateOfBirth),
              icon: <Clock className="w-3 h-3" />,
              color: 'text-amber-400/50',
              bg: 'bg-amber-500/6',
              border: 'border-amber-500/6',
              mono: true,
            },
            {
              label: 'পিতা/স্বামী',
              value: voter.fatherOrHusbandName,
              icon: <User className="w-3 h-3" />,
              color: 'text-indigo-400/50',
              bg: 'bg-indigo-500/6',
              border: 'border-indigo-500/6',
            },
            {
              label: 'মাতা',
              value: voter.motherName,
              icon: <Heart className="w-3 h-3" />,
              color: 'text-rose-400/50',
              bg: 'bg-rose-500/6',
              border: 'border-rose-500/6',
            },
          ].map(item => (
            <div
              key={item.label}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg ${item.bg} border ${item.border} hover:border-white/[0.06] transition-all group/i`}
            >
              <div className={`w-6 h-6 rounded-md ${item.bg} flex items-center justify-center shrink-0 group-hover/i:scale-110 transition-transform`}>
                <span className={item.color}>{item.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[7px] font-bold text-white/40 uppercase tracking-widest">{item.label}</p>
                <p className={`text-[11px] font-semibold text-white/90 truncate mt-px ${item.mono ? 'font-mono' : ''}`}>
                  {item.value || '—'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Polling Center */}
      {voter.pollingCenter && (
        <div className="mx-4 mb-3">
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-emerald-500/[0.04] border border-emerald-500/8">
            <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Building2 className="w-3 h-3 text-emerald-400/50" />
            </div>
            <div className="min-w-0">
              <p className="text-[7px] font-bold text-white/70 uppercase tracking-widest">ভোটকেন্দ্র</p>
              <p className="text-[11px] font-semibold text-emerald-400/90 truncate mt-px">{voter.pollingCenter}</p>
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
        ? 'text-cyan-400/70 bg-cyan-500/6 border-cyan-500/10'
        : 'text-orange-400/70 bg-orange-500/6 border-orange-500/10'
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

  const handleDobChange = (e: ChangeEvent<HTMLInputElement>) =>
    setDob(formatDateInput(e.target.value));
  const isDobValid = /^\d{2}\/\d{2}\/\d{4}$/.test(dob);
  const canSubmit = !loading && isDobValid && wardId !== '';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setResults([]); setSearched(false); setDataSource(null);
    if (!wardId) return setError('একটি গ্রাম নির্বাচন করুন।');
    if (!isDobValid) return setError('DD/MM/YYYY ফরম্যাটে তারিখ দিন।');
    setLoading(true);
    try {
      const { data } = await axios.post<ApiResponse>(API_URL, {
        DOB: convertToBanglaDOB(dob), Ward: wardId,
      });
      setSearched(true);
      setDataSource(data.source || null);
      if (data.success) {
        setResults(data.data || []);
        if (!data.data?.length) setError('কোনো তথ্য পাওয়া যায়নি।');
      } else setError(data.message || 'তথ্য পাওয়া যায়নি।');
    } catch (err: unknown) {
      setSearched(true);
      if (axios.isAxiosError(err))
        setError(err.response?.data?.message || 'লোড করতে সমস্যা।');
      else setError('নেটওয়ার্ক সমস্যা।');
    } finally { setLoading(false); }
  };

  const reset = () => {
    setWardId(''); setDob(''); setResults([]);
    setSearched(false); setError(''); setDataSource(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      <BG />

      <div className="relative z-10 min-h-screen flex items-start justify-center px-3 py-6 sm:px-4 sm:py-8">
        <div className="w-full max-w-xl">

          {/* ═══ HEADER ═══ */}
          <div className="mb-5">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="relative px-5 py-5 sm:px-6 sm:py-6">
                {/* subtle bg */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] to-transparent" />

                <div className="relative flex items-start justify-between gap-3">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.05]">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative rounded-full h-1.5 w-1.5 bg-emerald-400" />
                      </span>
                      <span className="text-[9px] font-semibold text-white/30 uppercase tracking-[0.15em]">
                        যশোর সদর — সক্রিয়
                      </span>
                    </div>
                    <div>
                      <h1 className="text-[22px] sm:text-[26px] font-black tracking-tight leading-tight">
                        <span className="text-white/90">ভোটার তথ্য </span>
                        <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                          অনুসন্ধান
                        </span>
                      </h1>
                      <p className="text-[11px] text-white/30 mt-1.5 font-medium max-w-xs">
                        গ্রাম ও জন্ম তারিখ দিয়ে ভোটকেন্দ্রসহ সকল তথ্য দেখুন
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block shrink-0 mt-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] text-white/70 text-[9px] font-semibold border border-white/[0.04]">
                      <MapPin className="w-3 h-3 text-indigo-400/80" />
                      ১৪ নং নরেন্দ্রপুর
                    </span>
                  </div>
                </div>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent" />
            </div>
          </div>

          {/* ═══ FORM ═══ */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-5 mb-5">
            <Steps s1={!!wardId} s2={isDobValid} />

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Village */}
              <div>
                <label className="flex items-center gap-1.5 text-[9px] font-semibold text-white/50 uppercase tracking-widest mb-2 pl-0.5">
                  <MapPin className="w-3 h-3 text-indigo-400/70" />
                  ধাপ ১: গ্রাম
                </label>
                <CustomSelect value={wardId} onChange={setWardId} options={VILLAGES_NEW} />
                {wardId && (
                  <p className="mt-1.5 text-[9px] text-white/50 pl-0.5 flex items-center gap-1 animate-[fadeIn_0.2s]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400/70" />
                    Ward: <span className="font-mono font-semibold text-emerald-400/80">{wardId}</span>
                  </p>
                )}
              </div>

              {/* DOB */}
              <div>
                <label
                  htmlFor="dob"
                  className="flex items-center gap-1.5 text-[9px] font-semibold text-white/50 uppercase tracking-widest mb-2 pl-0.5"
                >
                  <Calendar className="w-3 h-3 text-sky-400/50" />
                  ধাপ ২: জন্ম তারিখ
                </label>
                <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-200 ${
                  isDobValid
                    ? 'bg-emerald-500/[0.04] border-emerald-500/15'
                    : 'bg-white/[0.03] border-white/[0.06] focus-within:border-indigo-500/20 focus-within:bg-indigo-500/[0.02]'
                }`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isDobValid ? 'bg-emerald-500/15' : 'bg-white/[0.04]'
                  }`}>
                    <Calendar className={`w-3.5 h-3.5 ${
                      isDobValid ? 'text-emerald-400/70' : dob ? 'text-sky-400/40' : 'text-white/20'
                    }`} />
                  </div>
                  <input
                    id="dob"
                    type="text"
                    inputMode="numeric"
                    value={dob}
                    onChange={handleDobChange}
                    placeholder="DD/MM/YYYY"
                    autoComplete="off"
                    className="flex-1 bg-transparent text-[13px] font-semibold text-white/90 placeholder:text-white/15 focus:outline-none font-mono tracking-widest"
                  />
                  {isDobValid && (
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center animate-[pop_0.25s_ease]">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                  )}
                </div>
                <p className="mt-1.5 text-[9px] text-white/70 pl-0.5 flex items-center gap-1">
                  <ArrowRight className="w-2.5 h-2.5 text-white/60" />
                  {isDobValid ? (
                    <>বাংলায়: <span className="font-mono font-semibold text-indigo-400/80">{convertToBanglaDOB(dob)}</span></>
                  ) : (
                    <>উদাহরণ: <span className="font-mono text-white/25">01/01/2001</span></>
                  )}
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit}
                className={`w-full py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer active:scale-[0.98] overflow-hidden relative group/btn ${
                  !canSubmit
                    ? 'bg-white/[0.03] text-white/20 cursor-not-allowed border border-white/[0.04]'
                    : 'bg-indigo-600/80 text-white border border-indigo-500/30 hover:bg-indigo-600/90 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20'
                }`}
              >
                {canSubmit && !loading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                )}
                <span className="relative flex items-center gap-2">
                  {loading ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> অনুসন্ধান চলছে</>
                  ) : (
                    <><Search className="w-3.5 h-3.5" /> তথ্য খুঁজুন</>
                  )}
                </span>
              </button>
            </form>

            {/* Error */}
            {error && (
              <div className="mt-4 px-3 py-2.5 bg-red-500/[0.05] border border-red-500/10 rounded-xl flex items-center gap-2.5 animate-[shake_0.3s]">
                <AlertCircle className="w-3.5 h-3.5 text-red-400/60 shrink-0" />
                <p className="text-[11px] text-red-400/70 font-medium flex-1">{error}</p>
                <button onClick={() => setError('')} className="p-0.5 cursor-pointer hover:bg-red-500/10 rounded transition-colors">
                  <X className="w-3 h-3 text-red-400/30 hover:text-red-400/60" />
                </button>
              </div>
            )}
          </div>

          {/* ═══ TAGS ═══ */}
          {(wardId || dob) && (
            <div className="flex flex-wrap items-center gap-1.5 mb-4 px-1 animate-[fadeIn_0.2s]">
              <span className="text-[8px] text-white/45 font-semibold uppercase tracking-widest mr-1">ফিল্টার:</span>
              {wardId && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/8 text-[9px] font-medium text-indigo-300">
                  <MapPin className="w-2.5 h-2.5" />{wardId}
                </span>
              )}
              {dob && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/8 text-[9px] font-mono font-medium text-sky-300">
                  <Calendar className="w-2.5 h-2.5" />{dob}
                  {isDobValid && <Check className="w-2.5 h-2.5 text-emerald-400/50" />}
                </span>
              )}
              {searched && results.length > 0 && (
                <button
                  onClick={reset}
                  className="ml-auto text-[9px] font-medium text-white/70 hover:text-white/70 bg-white/[0.03] hover:bg-white/[0.05] px-2 py-0.5 rounded-md border border-white/[0.05] cursor-pointer transition-all"
                >
                  রিসেট
                </button>
              )}
            </div>
          )}

          {/* ═══ RESULTS ═══ */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
            {/* Result header */}
            <div className="px-4 py-3 border-b border-white/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  searched && results.length > 0
                    ? 'bg-emerald-500/10 border border-emerald-500/10'
                    : 'bg-white/[0.03] border border-white/[0.04]'
                }`}>
                  <Users className={`w-4 h-4 ${
                    searched && results.length > 0 ? 'text-emerald-400/60' : 'text-white/15'
                  }`} />
                </div>
                <div>
                  <h2 className="text-[13px] font-bold text-white/80">ফলাফল</h2>
                  <p className="text-[9px] text-white/60 font-medium mt-px">
                    {searched && results.length > 0
                      ? `${toBanglaDigits(results.length)} জন পাওয়া গেছে`
                      : 'ফলাফল এখানে দেখুন'}
                  </p>
                </div>
              </div>
              {searched && results.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <SourceBadge source={dataSource} />
                  <span className="text-[9px] font-semibold text-emerald-400/80 bg-emerald-500/8 px-2 py-0.5 rounded-md border border-emerald-500/8 flex items-center gap-1">
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
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/[0.06] border border-indigo-500/8 flex items-center justify-center mx-auto mb-3">
                    <Search className="w-6 h-6 text-indigo-400/20" />
                  </div>
                  <p className="text-[12px] font-semibold text-white/30 mb-1">তথ্য অনুসন্ধান করুন</p>
                  <p className="text-[10px] text-white/15">গ্রাম ও জন্ম তারিখ দিন</p>
                  <div className="flex items-center justify-center gap-3 mt-4 text-[9px] text-white/15 font-medium">
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-emerald-400/30" /> নিরাপদ</span>
                    <span className="text-white/5">·</span>
                    <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-indigo-400/30" /> দ্রুত</span>
                  </div>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="text-center py-12">
                  <div className="relative w-14 h-14 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full border border-white/[0.06]" />
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500/50 border-t-transparent animate-spin" />
                    <div className="absolute inset-2.5 rounded-full border border-violet-400/20 border-b-transparent animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-indigo-400/40 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-[12px] font-semibold text-white/40">লোড হচ্ছে...</p>
                  <p className="text-[10px] text-white/15 mt-0.5">অপেক্ষা করুন</p>
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

              {/* No Results */}
              {searched && !loading && results.length === 0 && !error && (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-2xl bg-red-500/[0.05] border border-red-500/8 flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-6 h-6 text-red-400/20" />
                  </div>
                  <p className="text-[12px] font-semibold text-white/30 mb-3">তথ্য পাওয়া যায়নি</p>
                  <button
                    onClick={reset}
                    className="text-[11px] font-medium text-indigo-400/60 hover:text-indigo-400/80 bg-indigo-500/8 hover:bg-indigo-500/12 px-3 py-1.5 rounded-lg border border-indigo-500/10 cursor-pointer transition-all"
                  >
                    আবার চেষ্টা করুন
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-[9px] text-white/60 flex items-center justify-center gap-1.5">
              <Shield className="w-3 h-3 text-indigo-400/70" /> তথ্য সুরক্ষিত ও গোপনীয়
            </p>
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
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
        }
        .scrl::-webkit-scrollbar { width: 3px; }
        .scrl::-webkit-scrollbar-track { background: transparent; }
        .scrl::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.15); border-radius: 3px; }
        .scrl::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.25); }
      `}</style>
    </div>
  );
};

export default VoterFormTwo;