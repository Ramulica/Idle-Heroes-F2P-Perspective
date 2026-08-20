import greenIcon from "../assets/treasure-chest-green.png";
import orangeIcon from "../assets/treasure-chest-orange.png";
import pinkIcon from "../assets/treasure-chest-pink.png";
import purpleIcon from "../assets/treasure-chest-purple.png";
import redIcon from "../assets/treasure-chest-red.png";
import { formatNumber } from "../rewards";

const ICONS = {
  purple: purpleIcon,
  green: greenIcon,
  red: redIcon,
  orange: orangeIcon,
  pink: pinkIcon,
};

const LABELS = {
  purple: "Purple Treasure selection chest",
  green: "Green Treasure selection chest",
  red: "Red Treasure selection chest",
  orange: "Orange Treasure selection chest",
  pink: "Pink Treasure selection chest",
};

export default function TreasureChestAmount({
  color,
  value,
  className = "",
  iconOnly = false,
}) {
  const icon = ICONS[color] || purpleIcon;
  const label = LABELS[color] || "Treasure selection chest";
  return (
    <span className={`csg-amount ${className}`.trim()}>
      <img src={icon} alt={iconOnly ? "" : label} className="csg-icon" />
      {iconOnly ? null : <strong>{formatNumber(Math.round(value || 0))}</strong>}
    </span>
  );
}
