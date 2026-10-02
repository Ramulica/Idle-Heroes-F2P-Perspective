import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import HelpTip from "../components/HelpTip.jsx";
import {
  BOARD_BOUNDS,
  BOARD_CELLS,
  BOARD_KEYS,
  COMMON_PIECES,
  RARE_PIECES,
  applyPlacement,
  axialPixel,
  bestMainPlacement,
  cellKey,
  hexCornerPoints,
  pieceById,
} from "../fantasyFactory";

const HEX_SIZE = 18;
const PREVIEW_SIZE = 9;
const HEX_PAD = HEX_SIZE + 4;
const BOARD_VIEW = {
  x: BOARD_BOUNDS.minX * HEX_SIZE - HEX_PAD,
  y: BOARD_BOUNDS.minY * HEX_SIZE - HEX_PAD,
  w: (BOARD_BOUNDS.maxX - BOARD_BOUNDS.minX) * HEX_SIZE + HEX_PAD * 2,
  h: (BOARD_BOUNDS.maxY - BOARD_BOUNDS.minY) * HEX_SIZE + HEX_PAD * 2,
};

const FACTORY_HELP = [
  "Tap hexes on the honeycomb to mark every little hero still left. Empty blue hexes are already cleared. Fill board paints a fresh stage; then tap off the ones you already removed.",
  "The game always shows two Dream Patterns: the one you must place now (Main) and the one after it (Next). Tap a slot, then tap the matching shape below.",
  "Green hexes are where Main should go. Gold is the planned Next. Red is waste — a cell of the piece that hangs off remaining heroes or off the map.",
  "Place Main in-game on those green hexes, then tap I placed this. Next becomes Main. Pick the new Next pattern the game just revealed.",
  "The calculator rotates each piece through all 6 hex turns. Zero waste comes first: if Main and Next can both sit fully on remaining heroes, it will never recommend a red hex. Only after that does it score leftovers so it does not strand singles.",
  "Common 4-hex patterns are about 80% of draws. Rare patterns are about 20%: three 6-hex bites and one 7-hex flower. The calculator rotates every piece 6 ways.",
];

const FACTORY_ADVANCED = [
  {
    heading: "What the puzzle is",
    paragraphs: [
      "The board is a honeycomb 20 hexes wide and 7 hexes tall. Painted hexes are remaining little heroes. Common Dream Patterns are 4 hexes. Rare ones are a 6-hex bite (hexagon minus one) or the 7-hex flower. You can rotate a piece to any of the 6 hex turns; the calculator tries all of them.",
      "Placing a piece clears every remaining hero under it. Any cell of the piece that lands on a cleared hex, or off the remaining set, is waste.",
    ],
  },
  {
    heading: "How the best Main spot is chosen",
    paragraphs: [
      "Every rotation and translation of Main that covers at least one remaining hero is tried, then every rotation of Next on what Main would leave. Waste is ranked first: the smallest Main waste wins; then the smallest Next waste; leftover shape is only a tie-break. If a zero-waste pair exists, red hexes are never suggested. Isolated leftover singles score worst among those zero-waste options.",
      "A later unknown piece is 80% one of the 10 common 4-hex patterns and 20% rare (three 6-hex bites and one 7-hex flower). After Main and Next, the leftover is scored by how well that bag can still cover it.",
    ],
    formula:
      "score = (Main waste, Next waste, leftoverCost)  — lexicographic, waste first\nleftoverCost = 140 per isolated hex\n             + 80 per 2-hex stub\n             + 70 per 3-hex (no 3-hex pieces exist)\n             + 2 if a leftover 4-hex matches a common piece\n             + expected future bite from the 80/20 bag (small leftovers only)\neach piece is tried in all 6 rotations",
  },
  {
    heading: "Future 80% / 20% pieces",
    paragraphs: [
      "There are 10 common 4-hex Dream Patterns and 4 rare ones (three 6-hex, one 7-hex). After you pick the shape, the calculator rotates it through all 6 hex turns. Later draws are 80% common and 20% rare; that mix is used when scoring leftovers.",
    ],
  },
  {
    heading: "What you do each turn",
    paragraphs: [
      "Only Main is placed. Gold Next is a plan, not a lock — after you place Main, the real Next becomes Main and a new Next appears. Re-pick that new Next and read the new green overlay.",
    ],
  },
];

