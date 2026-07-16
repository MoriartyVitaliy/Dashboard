import { useEffect, useState } from "react";
import { SunIcon } from "./icons";
import Card from "./Card";

const EVENT_LABELS = {
  PushEvent: "запушил в",
  PullRequestEvent: "PR в",
  IssuesEvent: "issue в",
  WatchEvent: "поставил звезду",
  CreateEvent: "создал",
  ForkEvent: "форкнул",
  IssueCommentEvent: "прокомментировал в",
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return `${Math.floor(diff / 86400)} дн назад`;
}

export default function GitHubWidget() {
  const [username, setUsername] = useState(
    () => localStorage.getItem("deck.github") || ""
  );
  const [input, setInput] = useState(username);
  const [state, setState] = useState({ status: "idle" });

  useEffect(() => {
    if (!username) {
      setState({ status: "idle" });
      return;
    }
    let cancelled = false;
    setState({ status: "loading" });
    fetch(`https://api.github.com/users/${username}/events/public?per_page=5`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setState({ status: "ready", events: data });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  function handleSubmit(e) {
    e.preventDefault();
    const clean = input.trim();
    localStorage.setItem("deck.github", clean);
    setUsername(clean);
  }

  return (
    <Card eyebrow="GitHub" title={username || "Не задан"} className="card--github">
      {!username && (
        <form className="inline-form" onSubmit={handleSubmit}>
          <input
            className="inline-form__input"
            placeholder="ник на GitHub"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="inline-form__btn" type="submit">
            Показать
          </button>
        </form>
      )}
      {state.status === "loading" && <p className="muted">Загружаю активность…</p>}
      {state.status === "error" && <p className="muted">Пользователь не найден</p>}
      {state.status === "ready" && (
        <ul className="activity-list">
          {state.events.length === 0 && (
            <li className="muted">Публичной активности нет</li>
          )}
          {state.events.map((ev) => (
            <li key={ev.id}>
              <span className="activity-list__label">
                {EVENT_LABELS[ev.type] ?? ev.type}
              </span>{" "}
              <span className="activity-list__repo">{ev.repo?.name}</span>
              <span className="activity-list__time">{timeAgo(ev.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
      {username && (
        <button
          className="text-btn"
          onClick={() => {
            localStorage.removeItem("deck.github");
            setUsername("");
            setInput("");
          }}
        >
          сменить пользователя
        </button>
      )}
    </Card>
  );
}
