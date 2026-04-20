const attackOptions = [
  {
    type: "buffer_overflow",
    title: "Buffer Overflow",
    detail: "Oversized input attack. System should reject pre-kernel.",
    accent: "border-warning/40 text-warning"
  },
  {
    type: "privilege_escalation",
    title: "Privilege Escalation",
    detail: "Role manipulation attempt to bypass RBAC.",
    accent: "border-danger/40 text-danger"
  },
  {
    type: "trapdoor_backdoor",
    title: "Trapdoor / Backdoor",
    detail: "Hidden bypass route simulation with anomaly alert.",
    accent: "border-accent/40 text-accent"
  }
];

export const AttackControlGrid = ({ busyType, onRunAttack }) => (
  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
    {attackOptions.map((option) => (
      <button
        key={option.type}
        type="button"
        onClick={() => onRunAttack(option.type)}
        disabled={busyType !== null}
        className={`aspect-square rounded-xl border bg-black/20 p-4 text-left transition hover:-translate-y-0.5 hover:bg-black/30 disabled:cursor-not-allowed disabled:opacity-50 ${option.accent}`}
      >
        <p className="font-display text-sm font-semibold">{option.title}</p>
        <p className="mt-2 text-xs text-muted">{option.detail}</p>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.12em]">
          {busyType === option.type ? "Running..." : "Simulate"}
        </p>
      </button>
    ))}
  </div>
);
