import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import DataWidget from "./DataWidget";

const BASE = "USD";
const STORAGE_KEY = "dashboard.currency.targets";

// --- доступные валюты ---

const FIAT_OPTIONS = ["EUR", "UAH", "GBP", "JPY", "PLN", "CHF", "CAD", "CNY", "TRY", "KZT"];

const CRYPTO_OPTIONS = [
  { code: "BTC", id: "bitcoin" },
  { code: "ETH", id: "ethereum" },
  { code: "SOL", id: "solana" },
  { code: "BNB", id: "binancecoin" },
  { code: "XRP", id: "ripple" },
  { code: "ADA", id: "cardano" },
  { code: "DOGE", id: "dogecoin" },
  { code: "TON", id: "the-open-network" },
  { code: "LTC", id: "litecoin" },
  { code: "DOT", id: "polkadot" },
];

const CRYPTO_BY_CODE = new Map(CRYPTO_OPTIONS.map((c) => [c.code, c.id]));

const DEFAULT_TARGETS = [
  { code: "EUR", type: "fiat" },
  { code: "UAH", type: "fiat" },
  { code: "GBP", type: "fiat" },
  { code: "JPY", type: "fiat" },
  { code: "BTC", type: "crypto" },
];

// --- персистентность выбора пользователя ---

let memoryTargets = null;
 
function loadTargets() {
  if (memoryTargets && Array.isArray(memoryTargets) && memoryTargets.length > 0) {
    return memoryTargets;
  }
  return DEFAULT_TARGETS;
}
 
function saveTargets(targets) {
  memoryTargets = targets;
}

// --- форматирование ---

const numberFormatters = new Map();
function formatRate(value, code, type) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
 

  const bucket =
    type === "crypto"
      ? value >= 1000
        ? "hi"
        : value >= 1
        ? "mid"
        : "lo"
      : value >= 100
      ? "hi"
      : "lo";
  const key = `${code}:${type}:${bucket}`;
 
  if (!numberFormatters.has(key)) {
    if (type === "crypto") {
      numberFormatters.set(
        key,
        new Intl.NumberFormat("ru-RU", {
          style: "currency",
          currency: "USD",
          currencyDisplay: "narrowSymbol",
          maximumFractionDigits: value >= 1000 ? 0 : value >= 1 ? 2 : 6,
        })
      );
    } else {
      numberFormatters.set(
        key,
        new Intl.NumberFormat("ru-RU", {
          style: "currency",
          currency: code,
          currencyDisplay: "narrowSymbol",
          maximumFractionDigits: value >= 100 ? 1 : 2,
        })
      );
    }
  }
  return numberFormatters.get(key).format(value);
}

// --- источники данных ---

async function fetchJson(url, signal) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Курсы недоступны (${res.status})`);
  return res.json();
}

async function fetchFiatRates(codes, signal) {
  if (codes.length === 0) return {};
  const primary = `https://api.frankfurter.app/latest?from=${BASE}&to=${codes.join(",")}`;
  const fallback = `https://open.er-api.com/v6/latest/${BASE}`;

  try {
    const json = await fetchJson(primary, signal);
    if (!json?.rates) throw new Error("Некорректный ответ сервера курсов");
    return json.rates;
  } catch (primaryErr) {
    if (primaryErr.name === "AbortError") throw primaryErr;
    const data = await fetchJson(fallback, signal);
    const rates = {};
    for (const code of codes) {
      if (typeof data?.rates?.[code] === "number") rates[code] = data.rates[code];
    }
    if (Object.keys(rates).length === 0) throw primaryErr;
    return rates;
  }
}

