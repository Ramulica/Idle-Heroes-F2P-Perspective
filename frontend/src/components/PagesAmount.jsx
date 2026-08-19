import pagesIcon from "../assets/pages-of-destiny.png";
import { formatNumber } from "../rewards";

export default function PagesAmount({ value, className = "" }) {
  return (
    <span className={`csg-amount ${className}`.trim()}>
      <img src={pagesIcon} alt="Pages of Destiny" className="csg-icon" />
      <strong>{formatNumber(Math.round(value || 0))}</strong>
    </span>
  );
}
