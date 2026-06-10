"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useT } from "@/lib/language-context";

export interface WebcamCaptureProps {
  /** Called with a JPEG blob each time a frame is captured. */
  onCapture: (blob: Blob) => void;
  /** Optional reporter for permission/no-device/runtime errors. */
  onError?: (msg: string) => void;
  /** Interval between auto-captures, in milliseconds. Defaults to 10_000. */
  autoIntervalMs?: number;
  /** When true, runs onCapture every `autoIntervalMs` ms automatically. */
  isAutoMode?: boolean;
  /**
   * Hide the manual "Capture" button and the file-fallback link. Used when
   * the parent owns the capture cadence (e.g. Counter Session drives a
   * setInterval against /api/tray/count and doesn't want a redundant
   * manual button cluttering the surface).
   */
  hideManualButton?: boolean;
}

/**
 * Reusable webcam capture surface backed by `navigator.mediaDevices.getUserMedia`.
 *
 * Behavior:
 *   - On mount, requests `{ video: { facingMode: 'environment' } }` (rear
 *     camera on phones); if that rejects with OverconstrainedError, retries
 *     with the browser default camera so laptop webcams still work.
 *   - Renders the live `<video>` stream and a "Capture" button. Each capture
 *     draws the current video frame to an offscreen `<canvas>`, exports a
 *     JPEG blob via `canvas.toBlob`, and forwards it to `onCapture`.
 *   - When `isAutoMode` is true, additionally fires a capture every
 *     `autoIntervalMs` (default 10s) via `setInterval`. The interval starts
 *     only once the stream is live, and is cleared on unmount or when
 *     `isAutoMode` flips back to false.
 *   - On any getUserMedia rejection (permission denied, no device, etc.) we
 *     show an inline error card AND a fallback `<input type="file">` so the
 *     demo is never dead-in-water — users can still pick a photo from disk.
 *
 * Cleanup: the active `MediaStream` is torn down on unmount via
 * `track.stop()` on every track. Navigating away (route change) unmounts
 * the component which triggers the same cleanup.
 *
 * All visible copy is routed through `useT()` so the component picks up
 * the active language toggle.
 */
export function WebcamCapture({
  onCapture,
  onError,
  autoIntervalMs = 10_000,
  isAutoMode = false,
  hideManualButton = false,
}: WebcamCaptureProps) {
  const t = useT();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [status, setStatus] = useState<"starting" | "ready" | "error">("starting");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Acquire the camera stream once on mount. We try environment-facing first
  // (better for phones held flat over a tray) and fall back to whatever the
  // browser provides (typical for a laptop's built-in webcam).
  useEffect(() => {
    let cancelled = false;

    const attach = (stream: MediaStream) => {
      if (cancelled) {
        stream.getTracks().forEach((tr) => tr.stop());
        return;
      }
      streamRef.current = stream;
      const v = videoRef.current;
      if (v) {
        v.srcObject = stream;
        // The video must call play() explicitly on some browsers even with
        // autoPlay; we ignore the rejection because muted+playsInline lets
        // it succeed in practice.
        void v.play().catch(() => {});
      }
      setStatus("ready");
    };

    const fail = (msg: string) => {
      if (cancelled) return;
      setStatus("error");
      setErrorMsg(msg);
      onError?.(msg);
    };

    async function start() {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        fail(t("webcam_no_device"));
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        attach(stream);
      } catch (firstErr) {
        // Many laptop webcams reject the `environment` constraint with
        // OverconstrainedError. Retry without the facingMode preference
        // before treating it as a hard failure.
        try {
          const fallback = await navigator.mediaDevices.getUserMedia({ video: true });
          attach(fallback);
        } catch (err) {
          const e = err as DOMException | Error;
          let msg = t("webcam_no_device");
          if (e && "name" in e) {
            const name = (e as DOMException).name;
            if (name === "NotAllowedError" || name === "SecurityError") {
              msg = t("webcam_permission_denied");
            } else if (name === "NotFoundError" || name === "OverconstrainedError") {
              msg = t("webcam_no_device");
            }
          }
          // Surface the most informative of the two errors to the console
          // so the demo viewer can debug from devtools.
          console.warn("[WebcamCapture] getUserMedia failed", firstErr, err);
          fail(msg);
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      const stream = streamRef.current;
      if (stream) {
        stream.getTracks().forEach((tr) => tr.stop());
        streamRef.current = null;
      }
    };
    // We only want to attach the camera once on mount; the t() lookups
    // are read at call time so changing language mid-session does not
    // require reinitialising the stream.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Capture the current video frame and emit it as a JPEG blob.
  const captureFrame = useCallback(() => {
    const v = videoRef.current;
    if (!v || v.readyState < 2) return; // HAVE_CURRENT_DATA
    const w = v.videoWidth;
    const h = v.videoHeight;
    if (w === 0 || h === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(blob);
      },
      "image/jpeg",
      0.85,
    );
  }, [onCapture]);

  // Auto-capture loop. Only runs when the stream is live and isAutoMode is
  // truthy. We re-create the interval whenever either dependency changes so
  // toggling auto mode mid-session takes effect immediately.
  useEffect(() => {
    if (status !== "ready" || !isAutoMode) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      captureFrame();
    }, autoIntervalMs);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status, isAutoMode, autoIntervalMs, captureFrame]);

  // Fallback: file picker, used either when getUserMedia fails or as a
  // secondary option even on the success path.
  const handleFileFallback = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    onCapture(file);
  };

  if (status === "error") {
    return (
      <div className="card flex flex-col gap-3">
        <p className="text-sm text-danger">{errorMsg}</p>
        <label className="upload-zone cursor-pointer text-base font-medium text-ink transition-colors">
          <span aria-hidden="true">🖼️</span>
          <span>{t("webcam_fallback_upload")}</span>
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileFallback}
          />
        </label>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-lg border border-border bg-black">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="aspect-video w-full bg-black object-cover"
        />
        {status === "starting" ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80">
            {t("webcam_starting")}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={captureFrame}
        disabled={status !== "ready"}
        className={`btn-primary disabled:opacity-50${hideManualButton ? " hidden" : ""}`}
      >
        <span aria-hidden="true" className="mr-2">📸</span>
        {t("webcam_capture")}
      </button>

      {hideManualButton ? null : (
        <label className="text-center text-xs text-muted underline cursor-pointer">
          {t("webcam_fallback_upload")}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileFallback}
          />
        </label>
      )}
    </div>
  );
}
