import { createFileRoute, Link } from "@tanstack/react-router";
import { curators, tracks } from "@/lib/tracks";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My House — House Music Archive" },
      {
        name: "description",
        content:
          "627 house cuts from 1987 to 2026, curated from battles, crates and dig sessions. Browse by curator and play straight from SoundCloud.",
      },
      { property: "og:title", content: "My House — House Music Archive" },
      {
        property: "og:description",
        content: "627 house cuts, 1987–2026, curated from battles, crates and dig sessions.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-32 pt-16">
      <header className="border-b border-border pb-10">
        <h1 className="font-display text-7xl leading-[0.9] tracking-wide sm:text-8xl">
          My House
        </h1>
        <p className="mt-4 font-mono text-sm text-muted-foreground">
          {tracks.length} cuts · 1987–2026 · curated from battles, crates, and dig sessions.
        </p>
      </header>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {curators.map((c) => (
          <Link
            key={c.slug}
            to="/curator/$slug"
            params={{ slug: c.slug }}
            className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary"
          >
            <h2 className="font-display text-3xl tracking-wide transition-colors group-hover:text-primary">
              {c.name}
            </h2>
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              {c.count} track{c.count === 1 ? "" : "s"}
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
