'use client';

import axios from 'axios';
import React, { useState, useRef, useEffect, FormEvent, ChangeEvent } from 'react';
import {
    Search,
    User,
    MapPin,
    Calendar,
    Loader2,
    AlertCircle,
    Sparkles,
    Shield,
    Heart,
    Fingerprint,
    Building2,
    Clock,
    BadgeCheck,
    ChevronDown,
    Globe,
    CheckCircle2,
    X,
} from 'lucide-react';
import { VillageOption, VILLAGES } from './api/utils';

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────
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

const API_URL = '/api/voter';

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────
const bangDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const toBanglaDigits = (v: string): string => v.replace(/[0-9]/g, (d) => bangDigits[Number(d)]);

const formatDateInput = (raw: string): string => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
};

const convertToApiDate = (dob: string): string => {
    const [dd, mm, yyyy] = dob.split('/');
    return `${yyyy}-${mm}-${dd}`;
};

const formatDisplayDate = (iso: string): string => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return d && m && y ? `${d}/${m}/${y}` : iso;
};

const getGenderLabel = (g: string) => (g === 'M' ? 'পুরুষ' : g === 'F' ? 'মহিলা' : g);
const getGenderIcon = (g: string) => (g === 'M' ? '👨' : g === 'F' ? '👩' : '👤');

