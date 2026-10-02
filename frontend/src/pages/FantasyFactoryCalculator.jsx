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
  "The solver tries every legal Main spot, then every Next spot on what would remain. It scores leftover groups: isolated singles are very expensive, then it averages how well the real 80% / 20% bag can bite what is left. A 0-waste move that creates stranded hexes loses to a slightly wasteful move that keeps the leftover tileable.",
  "Common 3-hex patterns are about 80% of draws. Rare 5-hex patterns are about 20%. That mix is only used to prefer leftovers that future pieces can still cover cleanly.",
];

const FACTORY_ADVANCED = [
  {
    heading: "What the puzzle is",
    paragraphs: [
      "The board is a honeycomb 20 hexes wide and 7 hexes tall. Cells sit in a zigzag honeycomb: they touch on vertical and diagonal edges, not as a square grid. Painted hexes are remaining little heroes. A Dream Pattern is a fixed polyhex: you get that exact orientation, and you cannot rotate it.",
      "Placing a piece clears every remaining hero under it. Any cell of the piece that lands on a cleared hex, or off the remaining set, is waste.",
    ],
  },
  {
    heading: "How the best Main spot is chosen",
    paragraphs: [
      "Every translation of Main that covers at least one remaining hero is tried. For each of those, every translation of Next on the leftover is tried. The winner is not the lowest waste by itself — leftover shape and the 80/20 future bag matter more. Isolated singles score worst. That full pair search runs while 40 or fewer hexes remain.",
      "A later unknown piece is 80% one of the 10 common 3-hex patterns (equal chance each) and 20% one of the 4 rare 5-hex patterns. After Main and Next, the leftover is scored by the expected best bite from that bag, so the solver plans past the two pieces you can see.",
    ],
    formula:
      "score = waste(Main)×26 + waste(Next)×20 + leftoverCost\nleftoverCost = 120 per isolated hex\n             + 62 per 2-hex stub\n             + 2 if a leftover 3-hex matches a common piece\n             + 52 if that 3-hex matches none\n             + expected future bite from the 80/20 bag",
  },
  {
    heading: "Future 80% / 20% pieces",
    paragraphs: [
      "There are 10 common Dream Patterns and 4 rare ones, in the orientations the game gives you. You cannot rotate them. After the two known patterns, later draws are 80% common (equal among the 10) and 20% rare (equal among the 4). That mix is used when scoring leftovers, so Main is chosen with those probabilities in mind.",
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
      advice += ` Gold is the planned Next (${suggestion.next.hit} more, ${suggestion.next.waste} waste). Leftover after both: ${suggestion.leftover}.`;
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
              <h4 className="ff-bag-label">Common · about 80%</h4>
              <div className="ff-bag">
                {COMMON_PIECES.map((piece) => (
                  <button
                    key={piece.id}
                    className={`ff-piece${
                      mainId === piece.id ? " is-main" : ""
                    }${nextId === piece.id ? " is-next" : ""}`}
                    type="button"
                    title="Common 3-hex"
                    onClick={() => pickPiece(piece.id)}
                  >
                    <HexShape cells={piece.cells} />
                  </button>
                ))}
              </div>
              <h4 className="ff-bag-label">Rare · about 20%</h4>
              <div className="ff-bag">
                {RARE_PIECES.map((piece) => (
                  <button
                    key={piece.id}
                    className={`ff-piece rare${
                      mainId === piece.id ? " is-main" : ""
                    }${nextId === piece.id ? " is-next" : ""}`}
                    type="button"
                    title="Rare 5-hex"
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
