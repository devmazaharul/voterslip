// app/access/page.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/console";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, password }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(redirect);
        router.refresh();
      } else {
        setError(data.message || "Login failed!");
      }
    } catch (err) {
      setError("Network error! Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 overflow-hidden relative">

      {/* ─── Animated Background ─── */}
      <div className="fixed inset-0">
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-600/8 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-blue-600/8 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-indigo-600/5 rounded-full blur-[80px] animate-pulse delay-500" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#0a0a0f_70%)]" />
      </div>

      {/* ─── Login Card ─── */}
      <div className="relative w-full max-w-[360px]">

        {/* Glow behind card */}
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-purple-600/20 rounded-3xl blur-xl opacity-60 animate-pulse" />

        <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-7 shadow-[0_0_60px_-15px_rgba(139,92,246,0.15)]">

          {/* ─── Logo ─── */}
          <div className="flex justify-center mb-5">
            <div className="relative group">
              {/* Logo glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
              <div className="relative w-14 h-14 bg-gradient-to-br from-purple-500 via-violet-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-xl">
                <svg
                  className="w-7 h-7 text-white drop-shadow-sm"
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
            </div>
          </div>

          {/* ─── Title ─── */}
          <h1 className="text-xl font-bold text-center text-white mb-1 tracking-tight">
            Admin Access
          </h1>
          <p className="text-gray-500 text-center text-xs mb-6">
            Enter your credentials to continue
          </p>

          {/* ─── Error ─── */}
          {error && (
            <div className="mb-4 p-2.5 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center gap-2 animate-[shake_0.5s_ease-in-out]">
              <div className="w-5 h-5 bg-red-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-red-400 text-xs">!</span>
              </div>
              <p className="text-red-400/90 text-xs">{error}</p>
            </div>
          )}

          {/* ─── Form ─── */}
          <form onSubmit={handleLogin} className="space-y-4">

            {/* Phone Input */}
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
                Phone Number
              </label>
              <div className={`relative rounded-xl transition-all duration-300 ${
                focused === "phone"
                  ? "ring-2 ring-purple-500/30 shadow-[0_0_20px_-5px_rgba(139,92,246,0.2)]"
                  : ""
              }`}>
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg
                    className={`w-4 h-4 transition-colors duration-300 ${
                      focused === "phone" ? "text-purple-400" : "text-gray-600"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
                    />
                  </svg>
                </div>
                <input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onFocus={() => setFocused("phone")}
                  onBlur={() => setFocused(null)}
                  required
                  className="w-full pl-10 pr-3.5 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none transition-all duration-300 hover:border-white/10"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
                Password
              </label>
              <div className={`relative rounded-xl transition-all duration-300 ${
                focused === "password"
                  ? "ring-2 ring-purple-500/30 shadow-[0_0_20px_-5px_rgba(139,92,246,0.2)]"
                  : ""
              }`}>
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg
                    className={`w-4 h-4 transition-colors duration-300 ${
                      focused === "password" ? "text-purple-400" : "text-gray-600"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  required
                  className="w-full pl-10 pr-10 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none transition-all duration-300 hover:border-white/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-600 hover:text-gray-300 transition-colors duration-200"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* ─── Login Button ─── */}
            <button
              type="submit"
              disabled={loading}
              className="group cursor-pointer relative w-full py-3 mt-1 rounded-xl text-sm font-semibold text-white overflow-hidden transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {/* Button gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 transition-all duration-300" />

              {/* Hover shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-violet-500 to-blue-500" />
                <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:left-full transition-all duration-700 ease-out" />
              </div>

              {/* Button glow */}
              <div className="absolute inset-0 rounded-xl shadow-[0_4px_30px_-5px_rgba(139,92,246,0.4)] group-hover:shadow-[0_4px_40px_-5px_rgba(139,92,246,0.6)] transition-shadow duration-300" />

              {/* Button content */}
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <svg
                      className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>

          {/* ─── Divider ─── */}
          <div className="flex items-center gap-3 mt-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <span className="text-gray-600 text-[10px] uppercase tracking-widest">
              secured
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          </div>

          {/* ─── Footer ─── */}
          <div className="mt-4 flex items-center justify-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
            <p className="text-gray-600 text-[10px] tracking-wide">
              256-bit SSL Encrypted
            </p>
          </div>
        </div>
      </div>

     
    </div>
  );
}