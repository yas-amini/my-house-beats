const SKETCHFAB_SRC =
  "https://sketchfab.com/models/b949297d4ecb48a89ea3544621c999c9/embed?autospin=1&autostart=1&camera=0&preload=1&transparent=1&ui_hint=0&ui_controls=0&ui_infos=0&ui_watermark=0";

type Props = { open: boolean };

/**
 * The disco ball hangs in the room: oversized, sitting behind everything and
 * casting light through the haze. On mobile it stays fully on-screen, tucked
 * into the top-right corner.
 */
export function DiscoBall({ open }: Props) {
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
        title="Disco ball animated"
        src={SKETCHFAB_SRC}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
        loading="lazy"
        className="relative h-full w-full"
        style={{
          border: 0,
          background: "transparent",
          // screen blending drops the viewer's black plate so the ball hangs in the room
          mixBlendMode: "screen",
          maskImage: "radial-gradient(circle at 50% 46%, #000 40%, transparent 62%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 46%, #000 40%, transparent 62%)",
        }}
      />
    </div>
  );
}

