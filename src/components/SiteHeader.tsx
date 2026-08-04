import { Link, useRouterState } from "@tanstack/react-router";

const tabs = [
  { to: "/", label: "Archive" },
  { to: "/radio", label: "Radio" },
] as const;

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
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
                    ? "bg-foreground text-background"
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
