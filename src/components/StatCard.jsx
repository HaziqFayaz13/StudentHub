import Icon from "./Icon.jsx";

function StatCard({ label, value, hint, tone, icon, delta }) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-top">
        <span className="stat-icon">
          <Icon name={icon} />
        </span>
        {delta ? <small className={delta.startsWith("-") ? "delta down" : "delta up"}>{delta}</small> : null}
      </div>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{hint}</span>
    </article>
  );
}

export default StatCard;
