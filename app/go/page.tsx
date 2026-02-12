"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Hash,
  UserCircle,
  LayoutDashboard,
  Loader2,
  AlertCircle,
  RefreshCcw,
  Shield,
  X,
  Database,
  Fingerprint,
  Clock,
} from "lucide-react";

// ─── Types ───
interface VoterData {
  _id: string;
  name: string;
  dateOfBirth: string;
  serialNumber: number;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Helpers ───
const formatDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString("bn-BD", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

const formatShort = (d: string) => {
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

const timeAgo = (d: string) => {
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const dy = Math.floor(h / 24);
  if (dy < 7) return `${dy}d ago`;
  return formatShort(d);
};

// ════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════
export default function AdminDashboard() {
  const [voters, setVoters] = useState<VoterData[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<VoterData | null>(null);

  const fetchVoters = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const { data } = await axios.get("/api/voter/list", {
          params: { page, limit: 20, search },
        });
        if (data.success) {
          setVoters(data.data);
          setPagination(data.pagination);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [search]
  );

  useEffect(() => {
    const t = setTimeout(() => fetchVoters(1), 300);
    return () => clearTimeout(t);
  }, [search, fetchVoters]);

  return (
    <div className="min-h-screen bg-[#09090b] text-white relative overflow-hidden">
      {/* ─── BG ─── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/[0.04] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-600/[0.03] rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.012] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[size:32px_32px]" />
      </div>

      <div className="relative z-10">
        {/* ═══ HEADER ═══ */}
        <header className="border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-2xl sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-violet-500 rounded-xl blur-lg opacity-25" />
                  <div className="relative p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
                    <LayoutDashboard className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-base font-black tracking-tight">
                    Admin Panel
                  </h1>
                  <p className="text-[9px] text-white/25 font-medium hidden sm:block">
                    Voter Management
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchVoters(pagination.page)}
                  className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all cursor-pointer"
                >
                  <RefreshCcw className="w-3.5 h-3.5 text-white/40" />
                </button>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/15">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative rounded-full h-1.5 w-1.5 bg-emerald-400" />
                  </span>
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
                    Live
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* ═══ STAT BAR ═══ */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Total */}
            <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 sm:p-5 group hover:bg-white/[0.05] transition-all">
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-violet-500/10 rounded-full blur-2xl group-hover:opacity-100 opacity-0 transition-opacity" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">
                    মোট ভোটার
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {loading ? (
                      <span className="inline-block w-12 h-7 bg-white/5 rounded animate-pulse" />
                    ) : (
                      pagination.total.toLocaleString()
                    )}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-violet-500/10">
                  <Users className="w-4 h-4 text-violet-400" />
                </div>
              </div>
            </div>

            {/* Pages */}
            <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">
                    মোট পেজ
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-white">
                    {loading ? (
                      <span className="inline-block w-8 h-7 bg-white/5 rounded animate-pulse" />
                    ) : (
                      pagination.totalPages
                    )}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-emerald-500/10">
                  <Database className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </div>

            {/* Current Page */}
            <div className="col-span-2 sm:col-span-1 relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">
                    বর্তমান পেজ
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-white">
                    {pagination.page}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-amber-500/10">
                  <Hash className="w-4 h-4 text-amber-400" />
                </div>
              </div>
            </div>
          </div>

          {/* ═══ TABLE CARD ═══ */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
            {/* Search bar */}
            <div className="px-4 sm:px-5 py-4 border-b border-white/[0.05]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-white/[0.04] rounded-lg border border-white/[0.06]">
                    <Database className="w-3.5 h-3.5 text-white/40" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white/80">
                      ভোটার তালিকা
                    </h2>
                    <p className="text-[9px] text-white/25">
                      {pagination.total} records
                    </p>
                  </div>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="নাম বা সিরিয়াল..."
                    className="
                      w-full pl-9 pr-8 py-2.5
                      bg-white/[0.04] border border-white/[0.07]
                      rounded-xl text-sm text-white placeholder:text-white/20
                      focus:outline-none focus:border-violet-500/40
                      focus:ring-1 focus:ring-violet-500/15
                      transition-all
                    "
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-white/10 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 text-white/30" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="relative w-10 h-10 mx-auto mb-3">
                    <div className="absolute inset-0 rounded-full border-2 border-white/[0.06]" />
                    <div className="absolute inset-0 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                  </div>
                  <p className="text-xs text-white/30">Loading...</p>
                </div>
              </div>
            )}

            {/* ─── Desktop Table ─── */}
            {!loading && voters.length > 0 && (
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.05]">
                      {["#", "সিরিয়াল", "নাম", "জন্ম তারিখ", "যোগ হয়েছে"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-5 py-3 text-left text-[9px] font-extrabold text-white/25 uppercase tracking-[0.2em]"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {voters.map((v, i) => (
                      <tr
                        key={v._id}
                        onClick={() => setSelected(v)}
                        className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                      >
                        {/* Row number */}
                        <td className="px-5 py-3.5">
                          <span className="text-[10px] font-mono text-white/20">
                            {(pagination.page - 1) * pagination.limit + i + 1}
                          </span>
                        </td>

                        {/* Serial */}
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-500/15">
                            <Hash className="w-2.5 h-2.5" />
                            {v.serialNumber}
                          </span>
                        </td>

                        {/* Name */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/15 to-purple-500/15 border border-violet-500/10 flex items-center justify-center">
                              <UserCircle className="w-4 h-4 text-violet-400" />
                            </div>
                            <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">
                              {v.name}
                            </span>
                          </div>
                        </td>

                        {/* DOB */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-white/15" />
                            <span className="text-xs text-white/50">
                              {formatDate(v.dateOfBirth)}
                            </span>
                          </div>
                        </td>

                        {/* Added */}
                        <td className="px-5 py-3.5">
                          <span className="text-[11px] text-white/25">
                            {timeAgo(v.createdAt)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ─── Mobile List ─── */}
            {!loading && voters.length > 0 && (
              <div className="sm:hidden divide-y divide-white/[0.03]">
                {voters.map((v, i) => (
                  <div
                    key={v._id}
                    onClick={() => setSelected(v)}
                    className="px-4 py-3.5 hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/15 to-purple-500/15 border border-violet-500/10 flex items-center justify-center shrink-0">
                          <UserCircle className="w-4 h-4 text-violet-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white/80 truncate">
                            {v.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono font-bold text-violet-400">
                              #{v.serialNumber}
                            </span>
                            <span className="text-white/10">•</span>
                            <span className="text-[10px] text-white/25">
                              {formatDate(v.dateOfBirth)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/15 shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && voters.length === 0 && (
              <div className="text-center py-20">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white/15" />
                </div>
                <p className="text-sm text-white/30">কোনো ভোটার পাওয়া যায়নি</p>
                <p className="text-[10px] text-white/15 mt-1">
                  Try different search
                </p>
              </div>
            )}

            {/* ─── Pagination ─── */}
            {!loading && pagination.totalPages > 1 && (
              <div className="px-4 sm:px-5 py-3.5 border-t border-white/[0.05] flex items-center justify-between">
                <p className="text-[10px] text-white/25">
                  পেজ {pagination.page} / {pagination.totalPages}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => fetchVoters(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 text-white/50" />
                  </button>

                  {/* Page buttons */}
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        const start = Math.max(1, pagination.page - 2);
                        const p = start + i;
                        if (p > pagination.totalPages) return null;
                        return (
                          <button
                            key={p}
                            onClick={() => fetchVoters(p)}
                            className={`
                              w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer
                              ${
                                p === pagination.page
                                  ? "bg-violet-500/15 text-violet-400 border border-violet-500/25"
                                  : "text-white/30 hover:bg-white/[0.04] border border-transparent"
                              }
                            `}
                          >
                            {p}
                          </button>
                        );
                      }
                    )}
                  </div>

                  {/* Mobile page indicator */}
                  <span className="sm:hidden text-xs font-mono text-white/30 px-2">
                    {pagination.page}/{pagination.totalPages}
                  </span>

                  <button
                    onClick={() => fetchVoters(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4 text-white/50" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center gap-1.5 pt-2 pb-4">
            <Shield className="w-3 h-3 text-white/10" />
            <span className="text-[10px] text-white/15">
              Developed by{" "}
              <a
                href="https://www.mazaharul.site"
                className="text-violet-400/50 hover:text-violet-400 font-bold transition-colors"
              >
                Maza IT
              </a>
            </span>
          </div>
        </main>
      </div>

      {/* ═══ DETAIL MODAL ═══ */}
      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl bg-[#111118] border border-white/[0.08] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700" />
              <div className="absolute -right-8 -top-8 w-28 h-28 bg-white/10 rounded-full blur-2xl" />
              <div className="relative px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/10">
                    <Fingerprint className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      ভোটার বিবরণ
                    </h3>
                    <p className="text-[9px] text-white/40">Details</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3">
              {[
                {
                  label: "নাম",
                  value: selected.name,
                  icon: UserCircle,
                  color: "text-violet-400",
                  bg: "bg-violet-500/10",
                },
                {
                  label: "সিরিয়াল নং",
                  value: `#${selected.serialNumber}`,
                  icon: Hash,
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10",
                },
                {
                  label: "জন্ম তারিখ",
                  value: formatDate(selected.dateOfBirth),
                  icon: Calendar,
                  color: "text-amber-400",
                  bg: "bg-amber-500/10",
                },
                {
                  label: "এন্ট্রি",
                  value: formatShort(selected.createdAt),
                  icon: Clock,
                  color: "text-blue-400",
                  bg: "bg-blue-500/10",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05]"
                >
                  <div className={`p-2 rounded-lg ${item.bg}`}>
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-white/25 uppercase tracking-[0.2em]">
                      {item.label}
                    </p>
                    <p className="text-sm font-bold text-white/85 mt-0.5">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Close btn */}
            <div className="px-5 pb-5">
              <button
                onClick={() => setSelected(null)}
                className="w-full py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm font-semibold text-white/50 hover:bg-white/[0.08] hover:text-white/70 transition-all cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}