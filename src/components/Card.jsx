export default function Card({ eyebrow, title, className = "", icon, children, aside }) {
  return (
    <section className={`card ${className}`}>
      <div className="card__head">
        <div className="card__heading">
          {icon && <span className="card__icon">{icon}</span>}
          <div>
            {eyebrow && <p className="card__eyebrow">{eyebrow}</p>}
            {title && <h2 className="card__title">{title}</h2>}
          </div>
        </div>
        {aside && <div className="card__aside">{aside}</div>}
      </div>
      <div className="card__body">{children}</div>
    </section>
  );
}