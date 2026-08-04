const SKETCHFAB_SRC =
  "https://sketchfab.com/models/b949297d4ecb48a89ea3544621c999c9/embed?autospin=0.2&autostart=1&camera=0&preload=1&transparent=1&ui_infos=0&ui_controls=0&ui_watermark=0&ui_watermark_link=0&ui_hint=0&ui_stop=0&ui_help=0&ui_settings=0&ui_vr=0&ui_ar=0&ui_fullscreen=0&ui_animations=0&ui_annotations=0&ui_loading=0&scrollwheel=0&dnt=1";

type Props = { open: boolean };

/**
 * The disco ball hangs in the room: oversized, partially off the top-right of
 * the composition, sitting behind everything and casting light through the haze.
 */
export function DiscoBall({ open }: Props) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-[1] select-none"
      style={{
        top: "-10vh",
        right: "-6vw",
        width: "min(46vw, 540px)",
        height: "min(46vw, 540px)",
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
        title="Disco ball animated by SusanKing on Sketchfab"
        src={SKETCHFAB_SRC}
        allow="autoplay; fullscreen; xr-spatial-tracking"
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

/** Required Sketchfab attribution for the embedded model. */
export function DiscoBallCredit() {
  return (
    <p
      className="font-mono text-[9px] uppercase tracking-[0.24em]"
      style={{ color: "var(--club-dim)" }}
    >
      Disco ball{" "}
      <a
        href="https://sketchfab.com/3d-models/disco-ball-animated-b949297d4ecb48a89ea3544621c999c9"
        target="_blank"
        rel="noreferrer noopener"
        className="underline underline-offset-4"
      >
        "Disco ball animated"
      </a>{" "}
      by{" "}
      <a
        href="https://sketchfab.com/SusanKing"
        target="_blank"
        rel="noreferrer noopener"
        className="underline underline-offset-4"
      >
        SusanKing
      </a>{" "}
      on{" "}
      <a
        href="https://sketchfab.com"
        target="_blank"
        rel="noreferrer noopener"
        className="underline underline-offset-4"
      >
        Sketchfab
      </a>{" "}
      · CC BY 4.0
    </p>
  );
}
