import { useCallback, useEffect, useState } from "react";
import { api, type SessionPayload } from "../api/client";

/** Loads today's shared session from the API and lets callers apply
 * the fresh payload returned by each mutating endpoint. */
export function useSession() {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setSession(await api.getSession());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load session");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { session, setSession, loading, error, refresh };
}
