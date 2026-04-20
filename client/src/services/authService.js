import { apiRequest } from "./api";
import { supabase } from "../utils/supabase";

export const authService = {
  signup: (payload) => apiRequest("/auth/signup", { method: "POST", body: payload }),
  login: (payload) => apiRequest("/auth/login", { method: "POST", body: payload }),
  logout: async () => {
    await apiRequest("/auth/logout", { method: "POST" });
    await supabase.auth.signOut();
  },
  me: () => apiRequest("/auth/me")
};
