import { useCallback, useMemo, useRef, useState } from "react";
import Header from "./components/Header";
import WidgetSlot from "./components/WidgetSlot";
import WeatherWidget from "./components/WeatherWidget";
import CurrencyWidget from "./components/CurrencyWidget";
import GitHubWidget from "./components/GitHubWidget";
import TodoWidget from "./components/TodoWidget";
import "./App.css";

const WIDGETS = {
  weather: { component: WeatherWidget, label: "Погода" },
  currency: { component: CurrencyWidget, label: "Курсы валют" },
  github: { component: GitHubWidget, label: "GitHub" },
  todo: { component: TodoWidget, label: "Задачи" },
};

const CANVAS_HEIGHT = 640;
const PADDING = 12;

const DEFAULT_LAYOUT = {
  weather: { x: 0, y: 0, w: 40, h: 180 },
  currency: { x: 62, y: 0, w: 40, h: 180 },
  github: { x: 0, y: 198, w: 40, h: 180 },
  todo: { x: 62, y: 198, w: 40, h: 180 },
};

function overlaps(a, b) {
  return (
    a.x < b.x + b.w + 0.01 &&
    a.x + a.w + 0.01 > b.x &&
    a.y < b.y + b.h + PADDING &&
    a.y + a.h + PADDING > b.y
  );
}

function loadLayout() {
  try {
    const saved = JSON.parse(localStorage.getItem("deck.canvas"));
    if (saved && Object.keys(WIDGETS).every((id) => saved[id])) return saved;
  } catch {

  }
  return DEFAULT_LAYOUT;
}

export default function App() {
  const [layout, setLayout] = useState(loadLayout);
  const [drag, setDrag] = useState(null);
  const containerRef = useRef(null);
  const dragStartRef = useRef(null);
  const lastValidRef = useRef(null);

  function persist(next) {
    setLayout(next);
    localStorage.setItem("deck.canvas", JSON.stringify(next));
  }

  const startDrag = useCallback(
    (id, e) => {
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      const rect = layout[id];
      dragStartRef.current = {
        pointerX: e.clientX,
        pointerY: e.clientY,
        containerWidth,
        startRect: rect,
      };
      lastValidRef.current = rect;
      setDrag({ id, rect, blocked: false });
    },
    [layout]
  );

  const moveDrag = useCallback(
    (id, e) => {
      const start = dragStartRef.current;
      if (!start) return;
      const dxPct = ((e.clientX - start.pointerX) / start.containerWidth) * 100;
      const dyPx = e.clientY - start.pointerY;

      const maxX = 100 - start.startRect.w;
      const maxY = CANVAS_HEIGHT - start.startRect.h;

      const candidate = {
        ...start.startRect,
        x: Math.min(Math.max(0, start.startRect.x + dxPct), maxX),
        y: Math.min(Math.max(0, start.startRect.y + dyPx), maxY),
      };

      const collides = Object.entries(layout).some(
        ([key, rect]) => key !== id && overlaps(candidate, rect)
      );

      if (!collides) {
        lastValidRef.current = candidate;
        setDrag({ id, rect: candidate, blocked: false });
      } else {
        setDrag({ id, rect: lastValidRef.current, blocked: true });
      }
    },
    [layout]
  );

  const endDrag = useCallback(() => {
    setDrag((current) => {
      if (current) persist({ ...layout, [current.id]: current.rect });
      return null;
    });
    dragStartRef.current = null;
    lastValidRef.current = null;
  }, [layout]);

  const canvasHeight = useMemo(() => {
    const maxBottom = Math.max(
      CANVAS_HEIGHT,
      ...Object.values(layout).map((r) => r.y + r.h + 24)
    );
    return maxBottom;
  }, [layout]);

  return (
    <div className="deck">
      <Header />
      <main className="canvas" ref={containerRef} style={{ height: canvasHeight }}>
        {Object.keys(WIDGETS).map((id) => {
          const { component: Widget, label } = WIDGETS[id];
          const rect = drag?.id === id ? drag.rect : layout[id];
          return (
            <WidgetSlot
              key={id}
              id={id}
              label={label}
              rect={rect}
              isDragging={drag?.id === id}
              isBlocked={drag?.id === id && drag.blocked}
              onPointerDown={(e) => startDrag(id, e)}
              onPointerMove={(e) => moveDrag(id, e)}
              onPointerUp={endDrag}
            >
              <Widget />
            </WidgetSlot>
          );
        })}
      </main>
      <footer className="footer">
        <span>Deck</span>
        <span className="muted">свободное расположение · позиции сохраняются</span>
      </footer>
    </div>
  );
}