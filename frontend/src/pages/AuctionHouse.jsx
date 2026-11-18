import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import HelpTip from "../components/HelpTip.jsx";
import {
  AUCTION_HEROES,
  AUCTION_PCT_STATS,
  AUCTION_RARITIES,
  STAR_GEM_ICON,
  SELL_COMMISSION,
  addBidding,
  auctionHeroOf,
  auctionSummary,
  bagReadyAt,
  boardAlerts,
  buyBidding,
  copyAlerts,
  copyTitle,
  discardBag,
  dismissBidding,
  emptyBiddingDraft,
  failListing,
  formatBonuses,
  formatDuration,
  formatFlats,
  formatSg,
  formatWhen,
  fromDatetimeLocalValue,
  listFromBag,
  listingPhases,
  minListPrice,
  netFromListPrice,
  patchSettings,
  sellListing,
  suggestListPrice,
  toDatetimeLocalValue,
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
      <img src={STAR_GEM_ICON} alt="" className="ah-sg-icon" />
      <strong>{formatSg(value)}</strong>
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
  );
}

function CopyCard({ copy, state, children, footer }) {
  const hero = auctionHeroOf(copy.heroId);
  const alerts = copyAlerts(copy, state);
  return (
    <article className="ah-card">
      <div className="ah-card-head">
        <img src={hero?.icon} alt="" className="ah-card-icon" />
        <div className="ah-card-title">
          <strong>{copyTitle(copy)}</strong>
          <span className="muted">{formatBonuses(copy)}</span>
          <span className="muted">{formatFlats(copy)}</span>
        </div>
      </div>
      {alerts.length ? (
        <ul className="ah-card-alerts">
          {alerts.map((a, i) => (
            <li key={`${a.type}-${i}`} className={`ah-alert ah-alert-${a.tone}`}>
              {a.text}
            </li>
          ))}
        </ul>
      ) : null}
      {children}
      {footer ? <div className="ah-card-actions">{footer}</div> : null}
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

    if (picker.type === "add-bid") {
      const draft = picker.draft || emptyBiddingDraft();
      return (
        <Modal
          title="Add bidding"
          onClose={() => setPicker(null)}
          footer={
            <button
              type="button"
              className="tan-btn"
              onClick={() => {
                setState((s) => addBidding(s, draft));
                setPicker(null);
                setTab("biddings");
              }}
            >
              Add to biddings
            </button>
          }
        >
          <p className="muted sc-modal-lead">
            Pick a hero, rarity (C− … SSS+), two % bonuses, then Speed / Attack /
            HP.
          </p>
          <HeroPickGrid
            value={draft.heroId}
            onChange={(heroId) =>
              setPicker({ ...picker, draft: { ...draft, heroId } })
            }
          />
          <label className="ah-field">
            <span>Rarity</span>
            <select
              value={draft.rarity}
              onChange={(e) =>
                setPicker({
                  ...picker,
                  draft: { ...draft, rarity: e.target.value },
                })
              }
            >
              {AUCTION_RARITIES.map((r) => (
                <option key={r} value={r}>
                  {r || "·"}
                </option>
              ))}
            </select>
          </label>
          <div className="ah-bonus-row">
            {[
              ["bonusA", "Bonus 1"],
              ["bonusB", "Bonus 2"],
            ].map(([key, label]) => (
              <div key={key} className="ah-bonus-block">
                <label className="ah-field">
                  <span>{label}</span>
                  <select
                    value={draft[key]?.stat || ""}
                    onChange={(e) =>
                      setPicker({
                        ...picker,
                        draft: {
                          ...draft,
                          [key]: { ...draft[key], stat: e.target.value },
                        },
                      })
                    }
                  >
                    {AUCTION_PCT_STATS.map((stat) => (
                      <option key={stat} value={stat}>
                        {stat}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="ah-field">
                  <span>Value %</span>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={draft[key]?.value ?? ""}
                    onChange={(e) =>
                      setPicker({
                        ...picker,
                        draft: {
                          ...draft,
                          [key]: { ...draft[key], value: e.target.value },
                        },
                      })
                    }
                  />
                </label>
              </div>
            ))}
          </div>
          <div className="ah-flat-row">
            {[
              ["speed", "Speed"],
              ["attack", "Attack"],
              ["hp", "HP"],
            ].map(([key, label]) => (
              <label key={key} className="ah-field">
                <span>{label}</span>
                <input
                  type="number"
                  min={0}
                  value={draft[key] ?? ""}
                  onChange={(e) =>
                    setPicker({
                      ...picker,
                      draft: { ...draft, [key]: e.target.value },
                    })
                  }
                />
              </label>
            ))}
          </div>
          <label className="ah-field">
            <span>Note (optional)</span>
            <input
              type="text"
              value={draft.note || ""}
              onChange={(e) =>
                setPicker({
                  ...picker,
                  draft: { ...draft, note: e.target.value },
                })
              }
            />
          </label>
        </Modal>
      );
    }

    if (picker.type === "buy") {
      const copy = state.biddings.find((c) => c.id === picker.id);
      if (!copy) return null;
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
                    Number(picker.price) || 0,
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
          <label className="ah-field">
            <span>Buy price (SG)</span>
            <input
              type="number"
              min={0}
              value={picker.price ?? ""}
              onChange={(e) => setPicker({ ...picker, price: e.target.value })}
            />
          </label>
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
              value={minListPrice(Number(picker.price) || 0, state.settings)}
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
        <header className="shell-head">
          <div>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => navigate("/")}
            >
              ← Home
            </button>
            <div className="head-with-help" style={{ marginTop: 8 }}>
              <h1>Auction House</h1>
              <HelpTip
                title="Auction House Accounting"
                steps={[
                  "My Biddings: track copies you are bidding on. X = didn’t win. Bought → Bag with date/time.",
                  "Bag: 7-day cooldown after buy. When ready, List with a suggested price (min profit/margin + 5% commission).",
                  "Listings: 6h warmup, then 2 days of bidding. Sold → History. X = failed try (keeps price for learning).",
                  "History teaches the suggester: high sell/buy uplift → recommend higher next time; failed tries → recommend lower.",
                ]}
              />
            </div>
            <p className="muted">
              Track bids, bag cooldown, listings, and SG profit after 5%
              commission.
            </p>
          </div>
          <div className="shell-head-right">
            <button
              type="button"
              className="gold-btn"
              onClick={() =>
                setPicker({ type: "add-bid", draft: emptyBiddingDraft() })
              }
            >
              + Add copy
            </button>
          </div>
        </header>

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

        <main className="ah-main">
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
                  {state.biddings.map((copy) => (
                    <CopyCard key={copy.id} copy={copy} state={state}>
                      <p className="muted">Added {formatWhen(copy.createdAt)}</p>
                      <div className="ah-card-actions">
                        <button
                          type="button"
                          className="gold-btn"
                          onClick={() =>
                            setPicker({
                              type: "buy",
                              id: copy.id,
                              price: "",
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
                      </div>
                    </CopyCard>
                  ))}
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
                      <CopyCard key={copy.id} copy={copy} state={state}>
                        <p>
                          Bought <Sg value={copy.buyPrice} /> ·{" "}
                          {formatWhen(copy.boughtAt)}
                        </p>
                        <p className="muted">
                          Suggest list <Sg value={tip.suggested} /> (min{" "}
                          <Sg value={tip.floor} />)
                        </p>
                        {copy.tries?.length ? (
                          <p className="muted">
                            Failed tries:{" "}
                            {copy.tries
                              .map((t) => formatSg(t.price))
                              .join(", ")}{" "}
                            SG
                          </p>
                        ) : null}
                        <div className="ah-card-actions">
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
                        </div>
                      </CopyCard>
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
                      <CopyCard key={copy.id} copy={copy} state={state}>
                        <p>
                          Listed <Sg value={copy.listPrice} /> ·{" "}
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
                        <div className="ah-card-actions">
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
                        </div>
                      </CopyCard>
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
                                  <strong>{copyTitle(copy)}</strong>
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
              </div>
            </section>
          ) : null}

          {tab === "settings" ? (
            <section className="ah-section">
              <h2>Pricing settings</h2>
              <p className="muted">
                Min list price always covers the 5% sell commission so your net
                hits the target.
              </p>
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
                    <span>Min margin %</span>
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
        </main>
      </div>
      {renderPicker()}
    </div>
  );
}
