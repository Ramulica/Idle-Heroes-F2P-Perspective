import RewardIcon from "./RewardIcon.jsx";
import { formatNumber, rewardPreview } from "../rewards";

export default function LootChips({ counts, empty = "None" }) {
  const items = rewardPreview(counts);
  if (!items.length) return <span className="muted">{empty}</span>;
  return (
    <span className="loot-preview">
      {items.map((item) => (
        <span className="loot-chip" key={item.type}>
          {formatNumber(item.count)}x <RewardIcon type={item.type} />
        </span>
      ))}
    </span>
  );
}
