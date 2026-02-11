'use client';

import axios from 'axios';
import React, { useState, FormEvent, ChangeEvent } from 'react';
import {
  Search,
  User,
  MapPin,
  Calendar,
  Loader2,
  AlertCircle,
  Info,
  Sparkles,
  Shield,
  Hash,
  Heart,
  ChevronRight,
  Fingerprint,
  Building2,
  Clock,
  BadgeCheck,
} from 'lucide-react';

// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------
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

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------
const WARD_ID = '6954';
const CENTER_ID = '84087';
const API_BASE =
  'https://voterinfoapi.amarvoterslip.com/api/v1/voters/filter';

// ----------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------
const engDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const bangDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

const toBanglaDigits = (value: string): string =>
  value.replace(/[0-9]/g, (d) => bangDigits[engDigits.indexOf(d)]);

// Auto-format DD/MM/YYYY from raw English digits
const formatDateInput = (raw: string): string => {
  let digits = raw.replace(/\D/g, '');
  digits = digits.slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4)
    return digits.slice(0, 2) + '/' + digits.slice(2);
  return (
    digits.slice(0, 2) +
    '/' +
    digits.slice(2, 4) +
    '/' +
    digits.slice(4)
  );
};

// DD/MM/YYYY → YYYY-MM-DD (for API)
const convertToApiDate = (dob: string): string => {
  const parts = dob.split('/');
  if (parts.length !== 3) return '';
  const [dd, mm, yyyy] = parts;
  return `${yyyy}-${mm}-${dd}`;
};

// YYYY-MM-DD → DD/MM/YYYY display
const formatDisplayDate = (isoDate: string): string => {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const [yyyy, mm, dd] = parts;
  return `${dd}/${mm}/${yyyy}`;
};

const getGenderLabel = (gender: string): string => {
  if (gender === 'M') return 'পুরুষ';
  if (gender === 'F') return 'মহিলা';
  return gender;
};

