import { useState } from "react";

export default function HelpTip({ title, steps = [] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="info-btn"
        type="button"
        aria-label={`How to use ${title}`}
        title="How to use"
        onClick={(event) => {
          event.stopPropagation();
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
        <div className="modal-back" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h3>How to use: {title}</h3>
            <ul className="help-steps">
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
            <div className="row-actions">
              <button className="gold-btn" type="button" onClick={() => setOpen(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