async function fetchCryptoRates(codes, signal) {
  if (codes.length === 0) return {};
  const ids = codes.map((c) => CRYPTO_BY_CODE.get(c)).filter(Boolean);
  if (ids.length === 0) return {};
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd`;
  const data = await fetchJson(url, signal);
  const rates = {};
  for (const code of codes) {
    const id = CRYPTO_BY_CODE.get(code);
    const price = data?.[id]?.usd;
    if (typeof price === "number") rates[code] = price;
  }
  return rates;
}

async function fetchRates(targets) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  const fiatCodes = targets.filter((t) => t.type === "fiat").map((t) => t.code);
  const cryptoCodes = targets.filter((t) => t.type === "crypto").map((t) => t.code);

  try {
    const [fiat, crypto] = await Promise.all([
      fetchFiatRates(fiatCodes, controller.signal).catch((err) => {
        if (err.name === "AbortError") throw err;
        return { __error: err };
      }),
      fetchCryptoRates(cryptoCodes, controller.signal).catch((err) => {
        if (err.name === "AbortError") throw err;
        return { __error: err };
      }),
    ]);

    if (fiat?.__error && crypto?.__error) throw fiat.__error;

    const merged = {};
    if (!fiat?.__error) Object.assign(merged, fiat);
    if (!crypto?.__error) Object.assign(merged, crypto);
    return merged;
  } catch (err) {
    if (err.name === "AbortError") throw new Error("Превышено время ожидания курсов");
    if (err instanceof TypeError) throw new Error("Нет соединения с сервером курсов (проверьте сеть или CSP)");
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

  function moveTarget(from, to) {
    if (from === to || from < 0 || to < 0 || from >= targets.length || to >= targets.length) return;
    setTargets((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }
 
  function handleDragStart(index) {
    setDragIndex(index);
  }
 
  function handleDragOver(e, index) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (index !== dragOverIndex) setDragOverIndex(index);
  }
 
  function handleDrop(index) {
    if (dragIndex !== null) moveTarget(dragIndex, index);
    setDragIndex(null);
    setDragOverIndex(null);
  }
 
  function handleDragEnd() {
    setDragIndex(null);
    setDragOverIndex(null);
  }

export default function CurrencyWidget() {
  const [targets, setTargets] = useState(loadTargets);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingCode, setPendingCode] = useState("");
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const itemRefs = useRef(new Map());
  const prevRectsRef = useRef(new Map());
  
  function captureRects() {
    const map = new Map();
    itemRefs.current.forEach((el, code) => {
      if (el) map.set(code, el.getBoundingClientRect());
    });
    prevRectsRef.current = map;
  }

  useLayoutEffect(() => {
    const prevRects = prevRectsRef.current;
    itemRefs.current.forEach((el, code) => {
      if (!el) return;
      const prev = prevRects.get(code);
      if (!prev) return;
      const next = el.getBoundingClientRect();
      const dx = prev.left - next.left;
      const dy = prev.top - next.top;
      if (dx || dy) {
        el.style.transition = "none";
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        requestAnimationFrame(() => {
          el.style.transition = "transform 200ms ease";
          el.style.transform = "";
        });
      }
    });
  }, [targets]);

  function moveTarget(from, to) {
    if (from === to || from < 0 || to < 0 || from >= targets.length || to >= targets.length) return;
    captureRects();
    setTargets((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function handleDragStart(index) {
    captureRects();
    setDragIndex(index);
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (index !== dragOverIndex) setDragOverIndex(index);
  }

  function handleDrop(index) {
    if (dragIndex !== null) moveTarget(dragIndex, index);
    setDragIndex(null);
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setDragOverIndex(null);
  }

  useEffect(() => {
    saveTargets(targets);
  }, [targets]);

  const availableOptions = useMemo(() => {
    const used = new Set(targets.map((t) => t.code));
    const fiat = FIAT_OPTIONS.filter((c) => !used.has(c)).map((code) => ({ code, type: "fiat" }));
    const crypto = CRYPTO_OPTIONS.filter((c) => !used.has(c.code)).map(({ code }) => ({ code, type: "crypto" }));
    return [...fiat, ...crypto];
  }, [targets]);

  function addTarget(code) {
    const option = availableOptions.find((o) => o.code === code);
    if (!option) return;
    setTargets((prev) => [...prev, option]);
    setPendingCode("");
    setPickerOpen(false);
  }

  function removeTarget(code) {
    setTargets((prev) => prev.filter((t) => t.code !== code));
  }

  const cacheKey = `currency.${BASE}.${targets.map((t) => t.code).sort().join("-")}`;

  return (
    <DataWidget
      cacheKey={cacheKey}
      ttl={6 * 60 * 60 * 1000}
      fetcher={() => fetchRates(targets)}
      eyebrow="Курсы валют"
      title={`1 ${BASE}`}
      className="card--currency"
      skeletonLines={targets.length || 3}
      renderReady={(rates) => (
        <>
          <ul className="currency-list">
            {targets.map(({ code, type }, index) => (
              <li key={code}>
                <span
                  ref={(el) => {
                    if (el) itemRefs.current.set(code, el);
                    else itemRefs.current.delete(code);
                  }}
                  className={`currency-list__item${dragIndex === index ? " is-dragging" : ""}${
                    dragOverIndex === index && dragIndex !== null && dragIndex !== index ? " is-drop-target" : ""
                  }`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={handleDragEnd}
                >
                  <span className="currency-list__handle" aria-hidden="true" title="Перетащите, чтобы изменить порядок">
                    ⠿
                  </span>
                  {code}
                  {type === "crypto" && <span className="currency-list__badge">крипто</span>}
                </span>
                <span className="currency-list__value">{formatRate(rates[code], code, type)}</span>
                <button
                  type="button"
                  className="currency-list__remove"
                  onClick={() => removeTarget(code)}
                  aria-label={`Убрать ${code}`}
                  title={`Убрать ${code}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          {pickerOpen ? (
            <div className="inline-form">
              <select
                className="inline-form__input"
                value={pendingCode}
                onChange={(e) => setPendingCode(e.target.value)}
              >
                <option value="" disabled>
                  Выберите валюту
                </option>
                {availableOptions.length === 0 && <option disabled>Все уже добавлены</option>}
                {availableOptions.map((o) => (
                  <option key={o.code} value={o.code}>
                    {o.code} {o.type === "crypto" ? "(крипто)" : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="inline-form__btn"
                disabled={!pendingCode}
                onClick={() => addTarget(pendingCode)}
              >
                Добавить
              </button>
            </div>
          ) : (
            <button type="button" className="text-btn" onClick={() => setPickerOpen(true)}>
              + добавить валюту
            </button>
          )}
        </>
      )}
    />
  );
}