"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SearchCriteria {
  dob: string;
  ward: string;
}

interface DeviceInfo {
  browser?: string;
  os?: string;
  deviceType?: string;
  vendor?: string;
  model?: string;
}

interface NetworkInfo {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  isp?: string;
  timezone?: string;
}

interface ResultSummary {
  name?: string;
  father_name?: string;
  sereal_no?: string;
}

interface SearchLogDoc {
  _id: string;
  searchCriteria: SearchCriteria;
  deviceInfo: DeviceInfo;
  network: NetworkInfo;
  result?: ResultSummary;
  createdAt: string;
  updatedAt: string;
}

type SortOption = "latest" | "oldest";

const LogsDashboardPage: React.FC = () => {
  const [logs, setLogs] = useState<SearchLogDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [sort, setSort] = useState<SortOption>("latest");
  const [selectedLog, setSelectedLog] = useState<SearchLogDoc | null>(null);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);

  const fetchLogs = async (sortOption: SortOption) => {
    try {
      setLoading(true);
      setError("");

      const sortParam = sortOption === "latest" ? "desc" : "asc";
      const res = await fetch(`/api/logs?limit=200&sort=${sortParam}`);

      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      const data: { logs: SearchLogDoc[] } = await res.json();
      setLogs(data.logs || []);
    } catch (err: any) {
      console.error("Fetch logs error:", err);
      setError("লগ ডাটা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(sort);
  }, [sort]);

  const handleOpenDetails = (log: SearchLogDoc) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleString("bn-BD", {
      timeZone: "Asia/Dhaka",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-slate-100 px-4 py-6 md:px-8 md:py-8">
      {/* ব্যাকগ্রাউন্ড glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-60">
        <div className="absolute -top-32 -right-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80 mb-1">
              Admin • Analytics
            </p>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              সার্চ লগ ড্যাশবোর্ড
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              ব্যবহারকারীরা জন্ম তারিখ ও গ্রাম দিয়ে যে সব ভোটার সার্চ করেছে, সেগুলোর সারসংক্ষেপ, ডিভাইস এবং নেটওয়ার্ক ইনফো এখানে দেখা যাবে।
            </p>
          </div>

          {/* Sort Control */}
          <div className="flex flex-col items-end gap-2">
            <span className="text-xs text-slate-400">
              Sort by created time
            </span>
            <div className="inline-flex items-center rounded-full bg-slate-900/70 border border-slate-700 px-1 py-1 shadow-md shadow-black/40">
              <button
                type="button"
                onClick={() => setSort("latest")}
                className={`px-3 py-1.5 cursor-pointer rounded-full text-xs font-semibold transition ${
                  sort === "latest"
                    ? "bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-400/60"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Latest
              </button>
              <button
                type="button"
                onClick={() => setSort("oldest")}
                className={`px-3 py-1.5 rounded-full cursor-pointer text-xs font-semibold transition ${
                  sort === "oldest"
                    ? "bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-400/60"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Oldest
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="text-sm rounded-xl border border-red-500/40 bg-red-500/10 text-red-200 px-3 py-2">
            {error}
          </div>
        )}

        {/* Table Card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.75)] backdrop-blur-md overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              সার্চ লগ লিস্ট
            </div>
            <div className="text-[11px] text-slate-300">
              মোট রেকর্ড:{" "}
              <span className="font-semibold text-emerald-300">
                {logs.length}
              </span>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-10 text-center text-sm text-emerald-200">
              ডাটা লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...
            </div>
          )}

          {/* Empty */}
          {!loading && logs.length === 0 && !error && (
            <div className="py-10 text-center text-sm text-slate-400">
              এখনো কোনো সার্চ লগ পাওয়া যায়নি।
            </div>
          )}

          {/* Table */}
          {!loading && logs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm border-collapse">
                <thead className="bg-slate-900/90 border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold text-slate-300 whitespace-nowrap">
                      তারিখ (সার্চ)
                    </th>
                    <th className="px-3 py-2.5 font-semibold text-slate-300 whitespace-nowrap">
                      DOB
                    </th>
                    <th className="px-3 py-2.5 font-semibold text-slate-300 whitespace-nowrap">
                      গ্রাম / Ward
                    </th>
                    <th className="px-3 py-2.5 font-semibold text-slate-300 whitespace-nowrap">
                      IP
                    </th>
                    <th className="px-3 py-2.5 font-semibold text-slate-300 whitespace-nowrap">
                      Device
                    </th>
                    <th className="px-3 py-2.5 font-semibold text-slate-300 whitespace-nowrap">
                      Country
                    </th>
                    <th className="px-3 py-2.5 font-semibold text-slate-300 whitespace-nowrap">
                      Result
                    </th>
                    <th className="px-3 py-2.5 font-semibold text-slate-300 text-right whitespace-nowrap">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr
                      key={log._id}
                      className={`border-b border-slate-800/80 ${
                        index % 2 === 0
                          ? "bg-slate-900/50"
                          : "bg-slate-900/30"
                      } hover:bg-slate-800/80 transition`}
                    >
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        <span className="text-slate-100 text-xs md:text-[13px]">
                          {formatDateTime(log.createdAt)}
                        </span>
                      </td>

                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        <span className="text-slate-100">
                          {log.searchCriteria?.dob}
                        </span>
                      </td>

                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        <span className="text-slate-100">
                          {log.searchCriteria?.ward}
                        </span>
                      </td>

                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        <span className="text-emerald-200 font-mono text-[11px]">
                          {log.network?.ip}
                        </span>
                      </td>

                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        <span className="block text-slate-100">
                          {log.deviceInfo?.browser || "Unknown"}
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {log.deviceInfo?.os || ""} •{" "}
                          {log.deviceInfo?.deviceType || ""}
                        </span>
                      </td>

                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        <span className="block text-slate-100">
                          {log.network?.country || "—"}
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {log.network?.city || ""}
                          {log.network?.city && log.network?.region
                            ? ", "
                            : ""}
                          {log.network?.region || ""}
                        </span>
                      </td>

                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        {log.result?.name ? (
                          <>
                            <span className="block text-emerald-300 font-semibold">
                              {log.result.name}
                            </span>
                            <span className="block text-[11px] text-slate-400">
                              Srl: {log.result.sereal_no || "—"}
                            </span>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            No match
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-2 align-top text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs bg-emerald-800 border-emerald-500/60 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 cursor-pointer hover:border-emerald-400"
                          onClick={() => handleOpenDetails(log)}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Details Modal (shadcn Dialog) */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-lg  md:max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 text-slate-100 border border-slate-700 shadow-2xl shadow-black/70">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg text-emerald-300">
                সার্চ লগ বিস্তারিত
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                ব্যবহারকারীর সার্চ ইনপুট, ডিভাইস, নেটওয়ার্ক এবং ফলাফল সম্পর্কিত ডিটেইলস।
              </DialogDescription>
            </DialogHeader>

            {selectedLog && (
              <div className="mt-3 space-y-5 text-xs md:text-sm text-slate-100">
                {/* Search Criteria */}
                <section className="space-y-2 bg-slate-900/70 border border-slate-700 rounded-xl px-3.5 py-3">
                  <h3 className="font-semibold text-slate-100 flex items-center gap-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Search Criteria
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[12px]">
                    <div>
                      <span className="font-medium text-slate-200">
                        DOB:
                      </span>{" "}
                      {selectedLog.searchCriteria?.dob}
                    </div>
                    <div>
                      <span className="font-medium text-slate-200">
                        Ward/গ্রাম:
                      </span>{" "}
                      {selectedLog.searchCriteria?.ward}
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium text-slate-200">
                        Searched at:
                      </span>{" "}
                      {formatDateTime(selectedLog.createdAt)}
                    </div>
                  </div>
                </section>

                {/* Result */}
                <section className="space-y-2 bg-slate-900/70 border border-slate-700 rounded-xl px-3.5 py-3">
                  <h3 className="font-semibold text-slate-100 flex items-center gap-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Result
                  </h3>
                  {selectedLog.result?.name ? (
                    <div className="space-y-1 text-[12px]">
                      <div>
                        <span className="font-medium text-slate-200">
                          Name:
                        </span>{" "}
                        {selectedLog.result.name}
                      </div>
                      <div>
                        <span className="font-medium text-slate-200">
                          Father/হুই:
                        </span>{" "}
                        {selectedLog.result.father_name || "—"}
                      </div>
                      <div>
                        <span className="font-medium text-slate-200">
                          Serial No:
                        </span>{" "}
                        {selectedLog.result.sereal_no || "—"}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[12px] text-slate-400">
                      কোনো ভোটার পাওয়া যায়নি (API তে No match)।
                    </p>
                  )}
                </section>

                {/* Device Info */}
                <section className="space-y-2 bg-slate-900/70 border border-slate-700 rounded-xl px-3.5 py-3">
                  <h3 className="font-semibold text-slate-100 flex items-center gap-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Device Info
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-[12px]">
                    <div>
                      <span className="font-medium text-slate-200">
                        Browser:
                      </span>{" "}
                      {selectedLog.deviceInfo?.browser || "Unknown"}
                    </div>
                    <div>
                      <span className="font-medium text-slate-200">
                        OS:
                      </span>{" "}
                      {selectedLog.deviceInfo?.os || "Unknown"}
                    </div>
                    <div>
                      <span className="font-medium text-slate-200">
                        Device Type:
                      </span>{" "}
                      {selectedLog.deviceInfo?.deviceType || "Desktop"}
                    </div>
                    <div>
                      <span className="font-medium text-slate-200">
                        Vendor:
                      </span>{" "}
                      {selectedLog.deviceInfo?.vendor || "—"}
                    </div>
                    <div>
                      <span className="font-medium text-slate-200">
                        Model:
                      </span>{" "}
                      {selectedLog.deviceInfo?.model || "—"}
                    </div>
                  </div>
                </section>

                {/* Network Info */}
                <section className="space-y-2 bg-slate-900/70 border border-slate-700 rounded-xl px-3.5 py-3">
                  <h3 className="font-semibold text-slate-100 flex items-center gap-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Network
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-[12px]">
                    <div className="col-span-2">
                      <span className="font-medium text-slate-200">
                        IP:
                      </span>{" "}
                      {selectedLog.network?.ip}
                    </div>
                    <div>
                      <span className="font-medium text-slate-200">
                        Country:
                      </span>{" "}
                      {selectedLog.network?.country || "—"}
                    </div>
                    <div>
                      <span className="font-medium text-slate-200">
                        City:
                      </span>{" "}
                      {selectedLog.network?.city || "—"}
                    </div>
                    <div>
                      <span className="font-medium text-slate-200">
                        Region:
                      </span>{" "}
                      {selectedLog.network?.region || "—"}
                    </div>
                    <div>
                      <span className="font-medium text-slate-200">
                        ISP:
                      </span>{" "}
                      {selectedLog.network?.isp || "—"}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-slate-200">
                        Timezone:
                      </span>{" "}
                      {selectedLog.network?.timezone || "—"}
                    </div>
                  </div>
                </section>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default LogsDashboardPage;