import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import HelpTip from "../components/HelpTip.jsx";
import {
  AUCTION_HEROES,
  AUCTION_RARITIES,
  AUCTION_RARITY_META,
  HAMMER_ICON,
  STAR_GEM_ICON,
  SELL_COMMISSION,
  addBidding,
  auctionBonusList,
  auctionBonusPool,
  auctionBonusSlots,
  auctionHeroOf,
  auctionSummary,
  awakeningSpeedChoices,
  awakeningStatValue,
  bagReadyAt,
  boardAlerts,
  buyBidding,
  copyAlerts,
  copyTitle,
  copyToDraft,
  bidFailAdvice,
  deleteCatalogPreset,
  deleteHeroSetup,
  discardBag,
  draftWithRarity,
  emptyBiddingDraft,
  evaluateFlip,
  failBidding,
  failListing,
  firstSetUpHeroId,
  flipBootstrapPlan,
  formatBonuses,
  formatDuration,
  formatSg,
  formatWhen,
  fromDatetimeLocalValue,
  isHeroSetUp,
  listFromBag,
  listingPhases,
  minListPrice,
  netFromListPrice,
  partitionAuctionHeroes,
  patchSettings,
  returnBagToBidding,
  returnListingToBag,
  saveCatalogPreset,
  sellListing,
  setDraftBonus,
  setHammersUsed,
  upsertHeroSetup,
  suggestListPrice,
  toDatetimeLocalValue,
  updateBagCopy,
  updateBidding,
  updateListingCopy,
} from "../auctionHouse";
import {
  CATALOG_STAT_OPTIONS,
  FLAT_PRIORITIES,
  FLIP_STRATEGIES,
  catalogPresetToPref,
  defaultHeroSetup,
  flatRankLabel,
  normalizeFlatRank,
  strategyOf,
} from "../auctionCatalog";
import { api } from "../api";
import { useAuth } from "../auth";
import { useAuctionHouse } from "../useAuctionHouse";
import runeAtkIcon from "../assets/stats/monsters/rune-atk.png";
import runeHpIcon from "../assets/stats/monsters/rune-hp.png";
import runeSpdIcon from "../assets/stats/monsters/rune-spd.png";

const FLAT_STAT_ICONS = {
  attack: runeAtkIcon,
  hp: runeHpIcon,
  speed: runeSpdIcon,
};

const TABS = [
  { id: "biddings", label: "My Biddings" },
  { id: "bag", label: "Bag" },
  { id: "listings", label: "Listings" },
  { id: "history", label: "History" },
  { id: "catalog", label: "Catalog" },
  { id: "summary", label: "Summary" },
  { id: "settings", label: "Settings" },
];

function Sg({ value, className = "" }) {
  return (
    <span className={`ah-sg ${className}`.trim()}>
      <strong>{formatSg(value)}</strong>
      <img src={STAR_GEM_ICON} alt="" className="ah-sg-icon" />
    </span>
  );
}

/** Small Attack / HP / Speed rune badge. */
function FlatStatBadge({ id, label = null, className = "" }) {
  const icon = FLAT_STAT_ICONS[id];
  const text =
    label ??
    FLAT_PRIORITIES.find((f) => f.id === id)?.label ??
    id;
  if (!icon) return <span className={className}>{text}</span>;
  return (
    <span className={`ah-flat-badge ${className}`.trim()}>
      <img src={icon} alt="" className="ah-flat-badge-icon" />
      <span>{text}</span>
    </span>
  );
}

function HammerAmt({ value, className = "" }) {
  return (
    <span className={`ah-hammer ${className}`.trim()}>
      <strong>{formatSg(value)}</strong>
      <img src={HAMMER_ICON} alt="" className="ah-hammer-icon" />
    </span>
  );
}

