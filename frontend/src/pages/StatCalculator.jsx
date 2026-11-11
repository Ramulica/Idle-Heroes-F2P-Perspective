import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import HelpTip from "../components/HelpTip.jsx";
import {
  ENABLE_COUNT,
  GEAR_COUNT,
  IMPRINT_COUNT,
  IMPRINT_OPTIONS,
  MONSTER_OPTIONS,
  SLOT_COUNT,
  STAT_HEROES,
  clearSlot,
  cloneBoard,
  emptyBoard,
  enableOf,
  enableOptionsForSlot,
  SOUL_STONE_CATEGORIES,
  formatGearStats,
  formatStoneStat,
  gearOf,
  gearOptionsForSlot,
  gearSlotDef,
  heroOf,
  imprintOf,
  newLineupId,
  optionById,
  patchSlot,
  readStatCalculator,
  setSlotListValue,
  slotTitle,
  stoneStatTone,
  writeStatCalculator,
} from "../statCalculator";

function StatLines({ stats, compact = false, colored = false }) {
  if (!stats?.length) return <span className="muted">No stats</span>;
  return (
    <span className="sc-stat-lines">
      {stats.map((row, index) => {
        const text = colored
          ? formatStoneStat(row, compact)
          : formatGearStats([row], compact);
        const tone = colored ? stoneStatTone(row) : null;
        return (
          <span
            key={`${row.stat}-${row.value}-${index}`}
            className={`sc-stat-line${tone ? ` sc-stat-${tone}` : ""}`}
          >
            {text}
          </span>
        );
      })}
    </span>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div
        className="modal wide sc-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <h3>{title}</h3>
        {children}
        <div className="row-actions sc-pick-actions">
          <button className="gold-btn" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function PickGrid({
  items,
  selectedId,
  onPick,
  onClear,
  renderItem,
  gridClassName = "",
}) {
  return (
    <div className="sc-pick-panel">
      <div className={`sc-pick-grid${gridClassName ? ` ${gridClassName}` : ""}`}>
        {items.map((item) => {
          const selected = item.id === selectedId;
          return (
            <button
              key={item.id}
              type="button"
              className={`sc-pick${selected ? " selected" : ""}`}
              onClick={() => onPick(item.id)}
            >
              {renderItem(item)}
            </button>
          );
        })}
      </div>
      {onClear ? (
        <div className="sc-pick-actions">
          <button className="tan-btn" type="button" onClick={onClear}>
            Clear
          </button>
        </div>
      ) : null}
    </div>
  );
}

function HeroCard({
  index,
  slot,
  onPickHero,
  onClear,
  onPickGear,
  onPickEnable,
  onPickImprint,
}) {
  const hero = heroOf(slot.heroId);
  return (
    <article className="sc-hero-card">
      <div className="sc-hero-card-head">
        <h4>{slotTitle(index)}</h4>
        {hero ? (
          <button
            className="sc-clear-btn"
            type="button"
            aria-label={`Clear ${slotTitle(index)}`}
            onClick={onClear}
          >
            ×
          </button>
        ) : null}
      </div>
      <button
        className={`sc-hero-portrait${hero ? "" : " empty"}`}
        type="button"
        onClick={onPickHero}
      >
        {hero ? (
          <img src={hero.icon} alt={hero.name} />
        ) : (
          <span>Select hero</span>
        )}
      </button>
      <p className="sc-hero-name">{hero ? hero.name : "Empty"}</p>

      <div className="sc-gear-grid">
        {Array.from({ length: GEAR_COUNT }, (_, gearIndex) => {
          const def = gearSlotDef(gearIndex);
          const option = gearOf(slot.gear[gearIndex]);
          const locked = Boolean(def?.locked);
          const isStone = def?.id === "stone";
          const tip = locked
            ? `${def.name} · coming later`
            : option
              ? `${option.name} · ${
                  isStone
                    ? option.stats.map((row) => formatStoneStat(row, true)).join(" · ")
                    : formatGearStats(option.stats)
                }`
              : def?.name || `Gear ${gearIndex + 1}`;
          return (
            <button
              key={gearIndex}
              type="button"
              className={`sc-gear-slot${option ? " filled" : ""}${
                locked ? " locked" : ""
              }${isStone ? " stone-slot" : ""}`}
              onClick={() => onPickGear(gearIndex)}
              title={tip}
            >
              {option ? (
                <img src={option.icon} alt="" />
              ) : locked ? (
                <span className="sc-gear-lock">{def.name[0]}</span>
              ) : (
                <span>{isStone ? "S" : "+"}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="sc-enable-row">
        {Array.from({ length: ENABLE_COUNT }, (_, enableIndex) => {
          const option = enableOf(slot.enables[enableIndex]);
          return (
            <button
              key={enableIndex}
              type="button"
              className={`sc-circle-slot sc-enable-slot${option ? " filled" : ""}`}
              onClick={() => onPickEnable(enableIndex)}
              title={option ? option.label : `Enable ${enableIndex + 1}`}
            >
              {option ? (
                <img src={option.icon} alt="" />
              ) : (
                <span>+</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="sc-imprint-row">
        {Array.from({ length: IMPRINT_COUNT }, (_, imprintIndex) => {
          const option = imprintOf(slot.imprints[imprintIndex]);
          return (
            <button
              key={imprintIndex}
              type="button"
              className={`sc-circle-slot sc-imprint-slot${option ? " filled" : ""}`}
              onClick={() => onPickImprint(imprintIndex)}
              title={
                option
                  ? `${option.name} +${option.percent}%`
                  : `Imprint ${imprintIndex + 1}`
              }
            >
              {option ? (
                <img src={option.icon} alt="" />
              ) : (
                <span>+</span>
              )}
            </button>
          );
        })}
      </div>
    </article>
  );
}

export default function StatCalculator() {
  const navigate = useNavigate();
  const [state, setState] = useState(() => readStatCalculator());
  const [picker, setPicker] = useState(null);
  const [saveName, setSaveName] = useState("");

  useEffect(() => {
    writeStatCalculator(state);
  }, [state]);

  const board = state.board;
  const monster = optionById(MONSTER_OPTIONS, board.monsterId);

  const summarySlots = useMemo(
    () =>
      board.slots.map((slot, index) => ({
        index,
        title: slotTitle(index),
        hero: heroOf(slot.heroId),
      })),
    [board.slots]
  );

  function updateBoard(nextBoard) {
    setState((current) => ({
      ...current,
      board: cloneBoard(nextBoard),
      activeLineupId: null,
    }));
  }

  function saveLineup() {
    const name = saveName.trim() || `Lineup ${state.lineups.length + 1}`;
    const id = newLineupId();
    setState((current) => ({
      ...current,
      activeLineupId: id,
      lineups: [
        ...current.lineups,
        { id, name, board: cloneBoard(current.board) },
      ],
    }));
    setSaveName("");
    setPicker(null);
  }

  function loadLineup(id) {
    const lineup = state.lineups.find((row) => row.id === id);
    if (!lineup) return;
    setState((current) => ({
      ...current,
      board: cloneBoard(lineup.board),
      activeLineupId: lineup.id,
    }));
    setPicker(null);
  }

  function deleteLineup(id) {
    setState((current) => ({
      ...current,
      lineups: current.lineups.filter((row) => row.id !== id),
      activeLineupId:
        current.activeLineupId === id ? null : current.activeLineupId,
    }));
  }

  function renderPicker() {
    if (!picker) return null;

    if (picker.type === "hero") {
      return (
        <Modal title={`Select hero · ${slotTitle(picker.slotIndex)}`} onClose={() => setPicker(null)}>
          <p className="muted">Heroes are listed in the order you sent.</p>
          <PickGrid
            items={STAT_HEROES}
            selectedId={board.slots[picker.slotIndex].heroId}
            onPick={(heroId) => {
              updateBoard(
                patchSlot(board, picker.slotIndex, { heroId })
              );
              setPicker(null);
            }}
            onClear={() => {
              updateBoard(clearSlot(board, picker.slotIndex));
              setPicker(null);
            }}
            renderItem={(hero) => (
              <>
                <img src={hero.icon} alt="" className="sc-pick-hero" />
                <span>{hero.name}</span>
                <span className="sc-pick-meta">
                  {hero.faction} · {hero.heroClass}
                </span>
              </>
            )}
          />
        </Modal>
      );
    }

    if (picker.type === "gear") {
      const def = gearSlotDef(picker.listIndex);
      if (def?.locked) {
        return (
          <Modal
            title={`${slotTitle(picker.slotIndex)} · ${def.name}`}
            onClose={() => setPicker(null)}
          >
            <p className="muted">
              {def.name} options will be added in a later step.
            </p>
          </Modal>
        );
      }

      if (def?.id === "stone") {
        const selected = board.slots[picker.slotIndex].gear[picker.listIndex];
        return (
          <Modal
            title={`${slotTitle(picker.slotIndex)} · Soul Stone 6`}
            onClose={() => setPicker(null)}
          >
            <p className="muted sc-modal-lead">
              Grey = HP / Attack. Yellow = calculated specials (Speed, Crit,
              Precision, …). Tap a combo to equip.
            </p>
            <div className="sc-pick-panel">
              <div className="sc-stone-groups">
                {SOUL_STONE_CATEGORIES.map((group) => (
                  <section key={group.id} className="sc-stone-group">
                    <h4>{group.name}</h4>
                    <div className="sc-pick-grid sc-pick-grid-stone">
                      {group.options.map((item) => {
                        const on = item.id === selected;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={`sc-pick sc-pick-stone${on ? " selected" : ""}`}
                            onClick={() => {
                              updateBoard(
                                setSlotListValue(
                                  board,
                                  picker.slotIndex,
                                  "gear",
                                  picker.listIndex,
                                  item.id
                                )
                              );
                              setPicker(null);
                            }}
                          >
                            <img
                              src={item.icon}
                              alt=""
                              className="sc-pick-stone-icon"
                            />
                            <span className="sc-pick-title">{item.label}</span>
                            <StatLines stats={item.stats} compact colored />
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
              <div className="sc-pick-actions">
                <button
                  className="tan-btn"
                  type="button"
                  onClick={() => {
                    updateBoard(
                      setSlotListValue(
                        board,
                        picker.slotIndex,
                        "gear",
                        picker.listIndex,
                        null
                      )
                    );
                    setPicker(null);
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          </Modal>
        );
      }

      const hero = heroOf(board.slots[picker.slotIndex].heroId);
      if (!hero) {
        return (
          <Modal
            title={`${slotTitle(picker.slotIndex)} · ${def.name}`}
            onClose={() => setPicker(null)}
          >
            <p className="muted">
              Pick a hero on this card first. Gear shows Normal plus that hero’s
              class sets.
            </p>
          </Modal>
        );
      }
      const selected = board.slots[picker.slotIndex].gear[picker.listIndex];
      const choices = gearOptionsForSlot(picker.listIndex, hero.heroClass);
      const preview = picker.gearId ? gearOf(picker.gearId) : null;
      if (preview) {
        return (
          <Modal title={preview.name} onClose={() => setPicker(null)}>
            <div className="sc-gear-detail">
              <div className="sc-gear-detail-icon-wrap">
                <img src={preview.icon} alt="" className="sc-gear-detail-icon" />
              </div>
              <p className="sc-gear-detail-label">{preview.label}</p>
              <p className="sc-gear-detail-slot">{def.name}</p>
              <div className="sc-gear-detail-stats">
                <StatLines stats={preview.stats} />
              </div>
            </div>
            <div className="row-actions sc-pick-actions">
              <button
                className="gold-btn"
                type="button"
                onClick={() => {
                  updateBoard(
                    setSlotListValue(
                      board,
                      picker.slotIndex,
                      "gear",
                      picker.listIndex,
                      preview.id
                    )
                  );
                  setPicker(null);
                }}
              >
                Equip
              </button>
              <button
                className="tan-btn"
                type="button"
                onClick={() =>
                  setPicker({
                    type: "gear",
                    slotIndex: picker.slotIndex,
                    listIndex: picker.listIndex,
                  })
                }
              >
                Back
              </button>
            </div>
          </Modal>
        );
      }
      return (
        <Modal
          title={`${slotTitle(picker.slotIndex)} · ${def.name}`}
          onClose={() => setPicker(null)}
        >
          <p className="muted sc-modal-lead">
            {hero.name} · {hero.heroClass}. Normal gear plus this class’s sets.
            Tap a piece to see stats, then Equip.
          </p>
          <PickGrid
            items={choices}
            selectedId={selected}
            gridClassName="sc-pick-grid-gear"
            onPick={(id) =>
              setPicker({
                type: "gear",
                slotIndex: picker.slotIndex,
                listIndex: picker.listIndex,
                gearId: id,
              })
            }
            onClear={() => {
              updateBoard(
                setSlotListValue(
                  board,
                  picker.slotIndex,
                  "gear",
                  picker.listIndex,
                  null
                )
              );
              setPicker(null);
            }}
            renderItem={(item) => (
              <>
                <span className="sc-pick-gear-wrap">
                  <img src={item.icon} alt="" className="sc-pick-gear" />
                </span>
                <span className="sc-pick-title">{item.label}</span>
                <span className="sc-pick-meta">
                  <StatLines stats={item.stats} compact />
                </span>
              </>
            )}
          />
        </Modal>
      );
    }

    if (picker.type === "enable") {
      const selected = board.slots[picker.slotIndex].enables[picker.listIndex];
      const choices = enableOptionsForSlot(picker.listIndex);
      return (
        <Modal
          title={`${slotTitle(picker.slotIndex)} · Enable ${picker.listIndex + 1}`}
          onClose={() => setPicker(null)}
        >
          <p className="muted sc-modal-lead">
            Pick one icon for this enable. Stats for each choice come later.
          </p>
          <PickGrid
            items={choices}
            selectedId={selected}
            gridClassName="sc-pick-grid-circle"
            onPick={(id) => {
              updateBoard(
                setSlotListValue(
                  board,
                  picker.slotIndex,
                  "enables",
                  picker.listIndex,
                  id
                )
              );
              setPicker(null);
            }}
            onClear={() => {
              updateBoard(
                setSlotListValue(
                  board,
                  picker.slotIndex,
                  "enables",
                  picker.listIndex,
                  null
                )
              );
              setPicker(null);
            }}
            renderItem={(item) => (
              <>
                <img src={item.icon} alt="" className="sc-pick-circle" />
                <span className="sc-pick-title">{item.label}</span>
              </>
            )}
          />
        </Modal>
      );
    }

    if (picker.type === "imprint") {
      const slot = board.slots[picker.slotIndex];
      const selected = slot.imprints[picker.listIndex];
      const usedElsewhere = new Set(
        slot.imprints.filter(
          (id, index) => id && index !== picker.listIndex
        )
      );
      return (
        <Modal
          title={`${slotTitle(picker.slotIndex)} · Imprint ${picker.listIndex + 1}`}
          onClose={() => setPicker(null)}
        >
          <p className="muted sc-modal-lead">
            Choose 3 of 10. You cannot pick the same imprint twice on one hero.
          </p>
          <div className="sc-pick-panel">
            <div className="sc-pick-grid sc-pick-grid-imprints">
              {IMPRINT_OPTIONS.map((item) => {
                const taken = usedElsewhere.has(item.id);
                const on = item.id === selected;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`sc-pick${on ? " selected" : ""}`}
                    disabled={taken}
                    onClick={() => {
                      updateBoard(
                        setSlotListValue(
                          board,
                          picker.slotIndex,
                          "imprints",
                          picker.listIndex,
                          item.id
                        )
                      );
                      setPicker(null);
                    }}
                  >
                    <img src={item.icon} alt="" className="sc-pick-circle" />
                    <span className="sc-pick-title">{item.name}</span>
                    <span className="sc-pick-meta">+{item.percent}%</span>
                  </button>
                );
              })}
            </div>
            <div className="sc-pick-actions">
              <button
                className="tan-btn"
                type="button"
                onClick={() => {
                  updateBoard(
                    setSlotListValue(
                      board,
                      picker.slotIndex,
                      "imprints",
                      picker.listIndex,
                      null
                    )
                  );
                  setPicker(null);
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </Modal>
      );
    }

    if (picker.type === "monster") {
      return (
        <Modal title="Select monster" onClose={() => setPicker(null)}>
          <p className="muted">
            Monster icons come next. The circle above the cards will show the
            chosen monster.
          </p>
          {MONSTER_OPTIONS.length ? (
            <PickGrid
              items={MONSTER_OPTIONS}
              selectedId={board.monsterId}
              onPick={(id) => {
                updateBoard({ ...board, monsterId: id });
                setPicker(null);
              }}
              onClear={() => {
                updateBoard({ ...board, monsterId: null });
                setPicker(null);
              }}
              renderItem={(item) => (
                <>
                  <img src={item.icon} alt="" className="sc-pick-hero" />
                  <span>{item.name}</span>
                </>
              )}
            />
          ) : (
            <button
              className="tan-btn"
              type="button"
              onClick={() => {
                updateBoard({ ...board, monsterId: null });
                setPicker(null);
              }}
            >
              Clear monster
            </button>
          )}
        </Modal>
      );
    }

    if (picker.type === "save") {
      return (
        <Modal title="Save lineup" onClose={() => setPicker(null)}>
          <label className="sc-save-label">
            Lineup name
            <input
              className="sc-save-input"
              type="text"
              value={saveName}
              placeholder={`Lineup ${state.lineups.length + 1}`}
              onChange={(event) => setSaveName(event.target.value)}
            />
          </label>
          <div className="row-actions">
            <button className="gold-btn" type="button" onClick={saveLineup}>
              Save
            </button>
          </div>
        </Modal>
      );
    }

    if (picker.type === "lineups") {
      return (
        <Modal title="Lineups" onClose={() => setPicker(null)}>
          {state.lineups.length ? (
            <div className="sc-lineup-list">
              {state.lineups.map((row) => (
                <div key={row.id} className="sc-lineup-row">
                  <button
                    className={`sc-lineup-pick${
                      state.activeLineupId === row.id ? " selected" : ""
                    }`}
                    type="button"
                    onClick={() => loadLineup(row.id)}
                  >
                    {row.name}
                  </button>
                  <button
                    className="tan-btn"
                    type="button"
                    onClick={() => deleteLineup(row.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No saved lineups yet. Use Save first.</p>
          )}
        </Modal>
      );
    }

    return null;
  }

  return (
    <div className="sky-page">
      <div className="shell sc-shell">
        <div className="shell-head">
          <div className="brand">
            <div className="head-with-help">
              <h1>Stat Calculator Tool</h1>
              <HelpTip
                title="Stat Calculator"
                steps={[
                  "Top summary shows each position and its hero. Stat totals will appear here later.",
                  "Save stores the current 6-hero setup as a lineup. Lineups lets you load a saved setup.",
                  "Select monster opens a popup for the team monster (icons come next).",
                  "Each card: tap the portrait to pick a hero, then tap gear squares, enable circles, and imprint circles. Every choice opens a popup.",
                  "Gear slots are Weapon, Armor, Accessory, Boots. Artifact and Stone come later. Pick a hero first, then choose Normal or that class’s sets. Tap a piece to see stats, then Equip.",
                  "Imprints are 3 of 10 on that hero — no duplicates. Each enable circle opens its own icon choices (Enable 3 has 6).",
                ]}
              />
              <button
                className="tan-btn"
                type="button"
                onClick={() => navigate("/")}
              >
                Back to menu
              </button>
            </div>
            <p>
              Build a 6-hero lineup with gear, enables, and imprints. Stats and
              caps will be added block by block.
            </p>
          </div>
        </div>

        <section className="sc-summary">
          <div className="calc-row-head">
            <h3>Summary</h3>
            <HelpTip
              title="Summary"
              message="One column per position. Hero and filled gear / enable / imprint counts for now. Detailed % stats come later."
            />
          </div>
          <div className="sc-summary-grid">
            {summarySlots.map((row) => {
              const slot = board.slots[row.index];
              const gearFilled = slot.gear.filter(Boolean).length;
              const enableFilled = slot.enables.filter(Boolean).length;
              const imprintFilled = slot.imprints.filter(Boolean).length;
              return (
                <div key={row.index} className="sc-summary-card">
                  <strong>{row.title}</strong>
                  {row.hero ? (
                    <img src={row.hero.icon} alt="" className="sc-summary-icon" />
                  ) : (
                    <span className="sc-summary-empty">Empty</span>
                  )}
                  <span className="muted">
                    {row.hero ? row.hero.name : "—"}
                  </span>
                  <span className="sc-summary-bits">
                    Gear {gearFilled}/{GEAR_COUNT} · En {enableFilled}/
                    {ENABLE_COUNT} · Imp {imprintFilled}/{IMPRINT_COUNT}
                  </span>
                  <span className="muted">Stats: —</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="sc-block">
          <div className="calc-row-head">
            <h3>Hero lineup</h3>
            <HelpTip
              title="Hero lineup"
              message="Six cards: Front 1–2 and Back 3–6. Tap any empty portrait or gear/enable/imprint slot to open a popup."
            />
          </div>

          <div className="sc-toolbar">
            <button
              className="gold-btn"
              type="button"
              onClick={() => {
                setSaveName("");
                setPicker({ type: "save" });
              }}
            >
              Save
            </button>
            <button
              className="tan-btn"
              type="button"
              onClick={() => setPicker({ type: "lineups" })}
            >
              Lineups
            </button>
            <button
              className="sc-monster-btn"
              type="button"
              title="Selected monster"
              onClick={() => setPicker({ type: "monster" })}
            >
              {monster ? (
                <img src={monster.icon} alt={monster.name} />
              ) : (
                <span>?</span>
              )}
            </button>
            <button
              className="tan-btn"
              type="button"
              onClick={() => setPicker({ type: "monster" })}
            >
              Select monster
            </button>
            <button
              className="tan-btn"
              type="button"
              onClick={() => updateBoard(emptyBoard())}
            >
              Clear board
            </button>
          </div>

          <div className="sc-hero-row">
            {Array.from({ length: SLOT_COUNT }, (_, index) => (
              <HeroCard
                key={index}
                index={index}
                slot={board.slots[index]}
                onPickHero={() => setPicker({ type: "hero", slotIndex: index })}
                onClear={() => updateBoard(clearSlot(board, index))}
                onPickGear={(listIndex) =>
                  setPicker({ type: "gear", slotIndex: index, listIndex })
                }
                onPickEnable={(listIndex) =>
                  setPicker({ type: "enable", slotIndex: index, listIndex })
                }
                onPickImprint={(listIndex) =>
                  setPicker({ type: "imprint", slotIndex: index, listIndex })
                }
              />
            ))}
          </div>
        </section>
      </div>
      {renderPicker()}
    </div>
  );
}
