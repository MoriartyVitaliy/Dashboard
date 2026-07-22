import { useState } from "react";
import DataWidget, { useSettingsToggle } from "./DataWidget";

const WEATHER_LABELS = {
  0: "Sunny", 1: "Mainly Sunny", 2: "Partly Cloudy", 3: "Cloudy",
  45: "Fog", 48: "Freezing Fog", 51: "Drizzle",
  61: "Rain", 63: "Rain", 65: "Heavy Rain",
  71: "Snow", 73: "Snow", 75: "Heavy Snow",
  80: "Shower", 95: "Thunderstorm",
};

const FALLBACK = { lat: 50.450001, lon: 30.523333, label: "Kyiv" };
const CITY_KEY = "deck.weather.city";

function geolocate() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: FALLBACK.lat, lon: FALLBACK.lon, label: FALLBACK.label });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, label: "Ваше местоположение" }),
      () => resolve({ lat: FALLBACK.lat, lon: FALLBACK.lon, label: FALLBACK.label }),
      { timeout: 4000 }
    );
  });
}

async function geocodeCity(name) {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=ru`
  );
  const geo = await res.json();
  const found = geo.results?.[0];
  if (!found) throw new Error(`Город «${name}» не найден`);
  return { lat: found.latitude, lon: found.longitude, label: found.name };
}

async function fetchWeather({ lat, lon, label }) {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&timezone=auto`
  );
  if (!res.ok) throw new Error("Не удалось загрузить погоду");
  const json = await res.json();
  return { ...json.current, place: label };
}

export default function WeatherWidget() {
  const savedCity = localStorage.getItem(CITY_KEY);
  const [cacheKey, setCacheKey] = useState(savedCity ? `weather.${savedCity}` : "weather.geo");
  const settings = useSettingsToggle();
  const [draft, setDraft] = useState("");

  const fetcher = async () => {
    if (savedCity && cacheKey === `weather.${savedCity}`) {
      return fetchWeather(await geocodeCity(savedCity));
    }
    return fetchWeather(await geolocate());
  };

  function submitCity(e) {
    e.preventDefault();
    const name = draft.trim();
    if (!name) return;
    localStorage.setItem(CITY_KEY, name);
    setCacheKey(`weather.${name}`);
    settings.toggle();
  }

  function useMyLocation() {
    localStorage.removeItem(CITY_KEY);
    setCacheKey(`weather.geo.${Date.now()}`);
    settings.toggle();
  }

  return (
    <DataWidget
      cacheKey={cacheKey}
      ttl={15 * 60 * 1000}
      fetcher={fetcher}
      eyebrow="Погода"
      title={savedCity || "Ваше местоположение"}
      className="card--weather"
      skeletonLines={2}
      settings={{
        isOpen: settings.isOpen,
        toggle: settings.toggle,
        render: () => (
          <form className="inline-form" onSubmit={submitCity}>
            <input
              className="inline-form__input"
              placeholder="Название города"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
            />
            <button className="inline-form__btn" type="submit">ОК</button>
            <button type="button" className="text-btn" onClick={useMyLocation}>
              geo
            </button>
          </form>
        ),
      }}
      renderReady={(data) => (
        <div className="weather">
          <span className="weather__temp">{Math.round(data.temperature_2m)}°</span>
          <div className="weather__meta">
            <p>{WEATHER_LABELS[data.weather_code] ?? "—"}</p>
            <p className="muted">
              Wind {Math.round(data.wind_speed_10m)} km/h · Humidity {data.relative_humidity_2m}%
            </p>
          </div>
        </div>
      )}
    />
  );
}