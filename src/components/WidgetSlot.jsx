export default function WidgetSlot({
  id,
  label,
  rect,
  children,
  isDragging,
  isBlocked,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onResizePointerDown,
  onResizePointerMove,
  onResizePointerUp,
}) {
  return (
    <div
      className={[
        "widget-slot",
        `widget-slot--${id}`,
        isDragging ? "is-dragging" : "",
        isBlocked ? "is-blocked" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        left: `${rect.x}%`,
        top: `${rect.y}px`,
        width: `${rect.w}%`,
        height: `${rect.h}px`,
      }}
    >
      <button
        type="button"
        className="widget-slot__handle"
        aria-label={`Перетащить «${label}»`}
        title="Перетащить"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          onPointerDown(e);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) onPointerMove(e);
        }}
        onPointerUp={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
            onPointerUp(e);
          }
        }}
        onPointerCancel={onPointerUp}
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <circle cx="5" cy="3" r="1.3" fill="currentColor" />
          <circle cx="11" cy="3" r="1.3" fill="currentColor" />
          <circle cx="5" cy="8" r="1.3" fill="currentColor" />
          <circle cx="11" cy="8" r="1.3" fill="currentColor" />
          <circle cx="5" cy="13" r="1.3" fill="currentColor" />
          <circle cx="11" cy="13" r="1.3" fill="currentColor" />
        </svg>
      </button>

      <button
        type="button"
        className="widget-slot__resize"
        aria-label={`Изменить размер «${label}»`}
        title="Изменить размер"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          onResizePointerDown(e);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) onResizePointerMove(e);
        }}
        onPointerUp={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
            onResizePointerUp(e);
          }
        }}
        onPointerCancel={onResizePointerUp}
      >
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
          <path
            d="M13 3 L3 13 M13 8 L8 13 M13 13 L13 13"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </button>

      {children}
    </div>
  );
}