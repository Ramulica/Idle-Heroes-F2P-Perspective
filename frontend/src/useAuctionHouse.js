import { useCallback, useEffect, useState } from "react";
import {
  defaultAuctionState,
  normalizeAuctionState,
  readAuctionState,
  writeAuctionState,
} from "./auctionHouse";

export function useAuctionHouse() {
  const [state, setStateRaw] = useState(() => defaultAuctionState());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setStateRaw(readAuctionState());
    setLoaded(true);
  }, []);

  const setState = useCallback((updater) => {
    setStateRaw((prev) => {
      const next =
        typeof updater === "function"
          ? updater(prev)
          : normalizeAuctionState(updater);
      const normalized = normalizeAuctionState(next);
      writeAuctionState(normalized);
      return normalized;
    });
  }, []);

  return { state, setState, loaded };
}
