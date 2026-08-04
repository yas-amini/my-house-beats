import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { usePlayer } from "@/lib/player";
import { ClubStatus } from "@/components/club/ClubStatus";
import { ClubAtmosphere } from "@/components/club/ClubAtmosphere";
import { DiscoBall, DiscoBallCredit } from "@/components/club/DiscoBall";
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

function fmt(ms: number) {
  if (!ms || ms < 0) return "0:00";
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function ClubPage() {
  const { current, playing, status, blocked, toggle, next, position, duration, seek, playList, retry } =
    usePlayer();
  const [entered, setEntered] = useState(false);
  const [floorId, setFloorId] = useState("main");
  const palette = useArtworkPalette(current?.cover_art);

  const floor = useMemo(() => floors.find((f) => f.id === floorId) ?? floors[0]!, [floorId]);

  /**
   * Start playback synchronously inside the tap handler — mobile browsers only
   * allow audio that begins as a direct result of a user gesture.
   */
  const startFloor = (f: Floor) => {
    setFloorId(f.id);
    setEntered(true);
    playList(shuffle(tracksForFloor(f)), 0, f.curator ?? "Main floor");
  };

  const progress = duration > 0 ? Math.min(1, position / duration) : 0;
  const open = status === "playing";

  return (
    <main className="club relative min-h-[calc(100vh-57px)] overflow-hidden">
      <ClubAtmosphere open={open} palette={palette} />
      <DiscoBall open={open} />

      {!entered && <EnterCurtain onEnter={() => startFloor(floor)} />}


      <div className="relative z-10 mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[190px_1fr] md:gap-14 md:py-16">
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
                style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
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
                className="mt-6 text-base italic"
                style={{ fontFamily: '"Instrument Serif", Georgia, serif', color: "var(--club-dim)" }}
              >
                Discovered through{" "}
                <span style={{ color: "var(--club-accent)", fontStyle: "normal" }}>{current.dj}</span>
              </p>

              {/* transport */}
              <div className="mt-9 max-w-md">
                <input
                  type="range"
                  min={0}
                  max={duration || 1}
                  value={position}
                  onChange={(e) => seek(Number(e.target.value))}
                  aria-label="Seek"
                  className="club-seek w-full"
                  style={{ ["--p" as string]: `${progress * 100}%` }}
                />
                <div className="mt-2 flex justify-between font-mono text-[11px]" style={{ color: "var(--club-dim)" }}>
                  <span>{fmt(position)}</span>
                  <span>{fmt(duration)}</span>
                </div>

                <div className="mt-6 flex items-center gap-4">
                  <button
                    onClick={blocked ? retry : toggle}
                    aria-label={playing ? "Pause" : "Play"}
                    className="flex h-14 w-14 items-center justify-center rounded-full transition-transform hover:scale-105"
                    style={{ background: "var(--club-accent)", color: "#160d08" }}
                  >
                    {playing ? (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                        <rect x="3" y="2" width="4" height="14" rx="1" />
                        <rect x="11" y="2" width="4" height="14" rx="1" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                        <path d="M4 2.5v13l11-6.5z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={next}
                    className="text-sm underline underline-offset-4 transition-colors hover:opacity-80"
                    style={{ color: "var(--club-dim)" }}
                  >
                    Next record
                  </button>
                </div>

                {blocked && (
                  <button
                    onClick={retry}
                    className="mt-5 w-full border px-4 py-3 text-left text-sm"
                    style={{ borderColor: "var(--club-line)", borderRadius: 6, color: "var(--club-ink)" }}
                  >
                    {status === "error"
                      ? "This record wouldn't load. Tap to try again, or skip to the next one."
                      : "Your browser is holding the sound back. Tap here to play."}
                  </button>
                )}
              </div>
            </article>

          ) : (
            <p className="mt-16 text-lg" style={{ color: "var(--club-dim)" }}>
              The record is about to drop.
            </p>
          )}

          <div className="mt-16">
            <DiscoBallCredit />
          </div>
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
    <nav className="md:sticky md:top-24 md:self-start">
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
                  style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
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

/** Browsers won't let us play until someone touches the door. */
function EnterCurtain({ onEnter }: { onEnter: () => void }) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center px-6"
      style={{ background: "color-mix(in oklab, var(--club-bg) 88%, transparent)" }}
    >
      <button onClick={onEnter} className="group text-center">
        <span
          className="block text-[clamp(2.5rem,8vw,4.5rem)] leading-none"
          style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
        >
          Club
        </span>
        <span
          className="mt-4 inline-block border-b pb-1 text-sm transition-opacity group-hover:opacity-70"
          style={{ color: "var(--club-dim)", borderColor: "var(--club-line)" }}
        >
          Step inside — the music is already playing
        </span>
      </button>
    </div>
  );
}
