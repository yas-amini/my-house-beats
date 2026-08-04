import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { curatorBySlug, tracksForCurator, type Track } from "@/lib/tracks";
import { usePlayer } from "@/lib/player";

export const Route = createFileRoute("/curator/$slug")({
  loader: ({ params }) => {
    const curator = curatorBySlug(params.slug);
    if (!curator) throw notFound();
    return { curator, list: tracksForCurator(curator.name) };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.curator.name ?? "Collection";
    const title = `${name} — My House Archive`;
    const description = loaderData
      ? `${loaderData.curator.count} house tracks curated by ${name} in the My House archive.`
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
  const { curator, list } = Route.useLoaderData();
  const { select, current } = usePlayer();

  return (
    <main className="mx-auto max-w-6xl px-5 pb-32 pt-12">
      <Link to="/" className="font-mono text-xs text-muted-foreground hover:text-primary">
        ← all curators
      </Link>
      <header className="mt-6 border-b border-border pb-8">
        <h1 className="font-display text-6xl leading-none tracking-wide">{curator.name}</h1>
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          {curator.count} tracks in this collection
        </p>
      </header>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t: Track) => {
          const active = current?.id === t.id;
          return (
            <button
              key={t.id}
              onClick={() => select(t)}
              className={`rounded-xl border border-l-4 bg-card p-4 text-left transition-colors hover:border-l-primary ${
                active ? "border-border border-l-primary" : "border-border border-l-border"
              }`}
            >
              <p className="truncate font-semibold">{t.artist}</p>
              <p className="mt-1 truncate text-sm text-muted-foreground">{t.title}</p>
              <p className="mt-3 font-mono text-xs text-muted-foreground">{t.year ?? "—"}</p>
            </button>
          );
        })}
      </div>
    </main>
  );
}
