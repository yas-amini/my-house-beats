import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { usePlayer } from "@/lib/player";
import {
  shuffle,
  slugify,
  tracks,
  tracksForAlbum,
  tracksForArtist,
  tracksForCurator,
  tracksForEra,
  eraOf,
  type Track,
} from "@/lib/tracks";

export const Route = createFileRoute("/radio")({
  head: () => ({
    meta: [
      { title: "Radio — My House Archive" },
      {
        name: "description",
        content:
          "A personal radio station built from the archive: shuffle everything, stay with one artist, one curator, one era or one album.",
      },
      { property: "og:title", content: "Radio — My House Archive" },
      {
        property: "og:description",
        content: "Stop browsing and listen: stations generated from the archive's own data.",
      },
    ],
  }),
  component: RadioPage,
});

type ModeId = "random" | "artist" | "curator" | "era" | "album" | "surprise";

function fmt(ms: number) {
  if (!ms || ms < 0) return "0:00";
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** Deterministic pseudo-waveform so each record keeps its own shape. */
function waveform(seed: number) {
  const bars: number[] = [];
  let x = seed * 9301 + 49297;
  for (let i = 0; i < 64; i++) {
    x = (x * 9301 + 49297) % 233280;
    const base = 0.35 + 0.65 * Math.abs(Math.sin(i / 5 + seed));
    bars.push(Math.max(0.12, Math.min(1, base * (0.6 + (x / 233280) * 0.8))));
  }
  return bars;
}

function RadioPage() {
  const { current, playing, toggle, next, prev, position, duration, seek, queue, playList } =
    usePlayer();
  const [mode, setMode] = useState<ModeId>("random");

  const seed = current?.id ?? 1;
  const bars = useMemo(() => waveform(seed), [seed]);
  const pct = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;

  const modes: { id: ModeId; label: string; hint: string; build: () => Track[] }[] = [
    {
      id: "random",
      label: "Random",
      hint: "The whole archive, shuffled",
      build: () => shuffle(tracks),
    },
    {
      id: "artist",
      label: "Same artist",
      hint: current ? current.artist : "Pick a track first",
      build: () =>
        current ? [current, ...shuffle(tracksForArtist(current.artist, current.id))] : [],
    },
    {
      id: "curator",
      label: "Same curator",
      hint: current ? `via ${current.dj}` : "Pick a track first",
      build: () =>
        current
          ? [current, ...shuffle(tracksForCurator(current.dj as string).filter((t) => t.id !== current.id))]
          : [],
    },
    {
      id: "era",
      label: "Same era",
      hint: current ? (eraOf(Number(current.year))?.label ?? "Unknown era") : "Pick a track first",
      build: () => (current ? [current, ...shuffle(tracksForEra(current.year, current.id))] : []),
    },
    {
      id: "album",
      label: "Same album",
      hint: current?.album ?? "Pick a track first",
      build: () => (current ? [current, ...tracksForAlbum(current.album, current.id)] : []),
    },
    {
      id: "surprise",
      label: "Surprise me",
      hint: "One curator, one era, no warning",
      build: () => {
        const pool = shuffle(tracks);
        const pick = pool[0];
        if (!pick) return [];
        const era = eraOf(Number(pick.year));
        const set = tracks.filter(
          (t) =>
            t.dj === pick.dj &&
            (!era || (Number(t.year) >= era.start && Number(t.year) <= era.end)),
        );
        return shuffle(set.length > 2 ? set : tracksForCurator(pick.dj as string));
      },
    },
  ];

  const start = (m: (typeof modes)[number]) => {
    const list = m.build().filter((t) => t.soundcloud_url);
    if (!list.length) return;
    setMode(m.id);
    playList(list, 0, m.label);
  };

  return (
    <main className="mx-auto max-w-6xl px-5 pb-40 pt-10">
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
        Radio
      </p>
      <h1 className="mt-3 max-w-2xl font-display text-5xl leading-[0.92] tracking-wide sm:text-7xl">
        Stop browsing.
        <br />
        Let the archive play.
      </h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <section>
          {current ? (
            <>
              <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-2xl border border-border">
                {current.cover_art ? (
                  <img
                    key={current.id}
                    src={current.cover_art}
                    alt={`${current.artist} — ${current.title} cover art`}
                    className="h-full w-full animate-fade-in object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted font-display text-6xl tracking-wide text-muted-foreground">
                    {current.artist.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <h2 className="mt-6 font-display text-4xl leading-none tracking-wide">
                {current.artist}
              </h2>
              <p className="mt-1 text-lg text-muted-foreground">{current.title}</p>

              <dl className="mt-5 grid max-w-md grid-cols-2 gap-y-3 font-mono text-[11px]">
                <dt className="uppercase tracking-wider text-muted-foreground">Released</dt>
                <dd className="tabular-nums">{current.year ?? "—"}</dd>
                <dt className="uppercase tracking-wider text-muted-foreground">
                  Discovered through
                </dt>
                <dd>
                  <Link
                    to="/curator/$slug"
                    params={{ slug: slugify(current.dj as string) }}
                    className="text-primary underline underline-offset-4"
                  >
                    {current.dj}
                  </Link>
                </dd>
                {current.album && (
                  <>
                    <dt className="uppercase tracking-wider text-muted-foreground">Album</dt>
                    <dd className="truncate">{current.album}</dd>
                  </>
                )}
              </dl>

              <div className="mt-6 max-w-md">
                <button
                  onClick={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    if (duration) seek(((e.clientX - r.left) / r.width) * duration);
                  }}
                  aria-label="Seek within the current track"
                  className="flex h-16 w-full items-end gap-[2px]"
                >
                  {bars.map((b, i) => {
                    const played = (i / bars.length) * 100 < pct;
                    return (
                      <span
                        key={i}
                        style={{
                          height: `${b * 100}%`,
                          transitionDelay: `${(i % 8) * 20}ms`,
                        }}
                        className={`flex-1 rounded-full transition-[background-color,opacity] duration-300 ${
                          played ? "bg-primary" : "bg-foreground/15"
                        } ${playing && played ? "opacity-100" : "opacity-80"}`}
                      />
                    );
                  })}
                </button>
                <div className="mt-2 flex justify-between font-mono text-[11px] tabular-nums text-muted-foreground">
                  <span>{fmt(position)}</span>
                  <span>{fmt(duration)}</span>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={prev}
                  aria-label="Previous track"
                  className="h-10 w-10 rounded-full border border-border font-mono text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  ‹
                </button>
                <button
                  onClick={toggle}
                  className="rounded-full bg-primary px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-primary-foreground transition-transform hover:scale-[1.03]"
                >
                  {playing ? "Pause" : "Play"}
                </button>
                <button
                  onClick={next}
                  aria-label="Next track"
                  className="h-10 w-10 rounded-full border border-border font-mono text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  ›
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-10">
              <p className="font-display text-3xl tracking-wide">Nothing on air yet</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Pick a station on the right, or open the{" "}
                <Link to="/" className="text-primary underline underline-offset-4">
                  archive
                </Link>{" "}
                and start from a record.
              </p>
            </div>
          )}
        </section>

        <section>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Stations
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {modes.map((m) => {
              const available = m.build().length > 0;
              return (
                <button
                  key={m.id}
                  onClick={() => start(m)}
                  disabled={!available}
                  className={`rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    mode === m.id && available
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-foreground/40"
                  }`}
                >
                  <p className="font-display text-2xl leading-none tracking-wide">{m.label}</p>
                  <p className="mt-1.5 truncate font-mono text-[11px] text-muted-foreground">
                    {m.hint}
                  </p>
                </button>
              );
            })}
          </div>

          <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Up next <span className="tabular-nums">{queue.length}</span>
          </p>
          <ol className="mt-3 divide-y divide-border border-y border-border">
            {queue.slice(0, 12).map((t) => (
              <li key={t.id} className="flex animate-fade-in items-center gap-3 py-2.5">
                {t.cover_art ? (
                  <img
                    src={t.cover_art}
                    alt=""
                    loading="lazy"
                    className="h-9 w-9 rounded border border-border object-cover"
                  />
                ) : (
                  <div className="h-9 w-9 rounded border border-border bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{t.artist}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.title}</p>
                </div>
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  {t.year ?? "—"}
                </span>
              </li>
            ))}
            {queue.length === 0 && (
              <li className="py-6 font-mono text-[11px] text-muted-foreground">
                The queue is empty — start a station.
              </li>
            )}
          </ol>
        </section>
      </div>
    </main>
  );
}
