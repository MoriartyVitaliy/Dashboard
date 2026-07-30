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
const MIN_W = 18; // %
const MIN_H = 110; // px

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
    // ignore
  }
  return DEFAULT_LAYOUT;
}

export default function App() {
  const [layout, setLayout] = useState(loadLayout);
  const [interaction, setInteraction] = useState(null); // { id, mode: 'move'|'resize', rect, blocked }
  const containerRef = useRef(null);
  const dragStartRef = useRef(null);
  const resizeStartRef = useRef(null);

  function persist(next) {
    setLayout(next);
    localStorage.setItem("deck.canvas", JSON.stringify(next));
  }

  // ---------- Перетаскивание ----------

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
      setInteraction({ id, mode: "move", rect, blocked: false });
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

      setInteraction({ id, mode: "move", rect: candidate, blocked: collides });
    },
    [layout]
  );

  // ---------- Изменение размера ----------

  const startResize = useCallback(
    (id, e) => {
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      const rect = layout[id];
      resizeStartRef.current = {
        pointerX: e.clientX,
        pointerY: e.clientY,
        containerWidth,
        startRect: rect,
      };
      setInteraction({ id, mode: "resize", rect, blocked: false });
    },
    [layout]
  );

  const moveResize = useCallback(
    (id, e) => {
      const start = resizeStartRef.current;
      if (!start) return;
      const dwPct = ((e.clientX - start.pointerX) / start.containerWidth) * 100;
      const dhPx = e.clientY - start.pointerY;

      const maxW = 100 - start.startRect.x;
      const w = Math.min(Math.max(MIN_W, start.startRect.w + dwPct), maxW);
      const h = Math.max(MIN_H, start.startRect.h + dhPx);

      const candidate = { ...start.startRect, w, h };

      const collides = Object.entries(layout).some(
        ([key, rect]) => key !== id && overlaps(candidate, rect)
      );

      setInteraction({ id, mode: "resize", rect: candidate, blocked: collides });
    },
    [layout]
  );

  // ---------- Завершение (общее для move/resize) ----------

  const endInteraction = useCallback(() => {
    setInteraction((current) => {
      if (current && !current.blocked) {
        persist({ ...layout, [current.id]: current.rect });
      }
      return null;
    });
    dragStartRef.current = null;
    resizeStartRef.current = null;
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
          const rect = interaction?.id === id ? interaction.rect : layout[id];
          const isDragging = interaction?.id === id;
          const isBlocked = isDragging && interaction.blocked;
          return (
            <WidgetSlot
              key={id}
              id={id}
              label={label}
              rect={rect}
              isDragging={isDragging}
              isBlocked={isBlocked}
              onPointerDown={(e) => startDrag(id, e)}
              onPointerMove={(e) => moveDrag(id, e)}
              onPointerUp={endInteraction}
              onResizePointerDown={(e) => startResize(id, e)}
              onResizePointerMove={(e) => moveResize(id, e)}
              onResizePointerUp={endInteraction}
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