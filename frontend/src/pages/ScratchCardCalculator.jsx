import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CanAmount from "../components/CanAmount.jsx";
import HelpTip from "../components/HelpTip.jsx";
import fairyIcon from "../assets/scratch-fairy.png";
import { formatNumber } from "../rewards";
import { CAN_ICONS } from "../rngCelebration";
import { useSgCalc } from "../useSgCalc";
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
  expectedCansPerCard,
  explainStep,
  lineCombinations,
  peekExpectedCansPerCard,
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

const SCRATCH_ADVANCED = [
  {
    heading: "The card",
    paragraphs: [
      "The 3×3 is a random shuffle of 1–9, each number once. You uncover 4 tiles, then pick one of 8 lines: 3 rows, 3 columns, and 2 diagonals.",
      "The game scores the three numbers on that line by their sum. Sum 6 (1-2-3) pays 1680 cans. Sum 24 (7-8-9) pays 1008. Mid sums pay much less. The payout table on this page is the full map from sum to cans.",
    ],
  },
  {
    heading: "What a line average is",
    paragraphs: [
      "Tiles you already typed are fixed. Unknown tiles on that line will be filled from leftover unused numbers.",
      "A line only cares which leftover numbers land on it, not their order, because the payout uses the sum. So the calculator lists leftover combinations of the right size — not every 9! shuffle of the whole card. Every leftover set of that size is equally likely on a given line.",
    ],
    formula:
      "leftover = {1…9} minus typed numbers\ncombos  = every leftover set of size (unknown cells on this line)\nEV      = average of payout(sum of the three numbers) over those combos",
    items: [
      "1 unknown cell: try each leftover number once.",
      "2 unknown cells: try every leftover pair once.",
      "3 unknown cells: try every leftover triple once.",
      "Line fully known: one value, the real payout.",
    ],
  },
  {
    heading: "Fairy on the last unknown cell",
    paragraphs: [
      "If a line already shows two of 1-2-3 or 7-8-9 and the third cell is still X, the line average mixes in the fairy chance until that X is revealed. Same while you still have scratches left.",
      "Once X is a real number, fairy is off. 1-2-7 is only 1-2-7. After all 4 tiles are open, leftover fills also have no fairy.",
    ],
    formula:
      "line is 1, 2, X  and scratches remain:\n  each leftover n:  p × 1680  +  (1−p) × payout(1+2+n)\n  except n = 3: payout = 1680\n\nline is 1, 2, 7  or 4 tiles already open:\n  payout = table[sum]   (no fairy)",
    items: [
      "Example: 1 and 2 showing, X unknown, p = 20%. The bubble is the leftover average with 20% of 1680 mixed in.",
      "Reveal X as 7 → the line is 1-2-7 and the mix disappears.",
    ],
  },
  {
    heading: "Which tile to uncover next",
    paragraphs: [
      "Until 4 tiles are open, the green ring is a one-step look-ahead: pick the empty cell that makes the best line worth the most after you see that number.",
      "Each leftover number is treated as equally likely on that cell. If a line already has two of 1-2-3 or 7-8-9 and X is still open, that line’s average still includes fairy. After pretending the number is there, every line EV is recomputed: 1-2-7 has no fairy; 1-2-X still does until X is filled.",
    ],
    formula:
      "for each empty cell c:\n  for each leftover number n:\n    place n on c\n    score(n) = highest line EV on that new board\n  VoI(c) = average of score(n)\n\nsuggest the cell with the highest VoI\ntie-break: the cell that sits on more lines (center sits on 4)",
  },
  {
    heading: "Which line to pick",
    paragraphs: [
      "After 4 scratches, stop uncovering. The gold line is the one with the highest EV. That is the line to confirm in-game.",
      "Tap a bubble (or a row under Line averages) to see every leftover set. If the line is still 1-2-X, those rows mix fairy. If it is already 1-2-7, they do not.",
    ],
  },
];

const ROUND_HELP = [
  "This is the average cans one card pays if you follow this calculator every scratch.",
  "The first scratch is random. Each later scratch uses the suggested tile — the empty cell that raises the best line’s expected cans the most.",
  "If a line already shows two of 1-2-3 or 7-8-9, the next scratch has the fairy % chance to become the missing number. That mix stays in the line average only while that last cell is still X.",
  "After 4 tiles, fairy stops. Leftover numbers fill the rest of each line, and you pick the line with the highest leftover average.",
  "The number updates when you change the fairy %. 20% is only an estimate of the real fairy rate.",
];

