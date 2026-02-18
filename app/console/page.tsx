"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdminLayout } from "./components/contex";

// ─── Types ───
interface Voter {
  _id: string;
  name: string;
  dateOfBirth: string;
  serialNumber: number;
  createdAt: string;
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

type ModalType = "add" | "edit" | "delete" | null;

export default function AdminDashboard() {
  const { setSidebarOpen, handleLogout } = useAdminLayout();

  // ─── State ───
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

  // Modal state
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    serialNumber: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ─── Fetch Stats ───
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  }, []);

  // ─── Fetch Voters ───
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
        });

        const res = await fetch(`/api/admin/items?${params}`);
        const data = await res.json();

        if (data.success) {
          setVoters(data.data);
          setPagination(data.pagination);
        }
      } catch (err) {
        console.error("Voters fetch error:", err);
      } finally {
        setLoading(false);
      }
    },
    [search, sortBy, sortOrder, fromDate, toDate]
  );

  useEffect(() => {
    fetchVoters();
    fetchStats();
  }, [fetchVoters, fetchStats]);

  // ─── Debounced Search ───
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ─── Add Voter ───
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
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModal(null);
        setFormData({ name: "", dateOfBirth: "", serialNumber: "" });
        setSuccessMsg("Voter added successfully!");
        fetchVoters();
        fetchStats();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setFormError(data.message);
      }
    } catch {
      setFormError("Failed to add voter");
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Edit Voter ───
  const handleEdit = async () => {
    if (!selectedVoter) return;
    setFormError("");
    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/${selectedVoter._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          dateOfBirth: formData.dateOfBirth,
          serialNumber: parseInt(formData.serialNumber),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModal(null);
        setSelectedVoter(null);
        setSuccessMsg("Voter updated successfully!");
        fetchVoters();
        fetchStats();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setFormError(data.message);
      }
    } catch {
      setFormError("Failed to update voter");
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Delete Voter ───
  const handleDelete = async () => {
    if (!selectedVoter) return;
    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/${selectedVoter._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setModal(null);
        setSelectedVoter(null);
        setSuccessMsg("Voter deleted successfully!");
        fetchVoters();
        fetchStats();
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch {
      setFormError("Failed to delete voter");
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Open Edit Modal ───
  const openEdit = (voter: Voter) => {
    setSelectedVoter(voter);
    setFormData({
      name: voter.name,
      dateOfBirth: voter.dateOfBirth.split("T")[0],
      serialNumber: voter.serialNumber.toString(),
    });
    setFormError("");
    setModal("edit");
  };

  // ─── Open Delete Modal ───
  const openDelete = (voter: Voter) => {
    setSelectedVoter(voter);
    setModal("delete");
  };

  // ─── Open Add Modal ───
  const openAdd = () => {
    setFormData({ name: "", dateOfBirth: "", serialNumber: "" });
    setFormError("");
    setModal("add");
  };

  // ─── Format Date ───
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ─── Calculate Age ───
  const calcAge = (dob: string) => {
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  };

  // ─── Clear Filters ───
  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setFromDate("");
    setToDate("");
    setSortBy("createdAt");
    setSortOrder("desc");
  };

  return (
    <>
      {/* ─── Top Bar ─── */}
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex items-center justify-between px-4 lg:px-6 py-3">
          {/* Mobile menu button */}
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

          <div className="flex items-center gap-3">
            {/* Add Voter Button */}
            <button
              onClick={openAdd}
              className="flex cursor-pointer items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-xs font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 active:scale-95"
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

            {/* Logout (mobile) */}
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
        {/* ─── Success Message ─── */}
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

        {/* ───────── Stats Cards ───────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Voters */}
          <div className="group bg-white/[0.02] backdrop-blur border border-white/[0.06] rounded-2xl p-4 hover:border-purple-500/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                  />
                </svg>
              </div>
              <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                Total
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats?.totalVoters ?? "—"}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">All Voters</p>
          </div>

          {/* Today Added */}
          <div className="group bg-white/[0.02] backdrop-blur border border-white/[0.06] rounded-2xl p-4 hover:border-emerald-500/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-emerald-400"
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
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Today
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats?.todayAdded ?? "—"}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">Added Today</p>
          </div>

          {/* This Month */}
          <div className="group bg-white/[0.02] backdrop-blur border border-white/[0.06] rounded-2xl p-4 hover:border-blue-500/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-blue-400"
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
              <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                Month
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats?.thisMonthAdded ?? "—"}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">This Month</p>
          </div>

          {/* Latest Serial */}
          <div className="group bg-white/[0.02] backdrop-blur border border-white/[0.06] rounded-2xl p-4 hover:border-amber-500/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-amber-400"
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
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                Latest
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              #{stats?.latestSerial ?? "—"}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">Last Serial</p>
          </div>
        </div>

        {/* ───────── Search & Filters ───────── */}
        <div className="bg-white/[0.02] backdrop-blur border border-white/[0.06] rounded-2xl p-4">
          {/* Search bar */}
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
              placeholder="Search by name or serial number..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/30 transition-all"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                }}
                className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
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

          {/* Filters row */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* DOB From */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-500 uppercase">From</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500/30 [color-scheme:dark]"
              />
            </div>

            {/* DOB To */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-500 uppercase">To</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500/30 [color-scheme:dark]"
              />
            </div>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split("-");
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="px-2.5 py-1.5 bg-gray-900 border border-gray-900 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500/30 [color-scheme:dark]"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="serialNumber-asc">Serial ↑</option>
              <option value="serialNumber-desc">Serial ↓</option>
            </select>

            {/* Clear */}
            {(searchInput ||
              fromDate ||
              toDate ||
              sortBy !== "createdAt") && (
              <button
                onClick={clearFilters}
                className="px-2.5 py-1.5 cursor-pointer text-[10px] text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                Clear All
              </button>
            )}

            {/* Results count */}
            <span className="ml-auto text-[10px] text-gray-500">
              {pagination.total} results
            </span>
          </div>
        </div>

        {/* ───────── Voter Table ───────── */}
        <div className="bg-white/[0.02] backdrop-blur border border-white/[0.06] rounded-2xl overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Serial
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Name
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Date of Birth
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Age
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Added
                  </th>
                  <th className="text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-4 py-3">
                        <div className="h-4 bg-white/[0.03] rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : voters.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <svg
                          className="w-10 h-10 text-gray-700"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                        <p className="text-gray-600 text-sm">
                          No voters found
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  voters.map((voter) => (
                    <tr
                      key={voter._id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                          #{voter.serialNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center text-[10px] font-bold text-purple-300 border border-purple-500/10">
                            {voter.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-white font-medium">
                            {voter.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {formatDate(voter.dateOfBirth)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-400">
                          {calcAge(voter.dateOfBirth)} yrs
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {formatDate(voter.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(voter)}
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
                            onClick={() => openDelete(voter)}
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
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-white/[0.04]">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="p-4">
                  <div className="h-16 bg-white/[0.03] rounded-xl animate-pulse" />
                </div>
              ))
            ) : voters.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600 text-sm">No voters found</p>
              </div>
            ) : (
              voters.map((voter) => (
                <div
                  key={voter._id}
                  className="p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl flex items-center justify-center text-sm font-bold text-purple-300 border border-purple-500/10">
                        {voter.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {voter.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                            #{voter.serialNumber}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {calcAge(voter.dateOfBirth)} yrs
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-600 mt-0.5">
                          DOB: {formatDate(voter.dateOfBirth)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(voter)}
                        className="p-2 cursor-pointer text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
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
                        onClick={() => openDelete(voter)}
                        className="p-2 cursor-pointer text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
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
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ─── Pagination ─── */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
              <p className="text-[10px] text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex items-center gap-1">
                {/* Prev */}
                <button
                  onClick={() => fetchVoters(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="p-1.5 rounded-lg cursor-pointer text-gray-500 hover:text-white hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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

                {/* Page Numbers */}
                {Array.from(
                  { length: Math.min(pagination.totalPages, 5) },
                  (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (
                      pagination.page >=
                      pagination.totalPages - 2
                    ) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => fetchVoters(pageNum)}
                        className={`w-8 h-8 rounded-lg cursor-pointer text-xs font-medium transition-all ${
                          pagination.page === pageNum
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : "text-gray-500 hover:text-white hover:bg-white/[0.05]"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}

                {/* Next */}
                <button
                  onClick={() => fetchVoters(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="p-1.5 rounded-lg text-gray-500 cursor-pointer hover:text-white hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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

      {/* ───────────────────────────────────── */}
      {/* ───────── MODALS ───────── */}
      {/* ───────────────────────────────────── */}

      {/* ─── Add / Edit Modal ─── */}
      {(modal === "add" || modal === "edit") && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setModal(null)}
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-sm animate-[scaleIn_0.2s_ease]">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl blur-lg" />
            <div className="relative bg-[#111118] border border-white/[0.08] rounded-2xl p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      modal === "add"
                        ? "bg-purple-500/10 text-purple-400"
                        : "bg-blue-500/10 text-blue-400"
                    }`}
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
                  <h3 className="text-base font-semibold text-white">
                    {modal === "add" ? "Add New Voter" : "Edit Voter"}
                  </h3>
                </div>
                <button
                  onClick={() => setModal(null)}
                  className="p-1.5 text-gray-500 cursor-pointer hover:text-white hover:bg-white/[0.05] rounded-lg transition-all"
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

              {/* Error */}
              {formError && (
                <div className="mb-4 p-2.5 bg-red-500/5 border border-red-500/20 rounded-xl">
                  <p className="text-red-400 text-xs">{formError}</p>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter voter name"
                    className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/30 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/30 transition-all [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
                    Serial Number
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
                    placeholder="Enter serial number"
                    className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/30 transition-all"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2.5 mt-5">
                <button
                  onClick={() => setModal(null)}
                  className="flex-1 py-2.5 bg-white/[0.03] cursor-pointer border border-white/[0.06] text-gray-400 rounded-xl text-xs font-medium hover:bg-white/[0.06] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={modal === "add" ? handleAdd : handleEdit}
                  disabled={
                    formLoading ||
                    !formData.name ||
                    !formData.dateOfBirth ||
                    !formData.serialNumber
                  }
                  className="flex-1 cursor-pointer py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-xs font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {formLoading ? (
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
                  ) : null}
                  {modal === "add" ? "Add Voter" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {modal === "delete" && selectedVoter && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setModal(null)}
          />

          <div className="relative w-full max-w-xs animate-[scaleIn_0.2s_ease]">
            <div className="absolute -inset-0.5 bg-red-600/10 rounded-2xl blur-lg" />
            <div className="relative bg-[#111118] border border-white/[0.08] rounded-2xl p-6 text-center">
              {/* Warning Icon */}
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
              <p className="text-xs text-gray-500 mb-1">
                This will permanently remove
              </p>
              <p className="text-sm text-white font-medium mb-4">
                {selectedVoter.name} (#{selectedVoter.serialNumber})
              </p>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setModal(null)}
                  className="flex-1 py-2.5 cursor-pointer bg-white/[0.03] border border-white/[0.06] text-gray-400 rounded-xl text-xs font-medium hover:bg-white/[0.06] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={formLoading}
                  className="flex-1 py-2.5 cursor-pointer bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs font-medium hover:bg-red-500/30 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  {formLoading ? (
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
                  ) : null}
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Custom Animations ─── */}
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
      `}</style>
    </>
  );
}