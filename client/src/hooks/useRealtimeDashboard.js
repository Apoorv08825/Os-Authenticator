import { useEffect } from "react";
import { supabase } from "../utils/supabase";

export const useRealtimeDashboard = ({ enabled, onEvent }) => {
  useEffect(() => {
    if (!enabled || typeof onEvent !== "function") {
      return undefined;
    }

    const attackChannel = supabase
      .channel("attack-log-stream")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attack_logs" },
        (payload) => onEvent({ source: "attack_logs", payload })
      )
      .subscribe();

    const authChannel = supabase
      .channel("auth-log-stream")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "auth_logs" },
        (payload) => onEvent({ source: "auth_logs", payload })
      )
      .subscribe();

    const sessionChannel = supabase
      .channel("session-stream")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions" },
        (payload) => onEvent({ source: "sessions", payload })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(attackChannel);
      supabase.removeChannel(authChannel);
      supabase.removeChannel(sessionChannel);
    };
  }, [enabled, onEvent]);
};
