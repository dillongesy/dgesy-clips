import type { Metadata } from "next";
import { Eye, Clock, User, Lock } from "lucide-react";
import VideoPlayer from "./VideoPlayer";
import { cookies } from "next/headers";

const API_URL = process.env.INTERNAL_API_URL || "http://192.168.150.82:8080";

interface ClipInfo {
  shortId: string;
  originalName: string;
  duration: number;
  viewCount: number;
  createdAt: string;
  streamUrl: string;
  thumbnailUrl: string;
  owner: string;
  private: boolean;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function getClip(shortId: string, token?: string): Promise<ClipInfo | null> {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      console.log("Fetching clip with token:", token.substring(0, 20) + "...");
    } else {
      console.log("Fetching clip WITHOUT token");
    }

    const res = await fetch(`${API_URL}/api/clips/view/${shortId}`, {
      cache: "no-store",
      headers,
    });
    console.log("API response status:", res.status);
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    console.log("Fetch error:", e);
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ shortId: string }> }
): Promise<Metadata> {
  const { shortId } = await params;
  const clip = await getClip(shortId);

  if (!clip || clip.private) {
    return {
      title: "Private clip — clips.dgesy",
      description: "This clip is private.",
    };
  }

  const streamUrl = `https://clips.dgesy.org/api/clips/stream/${shortId}`;
  const thumbnailUrl = `https://clips.dgesy.org/api/clips/thumbnail/${shortId}`;
  const pageUrl = `https://clips.dgesy.org/v/${shortId}`;

  return {
    title: `${clip.originalName} — clips.dgesy`,
    description: `Watch ${clip.originalName} on clips.dgesy.org`,
    openGraph: {
      title: clip.originalName,
      description: "Watch on clips.dgesy.org",
      url: pageUrl,
      type: "video.other",
      videos: [{ url: streamUrl, type: "video/mp4", width: 1280, height: 720 }],
      images: [{ url: thumbnailUrl, width: 1280, height: 720 }],
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
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const clip = await getClip(shortId, token);

  if (!clip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Lock size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold">Clip not found or private</p>
          <p className="text-slate-600 text-sm mt-1">
            You may need to log in to view this clip.
          </p>
        </div>
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
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-xl font-bold text-slate-100">
                {clip.originalName}
              </h1>
              {clip.private && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Lock size={9} /> Private
                </span>
              )}
            </div>
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