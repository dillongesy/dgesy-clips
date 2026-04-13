"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import api from "@/lib/api";
import { User, HardDrive, Film, Calendar, Key } from "lucide-react";

interface AccountStats {
  username: string;
  email: string;
  storageUsedBytes: number;
  clipCount: number;
  createdAt: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB";
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
}

export default function AccountPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwords, setPasswords] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    api.get("/api/clips/account/stats")
      .then((res) => setStats(res.data))
      .catch(() => setError("Failed to load account info"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) {
      setError("New passwords do not match");
      return;
    }
    if (passwords.newPass.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    setChangingPassword(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/api/auth/change-password", {
        currentPassword: passwords.current,
        newPassword: passwords.newPass,
      });
      setSuccess("Password changed successfully");
      setPasswords({ current: "", newPass: "", confirm: "" });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const storagePercent = stats
    ? Math.min((stats.storageUsedBytes / (250 * 1024 * 1024 * 1024)) * 100, 100)
    : 0;

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black mb-10">
          My <span className="gradient-text">Account</span>
        </h1>

        {loading ? (
          <p className="dark:text-slate-500 text-slate-400 text-center py-20">Loading...</p>
        ) : stats ? (
          <div className="space-y-6">
            {/* Profile card */}
            <div className="rounded-2xl border dark:border-white/[0.07] border-slate-200 dark:bg-white/[0.02] bg-white p-6 space-y-4">
              <h2 className="text-lg font-bold">Profile</h2>
              <div className="flex items-center gap-3 dark:text-slate-400 text-slate-600 text-sm">
                <User size={16} className="text-indigo-400" />
                {stats.username}
              </div>
              <div className="flex items-center gap-3 dark:text-slate-400 text-slate-600 text-sm">
                <Calendar size={16} className="text-indigo-400" />
                Joined {new Date(stats.createdAt).toLocaleDateString()}
              </div>
            </div>

            {/* Storage card */}
            <div className="rounded-2xl border dark:border-white/[0.07] border-slate-200 dark:bg-white/[0.02] bg-white p-6 space-y-4">
              <h2 className="text-lg font-bold">Storage</h2>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 dark:text-slate-400 text-slate-600">
                  <HardDrive size={16} className="text-indigo-400" />
                  {formatBytes(stats.storageUsedBytes)} used
                </span>
                <span className="dark:text-slate-500 text-slate-400">250 GB limit</span>
              </div>
              <div className="w-full h-2 rounded-full dark:bg-white/[0.06] bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${storagePercent}%`,
                    background: "linear-gradient(90deg, #6366f1, #06b6d4)",
                  }}
                />
              </div>
              <div className="flex items-center gap-2 dark:text-slate-400 text-slate-600 text-sm">
                <Film size={16} className="text-cyan-400" />
                {stats.clipCount} clip{stats.clipCount !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Change password card */}
            <div className="rounded-2xl border dark:border-white/[0.07] border-slate-200 dark:bg-white/[0.02] bg-white p-6 space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Key size={18} className="text-indigo-400" />
                Change Password
              </h2>

              {error && <p className="text-red-400 text-sm">{error}</p>}
              {success && <p className="text-emerald-400 text-sm">{success}</p>}

              <form onSubmit={handleChangePassword} className="space-y-3">
                <input
                  type="password"
                  required
                  value={passwords.current}
                  onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                  placeholder="Current password"
                  className="w-full px-4 py-3 rounded-xl dark:bg-white/[0.03] bg-slate-100 border dark:border-white/[0.08] border-slate-200 dark:text-slate-100 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500/40 transition-all"
                />
                <input
                  type="password"
                  required
                  value={passwords.newPass}
                  onChange={(e) => setPasswords((p) => ({ ...p, newPass: e.target.value }))}
                  placeholder="New password"
                  className="w-full px-4 py-3 rounded-xl dark:bg-white/[0.03] bg-slate-100 border dark:border-white/[0.08] border-slate-200 dark:text-slate-100 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500/40 transition-all"
                />
                <input
                  type="password"
                  required
                  value={passwords.confirm}
                  onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 rounded-xl dark:bg-white/[0.03] bg-slate-100 border dark:border-white/[0.08] border-slate-200 dark:text-slate-100 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500/40 transition-all"
                />
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="w-full py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-50 transition-all"
                  style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)" }}
                >
                  {changingPassword ? "Changing..." : "Change Password"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <p className="text-red-400 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}