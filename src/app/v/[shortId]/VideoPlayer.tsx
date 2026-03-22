"use client";

import { useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  streamUrl: string;
  thumbnailUrl: string;
}

export default function VideoPlayer({ streamUrl, thumbnailUrl }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState(streamUrl);

  useEffect(() => {
    // Append token to stream URL for private clip auth
    const token = localStorage.getItem("token");
    if (token) {
      setSrc(`${streamUrl}?token=${token}`);
    }
  }, [streamUrl]);

  useEffect(() => {
    if (videoRef.current) {
      const savedVolume = localStorage.getItem("clipVolume");
      if (savedVolume !== null) {
        videoRef.current.volume = parseFloat(savedVolume);
      }
    }
  }, []);

  const handleVolumeChange = () => {
    if (videoRef.current) {
      localStorage.setItem("clipVolume", videoRef.current.volume.toString());
    }
  };

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