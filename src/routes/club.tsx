import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePlayer } from "@/lib/player";
import { ClubStatus } from "@/components/club/ClubStatus";
import { ClubAtmosphere } from "@/components/club/ClubAtmosphere";
import { DiscoBall, DiscoBallCredit } from "@/components/club/DiscoBall";
import { SignalVisualizer } from "@/components/radio/SignalVisualizer";
import { useArtworkPalette } from "@/lib/palette";
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

export const Route = createFileRoute("/club")({
  head: () => ({
    meta: [
      { title: "Club Mode — My House" },
      {
        name: "description",
        content:
          "Step off the archive floor and into the club: disco ball, 70s haze, a moving spectrum and sets built from the collection itself.",
      },
      { property: "og:title", content: "Club Mode — My House" },
      {
        property: "og:description",
        content: "An immersive listening room for a decade-deep house archive. Pick a set and the club opens.",
      },
    ],
  }),
  component: ClubPage,
});

type SetId = "random" | "era" | "artist" | "curator" | "album" | "surprise";

function fmt(ms: number) {
  if (!ms || ms < 0) return "0:00";
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function ClubPage() {
  const { current, playing, toggle, next, prev, position, duration, seek, queue, playList } =
    usePlayer();
  const [setId, setSetId] = useState<SetId>("random");
  const [handoff, setHandoff] = useState(false);
  const lastId = useRef<number | null>(null);
  const palette = useArtworkPalette(current?.cover_art);

  // Track change = the DJ dropping the next record: announce it across the room.
  useEffect(() => {
    if (!current) return;
    if (lastId.current === current.id) return;
    const first = lastId.current === null;
    lastId.current = current.id;
    if (first) return;
    setHandoff(true);
    const t = window.setTimeout(() => setHandoff(false), 2100);
    return () => window.clearTimeout(t);
  }, [current]);

  const progress = duration > 0 ? Math.min(1, position / duration) : 0;
  const era = current ? eraOf(Number(current.year)) : null;

  const sets: { id: SetId; label: string; hint: string; build: () => Track[] }[] = useMemo(
    () => [
      { id: "random", label: "Random set", hint: "The whole floor, shuffled", build: () => shuffle(tracks) },
      {
        id: "era",
        label: "Same era",
        hint: current ? (eraOf(Number(current.year))?.label ?? "Unknown era") : "Open the club first",
        build: () => (current ? [current, ...shuffle(tracksForEra(current.year, current.id))] : []),
      },
      {
        id: "artist",
        label: "Same artist",
        hint: current ? current.artist : "Open the club first",
        build: () => (current ? [current, ...shuffle(tracksForArtist(current.artist, current.id))] : []),
      },
      {
        id: "curator",
        label: "Same DJ / curator",
        hint: current ? `via ${current.dj}` : "Open the club first",
        build: () =>
          current
            ? [
                current,
                ...shuffle(tracksForCurator(current.dj as string).filter((t) => t.id !== current.id)),
              ]
            : [],
      },
      {
        id: "album",
        label: "Same album",
        hint: current?.album ?? "Open the club first",
        build: () => (current ? [current, ...tracksForAlbum(current.album, current.id)] : []),
      },
      {
        id: "surprise",
        label: "Surprise set",
        hint: "One curator, one era, no warning",
        build: () => {
          const pick = shuffle(tracks)[0];
          if (!pick) return [];
          const e = eraOf(Number(pick.year));
          const list = tracks.filter(
            (t) => t.dj === pick.dj && (!e || (Number(t.year) >= e.start && Number(t.year) <= e.end)),
          );
          return shuffle(list.length > 2 ? list : tracksForCurator(pick.dj as string));
        },
      },
    ],
    [current],
  );

  const start = (s: (typeof sets)[number]) => {
    const list = s.build().filter((t) => t.soundcloud_url);
    if (!list.length) return;
    setSetId(s.id);
    playList(list, 0, s.label);
  };

  return (
    <main className="club relative min-h-screen overflow-hidden">
      <ClubAtmosphere open={playing} palette={palette} />
      <DiscoBall open={playing} />

      {/* ---------- door ---------- */}
      <div className="relative z-10 border-b" style={{ borderColor: "var(--club-line)" }}>
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <ClubStatus open={playing} />
          <p
            className="font-mono text-[10px] uppercase tracking-[0.42em]"
            style={{ color: "var(--club-dim)" }}
          >
            {playing ? "On the floor" : "Between records"}
          </p>
          <p
            className="font-mono text-[10px] uppercase tracking-[0.3em]"
            style={{ color: "var(--club-dim)" }}
          >
            {sets.find((s) => s.id === setId)?.label ?? "Random set"} · {queue.length} to come
          </p>
        </div>
      </div>

      <div className="relative z-10 mx-auto grid max-w-[1500px] gap-14 px-5 pb-28 pt-12 sm:px-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(290px,0.8fr)] lg:gap-20">
        {/* ================= THE FLOOR ================= */}
        <section>
          {current ? (
            <div key={current.id} className="club-enter">
              <p
                className="font-mono text-[10px] uppercase tracking-[0.5em]"
                style={{ color: "var(--club-accent)" }}
              >
                Now playing
              </p>

              {/* oversized, off-axis artwork — the centrepiece of the room */}
              <div className="relative mt-8 sm:-ml-4">
                <div
                  className="relative aspect-square w-full max-w-[min(78vw,620px)] overflow-hidden"
                  style={{
                    borderRadius: 2,
                    boxShadow: playing
                      ? `0 0 120px color-mix(in oklab, ${palette.a} 45%, transparent)`
                      : "0 0 60px rgba(0,0,0,0.5)",
                    transition: "box-shadow 2s ease",
                  }}
                >
                  {current.cover_art ? (
                    <img
                      src={current.cover_art}
                      alt={`${current.artist} — ${current.title} artwork`}
                      className={`h-full w-full object-cover ${playing ? "club-breathe" : ""}`}
                      style={{
                        filter: playing ? "saturate(1.08) contrast(1.04)" : "saturate(0.72) brightness(0.8)",
                        transition: "filter 2s ease",
                      }}
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center font-display text-8xl"
                      style={{ background: "var(--club-bg-2)", color: "var(--club-dim)" }}
                    >
                      {current.artist.slice(0, 1)}
                    </div>
                  )}
                  {/* light raking across the sleeve */}
                  {playing && (
                    <div
                      aria-hidden
                      className="club-rake pointer-events-none absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(105deg, transparent 38%, rgba(255,240,214,0.22) 50%, transparent 62%)",
                      }}
                    />
                  )}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{ boxShadow: "inset 0 0 90px rgba(0,0,0,0.55)" }}
                  />
                </div>

                {/* billing overlaps the artwork — asymmetric, theatrical */}
                <div className="relative z-10 -mt-10 sm:-mt-16 sm:ml-[16%]">
                  <h1
                    className="font-display leading-[0.8] tracking-wide"
                    style={{
                      fontSize: "clamp(3rem, 9vw, 8.5rem)",
                      textShadow: "0 12px 60px rgba(0,0,0,0.6)",
                    }}
                  >
                    {current.artist}
                  </h1>
                  <p
                    className="mt-3 font-mono text-sm uppercase tracking-[0.3em]"
                    style={{ color: "var(--club-ink)" }}
                  >
                    {current.title}
                  </p>

                  <div className="mt-7 flex flex-wrap items-end gap-x-10 gap-y-5">
                    <div>
                      <p
                        className="font-mono text-[9px] uppercase tracking-[0.42em]"
                        style={{ color: "var(--club-dim)" }}
                      >
                        First heard through
                      </p>
                      <Link
                        to="/curator/$slug"
                        params={{ slug: slugify(current.dj as string) }}
                        className="mt-1 block font-display text-3xl leading-none tracking-wide transition-opacity hover:opacity-70"
                        style={{ color: "var(--club-accent)" }}
                      >
                        {current.dj}
                      </Link>
                    </div>
                    <div
                      className="flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-[11px] uppercase tracking-[0.22em]"
                      style={{ color: "var(--club-dim)" }}
                    >
                      <span className="tabular-nums">{current.year ?? "—"}</span>
                      {era && <span>{era.label}</span>}
                      {current.album && <span className="max-w-[16rem] truncate">{current.album}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* ---------- visualization ---------- */}
              <div className="mt-12">
                <div
                  className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.34em]"
                  style={{ color: "var(--club-dim)" }}
                >
                  <span>{playing ? "Sound system" : "Silence"}</span>
                  <span className="tabular-nums">
                    {fmt(position)} / {fmt(duration)}
                  </span>
                </div>
                <div className="mt-2 border-y py-2" style={{ borderColor: "var(--club-line)" }}>
                  <SignalVisualizer
                    playing={playing}
                    progress={progress}
                    seed={current.id % 97}
                    accent={palette.c}
                    onScrub={(r) => duration && seek(r * duration)}
                  />
                </div>
              </div>

              {/* ---------- transport ---------- */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  onClick={prev}
                  aria-label="Previous record"
                  className="h-12 w-12 border font-mono text-lg transition-opacity hover:opacity-70"
                  style={{ borderColor: "var(--club-line)", borderRadius: 999 }}
                >
                  ◀
                </button>
                <button
                  onClick={toggle}
                  className="px-9 py-4 font-mono text-[11px] uppercase tracking-[0.34em] transition-colors"
                  style={{
                    background: playing ? "transparent" : "var(--club-accent)",
                    border: "1px solid var(--club-accent)",
                    borderRadius: 999,
                    color: playing ? "var(--club-ink)" : "#160d08",
                  }}
                >
                  {playing ? "Pause the floor" : "Open the club"}
                </button>
                <button
                  onClick={next}
                  aria-label="Next record"
                  className="h-12 w-12 border font-mono text-lg transition-opacity hover:opacity-70"
                  style={{ borderColor: "var(--club-line)", borderRadius: 999 }}
                >
                  ▶
                </button>
              </div>
            </div>
          ) : (
            <div className="py-6">
              <p
                className="font-mono text-[10px] uppercase tracking-[0.5em]"
                style={{ color: "var(--club-dim)" }}
              >
                Doors closed
              </p>
              <h1 className="mt-5 font-display text-[clamp(3rem,9vw,8rem)] leading-[0.82] tracking-wide">
                The floor
                <br />
                is empty.
              </h1>
              <p className="mt-5 max-w-md text-sm" style={{ color: "var(--club-dim)" }}>
                Pick a set on the right and the club opens — or head back to the{" "}
                <Link to="/" className="underline underline-offset-4" style={{ color: "var(--club-accent)" }}>
                  archive
                </Link>{" "}
                and choose the first record yourself.
              </p>
              <div className="mt-10 border-y py-2 opacity-60" style={{ borderColor: "var(--club-line)" }}>
                <SignalVisualizer playing={false} progress={0} seed={7} height={90} />
              </div>
            </div>
          )}
        </section>

        {/* ================= THE SET ================= */}
        <aside className="lg:border-l lg:pl-10" style={{ borderColor: "var(--club-line)" }}>
          <p
            className="font-mono text-[10px] uppercase tracking-[0.42em]"
            style={{ color: "var(--club-dim)" }}
          >
            Play the club
          </p>
          <ul className="mt-4">
            {sets.map((s, i) => {
              const available = s.build().length > 0;
              const active = setId === s.id;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => start(s)}
                    disabled={!available}
                    className="flex w-full items-baseline gap-4 border-b py-3 text-left transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30"
                    style={{ borderColor: "var(--club-line)" }}
                  >
                    <span
                      className="font-mono text-[10px] tabular-nums"
                      style={{ color: active ? "var(--club-accent)" : "var(--club-dim)" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block font-display text-3xl leading-none tracking-wide"
                        style={{ color: active ? "var(--club-accent)" : "var(--club-ink)" }}
                      >
                        {s.label}
                      </span>
                      <span
                        className="mt-1 block truncate font-mono text-[10px] uppercase tracking-[0.2em]"
                        style={{ color: "var(--club-dim)" }}
                      >
                        {s.hint}
                      </span>
                    </span>
                    {active && (
                      <span
                        className="font-mono text-[9px] uppercase tracking-[0.26em]"
                        style={{ color: "var(--club-accent)" }}
                      >
                        Playing
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* current set: now playing dominates, the rest queues under it */}
          <p
            className="mt-14 font-mono text-[10px] uppercase tracking-[0.42em]"
            style={{ color: "var(--club-dim)" }}
          >
            Current set
          </p>
          {current && (
            <div className="mt-4 border-b pb-5" style={{ borderColor: "var(--club-line)" }}>
              <p
                className="font-mono text-[9px] uppercase tracking-[0.34em]"
                style={{ color: "var(--club-accent)" }}
              >
                Now playing
              </p>
              <p className="mt-2 font-display text-4xl leading-[0.9] tracking-wide">{current.artist}</p>
              <p className="mt-1 text-sm" style={{ color: "var(--club-dim)" }}>
                {current.title}
              </p>
            </div>
          )}
          <p
            className="mt-6 font-mono text-[9px] uppercase tracking-[0.4em]"
            style={{ color: "var(--club-dim)" }}
          >
            Next
          </p>
          <ol className="mt-3">
            {queue.slice(0, 10).map((t, i) => (
              <li
                key={`${t.id}-${i}`}
                className="flex items-baseline gap-4 border-b py-2.5"
                style={{ borderColor: "var(--club-line)" }}
              >
                <span
                  className="font-mono text-[10px] tabular-nums"
                  style={{ color: "var(--club-dim)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{t.artist}</span>
                  <span className="block truncate text-xs" style={{ color: "var(--club-dim)" }}>
                    {t.title}
                  </span>
                </span>
                <span
                  className="font-mono text-[10px] tabular-nums"
                  style={{ color: "var(--club-dim)" }}
                >
                  {t.year ?? "—"}
                </span>
              </li>
            ))}
            {queue.length === 0 && (
              <li
                className="py-4 font-mono text-[10px] uppercase tracking-[0.24em]"
                style={{ color: "var(--club-dim)" }}
              >
                Nothing cued — pick a set.
              </li>
            )}
          </ol>

          <div className="mt-12">
            <DiscoBallCredit />
          </div>
        </aside>
      </div>

      {/* ---------- record change ---------- */}
      {handoff && current && (
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center"
        >
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 50% 45%, color-mix(in oklab, ${palette.a} 45%, transparent), var(--club-bg) 70%)`,
              opacity: 0.85,
              animation: "club-handoff 2.1s ease-in-out forwards",
            }}
          />
          <div className="club-handoff relative text-center">
            <p
              className="font-mono text-[11px] uppercase tracking-[0.5em]"
              style={{ color: "var(--club-accent)" }}
            >
              Next up
            </p>
            <p className="mt-4 font-display text-[clamp(2.5rem,7vw,6rem)] leading-none tracking-wide">
              {current.artist}
            </p>
            <p
              className="mt-2 font-mono text-xs uppercase tracking-[0.3em]"
              style={{ color: "var(--club-dim)" }}
            >
              {current.title}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
