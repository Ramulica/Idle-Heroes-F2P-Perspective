import { formatNumber } from "../rewards";
import { CAN_ICONS, CAN_LABELS } from "../rngCelebration";

export default function CanAmount({
  kind = "normal",
  value,
  className = "",
  iconOnly = false,
}) {
  const icon = CAN_ICONS[kind] || CAN_ICONS.normal;
  const label = CAN_LABELS[kind] || CAN_LABELS.normal;
  return (
    <span className={`csg-amount ${className}`.trim()}>
      <img src={icon} alt={iconOnly ? "" : label} className="csg-icon" />
      {iconOnly ? null : <strong>{formatNumber(Math.round(value || 0))}</strong>}
    </span>
  );
}
