import { useEffect, useMemo, useRef, useState } from "react";
import { usePlayer } from "@/lib/player";
import { displayName, type Track } from "@/lib/tracks";

type Props = {
  list: Track[];
  view?: "grid" | "list";
  emptyLabel?: string;
  queueLabel?: string;
};

/** How many records are painted before the reader scrolls for more. */
const PAGE = 60;

/**
 * Renders long selections in slices so an 800-record filter never blocks the
 * main thread; a sentinel at the bottom of the page reveals the next slice.
 */
function useWindow(total: number) {
  const [count, setCount] = useState(() => Math.min(PAGE, total));
  const sentinel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCount(Math.min(PAGE, total));
  }, [total]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || count >= total) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setCount((c) => Math.min(c + PAGE, total));
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [count, total]);

  return { count, sentinel, done: count >= total };
}

/** Three bars that move only while the record is actually playing. */
function NowPlaying({ playing }: { playing: boolean }) {
  return (
    <span
      className="flex items-end gap-[2px]"
      aria-label={playing ? "Now playing" : "Paused"}
      role="img"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`w-[2px] rounded-full bg-current ${playing ? "eq-bar" : ""}`}
          style={{ height: playing ? 10 : 4, animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

/** Editorial archive presentation: sleeve-first grid or dense index list. */
export function TrackCollection({ list, view = "grid", emptyLabel, queueLabel }: Props) {
  const { current, playing, playList } = usePlayer();
  const { count, sentinel, done } = useWindow(list.length);
  const slice = useMemo(() => list.slice(0, count), [list, count]);

  if (!list.length) {
    return (
      <p className="py-16 text-center font-mono text-xs text-muted-foreground">
        {emptyLabel ?? "Nothing filed under this selection."}
      </p>
    );
  }

  const footer = (
    <div ref={sentinel} className="py-8 text-center font-mono text-[11px] text-muted-foreground">
      {done ? `End of selection · ${list.length} records` : "Loading more records…"}
    </div>
  );

  if (view === "list") {
    return (
      <>
        <ol className="mt-6 divide-y divide-border border-y border-border">
          {slice.map((t, i) => {
            const active = current?.id === t.id;
            return (
              <li key={t.id}>
                <button
                  onClick={() => playList(list, i, queueLabel)}
                  aria-pressed={active}
                  aria-label={`Play ${t.artist} — ${t.title}`}
                  className={`group grid w-full grid-cols-[2.5rem_2.5rem_1fr_auto] items-center gap-3 px-1 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:grid-cols-[3rem_2.5rem_1fr_10rem_4rem] ${
                    active ? "bg-primary/5" : "hover:bg-foreground/[0.03]"
                  }`}
                >
                  <span className="flex h-4 items-center justify-start font-mono text-[10px] tabular-nums text-muted-foreground">
                    {active ? (
                      <span className="text-primary">
                        <NowPlaying playing={playing} />
                      </span>
                    ) : (
                      String(i + 1).padStart(3, "0")
                    )}
                  </span>
                  {t.cover_art ? (
                    <img
                      src={t.cover_art}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      width={40}
                      height={40}
                      className={`h-10 w-10 rounded border border-border object-cover transition-transform duration-300 ${
                        active ? "scale-[1.04]" : "group-hover:scale-[1.03]"
                      }`}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded border border-border bg-muted" />
                  )}
                  <span className="min-w-0">
                    <span
                      className={`arc-artist block truncate text-sm font-semibold ${active ? "text-primary" : ""}`}
                    >
                      {t.artist}
                    </span>
                    <span className="arc-title block truncate text-sm text-muted-foreground">
                      {t.title}
                    </span>
                  </span>
                  <span className="arc-meta hidden truncate font-mono text-xs text-muted-foreground sm:block">
                    {t.dj ? `via ${displayName(t.dj)}` : ""}
                  </span>
                  <span className="arc-meta text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                    {t.year ?? "—"}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        {footer}
      </>
    );
  }

  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {slice.map((t, i) => {
          const active = current?.id === t.id;
          return (
            <article key={t.id} className="group">
              <button
                onClick={() => playList(list, i, queueLabel)}
                className="block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                aria-pressed={active}
                aria-label={`Play ${t.artist} — ${t.title}`}
              >
                <div
                  className={`relative aspect-square overflow-hidden rounded-lg border transition-[border-color] duration-300 ${
                    active ? "border-primary" : "border-border group-hover:border-foreground/30"
                  }`}
                >
                  {t.cover_art ? (
                    <img
                      src={t.cover_art}
                      alt={`${t.artist} — ${t.title} cover art`}
                      loading="lazy"
                      decoding="async"
                      className={`h-full w-full object-cover transition-transform duration-500 ${
                        active ? "scale-[1.05]" : "group-hover:scale-[1.03]"
                      }`}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted font-display text-3xl tracking-wide text-muted-foreground">
                      {t.artist.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute left-2 top-2 rounded bg-background/85 px-1.5 py-0.5 font-mono text-[10px] tabular-nums backdrop-blur">
                    {t.year ?? "—"}
                  </span>
                  {active && (
                    <span className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded bg-primary px-1.5 py-1 font-mono text-[10px] uppercase tracking-wider text-primary-foreground">
                      <NowPlaying playing={playing} />
                      {playing ? "on air" : "cued"}
                    </span>
                  )}
                </div>
                <h3
                  className={`arc-artist mt-3 truncate font-display text-xl leading-tight tracking-wide ${
                    active ? "text-primary" : ""
                  }`}
                >
                  {t.artist}
                </h3>
                <p className="arc-title truncate text-sm text-muted-foreground">{t.title}</p>
              </button>
              {t.dj && (
                <p className="arc-meta mt-1.5 truncate font-mono text-xs text-muted-foreground">
                  via {displayName(t.dj)}
                </p>
              )}
            </article>
          );
        })}
      </div>
      {footer}
    </>
  );
}
