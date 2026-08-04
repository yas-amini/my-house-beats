import { useEffect, useRef } from "react";
import { countsByYear, maxYearCount, years } from "@/lib/tracks";

type Props = {
  value: number | null;
  onChange: (year: number | null) => void;
};

export function Timeline({ value, onChange }: Props) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!activeRef.current || !railRef.current) return;
    activeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [value]);

  const step = (dir: 1 | -1) => {
    if (value == null) {
      onChange(years[dir === 1 ? 0 : years.length - 1] ?? null);
      return;
    }
    const i = years.indexOf(value);
    const nextYear = years[i + dir];
    onChange(nextYear ?? value);
  };

  return (
    <div className="border-y border-border py-4">
      <div className="flex items-baseline justify-between gap-4 px-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Release timeline
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => step(-1)}
            aria-label="Earlier year"
            className="rounded-md border border-border px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            ←
          </button>
          <button
            onClick={() => step(1)}
            aria-label="Later year"
            className="rounded-md border border-border px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            →
          </button>
          <button
            onClick={() => onChange(null)}
            className={`ml-2 rounded-md border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
              value == null
                ? "border-primary text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            All years
          </button>
        </div>
      </div>

      <div
        ref={railRef}
        className="mt-3 flex snap-x items-end gap-px overflow-x-auto pb-1 [scrollbar-width:thin]"
      >
        {years.map((y) => {
          const count = countsByYear[y] ?? 0;
          const h = 8 + Math.round((count / maxYearCount) * 46);
          const active = value === y;
          const decade = y % 5 === 0;
          return (
            <button
              key={y}
              ref={active ? activeRef : null}
              onClick={() => onChange(active ? null : y)}
              title={`${y} · ${count} track${count === 1 ? "" : "s"}`}
              aria-pressed={active}
              className="group flex w-7 shrink-0 snap-center flex-col items-center gap-2 pt-2"
            >
              <span
                style={{ height: h }}
                className={`w-2 rounded-full transition-[height,background-color,transform] duration-500 ease-out ${
                  active
                    ? "scale-x-150 bg-primary"
                    : value == null
                      ? "bg-foreground/25 group-hover:bg-primary/60"
                      : "bg-foreground/12 group-hover:bg-primary/50"
                }`}
              />
              <span
                className={`font-mono text-[9px] tabular-nums transition-colors ${
                  active
                    ? "text-primary"
                    : decade
                      ? "text-muted-foreground"
                      : "text-transparent group-hover:text-muted-foreground"
                }`}
              >
                {decade || active ? `'${String(y).slice(2)}` : "·"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
