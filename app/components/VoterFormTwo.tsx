'use client';

import axios from 'axios';
import React, { useState, useRef, useEffect, FormEvent, ChangeEvent } from 'react';
import {
  Search, User, MapPin, Calendar, Loader2, AlertCircle,
  Sparkles, Shield, Heart, Fingerprint, Building2, Clock,
  BadgeCheck, ChevronDown, Globe, CheckCircle2, X,
  ArrowRight, Copy, Check,
} from 'lucide-react';
import { VillageOption, VILLAGES_NEW } from '../api/newvoter/utils';

// ══════════════════════════════════════
// TYPES
// ══════════════════════════════════════
interface VoterInfo {
  id: number;
  voterAreaName: string;
  voterName: string;
  voterMother: string;
  voterFather: string;
  gender: string;
  dob: string;
  address: string;
  serialNo: string;
  nid: string;
  centerName: string | null;
}

interface ApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: VoterInfo[];
  timestamp: string;
}

// ╔══════════════════════════════════════╗
// ║  API URL → POST /api/voters          ║
// ╚══════════════════════════════════════╝
const API_URL = '/api/newvoter';

// ══════════════════════════════════════
// HELPERS
// ══════════════════════════════════════
const bangDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

// English → Bangla digits: "05/12/1995" → "০৫/১২/১৯৯৫"
const toBanglaDigits = (v: string): string =>
  v.replace(/[0-9]/g, (d) => bangDigits[Number(d)]);

// DOB input auto-format: "05122004" → "05/12/2004"
const formatDateInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
};

// ╔═══════════════════════════════════════════════╗
// ║  KEY CHANGE: DOB কে Bangla ফরম্যাটে কনভার্ট  ║
// ║  "05/12/1995" → "০৫/১২/১৯৯৫"                 ║
// ╚═══════════════════════════════════════════════╝
const convertToBanglaDOB = (dob: string): string => toBanglaDigits(dob);

// Display helpers
const formatDisplayDate = (iso: string): string => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
};

const getGenderLabel = (g: string) =>
  g === 'M' ? 'পুরুষ' : g === 'F' ? 'মহিলা' : g || 'N/A';
const getGenderIcon = (g: string) =>
  g === 'M' ? '👨' : g === 'F' ? '👩' : '👤';

// ── COPY HOOK ──
const useCopy = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };
  return { copied, copy };
};

