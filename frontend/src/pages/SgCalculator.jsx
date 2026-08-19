import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AwakensIncome from "../components/AwakensIncome.jsx";
import CsgAmount from "../components/CsgAmount.jsx";
import HelpTip from "../components/HelpTip.jsx";
import { formatNumber } from "../rewards";
import { useSgCalc } from "../useSgCalc";
import {
  B_STONE_CSG,
  clampMonths,
  MAX_VOID_CYCLE,
  PERIOD_PRESETS,
  periodLabel,
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
  const { guest, state, patch, result } = useSgCalc();
  const [section, setSection] = useState("period");

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
        {guest ? (
          <p className="guest-banner">
            Guest mode — this calculator is only for this visit. Create an account
            to save it.
          </p>
        ) : null}
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

            <AwakensIncome state={state} result={result} patch={patch} />

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
