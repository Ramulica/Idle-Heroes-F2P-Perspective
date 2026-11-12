import { useMemo, useState } from "react";
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
  SOUL_STONE_CATEGORIES,
  clearSlot,
  cloneBoard,
  defaultEnables,
  defaultImprints,
  defaultMonsterSetup,
  emptyBoard,
  enableOf,
  enableOptionsForSlot,
  formatGearStats,
  formatStoneStat,
  gearIdsForSameLevel,
  gearOf,
  gearOptionsForSlot,
  gearSlotDef,
  heroOf,
  imprintOf,
  monsterOf,
  newLineupId,
  patchSlot,
  setSlotListValue,
  slotTitle,
  stoneStatTone,
} from "../statCalculator";
import { useStatCalculator } from "../useStatCalculator";
import {
  AURA_CORE_ICON,
  AURA_GROUP_BONUSES,
  FACTION_AURA,
  FACTION_ORDER,
  computeFactionAura,
  formatAuraPct,
} from "../factionAura";
import {
  MONSTER_LEVELS,
  MONSTER_PASSIVE_LEVELS,
  MONSTER_RUNE_LEVELS,
  MONSTER_RUNES,
  formatMonsterStat,
  isUpgradeableMonster,
  monsterStatLines,
} from "../monsterCatalog";
import {
  computeBoardStatTotals,
  formatStatCell,
} from "../statTotals";
import {
  AWAKENING_TIERS,
  HERO_STAGE_OPTIONS,
  INFUSION_ICON,
  INFUSION_MAX,
  INFUSION_MIN,
  awakeningSpeedChoices,
  awakeningStatCount,
  awakeningStatPool,
  defaultAwakening,
  defaultHeroProgress,
  optionalsForStage,
  stageAllowsOptionals,
} from "../heroProgress";

function AuraBadge({ aura, onClick, interactive = true }) {
  const slots = aura.slotFactions;
  const body = (
    <>
      <span className="sc-aura-core">
        <img src={AURA_CORE_ICON} alt="" />
      </span>
      {slots.map((faction, index) => (
        <span
          key={index}
          className={`sc-aura-petal sc-aura-petal-${index}${
            faction ? " filled" : ""
          }`}
        >
          {faction ? <img src={faction.icon} alt="" /> : null}
        </span>
      ))}
    </>
  );
  if (!interactive) {
    return <div className="sc-aura-badge">{body}</div>;
  }
  return (
    <button
      type="button"
      className="sc-aura-badge"
      onClick={onClick}
      title="Faction Aura — tap for breakdown"
    >
      {body}
    </button>
  );
}

function MonsterBadge({ monster, onClick }) {
  const def = monster?.id ? monsterOf(monster.id) : null;
  return (
    <button
      type="button"
      className={`sc-monster-badge${def ? " filled" : ""}`}
      onClick={onClick}
      title={def ? `${def.name} · Lv ${monster.level}` : "Select monster"}
    >
      {def ? (
        <>
          <img src={def.icon} alt={def.name} />
          <span className="sc-monster-badge-lv">{monster.level}</span>
        </>
      ) : (
        <span className="sc-monster-badge-empty">?</span>
      )}
    </button>
  );
}

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

