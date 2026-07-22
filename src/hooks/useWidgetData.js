import { useCallback, useEffect, useRef, useState } from "react";

const CACHE_PREFIX = "deck.widgetcache.";

function readCache(key, ttl) {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_PREFIX + key));
    if (raw && Date.now() - raw.savedAt < ttl) return raw.data;
  } catch {
  }
  return null;
}

function writeCache(key, data) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
  }
}

export function useWidgetData(key, fetcher, { ttl = 5 * 60 * 1000 } = {}) {
  const cached = key ? readCache(key, ttl) : null;
  const [state, setState] = useState(
    cached ? { status: "ready", data: cached } : { status: key ? "loading" : "idle" }
  );
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(() => {
    if (!key) return;
    setState((s) => ({ status: "loading", data: s.data }));
    Promise.resolve()
      .then(() => fetcherRef.current())
      .then((data) => {
        writeCache(key, data);
        setState({ status: "ready", data });
      })
      .catch((err) => {
        setState((s) => ({
          status: "error",
          data: s.data,
          message: err?.message,
        }));
      });
  }, [key]);

  useEffect(() => {
    if (!key) {
      setState({ status: "idle" });
      return;
    }
    if (cached) return;
    load();
  }, [key]);

  return { ...state, reload: load };
}