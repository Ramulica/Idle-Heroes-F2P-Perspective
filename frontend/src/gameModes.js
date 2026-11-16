import voidCampaign from "./assets/stats/gameModes/void-campaign.png";
import voidInvasion from "./assets/stats/gameModes/void-invasion.png";
import voidHoard from "./assets/stats/gameModes/void-hoard.png";
import realmsGate from "./assets/stats/gameModes/realms-gate.png";
import voidVortex from "./assets/stats/gameModes/void-vortex.png";
import towerOfDream from "./assets/stats/gameModes/tower-of-dream.png";
import sealLand from "./assets/stats/gameModes/seal-land.png";
import aspenDungeon from "./assets/stats/gameModes/aspen-dungeon.png";
import interdimensionalArena from "./assets/stats/gameModes/interdimensional-arena.png";
import trialOfTheChampion from "./assets/stats/gameModes/trial-of-the-champion.png";
import freeTeamUpArena from "./assets/stats/gameModes/free-team-up-arena.png";
import starArena from "./assets/stats/gameModes/star-arena.png";
import starlandArena from "./assets/stats/gameModes/starland-arena.png";
import forceWar from "./assets/stats/gameModes/force-war.png";
import swordEdgeArena from "./assets/stats/gameModes/sword-edge-arena.png";
import starExpedition from "./assets/stats/gameModes/star-expedition.png";
import auroraSanctuary from "./assets/stats/gameModes/aurora-sanctuary.png";
import forbiddenZoneShowdown from "./assets/stats/gameModes/forbidden-zone-showdown.png";

/**
 * Sources that only count when a game mode is selected.
 * Per-mode allow-lists can refine this later.
 */
export const GAME_MODE_ONLY_SOURCES = new Set([
  "monster",
  "team_aura",
  "cloud_island",
]);

export const GAME_MODES = [
  { id: "void-campaign", name: "Void Campaign", icon: voidCampaign },
  { id: "void-invasion", name: "Void Invasion", icon: voidInvasion },
  { id: "void-hoard", name: "Void Hoard", icon: voidHoard },
  { id: "realms-gate", name: "Realms Gate", icon: realmsGate },
  { id: "void-vortex", name: "Void Vortex", icon: voidVortex },
  { id: "tower-of-dream", name: "Tower of Dream", icon: towerOfDream },
  { id: "seal-land", name: "Seal Land", icon: sealLand },
  { id: "aspen-dungeon", name: "Aspen Dungeon", icon: aspenDungeon },
  {
    id: "interdimensional-arena",
    name: "Interdimensional Arena",
    icon: interdimensionalArena,
  },
  {
    id: "trial-of-the-champion",
    name: "Trial of the Champion",
    icon: trialOfTheChampion,
  },
  {
    id: "free-team-up-arena",
    name: "Free Team-up Arena",
    icon: freeTeamUpArena,
  },
  { id: "star-arena", name: "Star Arena", icon: starArena },
  { id: "starland-arena", name: "Starland Arena", icon: starlandArena },
  { id: "force-war", name: "Force War", icon: forceWar },
  { id: "sword-edge-arena", name: "Sword Edge Arena", icon: swordEdgeArena },
  { id: "star-expedition", name: "Star Expedition", icon: starExpedition },
  { id: "aurora-sanctuary", name: "Aurora Sanctuary", icon: auroraSanctuary },
  {
    id: "forbidden-zone-showdown",
    name: "Forbidden Zone Showdown",
    icon: forbiddenZoneShowdown,
  },
];

export const GAME_MODE_BY_ID = Object.fromEntries(
  GAME_MODES.map((row) => [row.id, row])
);

export function gameModeOf(id) {
  return GAME_MODE_BY_ID[id] || null;
}

export function normalizeGameModeId(raw) {
  if (raw == null || raw === "" || raw === "none") return null;
  return GAME_MODE_BY_ID[raw] ? raw : null;
}

/** Board combat timing for attack/ability-triggered stats (T2/T3 origin). */
export const COMBAT_ROUNDS = [
  { id: "start", label: "Game start" },
  { id: "round1", label: "Round 1" },
];

export const DEFAULT_COMBAT_ROUND = "start";

export function normalizeCombatRound(raw) {
  return raw === "round1" ? "round1" : DEFAULT_COMBAT_ROUND;
}

export function combatRoundOf(id) {
  return COMBAT_ROUNDS.find((row) => row.id === id) || COMBAT_ROUNDS[0];
}

/** Whether a breakdown source applies under the current game mode. */
export function sourceAllowedInGameMode(sourceId, gameModeId) {
  if (!GAME_MODE_ONLY_SOURCES.has(sourceId)) return true;
  return Boolean(gameModeOf(gameModeId));
}
