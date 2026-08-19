import { useMemo, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";
import HelpTip from "./HelpTip.jsx";

export const EVENT_RESOURCE_TYPES = ["PO", "Scrolls", "Wishing Coins"];
const EVENT_EDITOR_USERNAME = "Ramulica";

function eventYear(value) {
  if (!value) return null;
  const year = Number(String(value).slice(0, 4));
  return Number.isInteger(year) && year > 0 ? year : null;
}

function sortEventsByDateDesc(events) {
  return [...(events || [])].sort((a, b) => {
    const first = a.date || "";
    const second = b.date || "";
    if (!first && !second) return (b.id || 0) - (a.id || 0);
    if (!first) return 1;
    if (!second) return -1;
    if (second !== first) return second.localeCompare(first);
    return (b.id || 0) - (a.id || 0);
  });
}

function eventNumberLabel(event, numberedIds) {
  const year = eventYear(event.date);
  const currentYear = new Date().getFullYear();
  if (year == null) return "—";
  if (year < currentYear) return "last year";
  const index = numberedIds.get(event.id);
  return index != null ? String(index) : "—";
}

export default function EventPreview({ events, onChange }) {
  const user = useAuth()?.user;
  const canAdd =
    Boolean(user?.username === EVENT_EDITOR_USERNAME) && !user?.guest;
  const [addOpen, setAddOpen] = useState(false);
  const rows = useMemo(() => {
    const sorted = sortEventsByDateDesc(events);
    const currentYear = new Date().getFullYear();
    const numbered = [...sorted]
      .filter((event) => {
        const year = eventYear(event.date);
        return year != null && year >= currentYear;
      })
      .sort((a, b) => {
        const first = a.date || "";
        const second = b.date || "";
        if (first === second) return (a.id || 0) - (b.id || 0);
        return first.localeCompare(second);
      });
    const numberedIds = new Map(
      numbered.map((event, index) => [event.id, index + 1])
    );
    return { sorted, numberedIds };
  }, [events]);

  return (
    <div>
      <article className="info-card" style={{ marginBottom: 12 }}>
        <div className="head-with-help">
          <h3>Event preview</h3>
          <HelpTip
            title="Event preview"
            steps={[
              "Newest events are at the top.",
              "Dates from last year show last year. This year’s events are numbered 1 until they end.",
              "Use it as a calendar hint for PO / scrolls / wishing coins.",
            ]}
          />
        </div>
        <p>
          Event list by date, newest first. Last year’s dates stay marked last
          year. This year’s events are numbered from 1 until they end.
        </p>
        {canAdd ? (
          <div className="sale-top-actions" style={{ marginTop: 12 }}>
            <button
              className="gold-btn"
              type="button"
              onClick={() => setAddOpen(true)}
            >
              Add one event
            </button>
          </div>
        ) : null}
      </article>
      <div className="event-grid">
        <div className="event-row" style={{ fontWeight: 800 }}>
          <span>#</span>
          <span>Date</span>
          <span>Event</span>
          <span>Resource</span>
        </div>
        {rows.sorted.map((event) => (
          <div className="event-row" key={event.id}>
            <span>{eventNumberLabel(event, rows.numberedIds)}</span>
            <span>{event.date || "—"}</span>
            <strong>{event.name}</strong>
            <span>{event.resource_type || "—"}</span>
          </div>
        ))}
      </div>
      {addOpen ? (
        <AddEventModal
          onClose={() => setAddOpen(false)}
          onSaved={async () => {
            setAddOpen(false);
            await onChange?.();
          }}
        />
      ) : null}
    </div>
  );
}

function AddEventModal({ onClose, onSaved }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [name, setName] = useState("");
  const [resourceType, setResourceType] = useState(EVENT_RESOURCE_TYPES[0]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.createEvent({
        date,
        name: trimmed,
        resource_type: resourceType,
      });
      await onSaved();
    } catch (err) {
      setError(err.message || "Could not add the event.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="head-with-help">
          <h3>Add one event</h3>
          <HelpTip
            title="Add one event"
            steps={[
              "Pick the date, name the event, then choose PO, Scrolls, or Wishing Coins.",
              "The list sorts by date, newest first.",
            ]}
          />
        </div>
        <label className="field">
          <span>Date</span>
          <input
            className="cell-input"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
        <label className="field" style={{ marginTop: 10 }}>
          <span>Name</span>
          <input
            className="cell-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Event name"
            autoFocus
          />
        </label>
        <p className="muted" style={{ margin: "12px 0 6px" }}>
          Resource
        </p>
        <div className="filter-chips">
          {EVENT_RESOURCE_TYPES.map((type) => (
            <button
              key={type}
              className={resourceType === type ? "gold-btn" : "tan-btn"}
              type="button"
              onClick={() => setResourceType(type)}
            >
              {type}
            </button>
          ))}
        </div>
        {error ? <p className="error">{error}</p> : null}
        <div className="row-actions">
          <button
            className="gold-btn"
            type="button"
            onClick={save}
            disabled={busy}
          >
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
