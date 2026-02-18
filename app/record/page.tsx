"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "signup";

export default function AccessPage() {
  const router = useRouter();

  // ─── Mode ───
  const [mode, setMode] = useState<Mode>("login");

  // ─── Form State ───
  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    secretKey: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ─── Password Visibility ───
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // ─── Check if already logged in ───
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/auth/verify");
        const data = await res.json();
        if (data.success) {
          router.push("/console");
        }
      } catch {}
    };
    check();
  }, [router]);

  // ─── Switch Mode ───
  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError("");
    setSuccess("");
    setForm({
      name: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      secretKey: "",
    });
    setShowPassword(false);
    setShowConfirm(false);
    setShowSecret(false);
  };

  // ─── Handle Submit ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // ─── Validation ───
    if (!form.phoneNumber || !form.password) {
      setError("Phone number & password are required");
      return;
    }

    if (mode === "signup") {
      if (!form.name.trim()) {
        setError("Name is required");
        return;
      }
      if (form.name.trim().length < 2) {
        setError("Name must be at least 2 characters");
        return;
      }
      if (form.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/signup";

      const body =
        mode === "login"
          ? {
              phoneNumber: form.phoneNumber,
              password: form.password,
            }
          : {
              name: form.name.trim(),
              phoneNumber: form.phoneNumber,
              password: form.password,
              secretKey: form.secretKey,
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(data.message);
        setTimeout(() => {
          router.push("/console");
          router.refresh();
        }, 500);
      } else {
        setError(data.message);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Password Strength ───
  const getStrength = (pw: string) => {
    if (!pw) return { score: 0, label: "", color: "" };
    let s = 0;
    if (pw.length >= 6) s++;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    if (s <= 1) return { score: 1, label: "Weak", color: "red" };
    if (s <= 2) return { score: 2, label: "Fair", color: "orange" };
    if (s <= 3) return { score: 3, label: "Good", color: "yellow" };
    return { score: 4, label: "Strong", color: "emerald" };
  };

  const strength = getStrength(form.password);

  const strengthBarColors: Record<string, string> = {
    red: "bg-red-500",
    orange: "bg-orange-500",
    yellow: "bg-yellow-500",
    emerald: "bg-emerald-500",
  };

  const strengthTextColors: Record<string, string> = {
    red: "text-red-400",
    orange: "text-orange-400",
    yellow: "text-yellow-400",
    emerald: "text-emerald-400",
  };

  // ─── Eye Icon Component ───
  const EyeToggle = ({
    show,
    onClick,
  }: {
    show: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
      tabIndex={-1}
    >
      {show ? (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
          />
        </svg>
      ) : (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* ───────── Background ───────── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-purple-600/[0.07] rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-blue-600/[0.07] rounded-full blur-[150px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* ───────── Card ───────── */}
      <div className="relative w-full max-w-[400px] animate-[fadeUp_0.5s_ease]">
        {/* Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/15 to-blue-600/15 rounded-3xl blur-xl" />

        <div className="relative bg-white/[0.02] backdrop-blur-2xl border border-white/[0.08] rounded-2xl overflow-hidden">
          {/* ─── Header ─── */}
          <div className="px-7 pt-8 pb-0">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/25">
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
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-xl font-bold text-white text-center">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-xs text-gray-500 text-center mt-1.5 mb-6">
              {mode === "login"
                ? "Sign in to your admin panel"
                : "Register a new admin account"}
            </p>

            {/* ─── Tab Switcher ─── */}
            <div className="flex bg-white/[0.03] rounded-xl p-1 border border-white/[0.06] mb-6">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-300 cursor-pointer ${
                  mode === "login"
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-300 cursor-pointer ${
                  mode === "signup"
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* ─── Form ─── */}
          <form onSubmit={handleSubmit} className="px-7 pb-7">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center gap-2 animate-[shake_0.3s_ease]">
                <div className="w-5 h-5 bg-red-500/10 rounded-full flex items-center justify-center shrink-0">
                  <svg
                    className="w-3 h-3 text-red-400"
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
                </div>
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-4 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                <div className="w-5 h-5 bg-emerald-500/10 rounded-full flex items-center justify-center shrink-0">
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
                <p className="text-emerald-400 text-xs">{success}</p>
              </div>
            )}

            <div className="space-y-3.5">
              {/* ─── Name (Signup only) ─── */}
              {mode === "signup" && (
                <div className="animate-[slideDown_0.3s_ease]">
                  <label className="block text-[10px] font-medium text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
                    Full Name
                  </label>
                  <div className="relative">
                    <svg
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                      />
                    </svg>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="Enter your full name"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/30 transition-all"
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              {/* ─── Phone Number ─── */}
              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
                  Phone Number
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                    />
                  </svg>
                  <input
                    type="tel"
                    value={form.phoneNumber}
                    onChange={(e) =>
                      setForm({ ...form, phoneNumber: e.target.value })
                    }
                    placeholder="01XXXXXXXXX"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/30 transition-all"
                    autoComplete="tel"
                  />
                </div>
              </div>

              {/* ─── Password ─── */}
              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder={
                      mode === "login"
                        ? "Enter your password"
                        : "Create a password"
                    }
                    className="w-full pl-10 pr-10 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/30 transition-all"
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                  />
                  <EyeToggle
                    show={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                  />
                </div>

                {/* Password Strength (Signup only) */}
                {mode === "signup" && form.password && (
                  <div className="mt-2 animate-[slideDown_0.2s_ease]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            strengthBarColors[strength.color] || ""
                          }`}
                          style={{ width: `${strength.score * 25}%` }}
                        />
                      </div>
                      <span
                        className={`text-[9px] font-medium ${
                          strengthTextColors[strength.color] || ""
                        }`}
                      >
                        {strength.label}
                      </span>
                    </div>

                    {/* Rules */}
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      {[
                        {
                          label: "6+ characters",
                          met: form.password.length >= 6,
                        },
                        {
                          label: "Uppercase",
                          met: /[A-Z]/.test(form.password),
                        },
                        { label: "Number", met: /[0-9]/.test(form.password) },
                        {
                          label: "Special char",
                          met: /[^A-Za-z0-9]/.test(form.password),
                        },
                      ].map((rule) => (
                        <div
                          key={rule.label}
                          className="flex items-center gap-1"
                        >
                          <div
                            className={`w-2.5 h-2.5 rounded-full flex items-center justify-center ${
                              rule.met ? "bg-emerald-500/20" : "bg-white/[0.05]"
                            }`}
                          >
                            {rule.met ? (
                              <svg
                                className="w-1.5 h-1.5 text-emerald-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={4}
                                  d="M4.5 12.75l6 6 9-13.5"
                                />
                              </svg>
                            ) : (
                              <div className="w-1 h-1 bg-gray-700 rounded-full" />
                            )}
                          </div>
                          <span
                            className={`text-[8px] ${
                              rule.met ? "text-emerald-400" : "text-gray-600"
                            }`}
                          >
                            {rule.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Confirm Password (Signup only) ─── */}
              {mode === "signup" && (
                <div className="animate-[slideDown_0.3s_ease]">
                  <label className="block text-[10px] font-medium text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <svg
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                      />
                    </svg>
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) =>
                        setForm({ ...form, confirmPassword: e.target.value })
                      }
                      placeholder="Re-enter your password"
                      className={`w-full pl-10 pr-10 py-2.5 bg-white/[0.03] border rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${
                        form.confirmPassword &&
                        form.confirmPassword !== form.password
                          ? "border-red-500/30"
                          : form.confirmPassword &&
                            form.confirmPassword === form.password
                          ? "border-emerald-500/30"
                          : "border-white/[0.06]"
                      }`}
                      autoComplete="new-password"
                    />
                    <EyeToggle
                      show={showConfirm}
                      onClick={() => setShowConfirm(!showConfirm)}
                    />
                  </div>
                  {form.confirmPassword &&
                    form.confirmPassword !== form.password && (
                      <p className="text-[9px] text-red-400 mt-1 ml-1">
                        Passwords do not match
                      </p>
                    )}
                  {form.confirmPassword &&
                    form.confirmPassword === form.password && (
                      <p className="text-[9px] text-emerald-400 mt-1 ml-1">
                        Passwords match ✓
                      </p>
                    )}
                </div>
              )}

              {/* ─── Secret Key (Signup only, optional) ─── */}
              {mode === "signup" && (
                <div className="animate-[slideDown_0.3s_ease]">
                  <label className="block text-[10px] font-medium text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
                    Secret Key{" "}
                    <span className="text-gray-600 normal-case">
                      (if required)
                    </span>
                  </label>
                  <div className="relative">
                    <svg
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                      />
                    </svg>
                    <input
                      type={showSecret ? "text" : "password"}
                      value={form.secretKey}
                      onChange={(e) =>
                        setForm({ ...form, secretKey: e.target.value })
                      }
                      placeholder="Enter admin secret key"
                      className="w-full pl-10 pr-10 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/30 transition-all"
                    />
                    <EyeToggle
                      show={showSecret}
                      onClick={() => setShowSecret(!showSecret)}
                    />
                  </div>
                  <p className="text-[8px] text-gray-600 mt-1 ml-1">
                    Ask your administrator for the secret key
                  </p>
                </div>
              )}
            </div>

            {/* ─── Submit Button ─── */}
            <button
              type="submit"
              disabled={
                loading ||
                !form.phoneNumber ||
                !form.password ||
                (mode === "signup" &&
                  (!form.name ||
                    !form.confirmPassword ||
                    form.password !== form.confirmPassword))
              }
              className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-sm font-medium hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                <>
                  {mode === "login" ? (
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
                  ) : (
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
                        d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                      />
                    </svg>
                  )}
                  {mode === "login" ? "Sign In" : "Create Account"}
                </>
              )}
            </button>

            {/* ─── Bottom Link ─── */}
            <div className="mt-5 text-center">
              <p className="text-[11px] text-gray-600">
                {mode === "login"
                  ? "Don't have an account?"
                  : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() =>
                    switchMode(mode === "login" ? "signup" : "login")
                  }
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors cursor-pointer"
                >
                  {mode === "login" ? "Sign Up" : "Sign In"}
                </button>
              </p>
            </div>
          </form>

          {/* ─── Security Badge ─── */}
          <div className="px-7 pb-5">
            <div className="flex items-center justify-center gap-1.5 text-[9px] text-gray-600">
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
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
              Secured with encryption
            </div>
          </div>
        </div>
      </div>

      {/* ─── Animations ─── */}
      <style jsx>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }
      `}</style>
    </div>
  );
}