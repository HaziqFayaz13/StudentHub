function EmptyState({ title, copy, action }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{copy}</p>
      {action}
    </div>
  );
}

export default EmptyState;
