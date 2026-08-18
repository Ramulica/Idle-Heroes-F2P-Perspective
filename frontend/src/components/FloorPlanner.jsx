import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import CsgAmount from "./CsgAmount.jsx";
import CompletionMenu, { DiscountToggle, RateModal } from "./CompletionMenu.jsx";
import HelpTip from "./HelpTip.jsx";
import MenuIconButton from "./MenuIconButton.jsx";
import RewardIcon from "./RewardIcon.jsx";
import { Stars } from "./StarRating.jsx";
import { useAuth } from "../auth";
import { REWARD_META, REWARD_ORDER, rewardPreview } from "../rewards";

const DEFAULT_SORT = "csg-asc";
const MAX_CHARM_COST = 70;

function rewardCharmCost(floor, reward, floor12Discount) {
  const cost = Number(reward?.cost || 0);
  if (Number(floor.floor) === 12 && !floor12Discount && cost > 0) {
    return 10;
  }
  return cost;
}

function totalCharmCost(picks, floors, floor12Discount) {
  let total = 0;
  for (const floor of floors || []) {
    const pick = picks?.[String(floor.floor)];
    if (!pick) continue;
    const reward = floor.rewards.find((item) => item.reward_type === pick);
    if (reward) total += rewardCharmCost(floor, reward, floor12Discount);
  }
  return total;
}

