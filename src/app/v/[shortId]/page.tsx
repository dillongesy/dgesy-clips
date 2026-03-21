import VideoClient from "./VideoClient";

export function generateStaticParams() {
  return [{ shortId: "_" }];
}

export default function VideoPage() {
  return <VideoClient />;
}
