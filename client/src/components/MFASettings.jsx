import { useState } from "react";

export const MFASettings = ({
  mfaEnabled,
  setupData,
  busyAction,
  onSetup,
  onEnable,
  onDisable
}) => {
  const [otp, setOtp] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-border bg-black/20 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted">MFA Status</p>
          <p className={`mt-1 text-sm font-semibold ${mfaEnabled ? "text-accent2" : "text-warning"}`}>
            {mfaEnabled ? "Enabled" : "Disabled"}
          </p>
        </div>

        <button
          type="button"
          onClick={onSetup}
          disabled={busyAction !== null}
          className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent transition hover:bg-accent/20 disabled:opacity-50"
        >
          {busyAction === "setup" ? "Generating..." : "Generate QR"}
        </button>
      </div>

      {setupData?.qrCode ? (
        <div className="grid gap-3 md:grid-cols-[120px_1fr]">
          <img src={setupData.qrCode} alt="MFA QR code" className="h-[120px] w-[120px] rounded-lg border border-border" />
          <div className="rounded-lg border border-border bg-black/20 p-3">
            <p className="text-xs text-muted">Manual Key</p>
            <p className="mt-1 break-all font-mono text-xs text-white">{setupData.manualSecret}</p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 md:flex-row">
        <input
          type="text"
          value={otp}
          onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="Enter 6-digit OTP"
          className="w-full rounded-lg border border-border bg-black/25 px-3 py-2 text-sm text-white outline-none transition focus:border-accent/70"
        />
        <button
          type="button"
          onClick={() => {
            if (!otp) return;
            onEnable(otp);
            setOtp("");
          }}
          disabled={busyAction !== null}
          className="rounded-lg border border-accent2/40 bg-accent2/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent2 disabled:opacity-50"
        >
          {busyAction === "enable" ? "Enabling..." : "Enable MFA"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (!otp) return;
            onDisable(otp);
            setOtp("");
          }}
          disabled={busyAction !== null || !mfaEnabled}
          className="rounded-lg border border-danger/40 bg-danger/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-danger disabled:opacity-50"
        >
          {busyAction === "disable" ? "Disabling..." : "Disable MFA"}
        </button>
      </div>
    </div>
  );
};
