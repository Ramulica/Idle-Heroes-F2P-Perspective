import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import HelpTip from "../components/HelpTip.jsx";
import HeroStageBadge from "../components/HeroStageBadge.jsx";
import LootChips from "../components/LootChips.jsx";
import ResourceAmount from "../components/ResourceAmount.jsx";
import RewardIcon from "../components/RewardIcon.jsx";
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
  STAGES,
  addCosts,
  autoTempleLevel,
  canPlaceStage,
  dtCapLabel,
  eventMatsFromCost,
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
    icon: cotIcon,
    alt: "Crystals of Transcendence",
    compact: true,
    matKey: "voidForCot",
    matType: "Void",
    matName: "void mats",
    rate: "1 void = 1250k CoT",
  },
  {
    key: "stellar",
    name: "Stellar",
    icon: voidIcon,
    alt: "Stellar Shards",
    compact: true,
    matKey: "voidForStellar",
    matType: "Void",
    matName: "void mats",
    rate: "1 void = 1250k stellar",
  },
  {
    key: "essence",
    name: "Spiritual Essence",
    icon: essenceIcon,
    alt: "Spiritual Essence",
    matKey: "originForEssence",
    matType: "Origin",
    matName: "origin mats",
    rate: "1 origin = 150k essence",
  },
  {
    key: "cores",
    name: "Core chests",
    icon: coreChestIcon,
    alt: "Core Chest",
    matKey: "originForCores",
    matType: "Origin",
    matName: "origin mats",
    rate: "1 origin = 1 core chest",
  },
  {
    key: "subs",
    name: "Skill subs",
    icon: originIcon,
    alt: "Origin Material",
    matKey: "originForSubs",
    matType: "Origin",
    matName: "origin mats",
    rate: "1 origin = 1 sub",
  },
  {
    key: "dtMats",
    name: "Divine Aurora",
    icon: auroraIcon,
    alt: "Divine Aurora",
    matKey: "dtForAurora",
    matType: "DT",
    matName: "DT mats",
    rate: "1 DT mat = 5 Aurora",
  },
  {
    key: "spiritVein",
    name: "Spirit Vein",
    icon: spiritVeinIcon,
    alt: "Spirit Vein Shards",
    matKey: "dtForVein",
    matType: "DT",
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

function MatAmount({ type, value }) {
  return (
    <span className="hero-mat-amount">
      <RewardIcon type={type} />
      <strong>{formatMats(value)}</strong>
    </span>
  );
}

function CostPreview({ used, other, need, full, onOther }) {
  const columns = [
    { id: "used", title: "Used so far", cost: used },
    { id: "other", title: "Other sources", cost: other, input: true },
    { id: "need", title: "Still need", cost: need },
    { id: "full", title: "Full want cost", cost: full },
  ];
  const mats = {
    used: eventMatsFromCost(used),
    other: eventMatsFromCost(other),
    need: eventMatsFromCost(need),
    full: eventMatsFromCost(full),
  };

  return (
    <div className="hero-cost-table-wrap">
      <p className="hero-cost-rates">
        Other sources is bag, shop, or extra income not already on the boards.
        Type a number or 5000k. 1 void mat = 1250k CoT or 1250k stellar · 1
        origin mat = 150k essence, 1 core chest, or 1 skill sub · 1 DT mat = 5
        Divine Aurora or 200k Spirit Vein
      </p>
      <table className="hero-cost-table">
        <thead>
          <tr>
            <th>Resource</th>
            {columns.map((col) => (
              <th key={col.id}>{col.title}</th>
            ))}
          </tr>
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
                    {col.input ? (
                      <input
                        className="hero-other-input"
                        type="text"
                        inputMode="decimal"
                        aria-label={`${row.name} from other sources`}
                        placeholder="0"
                        value={col.cost[row.key] ? String(col.cost[row.key]) : ""}
                        onChange={(event) =>
                          onOther(row.key, parseResourceInput(event.target.value))
                        }
                      />
                    ) : (
                      <ResourceAmount
                        alt={row.alt}
                        value={col.cost[row.key]}
                        compact={row.compact}
                      />
                    )}
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
                    <MatAmount type={row.matType} value={mats[col.id][row.matKey]} />
                  </td>
                ))}
              </tr>
            </Fragment>
          ))}
          <tr className="hero-cost-sum">
            <th scope="row">Event mats if you pay that way</th>
            {columns.map((col) => (
              <td key={col.id}>
                <div className="hero-cost-sum-stack">
                  <MatAmount type="Void" value={mats[col.id].voidTotal} />
                  <MatAmount type="Origin" value={mats[col.id].originTotal} />
                  <MatAmount type="DT" value={mats[col.id].dtTotal} />
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
      {extra}
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
                  "E1–E5 costs no event mats. V1–V4 costs 5000k CoT plus 4935k stellar. 1 void mat = 1250k CoT or 1250k stellar.",
                  "T1–T max uses Spiritual Essence and stellar. On a T hero, tick the core and skill subs that hero actually has. Destiny Transition needs core and all four subs.",
                  "D1–D6 also needs Divine Aurora, Spirit Vein, CoT, and stellar. 1 DT mat = 5 Divine Aurora or 200k Spirit Vein.",
                  "The preview has Used so far, Other sources you type in, Still need, and Full want. Other sources is bag or extra income, and it lowers Still need.",
                  "Each board has its own temple. Auto uses that board’s Destiny heroes for the D cap and D+ on the star. Tick Set this temple manually on a board to override only that side.",
                ]}
              />
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
              <CostPreview
                used={used}
                other={upgrade.otherSources}
                need={need}
                full={full}
                onOther={(key, value) =>
                  setUpgrade({
                    otherSources: { ...upgrade.otherSources, [key]: value },
                  })
                }
              />
            </div>

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
          </section>
        </div>
      </div>

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
