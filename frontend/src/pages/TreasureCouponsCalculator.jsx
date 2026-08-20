import { useNavigate } from "react-router-dom";
import HelpTip from "../components/HelpTip.jsx";
import TreasureChestAmount from "../components/TreasureChestAmount.jsx";
import TreasureCouponAmount from "../components/TreasureCouponAmount.jsx";
import { useSgCalc } from "../useSgCalc";
import {
  clampMonths,
  PERIOD_PRESETS,
  periodLabel,
  TREASURE_ARENA_WEEKLY,
  TREASURE_CHESTS,
  TREASURE_COUPONS_PER_COMPLETION,
  TREASURE_OTHER_YEARLY_DEFAULT,
} from "../sgCalc";

export default function TreasureCouponsCalculator() {
  const navigate = useNavigate();
  const { guest, state, patch, result } = useSgCalc();
  const coupons = result.treasureCoupons;

  return (
    <div className="sky-page">
      <div className="shell">
        <div className="shell-head">
          <div className="brand">
            <div className="head-with-help">
              <h1>Treasure Coupons Calculator</h1>
              <HelpTip
                title="Treasure Coupons"
                steps={[
                  "Tick only the checkbox for each income source.",
                  `Every ${TREASURE_COUPONS_PER_COMPLETION} coupons is one full completion.`,
                  "Only full completions count. Leftover coupons wait for the next 150.",
                  "Each full completion gives one purple, green, red, orange, and pink Treasure selection chest.",
                ]}
              />
            </div>
            <p>
              Track Treasure Coupon income, pick a time period, then see how
              many full completions you can run.
            </p>
          </div>
          <button className="tan-btn" type="button" onClick={() => navigate("/")}>
            Back to menu
          </button>
        </div>
        {guest ? (
          <p className="guest-banner">
            Guest mode — this calculator is only for this visit. Create an
            account to save it.
          </p>
        ) : null}
        <div className="shell-body no-sidebar">
          <section className="main-panel calc-panel">
            <div className="total-banner preview-banner pages-event-banner">
              <div>
                <h3>150-coupon full completion</h3>
                <p>
                  Consume{" "}
                  <TreasureCouponAmount value={TREASURE_COUPONS_PER_COMPLETION} />{" "}
                  for 1 full completion
                </p>
                <p className="pages-event-rewards">
                  {TREASURE_CHESTS.map((chest) => (
                    <TreasureChestAmount
                      key={chest.color}
                      color={chest.color}
                      value={1}
                    />
                  ))}
                </p>
                <p>
                  Coupons in {periodLabel(state.months)}:{" "}
                  <TreasureCouponAmount value={coupons.period} />
                </p>
                <p>
                  Leftover in {periodLabel(state.months)}:{" "}
                  <TreasureCouponAmount value={coupons.leftoverPeriod} />
                </p>
              </div>
              <div className="pages-event-total">
                <span>Full completions / {periodLabel(state.months)}</span>
                <strong>{coupons.completionsPeriod}</strong>
                <span className="pages-event-rewards">
                  {TREASURE_CHESTS.map((chest) => (
                    <TreasureChestAmount
                      key={chest.color}
                      color={chest.color}
                      value={coupons.chestsPeriod}
                    />
                  ))}
                </span>
                <span>
                  <TreasureCouponAmount value={coupons.yearly} /> / year
                </span>
              </div>
            </div>

            <article className="calc-row">
              <div className="calc-row-head">
                <div className="head-with-help">
                  <h3>Time period</h3>
                  <HelpTip
                    title="Time period"
                    steps={[
                      "Choose 1 month to 5 years, or drag the slider.",
                      "The preview above scales coupons and full completions to this window.",
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
              <label className="field">
                <span>Months (1-60)</span>
                <input
                  className="cell-input"
                  type="range"
                  min="1"
                  max="60"
                  value={state.months}
                  onChange={(event) =>
                    patch({ months: clampMonths(event.target.value) })
                  }
                />
                <input
                  className="cell-input weeks-input"
                  type="number"
                  min="1"
                  max="60"
                  value={state.months}
                  onChange={(event) =>
                    patch({ months: clampMonths(event.target.value) })
                  }
                />
              </label>
            </article>

            <article className="calc-row">
              <div className="calc-row-head">
                <div className="head-with-help">
                  <h3>Coupon income</h3>
                  <HelpTip
                    title="Coupon income"
                    steps={[
                      "Arena store is 3 Treasure Coupons every week.",
                      `Other sources start at ${TREASURE_OTHER_YEARLY_DEFAULT} / year and can be changed.`,
                      "Only full 150-coupon completions count.",
                    ]}
                  />
                </div>
                <TreasureCouponAmount value={coupons.period} />
                <span className="per-label">/ {periodLabel(state.months)}</span>
              </div>
              <p className="muted">
                Tick the sources you use. A full completion is{" "}
                {TREASURE_COUPONS_PER_COMPLETION} coupons. Chests are 10 purple,
                30 green, 60 red, 100 orange, and 150 pink.
              </p>
              <div className="check-grid">
                <div className="check-card">
                  <input
                    type="checkbox"
                    checked={state.treasureArenaStore}
                    onChange={(event) =>
                      patch({ treasureArenaStore: event.target.checked })
                    }
                  />
                  <span>
                    {TREASURE_ARENA_WEEKLY} from arena store (
                    <TreasureCouponAmount value={coupons.arenaWeekly} /> / week,{" "}
                    <TreasureCouponAmount value={coupons.arenaYearly} /> / year)
                  </span>
                </div>
                <div className="check-card">
                  <input
                    type="checkbox"
                    checked={state.treasureOtherOn}
                    onChange={(event) =>
                      patch({ treasureOtherOn: event.target.checked })
                    }
                  />
                  <span>
                    <TreasureCouponAmount iconOnly /> Other sources (special
                    events / Reverie keys / cd keys), about{" "}
                    {TREASURE_OTHER_YEARLY_DEFAULT} / year
                  </span>
                  <input
                    className="cell-input weeks-input"
                    type="number"
                    min="0"
                    disabled={!state.treasureOtherOn}
                    value={state.treasureOtherYearly}
                    onChange={(event) =>
                      patch({
                        treasureOtherYearly: Math.max(
                          0,
                          Number(event.target.value || 0)
                        ),
                      })
                    }
                  />
                </div>
              </div>
            </article>
          </section>
        </div>
      </div>
    </div>
  );
}
