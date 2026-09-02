import { displayedDt, stageOf } from "../heroUpgrade";

export default function HeroStageBadge({ stageId, templeLevel = 1 }) {
  const stage = stageOf(stageId);
  const group = stage.group;
  const text =
    group === "D" ? String(displayedDt(stage.id, templeLevel)) : stage.mark;
  return (
    <span className={`hero-mark hero-mark-${group.toLowerCase()}`} title={stage.label}>
      <span className="hero-mark-star" aria-hidden="true" />
      <span className="hero-mark-text">{text}</span>
    </span>
  );
}
