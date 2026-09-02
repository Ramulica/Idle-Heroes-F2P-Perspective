import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";
import CanAmount from "./CanAmount.jsx";
import HelpTip from "./HelpTip.jsx";
import LootChips from "./LootChips.jsx";
import RewardIcon from "./RewardIcon.jsx";
import {
  CAN_LABELS,
  RNG_SHOP,
  canBuyRngItem,
  clampRngBuys,
  rngSummary,
  setRngBuyCount,
} from "../rngCelebration";
import { REWARD_META } from "../rewards";

const SAVE_MS = 500;

export default function RngShopPlanner({
  option,
  canEdit,
  busy,
  onBusy,
  onChange,
  onOptionUpdated,
}) {
  const [shop, setShop] = useState(() => clampRngBuys(option?.floors || {}));
  const shopRef = useRef(shop);
  const timerRef = useRef(null);

  useEffect(() => {
    const next = clampRngBuys(option?.floors || {});
    shopRef.current = next;
    setShop(next);
  }, [option?.id]);

  const summary = useMemo(() => rngSummary(shop), [shop]);

  function queueSave(next) {
    shopRef.current = next;
    setShop(next);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void flushSave();
    }, SAVE_MS);
  }

  async function flushSave() {
    if (!option || !canEdit) return;
    const snapshot = shopRef.current;
    onBusy?.(true);
    try {
      const updated = await api.updateOption(
        option.id,
        { floors: snapshot, event_type: option.event_type },
        { silent: true }
      );
      if (onOptionUpdated && updated?.id) onOptionUpdated(updated);
      else await onChange?.({ silent: true });
    } finally {
      onBusy?.(false);
    }
  }

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      const snapshot = shopRef.current;
      if (option && canEdit) {
        api
          .updateOption(
            option.id,
            { floors: snapshot, event_type: option.event_type },
            { silent: true }
          )
          .catch(() => {});
      }
    };
  }, [option?.id, canEdit]);

  function patchBudget(field, value) {
    queueSave(
      clampRngBuys({
        ...shop,
        [field]: Math.max(0, Math.floor(Number(value) || 0)),
      })
    );
  }

  function buy(item, nextCount) {
    queueSave(setRngBuyCount(shop, item.id, nextCount));
  }

  return (
    <div className="rng-shop">
      <div className="calc-row">
        <div className="calc-row-head">
          <div className="head-with-help">
            <h3>Cans you can get</h3>
            <HelpTip
              title="RNG Celebration cans"
              steps={[
                "Type how many Normal cans and Limited cans you think this event gives you.",
                "Normal cans unlock later shop rows as you spend them.",
                "Limited cans buy the 18-can rows. They do not count toward unlocks.",
              ]}
            />
          </div>
        </div>
        <div className="rng-budget-grid">
          <label className="field">
            <span>
              <CanAmount kind="normal" iconOnly /> {CAN_LABELS.normal}
            </span>
            <input
              className="cell-input weeks-input"
              type="number"
              min="0"
              disabled={!canEdit}
              value={shop.normal_cans}
              onChange={(event) => patchBudget("normal_cans", event.target.value)}
            />
          </label>
          <label className="field">
            <span>
              <CanAmount kind="limited" iconOnly /> {CAN_LABELS.limited}
            </span>
            <input
              className="cell-input weeks-input"
              type="number"
              min="0"
              disabled={!canEdit}
              value={shop.limited_cans}
              onChange={(event) =>
                patchBudget("limited_cans", event.target.value)
              }
            />
          </label>
        </div>
        <div className="rng-left-line">
          <span>
            Left: <CanAmount kind="normal" value={summary.leftNormal} />
          </span>
          <span>
            Spent: <CanAmount kind="normal" value={summary.spentNormal} />
          </span>
          <span>
            Left: <CanAmount kind="limited" value={summary.leftLimited} />
          </span>
          <span>
            Spent: <CanAmount kind="limited" value={summary.spentLimited} />
          </span>
        </div>
      </div>

      <div className="rng-shop-grid">
        {RNG_SHOP.map((item) => {
          const owned = Number(summary.buys[item.id] || 0);
          const unlocked = summary.spentNormal >= item.unlockAt;
          const canPlus = canEdit && canBuyRngItem(item, shop);
          const meta = REWARD_META[item.reward];
          return (
            <article
              key={item.id}
              className={`rng-shop-card${unlocked ? "" : " locked"}`}
            >
              <div className="rng-unlock">
                <span
                  className="rng-unlock-fill"
                  style={{
                    width: `${
                      item.unlockAt <= 0
                        ? 100
                        : Math.min(
                            100,
                            (summary.spentNormal / item.unlockAt) * 100
                          )
                    }%`,
                  }}
                />
                <CanAmount kind="normal" iconOnly />
                <span>
                  {item.unlockAt <= 0
                    ? "Unlocked"
                    : `${Math.min(summary.spentNormal, item.unlockAt)}/${item.unlockAt}`}
                </span>
              </div>
              <div className="rng-item-icon">
                <RewardIcon type={item.reward} className="reward-icon-lg" />
              </div>
              <strong>{meta?.label || item.reward}</strong>
              <span className="muted">Limit: {item.limit}</span>
              <div className="times-control rng-buy-control">
                <button
                  className="tan-btn"
                  type="button"
                  disabled={!canEdit || owned <= 0}
                  onClick={() => buy(item, owned - 1)}
                >
                  −
                </button>
                <strong>{owned}</strong>
                <button
                  className="tan-btn"
                  type="button"
                  disabled={!canPlus}
                  onClick={() => buy(item, owned + 1)}
                >
                  +
                </button>
              </div>
              <div className="rng-cost">
                <CanAmount kind={item.currency} value={item.cost} />
              </div>
              {unlocked ? null : (
                <p className="muted rng-lock-note">
                  Spend {item.unlockAt} normal cans to unlock.
                </p>
              )}
            </article>
          );
        })}
      </div>

      <article className="calc-row">
        <div className="calc-row-head">
          <h3>Rewards you get</h3>
        </div>
        <LootChips counts={summary.rewards} empty="Buy shop rows to see loot." />
        {busy ? <p className="muted">Saving...</p> : null}
      </article>
    </div>
  );
}
