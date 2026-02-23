"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { AppleIcon, Logs, Search, SettingsIcon, TestTubeIcon } from "lucide-react";
import { AdminLayoutContext } from "./components/contex";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [admin, setAdmin] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const verify = async () => {
      const res = await fetch("/api/auth/verify");
      const data = await res.json();
      if (data.success) setAdmin(data.user);
    };
    verify();
  }, []);

  const performLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/access");
      router.refresh();
    } catch {
      setLoggingOut(false);
      setLogoutModal(false);
    }
  };

  const handleLogout = async () => {
    setLogoutModal(true);
  };

  const navItems = [
    {
      label: "Dashboard",
      href: "/console",
      icon: (
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
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
          />
        </svg>
      ),
    },
    {
      label: "Find",
      href: "/console/find",
      icon: <Search size={14} />,
    },
    {
      label: "Log",
      href: "/console/log",
      icon: <Logs size={14} />,
    },
    {
      label: "Control",
      href: "/console/control",
      icon: <SettingsIcon size={14} />,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/console") return pathname === "/console";
    return pathname.startsWith(href);
  };

  return (
    <AdminLayoutContext.Provider
      value={{ sidebarOpen, setSidebarOpen, handleLogout, admin }}
    >
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        {/* Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px]" />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            }}
          />
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ═══════════════════════════════════════ */}
        {/* ═══ SIDEBAR — w-48, compact spacing ═══ */}
        {/* ═══════════════════════════════════════ */}
        <aside
          className={`fixed top-0 left-0 h-full w-48 bg-white/[0.02] backdrop-blur-xl border-r border-white/[0.06] z-50 transform transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-3">
            {/* Logo — compact */}
            <div className="flex items-center gap-2 mb-5 px-1">
              <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
                <svg
                  className="w-3.5 h-3.5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-[11px] font-bold text-white leading-tight">
                  VoterAdmin
                </h2>
                <p className="text-[8px] text-gray-600">Panel</p>
              </div>
            </div>

            {/* Nav — tight */}
            <nav className="space-y-0.5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                >
                  <button
                    className={`w-full cursor-pointer flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                      isActive(item.href)
                        ? "bg-purple-500/10 border border-purple-500/20 text-purple-300"
                        : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.03] border border-transparent"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                </Link>
              ))}
            </nav>
          </div>

          {/* Admin Info — compact */}
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-md flex items-center justify-center text-[9px] font-bold shrink-0">
                {admin?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-white truncate">
                  {admin?.name || admin?.phoneNumber || "Admin"}
                </p>
                <p className="text-[8px] text-gray-600">Admin</p>
              </div>
              <button
                onClick={() => setLogoutModal(true)}
                className="p-1 cursor-pointer text-gray-600 hover:text-red-400 transition-colors rounded-md hover:bg-red-500/5"
                title="Logout"
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
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                  />
                </svg>
              </button>
            </div>
          </div>
        </aside>

        {/* ★ main margin updated: lg:ml-48 */}
        <main className="lg:ml-48 relative">{children}</main>

        {/* ═══ LOGOUT MODAL ═══ */}
        {logoutModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => {
                if (!loggingOut) setLogoutModal(false);
              }}
            />
            <div className="relative w-full max-w-[300px] animate-[modalIn_0.25s_ease]">
              <div className="absolute -inset-0.5 bg-gradient-to-b from-red-600/15 to-orange-600/10 rounded-2xl blur-xl" />
              <div className="relative bg-[#111118] border border-white/[0.08] rounded-2xl overflow-hidden">
                <div className="h-[2px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
                <div className="p-5">
                  {/* Icon */}
                  <div className="flex justify-center mb-3">
                    <div className="relative">
                      <div className="absolute -inset-2 bg-red-500/10 rounded-full blur-xl animate-[pulse_2s_ease-in-out_infinite]" />
                      <div className="relative w-11 h-11 bg-gradient-to-br from-red-500/15 to-orange-500/15 rounded-xl flex items-center justify-center border border-red-500/15">
                        <svg
                          className="w-5 h-5 text-red-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Text */}
                  <div className="text-center mb-4">
                    <h3 className="text-sm font-bold text-white mb-1">
                      লগআউট করতে চান?
                    </h3>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      সেশন শেষ হবে। পুনরায় লগইন করতে হবে।
                    </p>
                  </div>

                  {/* Admin Preview */}
                  <div className="mb-4 p-2.5 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg flex items-center justify-center text-[9px] font-bold text-emerald-400 border border-emerald-500/15">
                      {admin?.name?.charAt(0)?.toUpperCase() || "A"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium text-white truncate">
                        {admin?.name || "Administrator"}
                      </p>
                      <p className="text-[8px] text-gray-500 truncate">
                        {admin?.phoneNumber || "Admin Account"}
                      </p>
                    </div>
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLogoutModal(false)}
                      disabled={loggingOut}
                      className="flex-1 py-2 bg-white/[0.03] border border-white/[0.06] text-gray-400 rounded-xl text-[11px] font-medium hover:bg-white/[0.06] hover:text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
                    >
                      বাতিল
                    </button>
                    <button
                      onClick={performLogout}
                      disabled={loggingOut}
                      className="flex-1 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl text-[11px] font-medium hover:shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 active:scale-[0.97]"
                    >
                      {loggingOut ? (
                        <>
                          <svg
                            className="animate-spin w-3 h-3"
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
                          <span className="text-[10px]">লগআউট হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                            />
                          </svg>
                          লগআউট
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes modalIn {
          from {
            opacity: 0;
            transform: scale(0.93) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </AdminLayoutContext.Provider>
  );
}