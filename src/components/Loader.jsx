function Loader({ label = "Loading academics" }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <div className="skeleton-grid">
        <div className="skeleton stat" />
        <div className="skeleton stat" />
        <div className="skeleton stat" />
        <div className="skeleton stat" />
        <div className="skeleton panel wide" />
        <div className="skeleton panel" />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export default Loader;
