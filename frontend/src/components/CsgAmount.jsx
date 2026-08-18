import csgIcon from "../assets/csg.png";
import { formatNumber } from "../rewards";

export default function CsgAmount({ value, className = "" }) {
  return (
    <span className={`csg-amount ${className}`.trim()}>
      <img src={csgIcon} alt="Contract Starry Gem" className="csg-icon" />
      <strong>{formatNumber(Math.round(value || 0))}</strong>
    </span>
  );
}
