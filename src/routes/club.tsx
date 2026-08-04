import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePlayer } from "@/lib/player";
import { ClubStatus } from "@/components/club/ClubStatus";
import { ClubAtmosphere } from "@/components/club/ClubAtmosphere";
import { DiscoBall } from "@/components/club/DiscoBall";
import { StarFilter } from "@/components/club/StarFilter";
import { useArtworkPalette } from "@/lib/palette";
import { floors, shuffle, tracksForFloor, type Floor } from "@/lib/tracks";

export const Route = createFileRoute("/club")({
  head: () => ({
    meta: [
      { title: "Club — My House" },
      {
        name: "description",
        content:
          "Walk in and the record is already playing. A hazy 1970s dance floor for a decade-deep house archive, with a floor for every curator.",
      },
      { property: "og:title", content: "Club — My House" },
      {
        property: "og:description",
        content: "Step onto the main floor: the disco ball turns, the haze moves, the music keeps going.",
      },
    ],
  }),
  component: ClubPage,
});

function ClubPage() {
  const { current, status, blocked, playList, retry } = usePlayer();
  const [floorId, setFloorId] = useState("main");
  const palette = useArtworkPalette(current?.cover_art);

  const floor = useMemo(() => floors.find((f) => f.id === floorId) ?? floors[0]!, [floorId]);

  /**
   * Start playback synchronously inside the tap handler — mobile browsers only
   * allow audio that begins as a direct result of a user gesture.
   */
  const startFloor = (f: Floor) => {
    setFloorId(f.id);
    playList(shuffle(tracksForFloor(f)), 0, f.curator ?? "Main floor");
  };

  // The room is already playing when you walk in; if the browser blocks it,
  // the transport surfaces a tap-to-play prompt.
  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    playList(shuffle(tracksForFloor(floor)), 0, floor.curator ?? "Main floor");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = status === "playing";

  return (
    <main className="club relative min-h-[calc(100vh-57px)] overflow-hidden">
      <ClubAtmosphere open={open} palette={palette} />
      <DiscoBall open={open} />
      <StarFilter open={open} palette={palette} />

      <div className="relative z-10 mx-auto grid max-w-6xl gap-10 px-5 pb-40 pt-12 md:grid-cols-[190px_1fr] md:gap-14 md:pt-16">
        <FloorNav
          floors={floors}
          active={floor}
          onPick={(id) => startFloor(floors.find((f) => f.id === id) ?? floors[0]!)}
        />


        <section className="min-w-0">
          <div className="flex items-center gap-4">
            <ClubStatus open={open} />
            <span className="font-mono text-[11px] tracking-widest" style={{ color: "var(--club-dim)" }}>
              {floor.curator ? floor.name : "Main floor"}
            </span>
          </div>

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
              <p
                className="mt-6 text-base"
                style={{ color: "var(--club-dim)" }}
              >
                Discovered through{" "}
                <span style={{ color: "var(--club-accent)", fontStyle: "normal" }}>{current.dj}</span>
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
                    : "Your browser is holding the sound back. Tap here to play."}
                </button>
              )}
            </article>

          ) : (
            <p className="mt-16 text-lg" style={{ color: "var(--club-dim)" }}>
              The record is about to drop.
            </p>
          )}

        </section>
      </div>
    </main>
  );
}

function FloorNav({
  floors: list,
  active,
  onPick,
}: {
  floors: Floor[];
  active: Floor;
  onPick: (id: string) => void;
}) {
  return (
    <nav className="min-w-0 md:sticky md:top-24 md:self-start">
      <p className="mb-4 font-mono text-[11px] tracking-widest" style={{ color: "var(--club-dim)" }}>
        Dance floors
      </p>
      <ul className="flex gap-2 overflow-x-auto pb-2 md:block md:overflow-visible md:pb-0">
        {list.map((f) => {
          const on = f.id === active.id;
          return (
            <li key={f.id} className="shrink-0 md:mb-3">
              <button
                onClick={() => onPick(f.id)}
                className="text-left transition-opacity"
                style={{ opacity: on ? 1 : 0.55 }}
              >
                <span
                  className="block font-mono text-[10px] tracking-widest"
                  style={{ color: on ? "var(--club-accent)" : "var(--club-dim)" }}
                >
                  {f.number}
                </span>
                <span
                  className="block whitespace-nowrap text-[17px] leading-tight"
                  style={{ fontFamily: "var(--font-display)", letterSpacing: "0.01em" }}
                >
                  {f.name}
                </span>
                <span className="block text-xs" style={{ color: "var(--club-dim)" }}>
                  {f.count} records
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
