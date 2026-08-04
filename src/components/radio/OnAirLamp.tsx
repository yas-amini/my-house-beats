type Props = { live: boolean };

/** Studio ON AIR lamp. Pulses continuously while the station transmits. */
export function OnAirLamp({ live }: Props) {
  return (
    <div
      className={`inline-flex items-center gap-3 border px-4 py-2 ${
        live ? "border-[var(--studio-live)]" : "border-[var(--studio-line)]"
      }`}
      style={{ borderRadius: 999 }}
    >
      <span className="relative flex h-2.5 w-2.5 items-center justify-center">
        {live && (
          <span
            className="studio-halo absolute inset-0 rounded-full"
            style={{ background: "var(--studio-live)" }}
          />
        )}
        <span
          className={`relative h-2.5 w-2.5 rounded-full ${live ? "studio-lamp" : ""}`}
          style={{
            background: live ? "var(--studio-live)" : "var(--studio-dim)",
            boxShadow: live ? "0 0 14px var(--studio-live)" : "none",
          }}
        />
      </span>
      <span
        className="font-mono text-[11px] uppercase tracking-[0.34em]"
        style={{ color: live ? "var(--studio-ink)" : "var(--studio-dim)" }}
      >
        {live ? "On air" : "Off air"}
      </span>
    </div>
  );
}
