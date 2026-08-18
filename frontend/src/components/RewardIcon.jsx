import { REWARD_META } from "../rewards";

export default function RewardIcon({ type, className = "" }) {
  const meta = REWARD_META[type];
  if (!meta?.icon) return <span className={className}>{meta?.glyph || type}</span>;
  return (
    <img
      src={meta.icon}
      alt={meta.label}
      title={meta.label}
      className={`reward-icon ${className}`.trim()}
    />
  );
}
