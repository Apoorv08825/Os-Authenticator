import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { GlassPanel } from "../components/GlassPanel";
import { MFASettings } from "../components/MFASettings";
import { AttackControlGrid } from "../components/AttackControlGrid";
import { AuthSimulatorFlow } from "../components/AuthSimulatorFlow";
import { LogsPanel } from "../components/LogsPanel";
import { AdminDashboard } from "../components/AdminDashboard";
import { useAuth } from "../hooks/useAuth";
import { useRealtimeDashboard } from "../hooks/useRealtimeDashboard";
import { mfaService } from "../services/mfaService";
import { simulatorService } from "../services/simulatorService";
import { adminService } from "../services/adminService";

const makeLog = (status, title, description) => ({
  id: crypto.randomUUID(),
  status,
  title,
  description,
  time: new Date().toISOString()
});

export const DashboardPage = () => {
  const { user, logout, refreshUser } = useAuth();
  const [simulation, setSimulation] = useState(null);
  const [logs, setLogs] = useState([]);
  const [setupData, setSetupData] = useState(null);
  const [mfaAction, setMfaAction] = useState(null);
  const [busyType, setBusyType] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [error, setError] = useState("");
  const [adminSummary, setAdminSummary] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const isAdmin = user?.role === "admin";

  const appendLog = useCallback((status, title, description) => {
    setLogs((current) => [makeLog(status, title, description), ...current].slice(0, 60));
  }, []);

  const runAuthPipeline = useCallback(async () => {
    setBusyType("auth_flow");
    setError("");
    try {
      const response = await simulatorService.runAuthFlow({
        usernameInput: user?.email ?? "user@example.com",
        passwordInput: "********",
        forceInvalidCredentials: false
      });
      setSimulation(response);
      appendLog(
        response.result === "ACCESS_GRANTED" ? "success" : "failed",
        "OS Authentication Simulation",
        `Pipeline completed with ${response.result}.`
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyType(null);
    }
  }, [appendLog, user?.email]);

  const runAttackSimulation = async (type) => {
    setBusyType(type);
    setError("");
    try {
      const payload =
        type === "buffer_overflow"
          ? { input: "A".repeat(256) }
          : type === "privilege_escalation"
            ? { requestedRole: "admin" }
            : { bypassToken: "root::letmein" };

      const response = await simulatorService.runAttack(type, payload);
      setAlertMessage(`${response.alert}: ${response.event.description}`);
      appendLog(
        response.event.blocked ? "blocked" : "breach",
        response.event.type.replace("_", " ").toUpperCase(),
        response.event.explanation
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyType(null);
    }
  };

  const loadAdminSummary = useCallback(async () => {
    if (!isAdmin) return;
    setAdminLoading(true);
    try {
      const response = await adminService.getSummary();
      setAdminSummary(response);
    } catch (summaryError) {
      setError(summaryError.message);
    } finally {
      setAdminLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    runAuthPipeline();
    loadAdminSummary();
  }, [runAuthPipeline, loadAdminSummary]);

  const handleRealtimeEvent = useCallback(
    ({ source, payload }) => {
      appendLog("realtime", `Realtime: ${source}`, `Database event: ${payload.eventType}`);
      loadAdminSummary();
    },
    [appendLog, loadAdminSummary]
  );

  useRealtimeDashboard({
    enabled: isAdmin,
    onEvent: handleRealtimeEvent
  });

  const onSetupMfa = async () => {
    setMfaAction("setup");
    setError("");
    try {
      const response = await mfaService.setup();
      setSetupData(response);
      appendLog("success", "MFA Setup Generated", "QR code generated successfully.");
    } catch (setupError) {
      setError(setupError.message);
    } finally {
      setMfaAction(null);
    }
  };

  const onEnableMfa = async (otp) => {
    setMfaAction("enable");
    setError("");
    try {
      await mfaService.enable(otp);
      await refreshUser();
      appendLog("success", "MFA Enabled", "Multi-factor authentication is now active.");
    } catch (enableError) {
      setError(enableError.message);
    } finally {
      setMfaAction(null);
    }
  };

  const onDisableMfa = async (otp) => {
    setMfaAction("disable");
    setError("");
    try {
      await mfaService.disable(otp);
      await refreshUser();
      setSetupData(null);
      appendLog("success", "MFA Disabled", "Multi-factor authentication has been disabled.");
    } catch (disableError) {
      setError(disableError.message);
    } finally {
      setMfaAction(null);
    }
  };

  const localDashboardSummary = useMemo(
    () => ({
      metrics: {
        totalUsers: 1,
        activeSessions: 1,
        failedLoginAttempts: logs.filter((log) => log.status === "failed").length,
        blockedAttacks: logs.filter((log) => log.status === "blocked").length
      },
      charts: {
        failedLoginsOverTime: [],
        attackEventsOverTime: [],
        attackTypeDistribution: []
      },
      activeSessions: []
    }),
    [logs]
  );

  return (
    <main className="min-h-screen px-4 py-5 md:px-6">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,_rgba(61,213,243,0.12),_transparent_35%),radial-gradient(circle_at_85%_85%,_rgba(66,245,173,0.12),_transparent_35%),linear-gradient(160deg,_#040711_0%,_#071226_55%,_#03050d_100%)]" />

      <div className="relative mx-auto max-w-[1360px] space-y-4">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-panel px-5 py-4 shadow-glass backdrop-blur-xl"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-display text-xl font-semibold text-white">
                Secure Authentication Framework for Operating Systems
              </h1>
              <p className="mt-1 text-sm text-muted">
                Auth Simulation | MFA Controls | Attack Defense | Real-time Security Telemetry
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-border bg-black/25 px-3 py-2 text-xs text-white">
                <p className="font-semibold">{user?.name}</p>
                <p className="text-muted">{user?.email}</p>
                <p className="mt-1 uppercase tracking-[0.12em] text-accent">{user?.role}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-danger/40 bg-danger/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-danger"
              >
                Logout
              </button>
            </div>
          </div>
        </motion.header>

        {error ? (
          <div className="rounded-xl border border-danger/40 bg-danger/15 px-4 py-3 text-sm text-danger">{error}</div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-2">
          <GlassPanel title="Configuration" subtitle="MFA setup, OTP verification, and account security posture">
            <MFASettings
              mfaEnabled={Boolean(user?.mfaEnabled)}
              setupData={setupData}
              busyAction={mfaAction}
              onSetup={onSetupMfa}
              onEnable={onEnableMfa}
              onDisable={onDisableMfa}
            />
          </GlassPanel>

          <GlassPanel title="Control Panel" subtitle="Trigger authentication and attack simulation scenarios">
            <div className="space-y-4">
              <button
                type="button"
                onClick={runAuthPipeline}
                disabled={busyType !== null}
                className="rounded-xl border border-accent/40 bg-accent/15 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-accent disabled:opacity-50"
              >
                {busyType === "auth_flow" ? "Executing..." : "Run Authentication Simulation"}
              </button>
              <AttackControlGrid busyType={busyType} onRunAttack={runAttackSimulation} />
              {alertMessage ? (
                <div className="rounded-xl border border-warning/50 bg-warning/10 p-3 text-xs text-warning">{alertMessage}</div>
              ) : null}
            </div>
          </GlassPanel>

          <GlassPanel title="Simulator" subtitle="Step-by-step OS-level authentication execution">
            <AuthSimulatorFlow simulation={simulation} />
          </GlassPanel>

          <GlassPanel title="Logs" subtitle="Live event feed from simulation and security controls">
            <LogsPanel logs={logs} />
          </GlassPanel>

          <GlassPanel
            title="Dashboard"
            subtitle={
              isAdmin
                ? "Realtime admin intelligence from Supabase Auth, sessions, and attack telemetry"
                : "Admin-only dashboard. You are seeing local security telemetry."
            }
            className="xl:col-span-2"
          >
            <AdminDashboard summary={isAdmin ? adminSummary : localDashboardSummary} loading={adminLoading} />
          </GlassPanel>
        </div>
      </div>
    </main>
  );
};
