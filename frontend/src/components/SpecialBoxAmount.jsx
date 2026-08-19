import specialBoxIcon from "../assets/special-box.png";
import { formatNumber } from "../rewards";

export default function SpecialBoxAmount({ value, className = "" }) {
  return (
    <span className={`csg-amount ${className}`.trim()}>
      <img src={specialBoxIcon} alt="Special box" className="csg-icon" />
      <strong>{formatNumber(Math.round(value || 0))}</strong>
    </span>
  );
}