const getGenderIcon = (gender: string) => {
  if (gender === 'M') return '👨';
  if (gender === 'F') return '👩';
  return '👤';
};

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------
const VoterSearchForm: React.FC = () => {
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<VoterInfo[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleDobChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDob(formatDateInput(e.target.value));
  };

  const isDobValid = /^\d{2}\/\d{2}\/\d{4}$/.test(dob);
  const canSubmit = !loading && isDobValid;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setResults([]);
    setSearched(false);

    if (!isDobValid) {
      setError(
        'জন্ম তারিখ অবশ্যই DD/MM/YYYY ফরম্যাটে দিতে হবে (যেমন: 05/12/1995)।'
      );
      return;
    }

    setLoading(true);

    try {
      const apiDate = convertToApiDate(dob);

      const { data } = await axios.get<ApiResponse>(API_BASE, {
        params: {
          wardId: WARD_ID,
          centerId: CENTER_ID,
          dateOfBirth: apiDate,
        },
      });

      setSearched(true);

      if (data.success) {
        setResults(data.data || []);
        if (data.data.length === 0) {
          setError('দুঃখিত, কোনো তথ্য পাওয়া যায়নি।');
        }
      } else {
        setError(data.message || 'তথ্য খুঁজে পাওয়া যায়নি।');
      }
    } catch (err: unknown) {
      console.error('API Error:', err);
      if (axios.isAxiosError(err)) {
        const serverMessage = err.response?.data?.message;
        setError(serverMessage || 'তথ্য লোড করতে সমস্যা হয়েছে।');
      } else {
        setError('নেটওয়ার্ক বা অজানা সমস্যা দেখা দিয়েছে।');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafb] relative overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-200/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-teal-200/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-cyan-200/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-8">
        <div className="w-full max-w-3xl">
          {/* ═══════════ MAIN CARD ═══════════ */}
          <div className="relative">
            {/* Gradient border */}
            <div className="absolute -inset-[1.5px] rounded-[2rem] bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 opacity-60" />
            <div className="absolute -inset-[1.5px] rounded-[2rem] bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 blur-xl opacity-15" />

            <div className="relative bg-white rounded-[2rem] overflow-hidden shadow-2xl shadow-emerald-900/5">
              {/* ═══ HEADER ═══ */}
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500" />

                {/* Animated orbs */}
                <div className="absolute -right-10 -top-10 w-44 h-44 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute left-10 bottom-0 w-32 h-32 bg-teal-300/15 rounded-full blur-2xl" />
                <div className="absolute right-1/3 top-1/2 w-24 h-24 bg-emerald-300/10 rounded-full blur-xl" />

                {/* Dot pattern */}
                <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[size:24px_24px]" />

                <div className="relative px-6 py-7 md:px-10 md:py-9">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      {/* Live badge */}
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.12] backdrop-blur-md border border-white/[0.12] mb-4">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                        </span>
                        <span className="text-[10px] font-extrabold text-white/90 uppercase tracking-[0.2em]">
                          Jashore Sadar — Live
                        </span>
                      </div>

                      <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
                        ভোটার তথ্য অনুসন্ধান
                      </h1>
                      <p className="text-[13px] text-white/60 leading-relaxed max-w-md font-medium">
                        জন্ম তারিখ দিয়ে আপনার ভোটকেন্দ্রসহ অন্যান্য তথ্য
                        দেখুন
                      </p>
                    </div>

                    <div className="hidden md:flex flex-col items-end gap-2 shrink-0">
                      <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/[0.08] text-white/90 text-[11px] font-bold">
                        <MapPin className="w-3.5 h-3.5 text-emerald-200" />
                        ১৪ নং ইউনিয়ন — নরেন্দ্রপুর
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/[0.06] text-white/60 text-[10px] font-semibold">
                        <Building2 className="w-3 h-3" />
                        কেন্দ্র: বলরামপুর
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══ CONTENT ═══ */}
              <div className="px-5 md:px-10 py-7 md:py-9 space-y-7">
                {/* ═══ SEARCH SECTION ═══ */}
                <div className="relative">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-50/80 to-teal-50/40 border border-emerald-100/50" />
                  <div className="relative p-5 md:p-7 rounded-3xl">
                    {/* Search header */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-emerald-400 rounded-2xl blur-md opacity-30" />
                          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Search className="w-4.5 h-4.5 text-white" />
                          </div>
                        </div>
                        <div>
                          <h2 className="text-sm font-extrabold text-gray-900 tracking-tight">
                            তথ্য প্রদান করুন
                          </h2>
                          <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                            জন্ম তারিখ দিয়ে অনুসন্ধান করুন
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-emerald-700 bg-white px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-[0.15em] shadow-2xl shadow-gray-100">
                        <Shield className="w-3 h-3 text-emerald-500" />
                        সিকিউর
                      </div>
                    </div>

                    {/* Form */}
                    <form
                      onSubmit={handleSubmit}
                      className="flex flex-col sm:flex-row gap-3 items-start"
                    >
                      <div className="flex-1 w-full">
                        <label
                          htmlFor="dob"
                          className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2"
                        >
                          <Calendar className="w-3 h-3" />
                          Date of Birth (DD/MM/YYYY)
                        </label>
                        <div className="relative group">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-300 group-focus-within:text-emerald-500 transition-colors duration-300" />
                          <input
                            id="dob"
                            type="text"
                            inputMode="numeric"
                            value={dob}
                            onChange={handleDobChange}
                            placeholder="05/12/1995"
                            autoComplete="off"
                            className="
                              w-full pl-12 pr-4 py-3.5
                              bg-white text-base font-semibold
                              text-gray-900 placeholder:text-gray-300 placeholder:font-normal
                              border-2 border-gray-100
                              rounded-2xl
                              focus:outline-none focus:border-emerald-500
                              focus:ring-2 focus:ring-emerald-500/20
                              hover:border-emerald-200
                              transition-all duration-300
                              font-mono tracking-[0.15em]
                            "
                          />
                          {isDobValid && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              <BadgeCheck className="w-5 h-5 text-emerald-500" />
                            </div>
                          )}
                        </div>
                        <p className="mt-2 text-[10px] text-gray-400 flex items-center gap-1.5">
                          <Info className="w-3 h-3 text-gray-300" />
                          Type digits only, e.g.{' '}
                          <span className="font-bold text-emerald-600 font-mono">
                            10122004
                          </span>{' '}
                          → auto formats to{' '}
                          <span className="font-bold text-emerald-600 font-mono">
                            10/12/2004
                          </span>
                        </p>
                      </div>

                      <div className="w-full sm:w-auto sm:pt-[30px]">
                        <button
                          type="submit"
                          disabled={!canSubmit}
                          className={`
                            w-full sm:w-auto
                            px-7 py-3.5 rounded-2xl
                            text-sm font-bold
                            flex items-center justify-center gap-2.5
                            transition-all duration-300 active:scale-[0.96]
                            cursor-pointer
                            ${
                              !canSubmit
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40'
                            }
                          `}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              অনুসন্ধান চলছে...
                            </>
                          ) : (
                            <>
                              <Search className="w-4 h-4" />
                              তথ্য খুঁজুন
                            </>
                          )}
                        </button>
                      </div>
                    </form>

                    {/* Error */}
                    {error && (
                      <div className="mt-4 px-4 py-3.5 rounded-2xl bg-red-50 border-2 border-red-100 flex items-start gap-3 animate-in slide-in-from-top-2">
                        <div className="p-1 bg-red-100 rounded-lg shrink-0 mt-0.5">
                          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                        </div>
                        <p className="text-[12px] text-red-700 font-semibold leading-relaxed">
                          {error}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ═══ CURRENT SELECTION ═══ */}
                {dob && (
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                      নির্বাচিত:
                    </span>
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-[11px] shadow-2xl shadow-gray-100">
                      <Calendar className="w-3 h-3" />
                      {dob}
                    </span>
                    {isDobValid && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 text-[10px] text-gray-400 font-mono">
                        <ChevronRight className="w-3 h-3" />
                        API: {convertToApiDate(dob)}
                      </span>
                    )}
                  </div>
                )}

                {/* ═══ RESULTS SECTION ═══ */}
                <div className="relative">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-gray-50/60 to-white border border-gray-100/80" />
                  <div className="relative p-5 md:p-7 rounded-3xl">
                    {/* Results header */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-100 to-slate-100 flex items-center justify-center border border-gray-200/60">
                          <User className="w-4.5 h-4.5 text-gray-500" />
                        </div>
                        <div>
                          <h2 className="text-sm font-extrabold text-gray-900 tracking-tight">
                            অনুসন্ধানের ফলাফল
                          </h2>
                          <p className="text-[10px] text-gray-400 font-medium">
                            Search results will appear here
                          </p>
                        </div>
                      </div>
                      {searched && results.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 shadow-2xl shadow-gray-100">
                          <Sparkles className="w-3 h-3 text-emerald-500" />
                          {toBanglaDigits(results.length.toString())} জন
                          পাওয়া গেছে
                        </div>
                      )}
                    </div>

                    {/* Empty state */}
                    {!searched && !loading && (
                      <div className="text-center py-16">
                        <div className="relative w-20 h-20 mx-auto mb-5">
                          <div className="absolute inset-0 bg-emerald-100 rounded-3xl blur-xl opacity-40" />
                          <div className="relative w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl flex items-center justify-center border border-gray-200/60 shadow-inner">
                            <Search className="w-7 h-7 text-gray-300" />
                          </div>
                        </div>
                        <p className="text-sm font-bold text-gray-500 mb-1">
                          জন্ম তারিখ দিয়ে অনুসন্ধান করুন
                        </p>
                        <p className="text-[11px] text-gray-400">
                          ফলাফল এখানে দেখা যাবে
                        </p>
                      </div>
                    )}

                    {/* Loading */}
                    {loading && (
                      <div className="text-center py-16">
                        <div className="relative w-16 h-16 mx-auto mb-5">
                          <div className="absolute inset-0 rounded-full border-[3px] border-gray-100" />
                          <div className="absolute inset-0 rounded-full border-[3px] border-emerald-500 border-t-transparent animate-spin" />
                          <div className="absolute inset-2 rounded-full border-[2px] border-teal-400 border-b-transparent animate-spin direction-reverse" />
                        </div>
                        <p className="text-sm font-bold text-emerald-700">
                          ডাটা লোড হচ্ছে...
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          অনুগ্রহ করে অপেক্ষা করুন
                        </p>
                      </div>
                    )}

                    {/* ═══ RESULT CARDS ═══ */}
                    {searched && !loading && results.length > 0 && (
                      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                        {results.map((voter, index) => (
                          <div
                            key={voter.id}
                            className="
                              group relative bg-white rounded-3xl overflow-hidden
                              border-2 border-gray-100
                              hover:border-emerald-200
                              hover:shadow-2xl hover:shadow-emerald-100/40
                              transition-all duration-500
                            "
                            style={{
                              animationDelay: `${index * 80}ms`,
                            }}
                          >
                            {/* Top gradient accent */}
                            <div
                              className={`h-1 w-full bg-gradient-to-r ${
                                voter.gender === 'M'
                                  ? 'from-blue-400 via-indigo-400 to-blue-500'
                                  : 'from-pink-400 via-rose-400 to-pink-500'
                              }`}
                            />

                            {/* ─── Card Header ─── */}
                            <div className="px-5 md:px-6 py-5 border-b border-gray-50">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3.5">
                                  {/* Avatar */}
                                  <div className="relative">
                                    <div
                                      className={`absolute inset-0 rounded-2xl blur-md opacity-30 ${
                                        voter.gender === 'M'
                                          ? 'bg-blue-400'
                                          : 'bg-pink-400'
                                      }`}
                                    />
                                    <div
                                      className={`
                                        relative w-14 h-14 rounded-2xl
                                        flex items-center justify-center
                                        text-2xl shadow-lg shrink-0
                                        ${
                                          voter.gender === 'M'
                                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-200/50'
                                            : 'bg-gradient-to-br from-pink-500 to-rose-500 shadow-pink-200/50'
                                        }
                                      `}
                                    >
                                      {getGenderIcon(voter.gender)}
                                    </div>
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-black text-gray-900 leading-tight tracking-tight">
                                      {voter.voterName}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">
                                        <Hash className="w-2.5 h-2.5" />
                                        সিরিয়াল:{' '}
                                        {toBanglaDigits(voter.serialNo)}
                                      </span>
                                      <span
                                        className={`
                                          text-[9px] font-extrabold px-2 py-0.5 rounded-lg
                                          uppercase tracking-widest
                                          ${
                                            voter.gender === 'M'
                                              ? 'text-blue-600 bg-blue-50 border border-blue-100'
                                              : 'text-pink-600 bg-pink-50 border border-pink-100'
                                          }
                                        `}
                                      >
                                        {getGenderLabel(voter.gender)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* NID */}
                                <div className="text-right shrink-0">
                                  <span className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                                    <Fingerprint className="w-3 h-3" />
                                    NID
                                  </span>
                                  <span className="text-sm font-mono font-black text-emerald-700 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-1.5 rounded-xl border border-emerald-100 inline-block shadow-2xl shadow-gray-100">
                                    {toBanglaDigits(voter.nid)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* ─── Card Body ─── */}
                            <div className="px-5 md:px-6 py-5">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Father */}
                                <div className="flex items-start gap-3 group/item">
                                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover/item:scale-110 transition-transform duration-300">
                                    <User className="w-3.5 h-3.5 text-blue-400" />
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-[0.15em]">
                                      পিতা
                                    </p>
                                    <p className="text-[13px] font-bold text-gray-800 leading-tight mt-0.5">
                                      {voter.voterFather}
                                    </p>
                                  </div>
                                </div>

                                {/* Mother */}
                                <div className="flex items-start gap-3 group/item">
                                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover/item:scale-110 transition-transform duration-300">
                                    <Heart className="w-3.5 h-3.5 text-pink-400" />
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-[0.15em]">
                                      মাতা
                                    </p>
                                    <p className="text-[13px] font-bold text-gray-800 leading-tight mt-0.5">
                                      {voter.voterMother}
                                    </p>
                                  </div>
                                </div>

                                {/* DOB */}
                                <div className="flex items-start gap-3 group/item">
                                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover/item:scale-110 transition-transform duration-300">
                                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-[0.15em]">
                                      জন্ম তারিখ
                                    </p>
                                    <p className="text-[13px] font-bold text-gray-800 leading-tight mt-0.5 font-mono">
                                      {formatDisplayDate(voter.dob)}
                                    </p>
                                  </div>
                                </div>

                                {/* Area */}
                                <div className="flex items-start gap-3 group/item">
                                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover/item:scale-110 transition-transform duration-300">
                                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-[0.15em]">
                                      এলাকা
                                    </p>
                                    <p className="text-[13px] font-bold text-gray-800 leading-tight mt-0.5">
                                      {voter.voterAreaName}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* ─── Card Footer ─── */}
                            <div className="px-5 md:px-6 py-3.5 bg-gradient-to-r from-emerald-50/80 to-teal-50/60 border-t border-emerald-100/60">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span className="text-[11px] text-gray-600 font-medium">
                                    <span className="font-bold text-emerald-700">
                                      ঠিকানা:
                                    </span>{' '}
                                    {voter.address || 'তথ্য নেই'}
                                  </span>
                                </div>
                                {voter.centerName && (
                                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                                    <Building2 className="w-3 h-3" />
                                    কেন্দ্র: {voter.centerName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* No results */}
                    {searched &&
                      !loading &&
                      results.length === 0 &&
                      !error && (
                        <div className="text-center py-16">
                          <div className="relative w-20 h-20 mx-auto mb-5">
                            <div className="absolute inset-0 bg-red-100 rounded-3xl blur-xl opacity-30" />
                            <div className="relative w-20 h-20 bg-gradient-to-br from-red-50 to-rose-50 rounded-3xl flex items-center justify-center border border-red-100">
                              <AlertCircle className="w-7 h-7 text-red-300" />
                            </div>
                          </div>
                          <p className="text-sm font-bold text-gray-600 mb-1">
                            কোনো তথ্য পাওয়া যায়নি
                          </p>
                          <p className="text-[11px] text-gray-400">
                            জন্ম তারিখ সঠিকভাবে দিয়ে আবার চেষ্টা করুন
                          </p>
                        </div>
                      )}
                  </div>
                </div>

                {/* ═══ FOOTER ═══ */}
                <div className="flex items-center justify-center gap-2 pt-2">
                  <span className="text-[11px] text-gray-400 font-medium">
                    Developed by
                  </span>
                  <a
                    href="https://www.mazaharul.site"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 hover:text-emerald-700 font-bold hover:underline underline-offset-2 transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    মাজাহারুল 
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoterSearchForm;