import { useEffect, useRef, useState } from "react";
import type { Palette } from "@/lib/palette";

type Star = {
  key: number;
  x: number; // vw
  y: number; // vh
  size: number; // px
  rot: number; // deg
  peak: number; // 0..1
  dur: number; // ms
  tint: string;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/**
 * 1970s star-filter reflections.
 *
 * A handful of facets at a time catch the light: dark -> pinpoint -> blink ->
 * bloom -> gone. Positions are biased toward the bright areas of the room —
 * the disco ball (top-right), the ball's raking light, and the artwork — and
 * the ball's slow rotation sweeps the spawn angle so new reflections appear
 * as it turns.
 */
export function StarFilter({ open, palette }: { open: boolean; palette: Palette }) {
  const [stars, setStars] = useState<Star[]>([]);
  const idRef = useRef(0);
  const angleRef = useRef(Math.random() * Math.PI * 2);
  const paletteRef = useRef(palette);
  paletteRef.current = palette;

  useEffect(() => {
    if (!open) {
      setStars([]);
      return;
    }
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;

    let timer: ReturnType<typeof setTimeout>;

    const spawn = () => {
      // the ball turns slowly; each new facet catches the lens a little
      // further around its arc
      angleRef.current += rand(0.35, 1.1);
      const a = angleRef.current;

      const zone = Math.random();
      let x: number;
      let y: number;

      if (zone < 0.55) {
        // facets on and immediately around the disco ball
        const cx = window.innerWidth < 640 ? 82 : 88;
        const cy = window.innerWidth < 640 ? 10 : 14;
        const r = rand(4, 20);
        x = cx + Math.cos(a) * r;
        y = cy + Math.sin(a) * r * 1.5;
      } else if (zone < 0.8) {
        // light thrown across the room, following the same sweep
        x = 50 + Math.cos(a) * rand(18, 46);
        y = rand(22, 78);
      } else {
        // glints off the sleeve and the floor bounce
        x = rand(8, 46);
        y = rand(48, 88);
      }

      const currentPalette = paletteRef.current;
      const bright = Math.random() < 0.4; // higher chance of hot flash
      const tint = [currentPalette.c, "#fff6e2", currentPalette.a][Math.floor(Math.random() * 3)] ?? "#fff";

      const star: Star = {
        key: idRef.current++,
        x: Math.max(2, Math.min(97, x)),
        y: Math.max(3, Math.min(94, y)),
        size: bright ? rand(90, 150) : rand(26, 72),
        rot: rand(-14, 14),
        peak: bright ? rand(0.85, 1) : rand(0.28, 0.62),
        dur: bright ? rand(200, 450) : rand(350, 750),
        tint,
      };

      setStars((prev) => [...prev.slice(-12), star]);
      window.setTimeout(() => {
        setStars((prev) => prev.filter((s) => s.key !== star.key));
      }, star.dur + 80);

      // faster, more frequent timing
      const gap = Math.random() < 0.45 ? rand(40, 120) : rand(100, 500);
      timer = setTimeout(spawn, gap);
    };

    timer = setTimeout(spawn, rand(200, 700));
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[2] overflow-hidden">
      {stars.map((s) => (
        <div
          key={s.key}
          className="club-star"
          style={{
            left: `${s.x}vw`,
            top: `${s.y}vh`,
            width: s.size,
            height: s.size,
            marginLeft: -s.size / 2,
            marginTop: -s.size / 2,
            ["--rot" as string]: `${s.rot}deg`,
            ["--peak" as string]: s.peak,
            ["--dur" as string]: `${s.dur}ms`,
            ["--tint" as string]: s.tint,
          }}
        >
          <span className="club-star-ray" />
          <span className="club-star-ray club-star-ray--v" />
          <span className="club-star-bloom" />
          <span className="club-star-core" />
        </div>
      ))}
    </div>
  );
}
