export function Spinner({ label = "Loading" }) {
  return (
    <div className="spin-wrap" role="status" aria-label={label}>
      <span className="spin-circle" aria-hidden="true" />
    </div>
  );
}

export function LoadingScreen({ message = "Loading..." }) {
  return (
    <div className="loading-screen">
      <Spinner />
      <p>{message}</p>
    </div>
  );
}

export function LoadingOverlay({ message = "Working..." }) {
  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <Spinner label={message} />
      <p>{message}</p>
    </div>
  );
}
