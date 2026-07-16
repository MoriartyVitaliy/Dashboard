import { useEffect, useState } from "react";
import { SunIcon } from "./icons";
import Card from "./Card";

const TARGETS = ["EUR", "GBP", "UAH", "JPY"];

export default function CurrencyWidget() {
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch(`https://api.frankfurter.app/latest?from=USD&to=${TARGETS.join(",")}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setState({ status: "ready", rates: data.rates, date: data.date });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card eyebrow="Курсы валют" title="1 USD" className="card--currency">
      {state.status === "loading" && <p className="muted">Загружаю курсы…</p>}
      {state.status === "error" && <p className="muted">Курсы недоступны</p>}
      {state.status === "ready" && (
        <ul className="currency-list">
          {TARGETS.map((code) => (
            <li key={code}>
              <span className="currency-list__code">{code}</span>
              <span className="currency-list__value">
                {state.rates[code]?.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
