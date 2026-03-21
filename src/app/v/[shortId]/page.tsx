import type { Metadata } from "next";
import VideoClient from "./VideoClient";

export function generateStaticParams() {
  return [{ shortId: "_" }];
}

export const metadata: Metadata = {
  title: "clips.dgesy — Watch clip",
  description: "Watch this clip on clips.dgesy.org",
  openGraph: {
    type: "video.other",
    url: "https://clips.dgesy.org/v/_",
    videos: [{
      url: "https://clips.dgesy.org/api/clips/stream/_",
      type: "video/mp4",
    }],
    images: [{
      url: "https://clips.dgesy.org/api/clips/thumbnail/_",
    }],
  },
  other: {
    "og:video": "https://clips.dgesy.org/api/clips/stream/_",
    "og:video:type": "video/mp4",
    "og:video:width": "1280",
    "og:video:height": "720",
    "twitter:card": "player",
    "twitter:player": "https://clips.dgesy.org/v/_",
    "twitter:player:width": "1280",
    "twitter:player:height": "720",
  }
};

export default function VideoPage() {
  return <VideoClient />;
}