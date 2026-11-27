import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import HelpTip from "../components/HelpTip.jsx";
import ResourceAmount, {
  formatResourceAmount,
} from "../components/ResourceAmount.jsx";
import {
  calculateEtherealRealm,
  CORE_SHARDS_PER_CHEST,
  dayGemCost,
  etherealPresetFullGemsDays,
  etherealPresetZeroGemsDays,
  ETHEREAL_FREE_BATTLES,
  ETHEREAL_GEMS_PER_EXTRA,
  ETHEREAL_MAX_BATTLES,
  ETHEREAL_STAGES,
  STARSOUL_SHARDS_PER_STARSOUL,
} from "../etherealRealm";
import { clampMonths, PERIOD_PRESETS, periodLabel } from "../sgCalc";
import { useSgCalc } from "../useSgCalc";
import { AURORA_SHARDS_PER_AURORA } from "../voidBosses";

import auroraIcon from "../assets/hero/aurora.png";
import auroraShardsIcon from "../assets/hero/aurora-shards.png";
import coreChestIcon from "../assets/hero/core-chest.png";
import cotIcon from "../assets/hero/cot.png";
import spiritVeinIcon from "../assets/hero/spirit-vein.png";
import starsoulMatsIcon from "../assets/hero/starsoul-mats.png";
import coresIcon from "../assets/rng/cores.png";
import originIcon from "../assets/rewards/origin.png";
import starSoulIcon from "../assets/rewards/star-soul.png";
import voidIcon from "../assets/rewards/void.png";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function patchEthereal(patch, er, next) {
  patch({ etherealRealm: { ...er, ...next } });
}

function setDayBattles(patch, er, dayIndex, field, value) {
  const days = er.days.map((d) => ({ ...d }));
  const day = { ...days[dayIndex] };
  const n = Math.max(
    0,
    Math.min(ETHEREAL_MAX_BATTLES, Math.round(Number(value) || 0))
  );
  day[field] = n;
  const other = field === "red" ? "purple" : "red";
  const maxOther = ETHEREAL_MAX_BATTLES - n;
  if (day[other] > maxOther) day[other] = maxOther;
  days[dayIndex] = day;
  patchEthereal(patch, er, { days });
}

function daysMatchPreset(days, preset) {
  if (!Array.isArray(days) || days.length !== preset.length) return false;
  return days.every(
    (d, i) =>
      Number(d.red) === preset[i].red && Number(d.purple) === preset[i].purple
  );
}

function FightPresetButtons({ er, patch, className = "" }) {
  return (
    <div className={`period-presets er-fight-presets ${className}`.trim()}>
      <button
        type="button"
        className={
          daysMatchPreset(er.days, etherealPresetZeroGemsDays())
            ? "gold-btn"
            : "tan-btn"
        }
        onClick={() =>
          patchEthereal(patch, er, {
            days: etherealPresetZeroGemsDays(),
          })
        }
      >
        0 gems
      </button>
      <button
        type="button"
        className={
          daysMatchPreset(er.days, etherealPresetFullGemsDays())
            ? "gold-btn"
            : "tan-btn"
        }
        onClick={() =>
          patchEthereal(patch, er, {
            days: etherealPresetFullGemsDays(),
          })
        }
      >
        Full gems
      </button>
    </div>
  );
}

function RewardLine({ rewards, compact = false }) {
  const bits = [
    rewards.stellar
      ? { icon: cotIcon, alt: "Stellar", value: rewards.stellar }
      : null,
    rewards.subs
      ? { icon: originIcon, alt: "Skill subs", value: rewards.subs }
      : null,
    rewards.spiritVein
      ? { icon: spiritVeinIcon, alt: "Spirit Vein", value: rewards.spiritVein }
      : null,
    rewards.auroraShards
      ? {
          icon: auroraShardsIcon,
          alt: "Aurora shards",
          value: rewards.auroraShards,
        }
      : null,
    rewards.aurora
      ? { icon: auroraIcon, alt: "Divine Aurora", value: rewards.aurora }
      : null,
    rewards.starsoulMats
      ? {
          icon: starsoulMatsIcon,
          alt: "Starsoul mats",
          value: rewards.starsoulMats,
        }
      : null,
    rewards.cot
      ? { icon: voidIcon, alt: "CoT", value: rewards.cot }
      : null,
    rewards.coreShards
      ? { icon: coresIcon, alt: "Core shards", value: rewards.coreShards }
      : null,
    rewards.coreChests
      ? {
          icon: coreChestIcon,
          alt: "Core chests",
          value: rewards.coreChests,
        }
      : null,
    rewards.starsoulShards
      ? {
          icon: starSoulIcon,
          alt: "Starsoul shards",
          value: rewards.starsoulShards,
          suffix: " shards",
        }
      : null,
    rewards.starsouls
      ? { icon: starSoulIcon, alt: "Starsouls", value: rewards.starsouls }
      : null,
  ].filter(Boolean);

  if (!bits.length) {
    return <span className="muted">—</span>;
  }

  return (
    <div className={`er-reward-line${compact ? " compact" : ""}`}>
      {bits.map((b) => (
        <ResourceAmount
          key={b.alt}
          icon={b.icon}
          alt={b.alt}
          value={b.value}
          suffix={b.suffix || ""}
        />
      ))}
    </div>
  );
}

