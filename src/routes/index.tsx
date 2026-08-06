import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Timeline } from "@/components/Timeline";
import { TrackCollection } from "@/components/TrackCollection";
import { curators, tracks, years } from "@/lib/tracks";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My House — A Personal House Music Archive" },
      {
        name: "description",
        content:
          "627 house cuts filed by release year and by the DJ who introduced them. Browse the timeline, follow a curator, or switch on the radio.",
      },
      { property: "og:title", content: "My House — A Personal House Music Archive" },
      {
        property: "og:description",
        content: "627 house cuts, 1987–2026, filed by release year and by the DJ who shared them.",
      },
    ],
  }),
  component: Archive,
});

function Archive() {
  const [year, setYear] = useState<number | null>(null);
  const [curator, setCurator] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tracks.filter((t) => {
      if (year != null && Number(t.year) !== year) return false;
      if (curator && t.dj !== curator) return false;
      if (
        q &&
        !`${t.artist} ${t.title} ${t.album ?? ""} ${t.dj ?? ""}`.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [year, curator, query]);

  const scopeLabel = [year ? `${year}` : null, curator].filter(Boolean).join(" · ") || "Everything";

  return (
    <main className="mx-auto max-w-6xl px-5 pb-40 pt-10">
      <section className="grid gap-6 border-b border-border pb-8 md:grid-cols-[1.4fr_1fr] md:items-end">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            The archive
          </p>
          <h1 className="mt-3 font-display text-6xl leading-[0.88] tracking-wide sm:text-8xl">
            A decade of
            <br />
            house, filed
            <br />
            by hand
          </h1>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          {tracks.length} records collected between {years[0]} and {years[years.length - 1]}. Every
          entry keeps two dates in mind: the year the record came out, and the person whose set,
          radio show or crate it reached me through.
        </p>
      </section>

      <div className="mt-8">
        <Timeline value={year} onChange={setYear} />
      </div>

      <section className="mt-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Discovered through
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setCurator(null)}
            className={`rounded-full border px-3 py-1.5 font-mono text-[11px] transition-colors ${
              curator == null
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
            }`}
          >
            Everyone
          </button>
          {curators.map((c) => (
            <button
              key={c.slug}
              onClick={() => setCurator(curator === c.name ? null : c.name)}
              className={`rounded-full border px-3 py-1.5 font-mono text-[11px] transition-colors ${
                curator === c.name
                  ? "border-primary text-primary"
                  : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              }`}
            >
              {c.name} <span className="tabular-nums opacity-60">{c.count}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {scopeLabel} · <span className="tabular-nums text-foreground">{list.length}</span> records
        </p>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search artist, title, album…"
            aria-label="Search the archive"
            className="w-56 rounded-full border border-border bg-card px-3.5 py-1.5 font-mono text-[11px] outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
          {(["grid", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                view === v
                  ? "border-foreground text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {v === "grid" ? "Sleeves" : "Index"}
            </button>
          ))}
        </div>
      </section>

      <div key={`${year}-${curator}-${view}-${query}`} className="animate-fade-in">
        <TrackCollection
          list={list}
          view={view}
          queueLabel={scopeLabel}
          emptyLabel="No records filed under this combination — try another year or curator."
        />
      </div>
    </main>
  );
}
