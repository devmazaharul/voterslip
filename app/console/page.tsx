"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdminLayout } from "./components/contex";
import { VILLAGES_NAME_NEW } from "../api/newvoter/utils";

// ─── Types ───
interface Voter {
  _id: string;
  userId: string;
  name: string;
  dateOfBirth: string;
  serialNumber: number;
  voterNumber: string;
  village: string;
  motherName: string;
  fatherOrHusbandName: string;
  pollingCenter: string;
  addedBy: "system" | "self";
  createdAt: string;
  updatedAt?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface Stats {
  totalVoters: number;
  todayAdded: number;
  thisMonthAdded: number;
  latestSerial: number;
}

type ModalType = "add" | "edit" | "delete" | "details" | null;

export default function AdminDashboard() {
  const { setSidebarOpen, handleLogout } = useAdminLayout();

  const [voters, setVoters] = useState<Voter[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // ╔══════════════════════════════════════════╗
  // ║ ★ Village Filter — নতুন state যোগ করা ★ ║
  // ╚══════════════════════════════════════════╝
  const [filterVillage, setFilterVillage] = useState("");
  const [villageFilterOpen, setVillageFilterOpen] = useState(false);

  const [modal, setModal] = useState<ModalType>(null);
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    serialNumber: "",
    voterNumber: "",
    village: "",
    motherName: "",
    fatherOrHusbandName: "",
    pollingCenter: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [villageSelectOpen, setVillageSelectOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ─── Fetch ───
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchVoters = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "10",
          search,
          sortBy,
          sortOrder,
          ...(fromDate && { fromDate }),
          ...(toDate && { toDate }),
          // ★ village filter param
          ...(filterVillage && { village: filterVillage }),
        });
        const res = await fetch(`/api/admin/items?${params}`);
        const data = await res.json();
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
    // ★ filterVillage dependency যোগ
    [search, sortBy, sortOrder, fromDate, toDate, filterVillage]
  );

