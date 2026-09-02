import { formatNumber } from "../rewards";

export default function ResourceAmount({
  icon,
  alt,
  value,
  className = "",
  digits = 2,
  suffix = "",
  compact = false,
}) {
  const amount = Number(value) || 0;
  let label;
  if (compact && Math.abs(amount) >= 1000) {
    const k = amount / 1000;
    label = `${k.toLocaleString(undefined, {
      maximumFractionDigits: Number.isInteger(k) ? 0 : 2,
    })}k`;
  } else if (Math.abs(amount - Math.round(amount)) < 0.001) {
    label = formatNumber(Math.round(amount));
  } else {
    label = amount.toLocaleString(undefined, { maximumFractionDigits: digits });
  }
  return (
    <span className={`csg-amount ${className}`.trim()}>
      {icon ? <img src={icon} alt={alt} className="csg-icon hero-res-icon" /> : null}
      <strong>
        {label}
        {suffix}
      </strong>
    </span>
  );
}
