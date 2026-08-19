import { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { GUEST_SG_KEY, useAuth } from "./auth";
import { DEFAULT_STATE, calculateSg } from "./sgCalc";

export function useSgCalc() {
  const guest = Boolean(useAuth()?.user?.guest);
  const [state, setState] = useState(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const result = useMemo(() => calculateSg(state), [state]);

  useEffect(() => {
    let cancelled = false;
    if (guest) {
      try {
        const raw = sessionStorage.getItem(GUEST_SG_KEY);
        if (raw && !cancelled) {
          setState({ ...DEFAULT_STATE, ...JSON.parse(raw) });
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) setLoaded(true);
      return () => {
        cancelled = true;
      };
    }
    api
      .getSgCalc()
      .then((payload) => {
        if (!cancelled) {
          setState({ ...DEFAULT_STATE, ...(payload.state || {}) });
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [guest]);

  useEffect(() => {
    if (!loaded) return;
    if (guest) {
      sessionStorage.setItem(GUEST_SG_KEY, JSON.stringify(state));
      return undefined;
    }
    const timer = setTimeout(() => {
      api.saveSgCalc(state).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [state, loaded, guest]);

  function patch(partial) {
    setState((current) => ({ ...current, ...partial }));
  }

  return { guest, state, patch, loaded, result };
}
