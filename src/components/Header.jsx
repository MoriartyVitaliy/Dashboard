import { useEffect, useState } from "react";
import HorizonStrip from "./HorizonStrip";

function greetingFor(hour) {
  if (hour < 5) return "Не спится";
  if (hour < 11) return "Доброе утро";
  if (hour < 17) return "Добрый день";
  if (hour < 22) return "Добрый вечер";
  return "Доброй ночи";
}

export default function Header() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const date = now.toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <header className="header">
      <div className="header__row">
        <div>
          <p className="header__eyebrow">Приборная панель</p>
          <h1 className="header__greeting">
            {greetingFor(now.getHours())}.
          </h1>
          <p className="header__date">{date}</p>
        </div>
        <div className="header__clock">{time}</div>
      </div>
      <HorizonStrip />
    </header>
  );
}
