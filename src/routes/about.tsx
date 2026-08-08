import { createFileRoute, Link } from "@tanstack/react-router";
import { curators, floors, tracks, years } from "@/lib/tracks";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About the Project — My House" },
      {
        name: "description",
        content:
          "Why this house music archive exists: how the records were collected, how they are filed, and who introduced them.",
      },
      { property: "og:title", content: "About the Project — My House" },
      {
        property: "og:description",
        content: "The story behind a hand-filed archive of house records collected over a decade.",
      },
    ],
  }),
  component: About,
});

const stats = [
  { label: "Records filed", value: String(tracks.length) },
  { label: "Years covered", value: `${years[0]}–${years[years.length - 1]}` },
  { label: "Discovery sources", value: String(curators.length) },
  { label: "Dance floors", value: String(floors.length) },
];

function About() {
  return (
    <main className="mx-auto max-w-4xl px-5 pb-40 pt-12">
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
        About the project
      </p>
      <h1 className="mt-4 font-display text-5xl leading-[0.92] tracking-tight sm:text-7xl">
        Why this archive
        <br />
        exists
      </h1>

      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        My House is a personal archive of house music collected over more than a decade — from
        street and house dance battles, from TikTok live DJ sessions, and from crates shared by
        people who play these records for a living. Nothing here is algorithmic. Every entry was
        filed by hand.
      </p>

      <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card px-4 py-5">
            <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {s.label}
            </dt>
            <dd className="mt-2 font-display text-3xl tracking-tight tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-14">
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">How it was collected</h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
          Two habits built this collection. The first is filming and attending dance battles, where
          the good records get Shazammed on the spot and land in a playlist. The second is watching
          DJs play live — the Live Floor exists because a specific person put that record on at a
          specific moment.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">How it is filed</h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
          Each record keeps two dates in mind: the year it was released, and the route it took to
          reach me. The Archive lets you move through release years and discovery sources. The Club
          turns the same collection into a room you can walk into, split across three dance floors.
        </p>
        <ul className="mt-5 space-y-3">
          {floors.map((f) => (
            <li key={f.id} className="border-l-2 border-border pl-4">
              <p className="font-display text-2xl tracking-tight">{f.name}</p>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">Credit</h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
          Where a DJ or curator introduced a record, they are credited on the track and on the Live
          Floor, with links to their own channels. Records that arrived without a clear source stay
          in the archive uncredited rather than being attributed to a platform.
        </p>
      </section>

      <div className="mt-14 flex flex-wrap gap-3">
        <Link
          to="/"
          className="rounded-full bg-foreground px-5 py-2.5 font-mono text-xs uppercase tracking-[0.18em] text-background"
        >
          Browse the archive
        </Link>
        <Link
          to="/club"
          className="rounded-full border border-border px-5 py-2.5 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
        >
          Enter the club
        </Link>
      </div>
    </main>
  );
}
