import AwakenAmount from "./AwakenAmount.jsx";
import CsgAmount from "./CsgAmount.jsx";
import HelpTip from "./HelpTip.jsx";
import LootChips from "./LootChips.jsx";
import MonsterTicketAmount from "./MonsterTicketAmount.jsx";
import PagesAmount from "./PagesAmount.jsx";
import SpecialBoxAmount from "./SpecialBoxAmount.jsx";
import TreasureChestAmount from "./TreasureChestAmount.jsx";
import TreasureCouponAmount from "./TreasureCouponAmount.jsx";
import {
  awakenEventPlanLabel,
  clampMonths,
  EVENT_WEEKS_PER_YEAR,
  mergeRewardCounts,
  PERIOD_PRESETS,
  periodLabel,
  scaleEventPlan,
  TREASURE_CHESTS,
} from "../sgCalc";

function eventWeeksInMonths(months) {
  return EVENT_WEEKS_PER_YEAR * (clampMonths(months) / 12);
}

export default function AllRewardsPreview({
  state,
  result,
  patch,
  cases = [],
}) {
  const selected = cases.find((row) => row.id === state.eventPlanId) || null;
  const plan = scaleEventPlan(selected, state.months);
  const pages = result.pages || {};
  const tickets = result.monsterTickets || {};
  const coupons = result.treasureCoupons || {};
  const boxes = (pages.boxesPeriod || 0) + (tickets.boxesPeriod || 0);
  const leftCsg = result.total - plan.csgCost;
  const awakenLoot = result.awakenEventPeriod || {};
  const allLoot = mergeRewardCounts(awakenLoot.counts, plan.counts);
  const completions = coupons.completionsPeriod || 0;

  return (
    <div className="all-rewards">
      <div className="total-banner preview-banner pages-event-banner all-rewards-preview">
        <div>
          <div className="head-with-help">
            <h3>All rewards / {periodLabel(state.months)}</h3>
            <HelpTip
              title="All rewards"
              steps={[
                "This preview adds up calculator income for the period you pick.",
                "Tick one Event Plan below to add its Mysterious Sale loot. 17 event weeks = 1 year.",
                "Awaken event rewards come from the Awakens Calculator 5-week completion.",
              ]}
            />
          </div>
          <p>
            All resources in {periodLabel(state.months)}
            {selected ? `, including ${selected.name}` : ""}.
          </p>
          <div className="all-rewards-preview-resources">
            <div>
              <span>CSG</span>
              <CsgAmount value={result.total} />
            </div>
            <div>
              <span>Awakens</span>
              <AwakenAmount value={result.awakensPeriodCount} />
            </div>
            <div>
              <span>Pages of Destiny</span>
              <PagesAmount value={pages.pagesPeriod} />
            </div>
            <div>
              <span>Monster Tickets</span>
              <MonsterTicketAmount value={tickets.period} />
            </div>
            <div>
              <span>Treasure Coupons</span>
              <TreasureCouponAmount value={coupons.period} />
            </div>
            <div>
              <span>Special boxes</span>
              <SpecialBoxAmount value={boxes} />
            </div>
            {selected ? (
              <div>
                <span>{selected.name} CSG cost</span>
                <CsgAmount value={plan.csgCost} />
              </div>
            ) : null}
          </div>
          <p>
            {completions} treasure completion
            {completions === 1 ? "" : "s"}
          </p>
          <p className="pages-event-rewards">
            {TREASURE_CHESTS.map((chest) => (
              <TreasureChestAmount
                key={chest.color}
                color={chest.color}
                value={coupons.chestsPeriod}
              />
            ))}
          </p>
          <p>
            Awaken event:{" "}
            {state.includeAwakenEvent === false
              ? "Off"
              : awakenEventPlanLabel(awakenLoot)}
            {state.includeAwakenEvent !== false && awakenLoot.allAt300
              ? " · every event reached 300"
              : ""}
          </p>
          <LootChips
            counts={awakenLoot.counts}
            empty="No awaken-event loot. Tick it on the Awakens Calculator."
          />
          {selected ? (
            <>
              <p>
                {selected.name}: {plan.runs.toFixed(2)} runs (
                {eventWeeksInMonths(state.months).toFixed(1)} event weeks)
              </p>
              <LootChips counts={plan.counts} empty="No loot on this plan." />
            </>
          ) : null}
        </div>
        <div className="pages-event-total">
          <span>CSG left</span>
          <CsgAmount value={leftCsg} className="preview-hero" />
          <LootChips counts={allLoot} empty="" />
        </div>
      </div>

      <article className="calc-row">
        <div className="calc-row-head">
          <div className="head-with-help">
            <h3>Time period</h3>
            <HelpTip
              title="Time period"
              steps={[
                "This is the same period as the calculators.",
                "1 year is 17 Mysterious Sale event weeks.",
              ]}
            />
          </div>
          <span className="calc-badge">{periodLabel(state.months)}</span>
        </div>
        <p className="muted">
          Change the window, then tick a source below. The preview at the top
          updates.
        </p>
        <div className="period-presets">
          {PERIOD_PRESETS.map((preset) => (
            <button
              key={preset.months}
              className={state.months === preset.months ? "gold-btn" : "tan-btn"}
              type="button"
              onClick={() => patch({ months: preset.months })}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </article>

      <article className="calc-row">
        <div className="calc-row-head">
          <div className="head-with-help">
            <h3>Event Plan</h3>
            <HelpTip
              title="Event Plan"
              steps={[
                "Tick only one plan. Tick it again to clear it.",
                "The plan’s rewards and CSG cost scale to the period above.",
              ]}
            />
          </div>
        </div>
        <p className="muted">
          Tick one Mysterious Sale plan to include it in the preview. Other
          income comes from the calculators.
        </p>
        {cases.length ? (
          <div className="check-grid">
            {cases.map((row) => (
              <div className="check-card" key={row.id}>
                <input
                  type="checkbox"
                  checked={state.eventPlanId === row.id}
                  onChange={() =>
                    patch({
                      eventPlanId:
                        state.eventPlanId === row.id ? null : row.id,
                    })
                  }
                />
                <span>
                  <strong>{row.name}</strong>
                  <span className="muted">
                    {" "}
                    · {row.period_weeks} event weeks
                  </span>
                  <LootChips counts={row.reward_counts} empty="No loot yet" />
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">
            No Event Plans yet. Open Mysterious Sale to add one.
          </p>
        )}
      </article>
    </div>
  );
}
