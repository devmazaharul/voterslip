"use client";

import { VILLAGES_NAME } from "@/app/api/utils";
import { useState } from "react";

interface VoterResult {
  name: string;
  dateOfBirth: string;
  serialNumber: number;
  villageName: string;
}

export default function SearchPage() {
  const [serialNumber, setSerialNumber] = useState("");
  const [villageName, setVillageName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VoterResult | null>(null);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [villageSearch, setVillageSearch] = useState("");

  const filteredVillages = VILLAGES_NAME.filter((v) =>
    v.includes(villageSearch)
  );

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setResult(null);

    if (!serialNumber.trim()) {
      setError("ক্রমিক নম্বর লিখুন");
      return;
    }
    if (!villageName) {
      setError("গ্রাম নির্বাচন করুন");
      return;
    }
    const serial = parseInt(serialNumber);
    if (isNaN(serial) || serial <= 0) {
      setError("সঠিক ক্রমিক নম্বর দিন");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams({
        serialNumber: serial.toString(),
        villageName,
      });
      const res = await fetch(`/api/voter/find?${params}`);
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.message);
      }
    } catch {
      setError("সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSerialNumber("");
    setVillageName("");
    setResult(null);
    setError("");
    setSearched(false);
    setVillageSearch("");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("bn-BD", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const calcAge = (dob: string) => {
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  };

  const toBangla = (num: number | string) => {
    const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return num
      .toString()
      .split("")
      .map((d) => {
        const n = parseInt(d);
        return isNaN(n) ? d : banglaDigits[n];
      })
      .join("");
  };

  return (
    <div className="min-h-screen bg-[#06060a] text-white relative overflow-hidden">
      {/* ───────── Background ───────── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-purple-600/[0.07] rounded-full blur-[180px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-blue-600/[0.07] rounded-full blur-[180px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/[0.03] rounded-full blur-[200px]" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage: `radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Top line accent */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
      </div>

      {/* ───────── Content ───────── */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* ─── Header ─── */}
        <header className="pt-10 pb-6 px-4">
          <div className="max-w-lg mx-auto text-center">
            {/* Logo */}
            <div className="flex justify-center mb-5">
              <div className="relative">
                <div className="absolute -inset-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl blur-xl animate-[pulse_4s_ease-in-out_infinite]" />
                <div className="relative w-16 h-16 bg-gradient-to-br from-purple-500 via-violet-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/30 animate-[float_4s_ease-in-out_infinite]">
                  <svg
                    className="w-8 h-8 text-white drop-shadow-lg"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="bg-gradient-to-r from-white via-purple-100 to-blue-100 bg-clip-text text-transparent">
                ভোটার তথ্য অনুসন্ধান
              </span>
            </h1>
            <p className="text-[13px] text-gray-500 mt-2.5 max-w-xs mx-auto leading-relaxed">
              ক্রমিক নম্বর ও গ্রামের নাম দিয়ে ভোটারের তথ্য খুঁজুন
            </p>

            {/* Decorative line */}
            <div className="flex items-center justify-center gap-2 mt-5">
              <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-purple-500/30" />
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500/30" />
              <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-purple-500/30" />
            </div>
          </div>
        </header>

        {/* ─── Main ─── */}
        <main className="flex-1 px-4 pb-8">
          <div className="max-w-lg mx-auto space-y-5">
            {/* ═══════ Search Card ═══════ */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/15 via-violet-600/15 to-blue-600/15 rounded-[20px] blur-xl opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5 sm:p-6">
                <form onSubmit={handleSearch}>
                  <div className="space-y-4">
                    {/* ─── Village Select ─── */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-400 mb-2 ml-1 uppercase tracking-wider flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-purple-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        গ্রামের নাম নির্বাচন করুন
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                          className={`w-full px-4 py-3 bg-white/[0.03] border rounded-xl text-sm text-left flex items-center justify-between transition-all cursor-pointer ${
                            dropdownOpen
                              ? "border-purple-500/30 ring-2 ring-purple-500/15 bg-purple-500/[0.02]"
                              : villageName
                              ? "border-purple-500/15 bg-purple-500/[0.02]"
                              : "border-white/[0.06] hover:border-white/[0.12]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                              villageName ? "bg-purple-500/15" : "bg-white/[0.05]"
                            }`}>
                              <svg
                                className={`w-3.5 h-3.5 ${villageName ? "text-purple-400" : "text-gray-500"}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                              </svg>
                            </div>
                            <span className={villageName ? "text-white font-medium" : "text-gray-600"}>
                              {villageName || "গ্রাম নির্বাচন করুন..."}
                            </span>
                          </div>
                          <svg
                            className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${
                              dropdownOpen ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </button>

                        {/* Dropdown */}
                        {dropdownOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => {
                                setDropdownOpen(false);
                                setVillageSearch("");
                              }}
                            />
                            <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-[#12121c] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60 overflow-hidden animate-[dropIn_0.2s_ease]">
                              <div className="p-2.5 border-b border-white/[0.06]">
                                <div className="relative">
                                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                  </svg>
                                  <input
                                    type="text"
                                    value={villageSearch}
                                    onChange={(e) => setVillageSearch(e.target.value)}
                                    placeholder="গ্রাম খুঁজুন..."
                                    className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
                                    autoFocus
                                  />
                                </div>
                              </div>
                              <div className="max-h-52 overflow-y-auto py-1">
                                {filteredVillages.length === 0 ? (
                                  <div className="px-4 py-4 text-center text-xs text-gray-600">
                                    কোনো গ্রাম পাওয়া যায়নি
                                  </div>
                                ) : (
                                  filteredVillages.map((village) => (
                                    <button
                                      key={village}
                                      type="button"
                                      onClick={() => {
                                        setVillageName(village);
                                        setDropdownOpen(false);
                                        setVillageSearch("");
                                      }}
                                      className={`w-full px-4 py-2.5 text-left text-sm transition-all cursor-pointer flex items-center gap-2.5 ${
                                        villageName === village
                                          ? "bg-purple-500/10 text-purple-300"
                                          : "text-gray-300 hover:bg-white/[0.04] hover:text-white"
                                      }`}
                                    >
                                      <svg className={`w-3.5 h-3.5 shrink-0 ${villageName === village ? "text-purple-400" : "text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                      </svg>
                                      {village}
                                      {villageName === village && (
                                        <svg className="w-3.5 h-3.5 text-purple-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                      )}
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* ─── Serial Number ─── */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-400 mb-2 ml-1 uppercase tracking-wider flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-blue-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />
                        </svg>
                        ক্রমিক নম্বর
                      </label>
                      <div className="relative">
                        <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center ${
                          serialNumber ? "bg-blue-500/15" : "bg-white/[0.05]"
                        }`}>
                          <svg
                            className={`w-3.5 h-3.5 ${serialNumber ? "text-blue-400" : "text-gray-500"}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />
                          </svg>
                        </div>
                        <input
                          type="number"
                          value={serialNumber}
                          onChange={(e) => setSerialNumber(e.target.value)}
                          placeholder="ক্রমিক নম্বর লিখুন..."
                          min="1"
                          className={`w-full pl-12 pr-4 py-3 bg-white/[0.03] border rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/15 focus:border-purple-500/30 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            serialNumber ? "border-blue-500/15 bg-blue-500/[0.02]" : "border-white/[0.06]"
                          }`}
                        />
                      </div>
                    </div>

                    {/* ─── Error ─── */}
                    {error && searched && (
                      <div className="p-3.5 bg-red-500/[0.04] border border-red-500/15 rounded-xl flex items-center gap-3 animate-[shake_0.3s_ease]">
                        <div className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0">
                          <svg className="w-4.5 h-4.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-red-400 text-xs font-medium">{error}</p>
                          <p className="text-red-400/40 text-[10px] mt-0.5">
                            নম্বর ও গ্রামের নাম যাচাই করে আবার চেষ্টা করুন
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ─── Buttons ─── */}
                    <div className="flex gap-2.5 pt-1">
                      {(serialNumber || villageName || searched) && (
                        <button
                          type="button"
                          onClick={handleClear}
                          className="px-4 py-3 bg-white/[0.03] border border-white/[0.06] text-gray-400 rounded-xl text-xs font-medium hover:bg-white/[0.06] hover:text-white transition-all cursor-pointer active:scale-95"
                        >
                          মুছুন
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={loading || !serialNumber || !villageName}
                        className="flex-1 py-3 bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 text-white rounded-xl text-sm font-medium hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            অনুসন্ধান হচ্ছে...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                            অনুসন্ধান করুন
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* ═══════════════════════════════════════ */}
            {/* ═══════ RESULT CARD — ENHANCED ═══════ */}
            {/* ═══════════════════════════════════════ */}
            {result && (
              <div className="animate-[resultReveal_0.6s_ease]">
                <div className="relative">
                  {/* Multi-layer glow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/20 via-teal-600/15 to-cyan-600/20 rounded-3xl blur-2xl animate-[pulse_3s_ease-in-out_infinite]" />
                  <div className="absolute -inset-0.5 bg-gradient-to-b from-emerald-500/10 to-transparent rounded-[22px] blur-md" />

                  <div className="relative bg-[#0c0c14]/90 backdrop-blur-2xl border border-emerald-500/15 rounded-2xl overflow-hidden">

                    {/* ─── Result Header with Pattern ─── */}
                    <div className="relative overflow-hidden">
                      {/* Header Background Pattern */}
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] via-teal-500/[0.04] to-transparent" />
                      <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                          backgroundImage: `radial-gradient(circle, rgba(16,185,129,0.3) 1px, transparent 1px)`,
                          backgroundSize: "20px 20px",
                        }}
                      />

                      <div className="relative px-5 py-5 flex items-center gap-3.5">
                        {/* Animated Check Badge */}
                        <div className="relative">
                          <div className="absolute -inset-1 bg-emerald-500/20 rounded-2xl blur-lg animate-[pulse_2s_ease-in-out_infinite]" />
                          <div className="relative w-11 h-11 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center border border-emerald-500/20">
                            <svg
                              className="w-6 h-6 text-emerald-400 animate-[checkPop_0.5s_ease_0.3s_both]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.746 3.746 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
                              />
                            </svg>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-emerald-300">
                            ভোটার পাওয়া গেছে
                          </h3>
                          <p className="text-[10px] text-emerald-400/40 mt-0.5">
                            তথ্য সফলভাবে খুঁজে পাওয়া গেছে
                          </p>
                        </div>

                        {/* Status Dot */}
                        <div className="ml-auto flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                          <div className="w-2 h-2 bg-emerald-400 rounded-full absolute right-5" />
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                    </div>

                    {/* ─── Voter Profile Section ─── */}
                    <div className="p-5 sm:p-6">

                      {/* Avatar + Name + Tags */}
                      <div className="flex items-start gap-4 mb-6">
                        {/* Avatar */}
                        <div className="relative">
                          <div className="absolute -inset-1 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-2xl blur-lg" />
                          <div className="relative w-[68px] h-[68px] bg-gradient-to-br from-purple-500 via-violet-500 to-blue-500 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-purple-500/20">
                            {result.name.charAt(0)}
                          </div>
                          {/* Verified badge on avatar */}
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-[#0c0c14]">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h2 className="text-xl font-bold text-white leading-tight">
                            {result.name}
                          </h2>

                          {/* Tags */}
                          <div className="flex flex-wrap items-center gap-2 mt-2.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/15">
                              <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />
                              </svg>
                              #{toBangla(result.serialNumber)}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/15">
                              <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                              </svg>
                              {result.villageName}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ─── Info Cards Grid ─── */}
                      <div className="grid grid-cols-2 gap-3">

                        {/* Serial Number Card */}
                        <div className="group relative overflow-hidden bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 hover:border-purple-500/20 transition-all duration-300">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/[0.03] rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                          <div className="relative">
                            <div className="flex items-center gap-1.5 mb-2">
                              <div className="w-5 h-5 bg-purple-500/10 rounded-md flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />
                                </svg>
                              </div>
                              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-medium">
                                ক্রমিক নম্বর
                              </span>
                            </div>
                            <p className="text-xl font-bold text-white font-mono tracking-wide">
                              {toBangla(result.serialNumber)}
                            </p>
                          </div>
                        </div>

                        {/* Village Card */}
                        <div className="group relative overflow-hidden bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 hover:border-emerald-500/20 transition-all duration-300">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/[0.03] rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                          <div className="relative">
                            <div className="flex items-center gap-1.5 mb-2">
                              <div className="w-5 h-5 bg-emerald-500/10 rounded-md flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                </svg>
                              </div>
                              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-medium">
                                গ্রাম
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-white">
                              {result.villageName}
                            </p>
                          </div>
                        </div>

                        {/* Date of Birth Card */}
                        <div className="group relative overflow-hidden bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 hover:border-blue-500/20 transition-all duration-300">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/[0.03] rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                          <div className="relative">
                            <div className="flex items-center gap-1.5 mb-2">
                              <div className="w-5 h-5 bg-blue-500/10 rounded-md flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                </svg>
                              </div>
                              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-medium">
                                জন্ম তারিখ
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-white">
                              {formatDate(result.dateOfBirth)}
                            </p>
                          </div>
                        </div>

                        {/* Age Card */}
                        <div className="group relative overflow-hidden bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 hover:border-amber-500/20 transition-all duration-300">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/[0.03] rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                          <div className="relative">
                            <div className="flex items-center gap-1.5 mb-2">
                              <div className="w-5 h-5 bg-amber-500/10 rounded-md flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-medium">
                                বয়স
                              </span>
                            </div>
                            <p className="text-xl font-bold text-white">
                              {toBangla(calcAge(result.dateOfBirth))}{" "}
                              <span className="text-xs font-normal text-gray-500">
                                বছর
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* ─── Full Name Highlight Card ─── */}
                      <div className="mt-3 relative overflow-hidden bg-gradient-to-r from-purple-500/[0.04] to-blue-500/[0.04] border border-white/[0.06] rounded-xl p-4">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-blue-500 rounded-full" />
                        <div className="pl-3">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                            <span className="text-[9px] text-gray-500 uppercase tracking-wider font-medium">
                              পুরো নাম
                            </span>
                          </div>
                          <p className="text-base font-bold text-white">
                            {result.name}
                          </p>
                        </div>
                      </div>

                      {/* ─── Action: Search Again ─── */}
                      <button
                        onClick={handleClear}
                        className="w-full mt-4 py-2.5 bg-white/[0.03] border border-white/[0.06] text-gray-400 rounded-xl text-xs font-medium hover:bg-white/[0.06] hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        নতুন অনুসন্ধান করুন
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════ Empty State ═══════ */}
            {!result && !error && !searched && (
              <div className="text-center py-10">
                <div className="relative inline-block">
                  <div className="absolute -inset-4 bg-purple-500/[0.03] rounded-full blur-2xl" />
                  <div className="relative w-20 h-20 bg-white/[0.02] border border-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-9 h-9 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-500 text-sm font-medium">
                  গ্রাম নির্বাচন করে ক্রমিক নম্বর দিন
                </p>
                <p className="text-gray-700 text-[11px] mt-1.5">
                  আপনার তথ্য এখানে দেখানো হবে
                </p>
              </div>
            )}

            {/* ═══════ Village Quick Tags ═══════ */}
            {!searched && (
              <div className="bg-white/[0.015] backdrop-blur border border-white/[0.05] rounded-2xl p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xs font-semibold text-gray-300">
                    অন্তর্ভুক্ত গ্রামসমূহ
                  </h3>
                  <span className="text-[9px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full ml-auto border border-blue-500/10">
                    {toBangla(VILLAGES_NAME.length)} টি
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {VILLAGES_NAME.map((village) => (
                    <button
                      key={village}
                      onClick={() => {
                        setVillageName(village);
                        setDropdownOpen(false);
                      }}
                      className={`px-2.5 py-1.5 text-[11px] rounded-lg border transition-all cursor-pointer active:scale-95 ${
                        villageName === village
                          ? "bg-purple-500/15 border-purple-500/20 text-purple-300 shadow-sm shadow-purple-500/10"
                          : "bg-white/[0.02] border-white/[0.04] text-gray-500 hover:text-gray-300 hover:border-white/[0.1] hover:bg-white/[0.03]"
                      }`}
                    >
                      {village}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ─── Footer ─── */}
        <footer className="py-5 px-4 border-t border-white/[0.03]">
          <div className="max-w-lg mx-auto flex items-center justify-center gap-1.5 text-[10px] text-gray-700">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            সকল তথ্য নিরাপদে সংরক্ষিত
          </div>
        </footer>
      </div>

      {/* ─── Animations ─── */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes dropIn {
          from { opacity: 0; transform: scaleY(0.95) translateY(-4px); }
          to { opacity: 1; transform: scaleY(1) translateY(0); }
        }
        @keyframes resultReveal {
          0% { opacity: 0; transform: translateY(30px) scale(0.97); }
          50% { opacity: 1; }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes checkPop {
          0% { transform: scale(0) rotate(-45deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(0deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}