  useEffect(() => {
    fetchVoters();
    fetchStats();
  }, [fetchVoters, fetchStats]);

  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchVoters(pagination.page), fetchStats()]);
      setSuccessMsg("Data refreshed!");
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch {
      /* handled inside fetchers */
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  };

  // ─── CRUD ───
  const resetForm = () => {
    setFormData({
      name: "",
      dateOfBirth: "",
      serialNumber: "",
      voterNumber: "",
      village: "",
      motherName: "",
      fatherOrHusbandName: "",
      pollingCenter: "",
    });
    setFormError("");
    setVillageSelectOpen(false);
  };

  const handleAdd = async () => {
    setFormError("");
    setFormLoading(true);
    try {
      const res = await fetch("/api/admin/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          dateOfBirth: formData.dateOfBirth,
          serialNumber: parseInt(formData.serialNumber),
          voterNumber: formData.voterNumber,
          village: formData.village,
          motherName: formData.motherName,
          fatherOrHusbandName: formData.fatherOrHusbandName,
          pollingCenter: formData.pollingCenter,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModal(null);
        resetForm();
        setSuccessMsg("Voter added!");
        fetchVoters();
        fetchStats();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else setFormError(data.message);
    } catch {
      setFormError("Failed to add");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedVoter) return;
    setFormError("");
    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/items/${selectedVoter._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          dateOfBirth: formData.dateOfBirth,
          serialNumber: parseInt(formData.serialNumber),
          voterNumber: formData.voterNumber,
          village: formData.village,
          motherName: formData.motherName,
          fatherOrHusbandName: formData.fatherOrHusbandName,
          pollingCenter: formData.pollingCenter,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModal(null);
        setSelectedVoter(null);
        setSuccessMsg("Voter updated!");
        fetchVoters();
        fetchStats();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else setFormError(data.message);
    } catch {
      setFormError("Failed to update");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVoter) return;
    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/items/${selectedVoter._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setModal(null);
        setSelectedVoter(null);
        setSuccessMsg("Voter deleted!");
        fetchVoters();
        fetchStats();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else setFormError(data.message);
    } catch {
      setFormError("Failed to delete");
    } finally {
      setFormLoading(false);
    }
  };

  const openAdd = () => {
    resetForm();
    setModal("add");
  };

  const openEdit = (v: Voter) => {
    if (v.addedBy === "system") return;
    setSelectedVoter(v);
    setFormData({
      name: v.name,
      dateOfBirth: v.dateOfBirth.split("T")[0],
      serialNumber: v.serialNumber.toString(),
      voterNumber: v.voterNumber || "",
      village: v.village || "",
      motherName: v.motherName || "",
      fatherOrHusbandName: v.fatherOrHusbandName || "",
      pollingCenter: v.pollingCenter || "",
    });
    setFormError("");
    setVillageSelectOpen(false);
    setModal("edit");
  };

  const openDelete = (v: Voter) => {
    if (v.addedBy === "system") return;
    setSelectedVoter(v);
    setModal("delete");
  };

  const openDetails = (v: Voter) => {
    setSelectedVoter(v);
    setModal("details");
  };

  const handleModalVillageSelect = (village: string) => {
    setFormData({
      ...formData,
      village: formData.village === village ? "" : village,
    });
    setVillageSelectOpen(false);
  };

  // ─── Helpers ───
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const calcAge = (d: string) =>
    Math.floor(
      (Date.now() - new Date(d).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );

  const isEditable = (v: Voter) => v.addedBy === "self";

  const isFormValid =
    formData.name.trim() !== "" &&
    formData.dateOfBirth !== "" &&
    formData.serialNumber !== "" &&
    formData.voterNumber.trim() !== "" &&
    formData.village !== "" &&
    formData.pollingCenter.trim() !== "";

  // ★ clearFilters — filterVillage ও reset
  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setFromDate("");
    setToDate("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setFilterVillage("");
    setVillageFilterOpen(false);
  };

  // ★ hasActiveFilters — village ও check
  const hasActiveFilters =
    searchInput ||
    fromDate ||
    toDate ||
    sortBy !== "createdAt" ||
    filterVillage;

  const AddedByBadge = ({ addedBy }: { addedBy: "system" | "self" }) => (
    <span
      className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
        addedBy === "system"
          ? "text-amber-400 bg-amber-500/10 border border-amber-500/15"
          : "text-emerald-400 bg-emerald-500/10 border border-emerald-500/15"
      }`}
    >
      {addedBy === "system" ? "🔒 System" : "✏️ Self"}
    </span>
  );

  const formFields = [
    formData.name,
    formData.fatherOrHusbandName,
    formData.motherName,
    formData.dateOfBirth,
    formData.serialNumber,
    formData.voterNumber,
    formData.village,
    formData.pollingCenter,
  ];
  const filledCount = formFields.filter(Boolean).length;

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <>
      {/* ─── Top Bar ─── */}
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex items-center justify-between px-4 lg:px-6 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 cursor-pointer text-gray-400 hover:text-white transition-colors"
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
          <h1 className="text-base font-semibold hidden lg:block">
            Dashboard
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh data"
              className="relative group p-2 cursor-pointer rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-purple-500/20 text-gray-400 hover:text-white disabled:cursor-not-allowed transition-all active:scale-90"
            >
              <svg
                className={`w-4 h-4 transition-transform duration-500 ${
                  refreshing ? "animate-spin" : "group-hover:rotate-180"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                />
              </svg>
              {refreshing && (
                <span className="absolute inset-0 rounded-xl border-2 border-purple-500/40 animate-ping pointer-events-none" />
              )}
            </button>

            <button
              onClick={openAdd}
              className="flex cursor-pointer items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-xs font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all active:scale-95"
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
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              <span className="hidden sm:inline">Add Voter</span>
            </button>
            <button
              onClick={handleLogout}
              className="lg:hidden cursor-pointer p-2 text-gray-400 hover:text-red-400 transition-colors"
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
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 lg:p-6 space-y-5">
        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 animate-[slideDown_0.3s_ease]">
            <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <svg
                className="w-3 h-3 text-emerald-400"
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
            </div>
            <p className="text-emerald-400 text-xs">{successMsg}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: "All Voters",
              value: stats?.totalVoters,
              tag: "Total",
              color: "purple",
              icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
            },
            {
              label: "Added Today",
              value: stats?.todayAdded,
              tag: "Today",
              color: "emerald",
              icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
            },
            {
              label: "This Month",
              value: stats?.thisMonthAdded,
              tag: "Month",
              color: "blue",
              icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
            },
            {
              label: "Last Serial",
              value: stats?.latestSerial ? `#${stats.latestSerial}` : "—",
              tag: "Latest",
              color: "amber",
              icon: "M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`bg-white/[0.02] backdrop-blur border border-white/[0.06] rounded-2xl p-4 hover:border-${s.color}-500/20 transition-all`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-9 h-9 bg-${s.color}-500/10 rounded-xl flex items-center justify-center`}
                >
                  <svg
                    className={`w-4 h-4 text-${s.color}-400`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d={s.icon}
                    />
                  </svg>
                </div>
                <span
                  className={`text-[10px] text-${s.color}-400 bg-${s.color}-500/10 px-2 py-0.5 rounded-full`}
                >
                  {s.tag}
                </span>
              </div>
              <p className="text-2xl font-bold text-white">{s.value ?? "—"}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ╔══════════════════════════════════════════════════════════╗ */}
        {/* ║ Search & Filters — ★ Village Filter Dropdown যোগ করা ★ ║ */}
        {/* ╚══════════════════════════════════════════════════════════╝ */}
     <div className="relative z-10 bg-white/[0.02] backdrop-blur border border-white/[0.06] rounded-2xl p-4">

          <div className="relative mb-3">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
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
            <input
              type="text"
              placeholder="Search name, voter number, village, father, mother..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                }}
                className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
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

          <div className="flex flex-wrap gap-2 items-center">
            {/* ╔═══════════════════════════════════════════════╗ */}
            {/* ║ ★ VILLAGE FILTER DROPDOWN — নতুন যোগ করা ★   ║ */}
            {/* ╚═══════════════════════════════════════════════╝ */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setVillageFilterOpen(!villageFilterOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer border ${
                  filterVillage
                    ? "bg-blue-500/10 border-blue-500/25 text-blue-300"
                    : "bg-white/[0.03] border-white/[0.06] text-gray-400 hover:text-white hover:border-white/[0.12]"
                }`}
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
                <span className="truncate max-w-[100px]">
                  {filterVillage || "সব গ্রাম"}
                </span>
                {filterVillage ? (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilterVillage("");
                      setVillageFilterOpen(false);
                    }}
                    className="p-0.5 hover:bg-white/10 rounded cursor-pointer"
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
                ) : (
                  <svg
                    className={`w-3 h-3 transition-transform ${villageFilterOpen ? "rotate-180" : ""}`}
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
                )}
              </button>

              {villageFilterOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[40]"
                    onClick={() => setVillageFilterOpen(false)}
                  />
                  <div className="absolute z-[50] mt-1.5 left-0 w-56 animate-[dropIn_0.2s_ease]">
                    <div className="bg-[#0d0d14] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden">
                      <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                          গ্রাম ফিল্টার
                        </p>
                        <span className="text-[9px] text-gray-600 font-mono">
                          {VILLAGES_NAME_NEW.length}টি
                        </span>
                      </div>

                      {/* সব গ্রাম option */}
                      <button
                        type="button"
                        onClick={() => {
                          setFilterVillage("");
                          setVillageFilterOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm cursor-pointer border-b border-white/[0.04] ${
                          !filterVillage
                            ? "bg-purple-500/10 text-purple-300"
                            : "text-gray-400 hover:bg-white/[0.04] hover:text-white"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                            !filterVillage
                              ? "bg-purple-500/20 border-purple-500/40"
                              : "border-white/[0.08]"
                          }`}
                        >
                          {!filterVillage && (
                            <svg
                              className="w-2.5 h-2.5 text-purple-400"
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
                        <span className="text-xs font-medium">
                          সব গ্রাম দেখুন
                        </span>
                      </button>

                      <div className="max-h-48 overflow-y-auto scrollbar-thin">
                        {VILLAGES_NAME_NEW.map((village) => {
                          const isSel = filterVillage === village;
                          return (
                            <button
                              key={village}
                              type="button"
                              onClick={() => {
                                setFilterVillage(
                                  filterVillage === village ? "" : village
                                );
                                setVillageFilterOpen(false);
                              }}
                              className={`w-full z-50 flex items-center gap-3 px-3 py-2 text-left text-sm cursor-pointer ${
                                isSel
                                  ? "bg-blue-500/10 text-blue-300"
                                  : "text-gray-400 hover:bg-white/[0.04] hover:text-white"
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                                  isSel
                                    ? "bg-blue-500/20 border-blue-500/40"
                                    : "border-white/[0.08]"
                                }`}
                              >
                                {isSel && (
                                  <svg
                                    className="w-2.5 h-2.5 text-blue-400"
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
                              <span className="text-xs">{village}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-500 uppercase">From</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs text-white focus:outline-none [color-scheme:dark]"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-500 uppercase">To</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs text-white focus:outline-none [color-scheme:dark]"
              />
            </div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split("-");
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="px-2.5 py-1.5 bg-gray-900 border border-gray-900 rounded-lg text-xs text-white cursor-pointer [color-scheme:dark]"
            >
              <option value="createdAt-desc">Newest</option>
              <option value="createdAt-asc">Oldest</option>
              <option value="name-asc">Name A-Z</option>
              <option value="serialNumber-asc">Serial ↑</option>
              <option value="serialNumber-desc">Serial ↓</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-2.5 py-1.5 cursor-pointer text-[10px] text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg hover:bg-red-500/10"
              >
                Clear All
              </button>
            )}

            <span className="ml-auto text-[10px] text-gray-500">
              {pagination.total} results
            </span>
          </div>

          {/* ★ Active Village Filter Badge — নিচে দেখায় কোন গ্রাম সিলেক্ট আছে */}
          {filterVillage && (
            <div className="mt-2.5 flex items-center gap-2">
              <span className="text-[9px] text-gray-500 uppercase tracking-wider">
                Filtering:
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/15 rounded-lg text-[11px] text-blue-300 font-medium">
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
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                  />
                </svg>
                {filterVillage}
                <button
                  onClick={() => setFilterVillage("")}
                  className="p-0.5 hover:bg-white/10 rounded cursor-pointer ml-0.5"
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
                </button>
              </span>
            </div>
          )}
        </div>

        {/* ═══ TABLE ═══ */}
        <div className="bg-white/[0.02] backdrop-blur border border-white/[0.06] rounded-2xl overflow-hidden">
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {[
                    "Serial",
                    "Name",
                    "Father/Husband",
                    "Mother",
                    "Voter No",
                    "Village",
                    "DOB",
                    "Source",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className={`text-${h === "Actions" ? "right" : "left"} text-[10px] font-medium text-gray-500 uppercase tracking-wider px-3 py-3`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={9} className="px-3 py-3">
                        <div className="h-4 bg-white/[0.03] rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : voters.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-gray-600 text-sm"
                    >
                      No voters found
                    </td>
                  </tr>
                ) : (
                  voters.map((v) => {
                    const ed = isEditable(v);
                    return (
                      <tr
                        key={v._id}
                        className={`hover:bg-white/[0.02] transition-colors ${!ed ? "opacity-80" : ""}`}
                      >
                        <td className="px-3 py-2.5">
                          <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                            #{v.serialNumber}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-md flex items-center justify-center text-[9px] font-bold text-purple-300 border border-purple-500/10">
                              {v.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs text-white font-medium truncate max-w-[120px]">
                              {v.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-[11px] text-gray-400 truncate max-w-[100px]">
                          {v.fatherOrHusbandName || "—"}
                        </td>
                        <td className="px-3 py-2.5 text-[11px] text-gray-400 truncate max-w-[100px]">
                          {v.motherName || "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/10 truncate max-w-[100px] inline-block">
                            {v.voterNumber || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded border cursor-pointer transition-all ${
                              filterVillage === v.village
                                ? "text-blue-300 bg-blue-500/20 border-blue-500/30 ring-1 ring-blue-500/20"
                                : "text-blue-400 bg-blue-500/10 border-blue-500/10 hover:bg-blue-500/15"
                            }`}
                            onClick={() =>
                              setFilterVillage(
                                filterVillage === v.village ? "" : v.village
                              )
                            }
                            title={`Click to filter by ${v.village}`}
                          >
                            {v.village || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-[10px] text-gray-400">
                          {formatDate(v.dateOfBirth)}
                        </td>
                        <td className="px-3 py-2.5">
                          <AddedByBadge addedBy={v.addedBy} />
                        </td>

                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openDetails(v)}
                              className="p-1.5 cursor-pointer text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all"
                              title="Details"
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
                                  strokeWidth={1.8}
                                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.8}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                            </button>

                            {ed ? (
                              <>
                                <button
                                  onClick={() => openEdit(v)}
                                  className="p-1.5 cursor-pointer text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                  title="Edit"
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
                                      strokeWidth={1.8}
                                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                    />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => openDelete(v)}
                                  className="p-1.5 cursor-pointer text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                  title="Delete"
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
                                      strokeWidth={1.8}
                                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                    />
                                  </svg>
                                </button>
                              </>
                            ) : (
                              <div
                                className="px-1.5 py-1 bg-amber-500/5 border border-amber-500/10 rounded-lg"
                                title="System — Locked"
                              >
                                <span className="text-[9px] text-amber-500/60 font-bold">
                                  🔒
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ═══ Mobile Cards ═══ */}
          <div className="md:hidden divide-y divide-white/[0.04]">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="p-4">
                  <div className="h-20 bg-white/[0.03] rounded-xl animate-pulse" />
                </div>
              ))
            ) : voters.length === 0 ? (
              <div className="p-8 text-center text-gray-600 text-sm">
                No voters found
              </div>
            ) : (
              voters.map((v) => {
                const ed = isEditable(v);
                return (
                  <div
                    key={v._id}
                    className={`p-4 hover:bg-white/[0.02] ${!ed ? "opacity-80" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl flex items-center justify-center text-sm font-bold text-purple-300 border border-purple-500/10 shrink-0">
                          {v.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white truncate">
                            {v.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                              #{v.serialNumber}
                            </span>
                            {/* ★ Mobile village badge — clickable filter */}
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                                filterVillage === v.village
                                  ? "text-blue-300 bg-blue-500/20 border border-blue-500/30"
                                  : "text-blue-400 bg-blue-500/10"
                              }`}
                              onClick={() =>
                                setFilterVillage(
                                  filterVillage === v.village ? "" : v.village
                                )
                              }
                            >
                              {v.village || "—"}
                            </span>
                            <AddedByBadge addedBy={v.addedBy} />
                          </div>
                          <div className="flex flex-wrap gap-x-3 mt-1">
                            <p className="text-[10px] text-gray-500">
                              পিতা:{" "}
                              <span className="text-gray-400">
                                {v.fatherOrHusbandName || "—"}
                              </span>
                            </p>
                            <p className="text-[10px] text-gray-500">
                              মাতা:{" "}
                              <span className="text-gray-400">
                                {v.motherName || "—"}
                              </span>
                            </p>
                          </div>
                          <p className="text-[10px] text-gray-600 mt-0.5">
                            DOB: {formatDate(v.dateOfBirth)} ·{" "}
                            {calcAge(v.dateOfBirth)}y
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => openDetails(v)}
                          className="p-2 cursor-pointer text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all"
                          title="Details"
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
                              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.8}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </button>

                        {ed ? (
                          <>
                            <button
                              onClick={() => openEdit(v)}
                              className="p-2 cursor-pointer text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg"
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
                                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => openDelete(v)}
                              className="p-2 cursor-pointer text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
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
                                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <div className="p-2 text-amber-500/40" title="Locked">
                            🔒
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
              <p className="text-[10px] text-gray-500">
                Page {pagination.page}/{pagination.totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fetchVoters(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="p-1.5 rounded-lg cursor-pointer text-gray-500 hover:text-white hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed"
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
                      d="M15.75 19.5L8.25 12l7.5-7.5"
                    />
                  </svg>
                </button>
                {Array.from(
                  { length: Math.min(pagination.totalPages, 5) },
                  (_, i) => {
                    let p;
                    if (pagination.totalPages <= 5) p = i + 1;
                    else if (pagination.page <= 3) p = i + 1;
                    else if (pagination.page >= pagination.totalPages - 2)
                      p = pagination.totalPages - 4 + i;
                    else p = pagination.page - 2 + i;
                    return (
                      <button
                        key={p}
                        onClick={() => fetchVoters(p)}
                        className={`w-8 h-8 rounded-lg cursor-pointer text-xs font-medium ${
                          pagination.page === p
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : "text-gray-500 hover:text-white hover:bg-white/[0.05]"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  }
                )}
                <button
                  onClick={() => fetchVoters(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="p-1.5 rounded-lg cursor-pointer text-gray-500 hover:text-white hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed"
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
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ DETAILS MODAL ═══ */}
      {modal === "details" && selectedVoter && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setModal(null);
              setSelectedVoter(null);
            }}
          />
          <div className="relative w-full max-w-md animate-[scaleIn_0.2s_ease]">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/15 via-blue-600/15 to-cyan-600/15 rounded-2xl blur-lg" />
            <div className="relative bg-[#111118] border border-white/[0.08] rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="relative bg-gradient-to-br from-purple-500/[0.08] via-transparent to-blue-500/[0.06] px-6 pt-6 pb-5">
                <div
                  className="absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage: `radial-gradient(circle, rgba(139,92,246,0.4) 1px, transparent 1px)`,
                    backgroundSize: "20px 20px",
                  }}
                />
                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-2xl flex items-center justify-center text-2xl font-black text-white border border-purple-500/20 shadow-lg shadow-purple-500/10">
                          {selectedVoter.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#111118] flex items-center justify-center border border-white/[0.08]">
                          {selectedVoter.addedBy === "system" ? (
                            <span className="text-[10px]">🔒</span>
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white leading-tight">
                          {selectedVoter.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/15">
                            #{selectedVoter.serialNumber}
                          </span>
                          <AddedByBadge addedBy={selectedVoter.addedBy} />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setModal(null);
                        setSelectedVoter(null);
                      }}
                      className="p-1.5 text-gray-500 cursor-pointer hover:text-white hover:bg-white/[0.08] rounded-lg transition-all"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Voter Number Card */}
              <div className="px-6 pt-4">
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-500/[0.08] to-cyan-500/[0.08] border border-purple-500/10 p-4">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-cyan-500 rounded-full" />
                  <div className="relative flex items-center justify-between pl-3">
                    <div>
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                        ভোটার নম্বর / NID
                      </p>
                      <p className="text-lg font-mono font-black text-white tracking-[0.15em] mt-1">
                        {selectedVoter.voterNumber || "—"}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          selectedVoter.voterNumber,
                          "detail-nid"
                        )
                      }
                      className="p-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-all cursor-pointer active:scale-90"
                      title="কপি করুন"
                    >
                      {copiedField === "detail-nid" ? (
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
                            d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="px-6 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3.5 hover:border-white/[0.08] transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/10 flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-sky-400"
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
                      <span className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.15em]">
                        পিতা/স্বামী
                      </span>
                    </div>
                    <p className="text-[12px] font-bold text-white leading-tight pl-0.5">
                      {selectedVoter.fatherOrHusbandName || "তথ্য নেই"}
                    </p>
                  </div>

                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3.5 hover:border-white/[0.08] transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/10 flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-rose-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                          />
                        </svg>
                      </div>
                      <span className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.15em]">
                        মাতা
                      </span>
                    </div>
                    <p className="text-[12px] font-bold text-white leading-tight pl-0.5">
                      {selectedVoter.motherName || "তথ্য নেই"}
                    </p>
                  </div>

                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3.5 hover:border-white/[0.08] transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/10 flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-amber-400"
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
                      <span className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.15em]">
                        জন্ম তারিখ
                      </span>
                    </div>
                    <p className="text-[12px] font-bold text-white font-mono pl-0.5">
                      {formatDate(selectedVoter.dateOfBirth)}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5 pl-0.5">
                      বয়স: {calcAge(selectedVoter.dateOfBirth)} বছর
                    </p>
                  </div>

                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3.5 hover:border-white/[0.08] transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-emerald-400"
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
                      <span className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.15em]">
                        গ্রাম / এলাকা
                      </span>
                    </div>
                    <p className="text-[12px] font-bold text-white leading-tight pl-0.5">
                      {selectedVoter.village || "তথ্য নেই"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Polling Center */}
              <div className="px-6 pb-4">
                <div className="bg-gradient-to-r from-emerald-500/[0.06] to-teal-500/[0.04] border border-emerald-500/10 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center shrink-0">
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
                          d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                        ভোটকেন্দ্র / Polling Center
                      </p>
                      <p className="text-sm font-bold text-emerald-400 mt-1 leading-snug">
                        {selectedVoter.pollingCenter || "তথ্য নেই"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meta Info */}
              <div className="px-6 pb-4">
                <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl divide-y divide-white/[0.04]">
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-[10px] text-gray-500 font-medium">
                      User ID
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-gray-400 max-w-[180px] truncate">
                        {selectedVoter.userId}
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            selectedVoter.userId,
                            "detail-uid"
                          )
                        }
                        className="p-1 rounded hover:bg-white/[0.05] cursor-pointer transition-colors"
                      >
                        {copiedField === "detail-uid" ? (
                          <svg
                            className="w-3 h-3 text-emerald-400"
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
                            className="w-3 h-3 text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.8}
                              d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-[10px] text-gray-500 font-medium">
                      যোগ করা হয়েছে
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {formatDateTime(selectedVoter.createdAt)}
                    </span>
                  </div>
                  {selectedVoter.updatedAt && (
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-[10px] text-gray-500 font-medium">
                        শেষ আপডেট
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {formatDateTime(selectedVoter.updatedAt)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-[10px] text-gray-500 font-medium">
                      Source
                    </span>
                    <AddedByBadge addedBy={selectedVoter.addedBy} />
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-[10px] text-gray-500 font-medium">
                      Status
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isEditable(selectedVoter)
                          ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/15"
                          : "text-amber-400 bg-amber-500/10 border border-amber-500/15"
                      }`}
                    >
                      {isEditable(selectedVoter)
                        ? "✅ Editable"
                        : "🔒 Read-only"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-6 pb-5">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => {
                      setModal(null);
                      setSelectedVoter(null);
                    }}
                    className="flex-1 py-2.5 bg-white/[0.03] cursor-pointer border border-white/[0.06] text-gray-400 rounded-xl text-xs font-medium hover:bg-white/[0.06] transition-all"
                  >
                    বন্ধ করুন
                  </button>
                  {isEditable(selectedVoter) && (
                    <>
                      <button
                        onClick={() => {
                          setModal(null);
                          setTimeout(() => openEdit(selectedVoter), 100);
                        }}
                        className="flex-1 cursor-pointer py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl text-xs font-medium hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
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
                            strokeWidth={1.8}
                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                          />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setModal(null);
                          setTimeout(() => openDelete(selectedVoter), 100);
                        }}
                        className="py-2.5 px-4 cursor-pointer bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-medium hover:bg-red-500/20 transition-all"
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
                            strokeWidth={1.8}
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ADD / EDIT MODAL ═══ */}
      {(modal === "add" || modal === "edit") && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setModal(null);
              setVillageSelectOpen(false);
            }}
          />
          <div className="relative w-full max-w-md animate-[scaleIn_0.2s_ease]">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl blur-lg" />
            <div className="relative bg-[#111118] border border-white/[0.08] rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${modal === "add" ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {modal === "add" ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                        />
                      )}
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {modal === "add" ? "Add New Voter" : "Edit Voter"}
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      addedBy: self
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setModal(null);
                    setVillageSelectOpen(false);
                  }}
                  className="p-1.5 text-gray-500 cursor-pointer hover:text-white hover:bg-white/[0.05] rounded-lg"
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
              </div>

              {formError && (
                <div className="mb-4 p-2.5 bg-red-500/5 border border-red-500/20 rounded-xl">
                  <p className="text-red-400 text-xs">{formError}</p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
                    নাম *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="ভোটারের নাম"
                    className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
                      পিতা/স্বামী
                    </label>
                    <input
                      type="text"
                      value={formData.fatherOrHusbandName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fatherOrHusbandName: e.target.value,
                        })
                      }
                      placeholder="পিতা/স্বামী"
                      className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
                      মাতা
                    </label>
                    <input
                      type="text"
                      value={formData.motherName}
                      onChange={(e) =>
                        setFormData({ ...formData, motherName: e.target.value })
                      }
                      placeholder="মাতার নাম"
                      className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
                      জন্ম তারিখ *
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dateOfBirth: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
                      সিরিয়াল *
                    </label>
                    <input
                      type="number"
                      value={formData.serialNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          serialNumber: e.target.value,
                        })
                      }
                      placeholder="Serial"
                      className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
                    ভোটার নম্বর (NID) *
                  </label>
                  <input
                    type="text"
                    value={formData.voterNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, voterNumber: e.target.value })
                    }
                    placeholder="4107920005xx"
                    className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
                    ভোটকেন্দ্র *
                  </label>
                  <input
                    type="text"
                    value={formData.pollingCenter}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pollingCenter: e.target.value,
                      })
                    }
                    placeholder="ভোটকেন্দ্রের নাম"
                    className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
                    গ্রাম *
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setVillageSelectOpen(!villageSelectOpen)}
                      className={`w-full flex items-center justify-between pl-3.5 pr-3.5 py-2.5 bg-white/[0.03] border rounded-xl text-sm transition-all cursor-pointer ${
                        villageSelectOpen
                          ? "border-blue-500/30 ring-2 ring-blue-500/20"
                          : "border-white/[0.06]"
                      } ${formData.village ? "text-white" : "text-gray-600"}`}
                    >
                      <span className="truncate">
                        {formData.village || "গ্রাম নির্বাচন করুন"}
                      </span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {formData.village && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData({ ...formData, village: "" });
                            }}
                            className="p-0.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-md cursor-pointer"
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
                          className={`w-4 h-4 text-gray-500 transition-transform ${villageSelectOpen ? "rotate-180" : ""}`}
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

                    {villageSelectOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-[70]"
                          onClick={() => setVillageSelectOpen(false)}
                        />
                        <div className="absolute z-[80] mt-1.5 w-full animate-[dropIn_0.2s_ease]">
                          <div className="bg-[#0d0d14] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden">
                            <div className="px-3 py-2 border-b border-white/[0.06]">
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                                {VILLAGES_NAME_NEW.length} টি গ্রাম
                              </p>
                            </div>
                            <div className="max-h-40 overflow-y-auto scrollbar-thin">
                              {VILLAGES_NAME_NEW.map((village) => {
                                const isSel = formData.village === village;
                                return (
                                  <button
                                    key={village}
                                    type="button"
                                    onClick={() =>
                                      handleModalVillageSelect(village)
                                    }
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm cursor-pointer ${
                                      isSel
                                        ? "bg-blue-500/10 text-blue-300"
                                        : "text-gray-400 hover:bg-white/[0.04] hover:text-white"
                                    }`}
                                  >
                                    <div
                                      className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                                        isSel
                                          ? "bg-blue-500/20 border-blue-500/40"
                                          : "border-white/[0.08]"
                                      }`}
                                    >
                                      {isSel && (
                                        <svg
                                          className="w-2.5 h-2.5 text-blue-400"
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
                                    <span className="text-xs">{village}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  {formData.village && (
                    <div className="mt-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/15 rounded-md text-[10px] text-blue-300">
                        📍 {formData.village}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 mb-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-gray-500">
                    Completeness
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {filledCount}/8
                  </span>
                </div>
                <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${(filledCount / 8) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 mt-4">
                <button
                  onClick={() => {
                    setModal(null);
                    setVillageSelectOpen(false);
                  }}
                  className="flex-1 py-2.5 bg-white/[0.03] cursor-pointer border border-white/[0.06] text-gray-400 rounded-xl text-xs font-medium hover:bg-white/[0.06]"
                >
                  Cancel
                </button>
                <button
                  onClick={modal === "add" ? handleAdd : handleEdit}
                  disabled={formLoading || !isFormValid}
                  className="flex-1 cursor-pointer py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-xs font-medium hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {formLoading && (
                    <svg
                      className="animate-spin w-3.5 h-3.5"
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
                  )}
                  {modal === "add" ? "Add Voter" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DELETE MODAL ═══ */}
      {modal === "delete" && selectedVoter && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setModal(null)}
          />
          <div className="relative w-full max-w-xs animate-[scaleIn_0.2s_ease]">
            <div className="absolute -inset-0.5 bg-red-600/10 rounded-2xl blur-lg" />
            <div className="relative bg-[#111118] border border-white/[0.08] rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white mb-1">
                Delete Voter?
              </h3>
              <p className="text-sm text-white font-medium">
                {selectedVoter.name} (#{selectedVoter.serialNumber})
              </p>
              <div className="mt-2 space-y-0.5 mb-4">
                <p className="text-[10px] text-gray-500">
                  NID:{" "}
                  <span className="font-mono text-cyan-400">
                    {selectedVoter.voterNumber}
                  </span>
                </p>
                <p className="text-[10px] text-gray-500">
                  পিতা: {selectedVoter.fatherOrHusbandName || "—"}
                </p>
                <p className="text-[10px] text-blue-400">
                  📍 {selectedVoter.village}
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setModal(null)}
                  className="flex-1 py-2.5 cursor-pointer bg-white/[0.03] border border-white/[0.06] text-gray-400 rounded-xl text-xs font-medium hover:bg-white/[0.06]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={formLoading}
                  className="flex-1 py-2.5 cursor-pointer bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs font-medium hover:bg-red-500/30 disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  {formLoading && (
                    <svg
                      className="animate-spin w-3.5 h-3.5"
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
                  )}
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
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
      `}</style>
    </>
  );
}