// ──────────────────────────────────────────────
// CUSTOM SELECT
// ──────────────────────────────────────────────
const CustomSelect: React.FC<{
    value: string;
    onChange: (val: string) => void;
    options: VillageOption[];
}> = ({ value, onChange, options }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selected = options.find((o) => o.id === value);
    const filtered = options.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()));

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (open && inputRef.current) inputRef.current.focus();
    }, [open]);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => {
                    setOpen(!open);
                    setSearch('');
                }}
                className={`
          w-full flex items-center gap-3 pl-4 pr-4 py-3.5 sm:py-4
          bg-white/80 backdrop-blur-sm
          border rounded-2xl
          text-left transition-all duration-300
          group cursor-pointer
          ${
              open
                  ? 'border-emerald-400 ring-4 ring-emerald-400/15 shadow-lg shadow-emerald-500/10'
                  : value
                    ? 'border-emerald-300 hover:border-emerald-400 shadow-2xl shadow-gray-100'
                    : 'border-slate-200/80 hover:border-slate-300 shadow-2xl shadow-gray-100'
          }
        `}
            >
                <div
                    className={`
            w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300
            ${
                value
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30'
                    : 'bg-slate-100/80 group-hover:bg-slate-200/60'
            }
          `}
                >
                    <Globe
                        className={`w-[18px] h-[18px] transition-colors ${value ? 'text-white' : 'text-slate-400'}`}
                    />
                </div>
                <div className="flex-1 min-w-0">
                    {selected ? (
                        <div>
                            <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider leading-none">
                                নির্বাচিত গ্রাম
                            </p>
                            <p className="text-sm font-bold text-slate-800 mt-1 truncate">
                                {selected.name}
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 font-medium">গ্রাম নির্বাচন করুন...</p>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {value && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange('');
                                setOpen(false);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                    )}
                    <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
                            open ? 'rotate-180' : ''
                        }`}
                    />
                </div>
            </button>

            {open && (
                <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-slate-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="গ্রামের নাম খুঁজুন..."
                                className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 rounded-xl border border-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/15 transition-all duration-200"
                            />
                        </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto p-1.5 custom-scrollbar">
                        {filtered.length === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-xs text-slate-400">কোনো গ্রাম পাওয়া যায়নি</p>
                            </div>
                        ) : (
                            filtered.map((opt, i) => {
                                const isSelected = opt.id === value;
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => {
                                            onChange(opt.id);
                                            setOpen(false);
                                            setSearch('');
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer group/opt ${
                                            isSelected
                                                ? 'bg-emerald-50 border border-emerald-200'
                                                : 'hover:bg-slate-50 border border-transparent'
                                        }`}
                                    >
                                        <div
                                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 transition-all duration-200 ${
                                                isSelected
                                                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                                                    : 'bg-slate-100 text-slate-400 group-hover/opt:bg-slate-200'
                                            }`}
                                        >
                                            {isSelected ? (
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                            ) : (
                                                toBanglaDigits((i + 1).toString())
                                            )}
                                        </div>
                                        <span
                                            className={`text-sm font-semibold truncate ${
                                                isSelected ? 'text-emerald-700' : 'text-slate-700'
                                            }`}
                                        >
                                            {opt.name}
                                        </span>
                                        {isSelected && (
                                            <BadgeCheck className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                    <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/80">
                        <p className="text-[10px] text-slate-400 font-medium text-center">
                            মোট {toBanglaDigits(options.length.toString())} টি গ্রাম
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

// ──────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────
const VoterSearchForm: React.FC = () => {
    const [wardId, setWardId] = useState('');
    const [dob, setDob] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<VoterInfo[]>([]);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState('');

    // ── centerId is derived from wardId, no separate state needed ──
    const selectedVillage = VILLAGES.find((v) => v.id === wardId);
    const centerId = selectedVillage?.centerId || '';
    const selectedVillageName = selectedVillage?.name || '';

    const handleDobChange = (e: ChangeEvent<HTMLInputElement>) =>
        setDob(formatDateInput(e.target.value));

    const isDobValid = /^\d{2}\/\d{2}\/\d{4}$/.test(dob);
    const canSubmit = !loading && isDobValid && wardId !== '';

    // ── Fixed: onChange receives the new wardId from CustomSelect ──
    const handleVillageChange = (newWardId: string) => {
        setWardId(newWardId);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setResults([]);
        setSearched(false);

        if (!wardId) {
            setError('অনুগ্রহ করে একটি গ্রাম নির্বাচন করুন।');
            return;
        }
        if (!centerId) {
            setError('কেন্দ্র তথ্য পাওয়া যায়নি। গ্রাম পুনরায় নির্বাচন করুন।');
            return;
        }
        if (!isDobValid) {
            setError('জন্ম তারিখ DD/MM/YYYY ফরম্যাটে দিন (যেমন 05/12/1995)।');
            return;
        }

        setLoading(true);
        try {
            const { data } = await axios.get<ApiResponse>(API_URL, {
                params: { wardId, centerId, dateOfBirth: convertToApiDate(dob) },
            });
            setSearched(true);
            if (data.success) {
                setResults(data.data || []);
                if (!data.data?.length) setError('দুঃখিত, কোনো তথ্য পাওয়া যায়নি।');
            } else {
                setError(data.message || 'তথ্য খুঁজে পাওয়া যায়নি।');
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || 'তথ্য লোড করতে সমস্যা হয়েছে।');
            } else {
                setError('নেটওয়ার্ক বা অজানা সমস্যা দেখা দিয়েছে।');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafb] relative overflow-hidden">
            {/* ── Clean Subtle Background ── */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-emerald-100/30 to-transparent rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-sky-100/20 to-transparent rounded-full blur-[100px]" />
                <div className="absolute inset-0 opacity-[0.015] bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.15)_0.5px,transparent_0)] bg-[size:24px_24px]" />
            </div>

            <div className="relative z-10 flex items-center justify-center min-h-screen px-3 py-6 sm:px-4 sm:py-10">
                <div className="w-full max-w-3xl">
                    <div className="relative">
                        <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-slate-200/30 via-transparent to-slate-200/20 blur-xl" />

                        <div className="relative bg-white rounded-[1.75rem] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-slate-200/60">
                            {/* ═══ HEADER ═══ */}
                            <div className="relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
                                <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/[0.07] rounded-full blur-[80px]" />
                                <div className="absolute -left-20 bottom-0 w-60 h-60 bg-sky-500/[0.05] rounded-full blur-[60px]" />

                                <div className="relative px-5 py-7 sm:px-8 sm:py-9">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-3 sm:space-y-4">
                                            <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/[0.08]">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                                                </span>
                                                <span className="text-[9px] sm:text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">
                                                    যশোর সদর — সক্রিয়
                                                </span>
                                            </div>

                                            <div>
                                                <h1 className="text-[22px] sm:text-2xl md:text-[30px] font-black text-white tracking-tight leading-[1.2]">
                                                    ভোটার তথ্য
                                                    <span className="block text-emerald-400/80 mt-0.5">
                                                        অনুসন্ধান
                                                    </span>
                                                </h1>
                                                <p className="text-[11px] sm:text-[13px] text-white/30 leading-relaxed max-w-sm font-medium mt-2.5">
                                                    গ্রাম ও জন্ম তারিখ দিয়ে আপনার ভোটকেন্দ্রসহ সকল
                                                    তথ্য দেখুন
                                                </p>
                                            </div>

                                            <div className="flex sm:hidden flex-wrap gap-1.5">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.08] text-white/60 text-[9px] font-semibold">
                                                    <MapPin className="w-3 h-3 text-emerald-400/70" />
                                                    ১৪ নং ইউনিয়ন
                                                </span>
                                            </div>
                                        </div>

                                        <div className="hidden sm:flex flex-col items-end gap-2 shrink-0 mt-1">
                                            <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.07] backdrop-blur-xl text-white/70 text-[11px] font-semibold">
                                                <MapPin className="w-3.5 h-3.5 text-emerald-400/70" />
                                                ১৪ নং ইউনিয়ন — নরেন্দ্রপুর
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ═══ CONTENT ═══ */}
                            <div className="px-4 sm:px-8 py-6 sm:py-8 space-y-6">
                                {/* ═══ SEARCH SECTION ═══ */}
                                <div className="relative">
                                    <div className="rounded-2xl bg-slate-50/80 border border-slate-200/60 p-4 sm:p-7">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white flex items-center justify-center shadow-2xl shadow-gray-100 border border-slate-200/80">
                                                    <Search className="w-[18px] h-[18px] text-slate-600" />
                                                </div>
                                                <div>
                                                    <h2 className="text-[13px] sm:text-[15px] font-extrabold text-slate-800 tracking-tight">
                                                        তথ্য প্রদান করুন
                                                    </h2>
                                                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium mt-0.5">
                                                        গ্রাম নির্বাচন ও জন্ম তারিখ দিন
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="hidden sm:flex items-center gap-1.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 uppercase tracking-[0.12em]">
                                                <Shield className="w-3 h-3 text-emerald-500" />
                                                নিরাপদ
                                            </div>
                                        </div>

                                        <form
                                            onSubmit={handleSubmit}
                                            className="space-y-4 sm:space-y-5"
                                        >
                                            {/* Village */}
                                            <div>
                                                <label className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em] mb-2.5 pl-1">
                                                    <Globe className="w-3 h-3" />
                                                    গ্রাম নির্বাচন করুন
                                                </label>
                                                <CustomSelect
                                                    value={wardId}
                                                    onChange={handleVillageChange}
                                                    options={VILLAGES}
                                                />
                                                {/* Show auto-detected center */}
                                                {centerId && (
                                                    <div className="mt-2 flex items-center gap-1.5 pl-1">
                                                        <Building2 className="w-3 h-3 text-emerald-500" />
                                                        <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium">
                                                            কেন্দ্র আইডি:
                                                            <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 ml-1 font-mono">
                                                                {toBanglaDigits(centerId)}
                                                            </span>
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* DOB */}
                                            <div>
                                                <label
                                                    htmlFor="dob"
                                                    className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em] mb-2.5 pl-1"
                                                >
                                                    <Calendar className="w-3 h-3" />
                                                    জন্ম তারিখ (DD/MM/YYYY)
                                                </label>
                                                <div className="relative group">
                                                    <div className="relative flex items-center bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 group-focus-within:border-emerald-400 group-focus-within:ring-4 group-focus-within:ring-emerald-400/15 transition-all duration-300 shadow-2xl shadow-gray-100">
                                                        <div className="pl-4">
                                                            <Calendar
                                                                className={`w-4 h-4 transition-colors duration-300 ${
                                                                    isDobValid
                                                                        ? 'text-emerald-500'
                                                                        : 'text-slate-300'
                                                                }`}
                                                            />
                                                        </div>
                                                        <input
                                                            id="dob"
                                                            type="text"
                                                            inputMode="numeric"
                                                            value={dob}
                                                            onChange={handleDobChange}
                                                            placeholder="05/12/1995"
                                                            autoComplete="off"
                                                            className="w-full px-3 py-3.5 sm:py-4 bg-transparent text-sm sm:text-base font-bold text-slate-800 placeholder:text-slate-300 placeholder:font-normal focus:outline-none font-mono tracking-[0.15em]"
                                                        />
                                                        {isDobValid && (
                                                            <div className="pr-4">
                                                                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/25">
                                                                    <BadgeCheck className="w-4 h-4 text-white" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="mt-2 text-[9px] sm:text-[10px] text-slate-400 flex items-center gap-1.5 pl-1">
                                                    উদাহরণ:
                                                    <span className="font-bold text-slate-600 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                        10/12/2004
                                                    </span>
                                                </p>
                                            </div>

                                            {/* Submit */}
                                            <div className="pt-1">
                                                <button
                                                    type="submit"
                                                    disabled={!canSubmit}
                                                    className={`relative w-full py-4 sm:py-[18px] rounded-2xl text-[13px] sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all duration-500 active:scale-[0.98] overflow-hidden cursor-pointer ${
                                                        !canSubmit
                                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                                            : 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 hover:shadow-slate-900/30 hover:bg-slate-800'
                                                    }`}
                                                >
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
                                                            </>
                                                        )}
                                                    </span>
                                                </button>
                                            </div>
                                        </form>

                                        {error && (
                                            <div className="mt-5 px-4 py-3.5 rounded-xl sm:rounded-2xl bg-red-50 border border-red-200/80 flex items-start gap-3">
                                                <div className="p-1.5 bg-red-100 rounded-lg shrink-0 mt-0.5">
                                                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                                                </div>
                                                <p className="text-[11px] sm:text-[12px] text-red-700 font-semibold leading-relaxed">
                                                    {error}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ═══ TAGS ═══ */}
                                {(wardId || dob) && (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                                            নির্বাচিত
                                        </span>
                                        {wardId && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px]">
                                                <Globe className="w-3 h-3 text-emerald-500" />
                                                {selectedVillageName}
                                            </span>
                                        )}
                                        {centerId && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 font-bold text-[10px] font-mono">
                                                <Building2 className="w-3 h-3 text-slate-400" />
                                                কেন্দ্র: {toBanglaDigits(centerId)}
                                            </span>
                                        )}
                                        {dob && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 font-bold text-[10px] font-mono">
                                                <Calendar className="w-3 h-3 text-sky-500" />
                                                {dob}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* ═══ RESULTS SECTION ═══ */}
                                <div className="relative">
                                    <div className="rounded-2xl bg-white border border-slate-200/60 shadow-2xl shadow-gray-100">
                                        <div className="p-4 sm:p-7">
                                            <div className="flex items-center justify-between mb-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-200/80">
                                                        <User className="w-[18px] h-[18px] text-slate-500" />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-[13px] sm:text-[15px] font-extrabold text-slate-800 tracking-tight">
                                                            অনুসন্ধানের ফলাফল
                                                        </h2>
                                                        <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
                                                            ফলাফল এখানে প্রদর্শিত হবে
                                                        </p>
                                                    </div>
                                                </div>
                                                {searched && results.length > 0 && (
                                                    <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                                                        <Sparkles className="w-3 h-3 text-emerald-500" />
                                                        {toBanglaDigits(results.length.toString())}{' '}
                                                        জন
                                                    </div>
                                                )}
                                            </div>

                                            {/* Empty */}
                                            {!searched && !loading && (
                                                <div className="text-center py-14 sm:py-20">
                                                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-5">
                                                        <div className="relative w-full h-full bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-200/60">
                                                            <Search className="w-7 h-7 sm:w-9 sm:h-9 text-slate-200" />
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-500 mb-1.5">
                                                        গ্রাম ও জন্ম তারিখ দিয়ে অনুসন্ধান করুন
                                                    </p>
                                                    <p className="text-[11px] text-slate-400">
                                                        ফলাফল এখানে দেখা যাবে
                                                    </p>
                                                </div>
                                            )}

                                            {/* Loading */}
                                            {loading && (
                                                <div className="text-center py-14 sm:py-20">
                                                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6">
                                                        <div className="absolute inset-0 rounded-full border-[3px] border-slate-100" />
                                                        <div className="absolute inset-0 rounded-full border-[3px] border-slate-800 border-t-transparent animate-spin" />
                                                        <div className="absolute inset-3 rounded-full border-[2px] border-emerald-400/60 border-b-transparent animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="w-3 h-3 rounded-full bg-slate-700 animate-pulse" />
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-700">
                                                        ডাটা লোড হচ্ছে...
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 mt-1">
                                                        অনুগ্রহ করে অপেক্ষা করুন
                                                    </p>
                                                </div>
                                            )}

                                            {/* ═══ RESULT CARDS ═══ */}
                                            {searched && !loading && results.length > 0 && (
                                                <div className="space-y-4 max-h-[650px] overflow-y-auto pr-1 custom-scrollbar">
                                                    {results.map((voter, index) => (
                                                        <div
                                                            key={voter.id}
                                                            className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 transition-all duration-400"
                                                            style={{
                                                                animationDelay: `${index * 80}ms`,
                                                                animation:
                                                                    'fadeSlideIn 0.4s ease-out forwards',
                                                            }}
                                                        >
                                                            <div
                                                                className={`h-[3px] w-full ${
                                                                    voter.gender === 'M'
                                                                        ? 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500'
                                                                        : 'bg-gradient-to-r from-pink-400 via-rose-400 to-fuchsia-400'
                                                                }`}
                                                            />

                                                            <div className="px-4 sm:px-6 pt-5 pb-4">
                                                                <div className="flex items-start gap-3 sm:gap-4">
                                                                    <div className="relative shrink-0">
                                                                        <div
                                                                            className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl sm:text-2xl shadow-lg ${
                                                                                voter.gender === 'M'
                                                                                    ? 'bg-gradient-to-br from-sky-500 to-blue-600 shadow-sky-200/40'
                                                                                    : 'bg-gradient-to-br from-pink-500 to-rose-500 shadow-pink-200/40'
                                                                            }`}
                                                                        >
                                                                            {getGenderIcon(
                                                                                voter.gender,
                                                                            )}
                                                                        </div>
                                                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-2xl shadow-gray-100 border border-slate-100">
                                                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex-1 min-w-0 pt-0.5">
                                                                        <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight tracking-tight truncate">
                                                                            {voter.voterName}
                                                                        </h3>
                                                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                                            <span
                                                                                className={`text-[8px] sm:text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest ${
                                                                                    voter.gender ===
                                                                                    'M'
                                                                                        ? 'text-sky-600 bg-sky-50 border border-sky-100'
                                                                                        : 'text-pink-600 bg-pink-50 border border-pink-100'
                                                                                }`}
                                                                            >
                                                                                {getGenderLabel(
                                                                                    voter.gender,
                                                                                )}
                                                                            </span>
                                                                            <span className="w-px h-3 bg-slate-200" />
                                                                            <span className="text-[9px] sm:text-[10px] font-medium text-slate-400">
                                                                                সিরিয়াল #
                                                                                {toBanglaDigits(
                                                                                    voter.serialNo,
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="mt-4 relative overflow-hidden rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/80">
                                                                    <div className="flex items-center justify-between px-4 py-3">
                                                                        <div className="flex items-center gap-2.5">
                                                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-slate-200/80 shadow-2xl shadow-gray-100">
                                                                                <Fingerprint className="w-4 h-4 text-slate-600" />
                                                                            </div>
                                                                            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em]">
                                                                                ভোটার নম্বর
                                                                            </span>
                                                                        </div>
                                                                        <span className="text-[14px] sm:text-base font-mono font-black text-slate-800 tracking-[0.08em]">
                                                                            {toBanglaDigits(
                                                                                voter.nid,
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="px-4 sm:px-6 pb-4">
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                                                                    {[
                                                                        {
                                                                            label: 'পিতা',
                                                                            value: voter.voterFather,
                                                                            icon: (
                                                                                <User className="w-3.5 h-3.5" />
                                                                            ),
                                                                            color: 'text-sky-500',
                                                                            bg: 'bg-sky-50',
                                                                            border: 'border-sky-100',
                                                                        },
                                                                        {
                                                                            label: 'মাতা',
                                                                            value: voter.voterMother,
                                                                            icon: (
                                                                                <Heart className="w-3.5 h-3.5" />
                                                                            ),
                                                                            color: 'text-rose-500',
                                                                            bg: 'bg-rose-50',
                                                                            border: 'border-rose-100',
                                                                        },
                                                                        {
                                                                            label: 'জন্ম তারিখ',
                                                                            value: formatDisplayDate(
                                                                                voter.dob,
                                                                            ),
                                                                            icon: (
                                                                                <Clock className="w-3.5 h-3.5" />
                                                                            ),
                                                                            color: 'text-amber-500',
                                                                            bg: 'bg-amber-50',
                                                                            border: 'border-amber-100',
                                                                            mono: true,
                                                                        },
                                                                        {
                                                                            label: 'এলাকা',
                                                                            value: voter.voterAreaName,
                                                                            icon: (
                                                                                <MapPin className="w-3.5 h-3.5" />
                                                                            ),
                                                                            color: 'text-emerald-500',
                                                                            bg: 'bg-emerald-50',
                                                                            border: 'border-emerald-100',
                                                                        },
                                                                    ].map((item) => (
                                                                        <div
                                                                            key={item.label}
                                                                            className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-slate-50/60 border border-slate-100 hover:bg-slate-50 transition-colors duration-300 group/item"
                                                                        >
                                                                            <div
                                                                                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 ${item.bg} border ${item.border} group-hover/item:scale-105 transition-transform duration-300`}
                                                                            >
                                                                                <span
                                                                                    className={
                                                                                        item.color
                                                                                    }
                                                                                >
                                                                                    {item.icon}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] leading-none">
                                                                                    {item.label}
                                                                                </p>
                                                                                <p
                                                                                    className={`text-[12px] sm:text-[13px] font-bold text-slate-800 leading-tight mt-0.5 truncate ${
                                                                                        item.mono
                                                                                            ? 'font-mono'
                                                                                            : ''
                                                                                    }`}
                                                                                >
                                                                                    {item.value}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className="px-4 sm:px-6 py-3.5 bg-slate-50/80 border-t border-slate-100">
                                                                <div className="flex flex-col gap-2">
                                                                    <div className="flex items-start gap-2">
                                                                        <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                                                        <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-relaxed">
                                                                            <span className="font-bold text-slate-700">
                                                                                ঠিকানা:
                                                                            </span>{' '}
                                                                            {voter.address ||
                                                                                'তথ্য নেই'}
                                                                        </p>
                                                                    </div>
                                                                    {voter.centerName && (
                                                                        <div className="flex items-center gap-2">
                                                                            <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                                                                            <span className="text-[9px] sm:text-[10px] font-bold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                                                                                কেন্দ্র:{' '}
                                                                                {voter.centerName}
                                                                            </span>
                                                                        </div>
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
                                                    <div className="text-center py-14 sm:py-20">
                                                        <div className="relative w-20 h-20 mx-auto mb-5">
                                                            <div className="relative w-full h-full bg-red-50 rounded-3xl flex items-center justify-center border border-red-100">
                                                                <AlertCircle className="w-7 h-7 text-red-300" />
                                                            </div>
                                                        </div>
                                                        <p className="text-sm font-bold text-slate-600 mb-1.5">
                                                            কোনো তথ্য পাওয়া যায়নি
                                                        </p>
                                                        <p className="text-[11px] text-slate-400">
                                                            সঠিক গ্রাম ও জন্ম তারিখ দিয়ে আবার
                                                            চেষ্টা করুন
                                                        </p>
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                </div>

                                {/* ═══ FOOTER ═══ */}
                                <div className="flex items-center justify-center gap-2.5 pt-2 pb-1">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200/60" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            Built by
                                        </span>
                                        <a
                                            href="https://www.mazaharul.site"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-[10px] text-slate-600 hover:text-slate-800 font-bold transition-colors"
                                        >
                                            <Sparkles className="w-3 h-3" />
                                            Mazaharul
                                        </a>
                                    </div>
                                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200/60" />
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