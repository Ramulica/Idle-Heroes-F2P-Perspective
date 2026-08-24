import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AwakenAmount from "./AwakenAmount.jsx";
import HelpTip from "./HelpTip.jsx";
import {
  A_BETTER_CHANCE,
  A_BETTER_GROUP_ID,
  A_BETTER_TIERS,
  AWAKEN_DISPLAY_TIERS,
  expectedAwakens,
  formatChance,
  formatExpected,
} from "../awakenChances";

export default function AwakensSimulator({ yearlyAwakens = 0 }) {
  const navigate = useNavigate();
  const yearly = Math.max(0, Math.round(Number(yearlyAwakens) || 0));
  const [amountText, setAmountText] = useState("");
  const [showABetter, setShowABetter] = useState(false);
  const amount =
    amountText === "" ? yearly : Math.max(0, Math.floor(Number(amountText) || 0));

  return (
    <div className="awakens-simulator">
      <div className="total-banner preview-banner">
        <div>
          <div className="head-with-help">
            <h3>Awakens simulator</h3>
            <HelpTip
              title="Awakens simulator"
              steps={[
                "Yearly income comes from the Awakens Calculator.",
                "Leave the amount blank to use that yearly income, or type how many awakens to roll.",
                "The table is the expected number of each rarity, using in-game chances. It is not a random roll.",
                "A- and better is one row. Open the info button to see A-, A, A+, and S ~ SSS separately.",
              ]}
            />
          </div>
          <p>
            Yearly income: <AwakenAmount value={yearly} />
          </p>
        </div>
        <div className="pages-event-total awakens-year-total">
          <span>Simulating</span>
          <AwakenAmount value={amount} className="preview-hero" />
        </div>
      </div>

      <article className="calc-row">
        <div className="calc-row-head">
          <div className="head-with-help">
            <h3>How many awakens</h3>
            <HelpTip
              title="How many awakens"
              steps={[
                "Blank uses your yearly awaken income.",
                "Type a number to see a different batch, such as 50 or 1000.",
              ]}
            />
          </div>
        </div>
        <label className="field">
          <span>Awakens to simulate</span>
          <input
            className="cell-input weeks-input"
            type="number"
            min="0"
            placeholder={String(yearly)}
            value={amountText}
            onChange={(event) => setAmountText(event.target.value)}
          />
          <button
            className="tan-btn"
            type="button"
            onClick={() => setAmountText("")}
          >
            Use yearly
          </button>
          <button
            className="tan-btn"
            type="button"
            onClick={() => navigate("/guides/awakens-calculator")}
          >
            Open Awakens Calculator
          </button>
        </label>
      </article>

      <article className="calc-row">
        <div className="calc-row-head">
          <h3>Expected rarities</h3>
          <span className="calc-badge">{formatExpected(amount)} awakens</span>
        </div>
        <p className="muted">
          Expected count = awakens × chance. A- and better groups A-, A, A+,
          and S ~ SSS.
        </p>
        <div className="awaken-rarity-table">
          <div className="awaken-rarity-head">
            <span>Rarity</span>
            <span>Chance</span>
            <span>Expected</span>
          </div>
          {AWAKEN_DISPLAY_TIERS.map((row) => (
            <div className="awaken-rarity-row" key={row.id}>
              <span className="awaken-rarity-name" style={{ color: row.color }}>
                {row.label}
                {row.id === A_BETTER_GROUP_ID ? (
                  <button
                    className="info-btn"
                    type="button"
                    aria-label="A- and better breakdown"
                    title="A- and better breakdown"
                    onClick={() => setShowABetter(true)}
                  >
                    <svg
                      className="info-btn-icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <circle cx="12" cy="7.6" r="1.4" fill="currentColor" />
                      <path
                        d="M12 11.1v6.3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                ) : null}
              </span>
              <span>{formatChance(row.chance)}</span>
              <span>{formatExpected(expectedAwakens(amount, row.chance))}</span>
            </div>
          ))}
        </div>
      </article>

      {showABetter ? (
        <div className="modal-back" onClick={() => setShowABetter(false)}>
          <div
            className="modal awaken-rarity-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>A- and better</h3>
            <p className="muted">
              Combined chance {formatChance(A_BETTER_CHANCE)} for{" "}
              {formatExpected(amount)} awakens.
            </p>
            <div className="awaken-rarity-table">
              <div className="awaken-rarity-head">
                <span>Rarity</span>
                <span>Chance</span>
                <span>Expected</span>
              </div>
              {A_BETTER_TIERS.map((row) => (
                <div className="awaken-rarity-row" key={row.id}>
                  <span
                    className="awaken-rarity-name"
                    style={{ color: row.color }}
                  >
                    {row.label}
                  </span>
                  <span>{formatChance(row.chance)}</span>
                  <span>
                    {formatExpected(expectedAwakens(amount, row.chance))}
                  </span>
                </div>
              ))}
            </div>
            <div className="row-actions">
              <button
                className="gold-btn"
                type="button"
                onClick={() => setShowABetter(false)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
