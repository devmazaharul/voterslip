"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAdminLayout } from "../components/contex";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════
interface VoterStat {
  _id: string;
  village: string;
  totalChecks: number;
  totalResultsServed: number;
  fromDB: number;
  fromAPI: number;
  lastCheckedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface Summary {
  totalVillages: number;
  totalChecks: number;
  totalResultsServed: number;
  totalFromDB: number;
  totalFromAPI: number;
}

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════
const BANGLA_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

const toBangla = (num: number | string): string =>
  String(num)
    .split("")
    .map((d) => {
      const n = parseInt(d);
      return isNaN(n) ? d : BANGLA_DIGITS[n];
    })
    .join("");

const formatNumber = (num: number): string =>
  toBangla(num.toLocaleString("en-IN"));

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${toBangla(days)} দিন আগে`;
  if (hours > 0) return `${toBangla(hours)} ঘণ্টা আগে`;
  if (minutes > 0) return `${toBangla(minutes)} মিনিট আগে`;
  return "এইমাত্র";
};

type SortKey = "totalChecks" | "totalResultsServed" | "fromDB" | "fromAPI";

// ═══════════════════════════════════════════
// Summary Card
// ═══════════════════════════════════════════
function SummaryCard({
  icon,
  label,
  value,
  iconBg,
  iconColor,
  valueBg,
  borderHover,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
  valueBg: string;
  borderHover: string;
}) {
  return (
    <div
      className={`relative bg-white/[0.03] backdrop-blur-xl border
                  border-white/[0.06] rounded-2xl p-4 sm:p-5
                  transition-all duration-300 group cursor-default
                  hover:border-white/[0.12] ${borderHover}
                  hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20`}
    >
      {/* Top accent line */}
      <div
        className={`absolute top-0 left-4 right-4 h-[2px] rounded-full
                    ${valueBg} opacity-40 group-hover:opacity-80
                    transition-opacity`}
      />

      <div className="flex items-start gap-3.5">
        <div
          className={`w-11 h-11 ${iconBg} rounded-xl flex items-center
                      justify-center shrink-0 border border-white/[0.04]`}
        >
          <div className={iconColor}>{icon}</div>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1">
            {label}
          </p>
          <p className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Stat Row (Mobile Card + Desktop Row)
// ═══════════════════════════════════════════
function StatRow({
  stat,
  index,
  expanded,
  onToggle,
}: {
  stat: VoterStat;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const rowDbPercent =
    stat.totalChecks > 0
      ? Math.round((stat.fromDB / stat.totalChecks) * 100)
      : 0;

  const rankIcon =
    index === 0
      ? "🥇"
      : index === 1
        ? "🥈"
        : index === 2
          ? "🥉"
          : null;

  const rankColor =
    index === 0
      ? "text-yellow-400"
      : index === 1
        ? "text-gray-300"
        : index === 2
          ? "text-amber-600"
          : "text-gray-600";

  return (
    <div
      className={`border-b border-white/[0.04] last:border-b-0
                  transition-colors hover:bg-white/[0.02]`}
    >
      {/* ─── Mobile View (Card Style) ─── */}
      <button
        onClick={onToggle}
        className="w-full text-left cursor-pointer lg:hidden"
      >
        <div className="px-4 py-3.5 flex items-center gap-3">
          {/* Rank */}
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center
                        shrink-0 ${
                          index < 3 ? "bg-white/[0.06]" : "bg-white/[0.03]"
                        }`}
          >
            {rankIcon ? (
              <span className="text-sm">{rankIcon}</span>
            ) : (
              <span className={`text-xs font-bold ${rankColor}`}>
                {toBangla(index + 1)}
              </span>
            )}
          </div>

          {/* Village + quick stats */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">
              {stat.village}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded">
                {formatNumber(stat.totalChecks)} সার্চ
              </span>
              <span className="text-[10px] text-gray-500">
                {timeAgo(stat.lastCheckedAt)}
              </span>
            </div>
          </div>

          {/* DB % badge */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                rowDbPercent >= 70
                  ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/15"
                  : rowDbPercent >= 40
                    ? "text-amber-400 bg-amber-500/10 border border-amber-500/15"
                    : "text-red-400 bg-red-500/10 border border-red-500/15"
              }`}
            >
              DB {toBangla(rowDbPercent)}%
            </span>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${
                expanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </div>
        </div>
      </button>

      {/* Mobile expanded details */}
      {expanded && (
        <div className="lg:hidden px-4 pb-4 animate-slide-down">
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <MiniStat
              label="মোট সার্চ"
              value={formatNumber(stat.totalChecks)}
              colorClass="text-purple-300"
              bgClass="bg-purple-500/10"
            />
            <MiniStat
              label="ভোটার দেখানো"
              value={formatNumber(stat.totalResultsServed)}
              colorClass="text-blue-300"
              bgClass="bg-blue-500/10"
            />
            <MiniStat
              label="DB হিট"
              value={formatNumber(stat.fromDB)}
              colorClass="text-emerald-300"
              bgClass="bg-emerald-500/10"
            />
            <MiniStat
              label="API হিট"
              value={formatNumber(stat.fromAPI)}
              colorClass="text-rose-300"
              bgClass="bg-rose-500/10"
            />
          </div>

          {/* Mini progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[9px] text-gray-500 mb-1.5">
              <span>DB vs API</span>
              <span>
                💾 {toBangla(rowDbPercent)}% / 🌐{" "}
                {toBangla(100 - rowDbPercent)}%
              </span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden flex">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                style={{ width: `${rowDbPercent}%` }}
              />
              <div
                className="bg-gradient-to-r from-rose-500 to-amber-400 rounded-full transition-all duration-700"
                style={{ width: `${100 - rowDbPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Desktop View (Table Row) ─── */}
      <div className="hidden lg:grid grid-cols-[50px_2fr_1fr_1fr_1fr_1fr_1.2fr] gap-3 px-5 py-3.5 items-center">
        {/* Rank */}
        <div className="flex items-center justify-center">
          {rankIcon ? (
            <span className="text-base">{rankIcon}</span>
          ) : (
            <span className={`text-sm font-bold ${rankColor}`}>
              {toBangla(index + 1)}
            </span>
          )}
        </div>

        {/* Village */}
        <span className="text-sm font-semibold text-white truncate">
          {stat.village}
        </span>

        {/* Checks */}
        <span className="text-sm font-semibold text-purple-300">
          {formatNumber(stat.totalChecks)}
        </span>

        {/* Results */}
        <span className="text-sm font-semibold text-blue-300">
          {formatNumber(stat.totalResultsServed)}
        </span>

        {/* DB */}
        <div>
          <span className="text-sm font-semibold text-emerald-400">
            {formatNumber(stat.fromDB)}
          </span>
          <span className="text-[10px] text-gray-600 ml-1.5">
            ({toBangla(rowDbPercent)}%)
          </span>
        </div>

        {/* API */}
        <span className="text-sm font-semibold text-rose-400">
          {formatNumber(stat.fromAPI)}
        </span>

        {/* Last checked */}
        <span className="text-xs text-gray-500">
          {timeAgo(stat.lastCheckedAt)}
        </span>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  colorClass,
  bgClass,
}: {
  label: string;
  value: string;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">
      <p className="text-[9px] text-gray-500 uppercase tracking-wider font-medium mb-1">
        {label}
      </p>
      <p className={`text-sm font-bold ${colorClass}`}>{value}</p>
    </div>
  );
}

