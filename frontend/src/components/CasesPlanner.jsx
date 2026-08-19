import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import CsgAmount from "./CsgAmount.jsx";
import { RateModal } from "./CompletionMenu.jsx";
import HelpTip from "./HelpTip.jsx";
import MenuIconButton from "./MenuIconButton.jsx";
import RewardIcon from "./RewardIcon.jsx";
import { StarPicker, Stars } from "./StarRating.jsx";
import { useAuth, GUEST_SG_KEY } from "../auth";
import { REWARD_ORDER, rewardPreview } from "../rewards";
import {
  DEFAULT_STATE,
  EVENT_WEEKS_PER_YEAR,
  csgForEventWeeks,
  yearlyCsg,
} from "../sgCalc";

const PERIOD_PRESETS = [6, 10, 12, 17, 26, 52];

function weeksLabel(weeks) {
  const value = Number(weeks || 0);
  return value === 1 ? "1 week" : `${value} weeks`;
}

function eventWeeksLabel(weeks) {
  const value = Number(weeks || 0);
  return value === 1 ? "1 event week" : `${value} event weeks`;
}

function calendarPeriodLabel(weeks) {
  const value = Number(weeks || 0);
  if (value <= 0) return "";
  const yearsExact = value / EVENT_WEEKS_PER_YEAR;
  const yearRounded = Math.round(yearsExact);
  if (Math.abs(yearsExact - yearRounded) < 0.03 && yearRounded >= 1) {
    return yearRounded === 1 ? "1 year" : `${yearRounded} years`;
  }
  const months = Math.round(yearsExact * 12);
  if (months < 1) return "under 1 month";
  if (months === 1) return "1 month";
  if (months >= 12) {
    const years = Math.floor(months / 12);
    const leftover = months % 12;
    const yearPart = years === 1 ? "1 year" : `${years} years`;
    if (!leftover) return yearPart;
    const monthPart = leftover === 1 ? "1 month" : `${leftover} months`;
    return `${yearPart} ${monthPart}`;
  }
  return `${months} months`;
}

function PeriodPresetButtons({ value, onChange, min = 1 }) {
  return (
    <div className="period-presets">
      {PERIOD_PRESETS.map((weeks) => (
        <button
          key={weeks}
          className={Number(value) === weeks ? "gold-btn" : "tan-btn"}
          type="button"
          onClick={() => onChange(Math.max(min, weeks))}
        >
          <span>{weeksLabel(weeks)}</span>
          <span className="cal-label">{calendarPeriodLabel(weeks)}</span>
        </button>
      ))}
    </div>
  );
}

function PeriodCalc({ weeks }) {
  return (
    <p className="period-calc">
      {eventWeeksLabel(weeks)} = <strong>{calendarPeriodLabel(weeks)}</strong>
      <span className="muted"> · 17 event weeks = 1 year</span>
    </p>
  );
}

