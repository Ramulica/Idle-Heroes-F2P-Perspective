import { StarPicker } from "./StarRating.jsx";

export function DiscountToggle({ checked, onChange }) {
  return (
    <span
      className={`discount-toggle${checked ? " on" : ""}`}
      onClick={(event) => event.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        onClick={(event) => event.stopPropagation()}
      />
      <span>12th floor Discount</span>
    </span>
  );
}

export function RateModal({ title, value, onChange, onSave, onClose }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <h3>{title}</h3>
        <StarPicker value={value} onChange={onChange} />
        <div className="row-actions">
          <button className="gold-btn" type="button" onClick={onSave}>
            Save rating
          </button>
          <button className="tan-btn" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CompletionMenu({
  option,
  value,
  onChange,
  onSaveRating,
  onToggleDiscount,
  onRename,
  onDelete,
  onRemoveSlot,
  onClose,
}) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <h3>{option.name}</h3>
        <p className="muted" style={{ margin: "0 0 6px" }}>
          Rate
        </p>
        <StarPicker value={value} onChange={onChange} />
        <div className="row-actions">
          <button className="gold-btn" type="button" onClick={onSaveRating}>
            Save rating
          </button>
        </div>
        <div style={{ marginTop: 12 }}>
          <DiscountToggle
            checked={Boolean(option.floor_12_discount)}
            onChange={onToggleDiscount}
          />
        </div>
        <div className="row-actions">
          <button className="tan-btn" type="button" onClick={onRename}>
            Rename
          </button>
          <button className="tan-btn danger" type="button" onClick={onDelete}>
            Delete
          </button>
          {onRemoveSlot ? (
            <button className="tan-btn danger" type="button" onClick={onRemoveSlot}>
              Remove from case
            </button>
          ) : null}
          <button className="tan-btn" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
