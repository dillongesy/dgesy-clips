"use client";

import { useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  streamUrl: string;
  thumbnailUrl: string;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

export default function VideoPlayer({ streamUrl, thumbnailUrl }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token") || getCookie("token");
    if (token) {
      setSrc(`${streamUrl}?token=${encodeURIComponent(token)}`);
    } else {
      setSrc(streamUrl);
    }
  }, [streamUrl]);

  useEffect(() => {
    if (videoRef.current && src) {
      const savedVolume = localStorage.getItem("clipVolume");
      if (savedVolume !== null) {
        videoRef.current.volume = parseFloat(savedVolume);
      }
    }
  }, [src]);

  const handleVolumeChange = () => {
    if (videoRef.current) {
      localStorage.setItem("clipVolume", videoRef.current.volume.toString());
    }
  };

  if (!src) {
    return (
      <div className="w-full aspect-video flex items-center justify-center bg-black">
        <p className="text-slate-500 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={src}
      controls
      autoPlay
      className="w-full aspect-video"
      poster={thumbnailUrl}
      onVolumeChange={handleVolumeChange}
    />
  );
}