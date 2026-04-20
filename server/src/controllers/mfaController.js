import qrcode from "qrcode";
import speakeasy from "speakeasy";
import { z } from "zod";
import { supabaseAdmin } from "../utils/supabase.js";
import { logAuthEvent } from "../utils/logger.js";

const tokenSchema = z.object({
  token: z.string().min(6).max(6)
});

const getProfileSecret = async (userId) => {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, mfa_enabled, mfa_secret")
    .eq("id", userId)
    .maybeSingle();

  return data ?? null;
};

export const setupMfa = async (req, res, next) => {
  try {
    if (!req.user.userId) {
      return res.status(400).json({ message: "MFA requires a Supabase-backed account." });
    }

    const secret = speakeasy.generateSecret({
      name: `SecureAuthFramework (${req.user.email})`,
      length: 32
    });

    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);

    await supabaseAdmin
      .from("profiles")
      .update({
        mfa_secret: secret.base32,
        mfa_enabled: false
      })
      .eq("id", req.user.userId);

    await logAuthEvent({
      userId: req.user.userId,
      action: "mfa_setup",
      status: "success",
      ip: req.ip,
      details: {}
    });

    return res.status(200).json({
      qrCode: qrCodeDataUrl,
      manualSecret: secret.base32,
      message: "Scan the QR code in Google Authenticator, then verify OTP to enable MFA."
    });
  } catch (error) {
    return next(error);
  }
};

export const enableMfa = async (req, res, next) => {
  try {
    const parsed = tokenSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "A valid 6-digit token is required." });
    }

    const profile = await getProfileSecret(req.user.userId);
    if (!profile?.mfa_secret) {
      return res.status(400).json({ message: "MFA setup not initialized." });
    }

    const tokenValid = speakeasy.totp.verify({
      secret: profile.mfa_secret,
      encoding: "base32",
      token: parsed.data.token,
      window: 1
    });

    if (!tokenValid) {
      await logAuthEvent({
        userId: req.user.userId,
        action: "mfa_enable",
        status: "failed",
        ip: req.ip,
        details: { reason: "Invalid TOTP token" }
      });
      return res.status(401).json({ message: "Invalid OTP." });
    }

    await supabaseAdmin
      .from("profiles")
      .update({
        mfa_enabled: true
      })
      .eq("id", req.user.userId);

    await logAuthEvent({
      userId: req.user.userId,
      action: "mfa_enable",
      status: "success",
      ip: req.ip,
      details: {}
    });

    return res.status(200).json({ message: "MFA enabled successfully." });
  } catch (error) {
    return next(error);
  }
};

export const disableMfa = async (req, res, next) => {
  try {
    const parsed = tokenSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "A valid 6-digit token is required to disable MFA." });
    }

    const profile = await getProfileSecret(req.user.userId);
    if (!profile?.mfa_enabled || !profile?.mfa_secret) {
      return res.status(400).json({ message: "MFA is not enabled for this account." });
    }

    const tokenValid = speakeasy.totp.verify({
      secret: profile.mfa_secret,
      encoding: "base32",
      token: parsed.data.token,
      window: 1
    });

    if (!tokenValid) {
      await logAuthEvent({
        userId: req.user.userId,
        action: "mfa_disable",
        status: "failed",
        ip: req.ip,
        details: { reason: "Invalid TOTP token" }
      });
      return res.status(401).json({ message: "Invalid OTP." });
    }

    await supabaseAdmin
      .from("profiles")
      .update({
        mfa_enabled: false,
        mfa_secret: null
      })
      .eq("id", req.user.userId);

    await logAuthEvent({
      userId: req.user.userId,
      action: "mfa_disable",
      status: "success",
      ip: req.ip,
      details: {}
    });

    return res.status(200).json({ message: "MFA disabled successfully." });
  } catch (error) {
    return next(error);
  }
};
