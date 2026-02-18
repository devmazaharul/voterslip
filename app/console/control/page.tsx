"use client";

import { useEffect, useState } from "react";
import { useAdminLayout } from "../components/contex";

// ─── Types ───
interface Profile {
  name: string;
  phoneNumber: string;
  lastLogin: string | null;
  createdAt: string;
}

interface DeviceLog {
  _id: string;
  deviceName: string;
  browser: string;
  os: string;
  ip: string;
  loginAt: string;
  lastActiveAt: string;
  isActive: boolean;
  location: string;
  isCurrent: boolean;
}

export default function ControlPage() {
  const { setSidebarOpen, handleLogout } = useAdminLayout();

  // ─── Profile State ───
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileForm, setProfileForm] = useState({ name: "", phoneNumber: "" });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });

  // ─── Password State ───
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ─── Devices State ───
  const [devices, setDevices] = useState<DeviceLog[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  // ─── Global Success ───
  const [globalMsg, setGlobalMsg] = useState("");

  // ─── Fetch Profile ───
  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/admin/profile");
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        setProfileForm({
          name: data.profile.name || "",
          phoneNumber: data.profile.phoneNumber || "",
        });
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  // ─── Fetch Devices ───
  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/admin/devices");
      const data = await res.json();
      if (data.success) setDevices(data.devices);
    } catch (err) {
      console.error("Devices fetch error:", err);
    } finally {
      setDevicesLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchDevices();
  }, []);

  // ─── Update Profile ───
  const handleProfileUpdate = async () => {
    setProfileMsg({ type: "", text: "" });
    setProfileSaving(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (data.success) {
        setProfileMsg({ type: "success", text: "Profile updated successfully" });
        setProfile(data.profile);
        setTimeout(() => setProfileMsg({ type: "", text: "" }), 3000);
      } else {
        setProfileMsg({ type: "error", text: data.message });
      }
    } catch {
      setProfileMsg({ type: "error", text: "Failed to update profile" });
    } finally {
      setProfileSaving(false);
    }
  };

  // ─── Change Password ───
  const handlePasswordChange = async () => {
    setPasswordMsg({ type: "", text: "" });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: "error", text: "Passwords do not match" });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/admin/password-change", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPasswordMsg({ type: "success", text: "Password changed successfully" });
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => setPasswordMsg({ type: "", text: "" }), 3000);
      } else {
        setPasswordMsg({ type: "error", text: data.message });
      }
    } catch {
      setPasswordMsg({ type: "error", text: "Failed to change password" });
    } finally {
      setPasswordLoading(false);
    }
  };

  // ─── Revoke Device ───
  const handleRevokeDevice = async (deviceId: string) => {
    setRevokingId(deviceId);
    try {
      const res = await fetch(`/api/admin/devices?id=${deviceId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setDevices((prev) => prev.filter((d) => d._id !== deviceId));
        setGlobalMsg("Session revoked successfully");
        setTimeout(() => setGlobalMsg(""), 3000);
      }
    } catch {
      console.error("Revoke error");
    } finally {
      setRevokingId(null);
    }
  };

  // ─── Revoke All ───
  const handleRevokeAll = async () => {
    setRevokingAll(true);
    try {
      const res = await fetch("/api/admin/devices?all=true", {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setDevices((prev) => prev.filter((d) => d.isCurrent));
        setGlobalMsg("All other sessions revoked");
        setTimeout(() => setGlobalMsg(""), 3000);
      }
    } catch {
      console.error("Revoke all error");
    } finally {
      setRevokingAll(false);
    }
  };

  // ─── Password Strength ───
  const getPasswordStrength = (password: string) => {
    if (!password) return { label: "", score: 0, color: "" };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { label: "Weak", score: 1, color: "red" };
    if (score <= 2) return { label: "Fair", score: 2, color: "orange" };
    if (score <= 3) return { label: "Good", score: 3, color: "yellow" };
    return { label: "Strong", score: 4, color: "emerald" };
  };

  const strength = getPasswordStrength(passwordForm.newPassword);

  // ─── Password Rules ───
  const passwordRules = [
    { label: "At least 6 characters", met: passwordForm.newPassword.length >= 6 },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(passwordForm.newPassword) },
    { label: "Contains a number", met: /[0-9]/.test(passwordForm.newPassword) },
    { label: "Contains special character", met: /[^A-Za-z0-9]/.test(passwordForm.newPassword) },
  ];

  // ─── Time Ago ───
  const timeAgo = (date: string) => {
    if (!date) return "Never";
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ─── Device Icon ───
  const getDeviceIcon = (os: string) => {
    const lower = (os || "").toLowerCase();
    if (lower.includes("ios") || lower.includes("android") || lower.includes("mobile")) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
      </svg>
    );
  };

  // ─── Eye Icon ───
  const EyeIcon = ({ show, onClick }: { show: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
    >
      {show ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )}
    </button>
  );

  const strengthColors: Record<string, string> = {
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

  return (
    <>
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex items-center justify-between px-4 lg:px-6 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 cursor-pointer text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <h1 className="text-base font-semibold hidden lg:block">Control Panel</h1>

          <button
            onClick={handleLogout}
            className="lg:hidden cursor-pointer p-2 text-gray-400 hover:text-red-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      </header>

      <div className="p-4 lg:p-6 space-y-5">

        {/* ─── Global Success ─── */}
        {globalMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 animate-[slideDown_0.3s_ease]">
            <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-emerald-400 text-xs">{globalMsg}</p>
          </div>
        )}

        {/* ───────── Two Column Grid ───────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ═══════ Profile Information Card ═══════ */}
          <div className="bg-white/[0.02] backdrop-blur border border-white/[0.06] rounded-2xl overflow-hidden">
            {/* Card Header */}
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Profile Information</h2>
                <p className="text-[10px] text-gray-500">Update your account details</p>
              </div>
            </div>

            <div className="p-5">
              {profileLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-10 bg-white/[0.03] rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  {/* Avatar & Meta */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg shadow-purple-500/20">
                      {profileForm.name?.charAt(0)?.toUpperCase() || "A"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {profileForm.name || "Administrator"}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75" />
                          </svg>
                          Joined {profile?.createdAt ? timeAgo(profile.createdAt) : "—"}
                        </span>
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Last login {profile?.lastLogin ? timeAgo(profile.lastLogin) : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  {profileMsg.text && (
                    <div className={`mb-4 p-2.5 rounded-xl border ${
                      profileMsg.type === "success"
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : "bg-red-500/5 border-red-500/20"
                    }`}>
                      <p className={`text-xs ${
                        profileMsg.type === "success" ? "text-emerald-400" : "text-red-400"
                      }`}>
                        {profileMsg.text}
                      </p>
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
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        placeholder="Enter your name"
                        className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/30 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={profileForm.phoneNumber}
                        onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                        placeholder="Enter phone number"
                        className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/30 transition-all"
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleProfileUpdate}
                    disabled={profileSaving || (!profileForm.name && !profileForm.phoneNumber)}
                    className="w-full mt-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-xs font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {profileSaving && (
                      <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    Save Changes
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ═══════ Change Password Card ═══════ */}
          <div className="bg-white/[0.02] backdrop-blur border border-white/[0.06] rounded-2xl overflow-hidden">
            {/* Card Header */}
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Change Password</h2>
                <p className="text-[10px] text-gray-500">Update your security credentials</p>
              </div>
            </div>

            <div className="p-5">
              {/* Message */}
              {passwordMsg.text && (
                <div className={`mb-4 p-2.5 rounded-xl border ${
                  passwordMsg.type === "success"
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-red-500/5 border-red-500/20"
                }`}>
                  <p className={`text-xs ${
                    passwordMsg.type === "success" ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {passwordMsg.text}
                  </p>
                </div>
              )}

              <div className="space-y-3.5">
                {/* Current Password */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                      className="w-full px-3.5 py-2.5 pr-10 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/30 transition-all"
                    />
                    <EyeIcon show={showCurrent} onClick={() => setShowCurrent(!showCurrent)} />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Enter new password"
                      className="w-full px-3.5 py-2.5 pr-10 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/30 transition-all"
                    />
                    <EyeIcon show={showNew} onClick={() => setShowNew(!showNew)} />
                  </div>

                  {/* Strength Meter */}
                  {passwordForm.newPassword && (
                    <div className="mt-2.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${strengthColors[strength.color] || ""}`}
                            style={{ width: `${strength.score * 25}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-medium ${strengthTextColors[strength.color] || ""}`}>
                          {strength.label}
                        </span>
                      </div>

                      {/* Rules Checklist */}
                      <div className="grid grid-cols-2 gap-1 mt-2">
                        {passwordRules.map((rule) => (
                          <div key={rule.label} className="flex items-center gap-1.5">
                            <div className={`w-3 h-3 rounded-full flex items-center justify-center transition-all ${
                              rule.met ? "bg-emerald-500/20" : "bg-white/[0.05]"
                            }`}>
                              {rule.met ? (
                                <svg className="w-2 h-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              ) : (
                                <div className="w-1 h-1 bg-gray-600 rounded-full" />
                              )}
                            </div>
                            <span className={`text-[9px] ${rule.met ? "text-emerald-400" : "text-gray-600"}`}>
                              {rule.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      className={`w-full px-3.5 py-2.5 pr-10 bg-white/[0.03] border rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${
                        passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword
                          ? "border-red-500/30"
                          : passwordForm.confirmPassword && passwordForm.confirmPassword === passwordForm.newPassword
                          ? "border-emerald-500/30"
                          : "border-white/[0.06]"
                      }`}
                    />
                    <EyeIcon show={showConfirm} onClick={() => setShowConfirm(!showConfirm)} />
                  </div>
                  {passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword && (
                    <p className="text-[10px] text-red-400 mt-1 ml-1">Passwords do not match</p>
                  )}
                  {passwordForm.confirmPassword && passwordForm.confirmPassword === passwordForm.newPassword && (
                    <p className="text-[10px] text-emerald-400 mt-1 ml-1">Passwords match ✓</p>
                  )}
                </div>
              </div>

              {/* Update Button */}
              <button
                onClick={handlePasswordChange}
                disabled={
                  passwordLoading ||
                  !passwordForm.currentPassword ||
                  !passwordForm.newPassword ||
                  !passwordForm.confirmPassword ||
                  passwordForm.newPassword !== passwordForm.confirmPassword
                }
                className="w-full mt-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl text-xs font-medium hover:shadow-lg hover:shadow-amber-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {passwordLoading && (
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                Update Password
              </button>
            </div>
          </div>
        </div>

        {/* ═══════ Active Sessions Card ═══════ */}
        <div className="bg-white/[0.02] backdrop-blur border border-white/[0.06] rounded-2xl overflow-hidden">
          {/* Card Header */}
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-white">Active Sessions</h2>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
                    {devices.length}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500">Manage your logged-in devices</p>
              </div>
            </div>

            {/* Revoke All */}
            {devices.filter((d) => !d.isCurrent).length > 0 && (
              <button
                onClick={handleRevokeAll}
                disabled={revokingAll}
                className="px-3 py-1.5 text-[10px] cursor-pointer text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-all disabled:opacity-40 flex items-center gap-1.5"
              >
                {revokingAll && (
                  <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                Revoke All Others
              </button>
            )}
          </div>

          {/* Devices List */}
          <div className="divide-y divide-white/[0.04]">
            {devicesLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="h-14 bg-white/[0.03] rounded-xl animate-pulse" />
                </div>
              ))
            ) : devices.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <svg className="w-10 h-10 text-gray-700 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
                </svg>
                <p className="text-gray-600 text-sm">No active sessions</p>
              </div>
            ) : (
              devices.map((device) => (
                <div
                  key={device._id}
                  className={`px-5 py-4 hover:bg-white/[0.02] transition-colors ${
                    device.isCurrent ? "bg-emerald-500/[0.02]" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Device Info */}
                    <div className="flex items-center gap-3.5">
                      {/* Device Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        device.isCurrent
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-white/[0.05] text-gray-500"
                      }`}>
                        {getDeviceIcon(device.os)}
                      </div>

                      <div>
                        {/* Browser & OS */}
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">
                            {device.browser} <span className="text-gray-500 font-normal">on</span> {device.os}
                          </p>
                          {device.isCurrent && (
                            <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                              This Device
                            </span>
                          )}
                        </div>

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                          {/* IP */}
                          <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                            </svg>
                            {device.ip || "Unknown IP"}
                          </span>

                          {/* Location */}
                          {device.location && (
                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                              </svg>
                              {device.location}
                            </span>
                          )}

                          {/* Login Time */}
                          <span className="text-[10px] text-gray-500">
                            Login: {timeAgo(device.loginAt)}
                          </span>

                          {/* Last Active */}
                          <span className="text-[10px] text-gray-500">
                            Active: {timeAgo(device.lastActiveAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Revoke Button */}
                    {!device.isCurrent && (
                      <button
                        onClick={() => handleRevokeDevice(device._id)}
                        disabled={revokingId === device._id}
                        className="px-3 py-1.5 text-[10px] cursor-pointer text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-all disabled:opacity-40 flex items-center gap-1.5 shrink-0 ml-3"
                      >
                        {revokingId === device._id ? (
                          <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ═══════ Danger Zone ═══════ */}
        <div className="bg-white/[0.02] backdrop-blur border border-red-500/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-red-500/10 flex items-center gap-3">
            <div className="w-8 h-8 bg-red-500/10 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-red-400">Danger Zone</h2>
              <p className="text-[10px] text-gray-500">Irreversible actions</p>
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium">Log out everywhere</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Sign out of all devices including this one
                </p>
              </div>
              <button
                onClick={async () => {
                  await handleRevokeAll();
                  handleLogout();
                }}
                className="px-4 py-2 cursor-pointer text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-all"
              >
                Log Out All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}