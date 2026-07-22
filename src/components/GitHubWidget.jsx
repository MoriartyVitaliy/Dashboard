import { useMemo, useState } from "react";
import DataWidget, { useSettingsToggle } from "./DataWidget";

const EVENT_META = {
  PushEvent: { label: "запушил в", color: "#2da44e", icon: "commit" },
  PullRequestEvent: { label: "PR в", color: "#8250df", icon: "pr" },
  IssuesEvent: { label: "issue в", color: "#1a7f37", icon: "issue" },
  WatchEvent: { label: "поставил звезду", color: "#bf8700", icon: "star" },
  CreateEvent: { label: "создал", color: "#57606a", icon: "repo" },
  ForkEvent: { label: "форкнул", color: "#57606a", icon: "fork" },
  IssueCommentEvent: { label: "прокомментировал в", color: "#57606a", icon: "comment" },
};

const FILTER_GROUPS = [
  { key: "all", label: "Всё", types: null },
  { key: "code", label: "Код", types: ["PushEvent", "PullRequestEvent"] },
  { key: "issues", label: "Issues", types: ["IssuesEvent", "IssueCommentEvent"] },
  { key: "stars", label: "Звёзды", types: ["WatchEvent"] },
  { key: "repos", label: "Репо", types: ["CreateEvent", "ForkEvent"] },
];

const ICONS = {
  commit: "M8 1a3 3 0 100 6 3 3 0 000-6zM1 8h4.05a3.001 3.001 0 015.9 0H15a.75.75 0 010 1.5h-4.05a3.001 3.001 0 01-5.9 0H1a.75.75 0 010-1.5z",
  pr: "M1.5 3.25a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zm5.677-.177L9.573.677A.25.25 0 0110 .854V2.5h1A2.5 2.5 0 0113.5 5v5.628a2.251 2.251 0 11-1.5 0V5a1 1 0 00-1-1h-1v1.646a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354z",
  issue: "M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3a1 1 0 11-2 0 1 1 0 012 0zM6.5 4.5a1.5 1.5 0 113 0v3a1.5 1.5 0 01-3 0v-3z",
  star: "M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z",
  repo: "M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2H4.5a1 1 0 00-.994 1.117.75.75 0 11-1.492-.154A2.5 2.5 0 014.5 11h8.5V1.5H4.5a1 1 0 00-1 1v9c0 .144.017.284.049.417a.75.75 0 11-1.457.366A2.5 2.5 0 012 11.5v-9z",
  fork: "M5 3.25a.75.75 0 100-1.5.75.75 0 000 1.5zm7 0a.75.75 0 100-1.5.75.75 0 000 1.5zM5.75 4.5v1.75A2.25 2.25 0 008 8.5a2.25 2.25 0 002.25-2.25V4.5m0 6.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0z",
  comment: "M2 2.5A1.5 1.5 0 013.5 1h9A1.5 1.5 0 0114 2.5v7A1.5 1.5 0 0112.5 11H8.06l-2.573 2.573A.25.25 0 015 13.396V11H3.5A1.5 1.5 0 012 9.5v-7z",
};

function Octicon({ name, color }) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill={color} aria-hidden="true">
      <path d={ICONS[name] || ICONS.commit} />
    </svg>
  );
}

const USER_KEY = "deck.github";

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return `${Math.floor(diff / 86400)} дн назад`;
}

async function fetchActivity(username) {
  const res = await fetch(`https://api.github.com/users/${username}/events/public?per_page=30`);
  if (res.status === 404) throw new Error(`Пользователь «${username}» не найден`);
  if (!res.ok) throw new Error("Не удалось загрузить активность");
  return res.json();
}

export default function GitHubWidget() {
  const [username, setUsername] = useState(() => localStorage.getItem(USER_KEY) || "");
  const settings = useSettingsToggle();
  const [draft, setDraft] = useState(username);
  const [filter, setFilter] = useState("all");

  function submitUsername(e) {
    e.preventDefault();
    const clean = draft.trim();
    localStorage.setItem(USER_KEY, clean);
    setUsername(clean);
    settings.toggle();
  }

  return (
    <DataWidget
      cacheKey={username ? `github.${username}` : null}
      ttl={10 * 60 * 1000}
      fetcher={() => fetchActivity(username)}
      eyebrow="GitHub"
      title={
        username ? (
          <span className="gh-title">
            <img
              className="gh-title__avatar"
              src={`https://github.com/${username}.png?size=40`}
              alt=""
              width={20}
              height={20}
            />
            @{username}
          </span>
        ) : (
          "Не задан"
        )
      }
      className="card--github"
      isEmpty={(events) => events.length === 0}
      emptyMessage="Публичной активности нет"
      settings={{
        isOpen: settings.isOpen || !username,
        toggle: settings.toggle,
        render: () => (
          <form className="inline-form" onSubmit={submitUsername}>
            <input
              className="inline-form__input"
              placeholder="ник на GitHub"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
            />
            <button className="inline-form__btn" type="submit">Показать</button>
          </form>
        ),
      }}
      renderReady={(events) => {
        const activeGroup = FILTER_GROUPS.find((g) => g.key === filter);
        const filtered =
          !activeGroup?.types ? events : events.filter((ev) => activeGroup.types.includes(ev.type));

        return (
          <>
            <div className="gh-filters" role="tablist" aria-label="Фильтр по типу активности">
              {FILTER_GROUPS.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  role="tab"
                  aria-selected={filter === g.key}
                  className={`gh-filters__btn${filter === g.key ? " is-active" : ""}`}
                  onClick={() => setFilter(g.key)}
                >
                  {g.label}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <p className="muted gh-filters__empty">Нет событий этого типа</p>
            ) : (
              <ul className="activity-list activity-list--gh">
                {filtered.map((ev) => {
                  const meta = EVENT_META[ev.type] || { label: ev.type, color: "#57606a", icon: "commit" };
                  return (
                    <li key={ev.id} data-type={ev.type}>
                      <span className="activity-list__icon" style={{ "--gh-color": meta.color }}>
                        <Octicon name={meta.icon} color={meta.color} />
                      </span>
                      <span className="activity-list__label">{meta.label}</span>
                      <a
                        className="activity-list__repo"
                        href={`https://github.com/${ev.repo?.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {ev.repo?.name}
                      </a>
                      <span className="activity-list__time">{timeAgo(ev.created_at)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        );
      }}
    />
  );
}