"use client";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useAdminLayout } from "../components/contex";
import { VILLAGES_NAME_NEW } from "@/app/api/newvoter/utils";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════
interface VoterResult {
  _id: string;
  name: string;
  dateOfBirth: string;
  serialNumber: number;
  voterNumber: number;
  village: string;
  motherName: string;
  fatherOrHusbandName: string;
  pollingCenter: string;
  addedBy: "system" | "self";
  createdAt: string;
}

// ═══════════════════════════════════════════
// Helpers (outside component — no re-creation)
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

const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const calcAge = (dob: string): number => {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};

// Card accent variants — full class names for Tailwind purge safety
const CARD_VARIANTS = [
  {
    glow: "from-emerald-600/15 to-cyan-600/15",
    borderActive: "border-emerald-500/20",
    headerBg: "from-emerald-500/[0.06]",
  },
  {
    glow: "from-blue-600/15 to-indigo-600/15",
    borderActive: "border-blue-500/20",
    headerBg: "from-blue-500/[0.06]",
  },
  {
    glow: "from-violet-600/15 to-purple-600/15",
    borderActive: "border-violet-500/20",
    headerBg: "from-violet-500/[0.06]",
  },
];

// ═══════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════

function CopyButton({
  text,
  fieldId,
  copiedField,
  onCopy,
}: {
  text: string;
  fieldId: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}) {
  const isCopied = copiedField === fieldId;

  return (
    <button
      onClick={() => onCopy(text, fieldId)}
      className="p-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08]
                 transition-all cursor-pointer active:scale-90"
      title="কপি করুন"
      aria-label={isCopied ? "কপি হয়েছে" : "কপি করুন"}
    >
      {isCopied ? (
        <svg
          className="w-4 h-4 text-emerald-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.5 12.75l6 6 9-13.5"
          />
        </svg>
      ) : (
        <svg
          className="w-4 h-4 text-gray-500 hover:text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03
               0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75
               0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332
               0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907
               2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0
               014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208
               48.208 0 011.927-.184"
          />
        </svg>
      )}
    </button>
  );
}

