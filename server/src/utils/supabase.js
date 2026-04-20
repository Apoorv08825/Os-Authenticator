import { createClient } from "@supabase/supabase-js";

console.log("SUPABASE_URL evaluates to:", process.env.SUPABASE_URL);
const SUPABASE_URL = process.env.SUPABASE_URL || "https://YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "YOUR_SUPABASE_SERVICE_ROLE_KEY";

const commonOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
};

export const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, commonOptions);
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, commonOptions);

export const isSupabasePlaceholderConfig =
  SUPABASE_URL.includes("YOUR_SUPABASE_URL") ||
  SUPABASE_ANON_KEY === "YOUR_SUPABASE_ANON_KEY" ||
  SUPABASE_SERVICE_ROLE_KEY === "YOUR_SUPABASE_SERVICE_ROLE_KEY";
