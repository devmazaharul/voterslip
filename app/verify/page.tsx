'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
 import axios from 'axios';

const LoginPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

 

const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {

        const { data,status } = await axios.post('/api/auth/login', { password });

        if(status==200){
          router.push('/admin');
        }else{
          throw new Error(data.message)
        }

    } catch (err: any) {
        console.error('Login error:', err);
        const errorMessage = err.response?.data?.message || 'লগইন করতে সমস্যা হয়েছে বা সার্ভার সমস্যা।';
        setError(errorMessage);

    } finally {
        setLoading(false);
    }
};

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center px-4">
            {/* ব্যাকগ্রাউন্ড glow */}
            <div className="pointer-events-none fixed inset-0 -z-10 opacity-60">
                <div className="absolute -top-32 -right-24 h-72 w-72 rounded-full bg-emerald-500/25 blur-3xl" />
                <div className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-sky-500/25 blur-3xl" />
            </div>

            <div className="w-full max-w-sm">
                <div className="bg-slate-950/80 border border-slate-800 rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.9)] backdrop-blur-xl px-6 py-6 md:px-8 md:py-7">
                    <div className="mb-5 text-center space-y-1.5">
                        <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">
                            Admin Login
                        </p>
                        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">
                            ড্যাশবোর্ড লগইন
                        </h1>
                        <p className="text-xs text-slate-300">
                            শুধুমাত্র পাসওয়ার্ড দিয়ে লগইন করুন। (Username ফিক্সড)
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-xs font-medium text-slate-200 mb-1.5"
                            >
                                পাসওয়ার্ড
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition placeholder:text-slate-500"
                                placeholder="********"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !password}
                            className={`w-full py-2.5 rounded-lg text-sm font-semibold tracking-wide shadow-lg shadow-emerald-900/60 transition 
                ${
                    loading || !password
                        ? 'bg-emerald-700/40 text-emerald-100 cursor-not-allowed'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                }`}
                        >
                            {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
                        </button>

                        {error && (
                            <div className="mt-2 text-[11px] rounded-md border border-red-500/50 bg-red-500/10 text-red-200 px-3 py-2 text-center">
                                {error}
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
