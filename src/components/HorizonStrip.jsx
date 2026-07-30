import { useEffect, useState } from "react";

function skyColorAt(hour) {
  const stops = [
    { h: 0, c: [55, 48, 163] }, // deep indigo night
    { h: 5, c: [55, 48, 163] },
    { h: 7, c: [96, 165, 250] }, // sky blue dawn
    { h: 10, c: [251, 191, 36] }, // amber morning
    { h: 13, c: [245, 158, 11] }, // midday amber
    { h: 16, c: [251, 146, 60] }, // afternoon orange
    { h: 19, c: [244, 114, 182] }, // rose dusk
    { h: 22, c: [79, 70, 229] }, // indigo evening
    { h: 24, c: [55, 48, 163] },
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (hour >= a.h && hour <= b.h) {
      const t = (hour - a.h) / (b.h - a.h || 1);
      const c = a.c.map((v, idx) => Math.round(v + (b.c[idx] - v) * t));
      return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
    }
  }
  return "rgb(13,26,32)";
}

export default function HorizonStrip() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const hourFrac = now.getHours() + now.getMinutes() / 60;
  const pct = (hourFrac / 24) * 100;

  const gradientStops = Array.from({ length: 13 }, (_, i) => {
    const h = i * 2;
    return `${skyColorAt(h)} ${(h / 24) * 100}%`;
  }).join(", ");

  const ticks = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="horizon">
      <div
        className="horizon__band"
        style={{ background: `linear-gradient(90deg, ${gradientStops})` }}
      />
      <div className="horizon__ticks">
        {ticks.map((h) => (
          <span
            key={h}
            className="horizon__tick"
            style={{ left: `${(h / 24) * 100}%` }}
            data-major={h % 6 === 0 ? "true" : undefined}
          >
            {h % 6 === 0 && <em>{String(h).padStart(2, "0")}</em>}
          </span>
        ))}
      </div>
      <div className="horizon__marker" style={{ left: `${pct}%` }} title="Сейчас">
        <span className="horizon__dot" />
      </div>
    </div>
  );
}