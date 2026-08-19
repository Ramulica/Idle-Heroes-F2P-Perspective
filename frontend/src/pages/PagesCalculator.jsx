import { useNavigate } from "react-router-dom";
import AwakenAmount from "../components/AwakenAmount.jsx";
import HelpTip from "../components/HelpTip.jsx";
import PagesAmount from "../components/PagesAmount.jsx";
import SpecialBoxAmount from "../components/SpecialBoxAmount.jsx";
import { useSgCalc } from "../useSgCalc";
import {
  clampMonths,
  PAGES_ARENA_WEEKLY,
  PAGES_EVENT_AWAKENS,
  PAGES_FACTORY_EVENTS_PER_YEAR,
  PAGES_FACTORY_PER_EVENT,
  PAGES_FACTORY_YEARLY,
  PAGES_GEMS_MONTHLY,
  PAGES_OTHER_YEARLY_DEFAULT,
  PAGES_PER_EVENT,
  PERIOD_PRESETS,
  periodLabel,
} from "../sgCalc";

export default function PagesCalculator() {
  const navigate = useNavigate();
  const { guest, state, patch, result } = useSgCalc();
  const pages = result.pages;

  return (
    <div className="sky-page">
      <div className="shell">
        <div className="shell-head">
          <div className="brand">
            <div className="head-with-help">
              <h1>Pages of Destiny Calculator</h1>
              <HelpTip
                title="Pages of Destiny"
                steps={[
                  "Tick only the checkbox for each income source.",
                  "Pick a time period to see pages, events, awakens, and boxes in that window.",
                  `Every ${PAGES_PER_EVENT} pages runs one Conductors Offer event for ${PAGES_EVENT_AWAKENS} awakens plus a special box.`,
                  "Open Awakens Calculator and tick Pages of Destiny to add those awakens to CSG income.",
                ]}
              />
            </div>
            <p>
              Track Pages of Destiny income, pick a time period, then see how
              many 100-page Conductors Offer events you can run.
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
                <h3>100-page Conductors Offer event</h3>
                <p>
                  Consume <PagesAmount value={PAGES_PER_EVENT} /> to get{" "}
                  <AwakenAmount value={PAGES_EVENT_AWAKENS} /> +{" "}
                  <SpecialBoxAmount value={1} />
                </p>
                <p>
                  Pages in {periodLabel(state.months)}:{" "}
                  <PagesAmount value={pages.pagesPeriod} />
                </p>
                <p>
                  Leftover in {periodLabel(state.months)}:{" "}
                  <PagesAmount value={pages.leftoverPeriod} />
                </p>
              </div>
              <div className="pages-event-total">
                <span>Times / {periodLabel(state.months)}</span>
                <strong>{pages.eventsPeriod}</strong>
                <span className="pages-event-rewards">
                  <AwakenAmount value={pages.awakensPeriod} />
                  <SpecialBoxAmount value={pages.boxesPeriod} />
                </span>
                <span>
                  {pages.eventsYearly} / year ·{" "}
                  <PagesAmount value={pages.pagesYearly} /> / year
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
                      "The preview above scales pages, events, awakens, and boxes to this window.",
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
                  <h3>Pages income</h3>
                  <HelpTip
                    title="Pages income"
                    steps={[
                      "Arena store is 3 pages every week.",
                      "The gem pack is 10 pages a month for 20k gems.",
                      "Fantasy Factory is about 5 prophet orb events a year, 10 pages each, 50 / year.",
                      "Other sources start at 40 / year and can be changed.",
                    ]}
                  />
                </div>
                <PagesAmount value={pages.pagesPeriod} />
                <span className="per-label">/ {periodLabel(state.months)}</span>
              </div>
              <p className="muted">
                Tick the sources you use. The period above scales how many pages
                and 100-page Conductors Offer events you get.
              </p>
              <div className="check-grid">
                <div className="check-card">
                  <input
                    type="checkbox"
                    checked={state.pagesArenaStore}
                    onChange={(event) =>
                      patch({ pagesArenaStore: event.target.checked })
                    }
                  />
                  <span>
                    {PAGES_ARENA_WEEKLY} pages from arena store (
                    <PagesAmount value={pages.arenaWeekly} /> / week,{" "}
                    <PagesAmount value={pages.arenaYearly} /> / year)
                  </span>
                </div>
                <div className="check-card">
                  <input
                    type="checkbox"
                    checked={state.pagesGemsMonthly}
                    onChange={(event) =>
                      patch({ pagesGemsMonthly: event.target.checked })
                    }
                  />
                  <span>
                    {PAGES_GEMS_MONTHLY} pages every month for 20k gems (
                    <PagesAmount value={pages.gemsYearly} /> / year)
                  </span>
                </div>
                <div className="check-card">
                  <input
                    type="checkbox"
                    checked={state.pagesFactory}
                    onChange={(event) =>
                      patch({ pagesFactory: event.target.checked })
                    }
                  />
                  <span>
                    {PAGES_FACTORY_YEARLY} pages / year from Fantasy Factory
                    prophet orb events (about {PAGES_FACTORY_EVENTS_PER_YEAR}{" "}
                    events / year,{" "}
                    <PagesAmount value={PAGES_FACTORY_PER_EVENT} /> each).
                  </span>
                </div>
                <div className="check-card">
                  <input
                    type="checkbox"
                    checked={state.pagesOtherOn}
                    onChange={(event) =>
                      patch({ pagesOtherOn: event.target.checked })
                    }
                  />
                  <span>
                    Other sources (special events / Reverie keys / cd keys),
                    about{" "}
                    {PAGES_OTHER_YEARLY_DEFAULT} / year
                  </span>
                  <input
                    className="cell-input weeks-input"
                    type="number"
                    min="0"
                    disabled={!state.pagesOtherOn}
                    value={state.pagesOtherYearly}
                    onChange={(event) =>
                      patch({
                        pagesOtherYearly: Math.max(
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