function Modal({ title, children, onClose, className = "" }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div
        className={`modal wide sc-modal${className ? ` ${className}` : ""}`}
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

function HeroStatBreakdownTable({ breakdown }) {
  if (!breakdown?.hero) {
    return <p className="muted">Select a hero to see the stat breakdown.</p>;
  }
  const { columns, rows, totalValues } = breakdown;
  if (!columns.length) {
    return (
      <p className="muted">
        No calculated stats yet. Equip gear, soul stone, imprints, monster, or
        build a faction aura.
      </p>
    );
  }
  return (
    <div className="sc-stat-table-wrap">
      <table className="sc-stat-table">
        <thead>
          <tr>
            <th scope="col">Source</th>
            {columns.map((col) => (
              <th key={col.key} scope="col">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row">{row.label}</th>
              {columns.map((col) => (
                <td key={col.key}>
                  {formatStatCell(row.values[col.key], col.unit)}
                </td>
              ))}
            </tr>
          ))}
          <tr className="sc-stat-table-total">
            <th scope="row">Total</th>
            {columns.map((col) => (
              <td key={col.key}>
                {formatStatCell(totalValues[col.key], col.unit)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
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

function StageStarButton({ stageId, onClick, disabled }) {
  const stage =
    HERO_STAGE_OPTIONS.find((row) => row.id === stageId) || HERO_STAGE_OPTIONS[0];
  return (
    <button
      type="button"
      className="sc-progress-btn sc-stage-star"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "Pick a hero first" : `Hero stage · ${stage.label}`}
    >
      <span className="sc-stage-star-shape" aria-hidden="true" />
      <span className="sc-stage-star-mark">{stage.mark}</span>
    </button>
  );
}

function InfusionButton({ value, onClick, disabled }) {
  return (
    <button
      type="button"
      className="sc-progress-btn sc-infusion-btn"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "Pick a hero first" : `Infusion · ${value}`}
    >
      <img src={INFUSION_ICON} alt="" />
      <span className="sc-infusion-num">{value}</span>
    </button>
  );
}

function AwakeningButton({ awakening, onClick, disabled }) {
  const tier = awakening?.tierId || null;
  const color =
    AWAKENING_TIERS.find((row) => row.id === tier)?.color || "#8a6a3a";
  return (
    <button
      type="button"
      className={`sc-progress-btn sc-awaken-btn${tier ? " filled" : ""}`}
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "Pick a hero first" : tier ? `Awakening · ${tier}` : "Awakening"}
      style={tier ? { "--sc-awaken-color": color } : undefined}
    >
      <span>{tier || "Aw"}</span>
    </button>
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
  onInfo,
  onPickStage,
  onPickInfusion,
  onPickAwakening,
}) {
  const hero = heroOf(slot.heroId);
  const progress = slot.progress || defaultHeroProgress();
  return (
    <article className="sc-hero-card">
      <div className="sc-hero-card-head">
        <h4>{slotTitle(index)}</h4>
        {hero ? (
          <div className="sc-hero-card-actions">
            <button
              className="sc-info-btn"
              type="button"
              aria-label={`Stat breakdown for ${hero.name}`}
              onClick={onInfo}
              title="Stat breakdown"
            >
              i
            </button>
            <button
              className="sc-clear-btn"
              type="button"
              aria-label={`Clear ${slotTitle(index)}`}
              onClick={onClear}
            >
              ×
            </button>
          </div>
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
      <div className="sc-progress-row">
        <StageStarButton
          stageId={progress.stageId}
          disabled={!hero}
          onClick={onPickStage}
        />
        <InfusionButton
          value={progress.infusion}
          disabled={!hero}
          onClick={onPickInfusion}
        />
        <AwakeningButton
          awakening={progress.awakening}
          disabled={!hero}
          onClick={onPickAwakening}
        />
      </div>

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
  const { guest, state, setState, loaded } = useStatCalculator();
  const [picker, setPicker] = useState(null);
  const [saveName, setSaveName] = useState("");
  const [summaryStatsOpen, setSummaryStatsOpen] = useState(false);

  const board = state.board;
  const monster = board.monster;

  const summarySlots = useMemo(
    () =>
      board.slots.map((slot, index) => ({
        index,
        title: slotTitle(index),
        hero: heroOf(slot.heroId),
      })),
    [board.slots]
  );

  const boardStats = useMemo(() => computeBoardStatTotals(board), [board]);

  const factionAura = boardStats.aura;

  function updateBoard(nextBoard) {
    setState((current) => ({
      ...current,
      board: cloneBoard(nextBoard),
      activeLineupId: null,
    }));
  }

  function patchProgress(slotIndex, partial) {
    const slot = board.slots[slotIndex];
    const progress = {
      ...(slot.progress || defaultHeroProgress()),
      ...partial,
      optionals: {
        ...(slot.progress?.optionals || defaultHeroProgress().optionals),
        ...(partial.optionals || {}),
      },
    };
    updateBoard(patchSlot(board, slotIndex, { progress }));
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

    if (picker.type === "hero-stats") {
      const breakdown = boardStats.slots[picker.slotIndex];
      const hero = breakdown?.hero;
      return (
        <Modal
          title={
            hero
              ? `${hero.name} · ${slotTitle(picker.slotIndex)} stats`
              : `${slotTitle(picker.slotIndex)} stats`
          }
          onClose={() => setPicker(null)}
          className="sc-modal-stats"
        >
          <p className="muted sc-modal-lead">
            Rows are sources. Columns are stats. Empty sources stay at — until
            those systems are wired in.
          </p>
          <HeroStatBreakdownTable breakdown={breakdown} />
        </Modal>
      );
    }

    if (picker.type === "hero") {
      return (
        <Modal title={`Select hero · ${slotTitle(picker.slotIndex)}`} onClose={() => setPicker(null)}>
          <p className="muted">Heroes are listed in the order you sent.</p>
          <PickGrid
            items={STAT_HEROES}
            selectedId={board.slots[picker.slotIndex].heroId}
            onPick={(heroId) => {
              updateBoard(
                patchSlot(board, picker.slotIndex, {
                  heroId,
                  enables: defaultEnables(),
                  imprints: defaultImprints(),
                })
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
        const sameLevel = gearIdsForSameLevel(preview, hero.heroClass);
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
              {sameLevel.length ? (
                <button
                  className="gold-btn"
                  type="button"
                  onClick={() => {
                    let next = board;
                    for (const row of sameLevel) {
                      next = setSlotListValue(
                        next,
                        picker.slotIndex,
                        "gear",
                        row.index,
                        row.id
                      );
                    }
                    updateBoard(next);
                    setPicker(null);
                  }}
                >
                  Equip all same level
                </button>
              ) : null}
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
          <p className="muted sc-modal-lead">
            Tap a monster to open its detail tab (level, passives, runes), then
            Equip.
          </p>
          <PickGrid
            items={MONSTER_OPTIONS}
            selectedId={board.monster?.id || null}
            gridClassName="sc-pick-grid-monster"
            onPick={(id) => {
              const keep =
                board.monster?.id === id
                  ? {
                      ...board.monster,
                      passives: [...board.monster.passives],
                      runes: [...board.monster.runes],
                    }
                  : defaultMonsterSetup(id);
              setPicker({ type: "monster-detail", draft: keep });
            }}
            onClear={() => {
              updateBoard({ ...board, monster: null });
              setPicker(null);
            }}
            renderItem={(item) => (
              <>
                <img src={item.icon} alt="" className="sc-pick-monster" />
                <span>{item.name}</span>
              </>
            )}
          />
        </Modal>
      );
    }

    if (picker.type === "monster-detail") {
      const draft = picker.draft || defaultMonsterSetup();
      const def = monsterOf(draft.id);
      if (!def) {
        return (
          <Modal title="Monster" onClose={() => setPicker(null)}>
            <p className="muted">Pick a monster first.</p>
            <div className="row-actions sc-pick-actions">
              <button
                className="tan-btn"
                type="button"
                onClick={() => setPicker({ type: "monster" })}
              >
                Back
              </button>
            </div>
          </Modal>
        );
      }
      const upgradeable = isUpgradeableMonster(def.id);
      const lines = monsterStatLines(draft);
      return (
        <Modal title={def.name} onClose={() => setPicker(null)}>
          <div className="sc-monster-detail">
            <div className="sc-monster-detail-top">
              <img src={def.icon} alt="" className="sc-monster-detail-icon" />
              <div className="sc-monster-detail-info">
                <div className="sc-monster-detail-stats">
                  {lines.map((row, index) => (
                    <span key={`${row.stat}-${index}`}>{formatMonsterStat(row)}</span>
                  ))}
                </div>
                {!upgradeable ? (
                  <p className="muted sc-monster-locked">
                    Levels stay at defaults for this monster.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="sc-monster-levels">
              <button
                type="button"
                className="sc-monster-lv-btn"
                disabled={!upgradeable}
                onClick={() =>
                  setPicker({
                    type: "monster-level",
                    kind: "animal",
                    draft,
                  })
                }
              >
                Animal Lv <strong>{draft.level}</strong>
              </button>

              <div className="sc-monster-passives">
                {draft.passives.map((lv, index) => (
                  <button
                    key={index}
                    type="button"
                    className="sc-monster-passive"
                    disabled={!upgradeable}
                    onClick={() =>
                      setPicker({
                        type: "monster-level",
                        kind: "passive",
                        index,
                        draft,
                      })
                    }
                    title={`Passive ${index + 1}`}
                  >
                    <span className="sc-monster-passive-label">P{index + 1}</span>
                    <span className="sc-monster-passive-lv">{lv}</span>
                  </button>
                ))}
              </div>

              <div className="sc-monster-runes">
                {MONSTER_RUNES.map((rune, index) => (
                  <button
                    key={rune.id}
                    type="button"
                    className={`sc-monster-rune sc-monster-rune-${index}`}
                    disabled={!upgradeable}
                    onClick={() =>
                      setPicker({
                        type: "monster-level",
                        kind: "rune",
                        index,
                        draft,
                      })
                    }
                    title={rune.name}
                  >
                    <img src={rune.icon} alt="" />
                    <span>Lv {draft.runes[index]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="row-actions sc-pick-actions">
            <button
              className="gold-btn"
              type="button"
              onClick={() => {
                updateBoard({ ...board, monster: { ...draft } });
                setPicker(null);
              }}
            >
              Equip
            </button>
            <button
              className="tan-btn"
              type="button"
              onClick={() => setPicker({ type: "monster" })}
            >
              Back
            </button>
            {board.monster?.id === def.id ? (
              <button
                className="tan-btn"
                type="button"
                onClick={() => {
                  updateBoard({ ...board, monster: null });
                  setPicker(null);
                }}
              >
                Unequip
              </button>
            ) : null}
          </div>
        </Modal>
      );
    }

    if (picker.type === "monster-level") {
      const draft = picker.draft || defaultMonsterSetup();
      const def = monsterOf(draft.id);
      const kind = picker.kind;
      const choices =
        kind === "animal"
          ? MONSTER_LEVELS
          : kind === "passive"
            ? MONSTER_PASSIVE_LEVELS
            : MONSTER_RUNE_LEVELS;
      const title =
        kind === "animal"
          ? `${def?.name || "Monster"} · Animal level`
          : kind === "passive"
            ? `${def?.name || "Monster"} · Passive ${picker.index + 1}`
            : `${def?.name || "Monster"} · ${MONSTER_RUNES[picker.index]?.name || "Rune"}`;
      const current =
        kind === "animal"
          ? draft.level
          : kind === "passive"
            ? draft.passives[picker.index]
            : draft.runes[picker.index];

      return (
        <Modal title={title} onClose={() => setPicker({ type: "monster-detail", draft })}>
          <p className="muted sc-modal-lead">Pick a level from the list.</p>
          <div className="sc-level-grid">
            {choices.map((lv) => (
              <button
                key={lv}
                type="button"
                className={`sc-level-chip${lv === current ? " selected" : ""}`}
                onClick={() => {
                  const next = {
                    ...draft,
                    passives: [...draft.passives],
                    runes: [...draft.runes],
                  };
                  if (kind === "animal") next.level = lv;
                  else if (kind === "passive") next.passives[picker.index] = lv;
                  else next.runes[picker.index] = lv;
                  setPicker({ type: "monster-detail", draft: next });
                }}
              >
                {lv}
              </button>
            ))}
          </div>
          <div className="row-actions sc-pick-actions">
            <button
              className="tan-btn"
              type="button"
              onClick={() => setPicker({ type: "monster-detail", draft })}
            >
              Back
            </button>
          </div>
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

    if (picker.type === "aura") {
      const aura = factionAura;
      const t = aura.totals;
      return (
        <Modal title="Faction Aura" onClose={() => setPicker(null)}>
          <div className="sc-aura-modal">
            <div className="sc-aura-modal-top">
              <AuraBadge aura={aura} interactive={false} />
              <div className="sc-aura-current">
                <strong>Current team bonuses</strong>
                {!aura.fullTeam ? (
                  <p className="muted">(deploy 6 heroes to activate the Aura)</p>
                ) : null}
                <p className="sc-aura-basic">
                  +{formatAuraPct(t.hp)} HP · +{formatAuraPct(t.attack)} Attack
                </p>
                <p className="sc-aura-special">
                  +{formatAuraPct(t.damageReduction)} Damage Reduction
                </p>
                <p className="sc-aura-special">
                  +{formatAuraPct(t.controlImmunity)} Control Immunity
                </p>
              </div>
            </div>

            <section className="sc-aura-section">
              <h4>Multiple heroes per faction</h4>
              <p className="muted">
                Each group size (1–6) applies once. Example: 3+3 → only the 3
                bonus; 2+4 → both.
              </p>
              <ul className="sc-aura-list">
                {[1, 2, 3, 4, 5, 6].map((size) => {
                  const bonus = AURA_GROUP_BONUSES[size];
                  const on = aura.activeGroups.some((g) => g.size === size);
                  return (
                    <li key={size} className={on ? "active" : ""}>
                      {size} hero{size > 1 ? "es" : ""}: +{formatAuraPct(bonus.hp)}{" "}
                      HP, +{formatAuraPct(bonus.attack)} Attack
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="sc-aura-section">
              <h4>Additional bonuses per hero</h4>
              <p className="muted">
                Special stats only — HP / Attack above stay muted for this tool.
              </p>
              <ul className="sc-aura-list sc-aura-faction-list">
                {FACTION_ORDER.map((name) => {
                  const def = FACTION_AURA[name];
                  const row = aura.perFaction.find((p) => p.faction === name);
                  const on = Boolean(row);
                  const bits = [];
                  if (def.damageReduction) {
                    bits.push(`+${formatAuraPct(def.damageReduction)} DR`);
                  }
                  if (def.controlImmunity) {
                    bits.push(`+${formatAuraPct(def.controlImmunity)} Ctrl Imm`);
                  }
                  return (
                    <li key={name} className={on ? "active" : ""}>
                      <img src={def.icon} alt="" />
                      <span>
                        {name}
                        {on ? ` ×${row.count}` : ""}: {bits.join(", ")}
                        {on && def.damageReduction
                          ? ` → +${formatAuraPct(row.damageReduction)} DR`
                          : ""}
                        {on && def.controlImmunity
                          ? ` → +${formatAuraPct(row.controlImmunity)} Ctrl Imm`
                          : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </Modal>
      );
    }

    if (picker.type === "hero-stage") {
      const slot = board.slots[picker.slotIndex];
      const progress = slot?.progress || defaultHeroProgress();
      const stageId = picker.stageId || progress.stageId;
      const optionals = optionalsForStage(stageId);
      return (
        <Modal
          title={`${slotTitle(picker.slotIndex)} · Hero stage`}
          onClose={() => setPicker(null)}
        >
          <p className="muted sc-modal-lead">
            E5 → V1–V4 → T1–T5 → D1–D6. Temple +levels are not used here.
          </p>
          <div className="sc-level-grid sc-stage-grid">
            {HERO_STAGE_OPTIONS.map((row) => (
              <button
                key={row.id}
                type="button"
                className={`sc-level-chip${row.id === stageId ? " selected" : ""}`}
                onClick={() =>
                  setPicker({
                    ...picker,
                    stageId: row.id,
                  })
                }
              >
                {row.label}
              </button>
            ))}
          </div>
          {optionals.length ? (
            <section className="sc-stage-optionals">
              <h4>Core &amp; skill subs</h4>
              <p className="muted">
                Only for T / D stages. Shown here in the popup, not on the card.
              </p>
              <div className="sc-optional-grid">
                {optionals.map((item) => {
                  const on = Boolean(
                    (picker.optionals || progress.optionals)?.[item.id]
                  );
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`sc-optional-chip${on ? " selected" : ""}`}
                      onClick={() =>
                        setPicker({
                          ...picker,
                          stageId,
                          optionals: {
                            ...(picker.optionals || progress.optionals),
                            [item.id]: !on,
                          },
                        })
                      }
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}
          <div className="row-actions sc-pick-actions">
            <button
              className="gold-btn"
              type="button"
              onClick={() => {
                const nextOptionals = stageAllowsOptionals(stageId)
                  ? {
                      ...progress.optionals,
                      ...(picker.optionals || {}),
                    }
                  : defaultHeroProgress().optionals;
                patchProgress(picker.slotIndex, {
                  stageId,
                  optionals: nextOptionals,
                });
                setPicker(null);
              }}
            >
              Save
            </button>
          </div>
        </Modal>
      );
    }

    if (picker.type === "hero-infusion") {
      const progress =
        board.slots[picker.slotIndex]?.progress || defaultHeroProgress();
      const current = picker.value ?? progress.infusion;
      const choices = Array.from(
        { length: INFUSION_MAX - INFUSION_MIN + 1 },
        (_, i) => INFUSION_MIN + i
      );
      return (
        <Modal
          title={`${slotTitle(picker.slotIndex)} · Infusion`}
          onClose={() => setPicker(null)}
        >
          <p className="muted sc-modal-lead">Pick infusion level 1–60.</p>
          <div className="sc-level-grid sc-infusion-grid">
            {choices.map((lv) => (
              <button
                key={lv}
                type="button"
                className={`sc-level-chip${lv === current ? " selected" : ""}`}
                onClick={() => {
                  patchProgress(picker.slotIndex, { infusion: lv });
                  setPicker(null);
                }}
              >
                {lv}
              </button>
            ))}
          </div>
        </Modal>
      );
    }

    if (picker.type === "hero-awakening") {
      const progress =
        board.slots[picker.slotIndex]?.progress || defaultHeroProgress();
      const draft = picker.draft || progress.awakening || defaultAwakening();
      const step = picker.step || "tier";
      const tierId = draft.tierId;
      const speedChoices = awakeningSpeedChoices(tierId);
      const needStats = awakeningStatCount(tierId);
      const pool = awakeningStatPool(tierId);
      const picked = Array.from({ length: needStats }, (_, i) => draft.stats?.[i] || null);

      if (step === "tier") {
        return (
          <Modal
            title={`${slotTitle(picker.slotIndex)} · Awakening`}
            onClose={() => setPicker(null)}
          >
            <p className="muted sc-modal-lead">
              Pick copy rank E−…X. Speed and % stats come next.
            </p>
            <div className="sc-level-grid sc-awaken-grid">
              {AWAKENING_TIERS.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  className={`sc-level-chip sc-awaken-chip${
                    row.id === tierId ? " selected" : ""
                  }`}
                  style={{ "--sc-awaken-color": row.color }}
                  onClick={() => {
                    const next = defaultAwakening(row.id);
                    setPicker({
                      type: "hero-awakening",
                      slotIndex: picker.slotIndex,
                      step: "speed",
                      draft: next,
                    });
                  }}
                >
                  {row.label}
                </button>
              ))}
            </div>
            {progress.awakening ? (
              <div className="row-actions sc-pick-actions">
                <button
                  className="tan-btn"
                  type="button"
                  onClick={() => {
                    patchProgress(picker.slotIndex, { awakening: null });
                    setPicker(null);
                  }}
                >
                  Clear awakening
                </button>
              </div>
            ) : null}
          </Modal>
        );
      }

      if (step === "speed") {
        return (
          <Modal
            title={`${slotTitle(picker.slotIndex)} · Awakening ${tierId} · Speed`}
            onClose={() => setPicker(null)}
          >
            <p className="muted sc-modal-lead">
              Speed window is ±3 tiers around {tierId} (exact values can be
              tuned later).
            </p>
            <div className="sc-level-grid sc-infusion-grid">
              {speedChoices.map((spd) => (
                <button
                  key={spd}
                  type="button"
                  className={`sc-level-chip${
                    spd === draft.speed ? " selected" : ""
                  }`}
                  onClick={() => {
                    const next = {
                      ...draft,
                      speed: spd,
                      stats: Array.from(
                        { length: needStats },
                        (_, i) => draft.stats?.[i] || null
                      ),
                    };
                    if (needStats <= 0) {
                      patchProgress(picker.slotIndex, { awakening: next });
                      setPicker(null);
                      return;
                    }
                    setPicker({
                      type: "hero-awakening",
                      slotIndex: picker.slotIndex,
                      step: "stats",
                      draft: next,
                      statIndex: 0,
                    });
                  }}
                >
                  {spd}
                </button>
              ))}
            </div>
            <div className="row-actions sc-pick-actions">
              <button
                className="tan-btn"
                type="button"
                onClick={() =>
                  setPicker({
                    type: "hero-awakening",
                    slotIndex: picker.slotIndex,
                    step: "tier",
                    draft,
                  })
                }
              >
                Back
              </button>
            </div>
          </Modal>
        );
      }

      const statIndex = Math.min(
        Math.max(0, Number(picker.statIndex) || 0),
        Math.max(0, needStats - 1)
      );
      return (
        <Modal
          title={`${slotTitle(picker.slotIndex)} · Awakening ${tierId} · Stat ${
            statIndex + 1
          }/${needStats}`}
          onClose={() => setPicker(null)}
        >
          <p className="muted sc-modal-lead">
            Choose {needStats} special stat{needStats > 1 ? "s" : ""} for this
            copy. Values come later — pick the labels for now.
          </p>
          <p className="sc-awaken-picked">
            {picked.map((id, i) => (
              <span key={i}>{id || `Stat ${i + 1}?`}</span>
            ))}
          </p>
          <div className="sc-awaken-stat-list">
            {pool.map((name) => {
              const usedElsewhere = picked.some(
                (id, i) => id === name && i !== statIndex
              );
              const on = picked[statIndex] === name;
              return (
                <button
                  key={name}
                  type="button"
                  className={`sc-awaken-stat${on ? " selected" : ""}`}
                  disabled={usedElsewhere}
                  onClick={() => {
                    const nextStats = [...picked];
                    nextStats[statIndex] = name;
                    const next = { ...draft, stats: nextStats };
                    if (statIndex + 1 < needStats) {
                      setPicker({
                        type: "hero-awakening",
                        slotIndex: picker.slotIndex,
                        step: "stats",
                        draft: next,
                        statIndex: statIndex + 1,
                      });
                    } else {
                      patchProgress(picker.slotIndex, { awakening: next });
                      setPicker(null);
                    }
                  }}
                >
                  {name}
                </button>
              );
            })}
          </div>
          <div className="row-actions sc-pick-actions">
            <button
              className="tan-btn"
              type="button"
              onClick={() =>
                setPicker({
                  type: "hero-awakening",
                  slotIndex: picker.slotIndex,
                  step: statIndex > 0 ? "stats" : "speed",
                  draft,
                  statIndex: Math.max(0, statIndex - 1),
                })
              }
            >
              Back
            </button>
          </div>
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
                  "Top summary shows each position and its hero. Tap i on a card for a local breakdown.",
                  "Under each hero name: star (stage), infusion (1–60), and awakening copy. Icons only — details open in popups.",
                  "Monster icon sits beside Faction Aura. Tap it to pick a monster, then Equip from the detail tab (level, P1–4, runes).",
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
        {guest ? (
          <p className="guest-banner">
            Guest mode — this lineup stays on this device only. Log in to save
            it to your account.
          </p>
        ) : null}
        {!loaded ? (
          <p className="muted">Loading saved lineup…</p>
        ) : null}

        <section className="sc-summary">
          <div className="calc-row-head sc-summary-head">
            <div className="sc-summary-head-left">
              <h3>Summary</h3>
              <HelpTip
                title="Summary"
                message="Each card shows that hero’s calculated totals (no HP / Attack). Use Stats to open or close every hero list together. Tap Info for the source × stat breakdown table."
              />
            </div>
            <button
              type="button"
              className="sc-summary-stats-toggle"
              onClick={() => setSummaryStatsOpen((open) => !open)}
            >
              {summaryStatsOpen ? "Hide stats" : "Show stats"}
            </button>
          </div>
          <div className="sc-summary-grid">
            {summarySlots.map((row) => {
              const slot = board.slots[row.index];
              const gearFilled = slot.gear.filter(Boolean).length;
              const enableFilled = slot.enables.filter(Boolean).length;
              const imprintFilled = slot.imprints.filter(Boolean).length;
              const breakdown = boardStats.slots[row.index];
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
                  {summaryStatsOpen ? (
                    row.hero && breakdown?.totals?.length ? (
                      <ul className="sc-summary-stats">
                        {breakdown.totals.map((stat) => (
                          <li key={stat.key}>
                            {stat.stat}
                            {stat.unit === "%" ? "%" : ""}{" "}
                            {formatStatCell(stat.value, stat.unit)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="muted">Stats: —</span>
                    )
                  ) : null}
                  {row.hero ? (
                    <button
                      type="button"
                      className="sc-summary-info"
                      onClick={() =>
                        setPicker({ type: "hero-stats", slotIndex: row.index })
                      }
                    >
                      Info
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="sc-block">
          <div className="sc-lineup-top">
            <div className="sc-lineup-top-main">
              <div className="calc-row-head sc-lineup-head">
                <div className="sc-lineup-head-left">
                  <h3>Hero lineup</h3>
                  <HelpTip
                    title="Hero lineup"
                    message="Six cards: Front 1–2 and Back 3–6. Tap any empty portrait or gear/enable/imprint slot to open a popup. Monster and Faction Aura sit on the right (special stats: DR and Control Immunity)."
                  />
                </div>
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
                  className="tan-btn"
                  type="button"
                  onClick={() => updateBoard(emptyBoard())}
                >
                  Clear board
                </button>
              </div>
            </div>
            <div className="sc-lineup-side">
              <MonsterBadge
                monster={monster}
                onClick={() => {
                  if (monster?.id) {
                    setPicker({
                      type: "monster-detail",
                      draft: {
                        ...monster,
                        passives: [...monster.passives],
                        runes: [...monster.runes],
                      },
                    });
                  } else {
                    setPicker({ type: "monster" });
                  }
                }}
              />
              <AuraBadge
                aura={factionAura}
                onClick={() => setPicker({ type: "aura" })}
              />
            </div>
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
                onInfo={() =>
                  setPicker({ type: "hero-stats", slotIndex: index })
                }
                onPickStage={() =>
                  setPicker({
                    type: "hero-stage",
                    slotIndex: index,
                    stageId: board.slots[index].progress?.stageId || "E5",
                    optionals: {
                      ...(board.slots[index].progress?.optionals ||
                        defaultHeroProgress().optionals),
                    },
                  })
                }
                onPickInfusion={() =>
                  setPicker({ type: "hero-infusion", slotIndex: index })
                }
                onPickAwakening={() =>
                  setPicker({
                    type: "hero-awakening",
                    slotIndex: index,
                    step: "tier",
                    draft:
                      board.slots[index].progress?.awakening ||
                      defaultAwakening(),
                  })
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
