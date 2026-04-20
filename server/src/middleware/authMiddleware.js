import { supabaseAdmin } from "../utils/supabase.js";
import { verifyAccessToken } from "../utils/token.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing Bearer token." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    const { data: session, error } = await supabaseAdmin
      .from("sessions")
      .select("jwt_id, active, revoked_at")
      .eq("jwt_id", decoded.jti)
      .maybeSingle();

    if (error || !session || !session.active || session.revoked_at) {
      return res.status(401).json({ message: "Session has expired or was revoked." });
    }

    req.user = decoded;
    req.token = token;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions for this resource." });
    }
    return next();
  };
