type Props = { open: boolean };

/** The room's state indicator: pulses continuously while the club is playing. */
export function ClubStatus({ open }: Props) {
  return (
    <div
      className="inline-flex items-center gap-3 border px-4 py-2"
      style={{
        borderRadius: 999,
        borderColor: open ? "color-mix(in oklab, var(--club-accent) 60%, transparent)" : "var(--club-line)",
        background: open ? "color-mix(in oklab, var(--club-accent) 12%, transparent)" : "transparent",
        transition: "background 1.2s ease, border-color 1.2s ease",
      }}
    >
      <span className="relative flex h-2.5 w-2.5 items-center justify-center">
        {open && (
          <span
            className="club-halo absolute inset-0 rounded-full"
            style={{ background: "var(--club-accent)" }}
          />
        )}
        <span
          className={`relative h-2.5 w-2.5 rounded-full ${open ? "club-lamp" : ""}`}
          style={{
            background: open ? "var(--club-accent)" : "transparent",
            border: open ? "none" : "1px solid var(--club-dim)",
            boxShadow: open ? "0 0 16px var(--club-accent)" : "none",
          }}
        />
      </span>
      <span
        className="font-mono text-[11px] uppercase tracking-[0.34em]"
        style={{ color: open ? "var(--club-ink)" : "var(--club-dim)" }}
      >
        {open ? "Club open" : "Club paused"}
      </span>
    </div>
  );
}
