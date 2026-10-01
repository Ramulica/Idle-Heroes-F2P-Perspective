import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CanAmount from "../components/CanAmount.jsx";
import HelpTip from "../components/HelpTip.jsx";
import { formatNumber } from "../rewards";
import {
  DEFAULT_FAIRY_CHANCE,
  EMPTY_BOARD,
  LINES,
  MAX_REVEALS,
  SUM_SCORE,
  TILE_SUITS,
  analyzeBoard,
  canPlaceNumber,
  clampFairyChance,
  explainStep,
  lineCombinations,
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

const AXIS = {
  r0: "1.5,1.5 4.5,1.5",
  r1: "1.5,2.5 4.5,2.5",
  r2: "1.5,3.5 4.5,3.5",
  c0: "1.5,3.5 1.5,0.5",
  c1: "2.5,3.5 2.5,0.5",
  c2: "3.5,3.5 3.5,0.5",
  d0: "3.5,3.5 0.5,0.5",
  d1: "1.5,3.5 4.5,0.5",
};

function LineBubble({ line, recommended, onClick, className = "" }) {
  if (!line) return null;
  return (
    <button
      className={`scratch-bubble${recommended ? " recommended" : ""}${
        line.pFairy > 0 ? " has-fairy" : ""
      } ${className}`.trim()}
      type="button"
      title={`Tap to see every leftover combo for the ${line.name}`}
      onClick={() => onClick(line)}
    >
      <strong>{formatNumber(Math.round(line.ev))}</strong>
      <span>{line.avgSum.toFixed(1)}</span>
    </button>
  );
}

function ComboModal({ line, board, fairyChance, onClose }) {
  const rows = lineCombinations(board, line, fairyChance);
  const percent = clampFairyChance(fairyChance);
  return (
    <div className="modal-back" onClick={onClose}>
      <div
        className="modal wide scratch-combo-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <h3>{line.name}</h3>
        <p className="muted">
          {rows.length} leftover set{rows.length === 1 ? "" : "s"} that can still
          land on this line. Known tiles stay fixed; empty tiles take leftover
          numbers.
          {percent > 0
            ? ` If this line already has two of 1-2-3 or 7-8-9, a ${percent}% fairy can complete that max line no matter what the last number is.`
            : ""}
        </p>
        <div className="scratch-combo-list">
          {rows.map((row) => (
            <div
              key={row.numbers.join("-")}
              className={`scratch-combo-row${
                row.sum === 6 || row.sum === 24 || row.fairy ? " hot" : ""
              }`}
            >
              <span className="scratch-combo-nums">
                {row.numbers.map((n, i) => (
                  <strong key={i} className={row.known[i] ? "known" : ""}>
                    {n}
                  </strong>
                ))}
              </span>
              <span>
                sum {row.sum}
                {row.fairy
                  ? ` · fairy ${percent}% → ${row.fairy.label}`
                  : ""}
              </span>
              <CanAmount value={row.cans} />
            </div>
          ))}
        </div>
        <div className="row-actions">
          <button className="gold-btn" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
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
  const [comboLine, setComboLine] = useState(null);
  const [fairyInput, setFairyInput] = useState(String(DEFAULT_FAIRY_CHANCE));
  const fairyChance = clampFairyChance(fairyInput);

  const analysis = useMemo(
    () => analyzeBoard(board, fairyChance),
    [board, fairyChance]
  );
  const suggestion = useMemo(
    () => suggestReveal(board, fairyChance),
    [board, fairyChance]
  );
  const revealed = revealedCount(board);
  const leftover = remainingNumbers(board);
  const used = new Set(board.filter((value) => value != null).map(Number));
  const attemptsLeft = Math.max(0, MAX_REVEALS - revealed);
  const explain = explainStep(board, suggestion, fairyChance);
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
                  "Tap a line average to see every leftover number set still possible on that row, column, or diagonal.",
                  "If a line already has two of 1-2-3 (1-2, 1-3, or 2-3) or two of 7-8-9, a fairy can complete that max line. Set the chance (default 20%); averages and advice use it.",
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
              <label className="scratch-fairy">
                <span>Fairy</span>
                <input
                  className="cell-input weeks-input"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={fairyInput}
                  onChange={(event) => setFairyInput(event.target.value)}
                  onBlur={() =>
                    setFairyInput(String(clampFairyChance(fairyInput)))
                  }
                />
                <span>% chance</span>
              </label>
              <p className="muted">
                If a line has 1-2, 1-3, or 2-3, a fairy can turn it into 1-2-3
                (1680). Same for 7-8-9 (1008). Averages use this chance.
              </p>
              <button
                className="tan-btn"
                type="button"
                onClick={() => {
                  setBoard(EMPTY_BOARD());
                  setPicker(null);
                  setComboLine(null);
                }}
              >
                Clear all
              </button>
            </div>

            <div className="scratch-play">
              <div className="scratch-board">
                <div className="scratch-layout">
                  <svg
                    className="scratch-axes"
                    viewBox="0 0 5 4"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <defs>
                      <marker
                        id="scratch-arrow"
                        viewBox="0 0 8 8"
                        refX="7"
                        refY="4"
                        markerWidth="0.32"
                        markerHeight="0.32"
                        orient="auto"
                        markerUnits="userSpaceOnUse"
                      >
                        <path d="M0 0 L8 4 L0 8 Z" fill="rgba(90, 110, 140, 0.7)" />
                      </marker>
                      <marker
                        id="scratch-arrow-best"
                        viewBox="0 0 8 8"
                        refX="7"
                        refY="4"
                        markerWidth="0.34"
                        markerHeight="0.34"
                        orient="auto"
                        markerUnits="userSpaceOnUse"
                      >
                        <path d="M0 0 L8 4 L0 8 Z" fill="#f4c430" />
                      </marker>
                    </defs>
                    {LINES.map((line) => (
                      <polyline
                        key={line.id}
                        points={AXIS[line.id]}
                        className={
                          line.id === recommendedId ? "is-best" : undefined
                        }
                        markerEnd={
                          line.id === recommendedId
                            ? "url(#scratch-arrow-best)"
                            : "url(#scratch-arrow)"
                        }
                      />
                    ))}
                  </svg>
                  <LineBubble
                    className="pos-d0"
                    line={byId.d0}
                    recommended={recommendedId === "d0"}
                    onClick={setComboLine}
                  />
                  <LineBubble
                    className="pos-c0"
                    line={byId.c0}
                    recommended={recommendedId === "c0"}
                    onClick={setComboLine}
                  />
                  <LineBubble
                    className="pos-c1"
                    line={byId.c1}
                    recommended={recommendedId === "c1"}
                    onClick={setComboLine}
                  />
                  <LineBubble
                    className="pos-c2"
                    line={byId.c2}
                    recommended={recommendedId === "c2"}
                    onClick={setComboLine}
                  />
                  <LineBubble
                    className="pos-d1"
                    line={byId.d1}
                    recommended={recommendedId === "d1"}
                    onClick={setComboLine}
                  />
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
                        style={{
                          gridColumn: 2 + (index % 3),
                          gridRow: 2 + Math.floor(index / 3),
                        }}
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
                  <LineBubble
                    className="pos-r0"
                    line={byId.r0}
                    recommended={recommendedId === "r0"}
                    onClick={setComboLine}
                  />
                  <LineBubble
                    className="pos-r1"
                    line={byId.r1}
                    recommended={recommendedId === "r1"}
                    onClick={setComboLine}
                  />
                  <LineBubble
                    className="pos-r2"
                    line={byId.r2}
                    recommended={recommendedId === "r2"}
                    onClick={setComboLine}
                  />
                </div>
                <p className="scratch-legend muted">
                  Bubbles sit on each row, column, and diagonal. Tap one to see
                  every leftover combination. Gold is the current best line.
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
              <p className="muted">
                Tap a line here or a bubble on the board to see every leftover
                number set still possible on that axis.
              </p>
              <div className="scratch-line-list">
                {analysis.lines
                  .slice()
                  .sort((a, b) => b.ev - a.ev)
                  .map((line) => (
                    <button
                      key={line.id}
                      className={`scratch-line-row${
                        line.id === recommendedId ? " recommended" : ""
                      }${line.pFairy > 0 ? " has-fairy" : ""}`}
                      type="button"
                      onClick={() => setComboLine(line)}
                    >
                      <span>
                        {line.name}
                        {line.pFairy > 0
                          ? ` · fairy ${
                              line.fairyKind === "high"
                                ? "7-8-9"
                                : line.fairyKind === "mixed"
                                  ? "1-2-3 / 7-8-9"
                                  : "1-2-3"
                            }`
                          : ""}
                      </span>
                      <span>avg sum {line.avgSum.toFixed(1)}</span>
                      <CanAmount value={line.ev} />
                    </button>
                  ))}
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

      {comboLine ? (
        <ComboModal
          line={comboLine}
          board={board}
          fairyChance={fairyChance}
          onClose={() => setComboLine(null)}
        />
      ) : null}
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
