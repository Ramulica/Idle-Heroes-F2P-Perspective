export default function MenuIconButton({ onClick, label = "Menu" }) {
  return (
    <button
      className="tan-btn menu-icon-btn"
      type="button"
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(event);
      }}
    >
      <span className="menu-lines" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </button>
  );
}
