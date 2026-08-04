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
  select: (track: Track) => void;
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

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    if (window.SC) return;
    const s = document.createElement("script");
    s.src = "https://w.soundcloud.com/player/api.js";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  useEffect(() => {
    if (!current?.soundcloud_url || !iframeRef.current) return;
    const url =
      "https://w.soundcloud.com/player/?url=" +
      encodeURIComponent(current.soundcloud_url) +
      "&auto_play=true&visual=false";
    iframeRef.current.src = url;
    setPlaying(true);
    widgetRef.current = null;
    setPosition(0);
    setDuration(0);

    let cancelled = false;
    const attach = () => {
      if (cancelled || !window.SC || !iframeRef.current) return;
      const w = window.SC.Widget(iframeRef.current);
      widgetRef.current = w;
      w.bind("play", () => {
        setPlaying(true);
        w.getDuration((d: number) => setDuration(d));
      });
      w.bind("pause", () => setPlaying(false));
      w.bind("finish", () => {
        setPlaying(false);
        setPosition(0);
      });
      w.bind("playProgress", (e: { currentPosition: number }) =>
        setPosition(e.currentPosition),
      );
      w.bind("ready", () => w.getDuration((d: number) => setDuration(d)));
    };
    const timer = window.setInterval(() => {
      if (window.SC) {
        window.clearInterval(timer);
        attach();
      }
    }, 200);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [current]);

  const select = useCallback((track: Track) => setCurrent(track), []);

  const toggle = useCallback(() => {
    const w = widgetRef.current;
    if (!w) return;
    if (playing) w.pause();
    else w.play();
    setPlaying((p) => !p);
  }, [playing]);

  const seek = useCallback((ms: number) => {
    const w = widgetRef.current;
    setPosition(ms);
    if (w) w.seekTo(ms);
  }, []);

  return (
    <PlayerContext.Provider
      value={{ current, playing, position, duration, select, toggle, seek }}
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
