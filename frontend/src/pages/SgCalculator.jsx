import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import AwakenAmount from "../components/AwakenAmount.jsx";
import CsgAmount from "../components/CsgAmount.jsx";
import HelpTip from "../components/HelpTip.jsx";
import { formatNumber } from "../rewards";
import {
  BASE_WEEKLY_AWAKENS,
  B_STONE_CSG,
  calculateSg,
  clampMonths,
  DEFAULT_STATE,
  LABYRINTH_CSG_COST,
  MAX_VOID_CYCLE,
  PERIOD_PRESETS,
  periodLabel,
  RANK_BRACKETS,
  rankAwakens,
  VOID_MILESTONES,
} from "../sgCalc";

const SECTIONS = [
  { id: "period", label: "Time period" },
  { id: "void", label: "Realms Gate" },
  { id: "awakens", label: "Awakens" },
  { id: "bstone", label: "Soul Gala" },
  { id: "other", label: "Other sources" },
  { id: "p2w", label: "CSG for money" },
];

export default function SgCalculator() {
  const navigate = useNavigate();
  const [state, setState] = useState(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const [section, setSection] = useState("period");
  const result = useMemo(() => calculateSg(state), [state]);

  useEffect(() => {
    let cancelled = false;
    api
      .getSgCalc()
      .then((payload) => {
        if (!cancelled) {
          setState({ ...DEFAULT_STATE, ...(payload.state || {}) });
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => {
      api.saveSgCalc(state).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [state, loaded]);

  function patch(partial) {
    setState((current) => ({ ...current, ...partial }));
  }

  function scrollTo(id) {
    setSection(id);
    document.getElementById(`sg-${id}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <div className="sky-page">
      <div className="shell">
        <div className="shell-head">
          <div className="brand">
            <div className="head-with-help">
              <h1>CSG Calculator</h1>
              <HelpTip
                title="CSG Calculator"
                steps={[
                  "Fill each block to match your account. Totals save automatically.",
                  "Pick a time period first. Every source below is scaled to that window.",
                  "Tap a sidebar name to jump to that block. CSG / year on the main menu uses a 1-year version of this total.",
                ]}
              />
            </div>
            <p>
              Fill in your account, then see Contract Starry Gem income for{" "}
              {periodLabel(state.months)}.
            </p>
          </div>
          <button className="tan-btn" type="button" onClick={() => navigate("/")}>
            Back to menu
          </button>
        </div>
        <div className="shell-body">
          <nav className="sidebar">
            {SECTIONS.map((item) => (
              <button
                key={item.id}
                className={`nav-btn${section === item.id ? " active" : ""}`}
                type="button"
                onClick={() => scrollTo(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <section className="main-panel calc-panel">
            <TotalBanner result={result} period={periodLabel(state.months)} />

            <article className="calc-row" id="sg-period">
              <div className="calc-row-head">
                <div className="head-with-help">
                  <h3>Time period</h3>
                  <HelpTip
                    title="Time period"
                    steps={[
                      "Choose 1 month to 5 years, or drag the slider.",
                      "All CSG below is scaled to this window.",
                      "Account level changes arena rank awakens: below 140 is −1, above 180 is +1.",
                    ]}
                  />
                </div>
                <span className="calc-badge">{periodLabel(state.months)}</span>
              </div>
              <p className="muted">
                Choose from 1 month to 5 years. All sources below are scaled to
                this window.
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
            </article>

            <article className="calc-row void-row" id="sg-void">
              <div className="calc-row-head">
                <div className="head-with-help">
                  <h3>Realms Gate Void Corruption</h3>
                  <HelpTip
                    title="Void Corruption"
                    steps={[
                      "Set your max Void Corruption. 80+ is 600 CSG every 5 weeks.",
                      "This is per 5 weeks, not per month.",
                      "The total on the right is one 5-week cycle.",
                    ]}
                  />
                </div>
                <CsgAmount value={result.voidPerCycle} />
                <span className="per-label">/ 5 weeks</span>
              </div>
              <p>
                Max Void Corruption {state.voidLevel >= 80 ? "80+" : state.voidLevel}{" "}
                pays {formatNumber(result.voidPerCycle)} CSG every 5 weeks, up to{" "}
                {MAX_VOID_CYCLE}/5 weeks at 80+. Over {periodLabel(state.months)} that
                is <CsgAmount value={result.voidPeriod} />.
              </p>
              <label className="field light">
                <span>Max Void Corruption (1 to 80+)</span>
                <input
                  type="range"
                  min="1"
                  max="80"
                  value={Math.min(80, Math.max(1, Number(state.voidLevel) || 1))}
                  onChange={(event) =>
                    patch({ voidLevel: Number(event.target.value) })
                  }
                />
                <strong>{state.voidLevel >= 80 ? "80+" : state.voidLevel}</strong>
              </label>
              <div className="void-table">
                <div className="void-line head">
                  <span>Requirements for clearing stages</span>
                  <span></span>
                  <span>Reward</span>
                </div>
                {VOID_MILESTONES.map((row) => {
                  const reached = state.voidLevel >= row.level;
                  return (
                    <div
                      className={`void-line${reached ? " reached" : " locked"}`}
                      key={row.level}
                    >
                      <span>Max Void Corruption {row.level}</span>
                      <span className="void-arrow">➤</span>
                      <CsgAmount value={row.csg} />
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="calc-row" id="sg-awakens">
              <div className="calc-row-head">
                <div className="head-with-help">
                  <h3>Awakens income</h3>
                  <HelpTip
                    title="Awakens"
                    steps={[
                      "Pick your Auction House rank. Everyone also gets 3 from the arena store.",
                      "Tick only the checkbox, not the whole row.",
                      "Sky Labyrinth adds 17 awakens / 5 weeks and costs 1000 CSG / 5 weeks.",
                      "Fantasy Factory every time or every other are mutually exclusive.",
                    ]}
                  />
                </div>
                <CsgAmount value={result.awakenCsgPerCycle} />
                <span className="per-label">/ 5 weeks</span>
              </div>
              <p className="muted">
                Soul Awakening ranking is per Auction House trade zone. Everyone
                also gets +{BASE_WEEKLY_AWAKENS} awakens from arena store.
                Below account lv 140, rank awakens are -1. Above lv 180 they are
                +1. Top 20 is {rankAwakens("10-20", state.accountLevel)}+
                {BASE_WEEKLY_AWAKENS} ={" "}
                {rankAwakens("10-20", state.accountLevel) + BASE_WEEKLY_AWAKENS}{" "}
                weekly
                {result.rankMod
                  ? ` (${result.rankMod > 0 ? "lv 180+" : "below lv 140"})`
                  : ""}
                .
              </p>
              <div className="field-grid">
                <label className="field">
                  <span>Soul Awakening rank</span>
                  <select
                    className="cell-select"
                    value={state.rankId}
                    onChange={(event) => patch({ rankId: event.target.value })}
                  >
                    {RANK_BRACKETS.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.label} ·{" "}
                        {rankAwakens(row.id, state.accountLevel)} awakens
                      </option>
                    ))}
                  </select>
                </label>
                <div className="stat-box">
                  <span>Weekly awakens</span>
                  <strong>
                    <AwakenAmount value={result.weekly} /> ({result.ranking}+
                    {BASE_WEEKLY_AWAKENS})
                  </strong>
                </div>
              </div>
              <div className="check-grid">
                <div className="check-card">
                  <input
                    type="checkbox"
                    checked={state.mysteriousChest}
                    onChange={(event) =>
                      patch({ mysteriousChest: event.target.checked })
                    }
                  />
                  <span>
                    10 soulbond awakens in Mysterious Chest for 16k gems (
                    <AwakenAmount value={10} /> every 5 weeks)
                  </span>
                </div>
                <div className="check-card">
                  <input
                    type="checkbox"
                    checked={state.skyLabyrinth}
                    onChange={(event) =>
                      patch({ skyLabyrinth: event.target.checked })
                    }
                  />
                  <span>
                    10 soulbond + 7 normal awakens from Sky Labyrinth (
                    <AwakenAmount value={17} /> every 5 weeks,{" "}
                    <CsgAmount value={-LABYRINTH_CSG_COST} /> every 5 weeks)
                  </span>
                </div>
                <div className="check-card factory-card">
                  <span>
                    10 soulbond from Fantasy Factory
                  </span>
                  <div className="factory-option">
                    <input
                      type="checkbox"
                      checked={state.factoryMode === "every"}
                      onChange={() =>
                        patch({
                          factoryMode:
                            state.factoryMode === "every" ? "off" : "every",
                        })
                      }
                    />
                    <span>
                      every time (<AwakenAmount value={10} /> every 5 weeks)
                    </span>
                  </div>
                  <div className="factory-option">
                    <input
                      type="checkbox"
                      checked={state.factoryMode === "other"}
                      onChange={() =>
                        patch({
                          factoryMode:
                            state.factoryMode === "other" ? "off" : "other",
                        })
                      }
                    />
                    <span>
                      every other time (<AwakenAmount value={10} /> every 10 weeks)
                    </span>
                  </div>
                </div>
                <div className="check-card">
                  <input
                    type="checkbox"
                    checked={state.freeAwakensOn}
                    onChange={(event) =>
                      patch({ freeAwakensOn: event.target.checked })
                    }
                  />
                  <span>Free awakens every 5 weeks</span>
                  <input
                    className="cell-input weeks-input"
                    type="number"
                    min="2"
                    max="5"
                    disabled={!state.freeAwakensOn}
                    value={state.freeAwakens}
                    onChange={(event) =>
                      patch({
                        freeAwakens: Math.min(
                          5,
                          Math.max(2, Number(event.target.value || 2))
                        ),
                      })
                    }
                  />
                </div>
                <div className="check-card">
                  <input
                    type="checkbox"
                    checked={state.deluxeOn}
                    onChange={(event) =>
                      patch({ deluxeOn: event.target.checked })
                    }
                  />
                  <span>Awakens from events (deluxe boxes)</span>
                  <input
                    className="cell-input weeks-input"
                    type="number"
                    min="0"
                    disabled={!state.deluxeOn}
                    value={state.deluxeAwakens}
                    onChange={(event) =>
                      patch({
                        deluxeAwakens: Math.max(
                          0,
                          Number(event.target.value || 0)
                        ),
                      })
                    }
                  />
                </div>
              </div>
              <div className="stat-line">
                <span>
                  <AwakenAmount value={result.awakensPerCycle} /> every 5-week
                  event cycle
                  {state.factoryMode === "other" ? (
                    <>
                      {" "}
                      + <AwakenAmount value={10} /> every 10 weeks
                    </>
                  ) : null}
                </span>
                <label className="field compact">
                  <span>CSG per awaken</span>
                  <input
                    className="cell-input weeks-input"
                    type="number"
                    min="0"
                    value={state.csgPerAwaken}
                    onChange={(event) =>
                      patch({
                        csgPerAwaken: Math.max(0, Number(event.target.value || 0)),
                      })
                    }
                  />
                </label>
              </div>
              <p>
                That is <CsgAmount value={result.awakenCsgPerCycle} /> every 5
                weeks, and <CsgAmount value={result.awakenPeriod} /> over{" "}
                {periodLabel(state.months)}.
              </p>
            </article>

            <article className="calc-row" id="sg-bstone">
              <div className="calc-row-head">
                <div className="head-with-help">
                  <h3>Soul Gala B-stone</h3>
                  <HelpTip
                    title="Soul Gala B-stone"
                    steps={[
                      "Tick this if you buy the B-stone from Soul Gala.",
                      "It is 600 CSG every 10 weeks, scaled to your time period.",
                    ]}
                  />
                </div>
                <CsgAmount value={result.bStonePeriod} />
              </div>
              <div className="check-card">
                <input
                  type="checkbox"
                  checked={state.bStone}
                  onChange={(event) => patch({ bStone: event.target.checked })}
                />
                <span>
                  A B-stone every 10 weeks from Soul Gala ({B_STONE_CSG} CSG
                  every 10 weeks)
                </span>
              </div>
              {state.bStone && (
                <p>
                  {Number(result.cycles10).toFixed(1)} cycles in this
                  period → <CsgAmount value={result.bStonePeriod} />
                </p>
              )}
            </article>

            <article className="calc-row" id="sg-other">
              <div className="calc-row-head">
                <div className="head-with-help">
                  <h3>Other sources</h3>
                  <HelpTip
                    title="Other sources"
                    steps={[
                      "Enter extra CSG you get in a year that is not listed above.",
                      "The calculator scales that yearly amount to your chosen time period.",
                    ]}
                  />
                </div>
                <CsgAmount value={result.otherPeriod} />
              </div>
              <p className="muted">
                Events, temporary modes, or anything else that is not covered
                above. Enter a yearly CSG amount.
              </p>
              <label className="field">
                <span>CSG per year</span>
                <input
                  className="cell-input"
                  type="number"
                  min="0"
                  value={state.otherYearly}
                  onChange={(event) =>
                    patch({ otherYearly: Math.max(0, Number(event.target.value || 0)) })
                  }
                />
              </label>
            </article>

            <article className="calc-row" id="sg-p2w">
              <div className="calc-row-head">
                <div className="head-with-help">
                  <h3>CSG for money (P2W)</h3>
                  <HelpTip
                    title="CSG for money"
                    steps={[
                      "Enter CSG you buy with money, as a yearly amount.",
                      "Leave at 0 for a pure F2P estimate.",
                    ]}
                  />
                </div>
                <CsgAmount value={result.p2wPeriod} />
              </div>
              <p className="muted">
                Packs and paid Contract Starry Gems. Leave at 0 for a pure F2P
                view.
              </p>
              <label className="field">
                <span>CSG per year</span>
                <input
                  className="cell-input"
                  type="number"
                  min="0"
                  value={state.p2wYearly}
                  onChange={(event) =>
                    patch({ p2wYearly: Math.max(0, Number(event.target.value || 0)) })
                  }
                />
              </label>
            </article>

            <TotalBanner result={result} period={periodLabel(state.months)} />
          </section>
        </div>
      </div>
    </div>
  );
}

function TotalBanner({ result, period }) {
  return (
    <div className="total-banner">
      <div>
        <h3>Total CSG in {period}</h3>
        <p>
          Void {formatNumber(Math.round(result.voidPeriod))} · Awakens{" "}
          {formatNumber(Math.round(result.awakenPeriod))} · B-stone{" "}
          {formatNumber(Math.round(result.bStonePeriod))} · Other{" "}
          {formatNumber(Math.round(result.otherPeriod))} · P2W{" "}
          {formatNumber(Math.round(result.p2wPeriod))}
        </p>
      </div>
      <CsgAmount value={result.total} className="total-csg" />
    </div>
  );
}
