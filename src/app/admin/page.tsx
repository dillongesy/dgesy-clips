"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, isAdmin } from "@/lib/auth";
import api from "@/lib/api";
import { Trash2, EyeOff, Flag, Ban, Eye } from "lucide-react";

interface Clip {
  shortId: string;
  originalName: string;
  sizeBytes: number;
  viewCount: number;
  flagged: boolean;
  hidden: boolean;
  createdAt: string;
  user: { username: string };
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  banned: boolean;
  storageUsedBytes: number;
  createdAt: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB";
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
}

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"clips" | "users">("clips");
  const [clips, setClips] = useState<Clip[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "flagged" | "hidden">("all");

  useEffect(() => {
    if (!isLoggedIn() || !isAdmin()) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const [clipsRes, usersRes] = await Promise.all([
        api.get("/api/admin/clips"),
        api.get("/api/admin/users"),
      ]);
      setClips(clipsRes.data);
      setUsers(usersRes.data);
    } catch {
      setError("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleFlag = async (shortId: string) => {
    try {
      const res = await api.post(`/api/admin/clips/${shortId}/flag`);
      setClips((c) => c.map((clip) =>
        clip.shortId === shortId ? { ...clip, flagged: res.data.flagged } : clip
      ));
    } catch {
      setError("Failed to flag clip");
    }
  };

  const handleHide = async (shortId: string) => {
    try {
      const res = await api.post(`/api/admin/clips/${shortId}/hide`);
      setClips((c) => c.map((clip) =>
        clip.shortId === shortId ? { ...clip, hidden: res.data.hidden } : clip
      ));
    } catch {
      setError("Failed to hide clip");
    }
  };

  const handleDeleteClip = async (shortId: string) => {
    if (!confirm("Permanently delete this clip?")) return;
    try {
      await api.delete(`/api/admin/clips/${shortId}`);
      setClips((c) => c.filter((clip) => clip.shortId !== shortId));
    } catch {
      setError("Failed to delete clip");
    }
  };

  const handleBan = async (id: number) => {
    try {
      const res = await api.post(`/api/admin/users/${id}/ban`);
      setUsers((u) => u.map((user) =>
        user.id === id ? { ...user, banned: res.data.banned } : user
      ));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Failed to ban user");
    }
  };

  const filteredClips = clips.filter((clip) => {
    if (filter === "flagged") return clip.flagged;
    if (filter === "hidden") return clip.hidden;
    return true;
  });

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black mb-1">
            Admin <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-slate-500 text-sm">
            {clips.length} clips · {users.length} users
          </p>
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-6 text-center">{error}</p>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {(["clips", "users"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition-all capitalize ${
                tab === t
                  ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
                  : "bg-white/[0.02] border-white/[0.07] text-slate-400 hover:text-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-slate-500 text-center py-20">Loading...</p>
        ) : tab === "clips" ? (
          <>
            {/* Clip filters */}
            <div className="flex gap-2 mb-6">
              {(["all", "flagged", "hidden"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all capitalize ${
                    filter === f
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                      : "bg-white/[0.02] border-white/[0.07] text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {f} {f === "all" ? `(${clips.length})` : f === "flagged"
                    ? `(${clips.filter(c => c.flagged).length})`
                    : `(${clips.filter(c => c.hidden).length})`}
                </button>
              ))}
            </div>

            <div className="grid gap-3">
              {filteredClips.map((clip) => (
                <div
                  key={clip.shortId}
                  className={`rounded-2xl border p-5 transition-all ${
                    clip.hidden
                      ? "border-red-500/20 bg-red-500/[0.03]"
                      : clip.flagged
                      ? "border-amber-500/20 bg-amber-500/[0.03]"
                      : "border-white/[0.07] bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={() => router.push(`/v/${clip.shortId}`)}
                          className="text-slate-100 font-semibold hover:text-indigo-300 transition-colors"
                        >
                          {clip.originalName}
                        </button>
                        {clip.flagged && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
                            Flagged
                          </span>
                        )}
                        {clip.hidden && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 border border-red-500/20 text-red-400">
                            Hidden
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>by {clip.user?.username}</span>
                        <span>{formatBytes(clip.sizeBytes)}</span>
                        <span className="flex items-center gap-1">
                          <Eye size={11} /> {clip.viewCount}
                        </span>
                        <span>{new Date(clip.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleFlag(clip.shortId)}
                        className={`p-2 rounded-lg transition-all ${
                          clip.flagged
                            ? "text-amber-400 bg-amber-500/10"
                            : "text-slate-500 hover:text-amber-400 hover:bg-amber-500/10"
                        }`}
                        title="Flag clip"
                      >
                        <Flag size={16} />
                      </button>
                      <button
                        onClick={() => handleHide(clip.shortId)}
                        className={`p-2 rounded-lg transition-all ${
                          clip.hidden
                            ? "text-red-400 bg-red-500/10"
                            : "text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                        }`}
                        title="Hide clip"
                      >
                        <EyeOff size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteClip(clip.shortId)}
                        className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Delete clip"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="grid gap-3">
            {users.map((user) => (
              <div
                key={user.id}
                className={`rounded-2xl border p-5 transition-all ${
                  user.banned
                    ? "border-red-500/20 bg-red-500/[0.03]"
                    : "border-white/[0.07] bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-slate-100 font-semibold">{user.username}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        user.role === "ADMIN"
                          ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                          : "bg-white/[0.04] border-white/[0.08] text-slate-400"
                      }`}>
                        {user.role}
                      </span>
                      {user.banned && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 border border-red-500/20 text-red-400">
                          Banned
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{user.email}</span>
                      <span>{formatBytes(user.storageUsedBytes)} used</span>
                      <span>joined {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {user.role !== "ADMIN" && (
                    <button
                      onClick={() => handleBan(user.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                        user.banned
                          ? "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                          : "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      }`}
                    >
                      <Ban size={14} />
                      {user.banned ? "Unban" : "Ban"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}