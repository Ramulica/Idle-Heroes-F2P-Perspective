import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import HelpTip from "../components/HelpTip.jsx";
import HeroStageBadge from "../components/HeroStageBadge.jsx";
import LootChips from "../components/LootChips.jsx";
import ResourceAmount, { formatResourceAmount } from "../components/ResourceAmount.jsx";
import { formatNumber } from "../rewards";
import auroraIcon from "../assets/hero/aurora.png";
import coreChestIcon from "../assets/hero/core-chest.png";
import cotIcon from "../assets/hero/cot.png";
import essenceIcon from "../assets/hero/essence.png";
import heroIcon from "../assets/hero/placeholder.png";
import spiritVeinIcon from "../assets/hero/spirit-vein.png";
import originIcon from "../assets/rewards/origin.png";
import voidIcon from "../assets/rewards/void.png";
import {
  CORE_CHESTS,
  DT_COSTS,
  DT_UNLOCK_COT,
  DT_UNLOCK_STELLAR,
  STAGES,
  SUB_RESOURCE_EACH,
  SUBS_PER_SKILL,
  T_COSTS,
  T_OPTIONALS,
  TEMPLE_TABLE,
  V_COT,
  V_STELLAR,
  addCosts,
  autoTempleLevel,
  canPlaceStage,
  dtCapLabel,
  eventMatsFromCost,
  heroesForTemplePreset,
  isDtStage,
  isTStage,
  newHero,
  normalizeHeroUpgrade,
  optionalsRequired,
  optionalSummary,
  parseResourceInput,
  resolvedTempleLevel,
  rosterCost,
  stageOf,
  subCosts,
  templeReqLabel,
  templeRow,
  visibleOptionals,
} from "../heroUpgrade";
import {
  calculateSg,
  mergeRewardCounts,
  scaleEventPlan,
} from "../sgCalc";
import { useSgCalc } from "../useSgCalc";

const STAGE_GROUPS = [
  { id: "E", title: "Enablement" },
  { id: "V", title: "Void" },
  { id: "T", title: "Origin tree" },
  { id: "D", title: "Destiny Transition" },
];

const COST_ROWS = [
  {
    key: "cot",
    name: "CoT",
    icon: voidIcon,
    alt: "Crystals of Transcendence",
    matKey: "voidForCot",
    matName: "void mats",
    rate: "1 void = 1250k CoT",
  },
  {
    key: "stellar",
    name: "Stellar",
    icon: cotIcon,
    alt: "Stellar Shards",
    matKey: "voidForStellar",
    matName: "void mats",
    rate: "1 void = 1250k stellar",
  },
  {
    key: "essence",
    name: "Spiritual Essence",
    icon: essenceIcon,
    alt: "Spiritual Essence",
    matKey: "originForEssence",
    matName: "origin mats",
    rate: "1 origin = 150k essence",
  },
  {
    key: "cores",
    name: "Core chests",
    icon: coreChestIcon,
    alt: "Core Chest",
    matKey: "originForCores",
    matName: "origin mats",
    rate: "1 origin = 1 core chest",
  },
  {
    key: "subs",
    name: "Skill subs",
    icon: originIcon,
    alt: "Skill Substitute",
    matKey: "originForSubs",
    matName: "origin mats",
    rate: "1 origin = 1 sub",
  },
  {
    key: "dtMats",
    name: "Divine Aurora",
    icon: auroraIcon,
    alt: "Divine Aurora",
    matKey: "dtForAurora",
    matName: "DT mats",
    rate: "1 DT mat = 5 Aurora",
  },
  {
    key: "spiritVein",
    name: "Spirit Vein",
    icon: spiritVeinIcon,
    alt: "Spirit Vein Shards",
    matKey: "dtForVein",
    matName: "DT mats",
    rate: "1 DT mat = 200k Spirit Vein",
  },
];

