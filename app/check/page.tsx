// app/search/page.tsx
"use client";

import { useState } from "react";

// ─── শুধু গ্রামের নাম ───
const VILLAGES = [
  "নরেন্দ্রপুর",
  "বলরামপুর",
  "রামপুর",
  "চৌঘাটা",
  "ভাগবতিপুর",
  "আন্দুলিয়া",
  "ছিলুমবাড়ীয়া",
  "জিরাট",
  "ঘেড়াগাছা",
  "শ্রীপদ্দি",
  "রুপদিয়া",
  "হাটবিলা",
  "শাখারীগাতী",
  "চাউলিয়া",
  "গোপালপুর",
];

interface Voter {
  _id: string;
  name: string;
  dateOfBirth: string;
  serialNumber: number;
  wardName: string;
  createdAt: string;
}

export default function VoterSearchPage() {
  const [serialNumber, setSerialNumber] = useState("");
  const [villageName, setVillageName] = useState("");
  const [voter, setVoter] = useState<Voter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [selectOpen, setSelectOpen] = useState(false);

  // ─── Search Handler ───
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setVoter(null);
    setSearched(true);

    if (!serialNumber || !villageName) {
      setError("অনুগ্রহ করে সিরিয়াল নম্বর এবং গ্রাম দুটোই দিন।");
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams({
        serialNumber: serialNumber.trim(),
        villageName: villageName,
      });

      const res = await fetch(`/api/voter/find?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.data) {
        setVoter(data.data);
      } else {
        setError(data.message);
      }
    } catch {
      setError("নেটওয়ার্ক সমস্যা! আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  // ─── Select Village ───
  const handleSelectVillage = (villageName: string) => {
    setVillageName(villageName === villageName ? "" : villageName);
    setSelectOpen(false);
  };

  // ─── Clear All ───
  const handleClear = () => {
    setSerialNumber("");
    setVillageName("");
    setVoter(null);
    setError("");
    setSearched(false);
  };

  // ─── Format Date Bangla ───
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("bn-BD", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // ─── Calculate Age ───
  const calcAge = (dob: string) => {
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* ─── Background ─── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-purple-600/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-blue-600/5 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#0a0a0f_70%)]" />
      </div>

      {/* ─── Content ─── */}
      <div className="relative max-w-2xl mx-auto px-4 py-8">
        {/* ─── Header ─── */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative group cursor-default">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
              <div className="relative w-14 h-14 bg-gradient-to-br from-purple-500 via-violet-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-xl">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">
            ভোটার তথ্য অনুসন্ধান
          </h1>
          <p className="text-gray-500 text-sm">
            সিরিয়াল নম্বর ও গ্রাম দিয়ে ভোটারের তথ্য খুঁজুন
          </p>
        </div>

        {/* ─── Search Form ─── */}
        <div className="relative mb-6">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/15 via-blue-600/15 to-purple-600/15 rounded-2xl blur-lg opacity-60" />
          <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* ─── Serial Number ─── */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
                    সিরিয়াল নম্বর <span className="text-red-400">*</span>
                  </label>
                  <div
                    className={`relative rounded-xl transition-all duration-300 ${
                      focused === "serial"
                        ? "ring-2 ring-purple-500/30 shadow-[0_0_20px_-5px_rgba(139,92,246,0.2)]"
                        : ""
                    }`}
                  >
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <svg
                        className={`w-4 h-4 transition-colors duration-300 ${
                          focused === "serial"
                            ? "text-purple-400"
                            : "text-gray-600"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5"
                        />
                      </svg>
                    </div>
                    <input
                      type="number"
                      placeholder="যেমন: 1221"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      onFocus={() => setFocused("serial")}
                      onBlur={() => setFocused(null)}
                      className="w-full pl-10 pr-3.5 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none transition-all duration-300 hover:border-white/10 cursor-text"
                    />
                  </div>
                </div>

                {/* ─── Ward / Village Select ─── */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
                    গ্রাম <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setSelectOpen(!selectOpen)}
                      className={`w-full flex items-center justify-between pl-10 pr-3.5 py-3 bg-white/[0.03] border rounded-xl text-sm transition-all duration-300 hover:border-white/10 text-left cursor-pointer ${
                        selectOpen
                          ? "border-blue-500/30 ring-2 ring-blue-500/20 shadow-[0_0_20px_-5px_rgba(59,130,246,0.2)]"
                          : "border-white/[0.06]"
                      } ${villageName ? "text-white" : "text-gray-600"}`}
                    >
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <svg
                          className={`w-4 h-4 transition-colors duration-300 ${
                            selectOpen || villageName
                              ? "text-blue-400"
                              : "text-gray-600"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                          />
                        </svg>
                      </div>

                      <span className="truncate">
                        {villageName || "গ্রাম নির্বাচন করুন"}
                      </span>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {villageName && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setVillageName("");
                            }}
                            className="p-0.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-md transition-all cursor-pointer"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </span>
                        )}
                        <svg
                          className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${
                            selectOpen ? "rotate-180" : ""
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
                    </button>

                    {/* Dropdown */}
                    {selectOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setSelectOpen(false)}
                        />
                        <div className="absolute z-50 mt-1.5 w-full animate-[dropIn_0.2s_ease]">
                          <div className="absolute -inset-0.5 bg-gradient-to-b from-blue-600/10 to-purple-600/10 rounded-xl blur-md" />
                          <div className="relative bg-[#111118] border border-white/[0.08] rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
                            <div className="px-3 py-2 border-b border-white/[0.06]">
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                                {VILLAGES.length} টি গ্রাম
                              </p>
                            </div>
                            <div className="max-h-52 overflow-y-auto scrollbar-thin">
                              {VILLAGES.map((village) => {
                                const isSelected = villageName === village;
                                return (
                                  <button
                                    key={village}
                                    type="button"
                                    onClick={() =>
                                      handleSelectVillage(village)
                                    }
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-all duration-150 cursor-pointer ${
                                      isSelected
                                        ? "bg-blue-500/10 text-blue-300"
                                        : "text-gray-400 hover:bg-white/[0.04] hover:text-white"
                                    }`}
                                  >
                                    <div
                                      className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 border transition-all ${
                                        isSelected
                                          ? "bg-blue-500/20 border-blue-500/40"
                                          : "border-white/[0.08] bg-white/[0.02]"
                                      }`}
                                    >
                                      {isSelected && (
                                        <svg
                                          className="w-3 h-3 text-blue-400"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2.5}
                                            d="M4.5 12.75l6 6 9-13.5"
                                          />
                                        </svg>
                                      )}
                                    </div>
                                    <span className="flex-1">{village}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Selected Badge */}
              {villageName && (
                <div className="flex items-center gap-2 animate-[slideDown_0.2s_ease]">
                  <span className="text-[10px] text-gray-500">নির্বাচিত:</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/15 rounded-lg text-xs text-blue-300">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                      />
                    </svg>
                    {villageName}
                    <button
                      type="button"
                      onClick={() => setVillageName("")}
                      className="p-0.5 hover:bg-blue-500/20 rounded transition-colors cursor-pointer"
                    >
                      <svg
                        className="w-2.5 h-2.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </span>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  type="submit"
                  disabled={loading || !serialNumber || !villageName}
                  className="group relative flex-1 py-3 rounded-xl text-sm font-semibold text-white overflow-hidden transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-violet-500 to-blue-500" />
                    <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:left-full transition-all duration-700 ease-out" />
                  </div>
                  <div className="absolute inset-0 rounded-xl shadow-[0_4px_25px_-5px_rgba(139,92,246,0.35)] group-hover:shadow-[0_4px_35px_-5px_rgba(139,92,246,0.5)] transition-shadow duration-300" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-20"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="3"
                          />
                          <path
                            className="opacity-80"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        <span>খোঁজা হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                          />
                        </svg>
                        <span>অনুসন্ধান করুন</span>
                      </>
                    )}
                  </span>
                </button>

                {(serialNumber || villageName || searched) && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-4 py-3 bg-white/[0.03] border border-white/[0.06] text-gray-400 rounded-xl text-sm hover:bg-white/[0.06] hover:text-white transition-all cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* ─── Error ─── */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-500/5 border border-red-500/15 rounded-xl flex items-center gap-3 animate-[slideDown_0.3s_ease]">
            <div className="w-8 h-8 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <p className="text-red-400/90 text-sm">{error}</p>
          </div>
        )}

        {/* ─── Loading Skeleton ─── */}
        {loading && (
          <div className="animate-[slideUp_0.3s_ease]">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-white/[0.03] rounded-2xl animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-1/3 bg-white/[0.03] rounded-lg animate-pulse" />
                  <div className="h-3 w-1/4 bg-white/[0.03] rounded-lg animate-pulse" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-white/[0.02] rounded-xl animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════ */}
        {/* ─── SINGLE VOTER RESULT CARD ─── */}
        {/* ══════════════════════════════════════════ */}
        {voter && !loading && (
          <div className="animate-[slideUp_0.4s_ease]">
            {/* Success badge */}
            <div className="mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              <p className="text-emerald-400 text-sm">ভোটার পাওয়া গেছে</p>
            </div>

            {/* Main Card */}
            <div className="relative">
              {/* Card glow */}
              <div className="absolute -inset-0.5 bg-gradient-to-br from-purple-600/15 to-blue-600/15 rounded-2xl blur-lg opacity-50" />

              <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden">
                {/* Top gradient bar */}
                <div className="h-1 bg-gradient-to-r from-purple-500 via-violet-500 to-blue-500" />

                <div className="p-5 sm:p-6">
                  {/* ─── Profile Section ─── */}
                  <div className="flex items-center gap-4 mb-6">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl blur-md opacity-30" />
                      <div className="relative w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center border border-purple-500/15">
                        <span className="text-xl font-bold text-purple-300">
                          {voter.name.charAt(0)}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                        {voter.name}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/10">
                          সিরিয়াল #{voter.serialNumber}
                        </span>
                        <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/10">
                          {voter.wardName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ─── Info Grid ─── */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Serial Number */}
                    <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3.5 hover:border-purple-500/15 transition-all duration-300">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 bg-purple-500/10 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-3.5 h-3.5 text-purple-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.8}
                              d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5"
                            />
                          </svg>
                        </div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                          সিরিয়াল
                        </span>
                      </div>
                      <p className="text-lg font-bold text-white">
                        #{voter.serialNumber}
                      </p>
                    </div>

                    {/* Ward / Village */}
                    <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3.5 hover:border-blue-500/15 transition-all duration-300">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 bg-blue-500/10 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-3.5 h-3.5 text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.8}
                              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                            />
                          </svg>
                        </div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                          গ্রাম
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {voter.wardName}
                      </p>
                    </div>

                    {/* Date of Birth */}
                    <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3.5 hover:border-emerald-500/15 transition-all duration-300">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-3.5 h-3.5 text-emerald-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.8}
                              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                            />
                          </svg>
                        </div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                          জন্মতারিখ
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {formatDate(voter.dateOfBirth)}
                      </p>
                    </div>

                    {/* Age */}
                    <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3.5 hover:border-amber-500/15 transition-all duration-300">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 bg-amber-500/10 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-3.5 h-3.5 text-amber-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.8}
                              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                          বয়স
                        </span>
                      </div>
                      <p className="text-lg font-bold text-white">
                        {calcAge(voter.dateOfBirth)}{" "}
                        <span className="text-sm font-normal text-gray-400">
                          বছর
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* ─── Full Name Row ─── */}
                  <div className="mt-3 bg-white/[0.02] border border-white/[0.04] rounded-xl p-3.5 hover:border-violet-500/15 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 bg-violet-500/10 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-3.5 h-3.5 text-violet-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                          />
                        </svg>
                      </div>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                        পুরো নাম
                      </span>
                    </div>
                    <p className="text-base font-semibold text-white">
                      {voter.name}
                    </p>
                  </div>
                </div>

                {/* Bottom bar */}
                <div className="px-5 sm:px-6 py-3 border-t border-white/[0.04] bg-white/[0.01]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] text-gray-600">
                        তথ্য যাচাইকৃত
                      </span>
                    </div>
                    <button
                      onClick={handleClear}
                      className="text-[10px] text-gray-500 hover:text-white px-2 py-1 rounded-md hover:bg-white/[0.04] transition-all cursor-pointer"
                    >
                      নতুন অনুসন্ধান
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Not Found (searched but no result) ─── */}
        {searched && !loading && !voter && !error && (
          <div className="text-center py-16 animate-[slideUp_0.3s_ease]">
            <div className="w-16 h-16 bg-white/[0.02] border border-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-7 h-7 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">কোনো ভোটার পাওয়া যায়নি</p>
          </div>
        )}

        {/* ─── Initial State ─── */}
        {!searched && !loading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-white/[0.02] border border-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-7 h-7 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-sm mb-1">
              সিরিয়াল নম্বর ও গ্রাম দিয়ে খুঁজুন
            </p>
            <p className="text-gray-700 text-xs">
              দুটো ফিল্ডই পূরণ করে &quot;অনুসন্ধান করুন&quot; বাটনে ক্লিক করুন
            </p>
          </div>
        )}

        {/* ─── Footer ─── */}
        <div className="mt-10 flex items-center justify-center gap-2">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
          <div className="flex items-center gap-1.5 px-3">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-gray-600 uppercase tracking-widest">
              Voter Search System
            </span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
        </div>
      </div>

      {/* ─── Animations ─── */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes dropIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.06);
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.12);
        }
      `}</style>
    </div>
  );
}