function sortOptions(rows, sortBy) {
  const copy = [...rows];
  const resourceSort = REWARD_ORDER.includes(sortBy) ? sortBy : null;
  copy.sort((a, b) => {
    if (sortBy === "csg-desc") {
      const cost = Number(b.sg_cost || 0) - Number(a.sg_cost || 0);
      if (cost) return cost;
    } else if (sortBy === "rating-desc") {
      const rating = Number(b.rating_avg || 0) - Number(a.rating_avg || 0);
      if (rating) return rating;
    } else if (sortBy === "rating-asc") {
      const rating = Number(a.rating_avg || 0) - Number(b.rating_avg || 0);
      if (rating) return rating;
    } else if (resourceSort) {
      const loot =
        Number(b.reward_counts?.[resourceSort] || 0) -
        Number(a.reward_counts?.[resourceSort] || 0);
      if (loot) return loot;
    } else {
      const cost = Number(a.sg_cost || 0) - Number(b.sg_cost || 0);
      if (cost) return cost;
    }
    const order = Number(a.sort_order || 0) - Number(b.sort_order || 0);
    if (order) return order;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
  return copy;
}

export default function FloorPlanner({ data, onChange }) {
  const guest = Boolean(useAuth()?.user?.guest);
  const [view, setView] = useState("list");
  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [rateOption, setRateOption] = useState(null);
  const [draftRating, setDraftRating] = useState(0);
  const [sortBy, setSortBy] = useState(DEFAULT_SORT);
  const [minRating, setMinRating] = useState(0);
  const [resourceFilters, setResourceFilters] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);

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
  const maxCharm = Number(data.max_charm_cost || MAX_CHARM_COST);
  const floor12Discount = Boolean(selected?.floor_12_discount);
  const charmTotal = useMemo(
    () => totalCharmCost(picks, data.floors, floor12Discount),
    [picks, data.floors, floor12Discount]
  );
  const atCharmCap = charmTotal >= maxCharm;

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
    if (!opt || opt.is_default) return;
    if (
      !enabled &&
      totalCharmCost(opt.floors || {}, data.floors, false) > maxCharm
    ) {
      return;
    }
    setBusy(true);
    try {
      await api.updateOption(opt.id, { floor_12_discount: enabled });
      await onChange();
    } finally {
      setBusy(false);
    }
  }

  function toggleReward(floor, rewardType) {
    if (guest || !selected || selected.is_default) return;
    if (floor === 13 && filledFloors < 12) return;
    const key = String(floor);
    const next = { ...picks };
    if (next[key] === rewardType) {
      delete next[key];
    } else {
      next[key] = rewardType;
      if (totalCharmCost(next, data.floors, floor12Discount) > maxCharm) {
        return;
      }
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

  const visibleOptions = useMemo(() => {
    let rows = [...data.options];
    if (minRating > 0) {
      rows = rows.filter((row) => Number(row.rating_avg || 0) >= minRating);
    }
    if (resourceFilters.length) {
      rows = rows.filter((row) =>
        resourceFilters.every((type) => Number(row.reward_counts?.[type] || 0) > 0)
      );
    }
    return sortOptions(rows, sortBy);
  }, [data.options, minRating, resourceFilters, sortBy]);
  const mineOptions = visibleOptions.filter((opt) => !opt.is_default);
  const defaultOptions = visibleOptions.filter((opt) => opt.is_default);
  const canEditSelected = Boolean(selected && !selected.is_default && !guest);
  const filtersActive =
    sortBy !== DEFAULT_SORT || minRating > 0 || resourceFilters.length > 0;

  function toggleResourceFilter(type) {
    setResourceFilters((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type]
    );
  }

  function resetFilters() {
    setSortBy(DEFAULT_SORT);
    setMinRating(0);
    setResourceFilters([]);
  }

  function renderOptionRow(opt) {
    const editable = !guest && !opt.is_default;
    return (
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
          {guest ? null : (
            <button
              className="tan-btn"
              type="button"
              onClick={(event) => openMenu(opt, event)}
            >
              Rate
            </button>
          )}
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
          {editable ? (
            <DiscountToggle
              checked={Boolean(opt.floor_12_discount)}
              onChange={(enabled) => toggleDiscount(opt, enabled)}
            />
          ) : opt.floor_12_discount ? (
            <span className="muted">12th floor Discount</span>
          ) : null}
        </div>
      </div>
    );
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
    if (!window.confirm(`Delete "${opt.name}"? Only you will lose it.`)) return;
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
                "Default completions are shared and cannot be changed.",
                "Tap + Add option to make a route that only you can see and edit.",
                "Rate default routes with half stars. The score is the community average.",
                "Filter / Sort is a popup. Completions start sorted by CSG cost, cheapest first.",
              ]}
            />
          </div>
          <div className="sale-top-actions">
            <button
              className={filtersActive ? "gold-btn" : "tan-btn"}
              type="button"
              onClick={() => setFilterOpen(true)}
            >
              Filter / Sort
            </button>
            {guest ? null : (
              <button className="gold-btn" type="button" onClick={() => setModal(true)}>
                + Add option
              </button>
            )}
          </div>
        </div>
        <div className="option-list">
          {mineOptions.length ? (
            <>
              <h4 className="option-group-label">Your completions</h4>
              {mineOptions.map(renderOptionRow)}
            </>
          ) : null}
          {defaultOptions.length ? (
            <>
              <h4 className="option-group-label">Default completions</h4>
              {defaultOptions.map(renderOptionRow)}
            </>
          ) : null}
          {visibleOptions.length ? null : (
            <p className="muted" style={{ padding: "8px 4px" }}>
              {data.options.length
                ? "No completions match these filters."
                : "No completions yet."}
            </p>
          )}
        </div>
        {filterOpen && (
          <FilterSortModal
            sortBy={sortBy}
            setSortBy={setSortBy}
            minRating={minRating}
            setMinRating={setMinRating}
            resourceFilters={resourceFilters}
            toggleResourceFilter={toggleResourceFilter}
            onReset={resetFilters}
            onClose={() => setFilterOpen(false)}
          />
        )}
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
              "70 charms is the maximum. At 70, remaining paid floors stay locked.",
              "Default completions are view only. Add your own to edit floors, rename, or delete.",
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
            {guest || selected?.is_default ? (
              guest ? null : (
                <button
                  className="tan-btn"
                  type="button"
                  onClick={(event) => openMenu(selected, event)}
                >
                  Rate
                </button>
              )
            ) : (
              <MenuIconButton
                label={`Menu for ${selected.name}`}
                onClick={(event) => openMenu(selected, event)}
              />
            )}
          </div>
        ) : null}
        <div className="cost-pill">
          <span>CSG cost</span>
          <CsgAmount value={selected?.sg_cost || 0} />
        </div>
      </div>
      <div className="progress-line">
        {selected?.is_default
          ? "Default completion — view only. Add your own to change floors."
          : atCharmCap && remaining
            ? `Charm cap reached (${maxCharm}). Clear a pick to unlock more floors.`
            : remaining
              ? `Complete ${remaining} more floor(s) to unlock Surprise Gift.`
              : atCharmCap
                ? `Charm cap reached (${maxCharm}). Floor 13 is free.`
                : "Surprise Gift unlocked. Floor 13 is free."}
        {busy ? " Saving..." : ""}
      </div>
      <div className="floors">
        {data.floors.map((floor) => {
          const floorKey = String(floor.floor);
          const floorPicked = Boolean(picks[floorKey]);
          const locked = floor.floor === 13 && !floor13Unlocked;
          const capLocked =
            !locked &&
            !floorPicked &&
            floor.rewards.every((reward) => {
              const next = { ...picks, [floorKey]: reward.reward_type };
              return totalCharmCost(next, data.floors, floor12Discount) > maxCharm;
            });
          return (
          <div
            className={`floor-row${locked || capLocked ? " floor-locked" : ""}`}
            key={floor.floor}
          >
            <div className="floor-label">{floor.label}</div>
            <div className={`reward-grid${floor.is_free ? " wide" : ""}`}>
              {floor.rewards.map((reward) => {
                const meta = REWARD_META[reward.reward_type] || {
                  label: reward.reward_type,
                };
                const chosen = picks[floorKey] === reward.reward_type;
                const discounted =
                  floor.floor === 12
                    ? Boolean(selected?.floor_12_discount && reward.discounted)
                    : Boolean(reward.discounted);
                const cost =
                  floor.floor === 12 && !selected?.floor_12_discount && reward.cost > 0
                    ? 10
                    : reward.cost;
                const overCap =
                  !chosen &&
                  totalCharmCost(
                    { ...picks, [floorKey]: reward.reward_type },
                    data.floors,
                    floor12Discount
                  ) > maxCharm;
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
                      disabled={locked || capLocked || overCap || !canEditSelected}
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
            ) : capLocked ? (
              <div className="floor-lock-note">
                Charm cap is {maxCharm}. Clear a pick to unlock more floors.
              </div>
            ) : null}
          </div>
          );
        })}
      </div>
      <div className="sale-foot">
        <p>
          Can only select 1 item on every floor. Charm total cannot go above {maxCharm}.
          Charm total: {charmTotal} / {maxCharm}.
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
        rateOption.is_default ? (
          <RateModal
            title={`Rate ${rateOption.name}`}
            value={draftRating}
            onChange={setDraftRating}
            onSave={saveRating}
            onClose={() => setRateOption(null)}
          />
        ) : (
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
        )
      )}
    </div>
  );
}

