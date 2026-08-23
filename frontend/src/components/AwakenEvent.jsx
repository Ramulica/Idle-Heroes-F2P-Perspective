import HelpTip from "./HelpTip.jsx";
import LootChips from "./LootChips.jsx";
import {
  AWAKEN_EVENT_MILESTONES,
  AWAKEN_EVENT_POINTS_PER,
  periodLabel,
} from "../sgCalc";
import { formatNumber } from "../rewards";
import RewardIcon from "./RewardIcon.jsx";

function tierLabel(plan) {
  if (plan.n600) return "600 completion this cycle (Destiny)";
  if (plan.n300) return "300 completion this cycle";
  if (plan.n150) return "150 this cycle (1/2 Origin)";
  if (plan.n100) return "100 this cycle (Mysterious Artifact)";
  return "No completion this cycle";
}

export default function AwakenEvent({ state, result, patch }) {
  const cycle = result.awakenEvent || {};
  const period = result.awakenEventPeriod || {};

  return (
    <article className="calc-row" id="sg-awaken-event">
      <div className="calc-row-head">
        <div className="head-with-help">
          <h3>5-week awaken event</h3>
          <HelpTip
            title="5-week awaken event"
            steps={[
              "This event runs once every 5 weeks. Whole events only, no averages.",
              `Each awaken is ${AWAKEN_EVENT_POINTS_PER} points. A 300 completion needs 50 awakens. A 600 needs 100.`,
              "First fill as many 300 completions as you can. If every event hits 300, leftover awakens upgrade some to 600.",
              "100: 1 Mysterious Artifact. 150: 1/2 Origin. 300: 1 Origin. 600: 1 Destiny.",
            ]}
          />
        </div>
      </div>
      <div className="check-grid">
        <div className="check-card">
          <input
            type="checkbox"
            checked={state.includeAwakenEvent !== false}
            onChange={(event) =>
              patch({ includeAwakenEvent: event.target.checked })
            }
          />
          <span>
            Count this event. {formatNumber(result.awakensPerCycle)} awakens
            this cycle = {formatNumber(cycle.points)} points. {tierLabel(cycle)}.
          </span>
        </div>
      </div>
      <div className="awaken-event-milestones">
        {AWAKEN_EVENT_MILESTONES.map((row) => (
          <span
            key={`${row.points}-${row.type}-${row.amount}`}
            className="muted"
          >
            {row.points} pts · {formatNumber(row.amount)}x{" "}
            <RewardIcon type={row.type} />
          </span>
        ))}
      </div>
      <p>
        Over {periodLabel(state.months)}: {period.n600 || 0} × 600 and{" "}
        {period.n300 || 0} × 300
        {period.n150 ? ` · ${period.n150} × 150` : ""}
        {period.n100 ? ` · ${period.n100} × 100` : ""}
        {period.allAt300
          ? " · every event reached 300, extras went to 600"
          : ""}
        .
      </p>
      <p>
        Best rewards:{" "}
        <LootChips
          counts={period.counts}
          empty="Tick the event to count these rewards."
        />
      </p>
    </article>
  );
}
