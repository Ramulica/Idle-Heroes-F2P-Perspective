import skinBtn from "./assets/stats/skins/skin-btn.png";

import iconSfxMuGuiying from "./assets/stats/skins/icons/sfx-mu-guiying.png";
import iconSfxEmeraldClouds from "./assets/stats/skins/icons/sfx-emerald-clouds.png";
import iconSfxCampusIdol from "./assets/stats/skins/icons/sfx-campus-idol.png";
import iconSfxBloomingTequila from "./assets/stats/skins/icons/sfx-blooming-tequila.png";
import iconSqhStarryNight from "./assets/stats/skins/icons/sqh-starry-night.png";
import iconSqhScarletQueen from "./assets/stats/skins/icons/sqh-scarlet-queen.png";
import iconSqhClaretSun from "./assets/stats/skins/icons/sqh-claret-sun.png";
import iconAsmodelStarryGroom from "./assets/stats/skins/icons/asmodel-starry-groom.png";
import iconAsmodelGloriousWarSpirit from "./assets/stats/skins/icons/asmodel-glorious-war-spirit.png";
import iconJahraStarryBride from "./assets/stats/skins/icons/jahra-starry-bride.png";
import iconJahraTipsyWhiskey from "./assets/stats/skins/icons/jahra-tipsy-whiskey.png";
import iconJahraBlazingPhoenix from "./assets/stats/skins/icons/jahra-blazing-phoenix.png";
import iconVesaDanceOfBrocade from "./assets/stats/skins/icons/vesa-dance-of-brocade.png";
import iconVesaAlchemyProfessor from "./assets/stats/skins/icons/vesa-alchemy-professor.png";
import iconVesaCrimsonDragonTamer from "./assets/stats/skins/icons/vesa-crimson-dragon-tamer.png";
import iconAspenEvilSanta from "./assets/stats/skins/icons/aspen-evil-santa-krampus.png";
import iconAspenCommander from "./assets/stats/skins/icons/aspen-commander-aspen.png";
import iconEosSolarDeity from "./assets/stats/skins/icons/eos-solar-deity.png";
import iconHolmesEasterMagician from "./assets/stats/skins/icons/holmes-easter-magician.png";
import iconFreyaPrankyWitch from "./assets/stats/skins/icons/freya-pranky-witch.png";
import iconFreyaSpurringMotorgirl from "./assets/stats/skins/icons/freya-spurring-motorgirl.png";
import iconMockmanCampusStar from "./assets/stats/skins/icons/mockman-campus-star.png";
import iconAzraelMoonwalker from "./assets/stats/skins/icons/azrael-moonwalker.png";
import iconAraneaRobotCowgirl from "./assets/stats/skins/icons/aranea-robot-cowgirl.png";
import iconVulkanRubiksCube from "./assets/stats/skins/icons/vulkan-rubiks-cube-guardian.png";
import iconElenaNationalBeauty from "./assets/stats/skins/icons/elena-national-beauty.png";
import iconAylamakCrazyBunny from "./assets/stats/skins/icons/aylamak-crazy-bunny-envoy.png";
import iconGeesterNobleBrave from "./assets/stats/skins/icons/geester-the-noble-brave.png";
import iconNataliaMagpiesWhisper from "./assets/stats/skins/icons/natalia-magpies-whisper.png";
import iconBettyFloatingMoon from "./assets/stats/skins/icons/betty-floating-moon.png";
import iconGaggieMessyCauldron from "./assets/stats/skins/icons/gaggie-messy-cauldron-accident.png";
import iconYorhmGuardianChristmas from "./assets/stats/skins/icons/yorhm-guardian-of-christmas-eve.png";
import iconPatriciaBewitching from "./assets/stats/skins/icons/patricia-bewitching-heart-thief.png";
import iconMelissaMoonlitPanda from "./assets/stats/skins/icons/melissa-moonlit-panda-princess.png";
import iconWilliamsPhantomRhapsody from "./assets/stats/skins/icons/williams-phantom-rhapsody.png";
import iconNortonRadiantChristmas from "./assets/stats/skins/icons/norton-radiant-christmas-armor.png";
import iconWukongVictoriousBuddha from "./assets/stats/skins/icons/wukong-victorious-fighting-buddha.png";
import iconFinnGentlemanJewels from "./assets/stats/skins/icons/finn-gentleman-sparkling-jewels.png";
import iconSylvieApsarasReverie from "./assets/stats/skins/icons/sylvie-apsaras-reverie.png";
import iconVesperaJadescale from "./assets/stats/skins/icons/vespera-jadescale-immortal.png";
import iconIgnaciaFrostyOsmanthus from "./assets/stats/skins/icons/ignacia-frosty-osmanthus.png";
import iconBasiliskScreechingGhost from "./assets/stats/skins/icons/basilisk-screeching-ghost-knight.png";
import iconMadeleineChristmasDream from "./assets/stats/skins/icons/madeleine-christmas-nights-dream.png";
import iconOscarAuspiceCrane from "./assets/stats/skins/icons/oscar-auspice-cranes-arrival.png";
import iconMareiaStarRiverAria from "./assets/stats/skins/icons/mareia-star-river-aria.png";
import iconUmbrionEverVictorious from "./assets/stats/skins/icons/umbrion-ever-victorious-general.png";
import iconErskorMoonPalace from "./assets/stats/skins/icons/erskor-moon-palace-guardian.png";

