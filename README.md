# My House Archive

Build 'My House' — a React house music archive. I uploaded tracks.json with 627 tracks. Each track has: id, artist, title, year, dj, album, soundcloud_url.

Landing page: A bold header reading "My House" with a subtitle "627 cuts · 1987–2026 · curated from battles, crates, and dig sessions." Below: a grid of curator cards — one per unique dj value. Each card shows the curator name and track count. Background: warm cream #f5f2eb. Text: black #1a1a1a. Accent: electric blue #0066ff.

Clicking a curator card opens that collection in a track grid view. Each track card shows artist (bold), title, year. Clicking a track selects it for playback.

Player: Fixed bottom bar. Hidden SoundCloud iframe for audio playback. Custom play/pause button. Display track title, artist, and curator.

Typography: Oswald or Bebas Neue for headers (bold, condensed). Inter or JetBrains Mono for body text and metadata.

Aesthetic: Clean but raw. Warm archival feel. round edges,. 1px borders in light gray. Track cards have subtle hover state (blue left border accent).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9ab7a0c0-8b29-42c3-bf31-3b8dd90bf954).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
