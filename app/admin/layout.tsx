'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        try {
            setLoggingOut(true);
            await axios.post('/api/auth/logout');
        } catch (e: any) {
            console.error('Logout error:', e.response?.data || e.message);
        } finally {
            setLoggingOut(false);

            router.push('/verify');
        }
    };
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-slate-100">
            {/* ব্যাকগ্রাউন্ড গ্লো */}
            <div className="pointer-events-none fixed inset-0 -z-10 opacity-60">
                <div className="absolute -top-32 -right-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
                <div className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
            </div>

            <div className="min-h-screen flex flex-col">
                {/* Top bar */}
                <header className="sticky top-0 z-20 bg-slate-950/90 border-b border-slate-800 backdrop-blur-md">
                    <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
                        <div>
                            <div className="text-sm md:text-base font-semibold text-slate-100">
                                Voter Admin Dashboard
                            </div>
                            <div className="text-[11px] text-slate-400">
                                যশোর সদর • ১৪ নং ইউনিয়ন
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-400">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                Logged in as{' '}
                                <span className="font-semibold text-slate-100">admin</span>
                            </span>
                            <button
                                type="button"
                                onClick={handleLogout}
                                disabled={loggingOut}
                                className={`px-3 py-1.5 cursor-pointer rounded-full text-xs font-semibold border shadow-sm transition 
                  ${
                      loggingOut
                          ? 'border-slate-600 bg-slate-800 text-slate-300 cursor-not-allowed'
                          : 'border-emerald-400/70 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500 hover:text-slate-950 hover:border-emerald-300'
                  }`}
                            >
                                {loggingOut ? 'লগআউট হচ্ছে...' : 'Logout'}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main content */}
                <main className="flex-1">
                    <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 md:py-8">{children}</div>
                </main>
            </div>
        </div>
    );
}
