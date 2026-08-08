import type { Palette } from "@/lib/palette";

type Props = { open: boolean; palette: Palette };

/**
 * Layered 1970s club light: several huge diffused sources, a haze plane,
 * sparse star-filter flares and film grain. Everything slows down and dims
 * when the music stops.
 */
export function ClubAtmosphere({ open, palette }: Props) {
  const lights = [
    {
      cls: "club-drift-a",
      varName: "var(--club-light-a)",
      style: { left: "-18%", top: "-12%", width: "78vw", height: "78vw" },
      base: 0.5,
    },
    {
      cls: "club-drift-b",
      varName: "var(--club-light-b)",
      style: { right: "-22%", bottom: "-24%", width: "82vw", height: "82vw" },
      base: 0.45,
    },
    {
      cls: "club-drift-c",
      varName: "var(--club-light-c)",
      style: { left: "26%", bottom: "-10%", width: "58vw", height: "58vw" },
      base: 0.38,
    },
  ];

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{
        // ambient tokens the rest of the room borrows from
        ["--club-light-a" as string]: palette.a,
        ["--club-light-b" as string]: palette.b,
        ["--club-light-c" as string]: palette.c,
      }}
    >
      {/* 1 — diffused light sources shining through haze */}
      {lights.map((l) => (
        <div
          key={l.cls}
          className={open ? l.cls : undefined}
          style={{
            position: "absolute",
            ...l.style,
            background: `radial-gradient(circle, ${l.varName} 0%, transparent 64%)`,
            filter: "blur(110px)",
            mixBlendMode: "screen",
            opacity: open ? l.base : l.base * 0.32,
            transition: "opacity 2.4s ease",
            willChange: "transform, opacity",
            transform: "translateZ(0)",
          }}
        />
      ))}

      {/* 2 — the room's floor bounce, keeps the bottom of the frame warm */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background: `linear-gradient(to top, color-mix(in oklab, var(--club-light-a) 26%, transparent), transparent)`,
          mixBlendMode: "screen",
          opacity: open ? 0.7 : 0.35,
          transition: "opacity 2.4s ease",
        }}
      />

      {/* 3 — smoke haze softening every light source */}
      <div
        className={`absolute inset-0 ${open ? "club-haze" : ""}`}
        style={{
          background:
            "radial-gradient(120% 70% at 50% 30%, rgba(255,238,214,0.10) 0%, transparent 70%)",
          backdropFilter: "blur(0.4px)",
          opacity: open ? 1 : 0.55,
          transition: "opacity 2.4s ease",
        }}
      />

      {/* 3b — soft haze around the disco ball */}
      <div
        className="absolute right-[-5%] top-[-5%] h-[420px] w-[420px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(251,180,108,0.16) 0%, rgba(255,79,154,0.08) 35%, transparent 70%)",
          filter: "blur(70px)",
          opacity: open ? 1 : 0.35,
          transition: "opacity 2.4s ease",
        }}
      />

      {/* 4 — vignette so the room has walls */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(115% 85% at 50% 45%, transparent 42%, rgba(0,0,0,0.72) 100%)",
        }}
      />

      {/* 5 — analog film grain */}
      <div
        className={`absolute inset-0 ${open ? "club-grain" : ""}`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E\")",
          opacity: 0.13,
          mixBlendMode: "overlay",
        }}
      />
    </div>
  );
}