function Modal({ title, children, onClose, footer = null }) {
  const backdropPressed = useRef(false);
  return (
    <div
      className="modal-back"
      onMouseDown={(e) => {
        backdropPressed.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (backdropPressed.current && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal wide ah-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        {children}
        <div className="row-actions sc-pick-actions">
          {footer}
          <button className="gold-btn" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function HeroPickGrid({ value, onChange, state, onSetupMore }) {
  const { setUp } = partitionAuctionHeroes(state);
  return (
    <div className="ah-hero-grid-wrap">
      {setUp.length ? (
        <div className="ah-hero-group">
          <p className="ah-hero-group-label muted">Set up</p>
          <div className="ah-hero-grid">
            {setUp.map((hero) => (
              <button
                key={hero.id}
                type="button"
                className={`ah-hero-pick${value === hero.id ? " on" : ""}`}
                onClick={() => onChange(hero.id)}
              >
                <img src={hero.icon} alt="" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="muted">No set-up heroes yet — add setups in Catalog.</p>
      )}
      <button
        type="button"
        className="tan-btn ah-setup-more-btn"
        onClick={onSetupMore}
      >
        Set up more heroes
      </button>
    </div>
  );
}

function RankList({
  items,
  labels,
  icons = null,
  onReorder,
  onRemove = null,
  empty,
}) {
  const dragIndex = useRef(null);
  function move(from, to) {
    if (from === to || from < 0 || to < 0) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onReorder(next);
  }
  return (
    <>
      <ul className="ah-rank-list">
        {items.length ? (
          items.map((id, index) => (
            <li
              key={id}
              className="ah-rank-item"
              draggable
              onDragStart={() => {
                dragIndex.current = index;
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                move(dragIndex.current, index);
                dragIndex.current = null;
              }}
            >
              <span className="ah-rank-handle">☰</span>
              <strong className="ah-rank-label">
                <span className="muted">#{index + 1}</span>{" "}
                {icons?.[id] ? (
                  <FlatStatBadge id={id} label={labels?.[id]} />
                ) : (
                  labels?.[id] || id
                )}
              </strong>
              {onRemove ? (
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => onRemove(id)}
                >
                  ✕
                </button>
              ) : null}
            </li>
          ))
        ) : (
          <li className="muted">{empty}</li>
        )}
      </ul>
    </>
  );
}

function HeroCatalogModal({
  setup,
  presets,
  onSave,
  onSavePreset,
  onDeletePreset,
  onDeleteSetup,
  onClose,
}) {
  const initial = defaultHeroSetup(setup || {});
  const [heroId, setHeroId] = useState(initial.heroId || AUCTION_HEROES[0]?.id);
  const [setupName, setSetupName] = useState(initial.name || "Setup");
  const [preferredStats, setPreferredStats] = useState([
    ...(initial.preferredStats || []),
  ]);
  const [flatRank, setFlatRank] = useState(normalizeFlatRank(initial));
  const [importance, setImportance] = useState(initial.importance || 5);
  const [presetId, setPresetId] = useState("");
  const [presetName, setPresetName] = useState("");
  const editing = Boolean(setup?.id);
  const hero = auctionHeroOf(heroId);
  const pool = CATALOG_STAT_OPTIONS.filter((s) => !preferredStats.includes(s));
  const list = Array.isArray(presets) ? presets : [];
  const flatLabels = Object.fromEntries(
    FLAT_PRIORITIES.map((f) => [f.id, f.label])
  );

  function applyPreset(id) {
    const preset = list.find((p) => p.id === id);
    if (!preset) return;
    const next = catalogPresetToPref(preset, heroId);
    setPreferredStats([...(next.preferredStats || [])]);
    setFlatRank(normalizeFlatRank(next));
    setImportance(next.importance || 5);
    if (!setupName || setupName === "Setup") {
      setSetupName(preset.name || "Setup");
    }
    setPresetId(id);
    setPresetName(preset.name || "");
  }

  function currentSetup() {
    return {
      id: setup?.id,
      heroId,
      name: setupName.trim() || "Setup",
      preferredStats,
      flatRank,
      importance,
    };
  }

  return (
    <Modal
      title={editing ? "Edit setup" : "New setup"}
      onClose={onClose}
      footer={
        <>
          {editing ? (
            <button
              type="button"
              className="gold-btn"
              onClick={() => onDeleteSetup(setup.id)}
            >
              Delete setup
            </button>
          ) : null}
          <button
            type="button"
            className="tan-btn"
            disabled={!heroId}
            onClick={() => onSave(currentSetup())}
          >
            Save set up
          </button>
        </>
      }
    >
      <div className="ah-catalog-hero-head">
        {hero ? <img src={hero.icon} alt="" /> : null}
        <div>
          <label className="ah-field">
            <span>Setup name</span>
            <input
              type="text"
              maxLength={40}
              placeholder="Damage / Support / …"
              value={setupName}
              onChange={(e) => setSetupName(e.target.value)}
            />
          </label>
          <p className="muted">
            Imp {importance}/10 · {flatRankLabel(flatRank)}
          </p>
        </div>
      </div>

      <div className="ah-field">
        <span>Hero</span>
        <div className="ah-hero-grid-wrap">
          <div className="ah-hero-grid">
            {AUCTION_HEROES.map((h) => (
              <button
                key={h.id}
                type="button"
                className={`ah-hero-pick${heroId === h.id ? " on" : ""}`}
                onClick={() => setHeroId(h.id)}
              >
                <img src={h.icon} alt="" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ah-preset-box">
        <h4>Presets</h4>
        <p className="muted">
          Load a template, or save this Damage/Support setup as a preset.
        </p>
        <div className="ah-preset-row">
          <label className="ah-field ah-preset-select">
            <span>Use preset</span>
            <select
              value={presetId}
              onChange={(e) => {
                const id = e.target.value;
                setPresetId(id);
                if (id) applyPreset(id);
              }}
            >
              <option value="">Select preset…</option>
              {list.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · Imp {p.importance} · {flatRankLabel(p.flatRank)}
                </option>
              ))}
            </select>
          </label>
          {presetId ? (
            <button
              type="button"
              className="gold-btn"
              onClick={() => {
                onDeletePreset(presetId);
                setPresetId("");
                setPresetName("");
              }}
            >
              Delete preset
            </button>
          ) : null}
        </div>
        <div className="ah-preset-row">
          <label className="ah-field ah-preset-name">
            <span>Save current as preset</span>
            <input
              type="text"
              maxLength={48}
              placeholder="e.g. Support speed / DPS GK"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="tan-btn"
            onClick={() => {
              const name = presetName.trim();
              if (!name) return;
              const existing = list.find((p) => p.id === presetId);
              const saved = onSavePreset({
                id: existing?.id,
                name,
                preferredStats,
                flatRank,
                importance,
              });
              if (saved?.id) {
                setPresetId(saved.id);
                setPresetName(saved.name);
              }
            }}
          >
            Save preset
          </button>
        </div>
      </div>

      <label className="ah-field">
        <span>Importance (1–10)</span>
        <div className="ah-importance-row">
          <input
            type="range"
            min={1}
            max={10}
            value={importance}
            onChange={(e) => setImportance(Number(e.target.value) || 5)}
          />
          <strong>{importance}</strong>
        </div>
      </label>

      <div className="ah-catalog-ranks">
        <h4 className="ah-flat-title">
          <FlatStatBadge id="attack" />
          <FlatStatBadge id="hp" />
          <FlatStatBadge id="speed" />
          <span className="muted">(top = best)</span>
        </h4>
        <p className="muted">Drag to rank hard flats for this role.</p>
        <RankList
          items={flatRank}
          labels={flatLabels}
          icons={FLAT_STAT_ICONS}
          onReorder={(next) => setFlatRank(normalizeFlatRank(next))}
          empty="—"
        />
      </div>

      <div className="ah-catalog-ranks">
        <h4>Preferred % (top = best)</h4>
        <p className="muted">
          Keep Damage and Support lists separate — don’t mix roles on one setup.
        </p>
        <RankList
          items={preferredStats}
          onReorder={setPreferredStats}
          onRemove={(stat) =>
            setPreferredStats((stats) => stats.filter((s) => s !== stat))
          }
          empty="No preferred % yet — tap stats below."
        />
        <div className="ah-stat-pool">
          {pool.map((stat) => (
            <button
              key={stat}
              type="button"
              className="ah-stat-chip"
              onClick={() =>
                setPreferredStats((stats) =>
                  stats.includes(stat) ? stats : [...stats, stat]
                )
              }
            >
              + {stat}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function BiddingDraftFields({ draft, onChange, state, onSetupMore }) {
  const need = auctionBonusSlots(draft.rarity);
  const pool = auctionBonusPool(draft.rarity);
  const bonuses = Array.from(
    { length: need },
    (_, i) => draft.bonuses?.[i] || { stat: "", value: 0 }
  );
  const unset = draft.heroId && !isHeroSetUp(state, draft.heroId);

  return (
    <>
      <HeroPickGrid
        value={draft.heroId}
        onChange={(heroId) => onChange({ ...draft, heroId })}
        state={state}
        onSetupMore={onSetupMore}
      />
      {unset ? (
        <p className="ah-setup-warn" role="alert">
          Pick a set-up hero above, or open Catalog to add this one.
        </p>
      ) : null}
      <div className="ah-rarity-row">
        {AUCTION_RARITIES.map((r) => (
          <button
            key={r}
            type="button"
            className={`ah-rarity-chip${draft.rarity === r ? " on" : ""}`}
            style={{
              "--ah-rarity": AUCTION_RARITY_META[r]?.color || "#8a5a2a",
            }}
            onClick={() => onChange(draftWithRarity(draft, r))}
          >
            {r}
          </button>
        ))}
      </div>
      {need ? (
        <div className="ah-bonus-stack">
          {bonuses.map((bonus, index) => (
            <label key={index} className="ah-field ah-bonus-pick">
              <select
                value={bonus.stat || ""}
                onChange={(e) =>
                  onChange(setDraftBonus(draft, index, e.target.value))
                }
              >
                <option value="">Select…</option>
                {pool.map((stat) => {
                  const used = bonuses.some(
                    (b, i) => i !== index && b.stat === stat
                  );
                  const tableVal = awakeningStatValue(draft.rarity, stat);
                  return (
                    <option key={stat} value={stat} disabled={used}>
                      {stat}
                      {tableVal != null ? ` (+${tableVal}%)` : ""}
                    </option>
                  );
                })}
              </select>
            </label>
          ))}
        </div>
      ) : (
        <p className="muted">This rank has no % bonus rolls.</p>
      )}
      <div className="ah-flat-row">
        <label className="ah-field">
          <span>
            <FlatStatBadge id="speed" />
          </span>
          <select
            value={draft.speed ?? ""}
            onChange={(e) => onChange({ ...draft, speed: e.target.value })}
          >
            {awakeningSpeedChoices(draft.rarity).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="ah-field">
          <span>
            <FlatStatBadge id="attack" />
          </span>
          <input
            type="number"
            min={0}
            value={draft.attack ?? ""}
            onChange={(e) => onChange({ ...draft, attack: e.target.value })}
          />
        </label>
        <label className="ah-field">
          <span>
            <FlatStatBadge id="hp" label="HP" />
          </span>
          <input
            type="number"
            min={0}
            value={draft.hp ?? ""}
            onChange={(e) => onChange({ ...draft, hp: e.target.value })}
          />
        </label>
      </div>
      <label className="ah-field">
        <span>Note (optional)</span>
        <input
          type="text"
          value={draft.note || ""}
          onChange={(e) => onChange({ ...draft, note: e.target.value })}
        />
      </label>
    </>
  );
}

function CopyCard({
  copy,
  state,
  now = Date.now(),
  meta = null,
  footer = null,
  onEdit = null,
}) {
  const hero = auctionHeroOf(copy.heroId);
  const alerts = copyAlerts(copy, state, now);
  const rarity = copy.rarity || "?";
  const rarityColor = AUCTION_RARITY_META[rarity]?.color || "#f4c430";
  const long = String(rarity).length >= 3;
  const bonuses = auctionBonusList(copy).filter((b) => b?.stat);
  const [durationMode, setDurationMode] = useState("days");

  return (
    <article
      className={`ah-card${onEdit ? " ah-card-editable" : ""}`}
      onClick={onEdit || undefined}
      title={onEdit ? "Tap to edit" : undefined}
    >
      <div className="ah-card-top">
        <img src={hero?.icon} alt="" className="ah-card-icon" />
        <div className="ah-card-flats">
          <div className="ah-stat-row">
            <FlatStatBadge id="attack" label="Atk" className="muted" />
            <strong>{formatSg(copy.attack || 0)}</strong>
          </div>
          <div className="ah-stat-row">
            <FlatStatBadge id="hp" label="HP" className="muted" />
            <strong>{formatSg(copy.hp || 0)}</strong>
          </div>
          <div className="ah-stat-row">
            <FlatStatBadge id="speed" label="Spd" className="muted" />
            <strong>{formatSg(copy.speed || 0)}</strong>
          </div>
        </div>
        <div
          className={`ah-card-rarity sc-awaken-btn filled${long ? " long" : ""}`}
          style={{ "--sc-awaken-color": rarityColor }}
          title={`Awakening · ${rarity}`}
        >
          <span>{rarity}</span>
        </div>
      </div>

      <ul className="ah-card-pcts">
        {bonuses.length ? (
          bonuses.map((b, i) => (
            <li key={`${b.stat}-${i}`}>
              <span>{b.stat}</span>
              <strong>+{b.value}%</strong>
            </li>
          ))
        ) : (
          <li className="muted">No % bonuses</li>
        )}
      </ul>

      {meta}

      {alerts.length ? (
        <ul className="ah-card-alerts">
          {alerts.map((a, i) =>
            a.type === "cooldown" && Number.isFinite(a.remainingMs) ? (
              <li key={`${a.type}-${i}`}>
                <button
                  type="button"
                  className={`ah-alert ah-alert-${a.tone} ah-alert-toggle`}
                  title={
                    durationMode === "days"
                      ? "Tap to show total hours"
                      : "Tap to show days + hours"
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    setDurationMode((m) => (m === "days" ? "hours" : "days"));
                  }}
                >
                  Sell unlocks in{" "}
                  {formatDuration(a.remainingMs, durationMode)}
                </button>
              </li>
            ) : (
              <li
                key={`${a.type}-${i}`}
                className={`ah-alert ah-alert-${a.tone}`}
              >
                {a.text}
              </li>
            )
          )}
        </ul>
      ) : null}

      {footer ? (
        <div
          className="ah-card-actions"
          onClick={(e) => e.stopPropagation()}
        >
          {footer}
        </div>
      ) : null}
    </article>
  );
}

export default function AuctionHouse() {
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const { state, setState, loaded } = useAuctionHouse();
  const [tab, setTab] = useState("biddings");
  const [picker, setPicker] = useState(null);
  const [catalogEditor, setCatalogEditor] = useState(null);
  const [tick, setTick] = useState(() => Date.now());
  const [creatorDb, setCreatorDb] = useState(null);
  const [creatorDbError, setCreatorDbError] = useState("");
  const [creatorDbLoading, setCreatorDbLoading] = useState(false);
  const isCreator = Boolean(user?.isCreator);

  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const summary = useMemo(() => auctionSummary(state), [state]);
  const alerts = useMemo(() => boardAlerts(state, tick), [state, tick]);
  const catalogSetups = state.heroSetups || [];

  async function loadCreatorDb() {
    setCreatorDbLoading(true);
    setCreatorDbError("");
    try {
      const payload = await api.getAuctionHouseAll();
      setCreatorDb(payload.users || []);
    } catch (err) {
      setCreatorDb(null);
      setCreatorDbError(err?.message || "Could not load auction database.");
    } finally {
      setCreatorDbLoading(false);
    }
  }

  if (!loaded) {
    return (
      <div className="sky-page">
        <div className="shell">
          <p className="muted" style={{ padding: 24 }}>
            Opening Auction House...
          </p>
        </div>
      </div>
    );
  }

  function renderPicker() {
    if (!picker) return null;

    if (picker.type === "add-bid" || picker.type === "edit-copy") {
      const draft = picker.draft || emptyBiddingDraft();
      const editing = picker.type === "edit-copy";
      const canSave =
        editing || (draft.heroId && isHeroSetUp(state, draft.heroId));
      return (
        <Modal
          title={editing ? "Edit copy" : "Add bidding"}
          onClose={() => setPicker(null)}
          footer={
            <button
              type="button"
              className="tan-btn"
              disabled={!canSave}
              onClick={() => {
                if (!canSave) return;
                if (editing) {
                  const stage = picker.stage || "bidding";
                  setState((s) => {
                    if (stage === "bag") return updateBagCopy(s, picker.id, draft);
                    if (stage === "listing")
                      return updateListingCopy(s, picker.id, draft);
                    return updateBidding(s, picker.id, draft);
                  });
                } else {
                  setState((s) => addBidding(s, draft));
                  setTab("biddings");
                }
                setPicker(null);
              }}
            >
              {editing ? "Save" : "Add to biddings"}
            </button>
          }
        >
          <p className="muted sc-modal-lead">
            Hero, awakening rank, % rolls (auto values), Speed, Attack, HP.
          </p>
          <BiddingDraftFields
            draft={draft}
            state={state}
            onChange={(next) => setPicker({ ...picker, draft: next })}
            onSetupMore={() => {
              setPicker(null);
              setTab("catalog");
            }}
          />
          {editing && picker.stage === "bag" ? (
            <label className="ah-field">
              <span>Bought at</span>
              <input
                type="datetime-local"
                value={toDatetimeLocalValue(draft.boughtAt)}
                onChange={(e) =>
                  setPicker({
                    ...picker,
                    draft: {
                      ...draft,
                      boughtAt: fromDatetimeLocalValue(e.target.value),
                    },
                  })
                }
              />
              <span className="muted ah-field-hint">
                Sell unlock is 7 days from this time.
              </span>
            </label>
          ) : null}
        </Modal>
      );
    }

    if (picker.type === "bid-failed") {
      const copy = state.biddings.find((c) => c.id === picker.id);
      if (!copy) return null;
      const failPrice = Number(picker.price) || 0;
      const advice = bidFailAdvice(copy, failPrice, state, tick);
      return (
        <Modal
          title={`Bid failed · ${copyTitle(copy)}`}
          onClose={() => setPicker(null)}
          footer={
            <button
              type="button"
              className="tan-btn"
              disabled={!(failPrice > 0)}
              onClick={() => {
                setState((s) =>
                  failBidding(
                    s,
                    copy.id,
                    failPrice,
                    fromDatetimeLocalValue(picker.when)
                  )
                );
                setPicker(null);
                setTab("history");
              }}
            >
              Log bid failed
            </button>
          }
        >
          <p className="muted sc-modal-lead">
            Enter the price the auction cleared at (winning bid). Logged as a
            counterfactual buy cost for the calculator.
          </p>
          <label className="ah-field">
            <span>Failed at (SG)</span>
            <input
              type="number"
              min={1}
              value={picker.price ?? ""}
              onChange={(e) => setPicker({ ...picker, price: e.target.value })}
            />
          </label>
          {failPrice > 0 ? (
            <div
              className={`ah-flip-grade ah-flip-${
                advice.verdict === "should_push"
                  ? "warn"
                  : advice.verdict === "good_stop"
                    ? "good"
                    : "muted"
              }`}
            >
              <strong>{advice.label}</strong>
              <span className="muted">
                Max {advice.maxBid != null ? formatSg(advice.maxBid) : "—"} ·
                suggest{" "}
                {advice.suggestBid != null ? formatSg(advice.suggestBid) : "—"}{" "}
                · expect sell{" "}
                {advice.expectSell != null ? formatSg(advice.expectSell) : "—"}
                {advice.marginIfBought != null
                  ? ` · if bought ~${Math.round(advice.marginIfBought)}% net`
                  : ""}
              </span>
            </div>
          ) : null}
          {failPrice > 0 && advice.reasons?.length ? (
            <ul className="ah-bidfail-reasons">
              {advice.reasons.map((r, i) => (
                <li key={i} className="muted">
                  {r}
                </li>
              ))}
            </ul>
          ) : null}
          <label className="ah-field">
            <span>When</span>
            <input
              type="datetime-local"
              value={picker.when}
              onChange={(e) => setPicker({ ...picker, when: e.target.value })}
            />
          </label>
        </Modal>
      );
    }

    if (picker.type === "buy") {
      const copy = state.biddings.find((c) => c.id === picker.id);
      if (!copy) return null;
      const flip = evaluateFlip(copy, state, tick);
      const buyPrice = Number(picker.price) || 0;
      return (
        <Modal
          title={`Bought · ${copyTitle(copy)}`}
          onClose={() => setPicker(null)}
          footer={
            <button
              type="button"
              className="tan-btn"
              onClick={() => {
                setState((s) =>
                  buyBidding(
                    s,
                    copy.id,
                    buyPrice,
                    fromDatetimeLocalValue(picker.when)
                  )
                );
                setPicker(null);
                setTab("bag");
              }}
            >
              Move to bag
            </button>
          }
        >
          <div className={`ah-flip-grade ah-flip-${flip.tone}`}>
            <strong>{flip.label}</strong>
            <span className="muted">
              Max bid{" "}
              {flip.maxBid != null ? formatSg(flip.maxBid) : "—"} · suggest{" "}
              {flip.suggestBid != null ? formatSg(flip.suggestBid) : "—"} ·
              expect sell{" "}
              {flip.suggestList != null ? formatSg(flip.suggestList) : "—"}
            </span>
          </div>
          <label className="ah-field">
            <span>Buy price (SG)</span>
            <input
              type="number"
              min={0}
              value={picker.price ?? ""}
              onChange={(e) => setPicker({ ...picker, price: e.target.value })}
            />
          </label>
          {flip.maxBid != null && buyPrice > flip.maxBid ? (
            <p className="ah-alert ah-alert-warn">
              Above Max bid — expected net margin may miss the{" "}
              {flip.targetMarginPct}% target.
            </p>
          ) : null}
          <label className="ah-field">
            <span>Bought at</span>
            <input
              type="datetime-local"
              value={picker.when}
              onChange={(e) => setPicker({ ...picker, when: e.target.value })}
            />
          </label>
          <p className="muted">
            7-day sell cooldown starts from this time. Floor after buy:{" "}
            <Sg
              value={minListPrice(buyPrice, {
                ...state.settings,
                pricingMode: "margin",
                minMarginPct: flip.targetMarginPct,
              })}
            />
          </p>
        </Modal>
      );
    }

    if (picker.type === "list") {
      const copy = state.bag.find((c) => c.id === picker.id);
      if (!copy) return null;
      const tip = suggestListPrice(copy, state, tick);
      return (
        <Modal
          title={`List · ${copyTitle(copy)}`}
          onClose={() => setPicker(null)}
          footer={
            <button
              type="button"
              className="tan-btn"
              onClick={() => {
                setState((s) =>
                  listFromBag(
                    s,
                    copy.id,
                    Number(picker.price) || tip.suggested,
                    fromDatetimeLocalValue(picker.when)
                  )
                );
                setPicker(null);
                setTab("listings");
              }}
            >
              List copy
            </button>
          }
        >
          <p className="muted sc-modal-lead">
            Bought for <Sg value={copy.buyPrice} /> · min{" "}
            <Sg value={tip.floor} /> · suggest <Sg value={tip.suggested} />{" "}
            (keeps {(SELL_COMMISSION * 100).toFixed(0)}% commission in mind)
          </p>
          {tip.related.length ? (
            <div className="ah-history-hint">
              <strong>Similar sold</strong>
              <ul>
                {tip.related.map((h) => (
                  <li key={h.id}>
                    {h.rarity} bought {formatSg(h.buyPrice)} → sold{" "}
                    {formatSg(h.soldPrice)} (
                    {h.buyPrice
                      ? `${Math.round((h.soldPrice / h.buyPrice - 1) * 100)}%`
                      : "—"}
                    )
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {tip.failedTries.length ? (
            <div className="ah-history-hint warn">
              <strong>Failed list tries</strong>
              <ul>
                {tip.failedTries.map((t, i) => (
                  <li key={i}>
                    {formatSg(t.price)} SG · {formatWhen(t.at)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <label className="ah-field">
            <span>List price (SG)</span>
            <input
              type="number"
              min={0}
              value={picker.price ?? tip.suggested}
              onChange={(e) => setPicker({ ...picker, price: e.target.value })}
            />
          </label>
          <label className="ah-field">
            <span>Listed at</span>
            <input
              type="datetime-local"
              value={picker.when}
              onChange={(e) => setPicker({ ...picker, when: e.target.value })}
            />
          </label>
          <p className="muted">
            6h warmup, then 2 days of bidding. You receive ~{" "}
            <Sg
              value={netFromListPrice(
                Number(picker.price) || tip.suggested
              )}
            />{" "}
            after commission.
          </p>
        </Modal>
      );
    }

    if (picker.type === "sell") {
      const copy = state.listings.find((c) => c.id === picker.id);
      if (!copy) return null;
      return (
        <Modal
          title={`Sold · ${copyTitle(copy)}`}
          onClose={() => setPicker(null)}
          footer={
            <button
              type="button"
              className="tan-btn"
              onClick={() => {
                setState((s) =>
                  sellListing(
                    s,
                    copy.id,
                    Number(picker.price) || copy.listPrice,
                    fromDatetimeLocalValue(picker.when)
                  )
                );
                setPicker(null);
                setTab("history");
              }}
            >
              Save to history
            </button>
          }
        >
          <label className="ah-field">
            <span>Sold for (SG list price)</span>
            <input
              type="number"
              min={0}
              value={picker.price ?? copy.listPrice}
              onChange={(e) => setPicker({ ...picker, price: e.target.value })}
            />
          </label>
          <label className="ah-field">
            <span>Sold at</span>
            <input
              type="datetime-local"
              value={picker.when}
              onChange={(e) => setPicker({ ...picker, when: e.target.value })}
            />
          </label>
          <p className="muted">
            Net after 5%:{" "}
            <Sg
              value={netFromListPrice(Number(picker.price) || copy.listPrice)}
            />{" "}
            · profit vs buy{" "}
            <Sg
              value={
                netFromListPrice(Number(picker.price) || copy.listPrice) -
                copy.buyPrice
              }
            />
          </p>
        </Modal>
      );
    }

    return null;
  }

  return (
    <div className="sky-page">
      <div className="shell ah-shell">
        <div className="shell-head">
          <div className="brand">
            <div className="head-with-help">
              <h1>Auction House</h1>
              <HelpTip
                title="Auction House Accounting"
                steps={[
                  "Catalog: set each hero’s preferred % order, Attack/HP/Speed priority, and importance 1–10.",
                  "Settings: pick Safe Bootstrap, Volume Grinder, or Meta Sniper — margins, hammer strictness, and importance floors differ.",
                  "My Biddings grades use strategy + catalog + history comps (Attack/%). Never bid past Max bid.",
                  "Bid failed: log the clear price — calculator scores if you should have pushed, and uses lost bids as comps.",
                  "Hammers are scarce: prefer copies that already match prefs. Log Sold and failed lists to teach ceilings.",
                ]}
              />
            </div>
            <p>
              Track bids, bag cooldown, listings, and SG profit after 5%
              commission.
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

        <div className="shell-body no-sidebar">
          <section className="main-panel calc-panel ah-panel">
            {alerts.length ? (
              <div className="ah-banner">
                {alerts.slice(0, 6).map((a, i) => (
                  <button
                    key={`${a.copy.id}-${a.type}-${i}`}
                    type="button"
                    className={`ah-banner-item ah-alert-${a.tone}`}
                    onClick={() => {
                      if (a.type === "ready") setTab("bag");
                      else setTab("listings");
                    }}
                  >
                    <img
                      src={auctionHeroOf(a.copy.heroId)?.icon}
                      alt=""
                      className="ah-banner-icon"
                    />
                    <span>
                      <strong>{copyTitle(a.copy)}</strong> — {a.text}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}

            <nav className="ah-tabs">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`ah-tab${tab === t.id ? " on" : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                  {t.id === "biddings" && state.biddings.length
                    ? ` (${state.biddings.length})`
                    : ""}
                  {t.id === "bag" && state.bag.length
                    ? ` (${state.bag.length})`
                    : ""}
                  {t.id === "listings" && state.listings.length
                    ? ` (${state.listings.length})`
                    : ""}
                </button>
              ))}
            </nav>

            <div className="ah-main">
          {tab === "biddings" ? (
            <section className="ah-section">
              <div className="ah-section-head">
                <h2>My Biddings</h2>
                <button
                  type="button"
                  className="tan-btn"
                  onClick={() => {
                    const heroId = firstSetUpHeroId(state);
                    if (!heroId) {
                      setTab("catalog");
                      return;
                    }
                    setPicker({
                      type: "add-bid",
                      draft: emptyBiddingDraft("A", heroId),
                    });
                  }}
                >
                  +
                </button>
              </div>
              {!state.biddings.length ? (
                <p className="muted">
                  No active biddings. Tap + to track a copy.
                </p>
              ) : (
                <div className="ah-card-grid">
                  {state.biddings.map((copy) => {
                    const flip = evaluateFlip(copy, state, tick);
                    return (
                    <CopyCard
                      key={copy.id}
                      copy={copy}
                      state={state}
                      now={tick}
                      onEdit={() =>
                        setPicker({
                          type: "edit-copy",
                          stage: "bidding",
                          id: copy.id,
                          draft: copyToDraft(copy),
                        })
                      }
                      meta={
                        <>
                          <div
                            className={`ah-flip-grade ah-flip-${flip.tone}`}
                            title={flip.reasons.join(" · ")}
                          >
                            <strong>{flip.label}</strong>
                            <span className="muted">
                              {flip.phase} · {flip.difficulty} sell ·{" "}
                              {flip.samples} comps
                            </span>
                          </div>
                          <div className="ah-flip-prices">
                            {flip.maxBid != null ? (
                              <div className="ah-card-money">
                                <span className="muted">Max bid</span>
                                <Sg value={flip.maxBid} />
                              </div>
                            ) : null}
                            {flip.suggestBid != null ? (
                              <div className="ah-card-money">
                                <span className="muted">Suggest bid</span>
                                <Sg value={flip.suggestBid} />
                              </div>
                            ) : (
                              <p className="muted ah-card-date">
                                No bid yet — need sold comps for this hero
                              </p>
                            )}
                            {flip.suggestList != null ? (
                              <div className="ah-card-money">
                                <span className="muted">Expect sell</span>
                                <Sg value={flip.suggestList} />
                                {flip.expectedMarginPct != null ? (
                                  <span className="muted">
                                    (~{Math.round(flip.expectedMarginPct)}% net
                                    @ suggest)
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                          <p className="muted ah-card-date">
                            Target margin {flip.targetMarginPct}% · Added{" "}
                            {formatWhen(copy.createdAt)}
                          </p>
                        </>
                      }
                      footer={
                        <>
                          <button
                            type="button"
                            className="gold-btn"
                            onClick={() =>
                              setPicker({
                                type: "buy",
                                id: copy.id,
                                price:
                                  flip.suggestBid != null
                                    ? String(flip.suggestBid)
                                    : "",
                                when: toDatetimeLocalValue(),
                              })
                            }
                          >
                            Bought for…
                          </button>
                          <button
                            type="button"
                            className="gold-btn"
                            title="Log the clear price you lost at"
                            onClick={() =>
                              setPicker({
                                type: "bid-failed",
                                id: copy.id,
                                price:
                                  flip.suggestBid != null
                                    ? String(flip.suggestBid)
                                    : flip.maxBid != null
                                      ? String(flip.maxBid)
                                      : "",
                                when: toDatetimeLocalValue(),
                              })
                            }
                          >
                            Bid failed
                          </button>
                        </>
                      }
                    />
                    );
                  })}
                </div>
              )}
            </section>
          ) : null}

          {tab === "bag" ? (
            <section className="ah-section">
              <h2>Bag</h2>
              {!state.bag.length ? (
                <p className="muted">No copies in bag yet.</p>
              ) : (
                <div className="ah-card-grid">
                  {state.bag.map((copy) => {
                    const ready = bagReadyAt(copy);
                    const canList = ready == null || tick >= ready;
                    const tip = suggestListPrice(copy, state, tick);
                    return (
                      <CopyCard
                        key={copy.id}
                        copy={copy}
                        state={state}
                        now={tick}
                        onEdit={() =>
                          setPicker({
                            type: "edit-copy",
                            stage: "bag",
                            id: copy.id,
                            draft: copyToDraft(copy),
                          })
                        }
                        meta={
                          <>
                            <div className="ah-card-money">
                              <span className="muted">Bought</span>
                              <Sg value={copy.buyPrice} />
                            </div>
                            <p className="muted ah-card-date">
                              {formatWhen(copy.boughtAt)}
                            </p>
                            <div className="ah-card-money muted">
                              <span>Suggest</span>
                              <Sg value={tip.suggested} />
                              <span>(min</span>
                              <Sg value={tip.floor} />
                              <span>)</span>
                            </div>
                            <label
                              className="ah-hammer-field"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <img
                                src={HAMMER_ICON}
                                alt=""
                                className="ah-hammer-icon"
                              />
                              <span className="muted">Hammers used</span>
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={copy.hammersUsed || 0}
                                onChange={(e) =>
                                  setState((s) =>
                                    setHammersUsed(s, copy.id, e.target.value)
                                  )
                                }
                              />
                            </label>
                            {copy.tries?.length ? (
                              <p className="muted">
                                Failed tries:{" "}
                                {copy.tries
                                  .map((t) => formatSg(t.price))
                                  .join(", ")}{" "}
                                SG
                              </p>
                            ) : null}
                          </>
                        }
                        footer={
                          <>
                            <button
                              type="button"
                              className="tan-btn"
                              title="Back to My Biddings"
                              onClick={() => {
                                setState((s) => returnBagToBidding(s, copy.id));
                                setTab("biddings");
                              }}
                            >
                              ← Back
                            </button>
                            <button
                              type="button"
                              className="gold-btn"
                              disabled={!canList}
                              title={
                                canList
                                  ? "List copy"
                                  : `Ready in ${formatDuration(ready - tick)}`
                              }
                              onClick={() =>
                                setPicker({
                                  type: "list",
                                  id: copy.id,
                                  price: tip.suggested,
                                  when: toDatetimeLocalValue(),
                                })
                              }
                            >
                              List
                            </button>
                            <button
                              type="button"
                              className="ghost-btn"
                              title="Discard from bag"
                              onClick={() =>
                                setState((s) => discardBag(s, copy.id))
                              }
                            >
                              ✕
                            </button>
                          </>
                        }
                      />
                    );
                  })}
                </div>
              )}
            </section>
          ) : null}

          {tab === "listings" ? (
            <section className="ah-section">
              <h2>Listings</h2>
              {!state.listings.length ? (
                <p className="muted">Nothing listed right now.</p>
              ) : (
                <div className="ah-card-grid">
                  {state.listings.map((copy) => {
                    const phase = listingPhases(copy, tick);
                    return (
                      <CopyCard
                        key={copy.id}
                        copy={copy}
                        state={state}
                        now={tick}
                        onEdit={() =>
                          setPicker({
                            type: "edit-copy",
                            stage: "listing",
                            id: copy.id,
                            draft: copyToDraft(copy),
                          })
                        }
                        meta={
                          <>
                            <div className="ah-card-money">
                              <span className="muted">Listed</span>
                              <Sg value={copy.listPrice} />
                            </div>
                            <p className="muted ah-card-date">
                              {formatWhen(copy.listedAt)}
                            </p>
                            <p className="muted">
                              Phase: {phase.phase}
                              {phase.phase === "auction"
                                ? ` · ends ${formatWhen(phase.auctionEndsAt)}`
                                : ""}
                              {phase.phase === "warmup"
                                ? ` · bidding ${formatWhen(phase.warmupEndsAt)}`
                                : ""}
                            </p>
                            {copy.hammersUsed ? (
                              <div className="ah-card-money muted">
                                <span>Hammers</span>
                                <HammerAmt value={copy.hammersUsed} />
                              </div>
                            ) : null}
                          </>
                        }
                        footer={
                          <>
                            <button
                              type="button"
                              className="tan-btn"
                              title="Back to Bag"
                              onClick={() => {
                                setState((s) =>
                                  returnListingToBag(s, copy.id)
                                );
                                setTab("bag");
                              }}
                            >
                              ← Back
                            </button>
                            <button
                              type="button"
                              className="gold-btn"
                              onClick={() =>
                                setPicker({
                                  type: "sell",
                                  id: copy.id,
                                  price: copy.listPrice,
                                  when: toDatetimeLocalValue(),
                                })
                              }
                            >
                              Sold for…
                            </button>
                            <button
                              type="button"
                              className="ghost-btn"
                              title="Didn't sell — record try, back to bag"
                              onClick={() =>
                                setState((s) => failListing(s, copy.id))
                              }
                            >
                              ✕
                            </button>
                          </>
                        }
                      />
                    );
                  })}
                </div>
              )}
            </section>
          ) : null}

          {tab === "history" ? (
            <section className="ah-section">
              <h2>History</h2>
              {!state.history.length ? (
                <p className="muted">No sold / discarded copies yet.</p>
              ) : (
                <div className="ah-table-wrap">
                  <table className="ah-table">
                    <thead>
                      <tr>
                        <th>Copy</th>
                        <th>Buy</th>
                        <th>Sold</th>
                        <th>Net</th>
                        <th>Hold</th>
                        <th>Uplift</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.history.map((copy) => {
                        const bidFailed = copy.outcome === "bid_failed";
                        const net =
                          copy.outcome === "sold"
                            ? netFromListPrice(copy.soldPrice)
                            : 0;
                        const hold =
                          !bidFailed && copy.boughtAt && copy.soldAt
                            ? new Date(copy.soldAt) - new Date(copy.boughtAt)
                            : null;
                        const uplift =
                          copy.outcome === "sold" && copy.buyPrice
                            ? (copy.soldPrice / copy.buyPrice - 1) * 100
                            : null;
                        const hero = auctionHeroOf(copy.heroId);
                        const pushLabel =
                          copy.pushVerdict === "should_push"
                            ? "Should have pushed"
                            : copy.pushVerdict === "good_stop"
                              ? "Good to stop"
                              : copy.pushVerdict === "borderline"
                                ? "Borderline"
                                : null;
                        return (
                          <tr key={copy.id}>
                            <td>
                              <div className="ah-table-hero">
                                <img src={hero?.icon} alt="" />
                                <div>
                                  <strong>{copy.rarity || "Copy"}</strong>
                                  <div className="muted">
                                    {bidFailed
                                      ? `Bid failed${
                                          pushLabel ? ` · ${pushLabel}` : ""
                                        }`
                                      : copy.outcome === "sold"
                                        ? formatBonuses(copy)
                                        : "Discarded"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <Sg
                                value={
                                  bidFailed
                                    ? copy.failPrice || copy.buyPrice
                                    : copy.buyPrice
                                }
                              />
                            </td>
                            <td>
                              {copy.outcome === "sold" ? (
                                <Sg value={copy.soldPrice} />
                              ) : bidFailed ? (
                                <span className="muted">Lost</span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>
                              {copy.outcome === "sold" ? (
                                <Sg value={net} />
                              ) : bidFailed &&
                                copy.counterfactualMarginPct != null ? (
                                <span className="muted">
                                  ~{Math.round(copy.counterfactualMarginPct)}%
                                  if bought
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>{hold != null ? formatDuration(hold) : "—"}</td>
                            <td>
                              {uplift != null
                                ? `${uplift >= 0 ? "+" : ""}${uplift.toFixed(0)}%`
                                : bidFailed && copy.maxBidAtFail
                                  ? `Max was ${formatSg(copy.maxBidAtFail)}`
                                  : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : null}

          {tab === "catalog" ? (
            <section className="ah-section">
              <div className="ah-catalog-head">
                <div>
                  <h2>Hero catalog</h2>
                  <p className="muted">
                    Add separate setups for the same hero (Damage vs Support).
                    Rank Attack/HP/Speed and % prefs per setup. Presets are
                    templates you can reuse.
                  </p>
                </div>
                <button
                  type="button"
                  className="tan-btn ah-catalog-add"
                  onClick={() => setCatalogEditor({ mode: "new" })}
                  title="Add setup"
                >
                  +
                </button>
              </div>

              {(state.catalogPresets || []).length ? (
                <div className="ah-preset-strip">
                  <h3>
                    Presets{" "}
                    <span className="muted">
                      ({state.catalogPresets.length})
                    </span>
                  </h3>
                  <ul className="ah-preset-chips">
                    {state.catalogPresets.map((p) => (
                      <li key={p.id} className="ah-preset-chip">
                        <strong>{p.name}</strong>
                        <span className="muted">
                          Imp {p.importance} · {flatRankLabel(p.flatRank)}
                          {p.preferredStats?.[0]
                            ? ` · ${p.preferredStats.slice(0, 2).join(", ")}`
                            : ""}
                        </span>
                        <button
                          type="button"
                          className="ghost-btn"
                          title="Delete preset"
                          onClick={() =>
                            setState((s) => deleteCatalogPreset(s, p.id))
                          }
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="ah-catalog-group">
                <h3>
                  Setups{" "}
                  <span className="muted">({catalogSetups.length})</span>
                </h3>
                {catalogSetups.length ? (
                  <div className="ah-catalog-grid">
                    {catalogSetups.map((setup) => {
                      const hero = auctionHeroOf(setup.heroId);
                      return (
                        <button
                          key={setup.id}
                          type="button"
                          className="ah-catalog-card"
                          onClick={() =>
                            setCatalogEditor({ mode: "edit", setup })
                          }
                          title={`${setup.name} · Imp ${setup.importance}/10`}
                        >
                          <img src={hero?.icon} alt="" />
                          <div className="ah-catalog-card-meta">
                            <strong>{setup.name}</strong>
                            <span className="muted">
                              Imp {setup.importance}/10 ·{" "}
                              {flatRankLabel(setup.flatRank)}
                            </span>
                            <span className="muted">
                              {setup.preferredStats?.length
                                ? setup.preferredStats.slice(0, 3).join(" · ")
                                : "No % prefs yet"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      className="ah-catalog-card ah-catalog-card-add"
                      onClick={() => setCatalogEditor({ mode: "new" })}
                    >
                      <span className="ah-catalog-plus">+</span>
                      <div className="ah-catalog-card-meta">
                        <strong>Add setup</strong>
                        <span className="muted">
                          Same hero can have Damage and Support
                        </span>
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="ah-catalog-empty">
                    <p className="muted">
                      No setups yet. Add Damage, Support, or any role — even
                      multiple on the same hero.
                    </p>
                    <button
                      type="button"
                      className="tan-btn"
                      onClick={() => setCatalogEditor({ mode: "new" })}
                    >
                      + Add setup
                    </button>
                  </div>
                )}
              </div>
            </section>
          ) : null}

          {tab === "summary" ? (
            <section className="ah-section">
              <h2>Summary</h2>
              <div className="ah-summary-grid">
                <div className="ah-stat">
                  <span className="muted">Sold</span>
                  <strong>{summary.soldCount}</strong>
                </div>
                <div className="ah-stat">
                  <span className="muted">In bag</span>
                  <strong>{summary.bagCount}</strong>
                </div>
                <div className="ah-stat">
                  <span className="muted">Listed</span>
                  <strong>{summary.listingCount}</strong>
                </div>
                <div className="ah-stat">
                  <span className="muted">SG spent (sold)</span>
                  <Sg value={summary.spent} />
                </div>
                <div className="ah-stat">
                  <span className="muted">SG gross sales</span>
                  <Sg value={summary.gross} />
                </div>
                <div className="ah-stat">
                  <span className="muted">SG net after 5%</span>
                  <Sg value={summary.net} />
                </div>
                <div className="ah-stat">
                  <span className="muted">Profit</span>
                  <Sg value={summary.profit} />
                </div>
                <div className="ah-stat">
                  <span className="muted">Avg hold</span>
                  <strong>
                    {summary.avgHoldMs != null
                      ? formatDuration(summary.avgHoldMs)
                      : "—"}
                  </strong>
                </div>
                <div className="ah-stat">
                  <span className="muted">Avg list/buy uplift</span>
                  <strong>
                    {summary.avgUplift != null
                      ? `${summary.avgUplift >= 0 ? "+" : ""}${summary.avgUplift.toFixed(0)}%`
                      : "—"}
                  </strong>
                </div>
                <div className="ah-stat">
                  <span className="muted">Bag cost basis</span>
                  <Sg value={summary.bagValue} />
                </div>
                <div className="ah-stat">
                  <span className="muted">Hammers used</span>
                  <HammerAmt value={summary.hammersUsed} />
                </div>
              </div>
            </section>
          ) : null}

          {tab === "settings" ? (
            <section className="ah-section">
              <h2>Pricing settings</h2>
              <p className="muted">
                Pick a flip strategy, fill the Catalog, then let My Biddings
                grade copies. Margins below still override knobs; strategy sets
                the default cold/mature targets and hammer strictness.
              </p>
              <div className="ah-strategy-grid">
                {FLIP_STRATEGIES.map((s) => {
                  const on = (state.settings.strategyId || "safe_bootstrap") === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`ah-strategy-card${on ? " on" : ""}`}
                      onClick={() =>
                        setState((st) =>
                          patchSettings(st, {
                            strategyId: s.id,
                            bootstrapMarginPct: s.marginCold,
                            minMarginPct: s.marginMature,
                          })
                        )
                      }
                    >
                      <strong>{s.name}</strong>
                      <span className="muted">{s.tagline}</span>
                      <span className="muted">
                        Cold {s.marginCold}% · Mature {s.marginMature}% · Imp ≥
                        {s.importanceMin}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="ah-bootstrap-plan">
                <h3>
                  Active plan · {strategyOf(state.settings).name}
                </h3>
                <ol>
                  {flipBootstrapPlan(state.settings).map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
              <div className="ah-strategy-all">
                {FLIP_STRATEGIES.map((s) => (
                  <details key={s.id} className="ah-strategy-details">
                    <summary>
                      {s.name} — full plan
                    </summary>
                    <ol>
                      {s.plan.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </details>
                ))}
              </div>
              <div className="ah-settings">
                <label className="ah-field">
                  <span>Target mode</span>
                  <select
                    value={state.settings.pricingMode}
                    onChange={(e) =>
                      setState((s) =>
                        patchSettings(s, { pricingMode: e.target.value })
                      )
                    }
                  >
                    <option value="margin">Min margin %</option>
                    <option value="profit">Min profit SG</option>
                  </select>
                </label>
                {state.settings.pricingMode === "margin" ? (
                  <label className="ah-field">
                    <span>Mature margin %</span>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={state.settings.minMarginPct}
                      onChange={(e) =>
                        setState((s) =>
                          patchSettings(s, {
                            minMarginPct: Number(e.target.value) || 0,
                          })
                        )
                      }
                    />
                  </label>
                ) : (
                  <label className="ah-field">
                    <span>Min profit (SG)</span>
                    <input
                      type="number"
                      min={0}
                      value={state.settings.minProfitSg}
                      onChange={(e) =>
                        setState((s) =>
                          patchSettings(s, {
                            minProfitSg: Number(e.target.value) || 0,
                          })
                        )
                      }
                    />
                  </label>
                )}
                <label className="ah-field">
                  <span>Bootstrap margin %</span>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={state.settings.bootstrapMarginPct ?? 30}
                    onChange={(e) =>
                      setState((s) =>
                        patchSettings(s, {
                          bootstrapMarginPct: Number(e.target.value) || 0,
                        })
                      )
                    }
                  />
                  <span className="muted ah-field-hint">
                    Used while that hero is still cold/building history.
                  </span>
                </label>
                <label className="ah-field">
                  <span>Bootstrap until sold (per hero)</span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={state.settings.bootstrapSales ?? 8}
                    onChange={(e) =>
                      setState((s) =>
                        patchSettings(s, {
                          bootstrapSales: Number(e.target.value) || 8,
                        })
                      )
                    }
                  />
                </label>
                <label className="ah-field">
                  <span>Stale-list discount %</span>
                  <input
                    type="number"
                    min={0}
                    value={state.settings.staleDiscountPct}
                    onChange={(e) =>
                      setState((s) =>
                        patchSettings(s, {
                          staleDiscountPct: Number(e.target.value) || 0,
                        })
                      )
                    }
                  />
                </label>
                <label className="ah-check">
                  <input
                    type="checkbox"
                    checked={state.settings.autoBumpOnHistoryUplift !== false}
                    onChange={(e) =>
                      setState((s) =>
                        patchSettings(s, {
                          autoBumpOnHistoryUplift: e.target.checked,
                        })
                      )
                    }
                  />
                  Raise suggestions when history shows strong sell/buy uplift
                </label>
              </div>
              {isCreator ? (
                <div className="ah-creator-db">
                  <h3>Creator · full auction DB</h3>
                  <p className="muted">
                    Only you can load every account’s private auction house
                    row. Other users never see each other’s setups or bids.
                  </p>
                  <button
                    type="button"
                    className="tan-btn"
                    disabled={creatorDbLoading}
                    onClick={loadCreatorDb}
                  >
                    {creatorDbLoading ? "Loading…" : "Load all users"}
                  </button>
                  {creatorDbError ? (
                    <p className="error">{creatorDbError}</p>
                  ) : null}
                  {creatorDb ? (
                    <div className="ah-creator-list">
                      {creatorDb.map((row) => {
                        const st = row.state || {};
                        const prefs = Array.isArray(st.heroSetups)
                          ? st.heroSetups.length
                          : Object.keys(st.heroPrefs || {}).length;
                        const bids = (st.biddings || []).length;
                        const bag = (st.bag || []).length;
                        const listed = (st.listings || []).length;
                        const hist = (st.history || []).length;
                        return (
                          <details key={row.userId} className="ah-creator-row">
                            <summary>
                              <strong>{row.username}</strong>
                              <span className="muted">
                                {" "}
                                · set up {prefs} · bid {bids} · bag {bag} ·
                                list {listed} · hist {hist}
                              </span>
                            </summary>
                            <pre className="ah-creator-json">
                              {JSON.stringify(st, null, 2)}
                            </pre>
                          </details>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : null}
            </div>
          </section>
        </div>
      </div>
      {renderPicker()}
      {catalogEditor
        ? (
            <HeroCatalogModal
              setup={
                catalogEditor.mode === "edit" ? catalogEditor.setup : null
              }
              presets={state.catalogPresets || []}
              onClose={() => setCatalogEditor(null)}
              onSave={(partial) => {
                setState((s) => upsertHeroSetup(s, partial));
                setCatalogEditor(null);
              }}
              onDeleteSetup={(setupId) => {
                setState((s) => deleteHeroSetup(s, setupId));
                setCatalogEditor(null);
              }}
              onSavePreset={(partial) => {
                let saved = null;
                setState((s) => {
                  const result = saveCatalogPreset(s, partial);
                  saved = result.preset;
                  return result.state;
                });
                return saved;
              }}
              onDeletePreset={(presetId) => {
                setState((s) => deleteCatalogPreset(s, presetId));
              }}
            />
          )
        : null}
    </div>
  );
}
