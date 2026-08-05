import { useEffect, useRef } from "react";

declare global {
  interface Window {
    Sketchfab?: any;
  }
}

const MODEL_ID = "b949297d4ecb48a89ea3544621c999c9";

type Props = { open: boolean };

/**
 * The disco ball hangs in the room: oversized, sitting behind everything and
 * casting light through the haze. Uses the Sketchfab Viewer API to control rotation
 * and interface visibility dynamically.
 */
export function DiscoBall({ open }: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const apiRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    const initViewer = () => {
      if (cancelled || !iframeRef.current || !window.Sketchfab) return;
      const client = new window.Sketchfab("1.12.1", iframeRef.current);
      client.init(MODEL_ID, {
        autostart: 1,
        transparent: 1,
        ui_hint: 0,
        ui_controls: 0,
        ui_help: 0,
        ui_infos: 0,
        ui_watermark: 0,
        ui_settings: 0,
        ui_inspector: 0,
        ui_annotations: 0,
        ui_stop: 0,
        ui_vr: 0,
        ui_ar: 0,
        dnt: 1,
        success: (api: any) => {
          if (cancelled) return;
          apiRef.current = api;
          api.start();
          api.addEventListener("viewerready", () => {
            if (cancelled) return;
            api.startRotation(0.2);
          });
        },
        error: () => console.error("Sketchfab API initialization failed."),
      });
    };

    if (window.Sketchfab) {
      initViewer();
    } else {
      const script = document.createElement("script");
      script.src = "https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js";
      script.async = true;
      script.onload = () => initViewer();
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (apiRef.current) {
        try {
          apiRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    try {
      if (open) {
        api.startRotation(0.2);
      } else {
        api.startRotation(0.05);
      }
    } catch (_) {}
  }, [open]);

  return (
    <div
      aria-hidden
      className="sketchfab-embed-wrapper pointer-events-none fixed right-0 top-[-4vh] z-[1] h-[56vw] max-h-[300px] w-[56vw] max-w-[300px] select-none sm:right-[-4vw] sm:top-[-8vh] sm:h-[min(46vw,540px)] sm:max-h-none sm:w-[min(46vw,540px)] sm:max-w-none"
      style={{
        opacity: open ? 0.95 : 0.4,
        filter: open ? "saturate(1.05)" : "saturate(0.5) blur(1px)",
        transition: "opacity 2s ease, filter 2s ease",
      }}
    >
      {/* rig: the ball reads as hanging from the ceiling */}
      <div
        className="absolute left-1/2 top-0 h-[16vh] w-px -translate-x-1/2"
        style={{ background: "linear-gradient(to bottom, transparent, var(--club-line))" }}
      />
      {/* light the ball throws into the room */}
      <div
        className={`absolute inset-[6%] rounded-full ${open ? "club-ball-glow" : ""}`}
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--club-light-c) 55%, transparent) 0%, transparent 62%)",
          filter: "blur(70px)",
          opacity: open ? 0.75 : 0.25,
          transition: "opacity 2s ease",
        }}
      />
      <iframe
        ref={iframeRef}
        title="Disco ball animated"
        id="api-frame"
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
        className="relative h-full w-full"
        style={{
          border: 0,
          background: "transparent",
          mixBlendMode: "screen",
          maskImage: "radial-gradient(circle at 50% 46%, #000 40%, transparent 62%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 46%, #000 40%, transparent 62%)",
        }}
      />
    </div>
  );
}