export const SKIN_ICON = skinBtn;
export const SKIN_LEVEL_MAX = 3;

/** @type {{ id: number, name: string, tone: string }[]} */
export const SKIN_LEVELS = [
  { id: 1, name: "Ace", tone: "purple" },
  { id: 2, name: "Elite", tone: "gold" },
  { id: 3, name: "Mythic", tone: "pink" },
];

/**
 * Base skin stat table (values by level 1 / 2 / 3).
 * Hero exceptions override specific rows (see skinStatValues).
 */
export const SKIN_STATS = [
  { id: "attack", name: "Attack", unit: "%", values: [3, 6, 9] },
  { id: "speed", name: "Speed", unit: "", values: [4, 6, 8] },
  { id: "crit-damage", name: "Crit Damage", unit: "%", values: [5, 10, 15] },
  {
    id: "damage-reduction",
    name: "Damage Reduction",
    unit: "%",
    values: [4, 5, 6],
  },
  { id: "crit", name: "Crit", unit: "%", values: [2, 3, 4] },
  {
    id: "control-immunity",
    name: "Control Immunity",
    unit: "%",
    values: [5, 6, 7],
  },
  { id: "holy-damage", name: "Holy Damage", unit: "%", values: [6, 10, 14] },
  { id: "hp", name: "HP", unit: "%", values: [5, 8, 12] },
];

export const SKIN_STAT_BY_ID = Object.fromEntries(
  SKIN_STATS.map((row) => [row.id, row])
);

/** Heroes whose Control Immunity skin values are 4 / 6 / 8. */
const CI_EXCEPTION_HEROES = new Set(["hero-17", "hero-35", "hero-36"]);
/** Umbrion Speed skin values are 5 / 7 / 9. */
const SPEED_EXCEPTION_HEROES = new Set(["hero-35"]);

/**
 * Catalog of hero skins. `stats` are fixed stat ids; values scale with level.
 * @type {{ id: string, heroId: string, name: string, stats: string[], icon: string }[]}
 */
