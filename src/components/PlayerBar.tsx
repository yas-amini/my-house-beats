import { usePlayer } from "@/lib/player";

function fmt(ms: number) {
  if (!ms || ms < 0) return "0:00";
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function PlayerBar() {
  const { current, playing, toggle, position, duration, seek } = usePlayer();
  if (!current) return null;

  const pct = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
        <button
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
        >
          {playing ? (
            <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor">
              <rect x="0" y="0" width="4.5" height="16" rx="1" />
              <rect x="9.5" y="0" width="4.5" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor">
              <path d="M1 1.2c0-.9 1-1.4 1.7-.9l10 6.8c.6.4.6 1.4 0 1.8l-10 6.8c-.7.5-1.7 0-1.7-.9V1.2z" />
            </svg>
          )}
        </button>
        {current.cover_art && (
          <img
            src={current.cover_art}
            alt={`${current.artist} — ${current.title} cover art`}
            className="h-11 w-11 shrink-0 rounded-md border border-border object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl leading-tight tracking-wide">
            {current.title}
          </p>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {current.artist} · {current.dj}
          </p>
        </div>
        {current.year && (
          <span className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:block">
            {current.year}
          </span>
        )}
      </div>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 pb-3">
        <span className="w-10 shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
          {fmt(position)}
        </span>
        <div className="relative flex-1">
          <div className="h-1 w-full rounded-full bg-border" />
          <div
            className="pointer-events-none absolute left-0 top-0 h-1 rounded-full bg-primary transition-[width] duration-200 ease-linear"
            style={{ width: `${pct}%` }}
          />
          <div
            className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-primary shadow-sm transition-[left] duration-200 ease-linear"
            style={{ left: `${pct}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={500}
            value={position}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="Seek"
            disabled={!duration}
            className="absolute inset-x-0 top-1/2 h-4 w-full -translate-y-1/2 cursor-pointer opacity-0"
          />
        </div>
        <span className="w-10 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
          {fmt(duration)}
        </span>
      </div>
    </div>
  );
}
