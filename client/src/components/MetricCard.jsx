export const MetricCard = ({ label, value, accent = "text-accent" }) => (
  <div className="rounded-xl border border-border bg-black/20 p-4">
    <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
    <p className={`mt-2 font-display text-2xl font-semibold ${accent}`}>{value}</p>
  </div>
);