function hexPolygon(cx, cy, size) {
  const pts = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = ((60 * i - 30) * Math.PI) / 180;
    pts.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`);
  }
  return pts.join(" ");
}

function pieceBounds(cells, size) {
  const pix = cells.map(([q, r]) => axialPixel(q, r, size));
  const minX = Math.min(...pix.map((p) => p.x)) - size;
  const maxX = Math.max(...pix.map((p) => p.x)) + size;
  const minY = Math.min(...pix.map((p) => p.y)) - size;
  const maxY = Math.max(...pix.map((p) => p.y)) + size;
  return { pix, minX, minY, width: maxX - minX, height: maxY - minY };
}

function HexShape({ cells, size = PREVIEW_SIZE, className = "" }) {
  const { pix, minX, minY, width, height } = pieceBounds(cells, size);
  return (
    <svg
      className={`ff-shape ${className}`.trim()}
      viewBox={`${minX} ${minY} ${width} ${height}`}
      aria-hidden="true"
    >
      {pix.map((p, i) => (
        <polygon key={i} points={hexPolygon(p.x, p.y, size * 0.94)} />
      ))}
    </svg>
  );
}

function hexClass(key, remainingSet, mainHits, mainWaste, nextHits, nextWaste) {
  const classes = [
    remainingSet.has(key) ? "filled" : "empty",
    mainHits.has(key) ? "main-hit" : "",
    mainWaste.has(key) ? "main-waste" : "",
    nextHits.has(key) ? "next-hit" : "",
    nextWaste.has(key) ? "next-waste" : "",
  ];
  return classes.filter(Boolean).join(" ");
}

function HexBoard({
  remainingSet,
  mainHits,
  mainWaste,
  nextHits,
  nextWaste,
  extraGhosts,
  onToggle,
}) {
  return (
    <svg
      className="ff-board-svg"
      viewBox={`${BOARD_VIEW.x} ${BOARD_VIEW.y} ${BOARD_VIEW.w} ${BOARD_VIEW.h}`}
      role="img"
      aria-label="Fantasy Factory hex map"
    >
      {BOARD_CELLS.map((cell) => {
        const filled = remainingSet.has(cell.key);
        const { x, y } = axialPixel(cell.q, cell.r, HEX_SIZE);
        return (
          <g key={cell.key}>
            <polygon
              className={hexClass(
                cell.key,
                remainingSet,
                mainHits,
                mainWaste,
                nextHits,
                nextWaste
              )}
              points={hexCornerPoints(cell.q, cell.r, HEX_SIZE)}
              onClick={() => onToggle(cell.key)}
            />
            {filled ? (
              <circle className="ff-pip" cx={x} cy={y} r={HEX_SIZE * 0.22} />
            ) : null}
          </g>
        );
      })}
      {extraGhosts.map(([q, r]) => {
        const key = cellKey(q, r);
        return (
          <polygon
            key={`g-${key}`}
            className={`ghost ${hexClass(
              key,
              remainingSet,
              mainHits,
              mainWaste,
              nextHits,
              nextWaste
            )}`}
            points={hexCornerPoints(q, r, HEX_SIZE)}
          />
        );
      })}
    </svg>
  );
}

function PieceSlot({ label, piece, active, tone, onClick }) {
  return (
    <button
      className={`ff-slot${active ? " on" : ""}${piece ? "" : " empty"} ${tone}`}
      type="button"
      onClick={onClick}
    >
      <span>{label}</span>
      {piece ? <HexShape cells={piece.cells} size={11} /> : <em>tap a shape</em>}
    </button>
  );
}

export default function FantasyFactoryCalculator() {
  const navigate = useNavigate();
  const [remaining, setRemaining] = useState([]);
  const [mainId, setMainId] = useState(null);
  const [nextId, setNextId] = useState(null);
  const [pickTarget, setPickTarget] = useState("main");
  const [history, setHistory] = useState([]);

  const remainingSet = useMemo(() => new Set(remaining), [remaining]);
  const mainPiece = pieceById(mainId);
  const nextPiece = pieceById(nextId);

  const suggestion = useMemo(
    () => bestMainPlacement(remaining, mainPiece, nextPiece),
    [remaining, mainPiece, nextPiece]
  );

  const mainHits = new Set(suggestion?.main?.hitKeys || []);
  const mainWaste = new Set(suggestion?.main?.wasteKeys || []);
  const nextHits = new Set(suggestion?.next?.hitKeys || []);
  const nextWaste = new Set(suggestion?.next?.wasteKeys || []);
  const extraGhosts = [
    ...(suggestion?.main?.world || []),
    ...(suggestion?.next?.world || []),
  ].filter(([q, r]) => !BOARD_KEYS.has(cellKey(q, r)));

  function toggleCell(key) {
    setRemaining((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key]
    );
  }

  function pickPiece(id) {
    if (pickTarget === "next") setNextId(id);
    else setMainId(id);
    if (pickTarget === "main" && !nextId) setPickTarget("next");
  }

  function placeSuggested() {
    if (!suggestion?.main) return;
    setHistory((current) => [...current, { remaining, mainId, nextId }]);
    setRemaining(applyPlacement(remaining, suggestion));
    setMainId(nextId);
    setNextId(null);
    setPickTarget("next");
  }

  function undo() {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory((current) => current.slice(0, -1));
    setRemaining(prev.remaining);
    setMainId(prev.mainId);
    setNextId(prev.nextId);
    setPickTarget("main");
  }

  let advice = "Tap remaining little heroes on the board, then pick Main and Next.";
  if (!remaining.length) {
    advice = "Tap every hex that still has a little hero. Or Fill board for a fresh stage, then tap off already-cleared hexes.";
  } else if (!mainPiece) {
    advice = "Tap the Main slot, then tap the Dream Pattern in the middle of your game screen.";
  } else if (!suggestion) {
    advice = "No placement found. Add remaining heroes or pick a different piece.";
  } else if (suggestion.main.waste === 0 && remaining.length === suggestion.main.hit) {
    advice = `Put Main on the green hexes. It clears the rest of the puzzle with no waste.${nextPiece ? " You will not need Next on this leftover." : ""}`;
  } else {
    const wasteBit =
      suggestion.main.waste === 0
        ? "no waste"
        : `${suggestion.main.waste} waste hex${suggestion.main.waste === 1 ? "" : "es"}`;
    advice = `Put Main on the green hexes. That covers ${suggestion.main.hit} and has ${wasteBit}.`;
    if (suggestion.next) {
      if (suggestion.next.waste === 0) {
        advice += ` Gold is the planned Next: ${suggestion.next.hit} more, no waste. Leftover after both: ${suggestion.leftover}.`;
      } else {
        advice += ` Gold is the planned Next (${suggestion.next.hit} more, ${suggestion.next.waste} waste — no zero-waste fit after this Main). Leftover after both: ${suggestion.leftover}.`;
      }
    } else if (!nextPiece) {
      advice += " Pick Next so the solver can look one piece ahead.";
    } else {
      advice += ` After this, ${suggestion.remainingAfterMain} hexes remain.`;
    }
  }

  return (
    <div className="sky-page">
      <div className="shell">
        <div className="shell-head">
          <div className="brand">
            <div className="head-with-help">
              <h1>Fantasy Factory Calculator</h1>
              <HelpTip
                title="Fantasy Factory Calculator"
                steps={FACTORY_HELP}
                advanced={FACTORY_ADVANCED}
              />
            </div>
            <p>
              Cover the leftover hexes with your current Dream Pattern and the
              next one, with as little waste as possible.
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
                {remaining.length
                  ? `${remaining.length} hex${remaining.length === 1 ? "" : "es"} left`
                  : "Paint the leftover puzzle"}
              </h3>
              <p>{advice}</p>
              <div className="ff-toolbar">
                <button
                  className="tan-btn"
                  type="button"
                  onClick={() => setRemaining(BOARD_CELLS.map((cell) => cell.key))}
                >
                  Fill board
                </button>
                <button
                  className="tan-btn"
                  type="button"
                  onClick={() => setRemaining([])}
                >
                  Clear all
                </button>
                <button
                  className="tan-btn"
                  type="button"
                  disabled={!history.length}
                  onClick={undo}
                >
                  Undo place
                </button>
                <button
                  className="gold-btn"
                  type="button"
                  disabled={!suggestion?.main}
                  onClick={placeSuggested}
                >
                  I placed this
                </button>
              </div>
            </div>

            <div className="ff-play">
              <HexBoard
                remainingSet={remainingSet}
                mainHits={mainHits}
                mainWaste={mainWaste}
                nextHits={nextHits}
                nextWaste={nextWaste}
                extraGhosts={extraGhosts}
                onToggle={toggleCell}
              />
              <p className="ff-legend muted">
                <span className="ff-swatch filled" /> remaining hero
                <span className="ff-swatch main-hit" /> Main
                <span className="ff-swatch next-hit" /> planned Next
                <span className="ff-swatch main-waste" /> waste
              </p>
            </div>

            <article className="calc-row">
              <div className="calc-row-head">
                <h3>Dream Patterns</h3>
              </div>
              <p className="muted">
                Tap Main or Next, then tap the shape you see. After you place
                Main, Next moves up and you pick a new Next.
              </p>
              <div className="ff-slots">
                <PieceSlot
                  label="Main"
                  piece={mainPiece}
                  active={pickTarget === "main"}
                  tone="main"
                  onClick={() => setPickTarget("main")}
                />
                <PieceSlot
                  label="Next"
                  piece={nextPiece}
                  active={pickTarget === "next"}
                  tone="next"
                  onClick={() => setPickTarget("next")}
                />
              </div>
              <h4 className="ff-bag-label">Common · about 80% · 4 hexes</h4>
              <div className="ff-bag">
                {COMMON_PIECES.map((piece) => (
                  <button
                    key={piece.id}
                    className={`ff-piece${
                      mainId === piece.id ? " is-main" : ""
                    }${nextId === piece.id ? " is-next" : ""}`}
                    type="button"
                    title="Common 4-hex"
                    onClick={() => pickPiece(piece.id)}
                  >
                    <HexShape cells={piece.cells} />
                  </button>
                ))}
              </div>
              <h4 className="ff-bag-label">Rare · about 20% · 6 or 7 hexes</h4>
              <div className="ff-bag">
                {RARE_PIECES.map((piece) => (
                  <button
                    key={piece.id}
                    className={`ff-piece rare${
                      mainId === piece.id ? " is-main" : ""
                    }${nextId === piece.id ? " is-next" : ""}`}
                    type="button"
                    title="Rare 6-hex or 7-hex"
                    onClick={() => pickPiece(piece.id)}
                  >
                    <HexShape cells={piece.cells} />
                  </button>
                ))}
              </div>
            </article>
          </section>
        </div>
      </div>
    </div>
  );
}
