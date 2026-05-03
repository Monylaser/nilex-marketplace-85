import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload, Trash2, Video as VideoIcon } from "lucide-react";
import { toast } from "sonner";

const MAX_BYTES = 100 * 1024 * 1024; // 100 MB
const MAX_DURATION = 60; // seconds
const ACCEPT = "video/mp4,video/quicktime,video/x-msvideo";

interface Props {
  adId: string;
  ownerId: string;
}

interface AdVideo {
  id: string;
  video_url: string | null;
  thumbnail_url: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  error: string | null;
}

export default function AdVideo({ adId, ownerId }: Props) {
  const { user } = useAuth();
  const isOwner = !!user && user.id === ownerId;
  const [video, setVideo] = useState<AdVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("ad_videos")
      .select("id,video_url,thumbnail_url,status,error")
      .eq("ad_id", adId)
      .maybeSingle();
    setVideo((data as AdVideo) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adId]);

  const captureThumbnail = (file: File): Promise<{ blob: Blob; duration: number }> =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const v = document.createElement("video");
      v.preload = "metadata";
      v.muted = true;
      v.playsInline = true;
      v.src = url;
      v.onloadedmetadata = () => {
        // Seek to first frame
        v.currentTime = Math.min(0.1, v.duration || 0.1);
      };
      v.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = v.videoWidth || 640;
        canvas.height = v.videoHeight || 360;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas error"));
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (!blob) return reject(new Error("Thumbnail error"));
            resolve({ blob, duration: v.duration });
          },
          "image/jpeg",
          0.85,
        );
      };
      v.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read video"));
      };
    });

  const handleUpload = async (file: File) => {
    if (!user) return toast.error("Sign in to upload");
    if (file.size > MAX_BYTES) return toast.error("Max video size is 100 MB");
    setUploading(true);
    setProgress(5);
    try {
      const { blob: thumbBlob, duration } = await captureThumbnail(file);
      if (duration > MAX_DURATION + 0.5) {
        throw new Error(`Video must be ${MAX_DURATION} seconds or less`);
      }
      setProgress(20);

      const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const base = `${user.id}/${adId}`;
      const videoPath = `${base}/video-${Date.now()}.${ext}`;
      const thumbPath = `${base}/thumb-${Date.now()}.jpg`;

      // Insert pending row first
      const { error: insErr } = await supabase
        .from("ad_videos")
        .upsert(
          {
            ad_id: adId,
            user_id: user.id,
            status: "processing",
            duration_seconds: duration,
            size_bytes: file.size,
          },
          { onConflict: "ad_id" },
        );
      if (insErr) throw insErr;
      setProgress(30);

      const { error: vErr } = await supabase.storage
        .from("ad-videos")
        .upload(videoPath, file, { contentType: file.type, upsert: true });
      if (vErr) throw vErr;
      setProgress(75);

      const { error: tErr } = await supabase.storage
        .from("ad-videos")
        .upload(thumbPath, thumbBlob, { contentType: "image/jpeg", upsert: true });
      if (tErr) throw tErr;
      setProgress(90);

      const videoUrl = supabase.storage.from("ad-videos").getPublicUrl(videoPath).data.publicUrl;
      const thumbUrl = supabase.storage.from("ad-videos").getPublicUrl(thumbPath).data.publicUrl;

      const { error: upErr } = await supabase
        .from("ad_videos")
        .update({
          video_url: videoUrl,
          thumbnail_url: thumbUrl,
          status: "completed",
          error: null,
        })
        .eq("ad_id", adId);
      if (upErr) throw upErr;

      setProgress(100);
      toast.success("Video uploaded");
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Upload failed");
      await supabase
        .from("ad_videos")
        .update({ status: "failed", error: e.message ?? "unknown" })
        .eq("ad_id", adId);
      await load();
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!video) return;
    if (!confirm("Delete this video?")) return;
    // Best-effort: remove storage objects
    try {
      const paths: string[] = [];
      for (const url of [video.video_url, video.thumbnail_url]) {
        if (!url) continue;
        const idx = url.indexOf("/ad-videos/");
        if (idx >= 0) paths.push(url.slice(idx + "/ad-videos/".length));
      }
      if (paths.length) await supabase.storage.from("ad-videos").remove(paths);
    } catch (e) {
      console.warn(e);
    }
    await supabase.from("ad_videos").delete().eq("ad_id", adId);
    setVideo(null);
    toast.success("Video deleted");
  };

  if (loading) return null;

  // Public view: show player only if completed
  if (!isOwner) {
    if (!video || video.status !== "completed" || !video.video_url) return null;
    return (
      <Card className="overflow-hidden mt-4">
        <video
          src={video.video_url}
          poster={video.thumbnail_url ?? undefined}
          controls
          playsInline
          preload="metadata"
          className="w-full aspect-video bg-black"
        />
      </Card>
    );
  }

  // Owner view
  return (
    <Card className="p-4 mt-4 space-y-3">
      <div className="flex items-center gap-2">
        <VideoIcon className="h-4 w-4 text-gold" />
        <h3 className="font-display font-semibold">Ad video</h3>
        {video?.status && (
          <span className="ml-auto text-xs text-muted-foreground capitalize">{video.status}</span>
        )}
      </div>

      {video?.status === "completed" && video.video_url && (
        <video
          src={video.video_url}
          poster={video.thumbnail_url ?? undefined}
          controls
          playsInline
          preload="metadata"
          className="w-full aspect-video bg-black rounded"
        />
      )}

      {uploading && <Progress value={progress} />}

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
          }}
        />
        <Button
          variant="gold"
          size="sm"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="gap-2"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {video?.video_url ? "Replace video" : "Upload video"}
        </Button>
        {video?.video_url && (
          <Button variant="outline" size="sm" onClick={handleDelete} className="gap-2">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        MP4, MOV, or AVI — up to 60 seconds and 100 MB.
      </p>
    </Card>
  );
}