function InfoTile({
  icon,
  label,
  value,
  colorClass,
  hoverBorder,
  large = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  colorClass: string;
  hoverBorder: string;
  large?: boolean;
}) {
  return (
    <div
      className={`bg-white/[0.02] border border-white/[0.05] rounded-xl
                  p-3.5 transition-all ${hoverBorder}`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <div
          className={`w-5 h-5 ${colorClass} rounded-md
                      flex items-center justify-center`}
        >
          {icon}
        </div>
        <span className="text-[9px] text-gray-500 uppercase tracking-wider font-medium">
          {label}
        </span>
      </div>
      <p
        className={`font-semibold text-white leading-snug ${
          large ? "text-xl font-bold" : "text-sm"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════
// Expandable Card Wrapper
// ═══════════════════════════════════════════
function ExpandableSection({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children: React.ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [isOpen, children]);

  return (
    <div
      className="overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{
        maxHeight: isOpen ? height + 20 : 0,
        opacity: isOpen ? 1 : 0,
      }}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Main Page Component
// ═══════════════════════════════════════════
export default function SearchPage() {
  const { setSidebarOpen, handleLogout } = useAdminLayout();

  // ─── State ───
  const [serialNumber, setSerialNumber] = useState("");
  const [village, setVillage] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<VoterResult[]>([]);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [villageSearch, setVillageSearch] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // ─── Derived ───
  const filteredVillages = useMemo(
    () => VILLAGES_NAME_NEW.filter((v) => v.includes(villageSearch)),
    [villageSearch]
  );

  const hasInput = serialNumber || village || searched;

  // ─── Handlers ───
  const copyToClipboard = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const handleClear = useCallback(() => {
    setSerialNumber("");
    setVillage("");
    setResults([]);
    setError("");
    setSearched(false);
    setVillageSearch("");
    setExpandedCard(null);
  }, []);

  const selectVillage = useCallback((v: string) => {
    setVillage(v);
    setDropdownOpen(false);
    setVillageSearch("");
  }, []);

  const handleSearch = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      setError("");
      setResults([]);

      if (!serialNumber.trim()) {
        setError("ক্রমিক নম্বর লিখুন");
        return;
      }
      if (!village) {
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
          village,
        });
        const res = await fetch(`/api/admin/items/find?${params}`);
        const data = await res.json();

        if (data.success && data.data) {
          const arr = Array.isArray(data.data) ? data.data : [data.data];
          setResults(arr);
          if (arr.length === 1) setExpandedCard(arr[0]._id);
        } else {
          setError(data.message || "কোনো ভোটার পাওয়া যায়নি");
        }
      } catch {
        setError("সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      } finally {
        setLoading(false);
      }
    },
    [serialNumber, village]
  );

  // ═══════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════
  return (
    <>
      {/* ═══ HEADER ═══ */}
      <header
        className="sticky top-0 z-30 bg-[#06060a]/80 backdrop-blur-xl
                   border-b border-white/[0.06]"
      >
        <div className="flex items-center justify-between px-4 lg:px-6 py-3">
          {/* Mobile menu */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 cursor-pointer text-gray-400
                       hover:text-white transition-colors rounded-lg
                       hover:bg-white/[0.05]"
            aria-label="মেনু খুলুন"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>

          {/* Desktop title */}
          <h1 className="text-base font-semibold hidden lg:flex items-center gap-2">
            <svg
              className="w-4 h-4 text-purple-400"
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
            ভোটার অনুসন্ধান
          </h1>

          {/* Mobile title */}
          <h1
            className="text-sm font-semibold lg:hidden bg-gradient-to-r
                        from-white to-gray-300 bg-clip-text text-transparent"
          >
            ভোটার অনুসন্ধান
          </h1>

          {/* Mobile logout */}
          <button
            onClick={handleLogout}
            className="lg:hidden p-2 cursor-pointer text-gray-400
                       hover:text-red-400 transition-colors rounded-lg
                       hover:bg-white/[0.05]"
            aria-label="লগআউট"
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
                strokeWidth={1.8}
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25
                   0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25
                   2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* ═══ PAGE CONTENT ═══ */}
      <div className="relative overflow-hidden">
        {/* ─── Ambient Background ─── */}
        <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute -top-40 -left-40 w-[600px] h-[600px]
                        bg-purple-600/[0.07] rounded-full blur-[180px]"
          />
          <div
            className="absolute -bottom-40 -right-40 w-[600px] h-[600px]
                        bg-blue-600/[0.07] rounded-full blur-[180px]"
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2
                        -translate-y-1/2 w-[800px] h-[800px]
                        bg-indigo-600/[0.03] rounded-full blur-[200px]"
          />
          <div
            className="absolute inset-0 opacity-[0.012]"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col">
          {/* ═══ HERO ═══ */}
          <div className="pt-8 pb-4 px-4">
            <div className="max-w-lg mx-auto text-center">
              {/* Animated icon */}
              <div className="flex justify-center mb-5">
                <div className="relative">
                  <div
                    className="absolute -inset-3 bg-gradient-to-br
                                from-purple-500/20 to-blue-500/20
                                rounded-3xl blur-xl animate-hero-pulse"
                  />
                  <div
                    className="relative w-16 h-16 bg-gradient-to-br
                                from-purple-500 via-violet-500 to-blue-500
                                rounded-2xl flex items-center justify-center
                                shadow-2xl shadow-purple-500/30 animate-float"
                  >
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
                        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337
                           0 004.121-.952 4.125 4.125 0
                           00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15
                           19.128v.106A12.318 12.318 0 018.624
                           21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375
                           6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0
                           11-6.75 0 3.375 3.375 0 016.75 0zm8.25
                           2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold">
                <span
                  className="bg-gradient-to-r from-white via-purple-100
                              to-blue-100 bg-clip-text text-transparent"
                >
                  ভোটার তথ্য অনুসন্ধান
                </span>
              </h1>
              <p
                className="text-[13px] text-gray-500 mt-2.5
                            max-w-xs mx-auto leading-relaxed"
              >
                ক্রমিক নম্বর ও গ্রামের নাম দিয়ে ভোটারের সকল তথ্য খুঁজুন
              </p>

              {/* Decorative divider */}
              <div className="flex items-center justify-center gap-2 mt-5">
                <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-purple-500/30" />
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500/30" />
                <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-purple-500/30" />
              </div>
            </div>
          </div>

          {/* ═══ MAIN CONTENT ═══ */}
          <main className="flex-1 px-4 pb-8">
            <div className="max-w-lg mx-auto space-y-5">
              {/* ═══════════════════════════════ */}
              {/* ═══ SEARCH CARD              ═══ */}
              {/* ═══════════════════════════════ */}
              <div className="relative group">
                <div
                  className="absolute -inset-0.5 bg-gradient-to-r
                              from-purple-600/15 via-violet-600/15
                              to-blue-600/15 rounded-[20px] blur-xl
                              opacity-70 group-hover:opacity-100
                              transition-opacity duration-500"
                />
                <div
                  className="relative bg-white/[0.03] backdrop-blur-2xl
                              border border-white/[0.08] rounded-2xl
                              p-5 sm:p-6"
                >
                  <form onSubmit={handleSearch}>
                    <div className="space-y-4">
                      {/* ─── Village Dropdown ─── */}
                      <div>
                        <label
                          className="text-[11px] font-medium text-gray-400
                                      mb-2 ml-1 uppercase tracking-wider
                                      flex items-center gap-1.5"
                        >
                          <svg
                            className="w-3 h-3 text-purple-400/60"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19.5 10.5c0 7.142-7.5 11.25-7.5
                                 11.25S4.5 17.642 4.5 10.5a7.5 7.5
                                 0 1115 0z"
                            />
                          </svg>
                          গ্রামের নাম নির্বাচন করুন
                        </label>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            aria-expanded={dropdownOpen}
                            aria-haspopup="listbox"
                            className={`
                              w-full px-4 py-3 bg-white/[0.03] border
                              rounded-xl text-sm text-left flex items-center
                              justify-between transition-all cursor-pointer
                              ${
                                dropdownOpen
                                  ? "border-purple-500/30 ring-2 ring-purple-500/15 bg-purple-500/[0.02]"
                                  : village
                                    ? "border-purple-500/15 bg-purple-500/[0.02]"
                                    : "border-white/[0.06] hover:border-white/[0.12]"
                              }
                            `}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-6 h-6 rounded-lg flex items-center
                                            justify-center ${
                                              village
                                                ? "bg-purple-500/15"
                                                : "bg-white/[0.05]"
                                            }`}
                              >
                                <svg
                                  className={`w-3.5 h-3.5 ${
                                    village
                                      ? "text-purple-400"
                                      : "text-gray-500"
                                  }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5
                                       11.25S4.5 17.642 4.5 10.5a7.5 7.5
                                       0 1115 0z"
                                  />
                                </svg>
                              </div>
                              <span
                                className={
                                  village
                                    ? "text-white font-medium"
                                    : "text-gray-600"
                                }
                              >
                                {village || "গ্রাম নির্বাচন করুন..."}
                              </span>
                            </div>
                            <svg
                              className={`w-4 h-4 text-gray-500
                                          transition-transform duration-300
                                          ${dropdownOpen ? "rotate-180" : ""}`}
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
                          </button>

                          {/* Dropdown panel */}
                          {dropdownOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => {
                                  setDropdownOpen(false);
                                  setVillageSearch("");
                                }}
                              />
                              <div
                                className="absolute top-full left-0 right-0
                                            mt-2 z-20 bg-[#12121c] border
                                            border-white/[0.08] rounded-xl
                                            shadow-2xl shadow-black/60
                                            overflow-hidden animate-drop-in"
                                role="listbox"
                              >
                                {/* Search inside dropdown */}
                                <div className="p-2.5 border-b border-white/[0.06]">
                                  <div className="relative">
                                    <svg
                                      className="absolute left-3 top-1/2
                                                  -translate-y-1/2 w-3.5
                                                  h-3.5 text-gray-500"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-5.197-5.197m0
                                           0A7.5 7.5 0 105.196
                                           5.196a7.5 7.5 0
                                           0010.607 10.607z"
                                      />
                                    </svg>
                                    <input
                                      type="text"
                                      value={villageSearch}
                                      onChange={(e) =>
                                        setVillageSearch(e.target.value)
                                      }
                                      placeholder="গ্রাম খুঁজুন..."
                                      className="w-full pl-9 pr-3 py-2
                                                 bg-white/[0.04] border
                                                 border-white/[0.06]
                                                 rounded-lg text-xs
                                                 text-white
                                                 placeholder-gray-600
                                                 focus:outline-none
                                                 focus:ring-1
                                                 focus:ring-purple-500/30"
                                      autoFocus
                                    />
                                  </div>
                                </div>

                                {/* Options */}
                                <div className="max-h-52 overflow-y-auto py-1">
                                  {filteredVillages.length === 0 ? (
                                    <div
                                      className="px-4 py-4 text-center
                                                  text-xs text-gray-600"
                                    >
                                      কোনো গ্রাম পাওয়া যায়নি
                                    </div>
                                  ) : (
                                    filteredVillages.map((v) => (
                                      <button
                                        key={v}
                                        type="button"
                                        role="option"
                                        aria-selected={village === v}
                                        onClick={() => selectVillage(v)}
                                        className={`
                                          w-full px-4 py-2.5 text-left
                                          text-sm transition-all cursor-pointer
                                          flex items-center gap-2.5
                                          ${
                                            village === v
                                              ? "bg-purple-500/10 text-purple-300"
                                              : "text-gray-300 hover:bg-white/[0.04] hover:text-white"
                                          }
                                        `}
                                      >
                                        <svg
                                          className={`w-3.5 h-3.5 shrink-0
                                                      ${
                                                        village === v
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
                                            strokeWidth={1.5}
                                            d="M15 10.5a3 3 0 11-6
                                               0 3 3 0 016 0z"
                                          />
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M19.5 10.5c0 7.142-7.5
                                               11.25-7.5 11.25S4.5
                                               17.642 4.5 10.5a7.5
                                               7.5 0 1115 0z"
                                          />
                                        </svg>
                                        {v}
                                        {village === v && (
                                          <svg
                                            className="w-3.5 h-3.5
                                                       text-purple-400 ml-auto"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M4.5 12.75l6 6 9-13.5"
                                            />
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

                      {/* ─── Serial Number Input ─── */}
                      <div>
                        <label
                          className="text-[11px] font-medium text-gray-400
                                      mb-2 ml-1 uppercase tracking-wider
                                      flex items-center gap-1.5"
                        >
                          <svg
                            className="w-3 h-3 text-blue-400/60"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9
                                 19.5m-2.1-19.5l-3.9 19.5"
                            />
                          </svg>
                          ক্রমিক নম্বর
                        </label>
                        <div className="relative">
                          <div
                            className={`absolute left-3.5 top-1/2
                                        -translate-y-1/2 w-6 h-6
                                        rounded-lg flex items-center
                                        justify-center ${
                                          serialNumber
                                            ? "bg-blue-500/15"
                                            : "bg-white/[0.05]"
                                        }`}
                          >
                            <svg
                              className={`w-3.5 h-3.5 ${
                                serialNumber
                                  ? "text-blue-400"
                                  : "text-gray-500"
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9
                                   19.5m-2.1-19.5l-3.9 19.5"
                              />
                            </svg>
                          </div>
                          <input
                            type="tel"
                            inputMode="numeric"
                            value={serialNumber}
                            onChange={(e) => setSerialNumber(e.target.value)}
                            placeholder="ক্রমিক নম্বর লিখুন..."
                            className={`
                              w-full pl-12 pr-4 py-3 bg-white/[0.03]
                              border rounded-xl text-sm text-white
                              placeholder-gray-600 focus:outline-none
                              focus:ring-2 focus:ring-purple-500/15
                              focus:border-purple-500/30 transition-all
                              [appearance:textfield]
                              [&::-webkit-outer-spin-button]:appearance-none
                              [&::-webkit-inner-spin-button]:appearance-none
                              ${
                                serialNumber
                                  ? "border-blue-500/15 bg-blue-500/[0.02]"
                                  : "border-white/[0.06]"
                              }
                            `}
                          />
                        </div>
                      </div>

                      {/* ─── Error Message ─── */}
                      {error && searched && (
                        <div
                          className="p-3.5 bg-red-500/[0.04] border
                                      border-red-500/15 rounded-xl flex
                                      items-center gap-3 animate-shake"
                          role="alert"
                        >
                          <div
                            className="w-9 h-9 bg-red-500/10 rounded-xl
                                        flex items-center justify-center
                                        shrink-0"
                          >
                            <svg
                              className="w-4 h-4 text-red-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M12 9v3.75m9-.75a9 9 0
                                   11-18 0 9 9 0 0118
                                   0zm-9 3.75h.008v.008H12v-.008z"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-red-400 text-xs font-medium">
                              {error}
                            </p>
                            <p className="text-red-400/40 text-[10px] mt-0.5">
                              নম্বর ও গ্রামের নাম যাচাই করে আবার চেষ্টা করুন
                            </p>
                          </div>
                        </div>
                      )}

                      {/* ─── Action Buttons ─── */}
                      <div className="flex gap-2.5 pt-1">
                        {hasInput && (
                          <button
                            type="button"
                            onClick={handleClear}
                            className="px-4 py-3 bg-white/[0.03] border
                                       border-white/[0.06] text-gray-400
                                       rounded-xl text-xs font-medium
                                       hover:bg-white/[0.06] hover:text-white
                                       transition-all cursor-pointer
                                       active:scale-95"
                          >
                            মুছুন
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={loading || !serialNumber || !village}
                          className="flex-1 py-3 bg-gradient-to-r
                                     from-purple-600 via-violet-600
                                     to-blue-600 text-white rounded-xl
                                     text-sm font-medium hover:shadow-xl
                                     hover:shadow-purple-500/25
                                     transition-all duration-300
                                     disabled:opacity-40
                                     disabled:cursor-not-allowed
                                     flex items-center justify-center
                                     gap-2 cursor-pointer
                                     active:scale-[0.98]"
                        >
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
                                  d="M4 12a8 8 0 018-8V0C5.373
                                     0 0 5.373 0 12h4z"
                                />
                              </svg>
                              অনুসন্ধান হচ্ছে...
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
                                  d="M21 21l-5.197-5.197m0
                                     0A7.5 7.5 0 105.196
                                     5.196a7.5 7.5 0
                                     0010.607 10.607z"
                                />
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

              {/* ═══════════════════════════════════ */}
              {/* ═══ RESULTS                      ═══ */}
              {/* ═══════════════════════════════════ */}
              {results.length > 0 && (
                <div className="space-y-4 animate-result-reveal">
                  {/* Result summary */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 bg-emerald-500/10 rounded-xl
                                    flex items-center justify-center
                                    border border-emerald-500/15"
                      >
                        <svg
                          className="w-4 h-4 text-emerald-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12.75L11.25 15 15 9.75M21
                               12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-emerald-300">
                          {toBangla(results.length)} জন ভোটার পাওয়া গেছে
                        </p>
                        <p className="text-[10px] text-gray-500">
                          ক্রমিক #{toBangla(serialNumber)} — {village}
                        </p>
                      </div>
                    </div>
                    {results.length > 1 && (
                      <span
                        className="text-[9px] font-bold text-amber-400
                                    bg-amber-500/10 px-2.5 py-1
                                    rounded-lg border border-amber-500/15"
                      >
                        {toBangla(results.length)} টি ফলাফল
                      </span>
                    )}
                  </div>

                  {/* ─── Voter Cards ─── */}
                  {results.map((result, index) => {
                    const isExpanded = expandedCard === result._id;
                    const variant = CARD_VARIANTS[index % CARD_VARIANTS.length];

                    return (
                      <div key={result._id} className="relative">
                        {/* Glow */}
                        <div
                          className={`absolute -inset-0.5 bg-gradient-to-r
                                      ${variant.glow} rounded-[22px]
                                      blur-xl opacity-50`}
                        />

                        <div
                          className={`
                            relative bg-[#0c0c14]/90 backdrop-blur-2xl
                            border rounded-2xl overflow-hidden
                            transition-all duration-300
                            ${
                              isExpanded
                                ? variant.borderActive
                                : "border-white/[0.06] hover:border-white/[0.12]"
                            }
                          `}
                        >
                          {/* ── Card Header (clickable) ── */}
                          <button
                            onClick={() =>
                              setExpandedCard(
                                isExpanded ? null : result._id
                              )
                            }
                            className="w-full text-left cursor-pointer"
                            aria-expanded={isExpanded}
                          >
                            <div className="relative overflow-hidden">
                              <div
                                className={`absolute inset-0 bg-gradient-to-br
                                            ${variant.headerBg} to-transparent`}
                              />
                              <div
                                className="relative px-5 py-4 flex
                                            items-center gap-3.5"
                              >
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                  <div
                                    className="w-12 h-12 bg-gradient-to-br
                                                from-purple-500 via-violet-500
                                                to-blue-500 rounded-xl flex
                                                items-center justify-center
                                                text-lg font-bold text-white
                                                shadow-lg shadow-purple-500/20"
                                  >
                                    {result.name.charAt(0)}
                                  </div>
                                  <div
                                    className="absolute -bottom-0.5 -right-0.5
                                                w-4 h-4 bg-emerald-500
                                                rounded-full flex items-center
                                                justify-center border-2
                                                border-[#0c0c14]"
                                  >
                                    <svg
                                      className="w-2 h-2 text-white"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M4.5 12.75l6 6 9-13.5"
                                      />
                                    </svg>
                                  </div>
                                </div>

                                {/* Name + meta */}
                                <div className="flex-1 min-w-0">
                                  <h3
                                    className="text-base font-bold
                                                text-white truncate"
                                  >
                                    {result.name}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span
                                      className="text-[10px] font-mono
                                                  text-purple-300
                                                  bg-purple-500/10
                                                  px-2 py-0.5 rounded-md"
                                    >
                                      #{toBangla(result.serialNumber)}
                                    </span>
                                    <span className="text-[10px] text-gray-500">
                                      বয়স:{" "}
                                      {toBangla(calcAge(result.dateOfBirth))}
                                    </span>
                                  </div>
                                </div>

                                {/* Source badge + chevron */}
                                <div className="flex items-center gap-2 shrink-0">
                                  <span
                                    className={`text-[8px] font-bold px-2
                                                py-0.5 rounded-md uppercase
                                                ${
                                                  result.addedBy === "system"
                                                    ? "text-amber-400 bg-amber-500/10 border border-amber-500/15"
                                                    : "text-emerald-400 bg-emerald-500/10 border border-emerald-500/15"
                                                }`}
                                  >
                                    {result.addedBy === "system"
                                      ? "SYS"
                                      : "SELF"}
                                  </span>
                                  <svg
                                    className={`w-4 h-4 text-gray-500
                                                transition-transform
                                                duration-300 ${
                                                  isExpanded
                                                    ? "rotate-180"
                                                    : ""
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
                            </div>
                          </button>

                          {/* ── Expanded Detail ── */}
                          <ExpandableSection isOpen={isExpanded}>
                            <div
                              className="h-[1px] bg-gradient-to-r
                                          from-transparent
                                          via-emerald-500/20
                                          to-transparent"
                            />
                            <div className="p-5 sm:p-6 space-y-4">
                              {/* NID / Voter Number */}
                              <div
                                className="relative overflow-hidden rounded-xl
                                            bg-gradient-to-r
                                            from-purple-500/[0.08]
                                            to-cyan-500/[0.08] border
                                            border-purple-500/10 p-4"
                              >
                                <div
                                  className="absolute top-0 left-0 w-1
                                              h-full bg-gradient-to-b
                                              from-purple-500 to-cyan-500
                                              rounded-full"
                                />
                                <div
                                  className="relative flex items-center
                                              justify-between pl-3"
                                >
                                  <div>
                                    <p
                                      className="text-[8px] font-bold
                                                  text-gray-500 uppercase
                                                  tracking-[0.2em]"
                                    >
                                      ভোটার নম্বর / NID
                                    </p>
                                    <p
                                      className="text-lg font-mono
                                                  font-black text-white
                                                  tracking-[0.15em] mt-1"
                                    >
                                      {toBangla(result.voterNumber)}
                                    </p>
                                  </div>
                                  <CopyButton
                                    text={String(result.voterNumber)}
                                    fieldId={`nid-${result._id}`}
                                    copiedField={copiedField}
                                    onCopy={copyToClipboard}
                                  />
                                </div>
                              </div>

                              {/* Info Grid 2×3 */}
                              <div className="grid grid-cols-2 gap-3">
                                <InfoTile
                                  icon={
                                    <svg
                                      className="w-2.5 h-2.5 text-sky-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15.75 6a3.75 3.75 0
                                           11-7.5 0 3.75 3.75 0
                                           017.5 0zM4.501 20.118a7.5
                                           7.5 0 0114.998
                                           0A17.933 17.933 0 0112
                                           21.75c-2.676
                                           0-5.216-.584-7.499-1.632z"
                                      />
                                    </svg>
                                  }
                                  label="পিতা/স্বামী"
                                  value={
                                    result.fatherOrHusbandName || "তথ্য নেই"
                                  }
                                  colorClass="bg-sky-500/10"
                                  hoverBorder="hover:border-sky-500/20"
                                />

                                <InfoTile
                                  icon={
                                    <svg
                                      className="w-2.5 h-2.5 text-rose-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935
                                           0-3.597 1.126-4.312
                                           2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1
                                           3.75 3 5.765 3 8.25c0 7.22 9 12 9
                                           12s9-4.78 9-12z"
                                      />
                                    </svg>
                                  }
                                  label="মাতা"
                                  value={result.motherName || "তথ্য নেই"}
                                  colorClass="bg-rose-500/10"
                                  hoverBorder="hover:border-rose-500/20"
                                />

                                <InfoTile
                                  icon={
                                    <svg
                                      className="w-2.5 h-2.5 text-blue-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6.75 3v2.25M17.25
                                           3v2.25M3 18.75V7.5a2.25
                                           2.25 0 012.25-2.25h13.5A2.25
                                           2.25 0 0121 7.5v11.25m-18
                                           0A2.25 2.25 0 005.25
                                           21h13.5A2.25 2.25 0 0021
                                           18.75m-18 0v-7.5A2.25
                                           2.25 0 015.25 9h13.5A2.25
                                           2.25 0 0121 11.25v7.5"
                                      />
                                    </svg>
                                  }
                                  label="জন্ম তারিখ"
                                  value={formatDate(result.dateOfBirth)}
                                  colorClass="bg-blue-500/10"
                                  hoverBorder="hover:border-blue-500/20"
                                />

                                <InfoTile
                                  icon={
                                    <svg
                                      className="w-2.5 h-2.5 text-amber-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 6v6h4.5m4.5
                                           0a9 9 0 11-18 0 9 9
                                           0 0118 0z"
                                      />
                                    </svg>
                                  }
                                  label="বয়স"
                                  value={`${toBangla(
                                    calcAge(result.dateOfBirth)
                                  )} বছর`}
                                  colorClass="bg-amber-500/10"
                                  hoverBorder="hover:border-amber-500/20"
                                  large
                                />

                                <InfoTile
                                  icon={
                                    <svg
                                      className="w-2.5 h-2.5 text-purple-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5.25 8.25h15m-16.5
                                           7.5h15m-1.8-13.5l-3.9
                                           19.5m-2.1-19.5l-3.9 19.5"
                                      />
                                    </svg>
                                  }
                                  label="ক্রমিক"
                                  value={toBangla(result.serialNumber)}
                                  colorClass="bg-purple-500/10"
                                  hoverBorder="hover:border-purple-500/20"
                                  large
                                />

                                <InfoTile
                                  icon={
                                    <svg
                                      className="w-2.5 h-2.5 text-emerald-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 10.5a3 3 0 11-6
                                           0 3 3 0 016 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19.5 10.5c0 7.142-7.5
                                           11.25-7.5 11.25S4.5
                                           17.642 4.5 10.5a7.5
                                           7.5 0 1115 0z"
                                      />
                                    </svg>
                                  }
                                  label="গ্রাম"
                                  value={result.village}
                                  colorClass="bg-emerald-500/10"
                                  hoverBorder="hover:border-emerald-500/20"
                                />
                              </div>

                              {/* Polling Center */}
                              <div
                                className="relative overflow-hidden
                                            bg-gradient-to-r
                                            from-emerald-500/[0.06]
                                            to-teal-500/[0.04] border
                                            border-emerald-500/10
                                            rounded-xl p-4"
                              >
                                <div
                                  className="absolute top-0 left-0 w-1
                                              h-full bg-gradient-to-b
                                              from-emerald-500 to-teal-500
                                              rounded-full"
                                />
                                <div className="pl-3 flex items-center gap-3">
                                  <div
                                    className="w-10 h-10 rounded-xl
                                                bg-emerald-500/10 border
                                                border-emerald-500/15
                                                flex items-center
                                                justify-center shrink-0"
                                  >
                                    <svg
                                      className="w-5 h-5 text-emerald-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M12 21v-8.25M15.75
                                           21v-8.25M8.25
                                           21v-8.25M3 9l9-6 9
                                           6m-1.5 12V10.332A48.36
                                           48.36 0 0012
                                           9.75c-2.551
                                           0-5.056.2-7.5.582V21M3
                                           21h18M12
                                           6.75h.008v.008H12V6.75z"
                                      />
                                    </svg>
                                  </div>
                                  <div>
                                    <p
                                      className="text-[8px] font-bold
                                                  text-gray-500 uppercase
                                                  tracking-[0.2em]"
                                    >
                                      ভোটকেন্দ্র
                                    </p>
                                    <p
                                      className="text-sm font-bold
                                                  text-emerald-400 mt-1
                                                  leading-snug"
                                    >
                                      {result.pollingCenter}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Source meta */}
                              <div
                                className="bg-white/[0.02] border
                                            border-white/[0.04] rounded-xl"
                              >
                                <div
                                  className="flex items-center
                                              justify-between px-4 py-2.5"
                                >
                                  <span
                                    className="text-[10px] text-gray-500
                                                font-medium"
                                  >
                                    Source
                                  </span>
                                  <span
                                    className={`text-[9px] font-bold px-2
                                                py-0.5 rounded-md ${
                                                  result.addedBy === "system"
                                                    ? "text-amber-400 bg-amber-500/10 border border-amber-500/15"
                                                    : "text-emerald-400 bg-emerald-500/10 border border-emerald-500/15"
                                                }`}
                                  >
                                    {result.addedBy === "system"
                                      ? "🔒 System"
                                      : "✏️ Self"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </ExpandableSection>
                        </div>
                      </div>
                    );
                  })}

                  {/* Search again */}
                  <button
                    onClick={handleClear}
                    className="w-full py-3 bg-white/[0.03] border
                               border-white/[0.06] text-gray-400
                               rounded-xl text-xs font-medium
                               hover:bg-white/[0.06] hover:text-white
                               transition-all cursor-pointer flex
                               items-center justify-center gap-2
                               active:scale-[0.98]"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-5.197-5.197m0
                           0A7.5 7.5 0 105.196
                           5.196a7.5 7.5 0
                           0010.607 10.607z"
                      />
                    </svg>
                    নতুন অনুসন্ধান করুন
                  </button>
                </div>
              )}

              {/* ═══ Empty State ═══ */}
              {results.length === 0 && !error && !searched && (
                <div className="text-center py-10">
                  <div className="relative inline-block">
                    <div
                      className="absolute -inset-4 bg-purple-500/[0.03]
                                  rounded-full blur-2xl"
                    />
                    <div
                      className="relative w-20 h-20 bg-white/[0.02]
                                  border border-white/[0.06] rounded-2xl
                                  flex items-center justify-center
                                  mx-auto mb-4"
                    >
                      <svg
                        className="w-9 h-9 text-gray-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M21 21l-5.197-5.197m0
                             0A7.5 7.5 0 105.196
                             5.196a7.5 7.5 0
                             0010.607 10.607z"
                        />
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

              {/* ═══ Village Tags ═══ */}
              {!searched && (
                <div
                  className="bg-white/[0.015] backdrop-blur border
                              border-white/[0.05] rounded-2xl p-5"
                >
                  <div className="flex items-center gap-2.5 mb-4">
                    <div
                      className="w-7 h-7 bg-blue-500/10 rounded-lg
                                  flex items-center justify-center"
                    >
                      <svg
                        className="w-3.5 h-3.5 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19.5 10.5c0 7.142-7.5 11.25-7.5
                             11.25S4.5 17.642 4.5 10.5a7.5
                             7.5 0 1115 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xs font-semibold text-gray-300">
                      অন্তর্ভুক্ত গ্রামসমূহ
                    </h3>
                    <span
                      className="text-[9px] text-blue-400 bg-blue-500/10
                                  px-1.5 py-0.5 rounded-full ml-auto
                                  border border-blue-500/10"
                    >
                      {toBangla(VILLAGES_NAME_NEW.length)} টি
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {VILLAGES_NAME_NEW.map((v) => (
                      <button
                        key={v}
                        onClick={() => selectVillage(v)}
                        className={`
                          px-2.5 py-1.5 text-[11px] rounded-lg border
                          transition-all cursor-pointer active:scale-95
                          ${
                            village === v
                              ? "bg-purple-500/15 border-purple-500/20 text-purple-300 shadow-sm shadow-purple-500/10"
                              : "bg-white/[0.02] border-white/[0.04] text-gray-500 hover:text-gray-300 hover:border-white/[0.1] hover:bg-white/[0.03]"
                          }
                        `}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>

          {/* ═══ FOOTER ═══ */}
          <footer className="py-5 px-4 border-t border-white/[0.03]">
            <div
              className="max-w-lg mx-auto flex items-center
                          justify-center gap-1.5 text-[10px] text-gray-700"
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
                  strokeWidth={1.5}
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959
                     11.959 0 013.598 6 11.99 11.99 0 003
                     9.749c0 5.592 3.824 10.29 9 11.623
                     5.176-1.332 9-6.03 9-11.622
                     0-1.31-.21-2.571-.598-3.751h-.152c-3.196
                     0-6.1-1.248-8.25-3.285z"
                />
              </svg>
              সকল তথ্য নিরাপদে সংরক্ষিত
            </div>
          </footer>
        </div>
      </div>


    </>
  );
}