export default function CasesPlanner({ data, onChange, onOpenPlanner }) {
  const guest = Boolean(useAuth()?.user?.guest);
  const [view, setView] = useState("list");
  const [selectedId, setSelectedId] = useState(null);
  const [addCaseOpen, setAddCaseOpen] = useState(false);
  const [addSlotOpen, setAddSlotOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPeriod, setNewPeriod] = useState(6);
  const [slotOptionId, setSlotOptionId] = useState(null);
  const [slotTimes, setSlotTimes] = useState(1);
  const [busy, setBusy] = useState(false);
  const [rateCase, setRateCase] = useState(null);
  const [draftRating, setDraftRating] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [editCase, setEditCase] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPeriod, setEditPeriod] = useState(6);
  const [editRating, setEditRating] = useState(0);
  const [sortBy, setSortBy] = useState("rating-desc");
  const [durationFilter, setDurationFilter] = useState("all");
  const [minRating, setMinRating] = useState(0);
  const [resourceFilters, setResourceFilters] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sgState, setSgState] = useState(DEFAULT_STATE);

  const optionsById = useMemo(
    () => Object.fromEntries(data.options.map((opt) => [opt.id, opt])),
    [data.options]
  );
  const selected = data.cases.find((row) => row.id === selectedId) || null;
  const usedWeeks = selected?.total_weeks || 0;
  const periodWeeks = selected?.period_weeks || 6;
  const remaining = Math.max(0, periodWeeks - usedWeeks);
  const caseLoot = rewardPreview(selected?.reward_counts);
  const estimatedCsg = useMemo(
    () => csgForEventWeeks(sgState, periodWeeks),
    [sgState, periodWeeks]
  );
  const yearCsg = useMemo(() => yearlyCsg(sgState), [sgState]);

  useEffect(() => {
    if (guest) {
      try {
        const raw = sessionStorage.getItem(GUEST_SG_KEY);
        if (raw) {
          setSgState({ ...DEFAULT_STATE, ...JSON.parse(raw) });
        }
      } catch {
        /* ignore */
      }
      return undefined;
    }
    api
      .getSgCalc()
      .then((payload) => {
        setSgState({ ...DEFAULT_STATE, ...(payload.state || {}) });
      })
      .catch(() => {});
  }, [guest]);

  const visibleCases = useMemo(() => {
    let rows = [...data.cases];
    if (durationFilter !== "all") {
      rows = rows.filter((row) => Number(row.period_weeks) === Number(durationFilter));
    }
    if (minRating > 0) {
      rows = rows.filter((row) => Number(row.rating_avg || 0) >= minRating);
    }
    if (resourceFilters.length) {
      rows = rows.filter((row) =>
        resourceFilters.every((type) => Number(row.reward_counts?.[type] || 0) > 0)
      );
    }
    const resourceSort = REWARD_ORDER.includes(sortBy) ? sortBy : null;
    rows.sort((a, b) => {
      if (sortBy === "rating-asc") {
        return Number(a.rating_avg || 0) - Number(b.rating_avg || 0);
      }
      if (sortBy === "duration-desc") {
        return Number(b.period_weeks || 0) - Number(a.period_weeks || 0);
      }
      if (sortBy === "duration-asc") {
        return Number(a.period_weeks || 0) - Number(b.period_weeks || 0);
      }
      if (resourceSort) {
        return (
          Number(b.reward_counts?.[resourceSort] || 0) -
          Number(a.reward_counts?.[resourceSort] || 0)
        );
      }
      return Number(b.rating_avg || 0) - Number(a.rating_avg || 0);
    });
    return rows;
  }, [data.cases, durationFilter, minRating, resourceFilters, sortBy]);

  useEffect(() => {
    if (selectedId && !data.cases.some((row) => row.id === selectedId)) {
      setSelectedId(null);
      setView("list");
      setEditOpen(false);
      setEditCase(null);
    }
  }, [data.cases, selectedId]);

  async function patchSelected(payload) {
    if (!selected) return;
    setBusy(true);
    try {
      await api.updateCase(selected.id, payload);
      await onChange();
    } finally {
      setBusy(false);
    }
  }

  async function addCase() {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    try {
      const created = await api.createCase({
        name,
        period_weeks: newPeriod,
        slots: [],
      });
      setAddCaseOpen(false);
      setNewName("");
      setNewPeriod(6);
      await onChange();
      setSelectedId(created.id);
      setView("detail");
    } finally {
      setBusy(false);
    }
  }

  function closeEdit() {
    setEditOpen(false);
    setEditCase(null);
  }

  function openEdit(row, event) {
    event?.stopPropagation?.();
    const target = row || selected;
    if (!target) return;
    setEditCase(target);
    setEditName(target.name);
    setEditPeriod(target.period_weeks || 6);
    setEditRating(target.my_rating ?? target.rating_avg ?? 0);
    setEditOpen(true);
  }

  async function saveCaseEdits() {
    const target = editCase;
    if (!target) return;
    const name = editName.trim();
    if (!name) return;
    const used = target.total_weeks || 0;
    setBusy(true);
    try {
      await api.updateCase(target.id, {
        name,
        period_weeks: Math.max(used, Number(editPeriod) || used),
      });
      await api.rateCase(target.id, editRating);
      closeEdit();
      await onChange();
    } finally {
      setBusy(false);
    }
  }

  async function deleteSelected() {
    const target = editCase;
    if (!target) return;
    if (!window.confirm(`Delete "${target.name}"?`)) return;
    await api.deleteCase(target.id);
    closeEdit();
    await onChange();
    if (selectedId === target.id) {
      setSelectedId(null);
      setView("list");
    }
  }

  function openCase(id) {
    setSelectedId(id);
    setView("detail");
  }

  async function saveSlots(nextSlots) {
    await patchSelected({ slots: nextSlots });
  }

  function changeTimes(index, weeks) {
    if (!selected) return;
    const slots = selected.slots.map((slot, slotIndex) =>
      slotIndex === index ? { ...slot, weeks } : slot
    );
    saveSlots(slots);
  }

  function removeSlot(index) {
    if (!selected) return;
    saveSlots(selected.slots.filter((_, slotIndex) => slotIndex !== index));
  }

  function openAddSlot() {
    if (remaining <= 0) return;
    setSlotOptionId(data.options[0]?.id || null);
    setSlotTimes(1);
    setAddSlotOpen(true);
  }

  async function addSlot() {
    if (!selected || !slotOptionId || remaining <= 0) return;
    const times = Math.max(1, Math.min(Number(slotTimes) || 1, remaining));
    await saveSlots([
      ...selected.slots,
      { option_id: Number(slotOptionId), weeks: times },
    ]);
    setAddSlotOpen(false);
  }

  async function saveCaseRating() {
    if (!rateCase) return;
    await api.rateCase(rateCase.id, draftRating);
    setRateCase(null);
    await onChange();
  }

  function openCaseRate(row, event) {
    event?.stopPropagation?.();
    setRateCase(row);
    setDraftRating(row.my_rating ?? row.rating_avg ?? 0);
  }

  function toggleResourceFilter(type) {
    setResourceFilters((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type]
    );
  }

  function resetFilters() {
    setSortBy("rating-desc");
    setDurationFilter("all");
    setMinRating(0);
    setResourceFilters([]);
  }

  const filtersActive =
    sortBy !== "rating-desc" ||
    durationFilter !== "all" ||
    minRating > 0 ||
    resourceFilters.length > 0;

  if (view === "list") {
    return (
      <div className="sale-wrap case-list-page">
        <div className="sale-top">
          <div className="head-with-help">
            <h3 style={{ margin: 0 }}>Your event plans</h3>
            <HelpTip
              title="Event Plans"
              steps={[
                "An event plan is how you spend Mysterious Sale event weeks.",
                "17 event weeks = 1 year. CSG / year comes from the CSG Calculator.",
                "Tap a plan to add completions and how many times you run each one.",
                "Filter / Sort is a popup. Resource filters keep plans that include those rewards.",
              ]}
            />
          </div>
          <div className="home-year-csg">
            <span>CSG / year</span>
            <CsgAmount value={yearCsg} />
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
              <button className="gold-btn" type="button" onClick={() => setAddCaseOpen(true)}>
                + Add event plan
              </button>
            )}
          </div>
        </div>
        <div className="option-list">
          {visibleCases.length ? (
            visibleCases.map((row) => (
              <div className="option-row" key={row.id}>
                <div className="option-title">
                  <button
                    className="option-name-btn"
                    type="button"
                    onClick={() => openCase(row.id)}
                  >
                    {row.name}
                  </button>
                  <Stars value={row.rating_avg} />
                  <span className="rating-score">
                    {Number(row.rating_avg || 0).toFixed(1)} ({row.rating_count || 0})
                  </span>
                  {guest ? null : (
                    <button
                      className="tan-btn"
                      type="button"
                      onClick={(event) => openCaseRate(row, event)}
                    >
                      Rate
                    </button>
                  )}
                </div>
                <div className="option-preview-row">
                  <button
                    className="option-open"
                    type="button"
                    onClick={() => openCase(row.id)}
                  >
                    <CsgAmount value={row.total_sg_cost} />
                    <span className="loot-preview">
                      {rewardPreview(row.reward_counts).length ? (
                        rewardPreview(row.reward_counts).map((item) => (
                          <span className="loot-chip" key={item.type}>
                            {item.count}x <RewardIcon type={item.type} />
                          </span>
                        ))
                      ) : (
                        <span className="muted">No completions added yet</span>
                      )}
                    </span>
                  </button>
                  <span className="period-badge">
                    <span>{eventWeeksLabel(row.period_weeks)}</span>
                    <span className="cal-label">{calendarPeriodLabel(row.period_weeks)}</span>
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="muted" style={{ padding: "8px 4px" }}>
              {data.cases.length
                ? "No event plans match these filters."
                : "No event plans yet. Add one and pick a time period."}
            </p>
          )}
        </div>
        {filterOpen && (
          <FilterSortModal
            sortBy={sortBy}
            setSortBy={setSortBy}
            durationFilter={durationFilter}
            setDurationFilter={setDurationFilter}
            minRating={minRating}
            setMinRating={setMinRating}
            resourceFilters={resourceFilters}
            toggleResourceFilter={toggleResourceFilter}
            onReset={resetFilters}
            onClose={() => setFilterOpen(false)}
          />
        )}
        {rateCase && (
          <RateModal
            title={`Rate ${rateCase.name}`}
            value={draftRating}
            onChange={setDraftRating}
            onSave={saveCaseRating}
            onClose={() => setRateCase(null)}
          />
        )}
        {addCaseOpen && (
          <AddCaseModal
            newName={newName}
            setNewName={setNewName}
            newPeriod={newPeriod}
            setNewPeriod={setNewPeriod}
            onSave={addCase}
            onClose={() => setAddCaseOpen(false)}
          />
        )}
      </div>
    );
  }

  const addButton = guest ? null : (
    <button
      className="gold-btn"
      type="button"
      disabled={remaining <= 0}
      onClick={openAddSlot}
    >
      + Add completion option
    </button>
  );

  const totals = (
    <div className="case-totals">
      <div className="case-totals-head">
        <strong>All rewards</strong>
        <span className="muted">
          {eventWeeksLabel(periodWeeks)} · {calendarPeriodLabel(periodWeeks)} ·{" "}
          {usedWeeks} used · {remaining} left
        </span>
      </div>
      <div className="case-totals-body">
        <CsgAmount value={selected?.total_sg_cost || 0} />
        <span className="loot-preview">
          {caseLoot.length ? (
            caseLoot.map((item) => (
              <span className="loot-chip" key={item.type}>
                {item.count}x <RewardIcon type={item.type} />
              </span>
            ))
          ) : (
            <span className="muted">No rewards yet</span>
          )}
        </span>
      </div>
      <div className="case-income">
        <div className="case-income-item">
          <span className="muted">Est. CSG in {calendarPeriodLabel(periodWeeks)}</span>
          <CsgAmount value={estimatedCsg} />
        </div>
        <div
          className={`case-income-item${
            estimatedCsg >= (selected?.total_sg_cost || 0) ? " ok" : " short"
          }`}
        >
          <span className="muted">
            {estimatedCsg >= (selected?.total_sg_cost || 0)
              ? "Left after this plan"
              : "Short by"}
          </span>
          <CsgAmount
            value={Math.abs(estimatedCsg - (selected?.total_sg_cost || 0))}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="sale-wrap">
      <div className="sale-top">
        <button className="tan-btn" type="button" onClick={() => setView("list")}>
          ← All event plans
        </button>
        <div className="head-with-help">
          <strong>{selected?.name || "Event plan"}</strong>
          <HelpTip
            title="Event plan"
            steps={[
              "All rewards at the top is the total loot and CSG cost of this event plan.",
              "Est. CSG is what the CSG Calculator says you earn in this plan’s period (17 event weeks = 1 year).",
              "Gold cards below are single completions. Use × times to set how many event weeks you run that route.",
              "The three-line menu edits this plan: name, duration, rating, or delete.",
              "+ Add completion option is at the top and the bottom.",
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
            {guest ? null : (
              <MenuIconButton
                label={`Menu for ${selected.name}`}
                onClick={(event) => openEdit(selected, event)}
              />
            )}
          </div>
        ) : null}
        {addButton}
        <div className="cost-pill">
          <span>CSG cost</span>
          <CsgAmount value={selected?.total_sg_cost || 0} />
        </div>
        <div className="cost-pill income-pill">
          <span>Est. CSG</span>
          <CsgAmount value={estimatedCsg} />
        </div>
      </div>
      {totals}
      <div className="progress-line">
        {remaining
          ? `${remaining} time${remaining === 1 ? "" : "s"} left to add.`
          : "This event plan period is full."}
        {busy ? "  Saving..." : ""}
      </div>
      <div className="option-list case-slots">
        {(selected?.slots || []).map((slot, index) => {
          const opt = optionsById[slot.option_id];
          if (!opt) return null;
          const otherWeeks = usedWeeks - (slot.weeks || 0);
          const maxTimes = Math.max(1, periodWeeks - otherWeeks);
          return (
            <div className="option-row" key={`${slot.option_id}-${index}`}>
              <div className="option-title">
                <span className="option-name">{opt.name}</span>
                <Stars value={opt.rating_avg} />
                <span className="rating-score">
                  {Number(opt.rating_avg || 0).toFixed(1)} ({opt.rating_count || 0})
                </span>
                {guest ? null : (
                  <button
                    className="tan-btn danger"
                    type="button"
                    onClick={() => removeSlot(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="option-preview-row">
                <div className="option-open">
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
                </div>
                {guest ? (
                  <strong className="times-control">× {slot.weeks || 1}</strong>
                ) : (
                  <TimesControl
                    value={slot.weeks || 1}
                    max={maxTimes}
                    onChange={(weeks) => changeTimes(index, weeks)}
                  />
                )}
              </div>
            </div>
          );
        })}
        <div className="case-add-end">{addButton}</div>
      </div>
      {editOpen && editCase && (
          <EditCaseModal
            editName={editName}
            setEditName={setEditName}
            editPeriod={editPeriod}
            setEditPeriod={setEditPeriod}
            editRating={editRating}
            setEditRating={setEditRating}
            minPeriod={editCase.total_weeks || 1}
            onSave={saveCaseEdits}
            onDelete={deleteSelected}
            onClose={closeEdit}
          />
        )}
      {addSlotOpen && (
        <AddSlotModal
          options={data.options}
          remaining={remaining}
          slotOptionId={slotOptionId}
          setSlotOptionId={setSlotOptionId}
          slotTimes={slotTimes}
          setSlotTimes={setSlotTimes}
          onSave={addSlot}
          onClose={() => setAddSlotOpen(false)}
          onOpenPlanner={onOpenPlanner}
        />
      )}
    </div>
  );
}

function TimesControl({ value, max, onChange }) {
  return (
    <span className="times-control" onClick={(event) => event.stopPropagation()}>
      <button
        className="tan-btn"
        type="button"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <strong>× {value}</strong>
      <button
        className="tan-btn"
        type="button"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
      <span className="muted">{value === 1 ? "1 time" : `${value} times`}</span>
    </span>
  );
}

function FilterSortModal({
  sortBy,
  setSortBy,
  durationFilter,
  setDurationFilter,
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
              "Sort by rating, duration, or most of a resource.",
              "Duration filters to that event-week length. 17 weeks is 1 year.",
              "Min rating hides lower-rated event plans.",
              "Resource chips keep plans that include all selected rewards.",
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
              <option value="rating-desc">Rating: high to low</option>
              <option value="rating-asc">Rating: low to high</option>
              <option value="duration-desc">Duration: long to short</option>
              <option value="duration-asc">Duration: short to long</option>
              {REWARD_ORDER.map((type) => (
                <option value={type} key={type}>
                  Most {type}
                </option>
              ))}
            </select>
          </label>
          <div className="case-filter-field">
            <span>Duration</span>
            <PeriodPresetButtons
              value={durationFilter === "all" ? 0 : durationFilter}
              onChange={setDurationFilter}
            />
            <div className="filter-chips">
              <button
                className={durationFilter === "all" ? "gold-btn" : "tan-btn"}
                type="button"
                onClick={() => setDurationFilter("all")}
              >
                All
              </button>
            </div>
          </div>
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

function EditCaseModal({
  editName,
  setEditName,
  editPeriod,
  setEditPeriod,
  editRating,
  setEditRating,
  minPeriod,
  onSave,
  onDelete,
  onClose,
}) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="head-with-help">
          <h3>Edit event plan</h3>
          <HelpTip
            title="Edit event plan"
            steps={[
              "Rename the plan, set event weeks, and rate it here.",
              "Duration cannot go below the times already used.",
              "17 event weeks = 1 year. The calendar length is shown under the week count.",
              "Delete removes this event plan from your account only.",
            ]}
          />
        </div>
        <label className="muted" style={{ display: "block" }}>
          Name
          <input
            className="cell-input"
            value={editName}
            onChange={(event) => setEditName(event.target.value)}
            style={{ marginTop: 6 }}
            autoFocus
          />
        </label>
        <p className="muted" style={{ margin: "12px 0 6px" }}>
          Event weeks
        </p>
        <PeriodPresetButtons
          value={editPeriod}
          onChange={setEditPeriod}
          min={minPeriod}
        />
        <input
          className="cell-input"
          type="number"
          min={minPeriod}
          max="260"
          value={editPeriod}
          onChange={(event) =>
            setEditPeriod(
              Math.max(minPeriod, Math.min(260, Number(event.target.value) || minPeriod))
            )
          }
          style={{ marginTop: 8 }}
        />
        <PeriodCalc weeks={editPeriod} />
        <p className="muted" style={{ margin: "12px 0 6px" }}>
          Rate
        </p>
        <StarPicker value={editRating} onChange={setEditRating} />
        <div className="row-actions">
          <button className="gold-btn" type="button" onClick={onSave}>
            Save
          </button>
          <button className="tan-btn" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="tan-btn danger" type="button" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function AddCaseModal({
  newName,
  setNewName,
  newPeriod,
  setNewPeriod,
  onSave,
  onClose,
}) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="head-with-help">
          <h3>Add event plan</h3>
          <HelpTip
            title="Add event plan"
            steps={[
              "Name the plan, then pick how many Mysterious Sale event weeks it covers.",
              "17 event weeks = 1 year. Other week counts convert to months/years automatically.",
              "After saving, add completions and how many times you run each one.",
            ]}
          />
        </div>
        <input
          className="cell-input"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="Name this event plan"
          autoFocus
        />
        <p className="muted" style={{ margin: "12px 0 6px" }}>
          Event weeks
        </p>
        <PeriodPresetButtons value={newPeriod} onChange={setNewPeriod} />
        <input
          className="cell-input"
          type="number"
          min="1"
          max="260"
          value={newPeriod}
          onChange={(event) =>
            setNewPeriod(Math.max(1, Math.min(260, Number(event.target.value) || 1)))
          }
          style={{ marginTop: 8 }}
        />
        <PeriodCalc weeks={newPeriod} />
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

function AddSlotModal({
  options,
  remaining,
  slotOptionId,
  setSlotOptionId,
  slotTimes,
  setSlotTimes,
  onSave,
  onClose,
  onOpenPlanner,
}) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal wide" onClick={(event) => event.stopPropagation()}>
        <div className="head-with-help">
          <h3>Add completion option</h3>
          <HelpTip
            title="Add completion to an event plan"
            steps={[
              "Pick a default or custom completion from the list.",
              "Set how many times (event weeks) you run it in this event plan.",
              "You cannot add more times than the plan has left.",
              "Scroll to the bottom to create your own route in Floor Planner.",
            ]}
          />
        </div>
        <p className="muted">
          Pick a default or custom completion. {remaining} time
          {remaining === 1 ? "" : "s"} left in this event plan.
        </p>
        <div className="option-pick-list">
          {options.map((opt) => (
            <button
              className={`option-row pick${slotOptionId === opt.id ? " selected-pick" : ""}`}
              type="button"
              key={opt.id}
              onClick={() => setSlotOptionId(opt.id)}
            >
              <div className="option-title">
                <span className="option-name">{opt.name}</span>
                <Stars value={opt.rating_avg} />
                <span className="rating-score">
                  {Number(opt.rating_avg || 0).toFixed(1)}
                </span>
              </div>
              <div className="option-preview-row">
                <span className="option-open">
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
                </span>
              </div>
            </button>
          ))}
          {onOpenPlanner ? (
            <button
              className="gold-btn create-planner-btn"
              type="button"
              onClick={() => {
                onClose();
                onOpenPlanner();
              }}
            >
              Create your own Floor Planner
            </button>
          ) : null}
        </div>
        <label className="muted" style={{ display: "block", marginTop: 12 }}>
          How many times
          <input
            className="cell-input"
            type="number"
            min="1"
            max={remaining}
            value={slotTimes}
            onChange={(event) =>
              setSlotTimes(
                Math.max(1, Math.min(remaining, Number(event.target.value) || 1))
              )
            }
            style={{ marginTop: 6 }}
          />
        </label>
        <div className="row-actions">
          <button className="gold-btn" type="button" onClick={onSave} disabled={!slotOptionId}>
            Add
          </button>
          <button className="tan-btn" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
