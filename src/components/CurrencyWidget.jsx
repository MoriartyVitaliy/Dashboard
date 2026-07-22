import DataWidget from "./DataWidget";

const TARGETS = ["EUR"];

async function fetchRates() {
  const res = await fetch(`https://api.frankfurter.app/latest?from=USD&to=${TARGETS.join(",")}`);
  if (!res.ok) throw new Error("Курсы недоступны");
  const json = await res.json();
  return json.rates;
}

export default function CurrencyWidget() {
  return (
    <DataWidget
      cacheKey="currency.usd"
      ttl={60 * 60 * 1000}
      fetcher={fetchRates}
      eyebrow="Курсы валют"
      title="1 USD"
      className="card--currency"
      skeletonLines={TARGETS.length}
      renderReady={(rates) => (
        <ul className="currency-list">
          {TARGETS.map((code) => (
            <li key={code}>
              <span className="currency-list__code">{code}</span>
              <span className="currency-list__value">{rates[code]?.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      )}
    />
  );
}