// ═══════════════════════════════════════════
// Main Dashboard
// ═══════════════════════════════════════════
export default function DashboardPage() {
  const { setSidebarOpen, handleLogout } = useAdminLayout();

  const [stats, setStats] = useState<VoterStat[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("totalChecks");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // ─── Fetch ───
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/log");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setSummary(data.summary);
      } else {
        setError(data.error || "কিছু ভুল হয়েছে!");
      }
    } catch {
      setError("সার্ভারে কানেক্ট করতে পারছে না!");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ─── Derived ───
  const filteredStats = useMemo(
    () =>
      stats
        .filter((s) => s.village.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => b[sortBy] - a[sortBy]),
    [stats, search, sortBy]
  );

  const dbPercent = useMemo(
    () =>
      summary && summary.totalChecks > 0
        ? Math.round((summary.totalFromDB / summary.totalChecks) * 100)
        : 0,
    [summary]
  );

  const apiPercent = useMemo(
    () =>
      summary && summary.totalChecks > 0
        ? Math.round((summary.totalFromAPI / summary.totalChecks) * 100)
        : 0,
    [summary]
  );

  const sortOptions: { key: SortKey; label: string; icon: string }[] = [
    { key: "totalChecks", label: "সর্বাধিক সার্চ", icon: "🔍" },
    { key: "totalResultsServed", label: "সর্বাধিক ভোটার", icon: "👥" },
    { key: "fromDB", label: "সর্বাধিক DB হিট", icon: "💾" },
    { key: "fromAPI", label: "সর্বাধিক API হিট", icon: "🌐" },
  ];

  const currentSort = sortOptions.find((o) => o.key === sortBy)!;

  // ═══════════════════════════════════
  // RENDER
  // ═══════════════════════════════════
  return (
    <>
      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-30 bg-[#06060a]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex items-center justify-between px-4 lg:px-6 py-3">
          {/* Mobile menu */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 cursor-pointer text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/[0.05]"
            aria-label="মেনু খুলুন"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {/* Desktop title */}
          <h1 className="text-base font-semibold hidden lg:flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            পরিসংখ্যান ড্যাশবোর্ড
          </h1>

          {/* Mobile title */}
          <h1 className="text-sm font-semibold lg:hidden bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            পরিসংখ্যান
          </h1>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Refresh */}
            <button
              onClick={fetchStats}
              disabled={loading}
              className="p-2 cursor-pointer text-gray-400 hover:text-purple-400 transition-colors rounded-lg hover:bg-white/[0.05] disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="রিফ্রেশ"
            >
              <svg
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
            </button>

            {/* Mobile logout */}
            <button
              onClick={handleLogout}
              className="lg:hidden p-2 cursor-pointer text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-white/[0.05]"
              aria-label="লগআউট"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ═══ PAGE CONTENT ═══ */}
      <div className="relative overflow-hidden">
        {/* Background */}
        <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-purple-600/[0.07] rounded-full blur-[180px]" />
          <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-blue-600/[0.07] rounded-full blur-[180px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/[0.03] rounded-full blur-[200px]" />
          <div
            className="absolute inset-0 opacity-[0.012]"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col">
          {/* ═══ HERO ═══ */}
          <div className="pt-8 pb-4 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex justify-center mb-5">
                <div className="relative">
                  <div className="absolute -inset-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl blur-xl animate-hero-pulse" />
                  <div className="relative w-16 h-16 bg-gradient-to-br from-purple-500 via-violet-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/30 animate-float">
                    <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  </div>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                <span className="bg-gradient-to-r from-white via-purple-100 to-blue-100 bg-clip-text text-transparent">
                  পরিসংখ্যান ড্যাশবোর্ড
                </span>
              </h1>
              <p className="text-[13px] text-gray-500 mt-2.5 max-w-sm mx-auto leading-relaxed">
                প্রতিটি গ্রামের সার্চ ও ভোটার ডাটার রিয়েল-টাইম পরিসংখ্যান
              </p>
              <div className="flex items-center justify-center gap-2 mt-5">
                <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-purple-500/30" />
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500/30" />
                <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-purple-500/30" />
              </div>
            </div>
          </div>

          {/* ═══ MAIN ═══ */}
          <main className="flex-1 px-4 pb-8">
            <div className="max-w-4xl mx-auto space-y-5">
              {/* ─── Error ─── */}
              {error && (
                <div className="p-3.5 bg-red-500/[0.04] border border-red-500/15 rounded-xl flex items-center gap-3 animate-shake" role="alert">
                  <div className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-red-400 text-xs font-medium">{error}</p>
                    <p className="text-red-400/40 text-[10px] mt-0.5">
                      আবার রিফ্রেশ করে চেষ্টা করুন
                    </p>
                  </div>
                </div>
              )}

              {/* ─── Loading ─── */}
              {loading && (
                <div className="text-center py-16">
                  <div className="relative inline-block">
                    <div className="absolute -inset-4 bg-purple-500/[0.05] rounded-full blur-2xl" />
                    <div className="relative w-16 h-16 bg-white/[0.02] border border-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="animate-spin w-7 h-7 text-purple-400" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm font-medium">ডাটা লোড হচ্ছে...</p>
                  <p className="text-gray-700 text-[11px] mt-1.5">
                    একটু অপেক্ষা করুন
                  </p>
                </div>
              )}

              {/* ═══ DATA LOADED ═══ */}
              {!loading && summary && (
                <>
                  {/* ═══ Summary Cards ═══ */}
                  <div className="animate-result-reveal">
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                      <SummaryCard
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                          </svg>
                        }
                        label="মোট গ্রাম"
                        value={formatNumber(summary.totalVillages)}
                        iconBg="bg-violet-500/10"
                        iconColor="text-violet-400"
                        valueBg="bg-gradient-to-r from-violet-500 to-purple-500"
                        borderHover="hover:border-violet-500/20"
                      />
                      <SummaryCard
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                          </svg>
                        }
                        label="মোট সার্চ"
                        value={formatNumber(summary.totalChecks)}
                        iconBg="bg-purple-500/10"
                        iconColor="text-purple-400"
                        valueBg="bg-gradient-to-r from-purple-500 to-pink-500"
                        borderHover="hover:border-purple-500/20"
                      />
                      <SummaryCard
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                          </svg>
                        }
                        label="ভোটার দেখানো"
                        value={formatNumber(summary.totalResultsServed)}
                        iconBg="bg-blue-500/10"
                        iconColor="text-blue-400"
                        valueBg="bg-gradient-to-r from-blue-500 to-cyan-500"
                        borderHover="hover:border-blue-500/20"
                      />
                      <SummaryCard
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                          </svg>
                        }
                        label="DB হিট"
                        value={`${formatNumber(summary.totalFromDB)}`}
                        iconBg="bg-emerald-500/10"
                        iconColor="text-emerald-400"
                        valueBg="bg-gradient-to-r from-emerald-500 to-teal-500"
                        borderHover="hover:border-emerald-500/20"
                      />
                      <SummaryCard
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                          </svg>
                        }
                        label="API হিট"
                        value={`${formatNumber(summary.totalFromAPI)}`}
                        iconBg="bg-rose-500/10"
                        iconColor="text-rose-400"
                        valueBg="bg-gradient-to-r from-rose-500 to-orange-500"
                        borderHover="hover:border-rose-500/20"
                      />
                    </div>
                  </div>

                  {/* ═══ DB vs API Progress ═══ */}
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600/10 via-transparent to-rose-600/10 rounded-[20px] blur-xl opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
                    <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/15">
                            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">
                              DB vs API হিট রেশিও
                            </p>
                            <p className="text-[10px] text-gray-500">
                              ক্যাশ পারফরম্যান্স ইন্ডিকেটর
                            </p>
                          </div>
                        </div>

                        {/* Status badge */}
                        <span
                          className={`text-[9px] font-bold px-2.5 py-1 rounded-lg border ${
                            dbPercent >= 70
                              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/15"
                              : dbPercent >= 40
                                ? "text-amber-400 bg-amber-500/10 border-amber-500/15"
                                : "text-red-400 bg-red-500/10 border-red-500/15"
                          }`}
                        >
                          {dbPercent >= 70
                            ? "🚀 অসাধারণ!"
                            : dbPercent >= 40
                              ? "⚠️ ভালো হচ্ছে"
                              : "🔴 Cache দরকার"}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden flex mb-3">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 rounded-l-full transition-all duration-1000 ease-out flex items-center justify-center"
                          style={{ width: `${dbPercent}%`, minWidth: dbPercent > 0 ? "30px" : "0" }}
                        >
                          {dbPercent > 12 && (
                            <span className="text-[8px] font-bold text-black/70">
                              {toBangla(dbPercent)}%
                            </span>
                          )}
                        </div>
                        <div
                          className="bg-gradient-to-r from-rose-500 to-amber-400 rounded-r-full transition-all duration-1000 ease-out flex items-center justify-center"
                          style={{ width: `${apiPercent}%`, minWidth: apiPercent > 0 ? "30px" : "0" }}
                        >
                          {apiPercent > 12 && (
                            <span className="text-[8px] font-bold text-black/70">
                              {toBangla(apiPercent)}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Labels */}
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-gray-400">
                            DB: <span className="text-emerald-400 font-semibold">{formatNumber(summary.totalFromDB)}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-rose-500" />
                          <span className="text-gray-400">
                            API: <span className="text-rose-400 font-semibold">{formatNumber(summary.totalFromAPI)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

            {/* ═══ Search & Sort ═══ */}
{/* ✅ z-10 যোগ হয়েছে */}
<div className="relative group z-10">
  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-[20px] blur-xl opacity-50" />
  <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-4">
    <div className="flex gap-2.5 flex-col sm:flex-row">
      {/* Search input */}
      <div className="flex-1 relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center bg-white/[0.05]">
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="গ্রামের নাম খুঁজুন..."
          className="w-full pl-12 pr-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/15 focus:border-purple-500/30 transition-all"
        />
      </div>

      {/* Sort dropdown — ✅ z-20 যোগ হয়েছে */}
      <div className="relative z-20">
        <button
          onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
          className={`w-full sm:w-auto px-4 py-3 bg-white/[0.03] border rounded-xl text-sm text-left flex items-center justify-between gap-3 transition-all cursor-pointer min-w-[180px] ${
            sortDropdownOpen
              ? "border-purple-500/30 ring-2 ring-purple-500/15"
              : "border-white/[0.06] hover:border-white/[0.12]"
          }`}
        >
          <span className="text-gray-300 text-xs">
            {currentSort.icon} {currentSort.label}
          </span>
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${
              sortDropdownOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {sortDropdownOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setSortDropdownOpen(false)} />
            <div className="absolute top-full right-0 mt-2 z-40 bg-[#12121c] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60 overflow-hidden animate-drop-in min-w-[180px]">
              {sortOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setSortBy(opt.key);
                    setSortDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-xs transition-all cursor-pointer flex items-center gap-2.5 ${
                    sortBy === opt.key
                      ? "bg-purple-500/10 text-purple-300"
                      : "text-gray-300 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <span>{opt.icon}</span>
                  {opt.label}
                  {sortBy === opt.key && (
                    <svg className="w-3.5 h-3.5 text-purple-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>

    {/* Count */}
    <div className="mt-3 flex items-center gap-1.5">
      <div className="w-1.5 h-1.5 rounded-full bg-purple-500/40" />
      <p className="text-[11px] text-gray-500">
        দেখাচ্ছে:{" "}
        <span className="text-purple-400 font-semibold">
          {toBangla(filteredStats.length)}
        </span>{" "}
        টি গ্রাম
      </p>
    </div>
  </div>
</div>

                  {/* ═══ Village Stats Table/List ═══ */}
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/10 via-violet-600/10 to-blue-600/10 rounded-[20px] blur-xl opacity-40" />
                    <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl overflow-hidden">
                      {/* Desktop Table Header */}
                      <div className="hidden lg:grid grid-cols-[50px_2fr_1fr_1fr_1fr_1fr_1.2fr] gap-3 px-5 py-3 bg-white/[0.04] border-b border-white/[0.06]">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">#</span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                          </svg>
                          গ্রাম
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">সার্চ</span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">ভোটার</span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">DB</span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">API</span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">সর্বশেষ</span>
                      </div>

                      {/* Mobile Header */}
                      <div className="lg:hidden px-4 py-3 bg-white/[0.03] border-b border-white/[0.06]">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-purple-500/10 rounded-lg flex items-center justify-center">
                            <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                          </div>
                          <span className="text-[11px] font-semibold text-gray-400">
                            গ্রামভিত্তিক পরিসংখ্যান
                          </span>
                          <span className="text-[9px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-full ml-auto border border-purple-500/10">
                            বিস্তারিত দেখতে ট্যাপ করুন
                          </span>
                        </div>
                      </div>

                      {/* Rows */}
                      {filteredStats.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-white/[0.02] border border-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                          </div>
                          <p className="text-gray-500 text-sm font-medium">
                            কোনো ডাটা পাওয়া যায়নি
                          </p>
                          <p className="text-gray-700 text-[11px] mt-1.5">
                            অন্য কিছু দিয়ে খুঁজুন
                          </p>
                        </div>
                      ) : (
                        filteredStats.map((stat, index) => (
                          <StatRow
                            key={stat._id}
                            stat={stat}
                            index={index}
                            expanded={expandedRow === stat._id}
                            onToggle={() =>
                              setExpandedRow(
                                expandedRow === stat._id ? null : stat._id
                              )
                            }
                          />
                        ))
                      )}
                    </div>
                  </div>

                  {/* ═══ Footer Performance ═══ */}
                  <div className="bg-white/[0.015] backdrop-blur border border-white/[0.05] rounded-2xl p-4">
                    <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500">
                      <svg className="w-3.5 h-3.5 text-indigo-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                      <span>
                        DB হিট রেট যত বেশি, সার্ভার তত দ্রুত! বর্তমান:{" "}
                        <span
                          className={`font-bold ${
                            dbPercent >= 70
                              ? "text-emerald-400"
                              : dbPercent >= 40
                                ? "text-amber-400"
                                : "text-red-400"
                          }`}
                        >
                          {toBangla(dbPercent)}%
                        </span>
                        <span className="ml-1">
                          {dbPercent >= 70
                            ? "🚀"
                            : dbPercent >= 40
                              ? "⚠️"
                              : "🔴"}
                        </span>
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </main>

          {/* ═══ FOOTER ═══ */}
          <footer className="py-5 px-4 border-t border-white/[0.03]">
            <div className="max-w-4xl mx-auto flex items-center justify-center gap-1.5 text-[10px] text-gray-700">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              সকল তথ্য নিরাপদে সংরক্ষিত
            </div>
          </footer>
        </div>
      </div>

     
    </>
  );
}