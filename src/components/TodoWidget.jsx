import { useEffect, useState } from "react";
import { SunIcon } from "./icons";
import Card from "./Card";

export default function TodoWidget() {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("deck.todos")) || [];
    } catch {
      return [];
    }
  });
  const [draft, setDraft] = useState("");

  useEffect(() => {
    localStorage.setItem("deck.todos", JSON.stringify(items));
  }, [items]);

  function addItem(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setItems((prev) => [...prev, { id: crypto.randomUUID(), text, done: false }]);
    setDraft("");
  }

  function toggle(id) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, done: !it.done } : it))
    );
  }

  function remove(id) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  const remaining = items.filter((i) => !i.done).length;

  return (
    <Card eyebrow="На сегодня" title={`${remaining} в работе`} className="card--todo">
      <form className="inline-form" onSubmit={addItem}>
        <input
          className="inline-form__input"
          placeholder="добавить задачу…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="inline-form__btn" type="submit">
          +
        </button>
      </form>
      <ul className="todo-list">
        {items.length === 0 && <li className="muted">Пока пусто</li>}
        {items.map((item) => (
          <li key={item.id} className={item.done ? "is-done" : ""}>
            <label>
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => toggle(item.id)}
              />
              <span>{item.text}</span>
            </label>
            <button className="todo-list__remove" onClick={() => remove(item.id)}>
              ×
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
