import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import HelpTip from "../components/HelpTip.jsx";
import HeroStageBadge from "../components/HeroStageBadge.jsx";
import {
  ENABLE_5D_UNLOCK_INFUSION,
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
  isDetailStat,
  partitionStatRows,
} from "../statTotals";
import {
  analyzeHeroSuggestions,
  formatHeroRoles,
  suggestBoardContext,
} from "../suggestStats";
import {
  AWAKENING_TIERS,
  HERO_STAGE_OPTIONS,
  INFUSION_ICON,
  INFUSION_MAX,
  INFUSION_MIN,
  awakeningSpeedRange,
  awakeningStatCount,
  awakeningStatPool,
  awakeningStatValue,
  defaultAwakening,
  defaultHeroProgress,
  heroLevelForStage,
  IMPRINT_UNLOCK_STAGES,
  imprintUnlocked,
  optionalsForStage,
  resolvedStageOptionals,
  stageLocksOptionals,
} from "../heroProgress";
import {
  BRANCH_META,
  INFUSION_EDGES,
  INFUSION_NODES,
  INFUSION_NODE_BY_ID,
  INFUSION_POINT_CAP_LEVEL,
  INFUSION_ROOTS,
  INFUSION_UNLOCK_LEVEL,
  canSelectInfusionNode,
  formatInfusionStatLine,
  infusionNodeTip,
  infusionPointBudget,
  normalizeInfusionNodes,
  summarizeInfusionStats,
  toggleInfusionNode,
} from "../imprintInfusion";
import {
  CLOUD_BUILDING_MAX,
  CLOUD_BUILDINGS,
  CLOUD_ISLAND_ICON,
  CLOUD_SPEED_PER_LEVEL,
  TENANT_HOUSE_MAX,
  TENANT_HOUSES,
  TENANTS_ICON,
  defaultCloudIsland,
  defaultTenants,
  factionIconsFor,
  normalizeCloudIsland,
  normalizeTenants,
  tenantSpeedFromLevel,
  tenantSpeedFromLevels,
} from "../tenantsCloud";
import {
  SKIN_ICON,
  SKIN_LEVELS,
  defaultSkin,
  formatSkinStatLine,
  normalizeSkin,
  skinLevelOf,
  skinOf,
  skinsForHero,
} from "../skins";
import {
  COMBAT_ROUNDS,
  GAME_MODES,
  gameModeOf,
  normalizeCombatRound,
} from "../gameModes";
import {
  GUILD_TECH_CLASSES,
  GUILD_TECH_CLASS_BY_ID,
  GUILD_TECH_INNER_NODES,
  guildTechNodeStats,
  guildTechOuterNodes,
  isGuildTechNodeEnabled,
  normalizeGuildTech,
  summarizeGuildTechClass,
  toggleGuildTechNode,
} from "../guildTech";
import {
  STAR_DESTINY_ICON,
  STARSPAWNS,
  formatStarspawnStatValue,
  normalizeStarspawns,
  patchStarspawn,
  starspawnEffectiveValue,
  starspawnOf,
} from "../starspawns";
import {
  SIGIL_RARITIES,
  SIGIL_STAT_OPTIONS,
  createSigilDraft,
  formatSigilStat,
  normalizeSigils,
  removeSigil,
  sigilRarityOf,
  sigilStatOptionOf,
  statSlotsForRarity,
  upsertSigil,
} from "../sigils";
import {
  buildTrainMatrix,
  clearTrain,
  mergeTrainSections,
  normalizeTrain,
  ocrTrainImage,
  removeTrainSection,
} from "../trainStats";

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

