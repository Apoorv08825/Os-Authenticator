import { supabaseAdmin } from "../utils/supabase.js";

const toDayKey = (isoDate) => new Date(isoDate).toISOString().slice(0, 10);

const buildDailySeries = (logs, field = "timestamp") => {
  const grouped = logs.reduce((acc, item) => {
    const key = toDayKey(item[field]);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped)
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([date, count]) => ({ date, count }));
};

export const getAdminSummary = async (_req, res, next) => {
  try {
    const [profilesRes, sessionsRes, failedRes, attackRes, credentialRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, name, role, mfa_enabled").order("name", { ascending: true }),
      supabaseAdmin
        .from("sessions")
        .select("id, user_id, email, ip_address, user_agent, created_at, expires_at")
        .eq("active", true)
        .is("revoked_at", null)
        .order("created_at", { ascending: false })
        .limit(100),
      supabaseAdmin
        .from("auth_logs")
        .select("id, user_id, action, status, timestamp, details")
        .eq("action", "login")
        .eq("status", "failed")
        .order("timestamp", { ascending: false })
        .limit(100),
      supabaseAdmin
        .from("attack_logs")
        .select("id, user_id, type, description, severity, blocked, timestamp")
        .order("timestamp", { ascending: false })
        .limit(200),
      supabaseAdmin.from("local_credentials").select("user_id, email")
    ]);

    if (profilesRes.error || sessionsRes.error || failedRes.error || attackRes.error || credentialRes.error) {
      return res.status(500).json({
        message: "Failed to query admin dashboard data.",
        errors: [
          profilesRes.error?.message,
          sessionsRes.error?.message,
          failedRes.error?.message,
          attackRes.error?.message,
          credentialRes.error?.message
        ].filter(Boolean)
      });
    }

    const credentialsByUser = (credentialRes.data ?? []).reduce((acc, row) => {
      if (row.user_id) {
        acc[row.user_id] = row.email;
      }
      return acc;
    }, {});

    const users = (profilesRes.data ?? []).map((profile) => ({
      ...profile,
      email: credentialsByUser[profile.id] ?? null
    }));

    const attackByType = (attackRes.data ?? []).reduce((acc, row) => {
      acc[row.type] = (acc[row.type] || 0) + 1;
      return acc;
    }, {});

    const attackTypeSeries = Object.entries(attackByType).map(([type, count]) => ({ type, count }));

    return res.status(200).json({
      metrics: {
        totalUsers: users.length,
        activeSessions: sessionsRes.data?.length ?? 0,
        failedLoginAttempts: failedRes.data?.length ?? 0,
        blockedAttacks: (attackRes.data ?? []).filter((item) => item.blocked).length
      },
      users,
      activeSessions: sessionsRes.data ?? [],
      failedLoginAttempts: failedRes.data ?? [],
      attackLogs: attackRes.data ?? [],
      charts: {
        failedLoginsOverTime: buildDailySeries(failedRes.data ?? []),
        attackEventsOverTime: buildDailySeries(attackRes.data ?? []),
        attackTypeDistribution: attackTypeSeries
      }
    });
  } catch (error) {
    return next(error);
  }
};
