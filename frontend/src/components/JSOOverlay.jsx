import { useEffect, useRef } from 'react';
import JASSUB from 'jassub';

export default function JSOOverlay({
  videoRef, // Reference to the video element (from ReactPlayer)
  assContent, // The raw ASS content string
  fonts, // Optional: Array of font URLs
}) {
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!videoRef?.current || !assContent) return;

    // Destroy previous instance if exists
    if (instanceRef.current) {
      instanceRef.current.destroy();
      instanceRef.current = null;
    }

    const videoElement = videoRef.current.getInternalPlayer();
    if (!videoElement || !(videoElement instanceof HTMLVideoElement)) {
      console.warn("JSOOverlay: Valid video element not found");
      return;
    }

    const defaultFonts = [
      "/fonts/PressStart2P-Regular.ttf",
      "/fonts/KomikaAxis.ttf",
      "/fonts/BlackCaps.ttf",
      "/subfonts/brown-beige/Brown Beige.ttf",
      "/subfonts/brown-beige/Thoge.ttf",
      "/subfonts/overheat/OverHeat-Regular.ttf",
      "/subfonts/brume-font-2023-11-27-05-09-31-utc/TTF/Brume-Regular.ttf",
      "/subfonts/chunko-bold-sans-serif-font-2025-03-05-02-17-04-utc/ChunkoBold/TTF/Chunko Bold.ttf",
      "/subfonts/folkies-vantage-vintage-font-duo-2025-05-09-17-50-49-utc/Folkies Vantage/FolkiesVantageSans/OpenType-TT/Folkies Vantage Sans.ttf",
      "/subfonts/halloween-might-night-2025-08-08-18-28-24-utc/Might Night/Might Night/Might Night.ttf",
      "/subfonts/marble-modern-logo-font-2025-05-14-21-44-25-utc/TTF/Marble Regular.ttf",
      "/subfonts/monigue-condensed-sans-font-2023-11-27-05-05-53-utc/Monigue.ttf",
      "/subfonts/oslla-font-2024-11-28-19-24-47-utc/Oslla.ttf",
      "/subfonts/rose-mask-2024-12-02-18-31-15-utc/RoseMask.ttf",
      "/subfonts/sink-retro-sans-serif-2024-07-17-22-36-20-utc/Sink.ttf",
      "/subfonts/tallica-variable-typeface-2024-05-24-18-56-58-utc/OpenType-TT/Tallica-Regular.ttf",
    ];

    // Initialize JASSUB
    try {
      instanceRef.current = new JASSUB({
        video: videoElement,
        subContent: assContent,
        fonts: fonts || defaultFonts,
        workerUrl: '/jassub/jassub-worker.js',
        wasmUrl: '/jassub/jassub-worker.wasm',
        legacyWasmUrl: '/jassub/jassub-worker.wasm.js',
      });
    } catch (e) {
      console.error("JASSUB Init Error:", e);
    }

    return () => {
      if (instanceRef.current) {
        instanceRef.current.destroy();
        instanceRef.current = null;
      }
    };
  }, [videoRef, assContent, fonts]);

  // Update content when it changes without destroying instance if possible
  useEffect(() => {
    if (instanceRef.current && assContent) {
      instanceRef.current.setTrack(assContent);
    }
  }, [assContent]);

  return null;
}
