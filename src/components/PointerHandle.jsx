export default function PointerHandle({
  className,
  label,
  title,
  onDown,
  onMove,
  onUp,
  children,
}) {
  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      title={title}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        onDown(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) onMove(e);
      }}
      onPointerUp={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
          onUp(e);
        }
      }}
      onPointerCancel={onUp}
    >
      {children}
    </button>
  );
}