export default function EtherealRealmCalculator() {
  const navigate = useNavigate();
  const { guest, state, patch } = useSgCalc();
  const er = state.etherealRealm;
  const result = useMemo(
    () => calculateEtherealRealm(er, state.months),
    [er, state.months]
  );
  const label = periodLabel(state.months);

  return (
    <div className="sky-page">
      <div className="shell">
        <div className="shell-head">
          <div className="brand">
            <div className="head-with-help">
              <h1>Ethereal Realm Calculator</h1>
              <HelpTip
                title="Ethereal Realm"
                steps={[
                  "Pick the highest stage you can clear (1–20). Rewards use that row for Tableland & Expanse.",
                  `Each day you get ${ETHEREAL_FREE_BATTLES} free battles; up to ${ETHEREAL_MAX_BATTLES} total. Extra fights cost ${ETHEREAL_GEMS_PER_EXTRA} gems each.`,
                  "Split free/paid battles between Savage Warriors (red) and Boss attacks (purple). Rival Forces are ignored.",
                  "Boss resets weekly — tick Tableland / Expanse kill if you claim that week's participation rewards.",
                  `Core shards: ${CORE_SHARDS_PER_CHEST} = 1 core chest. Starsoul shards: ${STARSOUL_SHARDS_PER_STARSOUL} = 1 starsoul. Aurora shards: ${AURORA_SHARDS_PER_AURORA} = 1 Divine Aurora.`,
                ]}
              />
            </div>
            <p>
              Plan a week of red / purple fights and weekly boss kills, then see
              resources over your chosen time period (default 1 year).
            </p>
          </div>
          <button
            className="tan-btn"
            type="button"
            onClick={() => navigate("/")}
          >
            Back to menu
          </button>
        </div>
        {guest ? (
          <p className="guest-banner">
            Guest mode — this calculator is only for this visit. Create an
            account to save it.
          </p>
        ) : null}

        <div className="shell-body no-sidebar">
          <section className="main-panel calc-panel">
            <div className="total-banner preview-banner pages-event-banner er-banner">
              <div>
                <h3>
                  Stage {result.plan.stage} · {label}
                </h3>
                <p>
                  Weekly fights:{" "}
                  <strong>{result.fights.red}</strong> red ·{" "}
                  <strong>{result.fights.purple}</strong> purple
                  {result.plan.killTableland ? " · Tableland kill" : ""}
                  {result.plan.killExpanse ? " · Expanse kill" : ""}
                </p>
                <p>
                  Gems / week:{" "}
                  <strong>{formatResourceAmount(result.gemsWeekly)}</strong>
                  {" · "}
                  Gems / {label}:{" "}
                  <strong>{formatResourceAmount(result.gemsPeriod)}</strong>
                </p>
                {result.unlockWarn ? (
                  <p className="er-warn">{result.unlockWarn}</p>
                ) : null}
                <FightPresetButtons er={er} patch={patch} className="er-banner-presets" />
                <RewardLine rewards={result.period} />
              </div>
              <div className="pages-event-total">
                <span>Period haul</span>
                <strong className="er-period-gems">
                  {formatResourceAmount(result.gemsPeriod)} gems
                </strong>
                <span className="pages-event-rewards er-banner-side">
                  <ResourceAmount
                    icon={cotIcon}
                    alt="Stellar"
                    value={result.period.stellar}
                  />
                  <ResourceAmount
                    icon={originIcon}
                    alt="Subs"
                    value={result.period.subs}
                  />
                  <ResourceAmount
                    icon={spiritVeinIcon}
                    alt="Spirit Vein"
                    value={result.period.spiritVein}
                  />
                  <ResourceAmount
                    icon={voidIcon}
                    alt="CoT"
                    value={result.period.cot}
                  />
                </span>
                <span>
                  {formatResourceAmount(result.gemsYearly)} gems / year
                </span>
              </div>
            </div>

            <article className="calc-row">
              <div className="calc-row-head">
                <div className="head-with-help">
                  <h3>Time period</h3>
                  <HelpTip
                    title="Time period"
                    steps={[
                      "Choose 1 month to 5 years, or drag the slider.",
                      "Summary above scales weekly Ethereal income to this window (52 weeks / year).",
                    ]}
                  />
                </div>
                <span className="calc-badge">{label}</span>
              </div>
              <div className="period-presets">
                {PERIOD_PRESETS.map((preset) => (
                  <button
                    key={preset.months}
                    className={
                      state.months === preset.months ? "gold-btn" : "tan-btn"
                    }
                    type="button"
                    onClick={() => patch({ months: preset.months })}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <label className="field">
                <span>Months (1-60)</span>
                <input
                  className="cell-input"
                  type="range"
                  min="1"
                  max="60"
                  value={state.months}
                  onChange={(event) =>
                    patch({ months: clampMonths(event.target.value) })
                  }
                />
                <input
                  className="cell-input"
                  type="number"
                  min="1"
                  max="60"
                  value={state.months}
                  onChange={(event) =>
                    patch({ months: clampMonths(event.target.value) })
                  }
                />
              </label>
            </article>

            <article className="calc-row">
              <div className="calc-row-head">
                <div className="head-with-help">
                  <h3>Stage & weekly boss kills</h3>
                  <HelpTip
                    title="Stage & kills"
                    steps={[
                      "Stage sets the reward row for red fights, purple fights, and both boss kill tables.",
                      "Tick a world if you claim that boss kill / participation once per week.",
                    ]}
                  />
                </div>
              </div>
              <label className="field">
                <span>Highest stage you clear (1–{ETHEREAL_STAGES})</span>
                <input
                  className="cell-input"
                  type="range"
                  min="1"
                  max={ETHEREAL_STAGES}
                  value={er.stage}
                  onChange={(e) =>
                    patchEthereal(patch, er, {
                      stage: Number(e.target.value) || 1,
                    })
                  }
                />
                <input
                  className="cell-input"
                  type="number"
                  min="1"
                  max={ETHEREAL_STAGES}
                  value={er.stage}
                  onChange={(e) =>
                    patchEthereal(patch, er, {
                      stage: Number(e.target.value) || 1,
                    })
                  }
                />
              </label>
              <div className="check-grid er-kill-grid">
                <label className="check-card">
                  <input
                    type="checkbox"
                    checked={er.killTableland}
                    onChange={(e) =>
                      patchEthereal(patch, er, {
                        killTableland: e.target.checked,
                      })
                    }
                  />
                  <span>
                    <strong>Tableland boss kill</strong>
                    <span className="muted">
                      CoT · Aurora shards · Starsoul shards
                    </span>
                    <RewardLine
                      rewards={result.perFight.tablelandKill}
                      compact
                    />
                  </span>
                </label>
                <label className="check-card">
                  <input
                    type="checkbox"
                    checked={er.killExpanse}
                    onChange={(e) =>
                      patchEthereal(patch, er, {
                        killExpanse: e.target.checked,
                      })
                    }
                  />
                  <span>
                    <strong>Expanse boss kill</strong>
                    <span className="muted">
                      CoT · Core shards · Starsoul shards
                    </span>
                    <RewardLine
                      rewards={result.perFight.expanseKill}
                      compact
                    />
                  </span>
                </label>
              </div>
            </article>

            <article className="calc-row">
              <div className="calc-row-head">
                <div className="head-with-help">
                  <h3>Weekly fight plan</h3>
                  <HelpTip
                    title="Weekly fights"
                    steps={[
                      `Max ${ETHEREAL_MAX_BATTLES} battles/day (${ETHEREAL_FREE_BATTLES} free, then ${ETHEREAL_GEMS_PER_EXTRA} gems each).`,
                      "Red = Savage Warriors. Purple = Boss attacks (not the weekly kill).",
                      "0 gems: day 1 red, day 2 purple, other days red — all free.",
                      "Full gems: same split, plus +5 red every day (uses the 5 paid battles).",
                    ]}
                  />
                </div>
                <span className="calc-badge">
                  {result.fights.red} red · {result.fights.purple} purple ·{" "}
                  {formatResourceAmount(result.gemsWeekly)} gems
                </span>
              </div>

              <FightPresetButtons er={er} patch={patch} />

              <div className="er-day-grid">
                {er.days.map((day, i) => {
                  const total = day.red + day.purple;
                  const gems = dayGemCost(day);
                  return (
                    <div key={DAY_LABELS[i]} className="er-day-card">
                      <div className="er-day-head">
                        <strong>{DAY_LABELS[i]}</strong>
                        <span className="muted">
                          {total}/{ETHEREAL_MAX_BATTLES}
                          {gems ? ` · ${gems} gems` : " · free"}
                        </span>
                      </div>
                      <label className="field er-day-field">
                        <span>Red (warriors)</span>
                        <input
                          className="cell-input"
                          type="number"
                          min={0}
                          max={ETHEREAL_MAX_BATTLES}
                          value={day.red}
                          onChange={(e) =>
                            setDayBattles(patch, er, i, "red", e.target.value)
                          }
                        />
                      </label>
                      <label className="field er-day-field">
                        <span>Purple (boss atk)</span>
                        <input
                          className="cell-input"
                          type="number"
                          min={0}
                          max={ETHEREAL_MAX_BATTLES}
                          value={day.purple}
                          onChange={(e) =>
                            setDayBattles(
                              patch,
                              er,
                              i,
                              "purple",
                              e.target.value
                            )
                          }
                        />
                      </label>
                    </div>
                  );
                })}
              </div>

              <div className="er-per-fight">
                <p className="muted">
                  Per red fight at stage {er.stage}:
                </p>
                <RewardLine rewards={result.perFight.red} compact />
                <p className="muted">
                  Per purple fight at stage {er.stage}:
                </p>
                <RewardLine rewards={result.perFight.purple} compact />
              </div>
            </article>

            <article className="calc-row">
              <div className="calc-row-head">
                <h3>Summary · {label}</h3>
              </div>
              <div className="ah-summary-grid er-summary-grid">
                <div className="ah-stat">
                  <span className="muted">Stellar</span>
                  <ResourceAmount
                    icon={cotIcon}
                    alt="Stellar"
                    value={result.period.stellar}
                  />
                </div>
                <div className="ah-stat">
                  <span className="muted">Skill subs</span>
                  <ResourceAmount
                    icon={originIcon}
                    alt="Subs"
                    value={result.period.subs}
                  />
                </div>
                <div className="ah-stat">
                  <span className="muted">Spirit Vein</span>
                  <ResourceAmount
                    icon={spiritVeinIcon}
                    alt="Spirit Vein"
                    value={result.period.spiritVein}
                  />
                </div>
                <div className="ah-stat">
                  <span className="muted">Aurora shards</span>
                  <ResourceAmount
                    icon={auroraShardsIcon}
                    alt="Aurora shards"
                    value={result.period.auroraShards}
                  />
                  <span className="muted">
                    ={" "}
                    <ResourceAmount
                      icon={auroraIcon}
                      alt="Aurora"
                      value={result.period.aurora}
                    />
                  </span>
                </div>
                <div className="ah-stat">
                  <span className="muted">Starsoul mats</span>
                  <ResourceAmount
                    icon={starsoulMatsIcon}
                    alt="Starsoul mats"
                    value={result.period.starsoulMats}
                  />
                </div>
                <div className="ah-stat">
                  <span className="muted">CoT</span>
                  <ResourceAmount
                    icon={voidIcon}
                    alt="CoT"
                    value={result.period.cot}
                  />
                </div>
                <div className="ah-stat">
                  <span className="muted">Core shards</span>
                  <ResourceAmount
                    icon={coresIcon}
                    alt="Core shards"
                    value={result.period.coreShards}
                  />
                  <span className="muted">
                    ={" "}
                    <ResourceAmount
                      icon={coreChestIcon}
                      alt="Core chests"
                      value={result.period.coreChests}
                    />
                  </span>
                </div>
                <div className="ah-stat">
                  <span className="muted">Starsoul shards</span>
                  <ResourceAmount
                    icon={starSoulIcon}
                    alt="Starsoul shards"
                    value={result.period.starsoulShards}
                  />
                  <span className="muted">
                    ={" "}
                    <ResourceAmount
                      icon={starSoulIcon}
                      alt="Starsouls"
                      value={result.period.starsouls}
                    />
                  </span>
                </div>
                <div className="ah-stat">
                  <span className="muted">Gems spent</span>
                  <strong>{formatResourceAmount(result.gemsPeriod)}</strong>
                </div>
              </div>
            </article>
          </section>
        </div>
      </div>
    </div>
  );
}
