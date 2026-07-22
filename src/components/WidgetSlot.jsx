import PointerHandle from "./PointerHandle";

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
      <PointerHandle
        className="widget-slot__handle"
        label={`Перетащить «${label}»`}
        title="Перетащить"
        onDown={onPointerDown}
        onMove={onPointerMove}
        onUp={onPointerUp}
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <circle cx="5" cy="3" r="1.3" fill="currentColor" />
          <circle cx="11" cy="3" r="1.3" fill="currentColor" />
          <circle cx="5" cy="8" r="1.3" fill="currentColor" />
          <circle cx="11" cy="8" r="1.3" fill="currentColor" />
          <circle cx="5" cy="13" r="1.3" fill="currentColor" />
          <circle cx="11" cy="13" r="1.3" fill="currentColor" />
        </svg>
      </PointerHandle>

      <PointerHandle
        className="widget-slot__resize"
        label={`Изменить размер «${label}»`}
        title="Изменить размер"
        onDown={onResizePointerDown}
        onMove={onResizePointerMove}
        onUp={onResizePointerUp}
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
      </PointerHandle>

      {children}
    </div>
  );
}