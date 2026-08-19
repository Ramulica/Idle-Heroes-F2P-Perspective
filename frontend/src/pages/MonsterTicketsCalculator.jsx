import { useNavigate } from "react-router-dom";
import AwakenAmount from "../components/AwakenAmount.jsx";
import HelpTip from "../components/HelpTip.jsx";
import MonsterTicketAmount from "../components/MonsterTicketAmount.jsx";
import SpecialBoxAmount from "../components/SpecialBoxAmount.jsx";
import { useSgCalc } from "../useSgCalc";
import {
  clampMonths,
  MONSTER_TICKETS_PER_EVENT,
  MONSTER_TICKETS_YEARLY_DEFAULT,
  PAGES_EVENT_AWAKENS,
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
                  `Every ${MONSTER_TICKETS_PER_EVENT} tickets runs one Conductors Offer event for ${PAGES_EVENT_AWAKENS} awakens plus a special box.`,
                  "Open Awakens Calculator and tick Monster Tickets to add those awakens to CSG income.",
                ]}
              />
            </div>
            <p>
              Track Monster Ticket income, pick a time period, then see how many
              100-ticket Conductors Offer events you can run.
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
                <h3>100-ticket Conductors Offer event</h3>
                <p>
                  Consume{" "}
                  <MonsterTicketAmount value={MONSTER_TICKETS_PER_EVENT} /> to
                  get <AwakenAmount value={PAGES_EVENT_AWAKENS} /> +{" "}
                  <SpecialBoxAmount value={1} />
                </p>
                <p>
                  Tickets in {periodLabel(state.months)}:{" "}
                  <MonsterTicketAmount value={tickets.period} />
                </p>
                <p>
                  Leftover in {periodLabel(state.months)}:{" "}
                  <MonsterTicketAmount value={tickets.leftoverPeriod} />
                </p>
              </div>
              <div className="pages-event-total">
                <span>Times / {periodLabel(state.months)}</span>
                <strong>{tickets.eventsPeriod}</strong>
                <span className="pages-event-rewards">
                  <AwakenAmount value={tickets.awakensPeriod} />
                  <SpecialBoxAmount value={tickets.boxesPeriod} />
                </span>
                <span>
                  <MonsterTicketAmount value={tickets.yearly} /> / year
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
                      "The preview above scales tickets, events, awakens, and boxes to this window.",
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
