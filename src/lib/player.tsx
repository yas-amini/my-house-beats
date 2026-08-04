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

type PlayerState = {
  current: Track | null;
  playing: boolean;
  position: number;
  duration: number;
  queue: Track[];
  queueLabel: string | null;
  select: (track: Track) => void;
  playList: (list: Track[], startIndex?: number, label?: string) => void;
  next: () => void;
  prev: () => void;
  toggle: () => void;
  seek: (ms: number) => void;
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
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const widgetRef = useRef<any>(null);
  const seekingRef = useRef(false);
  const loadTokenRef = useRef(0);
  const advanceRef = useRef<() => void>(() => {});

  const current = queue[index] ?? null;

  useEffect(() => {
    if (window.SC) return;
    const s = document.createElement("script");
    s.src = "https://w.soundcloud.com/player/api.js";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  useEffect(() => {
    if (!current?.soundcloud_url) return;
    const token = ++loadTokenRef.current;
    setPosition(0);
    setDuration(0);
    setPlaying(true);

    const bind = (w: any) => {
      w.unbind("play");
      w.unbind("pause");
      w.unbind("finish");
      w.unbind("playProgress");
      w.bind("play", () => {
        if (token !== loadTokenRef.current) return;
        setPlaying(true);
        w.getDuration((d: number) => setDuration(d));
      });
      w.bind("pause", () => {
        if (token !== loadTokenRef.current) return;
        setPlaying(false);
      });
      w.bind("finish", () => {
        if (token !== loadTokenRef.current) return;
        setPlaying(false);
        setPosition(0);
        advanceRef.current();
      });
      w.bind("playProgress", (e: { currentPosition: number }) => {
        if (token !== loadTokenRef.current || seekingRef.current) return;
        setPosition(e.currentPosition);
      });
      w.getDuration((d: number) => {
        if (token === loadTokenRef.current) setDuration(d);
      });
    };

    // Existing widget: swap the track in place (no iframe reload).
    if (widgetRef.current) {
      const w = widgetRef.current;
      w.load(current.soundcloud_url, {
        auto_play: true,
        visual: false,
        callback: () => {
          if (token !== loadTokenRef.current) return;
          bind(w);
        },
      });
      return;
    }

    // First track: boot the iframe, then create the widget once.
    if (!iframeRef.current) return;
    iframeRef.current.src = widgetUrl(current.soundcloud_url);

    let cancelled = false;
    const timer = window.setInterval(() => {
      if (cancelled || !window.SC || !iframeRef.current) return;
      window.clearInterval(timer);
      const w = window.SC.Widget(iframeRef.current);
      widgetRef.current = w;
      w.bind("ready", () => {
        if (token !== loadTokenRef.current) return;
        bind(w);
      });
    }, 150);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [current]);

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
    setIndex((i) => (queue.length ? (i + 1) % queue.length : 0));
  }, [queue.length]);

  const prev = useCallback(() => {
    setIndex((i) => (queue.length ? (i - 1 + queue.length) % queue.length : 0));
  }, [queue.length]);

  useEffect(() => {
    advanceRef.current = next;
  }, [next]);

  const toggle = useCallback(() => {
    const w = widgetRef.current;
    if (!w) return;
    w.isPaused((paused: boolean) => {
      if (paused) w.play();
      else w.pause();
      setPlaying(paused);
    });
  }, []);

  const seek = useCallback((ms: number) => {
    const w = widgetRef.current;
    seekingRef.current = true;
    setPosition(ms);
    if (w) w.seekTo(ms);
    window.setTimeout(() => {
      seekingRef.current = false;
    }, 400);
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        current,
        playing,
        position,
        duration,
        queue: queue.slice(index + 1),
        queueLabel,
        select,
        playList,
        next,
        prev,
        toggle,
        seek,
      }}
    >
      {children}
      <iframe
        ref={iframeRef}
        title="SoundCloud audio"
        allow="autoplay"
        width="1"
        height="1"
        style={{ position: "fixed", width: 1, height: 1, opacity: 0, pointerEvents: "none", bottom: 0 }}
      />
    </PlayerContext.Provider>
  );
}
