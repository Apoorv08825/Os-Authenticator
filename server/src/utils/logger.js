import { supabaseAdmin } from "./supabase.js";

export const logAuthEvent = async ({
  userId = null,
  action,
  status,
  ip = null,
  details = {}
}) => {
  try {
    await supabaseAdmin.from("auth_logs").insert({
      user_id: userId,
      action,
      status,
      ip_address: ip,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to log auth event:", error.message);
  }
};

export const logAttackEvent = async ({
  userId = null,
  type,
  description,
  severity,
  blocked,
  metadata = {}
}) => {
  try {
    await supabaseAdmin.from("attack_logs").insert({
      user_id: userId,
      type,
      description,
      severity,
      blocked,
      metadata,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to log attack event:", error.message);
  }
};
