const STAR_PATH =
  "M12 2.4l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.18 6.2 20.27l1.11-6.47-4.7-4.58 6.49-.94L12 2.4z";

function starAmount(score, index) {
  const raw = Number(score) - (index - 1);
  if (raw <= 0.24) return 0;
  if (raw < 0.76) return 0.5;
  return 1;
}

function StarSvg({ fill = 0 }) {
  const amount = Math.max(0, Math.min(1, fill));
  return (
    <svg className="star-svg" viewBox="0 0 24 24" aria-hidden="true">
      <path className="star-svg-empty" d={STAR_PATH} />
      {amount === 1 ? <path className="star-svg-full" d={STAR_PATH} /> : null}
      {amount === 0.5 ? (
        <svg x="0" y="0" width="12" height="24" viewBox="0 0 12 24">
          <path className="star-svg-full" d={STAR_PATH} />
        </svg>
      ) : null}
      <path className="star-svg-outline" d={STAR_PATH} />
    </svg>
  );
}

export function Stars({ value = 0 }) {
  const score = Number(value) || 0;
  return (
    <span className="star-row" title={`${score.toFixed(1)} / 5`}>
      {[1, 2, 3, 4, 5].map((index) => (
        <span className="star" key={index}>
          <StarSvg fill={starAmount(score, index)} />
        </span>
      ))}
    </span>
  );
}

export function StarPicker({ value, onChange }) {
  const score = Number(value) || 0;
  return (
    <div>
      <div className="star-picker">
        <button
          className={score === 0 ? "gold-btn" : "tan-btn"}
          type="button"
          onClick={() => onChange(0)}
        >
          0
        </button>
        {[1, 2, 3, 4, 5].map((index) => (
          <span className="star pick" key={index}>
            <button
              className="half left"
              type="button"
              aria-label={`${index - 0.5} stars`}
              onClick={() => onChange(index - 0.5)}
            />
            <button
              className="half right"
              type="button"
              aria-label={`${index} stars`}
              onClick={() => onChange(index)}
            />
            <StarSvg fill={starAmount(score, index)} />
          </span>
        ))}
      </div>
      <p className="muted">Your rating: {score.toFixed(1)} / 5 (half stars allowed)</p>
    </div>
  );
}
