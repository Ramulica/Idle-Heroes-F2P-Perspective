import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import CsgAmount from "./CsgAmount.jsx";
import CompletionMenu, { DiscountToggle, RateModal } from "./CompletionMenu.jsx";
import HelpTip from "./HelpTip.jsx";
import MenuIconButton from "./MenuIconButton.jsx";
import RewardIcon from "./RewardIcon.jsx";
import { Stars } from "./StarRating.jsx";
import { REWARD_META, rewardPreview } from "../rewards";

export default function FloorPlanner({ data, onChange }) {
  const [view, setView] = useState("list");
  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [rateOption, setRateOption] = useState(null);
  const [draftRating, setDraftRating] = useState(0);

  const selected = data.options.find((opt) => opt.id === selectedId) || null;
  const picks = selected?.floors || {};

  useEffect(() => {
    if (selectedId && !data.options.some((opt) => opt.id === selectedId)) {
      setSelectedId(null);
      setView("list");
    }
  }, [data.options, selectedId]);

  const filledFloors = useMemo(
    () =>
      data.floors.filter(
        (floor) => floor.floor < 13 && picks[String(floor.floor)]
      ).length,
    [data.floors, picks]
  );
  const remaining = Math.max(0, 12 - filledFloors);
  const floor13Unlocked = filledFloors >= 12;

  async function savePicks(nextPicks) {
    if (!selected) return;
    setBusy(true);
    try {
      await api.updateOption(selected.id, { floors: nextPicks });
      await onChange();
    } finally {
      setBusy(false);
    }
  }

  async function toggleDiscount(opt, enabled) {
    setBusy(true);
    try {
      await api.updateOption(opt.id, { floor_12_discount: enabled });
      await onChange();
    } finally {
      setBusy(false);
    }
  }

  function toggleReward(floor, rewardType) {
    if (!selected) return;
    if (floor === 13 && filledFloors < 12) return;
    const key = String(floor);
    const next = { ...picks };
    if (next[key] === rewardType) {
      delete next[key];
    } else {
      next[key] = rewardType;
    }
    if (floor < 13) {
      const stillFilled = data.floors.filter(
        (item) => item.floor < 13 && next[String(item.floor)]
      ).length;
      if (stillFilled < 12) {
        delete next["13"];
      }
    }
    savePicks(next);
  }

  async function addOption() {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    try {
      const created = await api.createOption({ name, floors: {} });
      setModal(false);
      setNewName("");
      await onChange();
      setSelectedId(created.id);
      setView("floors");
    } finally {
      setBusy(false);
    }
  }

  async function renameOption(opt) {
    if (!opt) return;
    const name = window.prompt("Rename this completion option", opt.name);
    if (!name || !name.trim()) return;
    await api.updateOption(opt.id, { name: name.trim() });
    await onChange();
  }

  async function deleteOption(opt) {
    if (!opt) return;
    if (!window.confirm(`Delete "${opt.name}" for everyone?`)) return;
    await api.deleteOption(opt.id);
    setRateOption(null);
    await onChange();
    if (selectedId === opt.id) {
      setSelectedId(null);
      setView("list");
    }
  }

  function openOption(id) {
    setSelectedId(id);
    setView("floors");
  }

  async function saveRating() {
    if (!rateOption) return;
    await api.rateOption(rateOption.id, draftRating);
    setRateOption(null);
    await onChange();
  }

  function openMenu(opt, event) {
    event?.stopPropagation?.();
    setRateOption(opt);
    setDraftRating(opt.my_rating ?? opt.rating_avg ?? 0);
  }

  if (view === "list") {
    return (
      <div className="sale-wrap">
        <div className="sale-top">
          <div className="head-with-help">
            <h3 style={{ margin: 0 }}>Completion options</h3>
            <HelpTip
              title="Completion options"
              steps={[
                "Tap a name to open its 13-floor layout.",
                "Rate with half stars. The score is the community average.",
                "12th floor Discount is on or off per option. Tick only the checkbox.",
                "+ Add option creates a new shared community route.",
              ]}
            />
          </div>
          <button className="gold-btn" type="button" onClick={() => setModal(true)}>
            + Add option
          </button>
        </div>
        <div className="option-list">
          {data.options.map((opt) => (
            <div className="option-row" key={opt.id}>
              <div className="option-title">
                <button
                  className="option-name-btn"
                  type="button"
                  onClick={() => openOption(opt.id)}
                >
                  {opt.name}
                </button>
                <Stars value={opt.rating_avg} />
                <span className="rating-score">
                  {Number(opt.rating_avg || 0).toFixed(1)} ({opt.rating_count || 0})
                </span>
                <button
                  className="tan-btn"
                  type="button"
                  onClick={(event) => openMenu(opt, event)}
                >
                  Rate
                </button>
              </div>
              <div className="option-preview-row">
                <button
                  className="option-open"
                  type="button"
                  onClick={() => openOption(opt.id)}
                >
                  <CsgAmount value={opt.sg_cost} />
                  <span className="loot-preview">
                    {rewardPreview(opt.reward_counts).length ? (
                      rewardPreview(opt.reward_counts).map((item) => (
                        <span className="loot-chip" key={item.type}>
                          {item.count}x <RewardIcon type={item.type} />
                        </span>
                      ))
                    ) : (
                      <span className="muted">No floors picked yet</span>
                    )}
                  </span>
                </button>
                <DiscountToggle
                  checked={Boolean(opt.floor_12_discount)}
                  onChange={(enabled) => toggleDiscount(opt, enabled)}
                />
              </div>
            </div>
          ))}
        </div>
        {rateOption && (
          <RateModal
            title={`Rate ${rateOption.name}`}
            value={draftRating}
            onChange={setDraftRating}
            onSave={saveRating}
            onClose={() => setRateOption(null)}
          />
        )}
        {modal && (
          <AddModal
            newName={newName}
            setNewName={setNewName}
            onSave={addOption}
            onClose={() => setModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="sale-wrap">
      <div className="sale-top">
        <button className="tan-btn" type="button" onClick={() => setView("list")}>
          ← All options
        </button>
        <div className="head-with-help">
          <strong>{selected?.name || "Completion"}</strong>
          <HelpTip
            title="Floor layout"
            steps={[
              "Tap one reward per floor. Tap again to clear it.",
              "Fill floors 1–12 to unlock Floor 13 — Free.",
              "Unselected rewards stay dark. Selected ones glow gold.",
              "The three-line menu has rating, 12th floor Discount, Rename, and Delete.",
            ]}
          />
        </div>
        {selected ? (
          <div className="option-title">
            <Stars value={selected.rating_avg} />
            <span className="rating-score">
              {Number(selected.rating_avg || 0).toFixed(1)} (
              {selected.rating_count || 0})
            </span>
            <MenuIconButton
              label={`Menu for ${selected.name}`}
              onClick={(event) => openMenu(selected, event)}
            />
          </div>
        ) : null}
        <div className="cost-pill">
          <span>CSG cost</span>
          <CsgAmount value={selected?.sg_cost || 0} />
        </div>
      </div>
      <div className="progress-line">
        {remaining
          ? `Complete ${remaining} more floor(s) to unlock Surprise Gift.`
          : "Surprise Gift unlocked. Floor 13 is free."}
        {busy ? " Saving..." : ""}
      </div>
      <div className="floors">
        {data.floors.map((floor) => {
          const locked = floor.floor === 13 && !floor13Unlocked;
          return (
          <div
            className={`floor-row${locked ? " floor-locked" : ""}`}
            key={floor.floor}
          >
            <div className="floor-label">{floor.label}</div>
            <div className={`reward-grid${floor.is_free ? " wide" : ""}`}>
              {floor.rewards.map((reward) => {
                const meta = REWARD_META[reward.reward_type] || {
                  label: reward.reward_type,
                };
                const chosen = picks[String(floor.floor)] === reward.reward_type;
                const discounted =
                  floor.floor === 12
                    ? Boolean(selected?.floor_12_discount && reward.discounted)
                    : Boolean(reward.discounted);
                const cost =
                  floor.floor === 12 && !selected?.floor_12_discount && reward.cost > 0
                    ? 10
                    : reward.cost;
                return (
                  <div
                    className={`reward${chosen ? " selected" : ""}${
                      discounted ? " discounted" : ""
                    }`}
                    key={`${floor.floor}-${reward.reward_type}`}
                  >
                    <div className="reward-name">{meta.label}</div>
                    <button
                      className="reward-box"
                      type="button"
                      disabled={locked}
                      onClick={() => toggleReward(floor.floor, reward.reward_type)}
                    >
                      <RewardIcon type={reward.reward_type} className="reward-icon-lg" />
                      {discounted && <span className="badge">-50%</span>}
                    </button>
                    <div className="price">
                      {discounted ? (
                        <>
                          <s>10</s>
                          <span>{cost}</span>
                        </>
                      ) : (
                        <span>{cost}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {locked ? (
              <div className="floor-lock-note">
                Complete all 12 floors to unlock Floor 13 — Free.
              </div>
            ) : null}
          </div>
          );
        })}
      </div>
      <div className="sale-foot">
        <p>
          Can only select 1 item on every floor. Community completion options are
          shared for all users. Charm total: {selected?.total_cost || 0}.
        </p>
        <button className="gold-btn" type="button">
          <CsgAmount value={selected?.sg_cost || 0} />
        </button>
      </div>
      {modal && (
        <AddModal
          newName={newName}
          setNewName={setNewName}
          onSave={addOption}
          onClose={() => setModal(false)}
        />
      )}
      {rateOption && (
        <CompletionMenu
          option={data.options.find((row) => row.id === rateOption.id) || rateOption}
          value={draftRating}
          onChange={setDraftRating}
          onSaveRating={saveRating}
          onToggleDiscount={(enabled) => toggleDiscount(rateOption, enabled)}
          onRename={() => renameOption(rateOption)}
          onDelete={() => deleteOption(rateOption)}
          onClose={() => setRateOption(null)}
        />
      )}
    </div>
  );
}

function AddModal({ newName, setNewName, onSave, onClose }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="head-with-help">
          <h3>Add completion option</h3>
          <HelpTip
            title="Add completion option"
            steps={[
              "Name the route, then save. It is shared with everyone.",
              "Open it to pick one reward per floor. Floor 13 unlocks after 1–12.",
            ]}
          />
        </div>
        <input
          className="cell-input"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="Name this route"
          autoFocus
        />
        <div className="row-actions">
          <button className="gold-btn" type="button" onClick={onSave}>
            Save
          </button>
          <button className="tan-btn" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
