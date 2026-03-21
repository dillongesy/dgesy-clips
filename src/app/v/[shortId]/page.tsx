import type { Metadata } from "next";
import { Eye, Clock, User } from "lucide-react";
import VideoPlayer from "./VideoPlayer";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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

async function getClip(shortId: string): Promise<ClipInfo | null> {
  try {
    const res = await fetch(`${API_URL}/api/clips/view/${shortId}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ shortId: string }> }
): Promise<Metadata> {
  const { shortId } = await params;
  const clip = await getClip(shortId);

  if (!clip) {
    return { title: "Clip not found — clips.dgesy" };
  }

  const streamUrl = `https://clips.dgesy.org/api/clips/stream/${shortId}`;
  const thumbnailUrl = `https://clips.dgesy.org/api/clips/thumbnail/${shortId}`;
  const pageUrl = `https://clips.dgesy.org/v/${shortId}`;

  return {
    title: `${clip.originalName} — clips.dgesy`,
    description: `Watch ${clip.originalName} on clips.dgesy.org`,
    openGraph: {
      title: clip.originalName,
      description: `Watch on clips.dgesy.org`,
      url: pageUrl,
      type: "video.other",
      videos: [{
        url: streamUrl,
        type: "video/mp4",
        width: 1280,
        height: 720,
      }],
      images: [{
        url: thumbnailUrl,
        width: 1280,
        height: 720,
      }],
    },
    other: {
      "og:video": streamUrl,
      "og:video:type": "video/mp4",
      "og:video:width": "1280",
      "og:video:height": "720",
      "twitter:card": "player",
      "twitter:player": pageUrl,
      "twitter:player:width": "1280",
      "twitter:player:height": "720",
    },
  };
}

export default async function VideoPage(
  { params }: { params: Promise<{ shortId: string }> }
) {
  const { shortId } = await params;
  const clip = await getClip(shortId);

  if (!clip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Clip not found or unavailable</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl overflow-hidden border border-white/[0.07] bg-black mb-6">
          <VideoPlayer
            streamUrl={clip.streamUrl}
            thumbnailUrl={`/api/clips/thumbnail/${shortId}`}
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