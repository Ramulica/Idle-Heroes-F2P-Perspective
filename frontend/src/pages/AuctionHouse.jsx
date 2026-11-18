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
  discardBag,
  dismissBidding,
  draftWithRarity,
  emptyBiddingDraft,
  evaluateFlip,
  failListing,
  flipBootstrapPlan,
  formatBonuses,
  formatDuration,
  formatSg,
  formatWhen,
  fromDatetimeLocalValue,
  listFromBag,
  listingPhases,
  minListPrice,
  netFromListPrice,
  patchSettings,
  returnBagToBidding,
  returnListingToBag,
  sellListing,
  setDraftBonus,
  setHammersUsed,
  suggestListPrice,
  toDatetimeLocalValue,
  updateBagCopy,
  updateBidding,
  updateListingCopy,
} from "../auctionHouse";
import { useAuctionHouse } from "../useAuctionHouse";

const TABS = [
  { id: "biddings", label: "My Biddings" },
  { id: "bag", label: "Bag" },
  { id: "listings", label: "Listings" },
  { id: "history", label: "History" },
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

function HeroPickGrid({ value, onChange }) {
  return (
    <div className="ah-hero-grid-wrap">
      <div className="ah-hero-grid">
        {AUCTION_HEROES.map((hero) => (
          <button
            key={hero.id}
            type="button"
            className={`ah-hero-pick${value === hero.id ? " on" : ""}`}
            title={hero.name}
            onClick={() => onChange(hero.id)}
          >
            <img src={hero.icon} alt={hero.name} />
          </button>
        ))}
      </div>
    </div>
  );
}

function BiddingDraftFields({ draft, onChange }) {
  const need = auctionBonusSlots(draft.rarity);
  const pool = auctionBonusPool(draft.rarity);
  const bonuses = Array.from(
    { length: need },
    (_, i) => draft.bonuses?.[i] || { stat: "", value: 0 }
  );

  return (
    <>
      <HeroPickGrid
        value={draft.heroId}
        onChange={(heroId) => onChange({ ...draft, heroId })}
      />
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
          <span>Speed</span>
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
          <span>Attack</span>
          <input
            type="number"
            min={0}
            value={draft.attack ?? ""}
            onChange={(e) => onChange({ ...draft, attack: e.target.value })}
          />
        </label>
        <label className="ah-field">
          <span>HP</span>
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
      <div
        className={`ah-card-rarity sc-awaken-btn filled${long ? " long" : ""}`}
        style={{ "--sc-awaken-color": rarityColor }}
        title={`Awakening · ${rarity}`}
      >
        <span>{rarity}</span>
      </div>

      <div className="ah-card-top">
        <img src={hero?.icon} alt="" className="ah-card-icon" />
        <div className="ah-card-flats">
          <div className="ah-stat-row">
            <span className="muted">Attack</span>
            <strong>{formatSg(copy.attack || 0)}</strong>
          </div>
          <div className="ah-stat-row">
            <span className="muted">Health</span>
            <strong>{formatSg(copy.hp || 0)}</strong>
          </div>
          <div className="ah-stat-row">
            <span className="muted">Speed</span>
            <strong>{formatSg(copy.speed || 0)}</strong>
          </div>
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
  const { state, setState, loaded } = useAuctionHouse();
  const [tab, setTab] = useState("biddings");
  const [picker, setPicker] = useState(null);
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const summary = useMemo(() => auctionSummary(state), [state]);
  const alerts = useMemo(() => boardAlerts(state, tick), [state, tick]);

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
      return (
        <Modal
          title={editing ? "Edit copy" : "Add bidding"}
          onClose={() => setPicker(null)}
          footer={
            <button
              type="button"
              className="tan-btn"
              onClick={() => {
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
            onChange={(next) => setPicker({ ...picker, draft: next })}
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
                  "My Biddings: each copy gets a flip grade + Max bid / Suggest bid from history (Attack + % comps). Skip past Max bid.",
                  "Bootstrap: start with ~30% net margin until you have enough sold per hero, then mature margin applies. Log every sold and failed X.",
                  "Bag: 7-day cooldown. Edit Bought at in the edit modal. Hammers used tracks rerolls. ← Back undoes a mistaken buy.",
                  "Listings: ← Back = undo list. X = failed try (teaches the ceiling). Sold feeds the suggester.",
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
                  onClick={() =>
                    setPicker({ type: "add-bid", draft: emptyBiddingDraft() })
                  }
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
                            className="ghost-btn"
                            title="Didn't win — remove"
                            onClick={() =>
                              setState((s) => dismissBidding(s, copy.id))
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
                        const net =
                          copy.outcome === "sold"
                            ? netFromListPrice(copy.soldPrice)
                            : 0;
                        const hold =
                          copy.boughtAt && copy.soldAt
                            ? new Date(copy.soldAt) - new Date(copy.boughtAt)
                            : null;
                        const uplift =
                          copy.outcome === "sold" && copy.buyPrice
                            ? (copy.soldPrice / copy.buyPrice - 1) * 100
                            : null;
                        const hero = auctionHeroOf(copy.heroId);
                        return (
                          <tr key={copy.id}>
                            <td>
                              <div className="ah-table-hero">
                                <img src={hero?.icon} alt="" />
                                <div>
                                  <strong>{copy.rarity || "Copy"}</strong>
                                  <div className="muted">
                                    {copy.outcome === "sold"
                                      ? formatBonuses(copy)
                                      : "Discarded"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <Sg value={copy.buyPrice} />
                            </td>
                            <td>
                              {copy.outcome === "sold" ? (
                                <Sg value={copy.soldPrice} />
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>
                              {copy.outcome === "sold" ? (
                                <Sg value={net} />
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>{hold != null ? formatDuration(hold) : "—"}</td>
                            <td>
                              {uplift != null
                                ? `${uplift >= 0 ? "+" : ""}${uplift.toFixed(0)}%`
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
                Min list price covers the 5% sell commission. Flip grades use
                Attack + % comps, failed tries as a ceiling, and a bootstrap
                margin until you have enough sold history per hero.
              </p>
              <div className="ah-bootstrap-plan">
                <h3>How to build history</h3>
                <ol>
                  {flipBootstrapPlan(state.settings).map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
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
            </section>
          ) : null}
            </div>
          </section>
        </div>
      </div>
      {renderPicker()}
    </div>
  );
}
