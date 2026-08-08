import { useEffect, useState } from "react";

export type Palette = {
  /** dominant warm/ambient light */
  a: string;
  /** secondary contrasting light */
  b: string;
  /** accent used for the signal / lamp */
  c: string;
};

/** 1970s disco fallback: amber, magenta, warm gold. */
export const FALLBACK_PALETTE: Palette = {
  a: "#c8622a",
  b: "#8d3b6e",
  c: "#e0a24a",
};

function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

const paletteCache = new Map<string, Palette>();

/** Pull three ambient light colours out of the artwork, warmed toward 70s film. */
export function useArtworkPalette(src: string | null | undefined): Palette {
  const [palette, setPalette] = useState<Palette>(() => {
    if (src && paletteCache.has(src)) {
      return paletteCache.get(src)!;
    }
    return FALLBACK_PALETTE;
  });

  useEffect(() => {
    if (!src || typeof window === "undefined") {
      setPalette(FALLBACK_PALETTE);
      return;
    }

    if (paletteCache.has(src)) {
      setPalette(paletteCache.get(src)!);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      try {
        const N = 24;
        const canvas = document.createElement("canvas");
        canvas.width = N;
        canvas.height = N;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, N, N);
        const { data } = ctx.getImageData(0, 0, N, N);

        // bucket by hue, weight by saturation so muddy pixels don't win
        const buckets = new Array(12).fill(0).map(() => ({ r: 0, g: 0, b: 0, w: 0 }));
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i] as number;
          const g = data[i + 1] as number;
          const b = data[i + 2] as number;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          if (max < 24) continue;
          const sat = (max - min) / (max || 1);
          let h = 0;
          if (max !== min) {
            if (max === r) h = ((g - b) / (max - min) + 6) % 6;
            else if (max === g) h = (b - r) / (max - min) + 2;
            else h = (r - g) / (max - min) + 4;
          }
          const idx = Math.min(11, Math.floor((h / 6) * 12));
          const w = 0.15 + sat;
          const bucket = buckets[idx]!;
          bucket.r += r * w;
          bucket.g += g * w;
          bucket.b += b * w;
          bucket.w += w;
        }

        const ranked = buckets
          .filter((x) => x.w > 0)
          .map((x) => ({ r: x.r / x.w, g: x.g / x.w, b: x.b / x.w, w: x.w }))
          .sort((x, y) => y.w - x.w);

        if (!ranked.length) {
          paletteCache.set(src, FALLBACK_PALETTE);
          setPalette(FALLBACK_PALETTE);
          return;
        }

        // warm + lift each light so it reads as a 70s gel rather than a flat swatch
        const gel = (c: { r: number; g: number; b: number }, warm: number, lift: number) => {
          const r = Math.min(255, c.r * lift + 40 * warm);
          const g = Math.min(255, c.g * lift + 18 * warm);
          const b = Math.min(255, c.b * lift + 6 * warm);
          return rgbToHex(r, g, b);
        };

        const first = ranked[0]!;
        const second = ranked[1] ?? first;
        const third = ranked[2] ?? second;

        const result: Palette = {
          a: gel(first, 1, 1.15),
          b: gel(second, 0.4, 1.1),
          c: gel(third, 1.2, 1.35),
        };
        paletteCache.set(src, result);
        setPalette(result);
      } catch {
        setPalette(FALLBACK_PALETTE);
      }
    };
    img.onerror = () => !cancelled && setPalette(FALLBACK_PALETTE);
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  return palette;
}
