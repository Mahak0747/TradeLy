export function Loading({ label = "Loading…" }) {
  return (
    <div className="status-block" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorNotice({ message, onRetry }) {
  return (
    <div className="status-block status-error" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="btn btn-grey" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function StaleNote({ show, children = "Showing last known prices - live data is temporarily unavailable." }) {
  return show ? <div className="stale-note">{children}</div> : null;
}
