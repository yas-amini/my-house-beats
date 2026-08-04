import { Link } from "@tanstack/react-router";
import { usePlayer } from "@/lib/player";
import { slugify, type Track } from "@/lib/tracks";

type Props = {
  list: Track[];
  view?: "grid" | "list";
  emptyLabel?: string;
  queueLabel?: string;
};

/** Editorial archive presentation: sleeve-first grid or dense index list. */
export function TrackCollection({ list, view = "grid", emptyLabel, queueLabel }: Props) {
  const { current, playList } = usePlayer();

  if (!list.length) {
    return (
      <p className="py-16 text-center font-mono text-xs text-muted-foreground">
        {emptyLabel ?? "Nothing filed under this selection."}
      </p>
    );
  }

  if (view === "list") {
    return (
      <ol className="mt-6 divide-y divide-border border-y border-border">
        {list.map((t, i) => {
          const active = current?.id === t.id;
          return (
            <li key={t.id}>
              <button
                onClick={() => playList(list, i, queueLabel)}
                className={`group grid w-full grid-cols-[2.5rem_2.5rem_1fr_auto] items-center gap-3 px-1 py-2.5 text-left transition-colors sm:grid-cols-[3rem_2.5rem_1fr_10rem_4rem] ${
                  active ? "bg-primary/[0.04]" : "hover:bg-foreground/[0.03]"
                }`}
              >
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                  {String(i + 1).padStart(3, "0")}
                </span>
                {t.cover_art ? (
                  <img
                    src={t.cover_art}
                    alt=""
                    loading="lazy"
                    className={`h-10 w-10 rounded border border-border object-cover transition-transform duration-300 ${
                      active ? "scale-105" : "group-hover:scale-105"
                    }`}
                  />
                ) : (
                  <div className="h-10 w-10 rounded border border-border bg-muted" />
                )}
                <span className="min-w-0">
                  <span
                    className={`block truncate text-sm font-semibold ${active ? "text-primary" : ""}`}
                  >
                    {t.artist}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">{t.title}</span>
                </span>
                <span className="hidden truncate font-mono text-[11px] text-muted-foreground sm:block">
                  via {t.dj}
                </span>
                <span className="text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                  {t.year ?? "—"}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {list.map((t, i) => {
        const active = current?.id === t.id;
        return (
          <article key={t.id} className="group">
            <button
              onClick={() => playList(list, i, queueLabel)}
              className="block w-full text-left"
              aria-label={`Play ${t.artist} — ${t.title}`}
            >
              <div
                className={`relative aspect-square overflow-hidden rounded-lg border transition-[transform,border-color,box-shadow] duration-300 ${
                  active
                    ? "-translate-y-1 border-primary shadow-[0_12px_28px_-18px_var(--color-primary)]"
                    : "border-border group-hover:-translate-y-0.5 group-hover:border-foreground/30"
                }`}
              >
                {t.cover_art ? (
                  <img
                    src={t.cover_art}
                    alt={`${t.artist} — ${t.title} cover art`}
                    loading="lazy"
                    className={`h-full w-full object-cover transition-transform duration-500 ${
                      active ? "scale-[1.04]" : "group-hover:scale-[1.03]"
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
                  <span className="absolute bottom-2 right-2 rounded bg-primary px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary-foreground">
                    on air
                  </span>
                )}
              </div>
              <h3
                className={`mt-3 truncate font-display text-xl leading-tight tracking-wide ${
                  active ? "text-primary" : ""
                }`}
              >
                {t.artist}
              </h3>
              <p className="truncate text-sm text-muted-foreground">{t.title}</p>
            </button>
            <p className="mt-1.5 truncate font-mono text-[11px] text-muted-foreground">
              via{" "}
              <Link
                to="/curator/$slug"
                params={{ slug: slugify(t.dj as string) }}
                className="underline decoration-border underline-offset-2 transition-colors hover:text-primary hover:decoration-primary"
              >
                {t.dj}
              </Link>
            </p>
          </article>
        );
      })}
    </div>
  );
}
