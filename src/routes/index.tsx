import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Timeline } from "@/components/Timeline";
import { TrackCollection } from "@/components/TrackCollection";
import { curators, tracks, years } from "@/lib/tracks";

type ArchiveSearch = {
  year?: number;
  dj?: string;
  q?: string;
  view?: "grid" | "list";
};

export const Route = createFileRoute("/")({
  /** Filters live in the URL so any view of the archive can be shared or bookmarked. */
  validateSearch: (search: Record<string, unknown>): ArchiveSearch => {
    const year = Number(search["year"]);
    const view = search["view"] === "list" ? "list" : undefined;
    const dj = typeof search["dj"] === "string" && search["dj"] ? search["dj"] : undefined;
    const q = typeof search["q"] === "string" && search["q"] ? search["q"] : undefined;
    return {
      ...(Number.isFinite(year) && year > 0 ? { year } : {}),
      ...(dj ? { dj } : {}),
      ...(q ? { q } : {}),
      ...(view ? { view } : {}),
    };
  },
  head: () => ({
    meta: [
      { title: "My House Beats — A Personal House Music Archive" },
      {
        name: "description",
        content:
          "806 house cuts filed by release year and by the DJ who introduced them. Browse the timeline, follow a curator, or step onto the club floor.",
      },
      { property: "og:title", content: "My House Beats — A Personal House Music Archive" },
      {
        property: "og:description",
        content: "806 house cuts, 1987–2026, filed by release year and by the DJ who shared them.",
      },
    ],
  }),
  component: Archive,
});

function Archive() {
  const { year = null, dj: curator = null, q = "", view = "grid" } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });

  const setSearch = (next: Partial<ArchiveSearch>) => {
    void navigate({
      search: (prev) => {
        const merged = { ...prev, ...next } as Record<string, unknown>;
        for (const key of Object.keys(merged)) {
          const v = merged[key];
          if (v == null || v === "" || v === "grid") delete merged[key];
        }
        return merged as ArchiveSearch;
      },
      replace: true,
      resetScroll: false,
    });
  };

  /** Typing stays instant; the URL and the filter only catch up once you pause. */
  const [draft, setDraft] = useState(q);
  useEffect(() => setDraft(q), [q]);
  useEffect(() => {
    if (draft === q) return;
    const id = setTimeout(() => setSearch({ q: draft || undefined }), 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return tracks.filter((t) => {
      if (year != null && Number(t.year) !== year) return false;
      if (curator && t.dj !== curator) return false;
      if (
        needle &&
        !`${t.artist} ${t.title} ${t.album ?? ""} ${t.dj ?? ""}`.toLowerCase().includes(needle)
      )
        return false;
      return true;
    });
  }, [year, curator, q]);

  const scopeLabel = [year ? `${year}` : null, curator].filter(Boolean).join(" · ") || "Everything";
  const filtered = year != null || curator != null || q !== "";

  return (
    <main className="archive mx-auto max-w-6xl px-5 pb-40 pt-10">
      <section className="grid gap-6 border-b border-border pb-8 md:grid-cols-[1.4fr_1fr] md:items-end">
        <div>
          <p className="arc-label font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
            The archive
          </p>
          <h1 className="arc-hero mt-3 font-display text-6xl leading-[0.88] tracking-tight sm:text-8xl">
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
        <Timeline value={year} onChange={(y) => setSearch({ year: y ?? undefined })} />
      </div>

      <section className="mt-8">
        <p className="arc-label font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Discovered through
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setSearch({ dj: undefined })}
            aria-pressed={curator == null}
            className={`rounded-full border px-3 py-1.5 font-mono text-xs transition-colors ${
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
              onClick={() => setSearch({ dj: curator === c.name ? undefined : c.name })}
              aria-pressed={curator === c.name}
              className={`rounded-full border px-3 py-1.5 font-mono text-xs transition-colors ${
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
        <p className="arc-label font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {scopeLabel} · <span className="tabular-nums text-foreground">{list.length}</span> records
          {filtered && (
            <button
              onClick={() => setSearch({ year: undefined, dj: undefined, q: undefined })}
              className="ml-3 rounded-full border border-border px-2.5 py-1 text-[10px] normal-case tracking-normal text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              Clear filters
            </button>
          )}
        </p>
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search artist, title, album…"
            aria-label="Search the archive"
            type="search"
            className="w-56 rounded-full border border-border bg-card px-3.5 py-1.5 font-mono text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
          {(["grid", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setSearch({ view: v })}
              aria-pressed={view === v}
              className={`rounded-full border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
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

      <div key={`${year}-${curator}-${view}-${q}`} className="animate-fade-in">
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
