import AwakenAmount from "./AwakenAmount.jsx";
import CsgAmount from "./CsgAmount.jsx";
import HelpTip from "./HelpTip.jsx";
import SpecialBoxAmount from "./SpecialBoxAmount.jsx";
import {
  BASE_WEEKLY_AWAKENS,
  LABYRINTH_AWAKENS,
  LABYRINTH_CSG_COST,
  RANK_BRACKETS,
  periodLabel,
  rankAwakens,
} from "../sgCalc";

export default function AwakensIncome({ state, result, patch }) {
  const pages = result.pages || {};

  return (
    <article className="calc-row" id="sg-awakens">
      <div className="calc-row-head">
        <div className="head-with-help">
          <h3>Awakens income</h3>
          <HelpTip
            title="Awakens"
            steps={[
              "Pick your Trial of the Champion arena rank. Everyone also gets 3 from the arena store.",
              "Tick only the checkbox, not the whole row.",
              "Sky Labyrinth adds 10 soulbond + 8 normal awakens / 5 weeks and costs 1000 CSG / 5 weeks.",
              "Fantasy Factory every time or every other are mutually exclusive.",
              "Pages of Destiny adds 30 awakens per 100-page event if that tick is on.",
            ]}
          />
        </div>
        <CsgAmount value={result.awakenCsgPerCycle} />
        <span className="per-label">/ 5 weeks</span>
      </div>
      <p className="muted">
        Soul Awakening income is based on your rank in Trial of the Champion
        arena. Everyone also gets +{BASE_WEEKLY_AWAKENS} awakens from the arena
        store.
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
                {row.label} · {rankAwakens(row.id, state.accountLevel)} awakens
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
            onChange={(event) => patch({ skyLabyrinth: event.target.checked })}
          />
          <span>
            10 soulbond + 8 normal awakens from Sky Labyrinth (
            <AwakenAmount value={LABYRINTH_AWAKENS} /> every 5 weeks,{" "}
            <CsgAmount value={-LABYRINTH_CSG_COST} /> every 5 weeks)
          </span>
        </div>
        <div className="check-card factory-card">
          <span>10 soulbond from Fantasy Factory</span>
          <div className="factory-option">
            <input
              type="checkbox"
              checked={state.factoryMode === "every"}
              onChange={() =>
                patch({
                  factoryMode: state.factoryMode === "every" ? "off" : "every",
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
                  factoryMode: state.factoryMode === "other" ? "off" : "other",
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
            onChange={(event) => patch({ deluxeOn: event.target.checked })}
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
                deluxeAwakens: Math.max(0, Number(event.target.value || 0)),
              })
            }
          />
        </div>
        <div className="check-card">
          <input
            type="checkbox"
            checked={state.includePagesAwakens}
            onChange={(event) =>
              patch({ includePagesAwakens: event.target.checked })
            }
          />
          <span>
            Awakens from Pages of Destiny events (
            <AwakenAmount value={pages.awakensYearly} /> / year +{" "}
            <SpecialBoxAmount value={pages.boxesYearly} /> / year)
          </span>
        </div>
      </div>
      <div className="stat-line">
        <span>
          <AwakenAmount value={result.awakensPerCycle} /> every 5-week event
          cycle
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
        That is <CsgAmount value={result.awakenCsgPerCycle} /> every 5 weeks, and{" "}
        <CsgAmount value={result.awakenPeriod} /> over {periodLabel(state.months)}
        .
      </p>
    </article>
  );
}
