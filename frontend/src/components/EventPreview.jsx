import HelpTip from "./HelpTip.jsx";

export default function EventPreview({ events }) {
  return (
    <div>
      <article className="info-card" style={{ marginBottom: 12 }}>
        <div className="head-with-help">
          <h3>Event preview</h3>
          <HelpTip
            title="Event preview"
            steps={[
              "This is last year’s event list, kept so you can guess PO / scrolls / wishing coins.",
              "Use it as a calendar hint, not a guarantee of this year’s order.",
            ]}
          />
        </div>
        <p>
          Last year’s event list, kept here so F2P players can guess the next
          round of PO / scrolls / wishing coins.
        </p>
      </article>
      <div className="event-grid">
        <div className="event-row" style={{ fontWeight: 800 }}>
          <span>#</span>
          <span>Date</span>
          <span>Event</span>
          <span>Resource</span>
        </div>
        {(events || []).map((event) => (
          <div className="event-row" key={event.id}>
            <span>{event.event_number || "—"}</span>
            <span>{event.date || "—"}</span>
            <strong>{event.name}</strong>
            <span>{event.resource_type || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
