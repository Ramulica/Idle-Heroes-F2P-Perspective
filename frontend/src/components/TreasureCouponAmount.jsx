import couponIcon from "../assets/treasure-coupon.png";
import { formatNumber } from "../rewards";

export default function TreasureCouponAmount({
  value,
  className = "",
  iconOnly = false,
}) {
  return (
    <span className={`csg-amount ${className}`.trim()}>
      <img
        src={couponIcon}
        alt={iconOnly ? "" : "Treasure Coupon"}
        className="csg-icon"
      />
      {iconOnly ? null : <strong>{formatNumber(Math.round(value || 0))}</strong>}
    </span>
  );
}
