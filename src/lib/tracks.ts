import raw from "@/data/tracks.json";

export type Track = {
  id: number;
  artist: string;
  title: string;
  year: string | null;
  dj: string | null;
  album: string | null;
  soundcloud_url: string | null;
};

export const UNCREDITED = "Uncredited";

export const tracks: Track[] = (raw as Track[]).map((t) => ({
  ...t,
  dj: t.dj ?? UNCREDITED,
}));

export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type Curator = { name: string; slug: string; count: number };

export const curators: Curator[] = Object.values(
  tracks.reduce<Record<string, Curator>>((acc, t) => {
    const name = t.dj as string;
    acc[name] ??= { name, slug: slugify(name), count: 0 };
    acc[name].count += 1;
    return acc;
  }, {}),
).sort((a, b) => b.count - a.count);

export function curatorBySlug(slug: string) {
  return curators.find((c) => c.slug === slug);
}

export function tracksForCurator(name: string) {
  return tracks.filter((t) => t.dj === name);
}
