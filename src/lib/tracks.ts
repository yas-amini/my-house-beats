import raw from "@/data/tracks.json";

export type Track = {
  id: number;
  artist: string;
  title: string;
  year: string | null;
  dj: string | null;
  album: string | null;
  soundcloud_url: string | null;
  cover_art?: string | null;
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

/* ---------- time ---------- */

export const years: number[] = Array.from(
  new Set(tracks.map((t) => Number(t.year)).filter((y) => Number.isFinite(y) && y > 0)),
).sort((a, b) => a - b);

export const minYear = years[0] ?? 1987;
export const maxYear = years[years.length - 1] ?? 2026;

export const countsByYear: Record<number, number> = tracks.reduce<Record<number, number>>(
  (acc, t) => {
    const y = Number(t.year);
    if (Number.isFinite(y) && y > 0) acc[y] = (acc[y] ?? 0) + 1;
    return acc;
  },
  {},
);

export const maxYearCount = Math.max(1, ...Object.values(countsByYear));

export function tracksInRange(from: number, to: number) {
  return tracks.filter((t) => {
    const y = Number(t.year);
    return Number.isFinite(y) && y >= from && y <= to;
  });
}

export function eraOf(year: number | null) {
  if (!year) return null;
  const start = Math.floor(year / 5) * 5;
  return { start, end: start + 4, label: `${start}–${start + 4}` };
}

/* ---------- relations ---------- */

export function tracksForArtist(artist: string, exceptId?: number) {
  return tracks.filter((t) => t.artist === artist && t.id !== exceptId);
}

export function tracksForAlbum(album: string | null, exceptId?: number) {
  if (!album) return [];
  return tracks.filter((t) => t.album === album && t.id !== exceptId);
}

export function tracksForEra(year: string | null, exceptId?: number) {
  const era = eraOf(Number(year) || null);
  if (!era) return [];
  return tracks.filter((t) => {
    const y = Number(t.year);
    return y >= era.start && y <= era.end && t.id !== exceptId;
  });
}

export function shuffle<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function curatorStats(name: string) {
  const list = tracksForCurator(name);
  const ys = list.map((t) => Number(t.year)).filter((y) => Number.isFinite(y) && y > 0);
  const artistCounts = list.reduce<Record<string, number>>((acc, t) => {
    acc[t.artist] = (acc[t.artist] ?? 0) + 1;
    return acc;
  }, {});
  const albums = Array.from(new Set(list.map((t) => t.album).filter(Boolean))) as string[];
  return {
    list,
    span: ys.length ? ([Math.min(...ys), Math.max(...ys)] as const) : null,
    yearCounts: ys.reduce<Record<number, number>>((acc, y) => {
      acc[y] = (acc[y] ?? 0) + 1;
      return acc;
    }, {}),
    topArtists: Object.entries(artistCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12),
    albums,
  };
}
