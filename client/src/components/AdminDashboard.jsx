import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { MetricCard } from "./MetricCard";

const PIE_COLORS = ["#3dd5f3", "#42f5ad", "#ff6b81", "#ffb020"];

export const AdminDashboard = ({ summary, loading }) => {
  if (loading) {
    return <p className="text-sm text-muted">Loading admin dashboard...</p>;
  }

  if (!summary) {
    return <p className="text-sm text-muted">Admin telemetry is unavailable.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Users" value={summary.metrics.totalUsers} />
        <MetricCard label="Active Sessions" value={summary.metrics.activeSessions} accent="text-accent2" />
        <MetricCard label="Failed Logins" value={summary.metrics.failedLoginAttempts} accent="text-warning" />
        <MetricCard label="Blocked Attacks" value={summary.metrics.blockedAttacks} accent="text-danger" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-border bg-black/20 p-3 xl:col-span-2">
          <p className="mb-3 text-xs uppercase tracking-[0.14em] text-muted">Failed Login Attempts</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.charts.failedLoginsOverTime}>
                <defs>
                  <linearGradient id="failedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff6b81" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#ff6b81" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(159, 184, 222, 0.12)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#9fb8de", fontSize: 11 }} />
                <YAxis tick={{ fill: "#9fb8de", fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0a1224", border: "1px solid rgba(126, 177, 255, 0.25)" }} />
                <Area dataKey="count" type="monotone" stroke="#ff6b81" fill="url(#failedGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-black/20 p-3">
          <p className="mb-3 text-xs uppercase tracking-[0.14em] text-muted">Attack Types</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary.charts.attackTypeDistribution}
                  dataKey="count"
                  nameKey="type"
                  outerRadius={80}
                  innerRadius={40}
                >
                  {summary.charts.attackTypeDistribution.map((entry, index) => (
                    <Cell key={entry.type} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#0a1224", border: "1px solid rgba(126, 177, 255, 0.25)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-black/20 p-3">
          <p className="mb-3 text-xs uppercase tracking-[0.14em] text-muted">Attack Events Over Time</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.charts.attackEventsOverTime}>
                <CartesianGrid stroke="rgba(159, 184, 222, 0.12)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#9fb8de", fontSize: 11 }} />
                <YAxis tick={{ fill: "#9fb8de", fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0a1224", border: "1px solid rgba(126, 177, 255, 0.25)" }} />
                <Bar dataKey="count" fill="#3dd5f3" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-black/20 p-3">
          <p className="mb-3 text-xs uppercase tracking-[0.14em] text-muted">Active Sessions</p>
          <div className="max-h-[200px] overflow-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/60 text-muted">
                  <th className="pb-2">Email</th>
                  <th className="pb-2">IP</th>
                  <th className="pb-2">Started</th>
                </tr>
              </thead>
              <tbody>
                {summary.activeSessions.slice(0, 8).map((session) => (
                  <tr key={session.id} className="border-b border-border/40 text-white">
                    <td className="py-2">{session.email || "Unknown"}</td>
                    <td className="py-2 text-muted">{session.ip_address || "-"}</td>
                    <td className="py-2 text-muted">{new Date(session.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-border bg-black/20 p-3">
          <p className="mb-3 text-xs uppercase tracking-[0.14em] text-muted">Users</p>
          <div className="max-h-[220px] overflow-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/60 text-muted">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Role</th>
                  <th className="pb-2">MFA</th>
                </tr>
              </thead>
              <tbody>
                {summary.users?.slice(0, 10).map((user) => (
                  <tr key={user.id} className="border-b border-border/40 text-white">
                    <td className="py-2">{user.name}</td>
                    <td className="py-2 uppercase text-muted">{user.role}</td>
                    <td className="py-2">{user.mfa_enabled ? "On" : "Off"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-black/20 p-3">
          <p className="mb-3 text-xs uppercase tracking-[0.14em] text-muted">Failed Login Attempts</p>
          <div className="max-h-[220px] overflow-auto space-y-2">
            {summary.failedLoginAttempts?.slice(0, 10).map((entry) => (
              <div key={entry.id} className="rounded-lg border border-border/50 bg-black/30 p-2">
                <p className="text-[11px] text-warning">{new Date(entry.timestamp).toLocaleString()}</p>
                <p className="mt-1 text-xs text-white">Action: {entry.action}</p>
                <p className="text-xs text-muted">{entry.details?.email || "Unknown user"}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-black/20 p-3">
          <p className="mb-3 text-xs uppercase tracking-[0.14em] text-muted">Attack Logs</p>
          <div className="max-h-[220px] overflow-auto space-y-2">
            {summary.attackLogs?.slice(0, 10).map((entry) => (
              <div key={entry.id} className="rounded-lg border border-border/50 bg-black/30 p-2">
                <p className="text-[11px] text-danger">{new Date(entry.timestamp).toLocaleString()}</p>
                <p className="mt-1 text-xs text-white">
                  {entry.type} | Severity: {entry.severity}
                </p>
                <p className="text-xs text-muted">{entry.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
