"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import api from "@/lib/api";
import axios from "axios";
import {
  Upload, Trash2, Copy, Check, Lock, Eye,
  EyeOff, Pencil, Globe, Twitter, FolderPlus
} from "lucide-react";
import FolderSidebar from "@/components/FolderSidebar";

const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL || "https://upload.clips.dgesy.org";

interface Clip {
  shortId: string;
  originalName: string;
  sizeBytes: number;
  durationSeconds: number;
  viewCount: number;
  createdAt: string;
  private: boolean;
}

interface FolderItem {
  id: number;
  name: string;
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

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
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
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [addingToFolder, setAddingToFolder] = useState<string | null>(null);
  const [userFolders, setUserFolders] = useState<FolderItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    fetchClips();
    fetchUserFolders();
  }, [router]);

  useEffect(() => {
    fetchClips();
  }, [selectedFolderId]);

  const fetchClips = async () => {
    try {
      if (selectedFolderId !== null) {
        const res = await api.get(`/api/folders/${selectedFolderId}`);
        setClips(res.data.clips);
      } else {
        const res = await api.get("/api/clips/mine");
        setClips(res.data);
      }
    } catch {
      setError("Failed to load clips");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserFolders = async () => {
    const res = await api.get("/api/folders");
    setUserFolders(res.data);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 250 * 1024 * 1024) {
      setError("File exceeds 250MB limit.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploadStatus("uploading");
    setUploadProgress(0);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("token") || getCookie("token");

    try {
      const res = await axios.post(`${UPLOAD_URL}/api/clips/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`,
        },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded * 100) / (e.total || 1));
          setUploadProgress(pct);
          if (pct === 100) setUploadStatus("processing");
        },
      });

      // If a folder is selected, add clip to it
      if (selectedFolderId !== null && res.data.shortId) {
        await api.post(`/api/folders/${selectedFolderId}/clips`, {
          shortId: res.data.shortId,
        });
      }

      setUploadStatus("done");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Upload may have succeeded — check your clips");
    } finally {
      await fetchClips();
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
        clip.shortId === shortId ? { ...clip, originalName: renameValue.trim() } : clip
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
        clip.shortId === shortId ? { ...clip, private: res.data.private } : clip
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

  const shareToTwitter = (shortId: string, name: string) => {
    const url = encodeURIComponent(`https://clips.dgesy.org/v/${shortId}`);
    const text = encodeURIComponent(`Check out this clip: ${name}`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank");
  };

  const handleAddToFolder = async (shortId: string, folderId: number) => {
    try {
      await api.post(`/api/folders/${folderId}/clips`, { shortId });
      setAddingToFolder(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Failed to add to folder");
    }
  };

  const isUploading = uploadStatus === "uploading" || uploadStatus === "processing";

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-6xl mx-auto flex gap-8">
        {/* Folder sidebar */}
        <FolderSidebar
          selectedFolderId={selectedFolderId}
          onSelectFolder={(id) => {
            setSelectedFolderId(id);
            setLoading(true);
          }}
        />

        {/* Main content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl font-black mb-1">
                My <span className="gradient-text">Clips</span>
              </h1>
              <p className="dark:text-slate-500 text-slate-400 text-sm">
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
            <div className="mb-6 rounded-xl overflow-hidden dark:bg-white/[0.04] bg-slate-100 border dark:border-white/[0.06] border-slate-200">
              <div
                className={`h-1.5 transition-all duration-300 ${
                  uploadStatus === "processing" ? "animate-pulse" : ""
                }`}
                style={{
                  width: uploadStatus === "uploading" ? `${uploadProgress}%` : "100%",
                  background: "linear-gradient(90deg, #6366f1, #06b6d4)",
                }}
              />
              <p className="text-xs dark:text-slate-500 text-slate-400 text-center py-2">
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
            <p className="dark:text-slate-500 text-slate-400 text-center py-20">Loading clips...</p>
          ) : clips.length === 0 ? (
            <div className="text-center py-20">
              <p className="dark:text-slate-500 text-slate-400 mb-4">No clips here yet</p>
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
                  className="rounded-2xl border dark:border-white/[0.07] border-slate-200 dark:bg-white/[0.02] bg-white p-5 hover:border-indigo-500/20 transition-all"
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
                                if (e.key === "Escape") { setRenamingId(null); setRenameValue(""); }
                              }}
                              autoFocus
                              className="px-3 py-1.5 rounded-lg dark:bg-white/[0.05] bg-slate-100 border border-indigo-500/40 dark:text-slate-100 text-slate-900 text-sm focus:outline-none"
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
                              className="px-3 py-1.5 rounded-lg text-xs dark:text-slate-400 text-slate-600 border dark:border-white/[0.08] border-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => router.push(`/v/${clip.shortId}`)}
                            className="dark:text-slate-100 text-slate-900 font-semibold hover:text-indigo-400 transition-colors text-left"
                          >
                            {clip.originalName}
                          </button>
                        )}
                        <div className="flex items-center gap-3 text-xs dark:text-slate-500 text-slate-400">
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
                          onClick={() => { setRenamingId(clip.shortId); setRenameValue(clip.originalName); }}
                          className="p-2 rounded-lg dark:text-slate-500 text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all"
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
                          className="p-2 rounded-lg dark:text-slate-500 text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all"
                          title="Copy link"
                        >
                          {copiedId === clip.shortId ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                        <button
                          onClick={() => shareToTwitter(clip.shortId, clip.originalName)}
                          className="p-2 rounded-lg dark:text-slate-500 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-all"
                          title="Share on X"
                        >
                          <Twitter size={16} />
                        </button>
                        <button
                          onClick={() => setAddingToFolder(addingToFolder === clip.shortId ? null : clip.shortId)}
                          className="p-2 rounded-lg dark:text-slate-500 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all"
                          title="Add to folder"
                        >
                          <FolderPlus size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(clip.shortId)}
                          className="p-2 rounded-lg dark:text-slate-500 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Add to folder dropdown */} 
                  {addingToFolder === clip.shortId && (
                    <div className="mt-4 p-3 rounded-xl dark:bg-white/[0.03] bg-slate-50 border dark:border-white/[0.06] border-slate-200">
                      <p className="text-xs dark:text-slate-500 text-slate-400 mb-2">Add to folder:</p>
                      {userFolders.length === 0 ? (
                        <p className="text-xs dark:text-slate-600 text-slate-400">No folders yet — create one in the sidebar</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {userFolders.map((folder) => (
                            <button
                              key={folder.id}
                              onClick={() => handleAddToFolder(clip.shortId, folder.id)}
                              className="px-3 py-1.5 rounded-lg text-xs border dark:border-white/[0.08] border-slate-200 dark:text-slate-400 text-slate-600 dark:hover:bg-white/[0.05] hover:bg-slate-100 transition-all"
                            >
                              {folder.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}