"use client";

import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  streamUrl: string;
  thumbnailUrl: string;
}

export default function VideoPlayer({ streamUrl, thumbnailUrl }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

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
      src={streamUrl}
      controls
      autoPlay
      className="w-full aspect-video"
      poster={thumbnailUrl}
      onVolumeChange={handleVolumeChange}
    />
  );
}