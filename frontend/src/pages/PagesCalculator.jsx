import { useNavigate } from "react-router-dom";
import AwakenAmount from "../components/AwakenAmount.jsx";
import HelpTip from "../components/HelpTip.jsx";
import PagesAmount from "../components/PagesAmount.jsx";
import SpecialBoxAmount from "../components/SpecialBoxAmount.jsx";
import { useSgCalc } from "../useSgCalc";
import {
  PAGES_ARENA_WEEKLY,
  PAGES_EVENT_AWAKENS,
  PAGES_FACTORY_EVENTS_PER_YEAR,
  PAGES_FACTORY_PER_EVENT,
  PAGES_FACTORY_YEARLY,
  PAGES_GEMS_MONTHLY,
  PAGES_OTHER_YEARLY_DEFAULT,
  PAGES_PER_EVENT,
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
                  `Every ${PAGES_PER_EVENT} pages runs one event for ${PAGES_EVENT_AWAKENS} awakens plus a special box.`,
                  "Open Awakens Calculator and tick Pages of Destiny to add those awakens to CSG income.",
                ]}
              />
            </div>
            <p>
              Track yearly Pages of Destiny, then see how many 100-page events
              you can run.
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
        <div className="shell-body">
          <section className="main-panel calc-panel">
            <div className="total-banner pages-event-banner">
              <div>
                <h3>100-page event</h3>
                <p>
                  Consume <PagesAmount value={PAGES_PER_EVENT} /> to get{" "}
                  <AwakenAmount value={PAGES_EVENT_AWAKENS} /> +{" "}
                  <SpecialBoxAmount value={1} />
                </p>
                <p>
                  Leftover this year: <PagesAmount value={pages.leftoverPages} />
                </p>
              </div>
              <div className="pages-event-total">
                <span>Times / year</span>
                <strong>{pages.eventsYearly}</strong>
                <span className="pages-event-rewards">
                  <AwakenAmount value={pages.awakensYearly} />
                  <SpecialBoxAmount value={pages.boxesYearly} />
                </span>
              </div>
            </div>

            <article className="calc-row">
              <div className="calc-row-head">
                <div className="head-with-help">
                  <h3>Pages income</h3>
                  <HelpTip
                    title="Pages income"
                    steps={[
                      "Arena store is 3 pages every week.",
                      "The gem pack is 10 pages a month for 20k gems.",
                      "Fantasy Factory is about 5 prophet orb events a year, 10 pages each, 50 / year. The 5-week cycle is shown as a reference.",
                      "Other sources start at 40 / year and can be changed.",
                    ]}
                  />
                </div>
                <PagesAmount value={pages.pagesYearly} />
                <span className="per-label">/ year</span>
              </div>
              <p className="muted">
                Tick the sources you use. Totals are per year. Prophet orb
                events also show the 5-week cycle as a reference.
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
                    events / year). Reference:{" "}
                    <PagesAmount value={PAGES_FACTORY_PER_EVENT} /> per 5-week
                    event cycle.
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
                    Other sources (special events / Revery boxes), about{" "}
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
