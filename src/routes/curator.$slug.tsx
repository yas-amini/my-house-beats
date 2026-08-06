import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { TrackCollection } from "@/components/TrackCollection";
import { usePlayer } from "@/lib/player";
import { curatorBySlug, curatorStats, displayName, profileFor, shuffle } from "@/lib/tracks";

export const Route = createFileRoute("/curator/$slug")({
  loader: ({ params }) => {
    const curator = curatorBySlug(params.slug);
    if (!curator) throw notFound();
    return { curator };
  },
  head: ({ loaderData }) => {
    const name = loaderData ? displayName(loaderData.curator.name) : "Collection";
    const title = `Discovered through ${name} — My House Archive`;
    const description = loaderData
      ? `${loaderData.curator.count} house records I first heard through ${name}, with release years, artists and albums.`
      : "Curator collection in the My House archive.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...(loaderData ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  component: CuratorPage,
});

function CuratorPage() {
  const { curator } = Route.useLoaderData();
  const { playList } = usePlayer();
  const stats = useMemo(() => curatorStats(curator.name), [curator.name]);
  const [year, setYear] = useState<number | null>(null);
  const profile = profileFor(curator.name);
  const name = displayName(curator.name);

  const list = useMemo(
    () => (year == null ? stats.list : stats.list.filter((t) => Number(t.year) === year)),
    [stats.list, year],
  );

  const yearEntries = Object.entries(stats.yearCounts)
    .map(([y, n]) => [Number(y), n] as const)
    .sort((a, b) => a[0] - b[0]);

  return (
    <main className="mx-auto max-w-6xl px-5 pb-40 pt-10">
      <Link to="/club" className="font-mono text-[11px] text-muted-foreground hover:text-primary">
        ← back to the club
      </Link>

      <header className="mt-6 grid gap-6 border-b border-border pb-8 md:grid-cols-[1.3fr_1fr] md:items-end">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            {profile ? "Live Floor · DJ" : "Discovered through"}
          </p>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-border bg-muted font-display text-2xl tracking-wide">
              {name.slice(0, 2).toUpperCase()}
            </div>
            <h1 className="font-display text-6xl leading-[0.9] tracking-wide sm:text-7xl">{name}</h1>
          </div>
          {profile?.bio && (
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
          )}
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            {curator.count} records reached me through this curator
            {stats.span ? `, released between ${stats.span[0]} and ${stats.span[1]}` : ""}.
          </p>
          {profile?.links?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.links.map((l) => (
                <a
                  key={l.url}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-border px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {l.label} ↗
                </a>
              ))}
            </div>
          ) : null}
          <button
            onClick={() => playList(shuffle(stats.list), 0, name)}
            className="mt-5 rounded-full bg-primary px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            Play this thread
          </button>
        </div>


        <dl className="grid grid-cols-3 gap-4 font-mono text-[11px] text-muted-foreground">
          <div>
            <dt className="uppercase tracking-wider">Records</dt>
            <dd className="mt-1 font-display text-3xl tracking-wide text-foreground">
              {curator.count}
            </dd>
          </div>
          <div>
            <dt className="uppercase tracking-wider">Artists</dt>
            <dd className="mt-1 font-display text-3xl tracking-wide text-foreground">
              {new Set(stats.list.map((t) => t.artist)).size}
            </dd>
          </div>
          <div>
            <dt className="uppercase tracking-wider">Albums</dt>
            <dd className="mt-1 font-display text-3xl tracking-wide text-foreground">
              {stats.albums.length}
            </dd>
          </div>
        </dl>
      </header>

      <section className="mt-8 border-b border-border pb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Release years in this thread
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setYear(null)}
            className={`rounded-full border px-3 py-1.5 font-mono text-[11px] transition-colors ${
              year == null
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {yearEntries.map(([y, n]) => (
            <button
              key={y}
              onClick={() => setYear(year === y ? null : y)}
              className={`rounded-full border px-3 py-1.5 font-mono text-[11px] tabular-nums transition-colors ${
                year === y
                  ? "border-primary text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {y} <span className="opacity-60">{n}</span>
            </button>
          ))}
        </div>
      </section>

      {stats.topArtists.length > 0 && (
        <section className="mt-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Recurring artists
          </p>
          <p className="mt-2 text-sm leading-relaxed">
            {stats.topArtists.map(([name, n], i) => (
              <span key={name} className="text-muted-foreground">
                <span className="text-foreground">{name}</span>
                <span className="font-mono text-[11px] tabular-nums"> ×{n}</span>
                {i < stats.topArtists.length - 1 ? " · " : ""}
              </span>
            ))}
          </p>
        </section>
      )}

      <div key={`${curator.slug}-${year}`} className="animate-fade-in">
        <TrackCollection list={list} queueLabel={curator.name} />
      </div>
    </main>
  );
}
