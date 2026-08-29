import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Track } from "@/lib/tracks";

/** Real, observed audio state — never optimistic. */
export type AudioStatus =
  | "idle"
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "ended"
  | "blocked"
  | "error";

type PlayerState = {
  current: Track | null;
  playing: boolean;
  status: AudioStatus;
  /** true when the browser refused playback and a fresh gesture is required */
  blocked: boolean;
  position: number;
  duration: number;
  volume: number;
  muted: boolean;
  /** upcoming tracks only */
  queue: Track[];
  queueLabel: string | null;
  shuffling: boolean;
  toggleShuffle: () => void;
  /** jump N places forward in the queue (0 = the track right after current) */
  playAhead: (offset: number) => void;
  select: (track: Track) => void;
  playList: (list: Track[], startIndex?: number, label?: string) => void;
  /** Call synchronously from a click/tap handler to satisfy mobile gesture rules. */
  retry: () => void;
  next: () => void;
  prev: () => void;
  toggle: () => void;
  seek: (ms: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

declare global {
  interface Window {
    SC?: { Widget: any };
  }
}

function widgetUrl(url: string) {
  return (
    "https://w.soundcloud.com/player/?url=" +
    encodeURIComponent(url) +
    "&auto_play=true&visual=false"
  );
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueLabel, setQueueLabel] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState<AudioStatus>("idle");
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(100);
  const [muted, setMuted] = useState(false);
  const [shuffling, setShuffling] = useState(false);
  const preMuteVolumeRef = useRef(100);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const widgetRef = useRef<any>(null);
  const seekingRef = useRef(false);
  const loadTokenRef = useRef(0);
  const advanceRef = useRef<() => void>(() => {});
  const watchdogRef = useRef<number | null>(null);

  const current = queue[index] ?? null;

  // Load SoundCloud API script once
  useEffect(() => {
    if (typeof window === "undefined" || window.SC) return;
    const existing = document.querySelector<HTMLScriptElement>("script[data-sc-api]");
    if (!existing) {
      const s = document.createElement("script");
      s.src = "https://w.soundcloud.com/player/api.js";
      s.async = true;
      s.dataset["scApi"] = "1";
      document.body.appendChild(s);
    }
  }, []);

  const clearWatchdog = () => {
    if (watchdogRef.current) {
      window.clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  };

  const applyVolume = useCallback((value: number) => {
    const w = widgetRef.current;
    if (!w || typeof w.setVolume !== "function") return;
    try {
      w.setVolume(Math.max(0, Math.min(100, value)));
    } catch {
      /* widget may not be ready yet */
    }
  }, []);

  const bind = useCallback((w: any, token: number) => {
    w.unbind("play");
    w.unbind("pause");
    w.unbind("finish");
    w.unbind("playProgress");
    w.unbind("error");

    w.bind("play", () => {
      if (token !== loadTokenRef.current) return;
      clearWatchdog();
      setPlaying(true);
      setStatus("playing");
      w.getDuration((d: number) => setDuration(d));
    });
    w.bind("pause", () => {
      if (token !== loadTokenRef.current) return;
      setPlaying(false);
      setStatus((s) => (s === "ended" || s === "blocked" ? s : "paused"));
    });
    w.bind("finish", () => {
      if (token !== loadTokenRef.current) return;
      setPlaying(false);
      setStatus("ended");
      setPosition(0);
      advanceRef.current();
    });
    w.bind("error", () => {
      if (token !== loadTokenRef.current) return;
      clearWatchdog();
      setPlaying(false);
      setStatus("error");
    });
    w.bind("playProgress", (e: { currentPosition: number }) => {
      if (token !== loadTokenRef.current || seekingRef.current) return;
      setPosition(e.currentPosition);
    });
    w.getDuration((d: number) => {
      if (token === loadTokenRef.current) setDuration(d);
    });

    applyVolume(muted ? 0 : volume);
  }, [applyVolume, muted, volume]);

  /** Load + attempt playback for the active track */
  const loadCurrent = useCallback(
    (track: Track) => {
      if (!track.soundcloud_url) return;
      const token = ++loadTokenRef.current;
      setPosition(0);
      setDuration(0);
      setPlaying(false);
      setStatus("loading");
      clearWatchdog();

      watchdogRef.current = window.setTimeout(() => {
        setStatus((s) => (s === "playing" ? s : "blocked"));
      }, 4000);

      // If a working widget already exists, swap track via widget.load
      if (widgetRef.current) {
        const w = widgetRef.current;
        try {
          w.load(track.soundcloud_url, {
            auto_play: true,
            visual: false,
            callback: () => {
              if (token !== loadTokenRef.current) return;
              bind(w, token);
              setStatus((s) => (s === "playing" ? s : "ready"));
              try {
                w.play();
              } catch {
                /* handled by watchdog */
              }
            },
          });
          return;
        } catch {
          // Fall through to iframe.src reload on error
        }
      }

      // Initial boot or fallback: load directly via iframe src
      if (!iframeRef.current) return;
      iframeRef.current.src = widgetUrl(track.soundcloud_url);

      let cancelled = false;
      const timer = window.setInterval(() => {
        if (cancelled || !window.SC || !iframeRef.current) return;
        window.clearInterval(timer);
        try {
          const w = window.SC.Widget(iframeRef.current);
          widgetRef.current = w;
          w.bind("ready", () => {
            if (token !== loadTokenRef.current) return;
            bind(w, token);
            setStatus((s) => (s === "playing" ? s : "ready"));
            try {
              w.play();
            } catch {
              /* handled by watchdog */
            }
          });
        } catch {
          /* handled by watchdog */
        }
      }, 100);

      return () => {
        cancelled = true;
        window.clearInterval(timer);
      };
    },
    [bind],
  );

  useEffect(() => {
    if (!current) return;
    loadCurrent(current);
    return clearWatchdog;
  }, [current, loadCurrent]);

  const playList = useCallback((list: Track[], startIndex = 0, label?: string) => {
    const playable = list.filter((t) => t.soundcloud_url);
    if (!playable.length) return;
    const target = list[startIndex];
    const i = target ? Math.max(0, playable.findIndex((t) => t.id === target.id)) : 0;
    setQueue(playable);
    setQueueLabel(label ?? null);
    setIndex(i);
  }, []);

  const select = useCallback((track: Track) => {
    setQueue((prev) => {
      const at = prev.findIndex((t) => t.id === track.id);
      if (at >= 0) {
        setIndex(at);
        return prev;
      }
      setIndex(0);
      setQueueLabel(null);
      return [track];
    });
  }, []);

  const next = useCallback(() => {
    setIndex((i) => {
      if (!queue.length) return 0;
      if (shuffling && queue.length > 1) {
        let r = i;
        while (r === i) r = Math.floor(Math.random() * queue.length);
        return r;
      }
      return (i + 1) % queue.length;
    });
  }, [queue.length, shuffling]);

  const prev = useCallback(() => {
    setIndex((i) => (queue.length ? (i - 1 + queue.length) % queue.length : 0));
  }, [queue.length]);

  const playAhead = useCallback(
    (offset: number) => {
      setIndex((i) => Math.min(queue.length - 1, i + 1 + Math.max(0, offset)));
    },
    [queue.length],
  );

  const toggleShuffle = useCallback(() => setShuffling((s) => !s), []);

  useEffect(() => {
    advanceRef.current = next;
  }, [next]);

  const toggle = useCallback(() => {
    const w = widgetRef.current;
    if (!w) return;
    w.isPaused((paused: boolean) => {
      if (paused) {
        setStatus("loading");
        w.play();
        // If the browser blocks it, fall back to a visible retry state.
        clearWatchdog();
        watchdogRef.current = window.setTimeout(() => {
          setStatus((s) => (s === "playing" ? s : "blocked"));
        }, 3000);
      } else {
        w.pause();
      }
    });
  }, []);

  /** Direct-from-gesture retry after a blocked attempt. */
  const retry = useCallback(() => {
    const w = widgetRef.current;
    if (!w || !current) return;
    setStatus("loading");
    clearWatchdog();
    watchdogRef.current = window.setTimeout(() => {
      setStatus((s) => (s === "playing" ? s : "blocked"));
    }, 3000);
    try {
      w.play();
    } catch {
      setStatus("blocked");
    }
  }, [current]);

  const seek = useCallback((ms: number) => {
    const w = widgetRef.current;
    seekingRef.current = true;
    setPosition(ms);
    if (w) w.seekTo(ms);
    window.setTimeout(() => {
      seekingRef.current = false;
    }, 400);
  }, []);

  const setVolume = useCallback(
    (value: number) => {
      const clamped = Math.max(0, Math.min(100, value));
      setVolumeState(clamped);
      if (clamped > 0 && muted) setMuted(false);
      applyVolume(muted && clamped > 0 ? 0 : clamped);
    },
    [muted, applyVolume],
  );

  const toggleMute = useCallback(() => {
    setMuted((wasMuted) => {
      const next = !wasMuted;
      if (next) {
        preMuteVolumeRef.current = volume || 100;
        applyVolume(0);
      } else {
        const restored = preMuteVolumeRef.current || volume || 100;
        setVolumeState(restored);
        applyVolume(restored);
      }
      return next;
    });
  }, [volume, applyVolume]);

  // Keep the widget in sync whenever the underlying volume/mute state changes.
  useEffect(() => {
    applyVolume(muted ? 0 : volume);
  }, [muted, volume, applyVolume]);

  /* ---------- persistence: remember volume + mute across visits ---------- */
  const hydrated = useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("mhb:sound");
      if (raw) {
        const saved = JSON.parse(raw) as { volume?: number; muted?: boolean };
        if (typeof saved.volume === "number") setVolumeState(Math.max(0, Math.min(100, saved.volume)));
        if (typeof saved.muted === "boolean") setMuted(saved.muted);
      }
    } catch {
      /* ignore unreadable storage */
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem("mhb:sound", JSON.stringify({ volume, muted }));
    } catch {
      /* storage may be unavailable */
    }
  }, [volume, muted]);

  /* ---------- OS media controls (lock screen, headphones, media keys) ---------- */
  useEffect(() => {
    const ms = typeof navigator !== "undefined" ? navigator.mediaSession : undefined;
    if (!ms || !current) return;
    ms.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist,
      album: current.album ?? "My House Beats",
      artwork: current.cover_art
        ? [{ src: current.cover_art, sizes: "500x500", type: "image/jpeg" }]
        : [],
    });
    ms.setActionHandler("play", () => toggle());
    ms.setActionHandler("pause", () => toggle());
    ms.setActionHandler("nexttrack", () => next());
    ms.setActionHandler("previoustrack", () => prev());
    return () => {
      ms.setActionHandler("play", null);
      ms.setActionHandler("pause", null);
      ms.setActionHandler("nexttrack", null);
      ms.setActionHandler("previoustrack", null);
    };
  }, [current, toggle, next, prev]);

  useEffect(() => {
    const ms = typeof navigator !== "undefined" ? navigator.mediaSession : undefined;
    if (!ms) return;
    ms.playbackState = playing ? "playing" : "paused";
  }, [playing]);

  /* ---------- keyboard transport ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(input|textarea|select)$/i.test(el.tagName))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          toggle();
          break;
        case "ArrowRight":
          if (e.shiftKey) {
            e.preventDefault();
            next();
          }
          break;
        case "ArrowLeft":
          if (e.shiftKey) {
            e.preventDefault();
            prev();
          }
          break;
        case "m":
          toggleMute();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, next, prev, toggleMute]);


  return (
    <PlayerContext.Provider
      value={{
        current,
        playing,
        status,
        blocked: status === "blocked" || status === "error",
        position,
        duration,
        volume,
        muted,
        queue: queue.slice(index + 1),
        queueLabel,
        shuffling,
        toggleShuffle,
        playAhead,
        select,
        playList,
        retry,
        next,
        prev,
        toggle,
        seek,
        setVolume,
        toggleMute,
      }}
    >
      {children}
      <iframe
        ref={iframeRef}
        title="SoundCloud audio"
        allow="autoplay; encrypted-media"
        // @ts-expect-error - iOS inline playback hint
        playsInline
        width="1"
        height="1"
        style={{ position: "fixed", width: 1, height: 1, opacity: 0, pointerEvents: "none", bottom: 0 }}
      />
    </PlayerContext.Provider>
  );
}
