import { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { GUEST_SG_KEY, useAuth } from "./auth";
import { hasHeroUpgradeProgress, normalizeHeroUpgrade } from "./heroUpgrade";
import { DEFAULT_STATE, calculateSg } from "./sgCalc";

let current = { ...DEFAULT_STATE };
let storeLoaded = false;
let canSave = false;
let guestMode = null;
let loadToken = 0;
let saveTimer = null;
const listeners = new Set();

function emit() {
  listeners.forEach((fn) => fn());
}

function mergeState(saved) {
  const incoming = saved && typeof saved === "object" ? saved : {};
  return {
    ...DEFAULT_STATE,
    ...incoming,
    heroUpgrade: normalizeHeroUpgrade({
      ...DEFAULT_STATE.heroUpgrade,
      ...(incoming.heroUpgrade && typeof incoming.heroUpgrade === "object"
        ? incoming.heroUpgrade
        : {}),
    }),
  };
}

function readGuestState() {
  try {
    const raw = sessionStorage.getItem(GUEST_SG_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistGuest(state) {
  sessionStorage.setItem(GUEST_SG_KEY, JSON.stringify(state));
}

export function flushSgCalcSave() {
  window.clearTimeout(saveTimer);
  saveTimer = null;
  if (!canSave) return Promise.resolve();
  if (guestMode) {
    persistGuest(current);
    return Promise.resolve();
  }
  return api.saveSgCalc(current).catch(() => {});
}

export function resetSgCalcStore() {
  window.clearTimeout(saveTimer);
  saveTimer = null;
  current = { ...DEFAULT_STATE };
  storeLoaded = false;
  canSave = false;
  guestMode = null;
  loadToken += 1;
  emit();
}

function scheduleSave() {
  if (!canSave) return;
  if (guestMode) {
    persistGuest(current);
    return;
  }
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    saveTimer = null;
    api.saveSgCalc(current).catch(() => {});
  }, 400);
}

function applyPatch(partial) {
  current = {
    ...current,
    ...partial,
    heroUpgrade:
      partial.heroUpgrade === undefined
        ? current.heroUpgrade
        : normalizeHeroUpgrade(partial.heroUpgrade),
  };
  emit();
  scheduleSave();
}

function ensureLoaded(guest) {
  if (storeLoaded && guestMode === guest) return;
  const token = ++loadToken;
  guestMode = guest;
  storeLoaded = false;
  canSave = false;
  emit();

  if (guest) {
    current = mergeState(readGuestState());
    storeLoaded = true;
    canSave = true;
    emit();
    return;
  }

  api
    .getSgCalc()
    .then((payload) => {
      if (token !== loadToken) return;
      const server = mergeState(payload.state || {});
      const guestSaved = mergeState(readGuestState());
      if (
        !hasHeroUpgradeProgress(server.heroUpgrade) &&
        hasHeroUpgradeProgress(guestSaved.heroUpgrade)
      ) {
        server.heroUpgrade = guestSaved.heroUpgrade;
      }
      current = server;
      storeLoaded = true;
      canSave = true;
      emit();
      if (hasHeroUpgradeProgress(current.heroUpgrade)) {
        scheduleSave();
      }
    })
    .catch(() => {
      if (token !== loadToken) return;
      storeLoaded = true;
      canSave = false;
      emit();
    });
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    flushSgCalcSave();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushSgCalcSave();
    }
  });
}

export function useSgCalc() {
  const guest = Boolean(useAuth()?.user?.guest);
  const [state, setState] = useState(current);
  const [loaded, setLoaded] = useState(storeLoaded);
  const result = useMemo(() => calculateSg(state), [state]);

  useEffect(() => {
    const sync = () => {
      setState(current);
      setLoaded(storeLoaded);
    };
    listeners.add(sync);
    ensureLoaded(guest);
    sync();
    return () => {
      listeners.delete(sync);
      flushSgCalcSave();
    };
  }, [guest]);

  function patch(partial) {
    applyPatch(partial);
  }

  return { guest, state, patch, loaded, result };
}
