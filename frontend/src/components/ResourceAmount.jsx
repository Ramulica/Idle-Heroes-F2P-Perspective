import { formatNumber } from "../rewards";

function formatScaled(scaled) {
  if (Math.abs(scaled - Math.round(scaled)) < 0.001) {
    return String(Math.round(scaled));
  }
  return String(Number(scaled.toFixed(2)));
}

export function formatResourceAmount(value, digits = 2) {
  const amount = Number(value) || 0;
  const abs = Math.abs(amount);
  if (abs >= 10_000_000) return `${formatScaled(amount / 1_000_000)}m`;
  if (abs >= 1000) return `${formatScaled(amount / 1000)}k`;
  if (Math.abs(amount - Math.round(amount)) < 0.001) {
    return formatNumber(Math.round(amount));
  }
  return amount.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export default function ResourceAmount({
  icon,
  alt,
  value,
  className = "",
  digits = 2,
  suffix = "",
}) {
  return (
    <span className={`csg-amount ${className}`.trim()}>
      {icon ? <img src={icon} alt={alt} className="csg-icon hero-res-icon" /> : null}
      <strong>
        {formatResourceAmount(value, digits)}
        {suffix}
      </strong>
    </span>
  );
}
