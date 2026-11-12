import { useEffect, useState } from "react";
import { api } from "./api";
import { useAuth } from "./auth";
import {
  defaultStatCalculator,
  hasStatCalculatorProgress,
  normalizeStatCalculator,
  readStatCalculator,
  writeStatCalculator,
} from "./statCalculator";

let current = defaultStatCalculator();
let storeLoaded = false;
let canSave = false;
let guestMode = null;
let loadToken = 0;
let saveTimer = null;
const listeners = new Set();

function emit() {
  listeners.forEach((fn) => fn());
}

function persistLocal(state) {
  writeStatCalculator(state);
}

export function flushStatCalcSave() {
  window.clearTimeout(saveTimer);
  saveTimer = null;
  if (!canSave) return Promise.resolve();
  if (guestMode) {
    persistLocal(current);
    return Promise.resolve();
  }
  return api.saveStatCalc(current).catch(() => {});
}

export function resetStatCalcStore() {
  window.clearTimeout(saveTimer);
  saveTimer = null;
  current = defaultStatCalculator();
  storeLoaded = false;
  canSave = false;
  guestMode = null;
  loadToken += 1;
  emit();
}

function scheduleSave() {
  if (!canSave) return;
  if (guestMode) {
    persistLocal(current);
    return;
  }
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    saveTimer = null;
    api.saveStatCalc(current).catch(() => {});
  }, 400);
}

function applyState(next) {
  current = normalizeStatCalculator(next);
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
    current = readStatCalculator();
    storeLoaded = true;
    canSave = true;
    emit();
    return;
  }

  api
    .getStatCalc()
    .then((payload) => {
      if (token !== loadToken) return;
      const server = normalizeStatCalculator(payload.state || {});
      const local = readStatCalculator();
      if (
        !hasStatCalculatorProgress(server) &&
        hasStatCalculatorProgress(local)
      ) {
        current = local;
        storeLoaded = true;
        canSave = true;
        emit();
        scheduleSave();
        return;
      }
      current = server;
      storeLoaded = true;
      canSave = true;
      emit();
    })
    .catch(() => {
      if (token !== loadToken) return;
      current = readStatCalculator();
      storeLoaded = true;
      canSave = false;
      emit();
    });
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    flushStatCalcSave();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushStatCalcSave();
    }
  });
}

export function useStatCalculator() {
  const guest = Boolean(useAuth()?.user?.guest);
  const [state, setState] = useState(current);
  const [loaded, setLoaded] = useState(storeLoaded);

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
      flushStatCalcSave();
    };
  }, [guest]);

  function setStatState(updater) {
    const next =
      typeof updater === "function" ? updater(current) : updater;
    applyState(next);
  }

  return { guest, state, setState: setStatState, loaded };
}
