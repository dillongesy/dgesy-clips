"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import api from "@/lib/api";
import { Upload, Trash2, Share2, Copy, Check, Lock, Eye, EyeOff, Pencil, Globe } from "lucide-react";

interface Clip {
  shortId: string;
  originalName: string;
  sizeBytes: number;
  durationSeconds: number;
  viewCount: number;
  createdAt: string;
  private: boolean;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

type UploadStatus = "idle" | "uploading" | "processing" | "done";

export default function DashboardPage() {
  const router = useRouter();
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<string | null>(null);
  const [shareUsername, setShareUsername] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    fetchClips();
  }, [router]);

  const fetchClips = async () => {
    try {
      const res = await api.get("/api/clips/mine");
      setClips(res.data);
    } catch {
      setError("Failed to load clips");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus("uploading");
    setUploadProgress(0);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post("/api/clips/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded * 100) / (e.total || 1));
          setUploadProgress(pct);
          if (pct === 100) setUploadStatus("processing");
        },
      });
      setUploadStatus("done");
      await fetchClips();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Upload failed");
    } finally {
      setUploadStatus("idle");
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (shortId: string) => {
    if (!confirm("Delete this clip? This cannot be undone.")) return;
    try {
      await api.delete(`/api/clips/${shortId}`);
      setClips((c) => c.filter((clip) => clip.shortId !== shortId));
    } catch {
      setError("Failed to delete clip");
    }
  };

  const handleRename = async (shortId: string) => {
    if (!renameValue.trim()) return;
    try {
      await api.patch(`/api/clips/${shortId}/rename`, { name: renameValue });
      setClips((c) => c.map((clip) =>
        clip.shortId === shortId
          ? { ...clip, originalName: renameValue.trim() }
          : clip
      ));
      setRenamingId(null);
      setRenameValue("");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Rename failed");
    }
  };

  const handleTogglePrivacy = async (shortId: string) => {
    try {
      const res = await api.patch(`/api/clips/${shortId}/privacy`);
      setClips((c) => c.map((clip) =>
        clip.shortId === shortId
          ? { ...clip, private: res.data.private }
          : clip
      ));
    } catch {
      setError("Failed to update privacy");
    }
  };

  const copyLink = (shortId: string) => {
    navigator.clipboard.writeText(`https://clips.dgesy.org/v/${shortId}`);
    setCopiedId(shortId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = async (shortId: string) => {
    if (!shareUsername.trim()) return;
    try {
      await api.post(`/api/clips/${shortId}/share`, { username: shareUsername });
      setShareTarget(null);
      setShareUsername("");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Share failed");
    }
  };

  const isUploading = uploadStatus === "uploading" || uploadStatus === "processing";

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black mb-1">
              My <span className="gradient-text">Clips</span>
            </h1>
            <p className="text-slate-500 text-sm">
              {clips.length} clip{clips.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-50 transition-all"
              style={{
                background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                boxShadow: "0 0 30px rgba(99,102,241,0.25)",
              }}
            >
              <Upload size={16} />
              {uploadStatus === "uploading"
                ? `Uploading ${uploadProgress}%`
                : uploadStatus === "processing"
                ? "Processing..."
                : "Upload Clip"}
            </button>
          </div>
        </div>

        {isUploading && (
          <div className="mb-6 rounded-xl overflow-hidden bg-white/[0.04] border border-white/[0.06]">
            <div
              className={`h-1.5 transition-all duration-300 ${
                uploadStatus === "processing" ? "animate-pulse" : ""
              }`}
              style={{
                width: uploadStatus === "uploading" ? `${uploadProgress}%` : "100%",
                background: "linear-gradient(90deg, #6366f1, #06b6d4)",
              }}
            />
            <p className="text-xs text-slate-500 text-center py-2">
              {uploadStatus === "uploading"
                ? `Uploading... ${uploadProgress}%`
                : "Compressing video, please wait..."}
            </p>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm mb-6 text-center">{error}</p>
        )}

        {loading ? (
          <p className="text-slate-500 text-center py-20">Loading clips...</p>
        ) : clips.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 mb-4">No clips yet</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm"
            >
              Upload your first clip →
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {clips.map((clip) => (
              <div
                key={clip.shortId}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 hover:border-indigo-500/20 transition-all"
              >
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Thumbnail */}
                  <div
                    onClick={() => router.push(`/v/${clip.shortId}`)}
                    className="w-32 h-20 rounded-xl overflow-hidden bg-black flex-shrink-0 cursor-pointer"
                  >
                    <img
                      src={`/api/clips/thumbnail/${clip.shortId}`}
                      alt={clip.originalName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info + actions */}
                  <div className="flex-1 flex items-center justify-between gap-4 flex-wrap">
                    <div className="space-y-1">
                      {renamingId === clip.shortId ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRename(clip.shortId);
                              if (e.key === "Escape") {
                                setRenamingId(null);
                                setRenameValue("");
                              }
                            }}
                            autoFocus
                            className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-indigo-500/40 text-slate-100 text-sm focus:outline-none"
                          />
                          <button
                            onClick={() => handleRename(clip.shortId)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                            style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)" }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => { setRenamingId(null); setRenameValue(""); }}
                            className="px-3 py-1.5 rounded-lg text-xs text-slate-400 border border-white/[0.08] hover:bg-white/[0.05] transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => router.push(`/v/${clip.shortId}`)}
                          className="text-slate-100 font-semibold hover:text-indigo-300 transition-colors text-left"
                        >
                          {clip.originalName}
                        </button>
                      )}
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{formatDuration(clip.durationSeconds)}</span>
                        <span>{formatBytes(clip.sizeBytes)}</span>
                        <span className="flex items-center gap-1">
                          <Eye size={11} /> {clip.viewCount}
                        </span>
                        <span className={`flex items-center gap-1 ${clip.private ? "text-amber-500" : "text-emerald-500"}`}>
                          {clip.private ? <Lock size={11} /> : <Globe size={11} />}
                          {clip.private ? "Private" : "Public"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setRenamingId(clip.shortId);
                          setRenameValue(clip.originalName);
                        }}
                        className="p-2 rounded-lg text-slate-500 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all"
                        title="Rename"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleTogglePrivacy(clip.shortId)}
                        className={`p-2 rounded-lg transition-all ${
                          clip.private
                            ? "text-amber-400 hover:bg-amber-500/10"
                            : "text-emerald-400 hover:bg-emerald-500/10"
                        }`}
                        title={clip.private ? "Make public" : "Make private"}
                      >
                        {clip.private ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        onClick={() => copyLink(clip.shortId)}
                        className="p-2 rounded-lg text-slate-500 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all"
                        title="Copy link"
                      >
                        {copiedId === clip.shortId ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                      <button
                        onClick={() => setShareTarget(clip.shortId)}
                        className="p-2 rounded-lg text-slate-500 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all"
                        title="Share with user"
                      >
                        <Share2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(clip.shortId)}
                        className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {shareTarget === clip.shortId && (
                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      value={shareUsername}
                      onChange={(e) => setShareUsername(e.target.value)}
                      placeholder="Enter username to share with..."
                      className="flex-1 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500/40 transition-all"
                    />
                    <button
                      onClick={() => handleShare(clip.shortId)}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                      style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)" }}
                    >
                      Share
                    </button>
                    <button
                      onClick={() => { setShareTarget(null); setShareUsername(""); }}
                      className="px-4 py-2 rounded-xl text-sm text-slate-400 border border-white/[0.08] hover:bg-white/[0.05] transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}