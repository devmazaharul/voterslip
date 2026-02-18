"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Search, SettingsIcon } from "lucide-react";
import { AdminLayoutContext } from "./components/contex";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [admin, setAdmin] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const verify = async () => {
      const res = await fetch("/api/auth/verify");
      const data = await res.json();
      if (data.success) setAdmin(data.user);
    };
    verify();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/access");
    router.refresh();
  };

  // ─── Nav Items Config ───
  const navItems = [
    {
      label: "Dashboard",
      href: "/console",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
    },
    {
      label: "Find",
      href: "/console/find",
      icon: <Search size={16} />,
    },
    {
      label: "Control",
      href: "/console/control",
      icon: <SettingsIcon size={16} />,
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

        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 h-full w-64 bg-white/[0.02] backdrop-blur-xl border-r border-white/[0.06] z-50 transform transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-5">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">VoterAdmin</h2>
                <p className="text-[10px] text-gray-500">Management Panel</p>
              </div>
            </div>

            {/* Dynamic Nav */}
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                  <button
                    className={`w-full cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
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

          {/* Admin Info */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-xs font-bold">
                {admin?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">
                  {admin?.name || admin?.phoneNumber || "Admin"}
                </p>
                <p className="text-[10px] text-gray-500">Administrator</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 cursor-pointer text-gray-500 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
              </button>
            </div>
          </div>
        </aside>

        <main className="lg:ml-64 relative">{children}</main>
      </div>
    </AdminLayoutContext.Provider>
  );
}