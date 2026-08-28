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

/** A silent placeholder so the widget exists (and is gesture-eligible) before any track is picked. */
const BOOT_URL =
  "https://w.soundcloud.com/player/?url=" +
  encodeURIComponent("https://soundcloud.com/soundcloud/tracks") +
  "&auto_play=false&visual=false";

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
  /** resolves once the SC widget instance exists */
  const readyRef = useRef<Promise<any> | null>(null);

  const current = queue[index] ?? null;

  /**
   * Boot the widget as early as possible — on mount, not on first track.
   * Mobile browsers only honour play() that originates from a user gesture, so
   * the widget must already exist when the user taps; creating the iframe
   * inside a later effect meant the tap had expired by the time we asked to play.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (readyRef.current) return;

    readyRef.current = new Promise((resolve) => {
      const boot = () => {
        if (!iframeRef.current || !window.SC) return false;
        if (!iframeRef.current.src) iframeRef.current.src = BOOT_URL;
        const w = window.SC.Widget(iframeRef.current);
        widgetRef.current = w;
        w.bind("ready", () => resolve(w));
        // Some browsers fire ready before we bind; resolve defensively too.
        window.setTimeout(() => resolve(w), 1500);
        return true;
      };

      if (!window.SC) {
        const existing = document.querySelector<HTMLScriptElement>("script[data-sc-api]");
        if (!existing) {
          const s = document.createElement("script");
          s.src = "https://w.soundcloud.com/player/api.js";
          s.async = true;
          s.dataset["scApi"] = "1";
          document.body.appendChild(s);
        }
      }
      if (iframeRef.current && !iframeRef.current.src) iframeRef.current.src = BOOT_URL;

      const timer = window.setInterval(() => {
        if (boot()) window.clearInterval(timer);
      }, 120);
    });
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
  }, []);

  /** Load + attempt playback. Never marks "playing" until the widget confirms it. */
  const loadCurrent = useCallback(
    (track: Track) => {
      if (!track.soundcloud_url) return;
      const token = ++loadTokenRef.current;
      setPosition(0);
      setDuration(0);
      setPlaying(false);
      setStatus("loading");
      clearWatchdog();

      // If the browser silently refuses, surface a retry action instead of a fake playing state.
      watchdogRef.current = window.setTimeout(() => {
        setStatus((s) => (s === "playing" ? s : "blocked"));
      }, 4000);

      const w = widgetRef.current;
      const run = (widget: any) => {
        if (token !== loadTokenRef.current) return;
        widget.load(track.soundcloud_url, {
          auto_play: true,
          visual: false,
          callback: () => {
            if (token !== loadTokenRef.current) return;
            bind(widget, token);
            setStatus((s) => (s === "playing" ? s : "ready"));
            // Ask again explicitly: some mobile builds ignore auto_play on load.
            try {
              widget.play();
            } catch {
              /* handled by the watchdog */
            }
          },
        });
      };

      // Synchronous path keeps us inside the user gesture whenever possible.
      if (w) run(w);
      else readyRef.current?.then(run);
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
