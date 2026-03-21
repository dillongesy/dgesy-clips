"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import api from "@/lib/api";
import { Eye, Clock } from "lucide-react";

interface Clip {
  shortId: string;
  originalName: string;
  sizeBytes: number;
  durationSeconds: number;
  viewCount: number;
  createdAt: string;
  user: { username: string };
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function SharedPage() {
  const router = useRouter();
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    const fetchShared = async () => {
      try {
        const res = await api.get("/api/clips/shared");
        setClips(res.data);
      } catch {
        setError("Failed to load shared clips");
      } finally {
        setLoading(false);
      }
    };
    fetchShared();
  }, [router]);

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black mb-1">
            Shared <span className="gradient-text">with me</span>
          </h1>
          <p className="text-slate-500 text-sm">{clips.length} clip{clips.length !== 1 ? "s" : ""}</p>
        </div>

        {error && <p className="text-red-400 text-sm mb-6 text-center">{error}</p>}

        {loading ? (
          <p className="text-slate-500 text-center py-20">Loading...</p>
        ) : clips.length === 0 ? (
          <p className="text-slate-500 text-center py-20">No clips shared with you yet</p>
        ) : (
          <div className="grid gap-4">
            {clips.map((clip) => (
              <div
                key={clip.shortId}
                onClick={() => router.push(`/v/${clip.shortId}`)}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 hover:border-indigo-500/20 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-slate-100 font-semibold hover:text-indigo-300 transition-colors">
                    {clip.originalName}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>from {clip.user?.username}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {formatDuration(clip.durationSeconds)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={11} /> {clip.viewCount}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}