function FilterSortModal({
  sortBy,
  setSortBy,
  minRating,
  setMinRating,
  resourceFilters,
  toggleResourceFilter,
  onReset,
  onClose,
}) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal wide" onClick={(event) => event.stopPropagation()}>
        <div className="head-with-help">
          <h3>Filter / Sort</h3>
          <HelpTip
            title="Filter / Sort"
            steps={[
              "Sort starts at CSG cost, cheapest first.",
              "Min rating hides lower-rated completions.",
              "Resource chips keep routes that include all selected rewards.",
              "Reset clears everything. Done closes this popup.",
            ]}
          />
        </div>
        <div className="case-filters in-modal">
          <label className="case-filter-field">
            Sort
            <select
              className="cell-select"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="csg-asc">CSG cost: low to high</option>
              <option value="csg-desc">CSG cost: high to low</option>
              <option value="rating-desc">Rating: high to low</option>
              <option value="rating-asc">Rating: low to high</option>
              {REWARD_ORDER.map((type) => (
                <option value={type} key={type}>
                  Most {type}
                </option>
              ))}
            </select>
          </label>
          <div className="case-filter-field">
            <span>Min rating</span>
            <div className="filter-chips">
              {[0, 1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  className={minRating === score ? "gold-btn" : "tan-btn"}
                  type="button"
                  onClick={() => setMinRating(score)}
                >
                  {score === 0 ? "Any" : `${score}+`}
                </button>
              ))}
            </div>
          </div>
          <div className="case-filter-field">
            <span>Resources</span>
            <div className="filter-chips resource-chips">
              {REWARD_ORDER.map((type) => (
                <button
                  key={type}
                  className={resourceFilters.includes(type) ? "gold-btn" : "tan-btn"}
                  type="button"
                  onClick={() => toggleResourceFilter(type)}
                >
                  <RewardIcon type={type} />
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="row-actions">
          <button className="gold-btn" type="button" onClick={onClose}>
            Done
          </button>
          <button className="tan-btn" type="button" onClick={onReset}>
            Reset
          </button>
        </div>
      </div>
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
              "Name the route, then save. Only you can see and edit it.",
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
