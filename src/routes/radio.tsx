import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePlayer } from "@/lib/player";
import { OnAirLamp } from "@/components/radio/OnAirLamp";
import { SignalVisualizer } from "@/components/radio/SignalVisualizer";
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
      { title: "Archive Radio — Live from My House" },
      {
        name: "description",
        content:
          "A live broadcast mode for a personal house archive: on-air signal, moving spectrum and stations built from the record data itself.",
      },
      { property: "og:title", content: "Archive Radio — Live from My House" },
      {
        property: "og:description",
        content: "Switch the station on and let the archive transmit: random, era, artist, curator or album.",
      },
    ],
  }),
  component: RadioPage,
});

type ModeId = "random" | "era" | "artist" | "curator" | "album" | "surprise";

function fmt(ms: number) {
  if (!ms || ms < 0) return "0:00";
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** Fake but stable dial frequency, derived from the record itself. */
function frequencyOf(t: Track | null) {
  if (!t) return "—.—";
  const y = Number(t.year) || 2000;
  const f = 87.5 + ((y * 37 + t.id * 13) % 205) / 10;
  return f.toFixed(1);
}

function RadioPage() {
  const { current, playing, toggle, next, prev, position, duration, seek, queue, playList } =
    usePlayer();
  const [mode, setMode] = useState<ModeId>("random");
  const [handoff, setHandoff] = useState(false);
  const lastId = useRef<number | null>(null);

  // Station handoff: announce every time the transmission changes record.
  useEffect(() => {
    if (!current) return;
    if (lastId.current === current.id) return;
    const first = lastId.current === null;
    lastId.current = current.id;
    if (first) return;
    setHandoff(true);
    const t = window.setTimeout(() => setHandoff(false), 1900);
    return () => window.clearTimeout(t);
  }, [current]);

  const progress = duration > 0 ? Math.min(1, position / duration) : 0;
  const era = current ? eraOf(Number(current.year)) : null;

  const modes: { id: ModeId; label: string; hint: string; build: () => Track[] }[] = useMemo(
    () => [
      { id: "random", label: "Random", hint: "The whole archive, shuffled", build: () => shuffle(tracks) },
      {
        id: "era",
        label: "Same era",
        hint: current ? (eraOf(Number(current.year))?.label ?? "Unknown era") : "Start the station first",
        build: () => (current ? [current, ...shuffle(tracksForEra(current.year, current.id))] : []),
      },
      {
        id: "artist",
        label: "Same artist",
        hint: current ? current.artist : "Start the station first",
        build: () => (current ? [current, ...shuffle(tracksForArtist(current.artist, current.id))] : []),
      },
      {
        id: "curator",
        label: "Same curator",
        hint: current ? `via ${current.dj}` : "Start the station first",
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
        hint: current?.album ?? "Start the station first",
        build: () => (current ? [current, ...tracksForAlbum(current.album, current.id)] : []),
      },
      {
        id: "surprise",
        label: "Surprise me",
        hint: "One curator, one era, no warning",
        build: () => {
          const pick = shuffle(tracks)[0];
          if (!pick) return [];
          const e = eraOf(Number(pick.year));
          const set = tracks.filter(
            (t) => t.dj === pick.dj && (!e || (Number(t.year) >= e.start && Number(t.year) <= e.end)),
          );
          return shuffle(set.length > 2 ? set : tracksForCurator(pick.dj as string));
        },
      },
    ],
    [current],
  );

  const start = (m: (typeof modes)[number]) => {
    const list = m.build().filter((t) => t.soundcloud_url);
    if (!list.length) return;
    setMode(m.id);
    playList(list, 0, m.label);
  };

  const tickerText = current
    ? `${current.artist} — ${current.title} · ${current.year ?? "unknown year"} · discovered through ${current.dj} · `
    : "Archive radio · 627 records · 1987–2026 · pick a station and the transmission begins · ";

  return (
    <main className="studio relative min-h-screen overflow-hidden">
      {/* ---------- atmosphere ---------- */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className={playing ? "studio-field-a absolute -left-1/4 top-[-20%] h-[80vh] w-[80vw]" : "absolute -left-1/4 top-[-20%] h-[80vh] w-[80vw]"}
          style={{
            background: "radial-gradient(circle, var(--studio-signal) 0%, transparent 62%)",
            opacity: playing ? 0.26 : 0.1,
            filter: "blur(80px)",
            transition: "opacity 1.6s ease",
          }}
        />
        <div
          className={playing ? "studio-field-b absolute -right-1/4 bottom-[-25%] h-[80vh] w-[80vw]" : "absolute -right-1/4 bottom-[-25%] h-[80vh] w-[80vw]"}
          style={{
            background: "radial-gradient(circle, var(--studio-bg-2) 0%, transparent 60%)",
            opacity: playing ? 0.85 : 0.45,
            filter: "blur(90px)",
            transition: "opacity 1.6s ease",
          }}
        />
        {current?.cover_art && (
          <img
            key={`glow-${current.id}`}
            src={current.cover_art}
            alt=""
            className={playing ? "studio-field-a absolute left-1/2 top-1/3 h-[70vh] w-[70vh] -translate-x-1/2 object-cover" : "absolute left-1/2 top-1/3 h-[70vh] w-[70vh] -translate-x-1/2 object-cover"}
            style={{
              filter: "blur(120px) saturate(1.6)",
              opacity: playing ? 0.5 : 0.22,
              transition: "opacity 2s ease",
            }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E\")",
            opacity: 0.16,
            mixBlendMode: "overlay",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0 3px, rgba(0,0,0,.22) 3px 4px)",
            opacity: playing ? 0.35 : 0.15,
            transition: "opacity 1.2s ease",
          }}
        />
      </div>

      {/* ---------- transmission masthead ---------- */}
      <div className="relative z-10 border-b" style={{ borderColor: "var(--studio-line)" }}>
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <OnAirLamp live={playing} />
          <p
            className="font-mono text-[10px] uppercase tracking-[0.42em]"
            style={{ color: "var(--studio-dim)" }}
          >
            Live from the archive
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl leading-none tracking-wide tabular-nums">
              {frequencyOf(current)}
            </span>
            <span
              className="font-mono text-[10px] uppercase tracking-[0.3em]"
              style={{ color: "var(--studio-dim)" }}
            >
              FM · {mode}
            </span>
          </div>
        </div>
      </div>

      {/* ---------- ticker ---------- */}
      <div
        className="relative z-10 overflow-hidden border-b py-2"
        style={{ borderColor: "var(--studio-line)" }}
      >
        <div className={`flex w-max ${playing ? "studio-ticker" : ""}`}>
          {[0, 1].map((k) => (
            <span
              key={k}
              className="whitespace-nowrap px-2 font-mono text-[11px] uppercase tracking-[0.28em]"
              style={{ color: "var(--studio-dim)" }}
            >
              {tickerText.repeat(4)}
            </span>
          ))}
        </div>
      </div>

      <div className="relative z-10 mx-auto grid max-w-[1500px] gap-12 px-5 pb-24 pt-10 sm:px-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)] lg:gap-16">
        {/* ================= CURRENT TRANSMISSION ================= */}
        <section>
          {current ? (
            <div key={current.id} className="studio-tune-in">
              <p
                className="font-mono text-[10px] uppercase tracking-[0.5em]"
                style={{ color: "var(--studio-signal)" }}
              >
                {handoff ? "Now broadcasting" : "Current transmission"}
              </p>

              <div className="mt-6 grid gap-8 sm:grid-cols-[minmax(0,300px)_minmax(0,1fr)] sm:items-end">
                {/* artwork: anchored, breathing, framed by a signal sweep */}
                <div
                  className="relative aspect-square w-full overflow-hidden border"
                  style={{ borderColor: "var(--studio-line)", borderRadius: 4 }}
                >
                  {current.cover_art ? (
                    <img
                      src={current.cover_art}
                      alt={`${current.artist} — ${current.title} cover art`}
                      className={`h-full w-full object-cover ${playing ? "studio-breathe" : ""}`}
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center font-display text-7xl tracking-wide"
                      style={{ background: "var(--studio-bg-2)", color: "var(--studio-dim)" }}
                    >
                      {current.artist.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  {playing && (
                    <>
                      <span
                        aria-hidden
                        className="studio-sweep pointer-events-none absolute inset-x-0 h-1/3"
                        style={{
                          background:
                            "linear-gradient(to bottom, transparent, oklch(1 0 0 / 18%), transparent)",
                        }}
                      />
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        style={{ boxShadow: "inset 0 0 90px oklch(0 0 0 / 45%)" }}
                      />
                    </>
                  )}
                  <span
                    className="absolute left-0 top-0 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.28em]"
                    style={{ background: "var(--studio-signal)", color: "var(--studio-ink)" }}
                  >
                    {playing ? "Transmitting" : "Standby"}
                  </span>
                </div>

                {/* oversized editorial billing */}
                <div className="min-w-0">
                  <h1 className="font-display text-[clamp(3rem,8vw,7.5rem)] leading-[0.82] tracking-wide">
                    {current.artist}
                  </h1>
                  <p className="mt-4 text-balance text-xl sm:text-2xl" style={{ color: "var(--studio-ink)" }}>
                    {current.title}
                  </p>
                  <div
                    className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.22em]"
                    style={{ color: "var(--studio-dim)" }}
                  >
                    <span className="tabular-nums">{current.year ?? "—"}</span>
                    {era && <span>{era.label}</span>}
                    <span>
                      via{" "}
                      <Link
                        to="/curator/$slug"
                        params={{ slug: slugify(current.dj as string) }}
                        className="underline underline-offset-4"
                        style={{ color: "var(--studio-signal)" }}
                      >
                        {current.dj}
                      </Link>
                    </span>
                    {current.album && <span className="truncate">{current.album}</span>}
                  </div>
                </div>
              </div>

              {/* ---------- signal ---------- */}
              <div className="mt-10">
                <div
                  className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.34em]"
                  style={{ color: "var(--studio-dim)" }}
                >
                  <span>Signal</span>
                  <span className="tabular-nums">
                    {fmt(position)} / {fmt(duration)}
                  </span>
                </div>
                <div className="mt-2 border-y py-2" style={{ borderColor: "var(--studio-line)" }}>
                  <SignalVisualizer
                    playing={playing}
                    progress={progress}
                    seed={current.id % 97}
                    onScrub={(r) => duration && seek(r * duration)}
                  />
                </div>
              </div>

              {/* ---------- transport ---------- */}
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <button
                  onClick={prev}
                  aria-label="Previous transmission"
                  className="h-12 w-12 border font-mono text-lg transition-colors"
                  style={{ borderColor: "var(--studio-line)", borderRadius: 999 }}
                >
                  ‹
                </button>
                <button
                  onClick={toggle}
                  className="group relative flex items-center gap-3 px-8 py-4 font-mono text-[11px] uppercase tracking-[0.34em]"
                  style={{
                    background: playing ? "transparent" : "var(--studio-signal)",
                    border: "1px solid var(--studio-signal)",
                    borderRadius: 999,
                    color: "var(--studio-ink)",
                  }}
                >
                  {playing ? "Cut transmission" : "Go on air"}
                </button>
                <button
                  onClick={next}
                  aria-label="Next transmission"
                  className="h-12 w-12 border font-mono text-lg transition-colors"
                  style={{ borderColor: "var(--studio-line)", borderRadius: 999 }}
                >
                  ›
                </button>
                <span
                  className="font-mono text-[10px] uppercase tracking-[0.3em]"
                  style={{ color: "var(--studio-dim)" }}
                >
                  {queue.length} in the schedule
                </span>
              </div>
            </div>
          ) : (
            <div className="py-6">
              <p
                className="font-mono text-[10px] uppercase tracking-[0.5em]"
                style={{ color: "var(--studio-dim)" }}
              >
                Carrier only
              </p>
              <h1 className="mt-5 font-display text-[clamp(3rem,9vw,8rem)] leading-[0.82] tracking-wide">
                The station
                <br />
                is silent.
              </h1>
              <p className="mt-5 max-w-md text-sm" style={{ color: "var(--studio-dim)" }}>
                Pick a station on the right and the archive starts transmitting — or open the{" "}
                <Link to="/" className="underline underline-offset-4" style={{ color: "var(--studio-signal)" }}>
                  archive
                </Link>{" "}
                and put a record on yourself.
              </p>
              <div className="mt-10 border-y py-2 opacity-60" style={{ borderColor: "var(--studio-line)" }}>
                <SignalVisualizer playing={false} progress={0} seed={7} height={90} />
              </div>
            </div>
          )}
        </section>

        {/* ================= STATIONS + SCHEDULE ================= */}
        <aside className="lg:border-l lg:pl-10" style={{ borderColor: "var(--studio-line)" }}>
          <p
            className="font-mono text-[10px] uppercase tracking-[0.42em]"
            style={{ color: "var(--studio-dim)" }}
          >
            Tune the dial
          </p>
          <ul className="mt-4">
            {modes.map((m, i) => {
              const available = m.build().length > 0;
              const active = mode === m.id;
              return (
                <li key={m.id}>
                  <button
                    onClick={() => start(m)}
                    disabled={!available}
                    className="group flex w-full items-baseline gap-4 border-b py-3 text-left transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
                    style={{ borderColor: "var(--studio-line)" }}
                  >
                    <span
                      className="font-mono text-[10px] tabular-nums"
                      style={{ color: active ? "var(--studio-signal)" : "var(--studio-dim)" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block font-display text-3xl leading-none tracking-wide transition-colors"
                        style={{ color: active ? "var(--studio-signal)" : "var(--studio-ink)" }}
                      >
                        {m.label}
                      </span>
                      <span
                        className="mt-1 block truncate font-mono text-[10px] uppercase tracking-[0.2em]"
                        style={{ color: "var(--studio-dim)" }}
                      >
                        {m.hint}
                      </span>
                    </span>
                    {active && (
                      <span
                        className="font-mono text-[9px] uppercase tracking-[0.26em]"
                        style={{ color: "var(--studio-signal)" }}
                      >
                        Tuned
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <p
            className="mt-12 font-mono text-[10px] uppercase tracking-[0.42em]"
            style={{ color: "var(--studio-dim)" }}
          >
            Up next
          </p>
          <ol className="mt-4">
            {queue.slice(0, 10).map((t, i) => (
              <li
                key={`${t.id}-${i}`}
                className="flex items-baseline gap-4 border-b py-2.5"
                style={{ borderColor: "var(--studio-line)" }}
              >
                <span
                  className="font-mono text-[10px] tabular-nums"
                  style={{ color: "var(--studio-dim)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{t.artist}</span>
                  <span className="block truncate text-xs" style={{ color: "var(--studio-dim)" }}>
                    {t.title}
                  </span>
                </span>
                <span
                  className="font-mono text-[10px] tabular-nums"
                  style={{ color: "var(--studio-dim)" }}
                >
                  {t.year ?? "—"}
                </span>
              </li>
            ))}
            {queue.length === 0 && (
              <li className="py-4 font-mono text-[10px] uppercase tracking-[0.24em]" style={{ color: "var(--studio-dim)" }}>
                Schedule empty — tune the dial.
              </li>
            )}
          </ol>
        </aside>
      </div>

      {/* ---------- station handoff ---------- */}
      {handoff && current && (
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center"
        >
          <div
            className="absolute inset-0"
            style={{ background: "var(--studio-bg)", opacity: 0.72, animation: "studio-handoff 1.9s ease-in-out forwards" }}
          />
          <div className="studio-handoff relative text-center">
            <p
              className="font-mono text-[11px] uppercase tracking-[0.5em]"
              style={{ color: "var(--studio-signal)" }}
            >
              Now broadcasting
            </p>
            <p className="mt-4 font-display text-[clamp(2.5rem,7vw,6rem)] leading-none tracking-wide">
              {current.artist}
            </p>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.3em]" style={{ color: "var(--studio-dim)" }}>
              {current.title}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
