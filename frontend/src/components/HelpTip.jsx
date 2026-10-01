import { useState } from "react";

function AdvancedBody({ sections }) {
  return (
    <div className="help-advanced">
      {sections.map((section) => (
        <article key={section.heading}>
          <h4>{section.heading}</h4>
          {(section.paragraphs || []).map((text) => (
            <p key={text}>{text}</p>
          ))}
          {section.formula ? (
            <pre className="help-formula">{section.formula}</pre>
          ) : null}
          {section.items?.length ? (
            <ul>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}
    </div>
  );
}

export default function HelpTip({
  title,
  steps = [],
  message = "",
  advanced = null,
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("use");
  const hasAdvanced = Array.isArray(advanced) && advanced.length > 0;
  const showUse = !hasAdvanced || tab === "use";

  function close() {
    setOpen(false);
    setTab("use");
  }

  return (
    <>
      <button
        className="info-btn"
        type="button"
        aria-label={title}
        title={title}
        onClick={(event) => {
          event.stopPropagation();
          setTab("use");
          setOpen(true);
        }}
      >
        <svg className="info-btn-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="7.6" r="1.4" fill="currentColor" />
          <path
            d="M12 11.1v6.3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {open ? (
        <div className="modal-back" onClick={close}>
          <div
            className={`modal${hasAdvanced ? " wide" : ""}`}
            onClick={(event) => event.stopPropagation()}
          >
            <h3>
              {showUse && (message && !steps.length)
                ? title
                : showUse
                  ? `How to use: ${title}`
                  : `Advanced: ${title}`}
            </h3>
            {hasAdvanced ? (
              <div className="help-tabs">
                <button
                  className={`help-tab${tab === "use" ? " on" : ""}`}
                  type="button"
                  onClick={() => setTab("use")}
                >
                  How to use
                </button>
                <button
                  className={`help-tab${tab === "advanced" ? " on" : ""}`}
                  type="button"
                  onClick={() => setTab("advanced")}
                >
                  Advanced
                </button>
              </div>
            ) : null}
            {showUse ? (
              <>
                {message ? <p>{message}</p> : null}
                {steps.length ? (
                  <ul className="help-steps">
                    {steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <AdvancedBody sections={advanced} />
            )}
            <div className="row-actions">
              <button className="gold-btn" type="button" onClick={close}>
                Got it
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
