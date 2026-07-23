import DataWidget from "./DataWidget";

const BASE = "USD";
const TARGETS = ["EUR", "UAH", "GBP", "JPY"];

const numberFormatters = new Map();
function formatRate(value, code) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  if (!numberFormatters.has(code)) {
    numberFormatters.set(
      code,
      new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: code,
        currencyDisplay: "narrowSymbol",
        maximumFractionDigits: value >= 100 ? 1 : 2,
      })
    );
  }
  return numberFormatters.get(code).format(value);
}

async function fetchFromSource(url, signal) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Курсы недоступны (${res.status})`);
  const json = await res.json();
  if (!json?.rates) throw new Error("Некорректный ответ сервера курсов");
  return json.rates;
}

async function fetchRates() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  const primary = `https://api.frankfurter.app/latest?from=${BASE}&to=${TARGETS.join(",")}`;

  const fallback = `https://open.er-api.com/v6/latest/${BASE}`;

  try {
    try {
      return await fetchFromSource(primary, controller.signal);
    } catch (primaryErr) {
      if (primaryErr.name === "AbortError") throw primaryErr;

      const fallbackJson = await fetch(fallback, { signal: controller.signal });
      if (!fallbackJson.ok) throw primaryErr;
      const data = await fallbackJson.json();
      const rates = {};
      for (const code of TARGETS) {
        if (typeof data?.rates?.[code] === "number") rates[code] = data.rates[code];
      }
      if (Object.keys(rates).length === 0) throw primaryErr;
      return rates;
    }
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      throw new Error("Превышено время ожидания курсов");
    }
    if (err instanceof TypeError) {
      throw new Error("Нет соединения с сервером курсов (проверьте сеть или CSP)");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export default function CurrencyWidget() {
  return (
    <DataWidget
      cacheKey={`currency.${BASE}.${TARGETS.join("-")}`}
      ttl={6 * 60 * 60 * 1000}
      fetcher={fetchRates}
      eyebrow="Курсы валют"
      title={`1 ${BASE}`}
      className="card--currency"
      skeletonLines={TARGETS.length}
      renderReady={(rates) => (
        <ul className="currency-list">
          {TARGETS.map((code) => (
            <li key={code}>
              <span className="currency-list__code">{code}</span>
              <span className="currency-list__value">{formatRate(rates[code], code)}</span>
            </li>
          ))}
        </ul>
      )}
    />
  );
}