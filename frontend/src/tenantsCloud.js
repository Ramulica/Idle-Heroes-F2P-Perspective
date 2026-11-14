import tenantsBtn from "./assets/stats/tenants/tenants-btn.png";
import house01 from "./assets/stats/tenants/house-01.png";
import house02 from "./assets/stats/tenants/house-02.png";
import house03 from "./assets/stats/tenants/house-03.png";
import house04 from "./assets/stats/tenants/house-04.png";
import cloudBtn from "./assets/stats/cloudIsland/cloud-btn.png";
import build01 from "./assets/stats/cloudIsland/build-01.png";
import build02 from "./assets/stats/cloudIsland/build-02.png";
import { FACTION_AURA } from "./factionAura";

export const TENANTS_ICON = tenantsBtn;
export const CLOUD_ISLAND_ICON = cloudBtn;

export const TENANT_HOUSE_MAX = 105;
export const TENANT_HOUSE_DEFAULT = 0;
/** Speed at lv 1/2 → 1, 3/4 → 2, … (gains on odd levels). */
export function tenantSpeedFromLevel(level) {
  const lv = Math.max(0, Math.round(Number(level)) || 0);
  return Math.ceil(lv / 2);
}

export const CLOUD_BUILDING_MAX = 30;
export const CLOUD_BUILDING_DEFAULT = 30;
/** Each level → +2 Speed (if faction matches). */
export const CLOUD_SPEED_PER_LEVEL = 2;

export const TENANT_HOUSES = [
  { id: "house-01", name: "Tenant House 1", icon: house01 },
  { id: "house-02", name: "Tenant House 2", icon: house02 },
  { id: "house-03", name: "Tenant House 3", icon: house03 },
  { id: "house-04", name: "Tenant House 4", icon: house04 },
];

export const CLOUD_BUILDINGS = [
  {
    id: "build-01",
    name: "Cloud Building 1",
    icon: build01,
    factions: ["Fortress", "Forest", "Light", "Transcendence"],
  },
  {
    id: "build-02",
    name: "Cloud Building 2",
    icon: build02,
    factions: ["Shadow", "Abyss", "Dark", "Transcendence"],
  },
];

function clampInt(value, min, max, fallback) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function defaultTenants() {
  return TENANT_HOUSES.map(() => TENANT_HOUSE_DEFAULT);
}

export function defaultCloudIsland() {
  return CLOUD_BUILDINGS.map(() => CLOUD_BUILDING_DEFAULT);
}

export function normalizeTenants(raw) {
  const src = Array.isArray(raw) ? raw : [];
  return TENANT_HOUSES.map((_, i) =>
    clampInt(src[i], 0, TENANT_HOUSE_MAX, TENANT_HOUSE_DEFAULT)
  );
}

export function normalizeCloudIsland(raw) {
  const src = Array.isArray(raw) ? raw : [];
  return CLOUD_BUILDINGS.map((_, i) =>
    clampInt(src[i], 0, CLOUD_BUILDING_MAX, CLOUD_BUILDING_DEFAULT)
  );
}

export function tenantSpeedFromLevels(levels) {
  const rows = normalizeTenants(levels);
  return rows.reduce((sum, lv) => sum + tenantSpeedFromLevel(lv), 0);
}

export function cloudSpeedForFaction(levels, faction) {
  const rows = normalizeCloudIsland(levels);
  if (!faction) return 0;
  let total = 0;
  CLOUD_BUILDINGS.forEach((building, i) => {
    if (!building.factions.includes(faction)) return;
    total += rows[i] * CLOUD_SPEED_PER_LEVEL;
  });
  return total;
}

export function factionIconsFor(names) {
  return names
    .map((name) => FACTION_AURA[name])
    .filter(Boolean)
    .map((def) => ({ id: def.id, name: def.name, icon: def.icon }));
}
