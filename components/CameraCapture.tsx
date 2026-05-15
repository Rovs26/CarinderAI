"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CameraCaptureProps = {
  onCapture: (file: File, previewUrl: string) => void;
  disabled?: boolean;
};

const CAMERA_UNAVAILABLE =
  "Camera is unavailable. You can still upload a photo or use the sample order.";

export function CameraCapture({ onCapture, disabled }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    const video = videoRef.current;
    if (video) video.srcObject = null;
    setOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const openCamera = async () => {
    if (disabled) return;
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(CAMERA_UNAVAILABLE);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setOpen(true);
      requestAnimationFrame(() => {
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          void video.play();
        }
      });
    } catch {
      setError(CAMERA_UNAVAILABLE);
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopCamera();
        const file = new File([blob], `order-capture-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        onCapture(file, URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <div className="space-y-2">
      {error && (
        <p className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-900">
          {error}
        </p>
      )}

      {!open ? (
        <button
          type="button"
          onClick={openCamera}
          disabled={disabled}
          className="btn-secondary text-sm !py-3"
        >
          Open camera
        </button>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/70 bg-stone-900/90">
          <video
            ref={videoRef}
            playsInline
            muted
            className="aspect-[4/3] w-full object-cover"
            aria-label="Live camera preview"
          />
          <div className="flex gap-2 bg-black/40 p-2 backdrop-blur-sm">
            <button
              type="button"
              onClick={takePhoto}
              className="btn-primary flex-1 !py-2.5 text-sm"
            >
              Take photo
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="btn-ghost flex-1 !py-2.5 !text-white"
            >
              Close camera
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