function formatMats(value) {
  const amount = Number(value) || 0;
  if (Math.abs(amount - Math.round(amount)) < 0.001) {
    return formatNumber(Math.round(amount));
  }
  return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function MatAmount({ icon, alt, value }) {
  return (
    <span className="hero-mat-amount">
      <img src={icon} alt={alt || ""} className="csg-icon hero-res-icon" />
      <strong>{formatMats(value)}</strong>
    </span>
  );
}

function CostBits({ cost }) {
  const bits = COST_ROWS.filter((row) => Number(cost?.[row.key]) > 0);
  if (!bits.length) return <span className="muted">No event mats</span>;
  return (
    <span className="hero-cost-bits">
      {bits.map((row) => (
        <ResourceAmount
          key={row.key}
          icon={row.icon}
          alt={row.alt}
          value={cost[row.key]}
        />
      ))}
    </span>
  );
}

const T_STEP_IDS = ["T1", "T2", "T3", "T4", "T5", "T120"];
const T_STEP_LABELS = {
  T1: "T1 · lv 20",
  T2: "T2 · lv 40",
  T3: "T3 · lv 60",
  T4: "T4 · lv 80",
  T5: "T5 · lv 100",
  T120: "T max · lv 120",
};

function tStepCost(id, index) {
  const cur = T_COSTS[id];
  const prev = index ? T_COSTS[T_STEP_IDS[index - 1]] : { essence: 0, stellar: 0 };
  return {
    essence: cur.essence - prev.essence,
    stellar: cur.stellar - prev.stellar,
  };
}

function TemplePresetsPanel({ currentLevel, onPick }) {
  return (
    <div className="hero-preset-list">
      <p className="muted">
        Click a temple to set this board’s level and replace its heroes with the
        required Destiny heroes.
      </p>
      {TEMPLE_TABLE.map((row) => (
        <button
          key={row.lvl}
          className={`hero-preset${currentLevel === row.lvl ? " selected" : ""}`}
          type="button"
          onClick={() => onPick(row.lvl)}
        >
          <span className="hero-preset-title">
            Temple {row.lvl} · D+{row.bonus}
          </span>
          <span className="hero-preset-req">{templeReqLabel(row.req)}</span>
          <span className="hero-preset-cap">{dtCapLabel(row.lvl)}</span>
        </button>
      ))}
    </div>
  );
}

function UpgradeCostsPanel() {
  return (
    <div className="help-advanced">
      <article>
        <h4>Event mat rates</h4>
        <p>1 void = 1250k CoT or 1250k stellar</p>
        <p>1 origin = 150k essence, 1 core chest, or 1 skill sub</p>
        <p>1 DT mat = 5 Divine Aurora or 200k Spirit Vein</p>
      </article>
      <article>
        <h4>Enablement</h4>
        <p>E1–E5 costs no event mats.</p>
      </article>
      <article>
        <h4>Void</h4>
        <p>Trans is 5000k CoT once. V1–V4 are stellar only.</p>
        <div className="hero-cost-guide-row">
          <strong>Trans</strong>
          <CostBits cost={{ cot: V_COT }} />
        </div>
        {["V1", "V2", "V3", "V4"].map((id) => (
          <div key={id} className="hero-cost-guide-row">
            <strong>{id}</strong>
            <CostBits cost={{ stellar: V_STELLAR[id] }} />
          </div>
        ))}
      </article>
      <article>
        <h4>Origin tree</h4>
        <p>Essence and stellar extra to go up one Origin tree step after V4.</p>
        {T_STEP_IDS.map((id, index) => (
          <div key={id} className="hero-cost-guide-row">
            <strong>{T_STEP_LABELS[id]}</strong>
            <CostBits cost={tStepCost(id, index)} />
          </div>
        ))}
      </article>
      <article>
        <h4>Core and skill subs</h4>
        <p>
          1 origin pick = 1 skill sub = {formatResourceAmount(SUB_RESOURCE_EACH)}{" "}
          of that sub’s resource. An ability needs 2 picks, so{" "}
          {formatResourceAmount(SUB_RESOURCE_EACH * SUBS_PER_SKILL)}.
        </p>
        {T_OPTIONALS.map((item) => (
          <div key={item.id} className="hero-cost-guide-row">
            <strong>{item.label}</strong>
            <CostBits
              cost={{ cores: item.cores, subs: item.subs }}
            />
          </div>
        ))}
        <p>
          All of them: {CORE_CHESTS} core chests and {SUBS_PER_SKILL * 4} skill
          subs ({formatResourceAmount(SUB_RESOURCE_EACH * SUBS_PER_SKILL * 4)}{" "}
          sub resource). Destiny Transition always includes all of them.
        </p>
      </article>
      <article>
        <h4>Destiny Transition</h4>
        <p>
          T120 already paid the 5m stellar and 14.93m CoT. D1–D6 do not add that
          again — only the extra D rank cost.
        </p>
        <div className="hero-cost-guide-row">
          <strong>T120 · already spent</strong>
          <span className="hero-cost-bits">
            <ResourceAmount
              icon={COST_ROWS.find((row) => row.key === "stellar").icon}
              alt="Stellar Shards"
              value={DT_UNLOCK_STELLAR}
            />
            <ResourceAmount
              icon={COST_ROWS.find((row) => row.key === "cot").icon}
              alt="Crystals of Transcendence"
              value={DT_UNLOCK_COT}
            />
          </span>
        </div>
        {["D1", "D2", "D3", "D4", "D5", "D6"].map((id) => {
          const row = DT_COSTS[id];
          return (
            <div key={id} className="hero-cost-guide-row">
              <strong>{id}</strong>
              <CostBits
                cost={{
                  dtMats: row.dtMats,
                  stellar: row.stellar,
                  spiritVein: row.spiritVein,
                  cot: row.cot,
                }}
              />
            </div>
          );
        })}
      </article>
    </div>
  );
}

function HaveResourceInput({ name, value, onChange }) {
  const [draft, setDraft] = useState(null);
  const shown = draft ?? (value ? formatResourceAmount(value) : "");
  return (
    <input
      className="hero-other-input"
      type="text"
      inputMode="decimal"
      aria-label={`${name} I have`}
      placeholder=""
      value={shown}
      onFocus={() => setDraft(value ? formatResourceAmount(value) : "")}
      onChange={(event) => {
        const next = event.target.value;
        setDraft(next);
        onChange(parseResourceInput(next));
      }}
      onBlur={() => {
        onChange(parseResourceInput(draft ?? ""));
        setDraft(null);
      }}
    />
  );
}

function HaveResources({ owned, onChange }) {
  return (
    <article className="hero-have-res">
      <div className="calc-row-head">
        <h3>Resources I have</h3>
        <HelpTip
          title="Resources I have"
          message="You can type 1000000 or 1000k. Bag, shop, or extra income not already on the boards lowers Still need."
        />
      </div>
      <p className="muted">
        Bag, shop, or extra income not already on the boards. This lowers Still
        need.
      </p>
      <div className="hero-have-res-grid">
        {COST_ROWS.map((row) => (
          <label key={row.key} className="hero-have-res-item">
            <span className="hero-cost-name">
              <img src={row.icon} alt="" className="csg-icon hero-res-icon" />
              {row.name}
            </span>
            <HaveResourceInput
              name={row.name}
              value={owned[row.key]}
              onChange={(amount) => onChange(row.key, amount)}
            />
          </label>
        ))}
      </div>
    </article>
  );
}

function CostPreview({ used, need, full }) {
  const [sumView, setSumView] = useState("picks");
  const columns = [
    { id: "full", title: "Full want cost", cost: full },
    { id: "used", title: "Used so far", cost: used },
    { id: "need", title: "Still need", cost: need },
  ];
  const mats = {
    used: eventMatsFromCost(used),
    need: eventMatsFromCost(need),
    full: eventMatsFromCost(full),
  };
  const showPicks = sumView === "picks";

  function HeaderRow({ className }) {
    return (
      <tr className={className}>
        <th>Resource</th>
        {columns.map((col) => (
          <th key={col.id}>{col.title}</th>
        ))}
      </tr>
    );
  }

  return (
    <div className="hero-cost-table-wrap">
      <p className="hero-cost-rates">
        1 void mat = 1250k CoT or 1250k stellar · 1 origin mat = 150k essence, 1
        core chest, or 1 skill sub · 1 DT mat = 5 Divine Aurora or 200k Spirit
        Vein
      </p>
      <table className="hero-cost-table">
        <thead>
          <HeaderRow />
        </thead>
        <tbody>
          {COST_ROWS.map((row) => (
            <Fragment key={row.key}>
              <tr>
                <th scope="row">
                  <span className="hero-cost-name">
                    <img src={row.icon} alt="" className="csg-icon hero-res-icon" />
                    {row.name}
                  </span>
                </th>
                {columns.map((col) => (
                  <td key={col.id}>
                    <ResourceAmount
                      icon={row.icon}
                      alt={row.alt}
                      value={col.cost[row.key]}
                    />
                  </td>
                ))}
              </tr>
              <tr className="hero-cost-conv">
                <th scope="row">
                  <span className="hero-cost-rate">= {row.matName}</span>
                  <span className="hero-cost-rate-note">{row.rate}</span>
                </th>
                {columns.map((col) => (
                  <td key={col.id}>
                    <MatAmount
                      icon={row.icon}
                      alt={row.alt}
                      value={mats[col.id][row.matKey]}
                    />
                  </td>
                ))}
              </tr>
            </Fragment>
          ))}
          <HeaderRow className="hero-cost-sum-head" />
          <tr className="hero-cost-sum">
            <th scope="row">
              <div className="hero-sum-toggle" role="group" aria-label="Conclusion view">
                <button
                  type="button"
                  className={showPicks ? "" : "on"}
                  aria-pressed={!showPicks}
                  onClick={() => setSumView("resources")}
                >
                  Resources
                </button>
                <button
                  type="button"
                  className={showPicks ? "on" : ""}
                  aria-pressed={showPicks}
                  onClick={() => setSumView("picks")}
                >
                  Event picks
                </button>
              </div>
              <span className="hero-cost-rate-note">
                {showPicks
                  ? "If you pay that way — not the resource amounts you still need above"
                  : "Resource totals for this column — not event picks"}
              </span>
            </th>
            {columns.map((col) => (
              <td key={col.id}>
                <div className="hero-cost-sum-stack">
                  {COST_ROWS.map((row) =>
                    showPicks ? (
                      <MatAmount
                        key={row.key}
                        icon={row.icon}
                        alt={row.alt}
                        value={mats[col.id][row.matKey]}
                      />
                    ) : (
                      <ResourceAmount
                        key={row.key}
                        icon={row.icon}
                        alt={row.alt}
                        value={col.cost[row.key]}
                      />
                    )
                  )}
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function HeroCard({ hero, templeLevel, onPick, onRemove }) {
  const stage = stageOf(hero.stage);
  const extras = optionalSummary(hero);
  return (
    <div className="hero-slot">
      <button className="hero-slot-card" type="button" onClick={onPick}>
        <img src={heroIcon} alt="" className="hero-slot-art" />
        <HeroStageBadge stageId={hero.stage} templeLevel={templeLevel} />
        <span className="hero-slot-label">{stage.label}</span>
        {extras.length ? (
          <span className="hero-slot-extras">{extras.join(" · ")}</span>
        ) : null}
      </button>
      <button
        className="hero-slot-remove"
        type="button"
        aria-label="Remove hero"
        onClick={onRemove}
      >
        ×
      </button>
    </div>
  );
}

function HeroBoard({
  title,
  heroes,
  templeLevel,
  autoLevel,
  templeManual,
  onTempleManual,
  onAdd,
  onPick,
  onRemove,
  onPresets,
  extra,
}) {
  const row = templeRow(templeLevel);
  const manual = templeManual != null;
  return (
    <article className="hero-board">
      <div className="calc-row-head">
        <h3>{title}</h3>
        <span className="calc-badge">
          Temple {templeLevel} · D+{row.bonus}
        </span>
      </div>
      <p className="muted">Cap: {dtCapLabel(templeLevel)}</p>
      <label className="check-card hero-temple-check">
        <input
          type="checkbox"
          checked={manual}
          onChange={(event) =>
            onTempleManual(event.target.checked ? autoLevel : null)
          }
        />
        <span>Set this temple manually</span>
      </label>
      {manual ? (
        <label className="hero-temple-input">
          Temple level
          <input
            type="number"
            min="1"
            max="22"
            value={templeManual}
            onChange={(event) =>
              onTempleManual(
                Math.min(22, Math.max(1, Number(event.target.value) || 1))
              )
            }
          />
        </label>
      ) : (
        <p className="muted">Auto from this board’s Destiny heroes: {autoLevel}</p>
      )}
      <div className="hero-board-actions">
        <button className="tan-btn" type="button" onClick={onPresets}>
          Presets
        </button>
        {extra}
      </div>
      <div className="hero-slot-grid">
        {heroes.map((hero) => (
          <HeroCard
            key={hero.id}
            hero={hero}
            templeLevel={templeLevel}
            onPick={() => onPick(hero)}
            onRemove={() => onRemove(hero.id)}
          />
        ))}
        <button className="hero-add" type="button" onClick={onAdd}>
          +
        </button>
      </div>
    </article>
  );
}

export default function UpgradeHero() {
  const navigate = useNavigate();
  const { guest, state, patch } = useSgCalc();
  const upgrade = normalizeHeroUpgrade(state.heroUpgrade);
  const [cases, setCases] = useState([]);
  const [picker, setPicker] = useState(null);
  const [yearOpen, setYearOpen] = useState(false);
  const [guide, setGuide] = useState(null);

  useEffect(() => {
    api
      .bootstrap()
      .then((payload) => setCases(payload.cases || []))
      .catch(() => {});
  }, []);

  function setUpgrade(partial) {
    patch({ heroUpgrade: { ...upgrade, ...partial } });
  }

  const haveTemple = resolvedTempleLevel(upgrade.have, upgrade.haveTempleManual);
  const wantTemple = resolvedTempleLevel(upgrade.want, upgrade.wantTempleManual);
  const haveAuto = autoTempleLevel(upgrade.have);
  const wantAuto = autoTempleLevel(upgrade.want);
  const used = useMemo(() => rosterCost(upgrade.have), [upgrade.have]);
  const full = useMemo(() => rosterCost(upgrade.want), [upgrade.want]);
  const need = useMemo(
    () => subCosts(full, addCosts(used, upgrade.otherSources)),
    [full, used, upgrade.otherSources]
  );

  const yearLoot = useMemo(() => {
    const yearState = { ...state, months: 12 };
    const result = calculateSg(yearState);
    const selected = cases.find((row) => row.id === state.eventPlanId) || null;
    const plan = scaleEventPlan(selected, 12);
    return mergeRewardCounts(result.awakenEventPeriod?.counts, plan.counts);
  }, [state, cases]);

  function applyTemplePreset(side, level) {
    setUpgrade({
      [side]: heroesForTemplePreset(level),
      [`${side}TempleManual`]: level,
    });
    setGuide(null);
  }

  function addHero(side) {
    setUpgrade({ [side]: [...upgrade[side], newHero("E5")] });
  }

  function removeHero(side, id) {
    setUpgrade({ [side]: upgrade[side].filter((hero) => hero.id !== id) });
  }

  function patchHero(side, id, partial) {
    setUpgrade({
      [side]: upgrade[side].map((hero) =>
        hero.id === id ? { ...hero, ...partial } : hero
      ),
    });
  }

  function chooseStage(stageId) {
    if (!picker) return;
    const side = picker.side;
    const temple = side === "have" ? haveTemple : wantTemple;
    if (!canPlaceStage(upgrade[side], picker.hero.id, stageId, temple)) return;
    const next = { stage: stageId };
    if (optionalsRequired(stageId)) {
      next.core = true;
      next.subActive = true;
      next.subP1 = true;
      next.subP2 = true;
      next.subP3 = true;
    }
    patchHero(side, picker.hero.id, next);
  }

  function toggleOptional(optionalId, value) {
    if (!picker || optionalsRequired(pickerHero?.stage)) return;
    patchHero(picker.side, picker.hero.id, { [optionalId]: value });
  }

  const pickerTemple = picker
    ? picker.side === "have"
      ? haveTemple
      : wantTemple
    : 1;
  const pickerHero = picker
    ? upgrade[picker.side].find((hero) => hero.id === picker.hero.id)
    : null;
  const pickerOptionals = pickerHero ? visibleOptionals(pickerHero.stage) : [];
  const pickerLocked = pickerHero ? optionalsRequired(pickerHero.stage) : false;

  return (
    <div className="sky-page">
      <div className="shell hero-shell">
        <div className="shell-head">
          <div className="brand">
            <div className="head-with-help">
              <h1>Upgrade Hero Tool</h1>
              <HelpTip
                title="Upgrade Hero"
                steps={[
                  "Left is what you have. Right is what you want. Press + to add a hero, then tap the portrait to pick E1 through D6.",
                  "E1–E5 costs no event mats. Trans is 5000k CoT. V1–V4 is stellar. 1 void mat = 1250k CoT or 1250k stellar.",
                  "T1–T max uses Spiritual Essence and stellar. On a T hero, tick the core and skill subs that hero actually has. Destiny Transition needs core and all four subs.",
                  "1 origin pick = 1 skill sub = 90k of that sub resource. An ability needs 2 picks, so 180k.",
                  "D1–D6 also needs Divine Aurora, Spirit Vein, CoT, and stellar. T120 already paid 5m stellar and 14.93m CoT; D ranks do not add that again.",
                  "Below the heroes, type bag resources you already have. You can type 1000000 or 1000k. The table is Full want cost, Used so far, and Still need. Bag resources lower Still need. The last row can switch between Resources and Event picks.",
                  "Presets lists every temple and its required Destiny heroes. Click Temple 10 to set that board to temple 10 and add 2 D5, 2 D4, and 3 D3. Costs next to the title shows every upgrade cost.",
                  "Each board has its own temple. Auto uses that board’s Destiny heroes for the D cap and D+ on the star. Tick Set this temple manually on a board to override only that side.",
                ]}
              />
              <button
                className="tan-btn"
                type="button"
                onClick={() => setGuide({ side: "want", tab: "costs" })}
              >
                Costs
              </button>
            </div>
            <p>
              Turn event mats from the calculators into E5, V4, T5, and Destiny
              Transition costs.
            </p>
          </div>
          <button className="tan-btn" type="button" onClick={() => navigate("/")}>
            Back to menu
          </button>
        </div>
        {guest ? (
          <p className="guest-banner">
            Guest mode — this planner is only for this visit. Create an account to
            save it.
          </p>
        ) : null}
        <div className="shell-body no-sidebar">
          <section className="main-panel calc-panel">
            <div className="hero-boards">
              <HeroBoard
                title="What I have"
                heroes={upgrade.have}
                templeLevel={haveTemple}
                autoLevel={haveAuto}
                templeManual={upgrade.haveTempleManual}
                onTempleManual={(value) => setUpgrade({ haveTempleManual: value })}
                onAdd={() => addHero("have")}
                onPick={(hero) => setPicker({ side: "have", hero })}
                onRemove={(id) => removeHero("have", id)}
                onPresets={() => setGuide({ side: "have", tab: "presets" })}
              />
              <HeroBoard
                title="What I want"
                heroes={upgrade.want}
                templeLevel={wantTemple}
                autoLevel={wantAuto}
                templeManual={upgrade.wantTempleManual}
                onTempleManual={(value) => setUpgrade({ wantTempleManual: value })}
                onAdd={() => addHero("want")}
                onPick={(hero) => setPicker({ side: "want", hero })}
                onRemove={(id) => removeHero("want", id)}
                onPresets={() => setGuide({ side: "want", tab: "presets" })}
                extra={
                  upgrade.have.length ? (
                    <button
                      className="tan-btn"
                      type="button"
                      onClick={() =>
                        setUpgrade({
                          want: upgrade.have.map((hero) =>
                            newHero(hero.stage, { ...hero, id: undefined })
                          ),
                          wantTempleManual: upgrade.haveTempleManual,
                        })
                      }
                    >
                      Copy from Have
                    </button>
                  ) : null
                }
              />
            </div>

            <HaveResources
              owned={upgrade.otherSources}
              onChange={(key, value) =>
                setUpgrade({
                  otherSources: { ...upgrade.otherSources, [key]: value },
                })
              }
            />

            <div className="total-banner preview-banner hero-cost-banner">
              <div className="head-with-help">
                <h3>Resource preview</h3>
                <button
                  className="info-btn"
                  type="button"
                  aria-label="Yearly income"
                  title="What you get in a year"
                  onClick={() => setYearOpen(true)}
                >
                  <svg className="info-btn-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
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
              </div>
              <CostPreview used={used} need={need} full={full} />
            </div>
          </section>
        </div>
      </div>

      {guide ? (
        <div className="modal-back" onClick={() => setGuide(null)}>
          <div
            className="modal wide"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>
              {guide.tab === "costs"
                ? "Upgrade costs"
                : `Temple presets · ${guide.side === "have" ? "What I have" : "What I want"}`}
            </h3>
            <div className="help-tabs">
              <button
                className={`help-tab${guide.tab === "presets" ? " on" : ""}`}
                type="button"
                onClick={() => setGuide({ ...guide, tab: "presets" })}
              >
                Presets
              </button>
              <button
                className={`help-tab${guide.tab === "costs" ? " on" : ""}`}
                type="button"
                onClick={() => setGuide({ ...guide, tab: "costs" })}
              >
                Costs
              </button>
            </div>
            {guide.tab === "costs" ? (
              <UpgradeCostsPanel />
            ) : (
              <TemplePresetsPanel
                currentLevel={
                  guide.side === "have" ? haveTemple : wantTemple
                }
                onPick={(level) => applyTemplePreset(guide.side, level)}
              />
            )}
            <div className="row-actions">
              <button className="gold-btn" type="button" onClick={() => setGuide(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {picker && pickerHero ? (
        <div className="modal-back" onClick={() => setPicker(null)}>
          <div
            className="modal wide hero-stage-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Choose level</h3>
            <p className="muted">
              Temple {pickerTemple} · D+{templeRow(pickerTemple).bonus}. Destiny
              options past the cap stay locked unless you raise temple.
            </p>
            {STAGE_GROUPS.map((group) => (
              <div key={group.id} className="hero-stage-group">
                <h4>{group.title}</h4>
                <div className="hero-stage-picks">
                  {STAGES.filter((stage) => stage.group === group.id).map((stage) => {
                    const allowed = canPlaceStage(
                      upgrade[picker.side],
                      pickerHero.id,
                      stage.id,
                      pickerTemple
                    );
                    const selected = pickerHero.stage === stage.id;
                    return (
                      <button
                        key={stage.id}
                        className={`hero-stage-pick${selected ? " selected" : ""}`}
                        type="button"
                        disabled={!allowed}
                        onClick={() => chooseStage(stage.id)}
                      >
                        <HeroStageBadge
                          stageId={stage.id}
                          templeLevel={pickerTemple}
                        />
                        <span>{stage.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {isTStage(pickerHero.stage) || isDtStage(pickerHero.stage) ? (
              <div className="hero-optional-block">
                <h4>Core and skill subs</h4>
                {pickerLocked ? (
                  <p className="muted">
                    Destiny Transition needs the core and all skill subs.
                  </p>
                ) : (
                  <p className="muted">
                    Tick what this hero already has. 1 origin mat = 1 core chest
                    or 1 sub.
                  </p>
                )}
                <div className="hero-optional-list">
                  {pickerOptionals.map((item) => (
                    <label className="check-card hero-temple-check" key={item.id}>
                      <input
                        type="checkbox"
                        checked={Boolean(pickerHero[item.id]) || pickerLocked}
                        disabled={pickerLocked}
                        onChange={(event) =>
                          toggleOptional(item.id, event.target.checked)
                        }
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="row-actions">
              <button className="gold-btn" type="button" onClick={() => setPicker(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {yearOpen ? (
        <div className="modal-back" onClick={() => setYearOpen(false)}>
          <div className="modal wide" onClick={(event) => event.stopPropagation()}>
            <h3>What you get in a year</h3>
            <p>
              This uses the same ticks as All rewards: calculators plus the Event
              Plan you ticked there.
            </p>
            <LootChips
              counts={yearLoot}
              empty="No event loot yet. Tick sources on the calculators and one Event Plan on All rewards."
            />
            <p className="muted">
              1 void mat = 1250k CoT or 1250k stellar. 1 origin mat = 150k
              Spiritual Essence, 1 core chest, or 1 skill sub. 1 DT mat = 5 Divine
              Aurora or 200k Spirit Vein.
            </p>
            <div className="row-actions">
              <button className="gold-btn" type="button" onClick={() => setYearOpen(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
