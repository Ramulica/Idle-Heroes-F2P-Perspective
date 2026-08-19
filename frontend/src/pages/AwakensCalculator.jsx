import { useNavigate } from "react-router-dom";
import AwakenAmount from "../components/AwakenAmount.jsx";
import AwakensIncome from "../components/AwakensIncome.jsx";
import HelpTip from "../components/HelpTip.jsx";
import { useSgCalc } from "../useSgCalc";
import { clampMonths, PERIOD_PRESETS, periodLabel } from "../sgCalc";

export default function AwakensCalculator() {
  const navigate = useNavigate();
  const { guest, state, patch, result } = useSgCalc();

  return (
    <div className="sky-page">
      <div className="shell">
        <div className="shell-head">
          <div className="brand">
            <div className="head-with-help">
              <h1>Awakens Calculator</h1>
              <HelpTip
                title="Awakens Calculator"
                steps={[
                  "This is the same awakens block as the CSG Calculator. Changes save to both.",
                  "Account level still changes Trial of the Champion rank awakens.",
                  "Tick Pages of Destiny if you want those event awakens in the total.",
                  "Tick Monster Tickets the same way for 100-ticket events.",
                ]}
              />
            </div>
            <p>
              Same awaken sources as the CSG Calculator. They stay in sync.
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
            <div className="total-banner preview-banner awakens-preview-banner">
              <div>
                <h3>Awakens preview</h3>
                <p>
                  Weekly: <AwakenAmount value={result.weekly} />
                </p>
                <p>
                  Every 5 weeks: <AwakenAmount value={result.awakensPerCycle} />
                  {state.factoryMode === "other" ? (
                    <>
                      {" "}
                      + <AwakenAmount value={10} /> every 10 weeks
                    </>
                  ) : null}
                </p>
              </div>
              <div className="pages-event-total">
                <span>/ year</span>
                <AwakenAmount
                  value={result.awakensYearly}
                  className="preview-hero"
                />
                <span>
                  Over {periodLabel(state.months)}:{" "}
                  <AwakenAmount value={result.awakensPeriodCount} />
                </span>
              </div>
            </div>
            <article className="calc-row" id="sg-period">
              <div className="calc-row-head">
                <div className="head-with-help">
                  <h3>Account and period</h3>
                  <HelpTip
                    title="Account and period"
                    steps={[
                      "Account level changes arena rank awakens: below 140 is −1, above 180 is +1.",
                      "Time period only scales the CSG total shown under awakens.",
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
                <span>Account level</span>
                <input
                  className="cell-input weeks-input"
                  type="number"
                  min="1"
                  value={state.accountLevel}
                  onChange={(event) =>
                    patch({ accountLevel: Number(event.target.value || 0) })
                  }
                />
              </label>
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
            </article>
            <AwakensIncome state={state} result={result} patch={patch} />
          </section>
        </div>
      </div>
    </div>
  );
}
