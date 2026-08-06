import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePlayer } from "@/lib/player";
import { ClubStatus } from "@/components/club/ClubStatus";
import { ClubAtmosphere } from "@/components/club/ClubAtmosphere";
import { DiscoBall } from "@/components/club/DiscoBall";
import { StarFilter } from "@/components/club/StarFilter";
import { useArtworkPalette } from "@/lib/palette";
import { floors, shuffle, tracksForFloor, type Floor, type FloorSource } from "@/lib/tracks";

export const Route = createFileRoute("/club")({
  head: () => ({
    meta: [
      { title: "The Club — Main, Live & Battle Floors" },
      {
        name: "description",
        content:
          "Three dance floors in one archive: the Main Floor shuffles every record, the Live Floor holds TikTok live DJ discoveries, and the Battle Floor collects playlists built at dance battles.",
      },
      { property: "og:title", content: "The Club — Main, Live & Battle Floors" },
      {
        property: "og:description",
        content:
          "Step onto the main floor, follow a DJ on the live floor, or dig through the battle playlists.",
      },
    ],
  }),
  component: ClubPage,
});

function ClubPage() {
  const { current, status, blocked, playList, retry } = usePlayer();
  const [floorId, setFloorId] = useState("main");
  const [sourceName, setSourceName] = useState<string | null>(null);
  const palette = useArtworkPalette(current?.cover_art);

  const floor = useMemo(() => floors.find((f) => f.id === floorId) ?? floors[0]!, [floorId]);

  /**
   * Start playback synchronously inside the tap handler — mobile browsers only
   * allow audio that begins as a direct result of a user gesture.
   */
  const start = (f: Floor, source?: FloorSource | null) => {
    setFloorId(f.id);
    setSourceName(source?.name ?? null);
    playList(shuffle(tracksForFloor(f, source?.name)), 0, source?.display ?? f.name);
  };

  // The room is already playing when you walk in; if the browser blocks it,
  // the transport surfaces a tap-to-play prompt.
  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    playList(shuffle(tracksForFloor(floor)), 0, floor.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = status === "playing";
  const activeSource = floor.sources.find((s) => s.name === sourceName) ?? null;

  return (
    <main className="club relative min-h-[calc(100vh-57px)] overflow-hidden">
      <ClubAtmosphere open={open} palette={palette} />
      <DiscoBall open={open} />
      <StarFilter open={open} palette={palette} />

      <div className="relative z-10 mx-auto grid max-w-6xl gap-10 px-5 pb-40 pt-12 md:grid-cols-[240px_1fr] md:gap-14 md:pt-16">
        <FloorNav
          floors={floors}
          active={floor}
          activeSource={activeSource}
          onPick={start}
        />

        <section className="min-w-0">
          <div className="flex flex-wrap items-center gap-4">
            <ClubStatus open={open} />
            <span className="font-mono text-[11px] tracking-widest" style={{ color: "var(--club-dim)" }}>
              {activeSource ? `${floor.name} · ${activeSource.display}` : floor.name}
            </span>
          </div>

          <p className="mt-4 max-w-xl text-sm leading-relaxed" style={{ color: "var(--club-dim)" }}>
            {floor.description}
          </p>

          {current ? (
            <article key={current.id} className="club-enter mt-10 max-w-xl">
              <div
                className={`relative aspect-square w-full max-w-[380px] overflow-hidden ${open ? "club-breathe" : ""}`}
                style={{
                  borderRadius: 6,
                  boxShadow: `0 30px 90px -30px color-mix(in oklab, ${palette.a} 70%, transparent)`,
                }}
              >
                {current.cover_art ? (
                  <img
                    src={current.cover_art}
                    alt={`${current.artist} — ${current.title} cover art`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full" style={{ background: "var(--club-bg-2)" }} />
                )}
              </div>

              <h1
                className="mt-8 text-[clamp(2rem,5vw,3.25rem)] leading-[1.05]"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "0.01em" }}
              >
                {current.title}
              </h1>
              <p className="mt-2 text-lg" style={{ color: "var(--club-ink)" }}>
                {current.artist}
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--club-dim)" }}>
                {[current.album, current.year].filter(Boolean).join(" · ")}
              </p>

              {/* transport lives in the global PlayerBar */}
              {blocked && (
                <button
                  onClick={retry}
                  className="mt-9 w-full max-w-md border px-4 py-3 text-left text-sm"
                  style={{ borderColor: "var(--club-line)", borderRadius: 6, color: "var(--club-ink)" }}
                >
                  {status === "error"
                    ? "This record wouldn't load. Tap to try again, or skip to the next one."
                    : "Tap here to feel the beat"}
                </button>
              )}
            </article>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function FloorNav({
  floors: list,
  active,
  activeSource,
  onPick,
}: {
  floors: Floor[];
  active: Floor;
  activeSource: FloorSource | null;
  onPick: (floor: Floor, source?: FloorSource | null) => void;
}) {
  return (
    <nav className="min-w-0 md:sticky md:top-24 md:self-start">
      <p className="mb-4 font-mono text-[11px] tracking-widest" style={{ color: "var(--club-dim)" }}>
        The Club
      </p>
      <ul className="space-y-6">
        {list.map((f) => {
          const on = f.id === active.id;
          return (
            <li key={f.id}>
              <button
                onClick={() => onPick(f)}
                className="text-left transition-opacity"
                style={{ opacity: on ? 1 : 0.55 }}
              >
                <span
                  className="block text-[19px] leading-tight"
                  style={{
                    fontFamily: "var(--font-display)",
                    letterSpacing: "0.03em",
                    color: on && !activeSource ? "var(--club-accent)" : undefined,
                  }}
                >
                  {f.name}
                </span>
                <span className="block text-xs" style={{ color: "var(--club-dim)" }}>
                  {f.tagline} · {f.count} records
                </span>
              </button>

              {f.sources.length > 0 && (
                <ul className="mt-2 space-y-1.5 border-l pl-3" style={{ borderColor: "var(--club-line)" }}>
                  {f.sources.map((s) => {
                    const picked = on && activeSource?.name === s.name;
                    return (
                      <li key={s.slug} className="flex items-baseline gap-2">
                        <button
                          onClick={() => onPick(f, s)}
                          className="text-left text-sm transition-opacity"
                          style={{
                            opacity: picked ? 1 : 0.6,
                            color: picked ? "var(--club-accent)" : "var(--club-ink)",
                          }}
                        >
                          {s.display}
                          <span className="ml-1.5 font-mono text-[10px] tabular-nums" style={{ color: "var(--club-dim)" }}>
                            {s.count}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
