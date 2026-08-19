import { useNavigate } from "react-router-dom";
import HelpTip from "../components/HelpTip.jsx";
import MonsterTicketAmount from "../components/MonsterTicketAmount.jsx";
import { useSgCalc } from "../useSgCalc";
import {
  clampMonths,
  MONSTER_TICKETS_YEARLY_DEFAULT,
  PERIOD_PRESETS,
  periodLabel,
} from "../sgCalc";

export default function MonsterTicketsCalculator() {
  const navigate = useNavigate();
  const { guest, state, patch, result } = useSgCalc();
  const tickets = result.monsterTickets;

  return (
    <div className="sky-page">
      <div className="shell">
        <div className="shell-head">
          <div className="brand">
            <div className="head-with-help">
              <h1>Monster Tickets Calculator</h1>
              <HelpTip
                title="Monster Tickets"
                steps={[
                  "Tick only the checkbox for the income source.",
                  "The default is 40 tickets / year from special events, Reverie keys, and CD keys.",
                  "Pick a time period to see how many tickets you get in that window.",
                ]}
              />
            </div>
            <p>
              Track Monster Ticket income from special events, Reverie keys, and
              CD keys.
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
            <div className="total-banner preview-banner">
              <div>
                <h3>Monster tickets</h3>
                <p>
                  In {periodLabel(state.months)}:{" "}
                  <MonsterTicketAmount value={tickets.period} />
                </p>
              </div>
              <div className="pages-event-total">
                <span>/ year</span>
                <MonsterTicketAmount
                  value={tickets.yearly}
                  className="preview-hero"
                />
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
                      "The preview above scales tickets to this window.",
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
                  <h3>Ticket income</h3>
                  <HelpTip
                    title="Ticket income"
                    steps={[
                      "Tick the row if you count these tickets.",
                      `The value starts at ${MONSTER_TICKETS_YEARLY_DEFAULT} / year and can be changed.`,
                    ]}
                  />
                </div>
                <MonsterTicketAmount value={tickets.period} />
                <span className="per-label">/ {periodLabel(state.months)}</span>
              </div>
              <div className="check-grid">
                <div className="check-card">
                  <input
                    type="checkbox"
                    checked={state.monsterTicketsOn}
                    onChange={(event) =>
                      patch({ monsterTicketsOn: event.target.checked })
                    }
                  />
                  <span>
                    <MonsterTicketAmount iconOnly /> Other sources (special
                    events / Reverie keys / cd keys), about{" "}
                    {MONSTER_TICKETS_YEARLY_DEFAULT} / year
                  </span>
                  <input
                    className="cell-input weeks-input"
                    type="number"
                    min="0"
                    disabled={!state.monsterTicketsOn}
                    value={state.monsterTicketsYearly}
                    onChange={(event) =>
                      patch({
                        monsterTicketsYearly: Math.max(
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
