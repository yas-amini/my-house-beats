import { Link, useRouterState } from "@tanstack/react-router";
import { usePlayer } from "@/lib/player";
import { displayName } from "@/lib/tracks";

function fmt(ms: number) {
  if (!ms || ms < 0) return "0:00";
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function PlayerBar() {
  const {
    current,
    playing,
    toggle,
    position,
    duration,
    seek,
    next,
    prev,
    queue,
    queueLabel,
    volume,
    muted,
    setVolume,
    toggleMute,
  } = usePlayer();
  const isClub = useRouterState({
    select: (s) => s.location.pathname.startsWith("/club"),
  });
  if (!current) return null;

  const pct = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur ${
        isClub ? "club border-transparent" : "border-border bg-card/95"
      }`}
      style={
        isClub
          ? {
              borderTopColor: "var(--club-line)",
              background: "color-mix(in oklab, var(--club-bg) 88%, transparent)",
              color: "var(--club-ink)",
            }
          : undefined
      }
    >
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 pt-3">
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={prev}
            aria-label="Previous track"
            className={`flex h-8 w-8 items-center justify-center rounded-full border font-mono text-xs transition-colors ${
              isClub
                ? "border-[color:var(--club-line)] text-[color:var(--club-dim)] hover:text-[color:var(--club-accent)]"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            ‹
          </button>
          <button
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-transform hover:scale-105 ${isClub ? "" : "bg-primary text-primary-foreground"}`}
            style={
              isClub
                ? { background: "var(--club-accent)", color: "var(--club-bg)" }
                : undefined
            }
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
          <button
            onClick={next}
            aria-label="Next track"
            className={`flex h-8 w-8 items-center justify-center rounded-full border font-mono text-xs transition-colors ${
              isClub
                ? "border-[color:var(--club-line)] text-[color:var(--club-dim)] hover:text-[color:var(--club-accent)]"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            ›
          </button>
        </div>

        {current.cover_art && (
          <img
            key={current.id}
            src={current.cover_art}
            alt={`${current.artist} — ${current.title} cover art`}
            className="h-11 w-11 shrink-0 animate-scale-in rounded-md border object-cover"
            style={{ borderColor: isClub ? "var(--club-line)" : "hsl(var(--border))" }}
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl leading-tight tracking-wide">
            {current.artist} — {current.title}
          </p>
          <p className="truncate font-mono text-xs"
            style={{ color: isClub ? "var(--club-dim)" : undefined }}>
            Released {current.year ?? "—"}
            {current.dj ? (
              <>
                {" · discovered through "}
                <span style={isClub ? { color: "var(--club-accent)" } : undefined}>
                  {displayName(current.dj)}
                </span>
              </>
            ) : null}
          </p>
        </div>
        {queue.length > 0 && (
          <Link
            to="/club"
            className="hidden shrink-0 font-mono text-[11px] text-muted-foreground hover:text-primary sm:block"
            style={isClub ? { color: "var(--club-dim)" } : undefined}
          >
            {queueLabel ? `${queueLabel} · ` : ""}
            {queue.length} up next
          </Link>
        )}

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={toggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
            className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
              isClub
                ? "border-[color:var(--club-line)] text-[color:var(--club-ink)] hover:text-[color:var(--club-accent)]"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {muted || volume === 0 ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : volume < 50 ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>
          <div className="relative flex w-16 items-center sm:w-20">
            <div
              className="h-1 w-full rounded-full bg-border"
              style={
                isClub
                  ? { background: "color-mix(in oklab, var(--club-ink) 20%, transparent)" }
                  : undefined
              }
            />
            <div
              className="pointer-events-none absolute left-0 top-0 h-1 rounded-full bg-primary"
              style={{
                width: `${muted ? 0 : volume}%`,
                ...(isClub ? { background: "var(--club-accent)" } : {}),
              }}
            />
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={muted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
              className="absolute inset-y-0 left-0 w-full cursor-pointer opacity-0"
            />
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3">
        <span
          className="w-10 shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground"
          style={isClub ? { color: "var(--club-dim)" } : undefined}
        >
          {fmt(position)}
        </span>
        <div className="relative flex-1">
          <div
            className="h-1 w-full rounded-full bg-border"
            style={
              isClub
                ? { background: "color-mix(in oklab, var(--club-ink) 20%, transparent)" }
                : undefined
            }
          />
          <div
            className="pointer-events-none absolute left-0 top-0 h-1 rounded-full bg-primary transition-[width] duration-200 ease-linear"
            style={{
              width: `${pct}%`,
              ...(isClub ? { background: "var(--club-accent)" } : {}),
            }}
          />
          <div
            className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-primary shadow-sm transition-[left] duration-200 ease-linear"
            style={{
              left: `${pct}%`,
              ...(isClub
                ? {
                    background: "var(--club-accent)",
                    borderColor: "var(--club-line)",
                    boxShadow: "0 0 14px var(--club-accent)",
                  }
                : {}),
            }}
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
        <span
          className="w-10 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground"
          style={isClub ? { color: "var(--club-dim)" } : undefined}
        >
          {fmt(duration)}
        </span>

      </div>
    </div>
  );
}
