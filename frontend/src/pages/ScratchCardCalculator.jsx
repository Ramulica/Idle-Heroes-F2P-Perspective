import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CanAmount from "../components/CanAmount.jsx";
import HelpTip from "../components/HelpTip.jsx";
import { formatNumber } from "../rewards";
import {
  EMPTY_BOARD,
  LINES,
  MAX_REVEALS,
  SUM_SCORE,
  TILE_SUITS,
  analyzeBoard,
  canPlaceNumber,
  explainStep,
  remainingNumbers,
  revealedCount,
  suggestReveal,
} from "../scratchCard";

const SUIT_MARK = {
  heart: "♥",
  spade: "♠",
  diamond: "♦",
  club: "♣",
};

function LineBubble({ line, recommended }) {
  return (
    <div
      className={`scratch-bubble${recommended ? " recommended" : ""}`}
      title={`${line.name}: about ${Math.round(line.ev)} cans, avg sum ${line.avgSum.toFixed(1)}`}
    >
      <strong>{formatNumber(Math.round(line.ev))}</strong>
      <span>{line.avgSum.toFixed(1)}</span>
    </div>
  );
}

function NumberPad({ used, onPick, onClear, onClose, canClear }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <h3>What number is on this tile?</h3>
        <p className="muted">Each of 1–9 appears once. Used numbers are locked.</p>
        <div className="scratch-pad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              className="scratch-pad-btn"
              type="button"
              disabled={used.has(n)}
              onClick={() => onPick(n)}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="row-actions">
          {canClear ? (
            <button className="tan-btn" type="button" onClick={onClear}>
              Clear tile
            </button>
          ) : null}
          <button className="gold-btn" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ScratchCardCalculator() {
  const navigate = useNavigate();
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [picker, setPicker] = useState(null);

  const analysis = useMemo(() => analyzeBoard(board), [board]);
  const suggestion = useMemo(() => suggestReveal(board), [board]);
  const revealed = revealedCount(board);
  const leftover = remainingNumbers(board);
  const used = new Set(board.filter((value) => value != null).map(Number));
  const attemptsLeft = Math.max(0, MAX_REVEALS - revealed);
  const explain = explainStep(board, suggestion);
  const byId = Object.fromEntries(analysis.lines.map((line) => [line.id, line]));
  const recommendedId = analysis.bestLine.id;

  function setCell(index, number) {
    setBoard((current) => {
      const next = current.slice();
      if (number == null) {
        next[index] = null;
        return next;
      }
      if (!canPlaceNumber(current, index, number)) return current;
      if (current[index] == null && revealedCount(current) >= MAX_REVEALS) {
        return current;
      }
      next[index] = number;
      return next;
    });
    setPicker(null);
  }

  return (
    <div className="sky-page">
      <div className="shell">
        <div className="shell-head">
          <div className="brand">
            <div className="head-with-help">
              <h1>Scratch Card Calculator</h1>
              <HelpTip
                title="Scratch Card Calculator"
                steps={[
                  "The 3×3 grid is 1–9 once each. You scratch 4 tiles, then pick a row, column, or diagonal.",
                  "The first scratch is random. Tap that tile and type the number you see.",
                  "The calculator then marks the next tile that teaches the most, and updates every line’s average cans.",
                  "Sum 6 (1-2-3) pays 1680 cans. Sum 24 (7-8-9) pays 1008. After 4 scratches, pick the highlighted line.",
                ]}
              />
            </div>
            <p>
              Uncover 4 tiles on the Celebration Scratchcard, then pick the line
              with the most cans.
            </p>
          </div>
          <button className="tan-btn" type="button" onClick={() => navigate("/")}>
            Back to menu
          </button>
        </div>
        <div className="shell-body no-sidebar">
          <section className="main-panel calc-panel">
            <div className="scratch-step">
              <h3>
                {revealed === 0
                  ? "Step 1 · First scratch"
                  : revealed < MAX_REVEALS
                    ? `Step ${revealed + 1} · Uncover for information`
                    : "Last step · Pick a line"}
              </h3>
              <p>{explain}</p>
              <p className="muted">
                Remaining attempt{attemptsLeft === 1 ? "" : "s"}: {attemptsLeft} ·
                leftover numbers: {leftover.join(", ") || "none"}
              </p>
            </div>

            <div className="scratch-play">
              <div className="scratch-board">
                <div className="scratch-top-lines">
                  <LineBubble line={byId.d1} recommended={recommendedId === "d1"} />
                  <LineBubble line={byId.c0} recommended={recommendedId === "c0"} />
                  <LineBubble line={byId.c1} recommended={recommendedId === "c1"} />
                  <LineBubble line={byId.c2} recommended={recommendedId === "c2"} />
                  <LineBubble line={byId.d0} recommended={recommendedId === "d0"} />
                </div>
                <div className="scratch-mid">
                  <div className="scratch-grid">
                    {board.map((value, index) => {
                      const suggested = suggestion.index === index;
                      const onBest = analysis.bestLine.cells.includes(index);
                      return (
                        <button
                          key={index}
                          className={`scratch-tile${value != null ? " open" : ""}${
                            suggested ? " suggested" : ""
                          }${onBest && revealed >= MAX_REVEALS ? " on-best" : ""}`}
                          type="button"
                          onClick={() => {
                            if (value == null && revealed >= MAX_REVEALS) return;
                            setPicker(index);
                          }}
                        >
                          {value != null ? (
                            <span className="scratch-num">{value}</span>
                          ) : (
                            <span className="scratch-suit" aria-hidden="true">
                              {SUIT_MARK[TILE_SUITS[index]]}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="scratch-row-lines">
                    <LineBubble line={byId.r0} recommended={recommendedId === "r0"} />
                    <LineBubble line={byId.r1} recommended={recommendedId === "r1"} />
                    <LineBubble line={byId.r2} recommended={recommendedId === "r2"} />
                  </div>
                </div>
                <p className="scratch-legend muted">
                  Each bubble is a line. Top number is average cans. Bottom number
                  is average sum. Gold means the current best line.
                </p>
              </div>
            </div>

            <article className="calc-row">
              <div className="calc-row-head">
                <h3>Line averages</h3>
                <span className="calc-badge">
                  Best now: {analysis.bestLine.name}
                </span>
              </div>
              <div className="scratch-line-list">
                {analysis.lines
                  .slice()
                  .sort((a, b) => b.ev - a.ev)
                  .map((line) => (
                    <div
                      key={line.id}
                      className={`scratch-line-row${
                        line.id === recommendedId ? " recommended" : ""
                      }`}
                    >
                      <span>{line.name}</span>
                      <span>avg sum {line.avgSum.toFixed(1)}</span>
                      <CanAmount value={line.ev} />
                    </div>
                  ))}
              </div>
              <div className="row-actions">
                <button
                  className="tan-btn"
                  type="button"
                  onClick={() => setBoard(EMPTY_BOARD())}
                >
                  New card
                </button>
              </div>
            </article>

            <article className="calc-row">
              <div className="calc-row-head">
                <h3>Sum payouts</h3>
              </div>
              <p className="muted">
                A line’s score is the sum of its three numbers. 1+2+3=6 is the
                best.
              </p>
              <div className="scratch-payouts">
                {Object.entries(SUM_SCORE).map(([sum, cans]) => (
                  <span key={sum} className="scratch-payout">
                    {sum}
                    <CanAmount value={cans} />
                  </span>
                ))}
              </div>
            </article>
          </section>
        </div>
      </div>

      {picker != null ? (
        <NumberPad
          used={
            new Set(
              [...used].filter((n) => Number(board[picker]) !== n)
            )
          }
          canClear={board[picker] != null}
          onPick={(n) => setCell(picker, n)}
          onClear={() => setCell(picker, null)}
          onClose={() => setPicker(null)}
        />
      ) : null}
    </div>
  );
}
