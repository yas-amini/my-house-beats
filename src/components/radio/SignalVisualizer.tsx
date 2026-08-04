import { useEffect, useRef } from "react";

type Props = {
  playing: boolean;
  /** 0..1 progress through the current transmission */
  progress: number;
  /** stable seed so each record keeps its own signature */
  seed: number;
  height?: number;
  onScrub?: (ratio: number) => void;
};

/**
 * Abstract broadcast spectrum. Not a real FFT (SoundCloud's widget gives us no
 * audio buffer) — a continuously animated level meter that moves while the
 * station transmits and settles to a flat carrier line when it stops.
 */
export function SignalVisualizer({ playing, progress, seed, height = 132, onScrub }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const levelsRef = useRef<number[]>([]);
  const playingRef = useRef(playing);
  const progressRef = useRef(progress);

  playingRef.current = playing;
  progressRef.current = progress;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const COUNT = 96;
    if (levelsRef.current.length !== COUNT) levelsRef.current = new Array(COUNT).fill(0.06);

    const css = getComputedStyle(canvas);
    const signal = css.getPropertyValue("--studio-signal").trim() || "#0066ff";
    const dim = css.getPropertyValue("--studio-line").trim() || "rgba(255,255,255,.14)";

    let raf = 0;
    let t = 0;
    let stopped = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      if (stopped) return;
      const w = canvas.clientWidth;
      const h = height;
      t += 0.024;

      const levels = levelsRef.current;
      const active = playingRef.current;
      const pos = progressRef.current;

      ctx.clearRect(0, 0, w, h);

      const barW = w / COUNT;
      for (let i = 0; i < COUNT; i++) {
        // layered sines + seeded jitter = organic, never-repeating movement
        const p = i / COUNT;
        const env = 0.35 + 0.65 * Math.sin(Math.PI * p) ** 0.6; // louder in the middle
        const wobble =
          Math.sin(t * 1.9 + i * 0.32 + seed) * 0.5 +
          Math.sin(t * 3.7 - i * 0.17 + seed * 0.7) * 0.3 +
          Math.sin(t * 0.7 + i * 0.06) * 0.2;
        const target = active
          ? Math.max(0.06, Math.min(1, env * (0.45 + 0.55 * Math.abs(wobble)) + Math.random() * 0.12))
          : 0.045 + Math.sin(i * 0.5 + t * 0.2) * 0.012;

        const ease = active ? 0.28 : 0.06;
        levels[i] += (target - levels[i]) * ease;

        const bh = Math.max(2, levels[i] * h);
        const x = i * barW;
        const y = (h - bh) / 2;
        ctx.fillStyle = p <= pos ? signal : dim;
        ctx.globalAlpha = p <= pos ? 1 : 0.85;
        ctx.beginPath();
        const r = Math.min(barW * 0.28, 2);
        ctx.roundRect(x + barW * 0.22, y, Math.max(1, barW * 0.56), bh, r);
        ctx.fill();
      }

      // playhead
      ctx.globalAlpha = 1;
      ctx.fillStyle = signal;
      ctx.fillRect(Math.max(0, pos * w - 1), 0, 2, h);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [height, seed]);

  return (
    <canvas
      ref={canvasRef}
      role={onScrub ? "slider" : undefined}
      aria-label={onScrub ? "Scrub the current transmission" : undefined}
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={onScrub ? 0 : undefined}
      onClick={(e) => {
        if (!onScrub) return;
        const r = e.currentTarget.getBoundingClientRect();
        onScrub(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
      }}
      onKeyDown={(e) => {
        if (!onScrub) return;
        if (e.key === "ArrowRight") onScrub(Math.min(1, progress + 0.02));
        if (e.key === "ArrowLeft") onScrub(Math.max(0, progress - 0.02));
      }}
      style={{ height, width: "100%", cursor: onScrub ? "pointer" : "default", display: "block" }}
    />
  );
}
