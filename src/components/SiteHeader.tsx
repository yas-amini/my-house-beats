import { Link, useRouterState } from "@tanstack/react-router";

const tabs = [
  { to: "/", label: "Archive" },
  { to: "/club", label: "Club" },
] as const;

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const onAir = pathname.startsWith("/club");

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur ${
        onAir ? "club border-[var(--club-line)]" : "border-border bg-background/85"
      }`}
      style={onAir ? { backgroundColor: "color-mix(in oklab, var(--club-bg) 82%, transparent)" } : undefined}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-3">
        <Link to="/" className="font-display text-2xl leading-none tracking-wide">
          My House
        </Link>
        <nav className="flex items-center gap-1">
          {tabs.map((t) => {
            const active = t.to === "/" ? pathname === "/" : pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`rounded-full px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors ${
                  active
                    ? onAir
                      ? "bg-[var(--club-accent)] text-[#160d08]"
                      : "bg-foreground text-background"
                    : onAir
                      ? "text-[var(--club-dim)] hover:text-[var(--club-ink)]"
                      : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
