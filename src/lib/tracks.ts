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

/** Tracks with no discovery source simply carry `dj: null`. */
export const tracks: Track[] = (raw as Track[]).map((t) => ({ ...t, dj: t.dj ?? null }));

export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type Curator = { name: string; slug: string; count: number };

export const curators: Curator[] = Object.values(
  tracks.reduce<Record<string, Curator>>((acc, t) => {
    const name = t.dj;
    if (!name) return acc;
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

/* ---------- curator profiles ---------- */

export type CuratorProfile = {
  /** matches Track.dj */
  name: string;
  display: string;
  bio?: string;
  links?: { label: string; url: string }[];
};

/** Sources that are storage platforms, not people. */
export const PLATFORM_SOURCES = ["Spotify", "SoundCloud"] as const;

export const curatorProfiles: CuratorProfile[] = [
  {
    name: "Cashmere Sound (UK)",
    display: "Cashmere Sound (UK)",
    bio: "Cashmere Sound (UK) is the musical alias of Stefan Austin, showcasing his love for House music and the many subgenres that come with it. Growing up listening to House and Techno, Cashmere combines Tech House, Minimal/Deep Tech, Jackin House with a nostalgic House vibe.",
    links: [
      { label: "SoundCloud", url: "https://soundcloud.com/cashemere_sound" },
      { label: "Instagram", url: "https://www.instagram.com/cashmere.sounduk/" },
      { label: "TikTok", url: "https://www.tiktok.com/@cashmeresounduk" },
    ],
  },
  {
    name: "Yu_MusicRoom",
    display: "Yu_MusicRoom",
    bio: "Yuu Imamura, better known as Yu_MusicRoom, is a Japanese DJ and music curator with a deep connection to house music. He spent around 16 years DJing in Tokyo clubs, developing a style rooted in soulful, deep and groove-driven house. His sets move across Soulful House, Deep House, Chicago House, Jazz House and Afro House, often bringing together warm grooves, jazz influences and the more musical side of club culture. After years behind the decks, Yu_MusicRoom has continued sharing his selections through online mixes and livestreams, introducing listeners to house music from Japan and beyond.",
    links: [
      { label: "YouTube", url: "https://www.youtube.com/@yumusicroom" },
      { label: "TikTok", url: "https://www.tiktok.com/@dj_yu55" },
      { label: "Mixcloud", url: "https://www.mixcloud.com/yuu-imamura/" },
      { label: "Stream archive", url: "https://streamrecorder.io/tiktok/@dj_yu55" },
    ],
  },
  {
    name: "AMBI (UK)",
    display: "AMBI (UK)",
    bio: "UK DJ & producer duo. Minimal • Deep Tech • House.",
    links: [
      { label: "Instagram", url: "https://www.instagram.com/ambi_uk/" },
      { label: "TikTok", url: "https://www.tiktok.com/@ambi_uk_" },
      { label: "SoundCloud", url: "https://soundcloud.com/ambiuk" },
      { label: "Bandcamp", url: "https://ambiuk.bandcamp.com/" },
      { label: "Links", url: "https://bass.fan/ambi" },
    ],
  },
  {
    name: "louierds DJ",
    display: "LouieRds DJ",
    links: [
      { label: "Instagram", url: "https://www.instagram.com/louierds/" },
      { label: "TikTok", url: "https://www.tiktok.com/@louierds" },
    ],
  },
  {
    name: "HARBO",
    display: "HARBO",
    links: [
      { label: "TikTok", url: "https://www.tiktok.com/@iamharbo" },
      { label: "SoundCloud", url: "https://soundcloud.com/harbomusic" },
      { label: "YouTube", url: "https://www.youtube.com/@iamharbo" },
      { label: "Links", url: "https://bio.site/iamharbo" },
    ],
  },
];


export function profileFor(name: string): CuratorProfile | undefined {
  return curatorProfiles.find((p) => p.name === name);
}

export function displayName(name: string | null | undefined) {
  if (!name) return null;
  return profileFor(name)?.display ?? name;
}

/* ---------- dance floors ---------- */

export type FloorSource = {
  /** curator name as stored on the track */
  name: string;
  display: string;
  slug: string;
  count: number;
  kind: "dj" | "collection";
};

export type Floor = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  count: number;
  sources: FloorSource[];
};

const platform = (n: string) => (PLATFORM_SOURCES as readonly string[]).includes(n);

const toSource = (c: Curator, kind: FloorSource["kind"]): FloorSource => ({
  name: c.name,
  display: displayName(c.name) ?? c.name,
  slug: c.slug,
  count: c.count,
  kind,
});

const liveSources = curators.filter((c) => !platform(c.name)).map((c) => toSource(c, "dj"));

const battleSources = curators.filter((c) => platform(c.name)).map((c) => toSource(c, "collection"));

const sum = (list: FloorSource[]) => list.reduce((n, s) => n + s.count, 0);

export const floors: Floor[] = [
  {
    id: "main",
    name: "Main Floor",
    tagline: "The whole archive, shuffled",
    description:
      "Every record in the collection, played in random order. No source, no sorting — just the room.",
    count: tracks.length,
    sources: [],
  },
  {
    id: "live",
    name: "Live Floor",
    tagline: "Found in TikTok live DJ sessions",
    description:
      "Records I caught while watching DJs play live. Every track here traces back to a person behind the decks.",
    count: sum(liveSources),
    sources: liveSources,
  },
  {
    id: "battle",
    name: "Battle Floor",
    tagline: "Playlists built at street & house battles",
    description:
      "Years of handpicked cuts from my own playlists, gathered around dance battles. The platform is only where they live, not who played them.",
    count: sum(battleSources),
    sources: battleSources,
  },
];

export function floorById(id: string) {
  return floors.find((f) => f.id === id) ?? floors[0]!;
}

export function tracksForFloor(floor: Floor, sourceName?: string | null) {
  if (sourceName) return tracksForCurator(sourceName);
  if (floor.id === "main") return tracks;
  const names = new Set(floor.sources.map((s) => s.name));
  return tracks.filter((t) => names.has(t.dj as string));
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
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = out[i] as T;
    out[i] = out[j] as T;
    out[j] = a;
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
