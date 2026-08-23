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

  return (
    <div className="all-rewards">
      <article className="info-card" style={{ marginBottom: 12 }}>
        <div className="head-with-help">
          <h3>All rewards</h3>
          <HelpTip
            title="All rewards"
            steps={[
              "This adds up calculator income for the period you pick.",
              "Tick one Event Plan to add its Mysterious Sale loot, scaled to that period. 17 event weeks = 1 year.",
              "Awaken event rewards come from the Awakens Calculator 5-week completion.",
            ]}
          />
        </div>
        <p>
          Resources you gain over {periodLabel(state.months)}. Tick one Event
          Plan to include that plan’s loot.
        </p>
      </article>

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

      <div className="total-banner preview-banner">
        <div>
          <h3>All rewards / {periodLabel(state.months)}</h3>
          <p>
            Calculator income, Treasure completions, awaken-event loot
            {selected ? `, and ${selected.name}` : ""}.
          </p>
        </div>
        <div className="pages-event-total">
          <span>CSG left</span>
          <CsgAmount value={leftCsg} className="preview-hero" />
          <LootChips counts={allLoot} empty="" />
        </div>
      </div>

      <article className="calc-row">
        <h3>Calculator income</h3>
        <div className="all-rewards-grid">
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
        </div>
      </article>

      <article className="calc-row">
        <h3>Treasure completions</h3>
        <p className="muted">
          {coupons.completionsPeriod || 0} full completion
          {(coupons.completionsPeriod || 0) === 1 ? "" : "s"} in{" "}
          {periodLabel(state.months)}. Only full 150-coupon runs count.
        </p>
        <div className="pages-event-rewards">
          {TREASURE_CHESTS.map((chest) => (
            <TreasureChestAmount
              key={chest.color}
              color={chest.color}
              value={coupons.chestsPeriod}
            />
          ))}
        </div>
      </article>

      <article className="calc-row">
        <h3>Awaken event loot</h3>
        <p className="muted">
          One event every 5 weeks. Tick it on the Awakens Calculator to include
          it here.
        </p>
        <p className="muted">
          Best rewards: {awakenLoot.n600 || 0} × 600 and {awakenLoot.n300 || 0} ×
          300
          {awakenLoot.n150
            ? ` · ${awakenLoot.n150} × 150`
            : ""}
          {awakenLoot.n100
            ? ` · ${awakenLoot.n100} × 100`
            : ""}
          .
        </p>
        <LootChips
          counts={awakenLoot.counts}
          empty="Off, or not enough awakens for a 300 completion."
        />
      </article>

      {selected ? (
        <article className="calc-row">
          <h3>{selected.name}</h3>
          <p className="muted">
            {plan.runs.toFixed(2)} runs in {periodLabel(state.months)} (
            {eventWeeksInMonths(state.months).toFixed(1)} event weeks · 17
            event weeks = 1 year).
          </p>
          <div className="all-rewards-grid">
            <div>
              <span>CSG cost</span>
              <CsgAmount value={plan.csgCost} />
            </div>
            <div>
              <span>Loot</span>
              <LootChips counts={plan.counts} />
            </div>
          </div>
        </article>
      ) : null}
    </div>
  );
}
