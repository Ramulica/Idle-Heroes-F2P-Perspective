import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import HelpTip from "../components/HelpTip.jsx";
import HeroStageBadge from "../components/HeroStageBadge.jsx";
import LootChips from "../components/LootChips.jsx";
import ResourceAmount from "../components/ResourceAmount.jsx";
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
  autoTempleLevel,
  canPlaceStage,
  dtCapLabel,
  eventMatsFromCost,
  newHero,
  normalizeHeroUpgrade,
  resolvedTempleLevel,
  rosterCost,
  stageOf,
  subCosts,
  templeRow,
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

function CostColumn({ title, cost }) {
  const mats = eventMatsFromCost(cost);
  return (
    <div className="hero-cost-col">
      <h3>{title}</h3>
      <div className="hero-cost-line">
        <span>CoT</span>
        <ResourceAmount icon={cotIcon} alt="Crystals of Transcendence" value={cost.cot} compact />
        <span className="muted">{mats.voidForCot.toFixed(2)} void mats</span>
      </div>
      <div className="hero-cost-line">
        <span>Stellar</span>
        <ResourceAmount icon={voidIcon} alt="Stellar Shards" value={cost.stellar} compact />
        <span className="muted">{mats.voidForStellar.toFixed(2)} void mats</span>
      </div>
      <div className="hero-cost-line">
        <span>Essence</span>
        <ResourceAmount icon={essenceIcon} alt="Spiritual Essence" value={cost.essence} />
        <span className="muted">{mats.originForEssence.toFixed(2)} origin mats</span>
      </div>
      <div className="hero-cost-line">
        <span>Core chests</span>
        <ResourceAmount icon={coreChestIcon} alt="Core Chest" value={cost.cores} />
        <span className="muted">{mats.originForCores} origin mats</span>
      </div>
      <div className="hero-cost-line">
        <span>Skill subs</span>
        <ResourceAmount icon={originIcon} alt="Origin Material" value={cost.subs} />
        <span className="muted">{mats.originForSubs} origin mats</span>
      </div>
      <div className="hero-cost-line">
        <span>Divine Aurora</span>
        <ResourceAmount icon={auroraIcon} alt="Divine Aurora" value={cost.dtMats} />
        <span className="muted">{mats.dtForAurora} DT mats</span>
      </div>
      <div className="hero-cost-line">
        <span>Spirit Vein</span>
        <ResourceAmount icon={spiritVeinIcon} alt="Spirit Vein Shards" value={cost.spiritVein} />
        <span className="muted">{mats.dtForVein.toFixed(2)} DT mats</span>
      </div>
      <p className="hero-cost-total muted">
        Event mats if you pay everything that way: {mats.voidTotal.toFixed(2)} void ·{" "}
        {mats.originTotal.toFixed(2)} origin · {mats.dtTotal.toFixed(2)} DT
      </p>
    </div>
  );
}

function HeroCard({ hero, templeLevel, onPick, onRemove }) {
  const stage = stageOf(hero.stage);
  return (
    <div className="hero-slot">
      <button className="hero-slot-card" type="button" onClick={onPick}>
        <img src={heroIcon} alt="" className="hero-slot-art" />
        <HeroStageBadge stageId={hero.stage} templeLevel={templeLevel} />
        <span className="hero-slot-label">{stage.label}</span>
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
  const used = useMemo(
    () => rosterCost(upgrade.have, upgrade.includeOptionals),
    [upgrade.have, upgrade.includeOptionals]
  );
  const full = useMemo(
    () => rosterCost(upgrade.want, upgrade.includeOptionals),
    [upgrade.want, upgrade.includeOptionals]
  );
  const need = useMemo(() => subCosts(full, used), [full, used]);

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

  function chooseStage(stageId) {
    if (!picker) return;
    const side = picker.side;
    const temple = side === "have" ? haveTemple : wantTemple;
    if (!canPlaceStage(upgrade[side], picker.hero.id, stageId, temple)) return;
    setUpgrade({
      [side]: upgrade[side].map((hero) =>
        hero.id === picker.hero.id ? { ...hero, stage: stageId } : hero
      ),
    });
    setPicker(null);
  }

  const pickerTemple = picker
    ? picker.side === "have"
      ? haveTemple
      : wantTemple
    : 1;

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
                  "T1–T max uses Spiritual Essence and stellar. Optional cores and skill subs use origin mats (1 origin = 150k essence, 1 core chest, or 1 sub).",
                  "D1–D6 also needs Divine Aurora, Spirit Vein, CoT, and stellar. 1 DT mat = 5 Divine Aurora or 200k Spirit Vein.",
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
              <div className="hero-cost-grid">
                <CostColumn title="Used so far" cost={used} />
                <CostColumn title="Still need" cost={need} />
                <CostColumn title="Full want cost" cost={full} />
              </div>
            </div>

            <article className="calc-row">
              <label className="check-card hero-temple-check">
                <input
                  type="checkbox"
                  checked={upgrade.includeOptionals}
                  onChange={(event) =>
                    setUpgrade({ includeOptionals: event.target.checked })
                  }
                />
                <span>
                  Include optional T cores (8 chests at T1) and skill subs (2
                  origin mats at T2–T5)
                </span>
              </label>
            </article>

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
                          want: upgrade.have.map((hero) => ({
                            ...newHero(hero.stage),
                            stage: hero.stage,
                          })),
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

      {picker ? (
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
                      picker.hero.id,
                      stage.id,
                      pickerTemple
                    );
                    const selected = picker.hero.stage === stage.id;
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
            <div className="row-actions">
              <button className="tan-btn" type="button" onClick={() => setPicker(null)}>
                Close
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
