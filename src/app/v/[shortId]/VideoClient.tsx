"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Eye, Clock, User } from "lucide-react";

interface ClipInfo {
  shortId: string;
  originalName: string;
  duration: number;
  viewCount: number;
  createdAt: string;
  streamUrl: string;
  thumbnailUrl: string;
  owner: string;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function VideoClient() {
  const params = useParams();
  const shortId = typeof window !== "undefined"
    ? window.location.pathname.split("/").filter(Boolean).pop() || "_"
    : (params.shortId as string);
  const [clip, setClip] = useState<ClipInfo | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClip = async () => {
      try {
        const res = await api.get(`/api/clips/view/${shortId}`);
        setClip(res.data);
      } catch {
        setError("Clip not found or unavailable");
      }
    };
    fetchClip();
  }, [shortId]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">{error}</p>
      </div>
    );
  }

  if (!clip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  const streamUrl = clip.streamUrl;

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl overflow-hidden border border-white/[0.07] bg-black mb-6">
          <video
            src={streamUrl}
            controls
            autoPlay
            className="w-full aspect-video"
            poster={clip.thumbnailUrl}
          />
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-100 mb-2">
              {clip.originalName}
            </h1>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <User size={13} />
                {clip.owner}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye size={13} />
                {clip.viewCount} views
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} />
                {formatDuration(clip.duration)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
