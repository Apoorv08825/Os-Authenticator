import bcrypt from "bcrypt";
import speakeasy from "speakeasy";
import { z } from "zod";
import { supabaseAdmin, supabaseAuth } from "../utils/supabase.js";
import { logAuthEvent } from "../utils/logger.js";
import { generateAccessToken } from "../utils/token.js";

const signupSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  otp: z.string().optional()
});

const fetchProfile = async (userId) => {
  if (!userId) {
    return null;
  }

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, name, role, mfa_enabled, mfa_secret")
    .eq("id", userId)
    .maybeSingle();

  return data ?? null;
};

const createSession = async ({ userId, email, jwtId, ip, userAgent, expiresAt }) => {
  const { error } = await supabaseAdmin.from("sessions").insert({
    user_id: userId,
    email,
    jwt_id: jwtId,
    active: true,
    ip_address: ip,
    user_agent: userAgent,
    created_at: new Date().toISOString(),
    expires_at: expiresAt
  });
  if (error) console.error("Failed to create session:", error.message);
};

const invalidCredentials = async (res, ipAddress, email, userId = null) => {
  await logAuthEvent({
    userId,
    action: "login",
    status: "failed",
    ip: ipAddress,
    details: { email }
  });
  return res.status(401).json({ message: "Invalid credentials." });
};

export const signup = async (req, res, next) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }

    const { name, email, password } = parsed.data;

    const { data, error } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (error || !data.user) {
      await logAuthEvent({
        action: "signup",
        status: "failed",
        ip: req.ip,
        details: { email, reason: error?.message ?? "Unknown signup error" }
      });
      return res.status(400).json({ message: error?.message ?? "Unable to sign up user." });
    }

    const user = data.user;
    const passwordHash = await bcrypt.hash(password, 12);

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: user.id,
        name,
        role: "user",
        mfa_enabled: false
      },
      { onConflict: "id" }
    );
    if (profileError) throw new Error(`Profile creation failed: ${profileError.message}`);

    const { error: credentialsError } = await supabaseAdmin.from("local_credentials").upsert(
      {
        user_id: user.id,
        email,
        name,
        password_hash: passwordHash
      },
      { onConflict: "email" }
    );
    if (credentialsError) throw new Error(`Local credentials creation failed: ${credentialsError.message}`);

    await logAuthEvent({
      userId: user.id,
      action: "signup",
      status: "success",
      ip: req.ip,
      details: { email }
    });

    return res.status(201).json({
      message: "Signup successful. Please verify your email if email confirmation is enabled.",
      userId: user.id
    });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }

    const { email, password, otp } = parsed.data;
    const ipAddress = req.ip;

    let user = null;
    let session = null;
    let profile = null;
    let isFallbackAuth = false;

    const { data: supabaseData, error: supabaseError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password
    });

    if (!supabaseError && supabaseData?.user) {
      user = supabaseData.user;
      session = supabaseData.session;
      profile = await fetchProfile(user.id);
    } else {
      const { data: fallbackCredentials, error: fallbackError } = await supabaseAdmin
        .from("local_credentials")
        .select("user_id, email, name, password_hash")
        .eq("email", email)
        .maybeSingle();

      if (fallbackError || !fallbackCredentials) {
        return invalidCredentials(res, ipAddress, email);
      }

      const passwordOk = await bcrypt.compare(password, fallbackCredentials.password_hash);
      if (!passwordOk) {
        return invalidCredentials(res, ipAddress, email, fallbackCredentials.user_id);
      }

      isFallbackAuth = true;
      user = {
        id: fallbackCredentials.user_id,
        email: fallbackCredentials.email,
        user_metadata: {
          name: fallbackCredentials.name
        }
      };
      profile = await fetchProfile(user.id);
    }

    if (!user) {
      return invalidCredentials(res, ipAddress, email);
    }

    const role = profile?.role ?? "user";
    const mfaEnabled = Boolean(profile?.mfa_enabled);
    const mfaSecret = profile?.mfa_secret;

    if (mfaEnabled) {
      if (!otp) {
        return res.status(200).json({
          mfaRequired: true,
          message: "MFA verification required. Please provide your OTP."
        });
      }

      const tokenValid = speakeasy.totp.verify({
        secret: mfaSecret,
        encoding: "base32",
        token: otp,
        window: 1
      });

      if (!tokenValid) {
        await logAuthEvent({
          userId: user.id,
          action: "login",
          status: "failed",
          ip: ipAddress,
          details: { reason: "Invalid MFA token", email }
        });
        return res.status(401).json({ message: "Invalid MFA token." });
      }
    }

    const { token, jwtId, expiresAt } = generateAccessToken({
      sub: user.id ?? user.email,
      userId: user.id ?? null,
      email: user.email,
      role
    });

    await createSession({
      userId: user.id ?? null,
      email: user.email,
      jwtId,
      ip: ipAddress,
      userAgent: req.headers["user-agent"] ?? null,
      expiresAt
    });

    await logAuthEvent({
      userId: user.id,
      action: "login",
      status: "success",
      ip: ipAddress,
      details: { email, isFallbackAuth }
    });

    return res.status(200).json({
      token,
      user: {
        id: user.id ?? null,
        email: user.email,
        name: profile?.name ?? user.user_metadata?.name ?? "Anonymous User",
        role,
        mfaEnabled
      },
      supabaseSession: session
        ? {
            access_token: session.access_token,
            refresh_token: session.refresh_token
          }
        : null
    });
  } catch (error) {
    return next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    await supabaseAdmin
      .from("sessions")
      .update({
        active: false,
        revoked_at: new Date().toISOString()
      })
      .eq("jwt_id", req.user.jti);

    await logAuthEvent({
      userId: req.user.userId,
      action: "logout",
      status: "success",
      ip: req.ip,
      details: { email: req.user.email }
    });

    return res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    return next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const profile = await fetchProfile(req.user.userId);

    return res.status(200).json({
      user: {
        id: req.user.userId,
        email: req.user.email,
        role: req.user.role,
        name: profile?.name ?? "Anonymous User",
        mfaEnabled: Boolean(profile?.mfa_enabled)
      }
    });
  } catch (error) {
    return next(error);
  }
};