// ══════════════════════════════════════
// CUSTOM SELECT
// ══════════════════════════════════════
const CustomSelect: React.FC<{
  value: string;
  onChange: (val: string) => void;
  options: VillageOption[];
}> = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 pl-4 pr-4 py-3.5 bg-white/[0.03] border rounded-xl text-left transition-all duration-300 cursor-pointer group ${
          open
            ? 'border-purple-500/30 ring-2 ring-purple-500/15 bg-purple-500/[0.02]'
            : value
              ? 'border-purple-500/15 bg-purple-500/[0.02]'
              : 'border-white/[0.06] hover:border-white/[0.12]'
        }`}
      >
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
            value ? 'bg-purple-500/15' : 'bg-white/[0.05] group-hover:bg-white/[0.08]'
          }`}
        >
          <Globe
            className={`w-4 h-4 transition-colors ${
              value ? 'text-purple-400' : 'text-gray-500'
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          {selected ? (
            <div>
              <p className="text-[9px] font-bold text-purple-400 uppercase tracking-[0.15em] leading-none">
                নির্বাচিত গ্রাম
              </p>
              <p className="text-sm font-bold text-white mt-1 truncate">
                {selected.name}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-600 font-medium">গ্রাম নির্বাচন করুন...</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setOpen(false);
              }}
              className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-gray-500 hover:text-red-400 transition-colors" />
            </button>
          )}
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300 ${
              open ? 'bg-purple-500/15' : 'bg-white/[0.03]'
            }`}
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-all duration-300 ${
                open ? 'text-purple-400 rotate-180' : 'text-gray-500'
              }`}
            />
          </div>
        </div>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-[#12121c] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-[dropIn_0.2s_ease]">
            <div className="max-h-56 overflow-y-auto py-1 px-1.5">
              {options.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-gray-600">কোনো গ্রাম পাওয়া যায়নি</p>
                </div>
              ) : (
                options.map((opt, i) => {
                  const isSelected = opt.id === value;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onChange(opt.id);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 cursor-pointer mb-0.5 ${
                        isSelected
                          ? 'bg-purple-500/10 text-purple-300'
                          : 'text-gray-300 hover:bg-white/[0.04] hover:text-white'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 transition-all ${
                          isSelected
                            ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                            : 'bg-white/[0.05] text-gray-500'
                        }`}
                      >
                        {isSelected ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          toBanglaDigits((i + 1).toString())
                        )}
                      </div>
                      <span className="text-sm font-semibold truncate flex-1">
                        {opt.name}
                      </span>
                      {isSelected && (
                        <BadgeCheck className="w-4 h-4 text-purple-400 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
            <div className="px-4 py-2 border-t border-white/[0.06] bg-white/[0.02]">
              <p className="text-[10px] text-gray-500 font-medium text-center">
                মোট{' '}
                <span className="text-purple-400 font-bold">
                  {toBanglaDigits(options.length.toString())}
                </span>{' '}
                টি গ্রাম
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ══════════════════════════════════════
// STEP INDICATOR
// ══════════════════════════════════════
const StepIndicator: React.FC<{
  step1Done: boolean;
  step2Done: boolean;
}> = ({ step1Done, step2Done }) => (
  <div className="flex items-center gap-0 mb-6">
    <div className="flex items-center gap-2">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-500 ${
          step1Done
            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
            : 'bg-white/[0.05] text-gray-500 border border-white/[0.08]'
        }`}
      >
        {step1Done ? <Check className="w-3.5 h-3.5" /> : '১'}
      </div>
      <span
        className={`text-[10px] font-bold transition-colors ${
          step1Done ? 'text-emerald-400' : 'text-gray-600'
        }`}
      >
        গ্রাম
      </span>
    </div>

    <div className="flex-1 mx-3 h-[2px] rounded-full overflow-hidden bg-white/[0.05]">
      <div
        className={`h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out ${
          step1Done ? 'w-full' : 'w-0'
        }`}
      />
    </div>

    <div className="flex items-center gap-2">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-500 ${
          step2Done
            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
            : step1Done
              ? 'bg-white/[0.05] text-purple-400 border border-purple-500/30 animate-pulse'
              : 'bg-white/[0.05] text-gray-500 border border-white/[0.08]'
        }`}
      >
        {step2Done ? <Check className="w-3.5 h-3.5" /> : '২'}
      </div>
      <span
        className={`text-[10px] font-bold transition-colors ${
          step2Done ? 'text-emerald-400' : 'text-gray-600'
        }`}
      >
        জন্ম তারিখ
      </span>
    </div>

    <div className="flex-1 mx-3 h-[2px] rounded-full overflow-hidden bg-white/[0.05]">
      <div
        className={`h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out ${
          step2Done ? 'w-full' : 'w-0'
        }`}
      />
    </div>

    <div className="flex items-center gap-2">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 ${
          step2Done
            ? 'bg-purple-500/15 border border-purple-500/30'
            : 'bg-white/[0.05] border border-white/[0.08]'
        }`}
      >
        <Search
          className={`w-3 h-3 transition-colors ${
            step2Done ? 'text-purple-400' : 'text-gray-600'
          }`}
        />
      </div>
      <span
        className={`text-[10px] font-bold transition-colors ${
          step2Done ? 'text-gray-300' : 'text-gray-600'
        }`}
      >
        অনুসন্ধান
      </span>
    </div>
  </div>
);

// ══════════════════════════════════════
// VOTER CARD
// ══════════════════════════════════════
const VoterCard: React.FC<{ voter: VoterInfo; index: number }> = ({
  voter,
  index,
}) => {
  const { copied, copy } = useCopy();
  const isMale = voter.gender === 'M';
  const hasGender = voter.gender === 'M' || voter.gender === 'F';

  return (
    <div
      className="group relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 hover:bg-white/[0.03]"
      style={{
        animationDelay: `${index * 100}ms`,
        animation: 'cardReveal 0.5s ease-out forwards',
        opacity: 0,
      }}
    >
      <div
        className={`h-[2px] w-full ${
          hasGender
            ? isMale
              ? 'bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500'
              : 'bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500'
            : 'bg-gradient-to-r from-purple-500 via-violet-500 to-blue-500'
        }`}
      />

      {/* Profile */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div
              className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg transition-transform duration-300 group-hover:scale-105 ${
                hasGender
                  ? isMale
                    ? 'bg-gradient-to-br from-blue-500/20 to-sky-500/20 border border-blue-500/15 shadow-blue-500/10'
                    : 'bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/15 shadow-pink-500/10'
                  : 'bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-500/15 shadow-purple-500/10'
              }`}
            >
              {getGenderIcon(voter.gender)}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#0c0c14] flex items-center justify-center border border-white/[0.06]">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite]" />
            </div>
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-lg font-bold text-white leading-tight truncate">
              {voter.voterName}
            </h3>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {hasGender && (
                <>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-[0.1em] ${
                      isMale
                        ? 'text-blue-400 bg-blue-500/10 border border-blue-500/15'
                        : 'text-pink-400 bg-pink-500/10 border border-pink-500/15'
                    }`}
                  >
                    {getGenderLabel(voter.gender)}
                  </span>
                  <div className="w-px h-3.5 bg-white/[0.06]" />
                </>
              )}
              <span className="text-[10px] font-mono font-bold text-gray-500">
                সিরিয়াল #{toBanglaDigits(voter.serialNo)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* NID */}
      <div className="mx-5 mb-4">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-500/[0.08] to-blue-500/[0.08] border border-purple-500/10 p-4">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-blue-500 rounded-full" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
              backgroundSize: '16px 16px',
            }}
          />
          <div className="relative flex items-center justify-between pl-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/15">
                <Fingerprint className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                  ভোটার নম্বর (NID)
                </p>
                <p className="text-base font-mono font-black text-white tracking-[0.1em] mt-0.5">
                  {toBanglaDigits(voter.nid)}
                </p>
              </div>
            </div>
            <button
              onClick={() => copy(voter.nid, `nid-${voter.id}`)}
              className="p-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-all duration-200 cursor-pointer active:scale-90"
              title="কপি করুন"
            >
              {copied === `nid-${voter.id}` ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-500 hover:text-gray-300 transition-colors" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="px-5 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            {
              label: 'পিতা/স্বামী',
              value: voter.voterFather,
              icon: <User className="w-3 h-3" />,
              color: 'text-sky-400',
              bg: 'bg-sky-500/10',
              border: 'border-sky-500/10',
            },
            {
              label: 'মাতা',
              value: voter.voterMother,
              icon: <Heart className="w-3 h-3" />,
              color: 'text-rose-400',
              bg: 'bg-rose-500/10',
              border: 'border-rose-500/10',
            },
            {
              label: 'জন্ম তারিখ',
              value: formatDisplayDate(voter.dob),
              icon: <Clock className="w-3 h-3" />,
              color: 'text-amber-400',
              bg: 'bg-amber-500/10',
              border: 'border-amber-500/10',
              mono: true,
            },
            {
              label: 'এলাকা',
              value: voter.voterAreaName,
              icon: <MapPin className="w-3 h-3" />,
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/10',
              border: 'border-emerald-500/10',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.08] transition-all duration-200 group/item"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.bg} border ${item.border} group-hover/item:scale-110 transition-transform duration-300`}
              >
                <span className={item.color}>{item.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.15em] leading-none">
                  {item.label}
                </p>
                <p
                  className={`text-[12px] font-bold text-white leading-tight mt-1 truncate ${
                    item.mono ? 'font-mono tracking-wide' : ''
                  }`}
                >
                  {item.value || 'তথ্য নেই'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mx-5 mb-4">
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] overflow-hidden">
          <div className="px-4 py-3 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-md bg-white/[0.05] flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-3 h-3 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.15em]">
                ঠিকানা
              </p>
              <p className="text-[11px] text-gray-400 font-medium leading-relaxed mt-0.5">
                {voter.address || 'তথ্য নেই'}
              </p>
            </div>
          </div>

          {voter.centerName && (
            <>
              <div className="h-px bg-white/[0.04]" />
              <div className="px-4 py-3 flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-3 h-3 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.15em]">
                    ভোটকেন্দ্র
                  </p>
                  <p className="text-[11px] font-bold text-emerald-400 mt-0.5 truncate">
                    {voter.centerName}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════
const VoterFormTwo: React.FC = () => {
  const [wardId, setWardId] = useState('');   // wardId = গ্রামের নাম
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<VoterInfo[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  // ╔═════════════════════════════════════════╗
  // ║  wardId এখন গ্রামের নাম                  ║
  // ║  centerId আর দরকার নেই                   ║
  // ╚═════════════════════════════════════════╝
  const selectedVillageName = wardId || '';

  const handleDobChange = (e: ChangeEvent<HTMLInputElement>) =>
    setDob(formatDateInput(e.target.value));

  const isDobValid = /^\d{2}\/\d{2}\/\d{4}$/.test(dob);
  const canSubmit = !loading && isDobValid && wardId !== '';

  const handleVillageChange = (newWardId: string) => setWardId(newWardId);

  // ╔══════════════════════════════════════════════╗
  // ║  KEY CHANGE: GET → POST                      ║
  // ║  Body: { DOB (Bangla), Ward, Identification } ║
  // ╚══════════════════════════════════════════════╝
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setResults([]);
    setSearched(false);

    if (!wardId) return setError('অনুগ্রহ করে একটি গ্রাম নির্বাচন করুন।');
    if (!isDobValid) return setError('জন্ম তারিখ DD/MM/YYYY ফরম্যাটে দিন।');

    setLoading(true);
    try {
      // ─── DOB কে Bangla তে কনভার্ট ───
      // "05/12/1995" → "০৫/১২/১৯৯৫"
      const banglaDOB = convertToBanglaDOB(dob);

      // ─── POST request ───
      const { data } = await axios.post<ApiResponse>(API_URL, {
        DOB: banglaDOB,
        Ward: wardId,  // wardId = গ্রামের নাম e.g. "শাখারী গাতী"

      });

      setSearched(true);

      if (data.success) {
        setResults(data.data || []);
        if (!data.data?.length) setError('দুঃখিত, কোনো তথ্য পাওয়া যায়নি।');
      } else {
        setError(data.message || 'তথ্য খুঁজে পাওয়া যায়নি।');
      }
    } catch (err: unknown) {
      setSearched(true);
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message || 'তথ্য লোড করতে সমস্যা হয়েছে।'
        );
      } else {
        setError('নেটওয়ার্ক বা অজানা সমস্যা দেখা দিয়েছে।');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setWardId('');
    setDob('');
    setResults([]);
    setSearched(false);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#06060a] text-white relative overflow-hidden">
      {/* ── Background ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-purple-600/[0.07] rounded-full blur-[180px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-blue-600/[0.07] rounded-full blur-[180px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/[0.03] rounded-full blur-[200px]" />
        <div
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage: `radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-3 py-6 sm:px-4 sm:py-10">
        <div className="w-full max-w-2xl">
          {/* ═══ HEADER CARD ═══ */}
          <div className="relative mb-5">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/10 via-violet-600/10 to-blue-600/10 rounded-3xl blur-xl" />
            <div className="relative bg-white/[0.02] backdrop-blur-2xl border border-white/[0.08] rounded-2xl overflow-hidden">
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.06] via-transparent to-blue-500/[0.04]" />
                <div
                  className="absolute inset-0 opacity-[0.02]"
                  style={{
                    backgroundImage: `radial-gradient(circle, rgba(139,92,246,0.3) 1px, transparent 1px)`,
                    backgroundSize: '24px 24px',
                  }}
                />
                <div className="relative px-5 py-7 sm:px-7 sm:py-9">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                        </span>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                          যশোর সদর — সক্রিয়
                        </span>
                      </div>
                      <div>
                        <h1 className="text-[26px] sm:text-[32px] font-black tracking-tight leading-[1.15]">
                          <span className="text-white">ভোটার তথ্য</span>
                          <span className="block bg-gradient-to-r from-purple-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
                            অনুসন্ধান
                          </span>
                        </h1>
                        <p className="text-[11px] sm:text-[13px] text-gray-600 leading-relaxed max-w-sm font-medium mt-3">
                          গ্রাম ও জন্ম তারিখ দিয়ে আপনার ভোটকেন্দ্রসহ সকল তথ্য দেখুন
                        </p>
                      </div>
                      <div className="flex sm:hidden flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] text-gray-500 text-[9px] font-bold border border-white/[0.04]">
                          <MapPin className="w-3 h-3 text-purple-400/60" />
                          ১৪ নং ইউনিয়ন
                        </span>
                      </div>
                    </div>
                    <div className="hidden sm:flex flex-col items-end gap-2 shrink-0 mt-2">
                      <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] text-gray-500 text-[11px] font-bold border border-white/[0.04]">
                        <MapPin className="w-3.5 h-3.5 text-purple-400/60" />
                        ১৪ নং ইউনিয়ন — নরেন্দ্রপুর
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400/80 text-[9px] font-bold border border-emerald-500/10">
                        <Shield className="w-3 h-3" />
                        নিরাপদ ও এনক্রিপ্টেড
                      </span>
                    </div>
                  </div>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-purple-500/15 to-transparent" />
              </div>
            </div>
          </div>

          {/* ═══ SEARCH FORM CARD ═══ */}
          <div className="relative mb-5 group/search">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/10 via-violet-600/10 to-blue-600/10 rounded-[20px] blur-xl opacity-60 group-hover/search:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-white/[0.02] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5 sm:p-6">
              <StepIndicator step1Done={!!wardId} step2Done={isDobValid} />

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Village Select */}
                <div>
                  <label className="flex items-center gap-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2.5 pl-1">
                    <Globe className="w-3 h-3 text-purple-400/60" />
                    ধাপ ১: গ্রাম নির্বাচন (Ward)
                  </label>
                  <CustomSelect
                    value={wardId}
                    onChange={handleVillageChange}
                    options={VILLAGES_NEW}
                  />

                  {/* ═══ নির্বাচিত গ্রাম দেখানো (centerId সরানো হয়েছে) ═══ */}
                  {wardId && (
                    <div className="mt-2.5 flex items-center gap-2 pl-1 animate-[fadeIn_0.3s_ease]">
                      <div className="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/10">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium">
                        Ward:{' '}
                        <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/10 ml-0.5">
                          {selectedVillageName}
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                {/* DOB */}
                <div>
                  <label
                    htmlFor="dob"
                    className="flex items-center gap-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2.5 pl-1"
                  >
                    <Calendar className="w-3 h-3 text-blue-400/60" />
                    ধাপ ২: জন্ম তারিখ (DD/MM/YYYY)
                  </label>
                  <div className="relative group/dob">
                    <div
                      className={`relative flex items-center bg-white/[0.03] rounded-xl border transition-all duration-300 ${
                        isDobValid
                          ? 'border-emerald-500/20 bg-emerald-500/[0.02]'
                          : dob
                            ? 'border-white/[0.08]'
                            : 'border-white/[0.06] focus-within:border-purple-500/30 focus-within:ring-2 focus-within:ring-purple-500/15'
                      }`}
                    >
                      <div className="pl-4">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${
                            isDobValid
                              ? 'bg-emerald-500/15'
                              : dob
                                ? 'bg-blue-500/10'
                                : 'bg-white/[0.05]'
                          }`}
                        >
                          <Calendar
                            className={`w-4 h-4 transition-colors duration-300 ${
                              isDobValid
                                ? 'text-emerald-400'
                                : dob
                                  ? 'text-blue-400'
                                  : 'text-gray-500'
                            }`}
                          />
                        </div>
                      </div>
                      <input
                        id="dob"
                        type="text"
                        inputMode="numeric"
                        value={dob}
                        onChange={handleDobChange}
                        placeholder="05/12/1995"
                        autoComplete="off"
                        className="w-full px-3 py-3.5 bg-transparent text-sm font-bold text-white placeholder:text-gray-600 placeholder:font-normal focus:outline-none font-mono tracking-[0.15em]"
                      />
                      {isDobValid && (
                        <div className="pr-4 animate-[popIn_0.3s_ease]">
                          <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
                            <BadgeCheck className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* DOB Preview — Bangla তে কি যাবে দেখানো */}
                  {isDobValid && (
                    <div className="mt-2 flex items-center gap-2 pl-1 animate-[fadeIn_0.3s_ease]">
                      <ArrowRight className="w-3 h-3 text-gray-700" />
                      <span className="text-[10px] text-gray-600">
                        API তে যাবে:{' '}
                        <span className="font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/10 font-mono">
                          {convertToBanglaDOB(dob)}
                        </span>
                      </span>
                    </div>
                  )}

                  {!isDobValid && (
                    <p className="mt-2 text-[10px] text-gray-600 flex items-center gap-1.5 pl-1">
                      <ArrowRight className="w-3 h-3 text-gray-700" />
                      উদাহরণ:{' '}
                      <span className="font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/10 font-mono">
                        01/01/2001
                      </span>
                    </p>
                  )}
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className={`relative w-full py-3.5 sm:py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all duration-500 cursor-pointer overflow-hidden group/btn active:scale-[0.98] ${
                      !canSubmit
                        ? 'bg-white/[0.03] text-gray-600 cursor-not-allowed border border-white/[0.06]'
                        : 'bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 text-white shadow-xl shadow-purple-500/20 hover:shadow-2xl hover:shadow-purple-500/30 hover:-translate-y-0.5'
                    }`}
                  >
                    {canSubmit && !loading && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                    )}
                    <span className="relative flex items-center gap-2.5">
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          অনুসন্ধান চলছে...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          তথ্য খুঁজুন
                          {canSubmit && (
                            <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-300" />
                          )}
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </form>

              {/* Error */}
              {error && (
                <div className="mt-5 p-3.5 bg-red-500/[0.04] border border-red-500/15 rounded-xl flex items-start gap-3 animate-[shake_0.3s_ease]">
                  <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  </div>
                  <p className="text-xs text-red-400 font-bold leading-relaxed flex-1 pt-1.5">
                    {error}
                  </p>
                  <button
                    onClick={() => setError('')}
                    className="p-1 rounded-md hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5 text-red-400/50" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ═══ Active Tags ═══ */}
          {(wardId || dob) && (
            <div className="flex flex-wrap items-center gap-2 mb-5 px-1 animate-[fadeIn_0.3s_ease]">
              <span className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em]">
                নির্বাচিত:
              </span>
              {wardId && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/15 text-purple-300 font-bold text-[10px]">
                  <Globe className="w-3 h-3 text-purple-400" />
                  {selectedVillageName}
                </span>
              )}
              {dob && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/15 text-blue-300 font-bold text-[10px] font-mono">
                  <Calendar className="w-3 h-3 text-blue-400" />
                  {dob}
                  {isDobValid && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  )}
                </span>
              )}
            </div>
          )}

          {/* ═══ RESULTS CARD ═══ */}
          <div className="relative">
            <div className="bg-white/[0.02] backdrop-blur border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      searched && results.length > 0
                        ? 'bg-emerald-500/10 border border-emerald-500/15'
                        : 'bg-white/[0.05] border border-white/[0.06]'
                    }`}
                  >
                    <User
                      className={`w-4 h-4 transition-colors ${
                        searched && results.length > 0
                          ? 'text-emerald-400'
                          : 'text-gray-500'
                      }`}
                    />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">
                      অনুসন্ধানের ফলাফল
                    </h2>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      {searched && results.length > 0
                        ? 'তথ্য সফলভাবে পাওয়া গেছে'
                        : 'ফলাফল এখানে প্রদর্শিত হবে'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {searched && results.length > 0 && (
                    <>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/10">
                        <Sparkles className="w-3 h-3" />
                        {toBanglaDigits(results.length.toString())} জন
                      </span>
                      <button
                        onClick={handleReset}
                        className="text-[10px] font-bold text-gray-500 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] px-2.5 py-1 rounded-lg border border-white/[0.06] transition-all cursor-pointer"
                      >
                        নতুন খুঁজুন
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="p-5">
                {/* Empty */}
                {!searched && !loading && (
                  <div className="text-center py-14 sm:py-20">
                    <div className="relative inline-block">
                      <div className="absolute -inset-4 bg-purple-500/[0.03] rounded-full blur-2xl" />
                      <div className="relative w-20 h-20 bg-white/[0.02] border border-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-700" />
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-500 mb-1">
                      তথ্য অনুসন্ধান করুন
                    </p>
                    <p className="text-[11px] text-gray-700 max-w-xs mx-auto">
                      গ্রাম ও জন্ম তারিখ দিয়ে ভোটারের সকল তথ্য দেখুন
                    </p>
                  </div>
                )}

                {/* Loading */}
                {loading && (
                  <div className="text-center py-14 sm:py-20">
                    <div className="relative w-16 h-16 mx-auto mb-6">
                      <div className="absolute inset-0 rounded-full border-[2px] border-white/[0.06]" />
                      <div className="absolute inset-0 rounded-full border-[2px] border-purple-500 border-t-transparent animate-spin" />
                      <div className="absolute inset-3 rounded-full border-[2px] border-blue-400/40 border-b-transparent animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                      </div>
                    </div>
                    <p className="text-sm font-bold text-white">ডাটা লোড হচ্ছে...</p>
                    <p className="text-[11px] text-gray-600 mt-1">
                      অনুগ্রহ করে অপেক্ষা করুন
                    </p>
                  </div>
                )}

                {/* Results */}
                {searched && !loading && results.length > 0 && (
                  <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
                    {results.map((voter, index) => (
                      <VoterCard key={voter.id} voter={voter} index={index} />
                    ))}
                  </div>
                )}

                {/* No Results */}
                {searched && !loading && results.length === 0 && !error && (
                  <div className="text-center py-14 sm:py-20">
                    <div className="relative inline-block">
                      <div className="absolute -inset-4 bg-red-500/[0.03] rounded-full blur-2xl" />
                      <div className="relative w-20 h-20 bg-red-500/[0.05] border border-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-400/40" />
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-400 mb-1">
                      কোনো তথ্য পাওয়া যায়নি
                    </p>
                    <p className="text-[11px] text-gray-600 max-w-xs mx-auto">
                      সঠিক গ্রাম ও জন্ম তারিখ দিয়ে আবার চেষ্টা করুন
                    </p>
                    <button
                      onClick={handleReset}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.06] text-gray-400 hover:text-white text-xs font-bold border border-white/[0.06] transition-all cursor-pointer"
                    >
                      <ArrowRight className="w-3 h-3 rotate-180" />
                      আবার চেষ্টা করুন
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══ Footer ═══ */}
          <div className="relative mt-12 py-6 border-t border-white/[0.08] overflow-hidden">
            <div className="absolute left-1/2 -translate-x-1/2 top-0 pointer-events-none">
              <div className="w-[300px] h-[80px] bg-emerald-500/10 blur-[50px] rounded-full" />
            </div>
            <div className="relative flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-xs">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>
                Developed by{' '}
                <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                  Mazaharul
                </span>
              </span>
              <span className="hidden sm:inline-block w-1 h-1" />
              <div className="flex items-center gap-1.5 text-gray-500">
                A Product of{' '}
                <a
                  href="https://mazaharul.site"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-gray-300 hover:text-emerald-400 transition-colors tracking-wide"
                >
                  MazaSoft
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Animations ── */}
      <style jsx>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cardReveal {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.5); }
          70% { transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
      `}</style>
    </div>
  );
};

export default VoterFormTwo;