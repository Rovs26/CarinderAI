/** Static paths under public/assets/ */
export const ASSETS = {
  appIcon: "/assets/carinderai-app-icon.png",
  logoMark: "/assets/carinderai-logo-mark.png",
  heroBanner: "/assets/carinderai-hero-banner.png",
  captureEmptyState: "/assets/capture-empty-state.png",
} as const;

/** Try PNG first, then JPG — whichever exists on the server */
export const SAMPLE_ORDER_CANDIDATES = [
  "/assets/sample-handwritten-order.png",
  "/assets/sample-handwritten-order.jpg",
] as const;

export async function resolveSampleOrderPath(): Promise<string | null> {
  for (const path of SAMPLE_ORDER_CANDIDATES) {
    try {
      const res = await fetch(path, { method: "HEAD" });
      if (res.ok) return path;
    } catch {
      /* try next */
    }
  }
  return null;
}
