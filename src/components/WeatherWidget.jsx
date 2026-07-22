import { useEffect, useState } from "react";
import { SunIcon } from "./icons";
import Card from "./Card";

const WEATHER_LABELS = {
  0: "Sunny",
  1: "Mainly Sunny",
  2: "Partly Cloudy",
  3: "Cloudy",
  45: "Fog",
  48: "Freezing Fog",
  51: "Drizzle",
  61: "Rain",
  63: "Rain",
  65: "Heavy Rain",
  71: "Snow",
  73: "Snow",
  75: "Heavy Snow",
  80: "Shower",
  95: "Thunderstorm",
};

// Default fallback: Kyiv
const FALLBACK = { lat: 50.450001, lon: 30.523333, label: "Kyiv" };

export default function WeatherWidget() {
  const [state, setState] = useState({ status: "loading" });
  const [place, setPlace] = useState(FALLBACK.label);

  useEffect(() => {
    let cancelled = false;

    function fetchWeather(lat, lon) {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&timezone=auto`;
      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return;
          setState({ status: "ready", data: data.current });
        })
        .catch(() => {
          if (!cancelled) setState({ status: "error" });
        });
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPlace("Ваше местоположение");
          fetchWeather(pos.coords.latitude, pos.coords.longitude);
        },
        () => fetchWeather(FALLBACK.lat, FALLBACK.lon),
        { timeout: 4000 }
      );
    } else {
      fetchWeather(FALLBACK.lat, FALLBACK.lon);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card eyebrow="Погода" title={place} className="card--weather">
      {state.status === "loading" && <p className="muted">Finding…</p>}
      {state.status === "error" && <p className="muted">Failed to fetch weather data</p>}
      {state.status === "ready" && (
        <div className="weather">
          <span className="weather__temp">
            {Math.round(state.data.temperature_2m)}°
          </span>
          <div className="weather__meta">
            <p>{WEATHER_LABELS[state.data.weather_code] ?? "—"}</p>
            <p className="muted">
              Wind {Math.round(state.data.wind_speed_10m)} km/h · Humidity{" "}
              {state.data.relative_humidity_2m}%
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
