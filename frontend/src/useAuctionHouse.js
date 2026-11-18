import { useEffect, useState } from "react";
import { api } from "./api";
import { useAuth } from "./auth";
import {
  defaultAuctionState,
  hasAuctionProgress,
  normalizeAuctionState,
  readAuctionState,
  writeAuctionState,
} from "./auctionHouse";

let current = defaultAuctionState();
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
  writeAuctionState(state);
}

export function flushAuctionHouseSave() {
  window.clearTimeout(saveTimer);
  saveTimer = null;
  if (!canSave) return Promise.resolve();
  if (guestMode) {
    persistLocal(current);
    return Promise.resolve();
  }
  return api.saveAuctionHouse(current).catch(() => {});
}

export function resetAuctionHouseStore() {
  window.clearTimeout(saveTimer);
  saveTimer = null;
  current = defaultAuctionState();
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
    api.saveAuctionHouse(current).catch(() => {});
  }, 400);
}

function applyState(next) {
  current = normalizeAuctionState(next);
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
    current = readAuctionState();
    storeLoaded = true;
    canSave = true;
    emit();
    return;
  }

  api
    .getAuctionHouse()
    .then((payload) => {
      if (token !== loadToken) return;
      const server = normalizeAuctionState(payload.state || {});
      const local = readAuctionState();
      if (!hasAuctionProgress(server) && hasAuctionProgress(local)) {
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
      current = readAuctionState();
      storeLoaded = true;
      canSave = false;
      emit();
    });
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    flushAuctionHouseSave();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushAuctionHouseSave();
    }
  });
}

export function useAuctionHouse() {
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
      flushAuctionHouseSave();
    };
  }, [guest]);

  function setAuctionState(updater) {
    const next = typeof updater === "function" ? updater(current) : updater;
    applyState(next);
  }

  return { guest, state, setState: setAuctionState, loaded };
}
