# Senior review: what I'd improve, and how to polish it

The project is in good shape conceptually — Archive vs Club is a real idea, not a Spotify clone. The weak points are all in scale, shareability and the small details that make a site feel finished.

## 1. Performance — the archive renders everything at once

Today all 806 records mount as DOM nodes with 806 `<img>` tags in one pass. On mobile that is a slow first paint and a janky scroll, and typing in the search box re-filters and re-renders the whole list on every keystroke.

- Windowed rendering: render ~60 records and append more as the user scrolls (IntersectionObserver sentinel). No library needed.
- Debounce the search input (~150ms) so typing doesn't re-render the grid per character.
- Give sleeve images explicit `width`/`height` and `decoding="async"` to stop layout shift.
- The whole track dataset (274KB JSON) ships in the client bundle on every page, including Club and About. Load it through the route loader so it isn't parsed on routes that don't need it.

## 2. State isn't in the URL — nothing is shareable

Year, curator, search and view live in `useState`. A filtered archive view can't be linked, bookmarked or reopened after refresh, and the browser back button doesn't undo a filter.

- Move all four into TanStack Router search params (`?year=1998&dj=harbo&q=…&view=list`).
- Same for the Club: `?floor=live&source=…` so a floor can be shared.

## 3. No individual record pages

Every track is a click-to-play tile and nothing else. There's no place to land on a single record, which is both a UX gap and the main SEO gap — one page indexes today.

- Add `/record/$id` with the sleeve, year, curator, album, links to "more by this artist" and "more from this era", plus a MusicRecording JSON-LD block and its own `head()`.
- Add `/curator/$slug` pages built from the bios and social links that currently only live inside the Club sidebar.

## 4. Playback polish

- **Media Session API**: register title, artist and artwork so the lock screen, AirPods and OS media keys show the right record and can skip tracks. This is the single biggest "feels like a real product" win.
- **Keyboard**: space = play/pause, arrows = seek/skip, `/` = focus search.
- **Shuffle + repeat** on the queue, and a visible queue panel — the bar currently says "N up next" but you can't see what.
- **Persistence**: remember volume, mute and last track in localStorage.
- **Error state**: if a SoundCloud track fails to load, skip it and show a quiet toast rather than stalling.

## 5. Accessibility and semantics

- Seek and volume ranges have no `aria-valuetext`, so screen readers read raw milliseconds.
- Filter chips should be `aria-pressed` toggles; the grid/list switch should be a radiogroup.
- Add a visible focus ring on sleeve buttons and a skip-to-content link.
- Check contrast of `--club-dim` against the darker cover-art-driven backgrounds — some palettes drop below 4.5:1.
- Respect `prefers-reduced-motion` for the star filter, haze and disco ball.

## 6. Code structure

- `src/routes/club.tsx` (275 lines) mixes theming, floor selection, bios and layout. Split into `useClubVibe`, `FloorNav`, `FloorBios`.
- `src/lib/tracks.ts` computes curators, floors, year counts and stats at module load. Fine at 806 rows, but move derived stats behind memoised helpers before it grows.
- `src/routes/radio.tsx` is an 8-line leftover from the pre-Club naming — delete it or make it an explicit redirect.
- `@types/three` is pinned in dependencies and `three` is installed, but the disco ball is a Sketchfab iframe. Confirm and drop unused weight.
- No tests. Two worth having: floor assignment rules (the 20-track minimum) and queue advance/wrap logic.

## 7. Visual polish (the "finished" layer)

- **Loading**: sleeve placeholders that fade in on image load instead of popping.
- **Empty and edge states**: a designed "no records" state, not a line of mono text.
- **Now-playing affordance**: the active tile only changes border; add a small animated bar-graph badge over the sleeve.
- **Timeline**: hover tooltip with year + record count, and make the bars keyboard-navigable.
- **Typography rhythm**: Anton headings are strong, but body sizes drift between 11/12/13px in mono. Settle on two mono sizes and two body sizes across Archive.
- **Player bar**: add safe-area padding for iPhone home indicator, and a compact mobile layout (cover + title + play only, expandable).
- **404 page**: currently generic — give it the archive's voice.
- **Favicon / OG image**: add a real social preview image so shared links look intentional.

## Suggested order

1. Media Session + keyboard + player persistence (highest felt value, low risk)
2. URL search params for Archive and Club
3. Windowed rendering + debounced search
4. Record and curator pages with JSON-LD
5. Accessibility pass and reduced-motion
6. Visual polish pass
7. Refactor Club, remove dead code, add the two tests

## Technical notes

- Windowing via IntersectionObserver on a sentinel div; keep the existing `TrackCollection` API and slice the list inside it.
- Search params through `validateSearch` with Zod on the route, then `useSearch` / `navigate({ search })` — replaces the local `useState` calls.
- Media Session lives in `src/lib/player.tsx`, set inside the effect that already reacts to `current`.
- JSON-LD as a `scripts` entry in the route `head()`.

Tell me which sections you want and I'll build them in that order.