export const HERO_SKINS = [
  // Sword Flash - Xia
  {
    id: "sfx-mu-guiying",
    heroId: "hero-01",
    name: "Mu Guiying",
    stats: ["damage-reduction", "attack", "speed"],
    icon: iconSfxMuGuiying,
  },
  {
    id: "sfx-emerald-clouds",
    heroId: "hero-01",
    name: "Emerald Clouds",
    stats: ["control-immunity", "crit", "attack"],
    icon: iconSfxEmeraldClouds,
  },
  {
    id: "sfx-campus-idol",
    heroId: "hero-01",
    name: "Campus Idol",
    stats: ["speed", "crit", "crit-damage"],
    icon: iconSfxCampusIdol,
  },
  {
    id: "sfx-blooming-tequila",
    heroId: "hero-01",
    name: "Blooming Tequila",
    stats: ["attack", "speed", "crit-damage"],
    icon: iconSfxBloomingTequila,
  },

  // Scarlet Queen - Halora
  {
    id: "sqh-starry-night",
    heroId: "hero-02",
    name: "Starry Night",
    stats: ["damage-reduction", "attack", "speed"],
    icon: iconSqhStarryNight,
  },
  {
    id: "sqh-scarlet-queen",
    heroId: "hero-02",
    name: "Scarlet Queen",
    stats: ["control-immunity", "hp", "attack"],
    icon: iconSqhScarletQueen,
  },
  {
    id: "sqh-claret-sun",
    heroId: "hero-02",
    name: "Claret Sun",
    stats: ["crit-damage", "hp", "speed"],
    icon: iconSqhClaretSun,
  },

  // Asmodel the Dauntless
  {
    id: "asmodel-starry-groom",
    heroId: "hero-03",
    name: "Starry Groom",
    stats: ["attack", "crit-damage", "damage-reduction"],
    icon: iconAsmodelStarryGroom,
  },
  {
    id: "asmodel-glorious-war-spirit",
    heroId: "hero-03",
    name: "Glorious War Spirit",
    stats: ["hp", "control-immunity", "crit-damage"],
    icon: iconAsmodelGloriousWarSpirit,
  },

  // Star Wing - Jahra
  {
    id: "jahra-starry-bride",
    heroId: "hero-04",
    name: "Starry Bride",
    stats: ["control-immunity", "holy-damage", "attack"],
    icon: iconJahraStarryBride,
  },
  {
    id: "jahra-tipsy-whiskey",
    heroId: "hero-04",
    name: "Tipsy Whiskey",
    stats: ["damage-reduction", "attack", "speed"],
    icon: iconJahraTipsyWhiskey,
  },
  {
    id: "jahra-blazing-phoenix",
    heroId: "hero-04",
    name: "Blazing Phoenix",
    stats: ["damage-reduction", "hp", "attack"],
    icon: iconJahraBlazingPhoenix,
  },

  // Fairy Queen - Vesa
  {
    id: "vesa-dance-of-brocade",
    heroId: "hero-05",
    name: "Dance of Brocade",
    stats: ["control-immunity", "attack", "crit-damage"],
    icon: iconVesaDanceOfBrocade,
  },
  {
    id: "vesa-alchemy-professor",
    heroId: "hero-05",
    name: "Alchemy Professor",
    stats: ["control-immunity", "hp", "attack"],
    icon: iconVesaAlchemyProfessor,
  },
  {
    id: "vesa-crimson-dragon-tamer",
    heroId: "hero-05",
    name: "Crimson Dragon Tamer",
    stats: ["damage-reduction", "hp", "attack"],
    icon: iconVesaCrimsonDragonTamer,
  },

  // Lord of Fear - Aspen
  {
    id: "aspen-evil-santa-krampus",
    heroId: "hero-06",
    name: "Evil Santa - Krampus",
    stats: ["attack", "control-immunity", "crit-damage"],
    icon: iconAspenEvilSanta,
  },
  {
    id: "aspen-commander-aspen",
    heroId: "hero-06",
    name: "Commander Aspen",
    stats: ["damage-reduction", "hp", "attack"],
    icon: iconAspenCommander,
  },

  // The Sun Devourer - Eos
  {
    id: "eos-solar-deity",
    heroId: "hero-07",
    name: "Solar Deity",
    stats: ["damage-reduction", "hp", "attack"],
    icon: iconEosSolarDeity,
  },

  // Star Alchemist - Holmes Young
  {
    id: "holmes-easter-magician",
    heroId: "hero-08",
    name: "Easter Magician",
    stats: ["damage-reduction", "hp", "attack"],
    icon: iconHolmesEasterMagician,
  },

  // Mystic Fairy - Freya
  {
    id: "freya-pranky-witch",
    heroId: "hero-09",
    name: "Pranky Witch",
    stats: ["control-immunity", "holy-damage", "speed"],
    icon: iconFreyaPrankyWitch,
  },
  {
    id: "freya-spurring-motorgirl",
    heroId: "hero-09",
    name: "Spurring Motorgirl",
    stats: ["damage-reduction", "attack", "speed"],
    icon: iconFreyaSpurringMotorgirl,
  },

  // Star Swordsman - Mockman
  {
    id: "mockman-campus-star",
    heroId: "hero-10",
    name: "Campus Star",
    stats: ["damage-reduction", "hp", "attack"],
    icon: iconMockmanCampusStar,
  },

  // Lord of Death - Azrael
  {
    id: "azrael-moonwalker",
    heroId: "hero-11",
    name: "Moonwalker",
    stats: ["control-immunity", "attack", "speed"],
    icon: iconAzraelMoonwalker,
  },

  // Bloodtide Queen - Aranea
  {
    id: "aranea-robot-cowgirl",
    heroId: "hero-12",
    name: "Robot Cowgirl",
    stats: ["control-immunity", "attack", "speed"],
    icon: iconAraneaRobotCowgirl,
  },

  // Doom Terminator - Vulkan
  {
    id: "vulkan-rubiks-cube-guardian",
    heroId: "hero-13",
    name: "Rubik's Cube Guardian",
    stats: ["control-immunity", "attack", "crit-damage"],
    icon: iconVulkanRubiksCube,
  },

  // Phantom Defier - Elena
  {
    id: "elena-national-beauty",
    heroId: "hero-14",
    name: "National Beauty",
    stats: ["control-immunity", "attack", "speed"],
    icon: iconElenaNationalBeauty,
  },

  // Hyperspace Hunter - Aylamak
  {
    id: "aylamak-crazy-bunny-envoy",
    heroId: "hero-15",
    name: "Crazy Bunny Envoy",
    stats: ["attack", "hp", "damage-reduction"],
    icon: iconAylamakCrazyBunny,
  },

  // Mutated Fungus - Geester
  {
    id: "geester-the-noble-brave",
    heroId: "hero-16",
    name: "The Noble Brave",
    stats: ["attack", "control-immunity", "crit"],
    icon: iconGeesterNobleBrave,
  },

  // Doppelganger - Natalia
  {
    id: "natalia-magpies-whisper",
    heroId: "hero-17",
    name: "Magpie's Whisper",
    stats: ["attack", "control-immunity", "hp"],
    icon: iconNataliaMagpiesWhisper,
  },

  // Therapist of Blood - Betty
  {
    id: "betty-floating-moon",
    heroId: "hero-18",
    name: "Floating Moon",
    stats: ["holy-damage", "control-immunity", "speed"],
    icon: iconBettyFloatingMoon,
  },

  // Chaosbound Spirit - Gaggie
  {
    id: "gaggie-messy-cauldron-accident",
    heroId: "hero-19",
    name: "Messy Cauldron Accident",
    stats: ["attack", "hp", "damage-reduction"],
    icon: iconGaggieMessyCauldron,
  },

  // Lord of Sparkles - Yorhm Tum
  {
    id: "yorhm-guardian-of-christmas-eve",
    heroId: "hero-20",
    name: "The Guardian of Christmas Eve",
    stats: ["control-immunity", "attack", "speed"],
    icon: iconYorhmGuardianChristmas,
  },

  // Interstellar Hunteress - Patricia
  {
    id: "patricia-bewitching-heart-thief",
    heroId: "hero-21",
    name: "Bewitching Heart Thief",
    stats: ["holy-damage", "control-immunity", "speed"],
    icon: iconPatriciaBewitching,
  },

  // Lady of Blossom Realm - Melissa
  {
    id: "melissa-moonlit-panda-princess",
    heroId: "hero-23",
    name: "Moonlit Panda Princess",
    stats: ["control-immunity", "attack", "speed"],
    icon: iconMelissaMoonlitPanda,
  },

  // Roseheart Fanatic - Williams
  {
    id: "williams-phantom-rhapsody",
    heroId: "hero-24",
    name: "Phantom Rhapsody",
    stats: ["attack", "crit-damage", "damage-reduction"],
    icon: iconWilliamsPhantomRhapsody,
  },

  // King of Abysmal Sea - Norton Haig
  {
    id: "norton-radiant-christmas-armor",
    heroId: "hero-25",
    name: "Radiant Christmas Armor",
    stats: ["attack", "hp", "damage-reduction"],
    icon: iconNortonRadiantChristmas,
  },

  // Great Sage - Sun Wukong
  {
    id: "wukong-victorious-fighting-buddha",
    heroId: "hero-26",
    name: "The Victorious Fighting Buddha",
    stats: ["attack", "hp", "damage-reduction"],
    icon: iconWukongVictoriousBuddha,
  },

  // Count of Nightmare - Finn
  {
    id: "finn-gentleman-sparkling-jewels",
    heroId: "hero-27",
    name: "Gentleman with Sparkling Jewels",
    stats: ["control-immunity", "attack", "speed"],
    icon: iconFinnGentlemanJewels,
  },

  // Cosmic Speedster - Sylvie
  {
    id: "sylvie-apsaras-reverie",
    heroId: "hero-28",
    name: "Apsara's Reverie",
    stats: ["attack", "hp", "damage-reduction"],
    icon: iconSylvieApsarasReverie,
  },

  // Stygian Twilight - Vespera
  {
    id: "vespera-jadescale-immortal",
    heroId: "hero-29",
    name: "Jadescale Immortal",
    stats: ["control-immunity", "hp", "speed"],
    icon: iconVesperaJadescale,
  },

  // Weaver of Life - Ignacia
  {
    id: "ignacia-frosty-osmanthus",
    heroId: "hero-30",
    name: "Frosty Osmanthus",
    stats: ["attack", "speed", "crit-damage"],
    icon: iconIgnaciaFrostyOsmanthus,
  },

  // Ironcore Mecha - Basilisk
  {
    id: "basilisk-screeching-ghost-knight",
    heroId: "hero-31",
    name: "Screeching Ghost Knight",
    stats: ["holy-damage", "control-immunity", "speed"],
    icon: iconBasiliskScreechingGhost,
  },

  // Star-devouring Bloom - Madeleine
  {
    id: "madeleine-christmas-nights-dream",
    heroId: "hero-32",
    name: "A Christmas Night's Dream",
    stats: ["control-immunity", "hp", "speed"],
    icon: iconMadeleineChristmasDream,
  },

  // Equipoise Arbiter - Oscar
  {
    id: "oscar-auspice-cranes-arrival",
    heroId: "hero-33",
    name: "Auspice Crane's Arrival",
    stats: ["attack", "hp", "control-immunity"],
    icon: iconOscarAuspiceCrane,
  },

  // Purifying Tide - Mareia
  {
    id: "mareia-star-river-aria",
    heroId: "hero-34",
    name: "Star River Aria",
    stats: ["attack", "damage-reduction", "speed"],
    icon: iconMareiaStarRiverAria,
  },

  // Void Executor - Umbrion
  {
    id: "umbrion-ever-victorious-general",
    heroId: "hero-35",
    name: "The Ever-Victorious General",
    stats: ["control-immunity", "attack", "speed"],
    icon: iconUmbrionEverVictorious,
  },

  // The Darkstar Aberrant - Erskor
  {
    id: "erskor-moon-palace-guardian",
    heroId: "hero-36",
    name: "Moon Palace Guardian",
    stats: ["attack", "control-immunity", "speed"],
    icon: iconErskorMoonPalace,
  },
];