const ROUND_ADVANCED = [
  {
    heading: "What the number is",
    paragraphs: [
      "It is E[cans] for one Celebration Scratchcard played with this page’s policy, including the fairy % you set.",
    ],
    formula:
      "first scratch: random tile and random 1–9\nthen 3 times: scratch the suggested cell\n  leftover numbers equally likely\n  if a near-max line is open: p chance the new number is the missing 1-2-3 / 7-8-9\nafter 4 tiles: score = highest line leftover average (no fairy)",
  },
  {
    heading: "Why it is not 162",
    paragraphs: [
      "With no scratches every line averages about 162 cans. Four informed scratches, plus fairy on a 1-2-X line, raise the line you actually pick. That higher average is the number shown beside the board.",
    ],
  },
];

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
          numbers. Fairy is mixed only while that last cell is still X and you
          still have a scratch left.
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
                {row.fairy ? ` · fairy ${percent}% → ${row.fairy.label}` : ""}
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
  const { guest, state, patch, loaded } = useSgCalc();
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [picker, setPicker] = useState(null);
  const [comboLine, setComboLine] = useState(null);
  const [fairyInput, setFairyInput] = useState(String(DEFAULT_FAIRY_CHANCE));
  const [fairyTip, setFairyTip] = useState(false);
  const [fairyWarnGone, setFairyWarnGone] = useState(false);
  const [roundEv, setRoundEv] = useState(() =>
    peekExpectedCansPerCard(DEFAULT_FAIRY_CHANCE)
  );
  const fairyChance = clampFairyChance(fairyInput);
  const showFairyWarn =
    loaded && !state.hideScratchFairyWarning && !fairyWarnGone;

  useEffect(() => {
    let live = true;
    const cached = peekExpectedCansPerCard(fairyChance);
    if (cached != null) {
      setRoundEv(cached);
      return () => {
        live = false;
      };
    }
    setRoundEv(null);
    const id = window.setTimeout(() => {
      const ev = expectedCansPerCard(fairyChance);
      if (live) setRoundEv(ev);
    }, 0);
    return () => {
      live = false;
      window.clearTimeout(id);
    };
  }, [fairyChance]);

  function hideFairyWarn(persist) {
    setFairyWarnGone(true);
    if (persist && !guest) {
      patch({ hideScratchFairyWarning: true });
    }
  }

  function setFairyChanceValue(value) {
    if (String(value) !== String(fairyInput)) {
      setFairyWarnGone(true);
    }
    setFairyInput(value);
  }

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
                  "If a line already has two of 1-2-3 or 7-8-9 and the last cell is still X, the average includes the fairy chance until X is revealed. 1-2-7 is just 1-2-7. After 4 tiles, leftover scores have no fairy.",
                  "Sum 6 (1-2-3) pays 1680 cans. Sum 24 (7-8-9) pays 1008. After 4 scratches, pick the highlighted line.",
                ]}
                advanced={SCRATCH_ADVANCED}
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
              <div className="scratch-fairy-side">
                {showFairyWarn ? (
                  <div className="scratch-fairy-warn">
                    Set the % for this event. 20% is only an estimate.
                    <button
                      className="scratch-fairy-gotit"
                      type="button"
                      onClick={() => hideFairyWarn(false)}
                    >
                      Got it
                    </button>
                    {guest ? null : (
                      <label>
                        <input
                          type="checkbox"
                          onChange={(event) => {
                            if (event.target.checked) hideFairyWarn(true);
                          }}
                        />
                        Don’t show again **
                      </label>
                    )}
                  </div>
                ) : null}
                <button
                  className={`scratch-fairy-btn${fairyTip ? " open" : ""}`}
                  type="button"
                  title="Fairy chance"
                  onClick={() => setFairyTip((open) => !open)}
                >
                  <img src={fairyIcon} alt="Fairy" />
                </button>
                <label className="scratch-fairy-chance">
                  <input
                    className="cell-input weeks-input"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={fairyInput}
                    onChange={(event) => setFairyChanceValue(event.target.value)}
                    onBlur={() =>
                      setFairyChanceValue(String(clampFairyChance(fairyInput)))
                    }
                  />
                  <span>%</span>
                </label>
                {fairyTip ? (
                  <div className="scratch-fairy-pop">
                    If a line already shows two of 1-2-3 or 7-8-9 and X is
                    still open, the average mixes this % until X is revealed.
                    1-2-7 has no fairy.
                  </div>
                ) : null}
              </div>
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
              <div className="scratch-ev-side">
                <div className="head-with-help">
                  <div className="scratch-ev-line">
                    <strong>
                      {roundEv == null ? "…" : formatNumber(Math.round(roundEv))}
                    </strong>
                    <img
                      src={CAN_ICONS.normal}
                      alt=""
                      className="csg-icon"
                    />
                    <span>/ round</span>
                  </div>
                  <HelpTip
                    title="Cans per round"
                    steps={ROUND_HELP}
                    advanced={ROUND_ADVANCED}
                  />
                </div>
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
