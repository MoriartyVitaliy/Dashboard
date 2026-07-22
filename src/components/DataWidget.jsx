import { useState } from "react";
import Card from "./Card";
import { useWidgetData } from "../hooks/useWidgetData";

export default function DataWidget({
  cacheKey,
  ttl,
  fetcher,
  eyebrow,
  title,
  className,
  skeletonLines = 3,
  emptyMessage,
  isEmpty,
  renderReady,
  settings,
}) {
  const { status, data, message, reload } = useWidgetData(cacheKey, fetcher, { ttl });

  return (
    <Card
      eyebrow={eyebrow}
      title={title}
      className={className}
      aside={
        settings && (
          <button
            type="button"
            className="widget-settings-btn"
            onClick={settings.toggle}
            aria-label="Настройки"
            title="Настройки"
          >
            <p>Нажмите, чтобы редактировать: <i class="fas fa-pen"></i></p>

          </button>
        )
      }
    >
      {settings?.isOpen ? (
        settings.render(() => settings.toggle())
      ) : status === "loading" && !data ? (
        <div className="widget-skeleton">
          {Array.from({ length: skeletonLines }).map((_, i) => (
            <div key={i} className="widget-skeleton__line" />
          ))}
        </div>
      ) : status === "error" && !data ? (
        <div className="widget-error">
          <p>{message || "Не удалось загрузить данные"}</p>
          <button className="text-btn" type="button" onClick={reload}>
            Повторить
          </button>
        </div>
      ) : data && isEmpty?.(data) ? (
        <p className="muted">{emptyMessage || "Пусто"}</p>
      ) : data ? (
        renderReady(data, { reload, stale: status === "error" })
      ) : null}
    </Card>
  );
}

export function useSettingsToggle() {
  const [isOpen, setIsOpen] = useState(false);
  return { isOpen, toggle: () => setIsOpen((v) => !v) };
}