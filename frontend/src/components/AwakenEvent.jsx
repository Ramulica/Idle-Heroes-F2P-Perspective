import HelpTip from "./HelpTip.jsx";
import LootChips from "./LootChips.jsx";
import {
  AWAKEN_EVENT_MILESTONES,
  AWAKEN_EVENT_POINTS_PER,
  periodLabel,
} from "../sgCalc";
import { formatNumber } from "../rewards";
import RewardIcon from "./RewardIcon.jsx";

export default function AwakenEvent({ state, result, patch }) {
  const event = result.awakenEvent || { points: 0, counts: {} };

  return (
    <article className="calc-row" id="sg-awaken-event">
      <div className="calc-row-head">
        <div className="head-with-help">
          <h3>5-week awaken event</h3>
          <HelpTip
            title="5-week awaken event"
            steps={[
              "This event runs once every 5-week cycle.",
              `Each awaken is ${AWAKEN_EVENT_POINTS_PER} points.`,
              "100 points: 1 Mysterious Artifact. 150: 1/2 Origin. 300: 1 Origin. 600: 1 Destiny.",
              "Tick this if you want those rewards in All rewards.",
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
            this cycle = {formatNumber(event.points)} points.
          </span>
        </div>
      </div>
      <div className="awaken-event-milestones">
        {AWAKEN_EVENT_MILESTONES.map((row) => (
          <span
            key={`${row.points}-${row.type}-${row.amount}`}
            className={event.points >= row.points ? "ok" : "muted"}
          >
            {row.points} pts · {formatNumber(row.amount)}x{" "}
            <RewardIcon type={row.type} />
          </span>
        ))}
      </div>
      <p>
        This cycle: <LootChips counts={event.counts} empty="No milestone yet." />
      </p>
      <p>
        Over {periodLabel(state.months)}:{" "}
        <LootChips
          counts={result.awakenEventPeriod}
          empty="Tick the event to count these rewards."
        />
      </p>
    </article>
  );
}
