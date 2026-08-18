import awakenIcon from "../assets/awaken.png";
import { formatNumber } from "../rewards";

export default function AwakenAmount({ value, className = "" }) {
  return (
    <span className={`csg-amount ${className}`.trim()}>
      <img src={awakenIcon} alt="Awaken" className="csg-icon awaken-icon" />
      <strong>{formatNumber(Math.round(value || 0))}</strong>
    </span>
  );
}