function Modal({
  title,
  children,
  onClose,
  className = "",
  footer = null,
  hideClose = false,
}) {
  // Only close when press+release both land on the backdrop — so selecting
  // text in a field and dragging outside the popup does not dismiss it.
  const backdropPressed = useRef(false);
  return (
    <div
      className="modal-back"
      onMouseDown={(event) => {
        backdropPressed.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (backdropPressed.current && event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`modal wide sc-modal${className ? ` ${className}` : ""}`}
        onClick={(event) => event.stopPropagation()}
      >
        <h3>{title}</h3>
        {children}
        <div className="row-actions sc-pick-actions">
          {footer}
          {hideClose ? null : (
            <button className="gold-btn" type="button" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBreakdownGrid({ columns, rows, totalValues }) {
  if (!columns.length) return null;
  return (
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
  const mainColumns = columns.filter((col) => !isDetailStat(col.stat));
  const detailColumns = columns.filter((col) => isDetailStat(col.stat));
  return (
    <div className="sc-stat-table-wrap">
      <StatBreakdownGrid
        columns={mainColumns}
        rows={rows}
        totalValues={totalValues}
      />
      {detailColumns.length ? (
        <details className="sc-stat-more-details">
          <summary>More details ({detailColumns.length})</summary>
          <StatBreakdownGrid
            columns={detailColumns}
            rows={rows}
            totalValues={totalValues}
          />
        </details>
      ) : null}
      {breakdown.ccImmunities?.length ? (
        <details className="sc-ci-details">
          <summary>
            CI immunities
            {breakdown.ciFromImmunities ? (
              <span className="sc-ci-extra">
                {" "}
                (+{breakdown.ciFromImmunities}%)
              </span>
            ) : null}
          </summary>
          <ul>
            {breakdown.ccImmunities.map((row) => (
              <li key={row.key || row.stat}>
                {row.stat} {formatStatCell(row.value, row.unit)}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function SummaryStatList({ totals }) {
  const [ciOpen, setCiOpen] = useState(false);
  if (!totals?.length) return <span className="muted">Stats: —</span>;
  const { main, detail } = partitionStatRows(totals);

  function renderStatItem(stat) {
    const isCi =
      stat.stat === "Control Immunity" && (stat.unit || "%") === "%";
    if (isCi) {
      const imm = stat.immunities || [];
      return (
        <li key={stat.key} className="sc-summary-stat-ci">
          <button
            type="button"
            className="sc-ci-toggle"
            onClick={() => setCiOpen((open) => !open)}
          >
            CI%
            {stat.value || !stat.ciFromImmunities
              ? ` ${formatStatCell(stat.value, "%")}`
              : ""}
            {stat.ciFromImmunities ? (
              <span className="sc-ci-extra">
                {" "}
                (+{stat.ciFromImmunities}%)
              </span>
            ) : null}
            {imm.length ? (
              <span className="sc-ci-caret">{ciOpen ? "▾" : "▸"}</span>
            ) : null}
          </button>
          {ciOpen && imm.length ? (
            <ul className="sc-ci-sublist">
              {imm.map((row) => (
                <li key={row.key || row.stat}>
                  {row.stat.replace(/ Immunity$/, "")}{" "}
                  {formatStatCell(row.value, "%")}
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      );
    }
    return (
      <li key={stat.key}>
        {stat.stat}
        {stat.unit === "%" ? "%" : ""}{" "}
        {formatStatCell(stat.value, stat.unit)}
      </li>
    );
  }

  return (
    <div className="sc-summary-stats-wrap">
      <ul className="sc-summary-stats">{main.map(renderStatItem)}</ul>
      {detail.length ? (
        <details className="sc-stat-more-details sc-summary-more-details">
          <summary>More details ({detail.length})</summary>
          <ul className="sc-summary-stats">{detail.map(renderStatItem)}</ul>
        </details>
      ) : null}
    </div>
  );
}

function GuildTechTree({ classId, guildTech, onToggle }) {
  const def = GUILD_TECH_CLASS_BY_ID[classId];
  if (!def) return null;
  const color = def.color;
  const outer = guildTechOuterNodes(classId);
  const left = outer.filter((n) => n.side === "left");
  const right = outer.filter((n) => n.side === "right");
  const summary = summarizeGuildTechClass(guildTech, classId);

  const nodeStyle = (angleDeg, radiusPct) => {
    const rad = (angleDeg * Math.PI) / 180;
    const x = 50 + radiusPct * Math.cos(rad);
    const y = 50 - radiusPct * Math.sin(rad);
    return { left: `${x}%`, top: `${y}%` };
  };

  const renderNode = (node, extraClass = "") => {
    const enabled = isGuildTechNodeEnabled(guildTech, classId, node.id);
    const stats = guildTechNodeStats(classId, node.id);
    const tip = stats
      .map((s) => `${s.stat} ${s.unit === "%" ? `${s.value}%` : s.value}`)
      .join(", ");
    return (
      <button
        key={node.id}
        type="button"
        className={`sc-gt-node${enabled ? " on" : ""}${extraClass ? ` ${extraClass}` : ""}`}
        style={{ "--gt-color": color }}
        title={tip || node.label}
        onClick={() => onToggle(node.id)}
      >
        <span className="sc-gt-node-short">{node.short || node.label}</span>
        <span className="sc-gt-node-lv">{enabled ? "ON" : "OFF"}</span>
      </button>
    );
  };

  return (
    <div className="sc-gt-panel" style={{ "--gt-color": color }}>
      <div className="sc-gt-tree">
        <div className="sc-gt-outer left" aria-label="Damage vs classes">
          <span className="sc-gt-outer-label">vs Class</span>
          {left.map((node) => renderNode(node, "outer"))}
        </div>
        <div className="sc-gt-ring">
          <div className="sc-gt-center">
            <img src={def.icon} alt="" />
            <span>{def.name}</span>
          </div>
          {GUILD_TECH_INNER_NODES.map((node) => (
            <div
              key={node.id}
              className="sc-gt-node-wrap"
              style={nodeStyle(node.angle, 38)}
            >
              {renderNode(node)}
            </div>
          ))}
        </div>
        <div className="sc-gt-outer right" aria-label="CC immunities">
          <span className="sc-gt-outer-label">Immunity</span>
          {right.map((node) => renderNode(node, "outer"))}
        </div>
      </div>
      <div className="sc-gt-summary">
        <h4>Enabled stats</h4>
        {summary.rows.length ? (
          <ul>
            {summary.rows.map((row) => {
              const isCi = row.stat === "Control Immunity";
              const showValue = !(isCi && !row.value && row.ciFromImmunities);
              return (
                <li key={`${row.stat}|${row.unit}`}>
                  {isCi ? "CI" : row.stat}
                  {row.unit === "%" ? "%" : ""}
                  {showValue ? <> {formatStatCell(row.value, row.unit)}</> : null}
                  {row.ciFromImmunities ? (
                    <span className="sc-ci-extra">
                      {" "}
                      (+{row.ciFromImmunities}%)
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="muted">No nodes enabled.</p>
        )}
        {summary.immunities.length ? (
          <details className="sc-ci-details">
            <summary>Individual immunities</summary>
            <ul>
              {summary.immunities.map((row) => (
                <li key={row.stat}>
                  {row.stat.replace(/ Immunity$/, "")}{" "}
                  {formatStatCell(row.value, "%")}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
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
      <HeroStageBadge stageId={stage.id} templeLevel={1} />
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
  const long = tier && tier.length >= 3;
  return (
    <button
      type="button"
      className={`sc-progress-btn sc-awaken-btn${tier ? " filled" : ""}${
        long ? " long" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "Pick a hero first" : tier ? `Awakening · ${tier}` : "Awakening"}
      style={tier ? { "--sc-awaken-color": color } : undefined}
    >
      <span>{tier || "Aw"}</span>
    </button>
  );
}

function awakenDraftFromProgress(awakening) {
  return awakening ? { ...awakening, stats: [...(awakening.stats || [])] } : defaultAwakening();
}

function clampAwakenSpeed(tierId, value) {
  const { min, max } = awakeningSpeedRange(tierId);
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function clampIntField(value, min, max, fallback) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

const SUGGEST_HELP_ADVANCED = [
  {
    heading: "What this is",
    paragraphs: [
      "Suggest is a cap advisor, not a full damage simulator. It scores your current totals against Idle Heroes combat caps from community formulas, then ranks a few one-piece swaps (imprint, enable 1/4, soul stone). Artifacts are not suggested — you pick them for abilities. Nothing is applied automatically.",
    ],
  },
  {
    heading: "Hard / soft caps",
    items: [
      "Precision 150% — damage multiplier 1 + Prec×0.3 caps here. Extra Precision is soft waste for damage, but still offsets Block 1:1.",
      "Crit Damage 150% — crit multiplier 1.5 + 2×CD hard-caps; excess is wasted.",
      "Damage Reduction 75% — mitigation is 1 − DR, capped at 75% (faction advantage can add +0.3 vs DR; noted in copy only).",
      "All Damage Reduction — no hard cap; treated as more-is-better (also hits true damage).",
    ],
  },
  {
    heading: "Hero roles",
    items: [
      "Damage dealers — chase offensive floors (Precision / Crit Damage / Skill / All DMG / Holy / Crit). Defense is secondary.",
      "Supports — do not need offensive stats; leftover offense is soft waste to reallocate into Energy, DR / All DR / Block / CI.",
      "Most supports want Energy 50+ so they open with an active.",
      "CC heroes — Control Precision and Control Immunity Offset first, then defensive stats.",
      "Wukong is all three (DD + CC + Support). Natalia is DD but Crit / Crit Damage should stay at 0.",
    ],
  },
  {
    heading: "Soft floors (Need more)",
    paragraphs: [
      "Targets and priorities are role-weighted from the lists above. Caps still apply for Precision 150, Crit Damage 150, and DR 75.",
    ],
  },
  {
    heading: "Energy & combat round",
    items: [
      "Energy < 50 — will not open with an active on Round 1 (T3 / basic branch).",
      "Energy 50–99 — opens with active; no overflow Skill Damage.",
      "Energy ≥ 100 — overflow converts 1:1 into Skill Damage on the next active.",
      "Game start hides T2/T3 origin combat stats; Round 1 applies T2 if Energy ≥ 50, else T3.",
    ],
  },
  {
    heading: "How swaps are scored",
    paragraphs: [
      "For each candidate, the slot is cloned, one piece is swapped, and totals are recomputed with that hero’s role rules. Score favors cutting hard overcap, then soft waste, then closing undercap gaps — and penalizes creating new hard overcap. Top unique suggestions (up to 5) are shown with the expected stat deltas.",
    ],
    formula:
      "score ≈ 3×ΔhardWaste + 1.2×ΔsoftWaste + 2×ΔunderGap − 4×newHardOvercap",
  },
  {
    heading: "Out of scope",
    items: [
      "Per-hit damage (Armor×level, DoT Skill Damage formula, true damage lists, round-15 ramp).",
      "HP / Attack / EHP stacking.",
      "Auto-apply or full 6-hero lineup optimizer.",
    ],
  },
];

function HeroSuggestPanel({ analysis }) {
  if (!analysis) {
    return <p className="muted">Select a hero to see suggestions.</p>;
  }
  const { over, under, swaps, notes, profile } = analysis;
  const empty =
    !over.length && !under.length && !swaps.length && !notes.length;
  return (
    <div className="sc-suggest">
      {profile ? (
        <p className="sc-suggest-role">
          {formatHeroRoles(profile.roles)}
          {profile.flags?.noCrit ? " · no Crit / Crit Damage" : ""}
        </p>
      ) : null}
      {empty ? (
        <p className="muted">
          No strong overcap or undercap signals yet. Equip more gear, then
          check again.
        </p>
      ) : null}
      {over.length ? (
        <section className="sc-suggest-section">
          <h4>Too much</h4>
          <ul className="sc-suggest-list">
            {over.map((row) => {
              const pct = row.unit === "%" ? "%" : "";
              return (
                <li key={`over-${row.stat}|${row.unit}`}>
                  <strong>
                    {row.label} {row.value}
                    {pct}
                  </strong>
                  <span>
                    {" "}
                    (cap {row.cap}
                    {pct}) · +{row.wasted}
                    {pct} {row.soft ? "soft waste" : "wasted"}
                  </span>
                  <div className="sc-suggest-meta">mainly {row.sourceText}</div>
                  {row.note ? (
                    <div className="sc-suggest-note">{row.note}</div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
      {under.length ? (
        <section className="sc-suggest-section">
          <h4>Need more</h4>
          <ul className="sc-suggest-list">
            {under.map((row) => {
              const pct = row.unit === "%" ? "%" : "";
              return (
                <li key={`under-${row.stat}|${row.unit}`}>
                  <strong>
                    {row.label} {row.value}
                    {pct}
                  </strong>
                  <span>
                    {" "}
                    / {row.target}
                    {pct} · missing {row.missing}
                    {pct}
                  </span>
                  {row.note ? (
                    <div className="sc-suggest-note">{row.note}</div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
      {swaps.length ? (
        <section className="sc-suggest-section">
          <h4>Suggested changes</h4>
          <ul className="sc-suggest-list sc-suggest-swaps">
            {swaps.map((row) => (
              <li key={`${row.kind}-${row.label}`}>
                <strong>{row.label}</strong>
                {row.diff ? (
                  <div className="sc-suggest-meta">{row.diff}</div>
                ) : null}
                {row.detail ? (
                  <div className="sc-suggest-note">{row.detail}</div>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="muted sc-suggest-hint">
            Recommendations only — nothing is applied automatically.
          </p>
        </section>
      ) : null}
      {notes.length ? (
        <section className="sc-suggest-section">
          <h4>Energy / round</h4>
          <ul className="sc-suggest-list">
            {notes.map((row) => (
              <li key={row.id}>{row.text}</li>
            ))}
          </ul>
        </section>
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
  onInfo,
  onSuggest,
  onPickStage,
  onPickInfusion,
  onPickAwakening,
  onPickTenants,
  onPickCloudIsland,
  onPickSkin,
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
              className="sc-suggest-btn"
              type="button"
              aria-label={`Stat suggestions for ${hero.name}`}
              onClick={onSuggest}
              title="Suggest"
            >
              S
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
          <>
            <img src={hero.icon} alt={hero.name} />
            <span className="sc-hero-lv" title="Hero level">
              {heroLevelForStage(progress.stageId)}
            </span>
          </>
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
          const isArtifact = def?.id === "artifact";
          const tip = locked
            ? `${def.name} · coming later`
            : option
              ? `${option.name}${
                  option.stats?.length
                    ? ` · ${
                        isStone
                          ? option.stats
                              .map((row) => formatStoneStat(row, true))
                              .join(" · ")
                          : formatGearStats(option.stats)
                      }`
                    : ""
                }`
              : def?.name || `Gear ${gearIndex + 1}`;
          return (
            <button
              key={gearIndex}
              type="button"
              className={`sc-gear-slot${option ? " filled" : ""}${
                locked ? " locked" : ""
              }${isStone ? " stone-slot" : ""}${
                isArtifact ? " artifact-slot" : ""
              }`}
              onClick={() => onPickGear(gearIndex)}
              title={tip}
            >
              {option ? (
                <img src={option.icon} alt="" />
              ) : locked ? (
                <span className="sc-gear-lock">{def.name[0]}</span>
              ) : (
                <span>{isStone ? "S" : isArtifact ? "A" : "+"}</span>
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
          const unlocked = imprintUnlocked(progress.stageId, imprintIndex);
          const unlockAt = IMPRINT_UNLOCK_STAGES[imprintIndex];
          return (
            <button
              key={imprintIndex}
              type="button"
              className={`sc-circle-slot sc-imprint-slot${
                option && unlocked ? " filled" : ""
              }${unlocked ? "" : " locked"}`}
              onClick={() => {
                if (!unlocked) return;
                onPickImprint(imprintIndex);
              }}
              disabled={!hero || !unlocked}
              title={
                !unlocked
                  ? `Imprint ${imprintIndex + 1} unlocks at ${unlockAt}`
                  : option
                    ? `${option.name} +${option.percent}%`
                    : `Imprint ${imprintIndex + 1}`
              }
            >
              {option && unlocked ? (
                <img src={option.icon} alt="" />
              ) : (
                <span>{unlocked ? "+" : "–"}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="sc-extra-row">
        <button
          type="button"
          className="sc-extra-btn"
          disabled={!hero}
          onClick={onPickTenants}
          title="Tenants"
        >
          <img src={TENANTS_ICON} alt="" />
          <span>Tenants</span>
        </button>
        <button
          type="button"
          className="sc-extra-btn"
          disabled={!hero}
          onClick={onPickCloudIsland}
          title="Cloud Island"
        >
          <img src={CLOUD_ISLAND_ICON} alt="" />
          <span>Cloud</span>
        </button>
        <button
          type="button"
          className="sc-extra-btn"
          disabled={!hero}
          onClick={onPickSkin}
          title="Skin"
        >
          <img src={SKIN_ICON} alt="" />
          <span>Skin</span>
        </button>
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
  const [trainOcr, setTrainOcr] = useState(null);
  const trainFileRef = useRef(null);

  const board = state.board;
  const monster = board.monster;
  const train = normalizeTrain(board.train);
  const trainMatrix = useMemo(() => buildTrainMatrix(train), [train]);

  async function runTrainOcrOnFiles(fileList) {
    const files = Array.from(fileList || []).filter(
      (f) => f && String(f.type || "").startsWith("image/")
    );
    if (!files.length) {
      setTrainOcr({
        status: "error",
        fileIndex: 0,
        fileTotal: 0,
        progress: 0,
        fileName: "",
        results: [],
        error: "No images found — paste a screenshot or pick files.",
      });
      return;
    }

    setPicker({ type: "train-load" });
    const results = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = file.name || `Screenshot ${i + 1}`;
      setTrainOcr({
        status: "running",
        fileIndex: i + 1,
        fileTotal: files.length,
        progress: 0,
        fileName,
        results: [...results],
        error: null,
      });
      try {
        const parsed = await ocrTrainImage(file, (progress) => {
          setTrainOcr((prev) =>
            prev
              ? { ...prev, progress, status: "running" }
              : {
                  status: "running",
                  fileIndex: i + 1,
                  fileTotal: files.length,
                  progress,
                  fileName,
                  results: [...results],
                  error: null,
                }
          );
        });
        setState((current) => ({
          ...current,
          board: cloneBoard({
            ...current.board,
            train: mergeTrainSections(current.board.train, parsed),
          }),
        }));
        results.push({
          name: fileName,
          sections: parsed.sections.length,
          ok: true,
        });
      } catch (err) {
        results.push({
          name: fileName,
          sections: 0,
          ok: false,
          error: err?.message || "OCR failed",
        });
      }
    }

    const anyOk = results.some((r) => r.ok && r.sections > 0);
    setTrainOcr({
      status: "done",
      fileIndex: files.length,
      fileTotal: files.length,
      progress: 100,
      fileName: "",
      results,
      error: anyOk
        ? null
        : "No Train sections found — try clearer crops of the white headers + green stats.",
    });
  }

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
    const base = slot.progress || defaultHeroProgress();
    const nextInfusion =
      partial.infusion != null ? partial.infusion : base.infusion;
    const budget = infusionPointBudget(nextInfusion);
    const rawNodes =
      partial.infusionNodes != null ? partial.infusionNodes : base.infusionNodes;
    const progress = {
      ...base,
      ...partial,
      optionals: {
        ...(base.optionals || defaultHeroProgress().optionals),
        ...(partial.optionals || {}),
      },
      infusionNodes: normalizeInfusionNodes(rawNodes, budget),
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

    if (picker.type === "train-load") {
      const busy = trainOcr?.status === "running";
      const done = trainOcr?.status === "done" || trainOcr?.status === "error";
      return (
        <Modal
          title="Load Train screenshots"
          onClose={() => {
            if (busy) return;
            setPicker(null);
          }}
          className="sc-train-modal"
          hideClose
          footer={
            <>
              {!busy ? (
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => trainFileRef.current?.click()}
                >
                  Choose from folder
                </button>
              ) : null}
              <button
                type="button"
                className="gold-btn"
                disabled={busy}
                onClick={() => {
                  if (!busy) setPicker(null);
                }}
              >
                {done ? "Done" : "Close"}
              </button>
            </>
          }
        >
          <p className="muted sc-modal-lead">
            Paste with Ctrl+V, or pick one or more screenshots. Images are read
            one by one in your browser, then merged into the Train table.
          </p>

          <input
            ref={trainFileRef}
            type="file"
            accept="image/*"
            multiple
            className="sc-train-file"
            onChange={(e) => {
              // Copy first — clearing the input empties a live FileList.
              const list = Array.from(e.target.files || []);
              e.target.value = "";
              if (!list.length) return;
              void runTrainOcrOnFiles(list);
            }}
          />

          {busy ? (
            <div className="sc-train-progress">
              <p>
                Reading <strong>{trainOcr.fileName}</strong> (
                {trainOcr.fileIndex}/{trainOcr.fileTotal})
              </p>
              <div className="sc-train-progress-bar">
                <span style={{ width: `${trainOcr.progress || 0}%` }} />
              </div>
              <p className="muted">{trainOcr.progress || 0}%</p>
            </div>
          ) : (
            <div
              className="sc-train-paste"
              tabIndex={0}
              autoFocus
              ref={(el) => {
                if (el && trainOcr?.status !== "running") el.focus();
              }}
              onPaste={(e) => {
                const items = e.clipboardData?.items;
                if (!items) return;
                const files = [];
                for (const item of items) {
                  if (item.type?.startsWith("image/")) {
                    const f = item.getAsFile();
                    if (f) files.push(f);
                  }
                }
                if (!files.length) return;
                e.preventDefault();
                void runTrainOcrOnFiles(files);
              }}
            >
              <strong>Ctrl+V</strong> paste screenshot here
              <span className="muted">
                or use Choose from folder — multi-select supported
              </span>
            </div>
          )}

          {trainOcr?.error ? (
            <p className="muted sc-train-error">{trainOcr.error}</p>
          ) : null}

          {trainOcr?.results?.length ? (
            <ul className="sc-train-ocr-log">
              {trainOcr.results.map((row, i) => (
                <li key={`${row.name}-${i}`}>
                  {row.ok ? (
                    <>
                      <strong>{row.name}</strong> — {row.sections} section
                      {row.sections === 1 ? "" : "s"}
                    </>
                  ) : (
                    <>
                      <strong>{row.name}</strong> — failed
                      {row.error ? ` (${row.error})` : ""}
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </Modal>
      );
    }

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

    if (picker.type === "hero-suggest") {
      const breakdown = boardStats.slots[picker.slotIndex];
      const slot = board.slots[picker.slotIndex];
      const hero = breakdown?.hero;
      const analysis = analyzeHeroSuggestions(
        breakdown,
        slot,
        suggestBoardContext(board, boardStats, picker.slotIndex)
      );
      return (
        <Modal
          title={
            hero
              ? `${hero.name} · Suggest`
              : `${slotTitle(picker.slotIndex)} · Suggest`
          }
          onClose={() => setPicker(null)}
          className="sc-modal-suggest"
        >
          <div className="sc-suggest-lead">
            <p className="muted sc-modal-lead">
              Role-aware cap advisor (DD / support / CC). Precision 150, Crit
              Damage 150, DR 75 still apply. Soft waste still helps vs Block on
              DDs.
            </p>
            <HelpTip
              title="Suggest algorithm"
              message="Opens Too much / Need more / Suggested changes for this hero, weighted by role. Recommendations are hints only — change imprint, enable, or stone yourself (not artifacts)."
              steps={[
                "Role line shows Damage dealer, Support, and/or CC for this hero.",
                "Too much lists stats past caps (or unused offense on supports), with sources.",
                "Need more lists role-weighted floors (supports prioritize Energy 50+) and missing amounts.",
                "Suggested changes ranks imprint / enable / stone swaps — artifacts are skipped (ability-first).",
                "Energy / round notes how starting Energy interacts with Round 1.",
                "Tap Advanced for roles, caps, and scoring math.",
              ]}
              advanced={SUGGEST_HELP_ADVANCED}
            />
          </div>
          <HeroSuggestPanel analysis={analysis} />
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

      if (def?.id === "artifact") {
        const selected = board.slots[picker.slotIndex].gear[picker.listIndex];
        const choices = gearOptionsForSlot(picker.listIndex);
        return (
          <Modal
            title={`${slotTitle(picker.slotIndex)} · Artifact`}
            onClose={() => setPicker(null)}
          >
            <p className="muted sc-modal-lead">
              Pick an artifact. Speed and Energy are flat; other stats are %.
            </p>
            <div className="sc-pick-panel">
              <div className="sc-pick-grid sc-pick-grid-artifact">
                {choices.map((item) => {
                  const on = item.id === selected;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`sc-pick sc-pick-artifact${on ? " selected" : ""}`}
                      title={
                        item.stats?.length
                          ? `${item.name} · ${formatGearStats(item.stats)}`
                          : item.name
                      }
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
                      <img src={item.icon} alt="" className="sc-pick-artifact-icon" />
                      <span className="sc-pick-title">{item.name}</span>
                      {item.stats?.length ? (
                        <StatLines stats={item.stats} compact />
                      ) : null}
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
      const slot = board.slots[picker.slotIndex];
      const progress = slot.progress || defaultHeroProgress();
      const selected = slot.enables[picker.listIndex];
      const choices = enableOptionsForSlot(
        picker.listIndex,
        progress.infusion
      );
      return (
        <Modal
          title={`${slotTitle(picker.slotIndex)} · Enable ${picker.listIndex + 1}`}
          onClose={() => setPicker(null)}
        >
          <p className="muted sc-modal-lead">
            Pick one icon for this enable. Stats scale with infusion (Enable 1
            at 1/2/4, Enable 4 at 10/11; Enable 5 · D at{" "}
            {ENABLE_5D_UNLOCK_INFUSION}+).
            {picker.listIndex === 0 || picker.listIndex === 3
              ? " Enable 1/4 · A All DR only counts when a game mode is selected."
              : ""}
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
                {item.stats?.length ? (
                  <span className="sc-pick-meta">
                    <StatLines stats={item.stats} compact />
                  </span>
                ) : null}
              </>
            )}
          />
        </Modal>
      );
    }

    if (picker.type === "imprint") {
      const slot = board.slots[picker.slotIndex];
      const progress = slot.progress || defaultHeroProgress();
      if (!imprintUnlocked(progress.stageId, picker.listIndex)) {
        return (
          <Modal
            title={`${slotTitle(picker.slotIndex)} · Imprint ${picker.listIndex + 1}`}
            onClose={() => setPicker(null)}
          >
            <p className="muted sc-modal-lead">
              This imprint unlocks at{" "}
              {IMPRINT_UNLOCK_STAGES[picker.listIndex]}. Raise the hero stage
              to use it.
            </p>
            <div className="row-actions sc-pick-actions">
              <button
                className="gold-btn"
                type="button"
                onClick={() => setPicker(null)}
              >
                Close
              </button>
            </div>
          </Modal>
        );
      }
      const selected = slot.imprints[picker.listIndex];
      const usedElsewhere = new Set(
        slot.imprints.filter(
          (id, index) =>
            id &&
            index !== picker.listIndex &&
            imprintUnlocked(progress.stageId, index)
        )
      );
      return (
        <Modal
          title={`${slotTitle(picker.slotIndex)} · Imprint ${picker.listIndex + 1}`}
          onClose={() => setPicker(null)}
        >
          <p className="muted sc-modal-lead">
            Choose 3 of 10. You cannot pick the same imprint twice on one hero.
            Slot 1 unlocks at V1, slot 2 at V2, slot 3 at V3.
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
      const locked = stageLocksOptionals(stageId);
      const currentOptionals = resolvedStageOptionals(
        stageId,
        picker.optionals || progress.optionals
      );
      const stageGroups = [
        { id: "E", title: "E" },
        { id: "V", title: "Void" },
        { id: "T", title: "Transcendence" },
        { id: "D", title: "Destiny" },
      ];
      return (
        <Modal
          title={`${slotTitle(picker.slotIndex)} · Hero stage`}
          onClose={() => setPicker(null)}
        >
          <p className="muted sc-modal-lead">
            E5 → V1–V4 → T1–T5 → D1–D6. Temple +levels are not used here.
          </p>
          {stageGroups.map((group) => (
            <section key={group.id} className="sc-stage-group">
              <h4>{group.title}</h4>
              <div className="hero-stage-picks">
                {HERO_STAGE_OPTIONS.filter((row) => row.group === group.id).map(
                  (row) => {
                    const selected = row.id === stageId;
                    return (
                      <button
                        key={row.id}
                        type="button"
                        className={`hero-stage-pick${selected ? " selected" : ""}`}
                        onClick={() =>
                          setPicker({
                            ...picker,
                            stageId: row.id,
                            optionals: resolvedStageOptionals(
                              row.id,
                              picker.optionals || progress.optionals
                            ),
                          })
                        }
                      >
                        <HeroStageBadge stageId={row.id} templeLevel={1} />
                        <span>{row.label}</span>
                      </button>
                    );
                  }
                )}
              </div>
            </section>
          ))}
          {optionals.length ? (
            <section className="sc-stage-optionals">
              <h4>Core &amp; skill subs</h4>
              <p className="muted">
                {locked
                  ? "Destiny needs the core and all skill subs — selected by default."
                  : "Only for T / D stages. Shown here in the popup, not on the card."}
              </p>
              <div className="sc-optional-grid">
                {optionals.map((item) => {
                  const on = Boolean(currentOptionals[item.id]);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`sc-optional-chip${on ? " selected" : ""}`}
                      disabled={locked}
                      onClick={() => {
                        if (locked) return;
                        setPicker({
                          ...picker,
                          stageId,
                          optionals: {
                            ...currentOptionals,
                            [item.id]: !on,
                          },
                        });
                      }}
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
                patchProgress(picker.slotIndex, {
                  stageId,
                  optionals: resolvedStageOptionals(stageId, currentOptionals),
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
      const current = clampIntField(
        picker.value ?? progress.infusion,
        INFUSION_MIN,
        INFUSION_MAX,
        progress.infusion
      );
      const unlocked = current >= INFUSION_UNLOCK_LEVEL;
      const budget = infusionPointBudget(current);
      const selectedCount = (progress.infusionNodes || []).length;
      return (
        <Modal
          title={`${slotTitle(picker.slotIndex)} · Infusion`}
          onClose={() => setPicker(null)}
        >
          <p className="muted sc-modal-lead">
            Set infusion level 0–60. Map unlocks at {INFUSION_UNLOCK_LEVEL}+.
            Levels {INFUSION_UNLOCK_LEVEL}–30 give 1 point each; 31–
            {INFUSION_POINT_CAP_LEVEL} give 3 each (now {budget} point
            {budget === 1 ? "" : "s"}).
          </p>
          <label className="sc-infusion-field-row">
            <span>Level</span>
            <input
              className="sc-infusion-level-input"
              type="number"
              min={INFUSION_MIN}
              max={INFUSION_MAX}
              value={picker.value ?? progress.infusion}
              onChange={(event) =>
                setPicker({
                  ...picker,
                  value: event.target.value,
                })
              }
            />
          </label>
          <div className="row-actions sc-pick-actions">
            <button
              className="gold-btn"
              type="button"
              onClick={() => {
                const next = clampIntField(
                  picker.value ?? progress.infusion,
                  INFUSION_MIN,
                  INFUSION_MAX,
                  progress.infusion
                );
                const nextBudget = infusionPointBudget(next);
                patchProgress(picker.slotIndex, {
                  infusion: next,
                  infusionNodes: normalizeInfusionNodes(
                    progress.infusionNodes,
                    nextBudget
                  ),
                });
                setPicker(null);
              }}
            >
              Save level
            </button>
          </div>
          <div className="sc-infusion-imprint-block">
            <button
              type="button"
              className={`sc-imprint-infusion-btn${unlocked ? "" : " locked"}`}
              disabled={!unlocked}
              onClick={() => {
                const next = clampIntField(
                  picker.value ?? progress.infusion,
                  INFUSION_MIN,
                  INFUSION_MAX,
                  progress.infusion
                );
                const nextBudget = infusionPointBudget(next);
                const nodes = normalizeInfusionNodes(
                  progress.infusionNodes,
                  nextBudget
                );
                patchProgress(picker.slotIndex, { infusion: next });
                setPicker({
                  type: "imprint-infusion",
                  slotIndex: picker.slotIndex,
                  draftNodes: nodes,
                });
              }}
            >
              Imprint Infusion
            </button>
            <p className="muted">
              {unlocked
                ? `${selectedCount}/${budget} nodes spent`
                : `Greyed out until infusion ${INFUSION_UNLOCK_LEVEL}`}
            </p>
          </div>
        </Modal>
      );
    }

    if (picker.type === "imprint-infusion") {
      const progress =
        board.slots[picker.slotIndex]?.progress || defaultHeroProgress();
      const budget = infusionPointBudget(progress.infusion);
      const draft = normalizeInfusionNodes(
        picker.draftNodes ?? progress.infusionNodes,
        budget
      );
      const selectedSet = new Set(draft);
      const remaining = Math.max(0, budget - draft.length);
      const draftStats = summarizeInfusionStats(draft);
      const mapW = 1120;
      const mapH = 1180;
      return (
        <Modal
          title={`${slotTitle(picker.slotIndex)} · Imprint Infusion`}
          onClose={() => setPicker(null)}
          className="sc-infusion-map-modal"
        >
          <div className="sc-infusion-map-head">
            <p className="muted sc-modal-lead">
              Remaining points: <strong>{remaining}</strong> / {budget} (level{" "}
              {progress.infusion}; 15–30 → 1 pt, 31–{INFUSION_POINT_CAP_LEVEL} →
              3 pts)
            </p>
            <button
              type="button"
              className="tan-btn"
              onClick={() =>
                setPicker({
                  ...picker,
                  draftNodes: [],
                })
              }
            >
              Reset Path
            </button>
          </div>
          <div className="sc-infusion-map-wrap">
            <svg
              className="sc-infusion-map"
              viewBox={`0 0 ${mapW} ${mapH}`}
              role="img"
              aria-label="Imprint Infusion node map"
            >
              <defs>
                <radialGradient id="sc-infusion-space" cx="50%" cy="45%" r="65%">
                  <stop offset="0%" stopColor="#1a3a6a" />
                  <stop offset="55%" stopColor="#0c1a38" />
                  <stop offset="100%" stopColor="#050a18" />
                </radialGradient>
              </defs>
              <rect width={mapW} height={mapH} fill="url(#sc-infusion-space)" />
              {Array.from({ length: 40 }, (_, i) => (
                <circle
                  key={i}
                  cx={(i * 97) % mapW}
                  cy={(i * 173) % mapH}
                  r={i % 5 === 0 ? 1.6 : 1}
                  fill="rgba(255,255,255,0.35)"
                />
              ))}
              {INFUSION_EDGES.map((edge) => {
                const from = INFUSION_NODE_BY_ID[edge.from];
                const to = INFUSION_NODE_BY_ID[edge.to];
                if (!from || !to) return null;
                const lit =
                  selectedSet.has(edge.from) && selectedSet.has(edge.to);
                const color = BRANCH_META[to.branch]?.color || "#8899aa";
                return (
                  <line
                    key={`${edge.from}-${edge.to}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={lit ? color : "rgba(180,200,220,0.35)"}
                    strokeWidth={lit ? 4 : 2.25}
                  />
                );
              })}
              {INFUSION_NODES.map((node) => {
                const on = selectedSet.has(node.id);
                const canOn = canSelectInfusionNode(
                  selectedSet,
                  node.id,
                  budget
                );
                const color = BRANCH_META[node.branch]?.color || "#8899aa";
                const isRoot = INFUSION_ROOTS.includes(node.id);
                return (
                  <g key={node.id}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isRoot ? (on ? 22 : 18) : on ? 16 : 13}
                      fill={on ? color : isRoot ? "#1a2438" : "#2a3344"}
                      stroke={on ? "#fff6c8" : canOn ? color : "#667788"}
                      strokeWidth={on || isRoot ? 3 : 1.75}
                      className={`sc-infusion-node${on ? " on" : ""}${
                        canOn ? " can" : ""
                      }`}
                      onClick={() => {
                        const next = toggleInfusionNode(draft, node.id, budget);
                        setPicker({
                          ...picker,
                          draftNodes: next,
                        });
                      }}
                      style={{
                        cursor: on || canOn ? "pointer" : "default",
                      }}
                    >
                      <title>
                        {isRoot
                          ? `${BRANCH_META[node.branch]?.label || node.branch} start`
                          : infusionNodeTip(node)}
                      </title>
                    </circle>
                    {!on && !isRoot ? (
                      <text
                        x={node.x}
                        y={node.y + 4}
                        textAnchor="middle"
                        fill="#9aa8b8"
                        fontSize="11"
                        pointerEvents="none"
                      >
                        +
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="sc-infusion-stat-summary">
            <h4>Path stats</h4>
            {draftStats.length ? (
              <ul>
                {draftStats.map((row) => (
                  <li key={`${row.stat}|${row.unit}`}>
                    {formatInfusionStatLine(row)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No leaf stats selected yet.</p>
            )}
          </div>
          <div className="row-actions sc-pick-actions">
            <button
              className="tan-btn"
              type="button"
              onClick={() =>
                setPicker({
                  type: "hero-infusion",
                  slotIndex: picker.slotIndex,
                  value: progress.infusion,
                })
              }
            >
              Back
            </button>
            <button
              className="gold-btn"
              type="button"
              onClick={() => {
                patchProgress(picker.slotIndex, { infusionNodes: draft });
                setPicker(null);
              }}
            >
              Save path
            </button>
          </div>
        </Modal>
      );
    }

    if (picker.type === "guild-tech") {
      const classId = picker.classId || "Warrior";
      const def = GUILD_TECH_CLASS_BY_ID[classId];
      const guildTech = normalizeGuildTech(board.guildTech);
      return (
        <Modal
          title={`Guild Tech · ${def?.name || classId}`}
          onClose={() => setPicker(null)}
          className="sc-gt-modal"
        >
          <p className="muted sc-modal-lead">
            Nodes start maxed. Tap a node to turn it on or off. Applies to every
            hero of this class (outside game modes too).
          </p>
          <div className="sc-gt-class-tabs">
            {GUILD_TECH_CLASSES.map((row) => (
              <button
                key={row.id}
                type="button"
                className={`sc-gt-class-tab${
                  row.id === classId ? " selected" : ""
                }`}
                style={{ "--gt-color": row.color }}
                onClick={() =>
                  setPicker({ type: "guild-tech", classId: row.id })
                }
              >
                <img src={row.icon} alt="" />
                <span>{row.name}</span>
              </button>
            ))}
          </div>
          <GuildTechTree
            classId={classId}
            guildTech={guildTech}
            onToggle={(nodeId) =>
              updateBoard({
                ...board,
                guildTech: toggleGuildTechNode(guildTech, classId, nodeId),
              })
            }
          />
        </Modal>
      );
    }

    if (picker.type === "starspawn") {
      const spawnId = picker.spawnId;
      const def = starspawnOf(spawnId);
      const starspawns = normalizeStarspawns(board.starspawns);
      const entry = starspawns[spawnId];
      if (!def || !entry) return null;
      const enabled = Boolean(entry.enabled);
      const bonusPct = def.bonus?.percent ?? 50;
      return (
        <Modal
          title={def.name}
          onClose={() => setPicker(null)}
          className="sc-starspawn-modal"
          footer={
            <button
              type="button"
              className={`sc-ss-toggle${enabled ? " on" : ""}`}
              onClick={() =>
                updateBoard({
                  ...board,
                  starspawns: patchStarspawn(starspawns, spawnId, {
                    enabled: !enabled,
                  }),
                })
              }
            >
              {enabled ? "Leveled up" : "Not leveled up"}
            </button>
          }
        >
          <div className="sc-ss-head">
            <img className="sc-ss-portrait" src={def.icon} alt="" />
            <div className="sc-ss-head-meta">
              <div className="sc-ss-destiny-row">
                <span>Star Destiny</span>
                <button
                  type="button"
                  className="sc-ss-destiny-btn"
                  title="Edit Star Destiny multipliers"
                  onClick={() =>
                    setPicker({ type: "star-destiny", spawnId })
                  }
                >
                  <img src={STAR_DESTINY_ICON} alt="" />
                </button>
              </div>
              <p className="muted sc-ss-bonus">
                Stat Bonus for {def.bonus.label}: +{bonusPct}%
              </p>
            </div>
          </div>
          <div className="sc-ss-stat-list">
            {def.stats.map((stat) => {
              const key = `${stat.stat}|${stat.unit || ""}`;
              const base = entry.values[key] ?? stat.value;
              const destiny = entry.destiny[key] ?? 100;
              const effective = starspawnEffectiveValue(base, destiny);
              return (
                <div key={key} className="sc-ss-stat-row">
                  <label className="sc-ss-stat-label">{stat.stat}</label>
                  <div className="sc-ss-stat-flow">
                    <input
                      type="number"
                      className="sc-ss-stat-input"
                      min={0}
                      max={stat.value}
                      step={stat.unit === "%" ? 0.1 : 1}
                      value={base}
                      disabled={!enabled}
                      onChange={(e) =>
                        updateBoard({
                          ...board,
                          starspawns: patchStarspawn(starspawns, spawnId, {
                            values: { [key]: e.target.value },
                          }),
                        })
                      }
                    />
                    <span className="sc-ss-unit">
                      {stat.unit === "%" ? "%" : ""}
                    </span>
                    <span className="sc-ss-arrow" aria-hidden>
                      →
                    </span>
                    <strong className="sc-ss-effective">
                      {formatStarspawnStatValue(effective, stat.unit)}
                    </strong>
                    <span className="muted sc-ss-mult">×{destiny}%</span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="muted sc-modal-lead">
            Stats start at max. Lower a value anytime. Star Destiny multiplies
            each stat (150% turns 12% into 18%). Off by default until leveled
            up.
          </p>
        </Modal>
      );
    }

    if (picker.type === "sigil") {
      // Use picker.draft as-is while editing — do not re-normalize every render
      // (that was wiping Speed when unit encoding was wrong).
      const draft = picker.draft || createSigilDraft();
      const rarity = sigilRarityOf(draft.rarity);
      const slots = statSlotsForRarity(draft.rarity);
      const mode = gameModeOf(draft.gameModeId);
      const showStatPick =
        draft.rarity === "purple" ||
        draft.rarity === "green" ||
        draft.rarity === "red" ||
        draft.rarity === "blue" ||
        draft.rarity === "yellow";
      const canSave =
        Boolean(draft.gameModeId) &&
        (draft.stats || [])
          .slice(0, slots)
          .every((s) => s.stat && Number(s.value) > 0);

      const patchDraft = (patch) => {
        let next = { ...draft, ...patch };
        if (patch.rarity) {
          const n = statSlotsForRarity(patch.rarity);
          next.stats = Array.from({ length: n }, (_, i) =>
            next.stats?.[i]
              ? { ...next.stats[i] }
              : { stat: "", unit: "%", value: 0 }
          );
        }
        setPicker({ type: "sigil", draft: next });
      };

      return (
        <Modal
          title={picker.draft?.id ? "Edit sigil" : "Add sigil"}
          onClose={() => setPicker(null)}
          className="sc-sigil-modal"
          footer={
            <>
              {picker.draft?.id ? (
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => {
                    updateBoard({
                      ...board,
                      sigils: removeSigil(board.sigils, draft.id),
                    });
                    setPicker(null);
                  }}
                >
                  Delete
                </button>
              ) : null}
              <button
                type="button"
                className="gold-btn"
                disabled={!canSave}
                onClick={() => {
                  updateBoard({
                    ...board,
                    sigils: upsertSigil(board.sigils, draft),
                  });
                  setPicker(null);
                }}
              >
                Save
              </button>
            </>
          }
        >
          <p className="muted sc-modal-lead">
            One sigil per game mode. Pick rarity, then stats and values. It only
            counts when that game mode is selected on the board.
          </p>

          <h4 className="sc-sigil-section-title">Game mode</h4>
          <div className="sc-sigil-mode-grid">
            {GAME_MODES.map((gm) => {
              const existing = normalizeSigils(board.sigils).find(
                (s) => s.gameModeId === gm.id
              );
              const selected = draft.gameModeId === gm.id;
              const takenByOther =
                Boolean(existing) && existing.id !== draft.id;
              return (
                <button
                  key={gm.id}
                  type="button"
                  className={`sc-sigil-mode-btn${
                    selected ? " selected" : ""
                  }${takenByOther ? " taken" : ""}`}
                  title={
                    takenByOther
                      ? `${gm.name} (has a sigil — tap to edit)`
                      : gm.name
                  }
                  onClick={() => {
                    if (takenByOther) {
                      setPicker({
                        type: "sigil",
                        draft: createSigilDraft(existing),
                      });
                      return;
                    }
                    patchDraft({ gameModeId: gm.id });
                  }}
                >
                  <img src={gm.icon} alt="" />
                  <span>{gm.name}</span>
                </button>
              );
            })}
          </div>

          <h4 className="sc-sigil-section-title">Rarity</h4>
          <div className="sc-sigil-rarity-row">
            {SIGIL_RARITIES.map((row) => (
              <button
                key={row.id}
                type="button"
                className={`sc-sigil-rarity-btn${
                  draft.rarity === row.id ? " selected" : ""
                }`}
                style={{ "--sigil-border": row.border, "--sigil-color": row.color }}
                onClick={() => patchDraft({ rarity: row.id })}
              >
                {row.name}
              </button>
            ))}
          </div>

          {showStatPick ? (
            <>
              <h4 className="sc-sigil-section-title">
                Stats{rarity?.statSlots === 2 ? " (2)" : ""}
              </h4>
              {Array.from({ length: slots }, (_, index) => {
                const slot = (draft.stats && draft.stats[index]) || {
                  stat: "",
                  unit: "%",
                  value: 0,
                };
                const unit =
                  sigilStatOptionOf(slot.stat)?.unit ??
                  (slot.unit === "" ? "" : "%");
                return (
                  <div key={index} className="sc-sigil-stat-block">
                    <label className="sc-sigil-stat-label">
                      Stat {slots > 1 ? index + 1 : ""}
                    </label>
                    <select
                      className="sc-sigil-select"
                      value={slot.stat || ""}
                      onChange={(e) => {
                        const opt = sigilStatOptionOf(e.target.value);
                        const base = Array.isArray(draft.stats)
                          ? draft.stats
                          : [];
                        const stats = Array.from({ length: slots }, (_, i) => {
                          const cur = base[i] || {
                            stat: "",
                            unit: "%",
                            value: 0,
                          };
                          if (i !== index) return cur;
                          return {
                            ...cur,
                            stat: opt?.stat || "",
                            unit: opt ? opt.unit : "%",
                          };
                        });
                        patchDraft({ stats });
                      }}
                    >
                      <option value="">Select stat…</option>
                      {SIGIL_STAT_OPTIONS.map((opt) => (
                        <option key={opt.stat} value={opt.stat}>
                          {opt.stat}
                          {opt.unit === "%" ? " %" : ""}
                        </option>
                      ))}
                    </select>
                    <label className="sc-sigil-stat-label">Value</label>
                    <div className="sc-sigil-value-row">
                      <input
                        type="number"
                        className="sc-sigil-value-input"
                        min={0}
                        max={999}
                        step={unit === "%" ? 0.1 : 1}
                        value={slot.value || ""}
                        onChange={(e) => {
                          const base = Array.isArray(draft.stats)
                            ? draft.stats
                            : [];
                          const stats = Array.from(
                            { length: slots },
                            (_, i) => {
                              const cur = base[i] || {
                                stat: "",
                                unit: "%",
                                value: 0,
                              };
                              if (i !== index) return cur;
                              return { ...cur, value: e.target.value };
                            }
                          );
                          patchDraft({ stats });
                        }}
                      />
                      <span>{unit === "%" ? "%" : ""}</span>
                    </div>
                  </div>
                );
              })}
            </>
          ) : null}

          {mode ? (
            <p className="muted sc-sigil-preview">
              Active in <strong>{mode.name}</strong>
              {rarity ? (
                <>
                  {" "}
                  · <strong style={{ color: rarity.color }}>{rarity.name}</strong>
                </>
              ) : null}
            </p>
          ) : null}
        </Modal>
      );
    }

    if (picker.type === "star-destiny") {
      const spawnId = picker.spawnId;
      const def = starspawnOf(spawnId);
      const starspawns = normalizeStarspawns(board.starspawns);
      const entry = starspawns[spawnId];
      if (!def || !entry) return null;
      return (
        <Modal
          title={`Star Destiny · ${def.name}`}
          onClose={() => setPicker({ type: "starspawn", spawnId })}
          className="sc-starspawn-modal"
        >
          <p className="muted sc-modal-lead">
            One multiplier per stat (percent). 100% = no change. Example: 12%
            base × 150% → 18%.
          </p>
          <div className="sc-ss-stat-list">
            {def.stats.map((stat) => {
              const key = `${stat.stat}|${stat.unit || ""}`;
              const destiny = entry.destiny[key] ?? 100;
              return (
                <div key={key} className="sc-ss-stat-row">
                  <label className="sc-ss-stat-label">{stat.stat}</label>
                  <div className="sc-ss-stat-flow">
                    <input
                      type="number"
                      className="sc-ss-stat-input"
                      min={0}
                      step={1}
                      value={destiny}
                      onChange={(e) =>
                        updateBoard({
                          ...board,
                          starspawns: patchStarspawn(starspawns, spawnId, {
                            destiny: { [key]: e.target.value },
                          }),
                        })
                      }
                    />
                    <span className="sc-ss-unit">%</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="sc-modal-actions">
            <button
              className="gold-btn"
              type="button"
              onClick={() => setPicker({ type: "starspawn", spawnId })}
            >
              Done
            </button>
          </div>
        </Modal>
      );
    }

    if (picker.type === "game-mode") {
      const selected = picker.draft ?? board.gameModeId ?? null;
      return (
        <Modal title="Select game mode" onClose={() => setPicker(null)}>
          <p className="muted sc-modal-lead">
            Monster, Team Aura, and Cloud Island only count when a mode is
            selected. More mode-only buffs can plug in later.
          </p>
          <PickGrid
            items={[
              { id: "none", name: "No game mode", icon: null },
              ...GAME_MODES,
            ]}
            selectedId={selected || "none"}
            gridClassName="sc-pick-grid-game-modes"
            onPick={(id) => {
              updateBoard({
                ...board,
                gameModeId: id === "none" ? null : id,
              });
              setPicker(null);
            }}
            onClear={() => {
              updateBoard({ ...board, gameModeId: null });
              setPicker(null);
            }}
            renderItem={(item) => (
              <>
                {item.icon ? (
                  <img src={item.icon} alt="" className="sc-pick-game-mode" />
                ) : (
                  <span className="sc-pick-game-mode empty">—</span>
                )}
                <span className="sc-pick-title">{item.name}</span>
              </>
            )}
          />
        </Modal>
      );
    }

    if (picker.type === "tenants") {
      const slot = board.slots[picker.slotIndex];
      const draft = normalizeTenants(picker.draft ?? slot?.tenants);
      const totalSpeed = tenantSpeedFromLevels(draft);
      const hero = heroOf(slot?.heroId);
      return (
        <Modal
          title={`${slotTitle(picker.slotIndex)}${
            hero ? ` · ${hero.name}` : ""
          } · Tenants`}
          onClose={() => setPicker(null)}
        >
          <p className="muted sc-modal-lead">
            Per-hero houses · levels 0–{TENANT_HOUSE_MAX}. Odd levels grant +1
            Speed (lv 1 → +1, lv 2 → +1, lv 3 → +2; now +{totalSpeed} Spd
            total).
          </p>
          <div className="sc-building-row">
            {TENANT_HOUSES.map((house, index) => (
              <div key={house.id} className="sc-building-card">
                <label className="sc-building-level">
                  <span>Lv</span>
                  <input
                    type="number"
                    min={0}
                    max={TENANT_HOUSE_MAX}
                    value={draft[index]}
                    onChange={(event) => {
                      const next = [...draft];
                      next[index] = clampIntField(
                        event.target.value,
                        0,
                        TENANT_HOUSE_MAX,
                        draft[index]
                      );
                      setPicker({ ...picker, draft: next });
                    }}
                  />
                </label>
                <img src={house.icon} alt="" className="sc-building-icon" />
                <span className="sc-building-spd">
                  +{tenantSpeedFromLevel(draft[index])} Spd
                </span>
              </div>
            ))}
          </div>
          <div className="row-actions sc-pick-actions">
            <button
              className="tan-btn"
              type="button"
              onClick={() =>
                setPicker({ ...picker, draft: defaultTenants() })
              }
            >
              Reset
            </button>
            <button
              className="gold-btn"
              type="button"
              onClick={() => {
                updateBoard(
                  patchSlot(board, picker.slotIndex, {
                    tenants: normalizeTenants(draft),
                  })
                );
                setPicker(null);
              }}
            >
              Save
            </button>
          </div>
        </Modal>
      );
    }

    if (picker.type === "cloud-island") {
      const draft = normalizeCloudIsland(picker.draft ?? board.cloudIsland);
      return (
        <Modal title="Cloud Island" onClose={() => setPicker(null)}>
          <p className="muted sc-modal-lead">
            Levels 0–{CLOUD_BUILDING_MAX} (default {CLOUD_BUILDING_MAX}). Each
            level gives +{CLOUD_SPEED_PER_LEVEL} Speed to matching factions.
          </p>
          <div className="sc-building-row">
            {CLOUD_BUILDINGS.map((building, index) => {
              const factions = factionIconsFor(building.factions);
              const spd = draft[index] * CLOUD_SPEED_PER_LEVEL;
              return (
                <div key={building.id} className="sc-building-card">
                  <label className="sc-building-level">
                    <span>Lv</span>
                    <input
                      type="number"
                      min={0}
                      max={CLOUD_BUILDING_MAX}
                      value={draft[index]}
                      onChange={(event) => {
                        const next = [...draft];
                        next[index] = clampIntField(
                          event.target.value,
                          0,
                          CLOUD_BUILDING_MAX,
                          draft[index]
                        );
                        setPicker({ ...picker, draft: next });
                      }}
                    />
                  </label>
                  <div className="sc-building-factions">
                    {factions.map((faction) => (
                      <img
                        key={faction.id}
                        src={faction.icon}
                        alt={faction.name}
                        title={faction.name}
                      />
                    ))}
                  </div>
                  <img
                    src={building.icon}
                    alt=""
                    className="sc-building-icon"
                  />
                  <span className="sc-building-spd">+{spd} Spd</span>
                </div>
              );
            })}
          </div>
          <div className="row-actions sc-pick-actions">
            <button
              className="tan-btn"
              type="button"
              onClick={() =>
                setPicker({ ...picker, draft: defaultCloudIsland() })
              }
            >
              Max
            </button>
            <button
              className="gold-btn"
              type="button"
              onClick={() => {
                updateBoard({
                  ...board,
                  cloudIsland: normalizeCloudIsland(draft),
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

    if (picker.type === "skin") {
      const slot = board.slots[picker.slotIndex];
      const hero = heroOf(slot?.heroId);
      const draft = normalizeSkin(picker.draft ?? slot?.skin);
      const levelMeta = skinLevelOf(draft.level);
      const options = skinsForHero(slot?.heroId);
      const selected = skinOf(draft.skinId);
      const selectedForHero =
        selected && selected.heroId === slot?.heroId ? selected : null;
      const statLines = selectedForHero
        ? selectedForHero.stats
            .map((id) => formatSkinStatLine(id, draft.level, slot?.heroId))
            .filter(Boolean)
        : [];

      return (
        <Modal
          title={`${slotTitle(picker.slotIndex)} · Skin`}
          onClose={() => setPicker(null)}
          className={`sc-skin-modal sc-skin-modal--${levelMeta.tone}`}
        >
          <div className={`sc-skin-frame sc-skin-frame--${levelMeta.tone}`}>
            <p className="muted sc-modal-lead">
              Pick a skin for this hero, then set the level.
              {hero ? ` · ${hero.name}` : ""}
            </p>
            <div className="sc-skin-levels">
              {SKIN_LEVELS.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  className={`sc-skin-level-chip sc-skin-level-chip--${row.tone}${
                    row.id === draft.level ? " selected" : ""
                  }`}
                  onClick={() =>
                    setPicker({
                      ...picker,
                      draft: { ...draft, level: row.id },
                    })
                  }
                >
                  Lv {row.id}
                  <span>{row.name}</span>
                </button>
              ))}
            </div>
            {options.length === 0 ? (
              <p className="muted sc-skin-empty">No skins listed for this hero yet.</p>
            ) : (
              <div className="sc-skin-grid">
                {options.map((row) => {
                  const on = draft.skinId === row.id;
                  return (
                    <button
                      key={row.id}
                      type="button"
                      className={`sc-skin-pick${on ? " selected" : ""}`}
                      title={row.name}
                      onClick={() =>
                        setPicker({
                          ...picker,
                          draft: {
                            ...draft,
                            skinId: on ? null : row.id,
                          },
                        })
                      }
                    >
                      <img src={row.icon} alt="" />
                      <span>{row.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="sc-skin-stat-slots">
              {statLines.length > 0 ? (
                statLines.map((line) => (
                  <div key={line.id} className="sc-skin-stat-slot filled">
                    <span className="sc-skin-stat-name">{line.name}</span>
                    <span className="sc-skin-stat-value">{line.label}</span>
                  </div>
                ))
              ) : (
                <div className="sc-skin-stat-slot">
                  <span className="sc-skin-stat-empty">Select a skin</span>
                </div>
              )}
            </div>
          </div>
          <div className="row-actions sc-pick-actions">
            <button
              className="tan-btn"
              type="button"
              onClick={() => setPicker({ ...picker, draft: defaultSkin() })}
            >
              Clear
            </button>
            <button
              className="gold-btn"
              type="button"
              onClick={() => {
                updateBoard(
                  patchSlot(board, picker.slotIndex, {
                    skin: normalizeSkin(draft),
                  })
                );
                setPicker(null);
              }}
            >
              Save
            </button>
          </div>
        </Modal>
      );
    }

    if (picker.type === "hero-awakening") {
      const progress =
        board.slots[picker.slotIndex]?.progress || defaultHeroProgress();
      const draft = picker.draft || awakenDraftFromProgress(progress.awakening);
      const panel = picker.panel || "summary";
      const tierId = draft.tierId;
      const tierMeta = AWAKENING_TIERS.find((row) => row.id === tierId);
      const speedSpan = awakeningSpeedRange(tierId);
      const needStats = awakeningStatCount(tierId);
      const pool = awakeningStatPool(tierId);
      const picked = Array.from(
        { length: needStats },
        (_, i) => draft.stats?.[i] || null
      );

      if (panel === "tier") {
        return (
          <Modal
            title={`${slotTitle(picker.slotIndex)} · Awakening tier`}
            onClose={() =>
              setPicker({
                ...picker,
                panel: "summary",
              })
            }
          >
            <p className="muted sc-modal-lead">Pick copy rank E−…X.</p>
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
                      panel: "summary",
                      draft: next,
                    });
                  }}
                >
                  {row.label}
                </button>
              ))}
            </div>
            <div className="row-actions sc-pick-actions">
              <button
                className="tan-btn"
                type="button"
                onClick={() =>
                  setPicker({
                    ...picker,
                    panel: "summary",
                  })
                }
              >
                Back
              </button>
            </div>
          </Modal>
        );
      }

      if (panel === "stat") {
        const statIndex = Math.min(
          Math.max(0, Number(picker.statIndex) || 0),
          Math.max(0, needStats - 1)
        );
        return (
          <Modal
            title={`${slotTitle(picker.slotIndex)} · Stat ${statIndex + 1}`}
            onClose={() =>
              setPicker({
                ...picker,
                panel: "summary",
                statIndex: undefined,
              })
            }
          >
            <p className="muted sc-modal-lead">
              Choose stat {statIndex + 1} of {needStats} for {tierId}.
            </p>
            <div className="sc-awaken-stat-list">
              {pool.map((name) => {
                const usedElsewhere = picked.some(
                  (id, i) => id === name && i !== statIndex
                );
                const on = picked[statIndex] === name;
                const value = awakeningStatValue(tierId, name);
                return (
                  <button
                    key={name}
                    type="button"
                    className={`sc-awaken-stat${on ? " selected" : ""}`}
                    disabled={usedElsewhere}
                    onClick={() => {
                      const nextStats = [...picked];
                      nextStats[statIndex] = name;
                      setPicker({
                        type: "hero-awakening",
                        slotIndex: picker.slotIndex,
                        panel: "summary",
                        draft: { ...draft, stats: nextStats },
                      });
                    }}
                  >
                    {name}
                    {value != null ? (
                      <span className="sc-awaken-stat-value">+{value}%</span>
                    ) : null}
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
                    ...picker,
                    panel: "summary",
                    statIndex: undefined,
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
          title={`${slotTitle(picker.slotIndex)} · Awakening`}
          onClose={() => setPicker(null)}
        >
          <p className="muted sc-modal-lead">
            Tap Awakening to pick the tier, edit Speed, then tap each stat to
            choose from its pool.
          </p>
          <div className="sc-awaken-summary">
            <button
              type="button"
              className="sc-awaken-summary-row"
              onClick={() =>
                setPicker({
                  type: "hero-awakening",
                  slotIndex: picker.slotIndex,
                  panel: "tier",
                  draft,
                })
              }
            >
              <span className="sc-awaken-summary-label">Awakening</span>
              <span
                className="sc-awaken-summary-value"
                style={{ color: tierMeta?.color || undefined }}
              >
                {tierId}
              </span>
            </button>

            <label className="sc-awaken-summary-row sc-awaken-speed-row">
              <span className="sc-awaken-summary-label">Speed</span>
              <input
                className="sc-awaken-speed-input"
                type="number"
                min={speedSpan.min}
                max={speedSpan.max}
                value={
                  picker.speedText != null
                    ? picker.speedText
                    : (draft.speed ?? speedSpan.min)
                }
                onChange={(event) => {
                  setPicker({
                    ...picker,
                    panel: "summary",
                    speedText: event.target.value,
                    draft: { ...draft, speed: event.target.value },
                  });
                }}
                onBlur={() => {
                  const nextSpeed = clampAwakenSpeed(
                    tierId,
                    picker.speedText ?? draft.speed
                  );
                  setPicker({
                    ...picker,
                    panel: "summary",
                    speedText: undefined,
                    draft: { ...draft, speed: nextSpeed },
                  });
                }}
              />
              <span className="muted sc-awaken-speed-hint">
                {speedSpan.min}–{speedSpan.max}
              </span>
            </label>

            {Array.from({ length: needStats }, (_, i) => (
              <button
                key={i}
                type="button"
                className="sc-awaken-summary-row"
                onClick={() =>
                  setPicker({
                    type: "hero-awakening",
                    slotIndex: picker.slotIndex,
                    panel: "stat",
                    statIndex: i,
                    draft,
                  })
                }
              >
                <span className="sc-awaken-summary-label">Stat {i + 1}</span>
                <span className="sc-awaken-summary-value">
                  {picked[i]
                    ? (() => {
                        const value = awakeningStatValue(tierId, picked[i]);
                        return value != null
                          ? `${picked[i]} +${value}%`
                          : picked[i];
                      })()
                    : "Pick…"}
                </span>
              </button>
            ))}
          </div>
          <div className="row-actions sc-pick-actions">
            {progress.awakening ? (
              <button
                className="tan-btn"
                type="button"
                onClick={() => {
                  patchProgress(picker.slotIndex, { awakening: null });
                  setPicker(null);
                }}
              >
                Clear
              </button>
            ) : null}
            <button
              className="gold-btn"
              type="button"
              onClick={() => {
                const next = {
                  ...draft,
                  speed: clampAwakenSpeed(tierId, draft.speed),
                  stats: picked,
                };
                patchProgress(picker.slotIndex, { awakening: next });
                setPicker(null);
              }}
            >
              Save
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
                  "Under each hero name: stage star, infusion, and awakening. Infusion uses a level field; at 15+ open Imprint Infusion. Map points: 15–30 give 1 each, 31–40 give 3 each.",
                  "Monster icon sits beside Faction Aura. Tap it to pick a monster, then Equip from the detail tab (level, P1–4, runes).",
                  "Each card: tap the portrait to pick a hero, then tap gear squares, enable circles, and imprint circles. Imprints unlock at V1 / V2 / V3 — grey slots stay out of the calc.",
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
            <div className="sc-summary-head-actions">
              <button
                type="button"
                className="sc-summary-stats-toggle"
                onClick={() => setSummaryStatsOpen((open) => !open)}
              >
                {summaryStatsOpen ? "Hide stats" : "Show stats"}
              </button>
              <button
                type="button"
                className="sc-summary-stats-toggle sc-game-mode-btn"
                onClick={() =>
                  setPicker({
                    type: "game-mode",
                    draft: board.gameModeId || null,
                  })
                }
                title="Game mode"
              >
                {board.gameModeId && gameModeOf(board.gameModeId) ? (
                  <>
                    <img
                      src={gameModeOf(board.gameModeId).icon}
                      alt=""
                      className="sc-game-mode-btn-icon"
                    />
                    <span>{gameModeOf(board.gameModeId).name}</span>
                  </>
                ) : (
                  <span>Select game mode</span>
                )}
              </button>
              <label className="sc-combat-round">
                <select
                  className="sc-summary-stats-toggle sc-combat-round-select"
                  aria-label="Combat round"
                  value={normalizeCombatRound(board.combatRound)}
                  onChange={(e) =>
                    updateBoard({
                      ...board,
                      combatRound: normalizeCombatRound(e.target.value),
                    })
                  }
                  title="Game start = before attacks. Round 1 = after first attack/ability (T2 if Energy ≥ 50, else T3)."
                >
                  {COMBAT_ROUNDS.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="sc-summary-grid">
            {summarySlots.map((row) => {
              const slot = board.slots[row.index];
              const gearFilled = slot.gear.filter(Boolean).length;
              const enableFilled = slot.enables.filter(Boolean).length;
              const stageId = slot.progress?.stageId || "E5";
              const imprintFilled = slot.imprints.filter(
                (id, index) => id && imprintUnlocked(stageId, index)
              ).length;
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
                      <SummaryStatList totals={breakdown.totals} />
                    ) : (
                      <span className="muted">Stats: —</span>
                    )
                  ) : null}
                  {row.hero ? (
                    <div className="sc-summary-card-actions">
                      <button
                        type="button"
                        className="sc-summary-info"
                        onClick={() =>
                          setPicker({
                            type: "hero-stats",
                            slotIndex: row.index,
                          })
                        }
                      >
                        Info
                      </button>
                      <button
                        type="button"
                        className="sc-summary-info sc-summary-suggest"
                        onClick={() =>
                          setPicker({
                            type: "hero-suggest",
                            slotIndex: row.index,
                          })
                        }
                      >
                        Suggest
                      </button>
                    </div>
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
                onSuggest={() =>
                  setPicker({ type: "hero-suggest", slotIndex: index })
                }
                onPickStage={() => {
                  const progress =
                    board.slots[index].progress || defaultHeroProgress();
                  setPicker({
                    type: "hero-stage",
                    slotIndex: index,
                    stageId: progress.stageId || "E5",
                    optionals: resolvedStageOptionals(
                      progress.stageId || "E5",
                      progress.optionals
                    ),
                  });
                }}
                onPickInfusion={() =>
                  setPicker({ type: "hero-infusion", slotIndex: index })
                }
                onPickAwakening={() =>
                  setPicker({
                    type: "hero-awakening",
                    slotIndex: index,
                    panel: "summary",
                    draft: awakenDraftFromProgress(
                      board.slots[index].progress?.awakening
                    ),
                  })
                }
                onPickTenants={() =>
                  setPicker({
                    type: "tenants",
                    slotIndex: index,
                    draft: normalizeTenants(board.slots[index].tenants),
                  })
                }
                onPickCloudIsland={() =>
                  setPicker({
                    type: "cloud-island",
                    draft: normalizeCloudIsland(board.cloudIsland),
                  })
                }
                onPickSkin={() =>
                  setPicker({
                    type: "skin",
                    slotIndex: index,
                    draft: normalizeSkin(board.slots[index].skin),
                  })
                }
              />
            ))}
          </div>

          <section className="sc-guild-tech-card">
            <div className="sc-gt-inline-row">
              <div className="sc-gt-inline-title">
                <h2>Guild Tech</h2>
                <HelpTip message="Per-class guild tech. Tap a class icon to open the skill circle. Nodes are maxed by default — tap to enable/disable. Applies to heroes of that class." />
              </div>
              <div className="sc-gt-class-row">
                {GUILD_TECH_CLASSES.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    className="sc-gt-class-btn"
                    style={{ "--gt-color": row.color }}
                    title={row.name}
                    onClick={() =>
                      setPicker({ type: "guild-tech", classId: row.id })
                    }
                  >
                    <img src={row.icon} alt="" />
                    <span>{row.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="sc-starspawn-card">
            <div className="calc-row-head">
              <h2>Starspawns</h2>
              <HelpTip message="Board-wide starspawn buffs. Spirits start off — level one up in its popup. Edit base values and Star Destiny multipliers there. Matching faction/class heroes get the spirit’s bonus percent." />
            </div>
            <div className="sc-starspawn-grid">
              {STARSPAWNS.map((row) => {
                const entry = normalizeStarspawns(board.starspawns)[row.id];
                const on = Boolean(entry?.enabled);
                return (
                  <button
                    key={row.id}
                    type="button"
                    className={`sc-starspawn-btn${on ? "" : " off"}`}
                    title={row.name}
                    onClick={() =>
                      setPicker({ type: "starspawn", spawnId: row.id })
                    }
                  >
                    <img src={row.icon} alt="" />
                    <span>{row.name.replace(/^Spirit of /, "")}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="sc-sigil-card">
            <div className="calc-row-head sc-sigil-head">
              <div className="sc-sigil-head-title">
                <h2>Sigils</h2>
                <HelpTip message="One sigil per game mode. Blue / yellow / purple / green have 1 stat; red has 2. Stats only apply when that game mode is selected on the board." />
              </div>
              <button
                type="button"
                className="sc-sigil-add"
                title="Add sigil"
                onClick={() =>
                  setPicker({ type: "sigil", draft: createSigilDraft() })
                }
              >
                +
              </button>
            </div>
            <div className="sc-sigil-list">
              {normalizeSigils(board.sigils).length === 0 ? (
                <p className="muted sc-sigil-empty">
                  No sigils yet. Tap + to add one for a game mode.
                </p>
              ) : (
                normalizeSigils(board.sigils).map((sigil) => {
                  const rarity = sigilRarityOf(sigil.rarity);
                  const mode = gameModeOf(sigil.gameModeId);
                  const active =
                    Boolean(board.gameModeId) &&
                    board.gameModeId === sigil.gameModeId;
                  return (
                    <button
                      key={sigil.id}
                      type="button"
                      className={`sc-sigil-chip${active ? " active" : ""}`}
                      style={{
                        "--sigil-border": rarity?.border || "#888",
                        "--sigil-color": rarity?.color || "#666",
                      }}
                      onClick={() =>
                        setPicker({
                          type: "sigil",
                          draft: createSigilDraft(sigil),
                        })
                      }
                    >
                      <span className="sc-sigil-chip-icon">
                        {mode ? (
                          <img src={mode.icon} alt="" />
                        ) : (
                          <span className="sc-sigil-chip-missing">?</span>
                        )}
                      </span>
                      <span className="sc-sigil-chip-body">
                        <strong title={mode?.name || "No mode"}>
                          {mode?.name || "No mode"}
                        </strong>
                        <span>
                          {sigil.stats
                            .map((s) => formatSigilStat(s))
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          <section className="sc-train-card">
            <div className="calc-row-head sc-train-head">
              <div className="sc-train-head-title">
                <h2>Train</h2>
                <HelpTip message="Load Train screenshots via paste or folder (multi-select). Basic + matching class/faction always apply; game-mode exclusives only when that mode is selected. Multiple shots merge by exclusive." />
              </div>
              <div className="sc-train-actions">
                <button
                  type="button"
                  className="sc-train-load"
                  disabled={trainOcr?.status === "running"}
                  onClick={() => {
                    setTrainOcr(null);
                    setPicker({ type: "train-load" });
                  }}
                >
                  {trainOcr?.status === "running"
                    ? `Reading… ${trainOcr.fileIndex}/${trainOcr.fileTotal}`
                    : "Load screenshot"}
                </button>
                {train.sections.length > 0 ? (
                  <button
                    type="button"
                    className="ghost-btn sc-train-clear"
                    disabled={trainOcr?.status === "running"}
                    onClick={() =>
                      updateBoard({ ...board, train: clearTrain() })
                    }
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>

            {trainMatrix.rows.length === 0 ? (
              <p className="muted sc-train-empty">
                No Train stats yet. Tap Load screenshot to paste or pick images.
              </p>
            ) : (
              <div className="sc-train-table-wrap">
                <table className="sc-train-table sc-train-table-matrix">
                  <thead>
                    <tr>
                      <th className="sc-train-sticky-col">Exclusive</th>
                      {trainMatrix.columns.map((col) => (
                        <th key={col.key} title={`${col.stat}${col.unit === "%" ? " %" : ""} · in ${col.count}`}>
                          {col.stat}
                          {col.unit === "%" ? "%" : ""}
                        </th>
                      ))}
                      <th aria-label="Remove" />
                    </tr>
                  </thead>
                  <tbody>
                    {trainMatrix.rows.map((row) => (
                      <tr key={row.id}>
                        <th className="sc-train-sticky-col sc-train-exclusive" scope="row">
                          {row.label}
                        </th>
                        {trainMatrix.columns.map((col) => (
                          <td key={col.key} className="sc-train-col-value">
                            {row.values[col.key] || "—"}
                          </td>
                        ))}
                        <td className="sc-train-actions-cell">
                          <button
                            type="button"
                            className="sc-train-remove"
                            title="Remove section"
                            onClick={() =>
                              updateBoard({
                                ...board,
                                train: removeTrainSection(board.train, row.id),
                              })
                            }
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      </div>
      {renderPicker()}
    </div>
  );
}
