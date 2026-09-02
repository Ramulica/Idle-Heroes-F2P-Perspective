import artifactsIcon from "./assets/rewards/artifacts.png";
import destinyIcon from "./assets/rewards/destiny.png";
import grimIcon from "./assets/rewards/grim.png";
import originIcon from "./assets/rewards/origin.png";
import originArtifactsIcon from "./assets/rewards/origin-artifacts.png";
import starSoulIcon from "./assets/rewards/star-soul.png";
import voidIcon from "./assets/rewards/void.png";

import { RNG_REWARD_META } from "./rngCelebration";

export const REWARD_META = {
  Void: {
    short: "Void",
    label: "Void Material",
    color: "#6c4aa8",
    glyph: "◆",
    icon: voidIcon,
  },
  Origin: {
    short: "Origin",
    label: "Origin Material",
    color: "#d4a017",
    glyph: "★",
    icon: originIcon,
  },
  DT: {
    short: "DT",
    label: "Destiny",
    color: "#3b82c4",
    glyph: "☽",
    icon: destinyIcon,
  },
  "Star Soul": {
    short: "Star Soul",
    label: "Star Soul",
    color: "#2aa9a1",
    glyph: "✦",
    icon: starSoulIcon,
  },
  Artifacts: {
    short: "Artifacts",
    label: "Mysterious Artifact",
    color: "#e67e22",
    glyph: "❖",
    icon: artifactsIcon,
  },
  "Origin Artifacts": {
    short: "Origin Art",
    label: "Origin Artifact",
    color: "#c45c26",
    glyph: "❂",
    icon: originArtifactsIcon,
  },
  Grim: {
    short: "Grim",
    label: "Grim",
    color: "#4a235a",
    glyph: "☠",
    icon: grimIcon,
  },
  ...RNG_REWARD_META,
};

export const REWARD_ORDER = [
  "Void",
  "Origin",
  "DT",
  "Star Soul",
  "Artifacts",
  "Origin Artifacts",
  "Grim",
  "Hero Chest",
  "Festival Skin",
  "Puppet 9",
  "Puppet 10",
  "Resources Chest",
  "Orange Treasure",
  "Orange Festival Treasure",
  "Pink Treasure",
  "Pink Festival Treasure",
  "Deluxe Box",
];

export function formatNumber(value) {
  const amount = Number(value || 0);
  if (Math.abs(amount - Math.round(amount)) < 0.001) {
    return Math.round(amount).toLocaleString();
  }
  return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function rewardPreview(counts) {
  return REWARD_ORDER.filter((type) => Number(counts?.[type] || 0) > 0).map(
    (type) => ({
      type,
      count: Number(counts[type]),
    })
  );
}