export const HERO_SKIN_BY_ID = Object.fromEntries(
  HERO_SKINS.map((row) => [row.id, row])
);

export function skinsForHero(heroId) {
  if (!heroId) return [];
  return HERO_SKINS.filter((row) => row.heroId === heroId);
}

function clampInt(value, min, max, fallback) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function defaultSkin() {
  return { skinId: null, level: 3 };
}

export function normalizeSkin(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const level = clampInt(src.level, 1, SKIN_LEVEL_MAX, 3);
  // Legacy free-stat shape → clear (no matching catalog skin).
  if (Array.isArray(src.stats) && !src.skinId) {
    return { skinId: null, level };
  }
  const skinId = HERO_SKIN_BY_ID[src.skinId] ? src.skinId : null;
  return { skinId, level };
}

export function skinLevelOf(level) {
  return SKIN_LEVELS.find((row) => row.id === level) || SKIN_LEVELS[0];
}

export function skinOf(skinId) {
  return HERO_SKIN_BY_ID[skinId] || null;
}

/** Resolve values for a skin stat, applying hero exceptions. */
export function skinStatValues(statId, heroId) {
  const base = SKIN_STAT_BY_ID[statId];
  if (!base) return null;
  if (statId === "control-immunity" && CI_EXCEPTION_HEROES.has(heroId)) {
    return [4, 6, 8];
  }
  if (statId === "speed" && SPEED_EXCEPTION_HEROES.has(heroId)) {
    return [5, 7, 9];
  }
  return base.values;
}

export function skinStatValue(statId, level, heroId) {
  const values = skinStatValues(statId, heroId);
  if (!values) return null;
  const lv = clampInt(level, 1, SKIN_LEVEL_MAX, 1);
  return values[lv - 1];
}

/** Format a skin stat line for UI. */
export function formatSkinStatLine(statId, level, heroId) {
  const def = SKIN_STAT_BY_ID[statId];
  if (!def) return null;
  const value = skinStatValue(statId, level, heroId);
  if (value == null) return null;
  const shown = def.unit === "%" ? `+${value}%` : `+${value}`;
  return { id: statId, name: def.name, value, unit: def.unit || "", label: shown };
}

/** Collect additive skin rows for totals (Attack included even if gear ATK is ignored). */
export function collectSkinStatRows(skin, heroId) {
  const data = normalizeSkin(skin);
  const def = skinOf(data.skinId);
  if (!def || def.heroId !== heroId) return [];
  const rows = [];
  for (const id of def.stats) {
    const meta = SKIN_STAT_BY_ID[id];
    if (!meta) continue;
    const value = skinStatValue(id, data.level, heroId);
    if (value == null) continue;
    rows.push({ stat: meta.name, value, unit: meta.unit || "" });
  }
  return rows;
}
