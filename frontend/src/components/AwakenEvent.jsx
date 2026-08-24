import HelpTip from "./HelpTip.jsx";
import {
  AWAKEN_EVENT_MILESTONES,
  AWAKEN_EVENT_POINTS_PER,
} from "../sgCalc";
import { formatNumber } from "../rewards";
import RewardIcon from "./RewardIcon.jsx";

export default function AwakenEvent({ state, result, patch }) {
  const cycle = result.awakenEvent || {};

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
              "Completions and loot are in the Awakens preview at the top.",
            ]}
          />
        </div>
      </div>
      <p className="muted">
        Tick this source to count the event. Completions and loot show in the
        preview at the top.
      </p>
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
            this cycle = {formatNumber(cycle.points)} points.
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
    </article>
  );
}
