const { useState, useEffect, useRef } = React;

// ── Config ────────────────────────────────────────────────────────────────
const API_KEY = 'YOUR_API_KEY_HERE'; // 🔑 Replace with your OpenWeatherMap key
const BASE    = 'https://api.openweathermap.org/data/2.5';

// ── Helpers ───────────────────────────────────────────────────────────────
function getWeatherIcon(code) {
  if (code >= 200 && code < 300) return '⛈️';
  if (code >= 300 && code < 400) return '🌦️';
  if (code >= 500 && code < 600) return '🌧️';
  if (code >= 600 && code < 700) return '❄️';
  if (code >= 700 && code < 800) return '🌫️';
  if (code === 800)               return '☀️';
  if (code > 800)                 return '⛅';
  return '🌡️';
}

function getBg(code) {
  if (code >= 200 && code < 300) return 'stormy';
  if (code >= 500 && code < 600) return 'rainy';
  if (code >= 600 && code < 700) return 'snowy';
  if (code === 800)               return 'sunny';
  return 'cloudy';
}

function formatDay(dt) {
  return new Date(dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
}

function formatTime(dt) {
  return new Date(dt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// ── Sub-components ────────────────────────────────────────────────────────
function SearchBar({ onSearch }) {
  const [city, setCity] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSearch = () => {
    if (city.trim()) onSearch(city.trim());
  };

  return (
    <div className="search-bar">
      <input
        ref={inputRef}
        placeholder="🌍 Search any city…"
        value={city}
        onChange={e => setCity(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSearch()}
      />
      <button onClick={handleSearch}>🔍</button>
    </div>
  );
}

function CurrentWeather({ data }) {
  const { name, main, weather, wind, sys, visibility } = data;
  const sunrise = formatTime(sys.sunrise);
  const sunset  = formatTime(sys.sunset);

  return (
    <div className="current-weather">
      <div className="location-row">
        <h1>{name}, <span className="country">{sys.country}</span></h1>
        <p className="local-time">{new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}</p>
      </div>

      <div className="icon-temp">
        <span className="big-icon">{getWeatherIcon(weather[0].id)}</span>
        <div className="temp-block">
          <span className="temperature">{Math.round(main.temp)}°C</span>
          <span className="feels">Feels like {Math.round(main.feels_like)}°C</span>
        </div>
      </div>

      <p className="description">{weather[0].description}</p>

      <div className="details-grid">
        <div className="detail-item">
          <span className="detail-icon">💧</span>
          <span className="detail-label">Humidity</span>
          <span className="detail-val">{main.humidity}%</span>
        </div>
        <div className="detail-item">
          <span className="detail-icon">🌬️</span>
          <span className="detail-label">Wind</span>
          <span className="detail-val">{wind.speed} m/s</span>
        </div>
        <div className="detail-item">
          <span className="detail-icon">👁️</span>
          <span className="detail-label">Visibility</span>
          <span className="detail-val">{visibility ? (visibility/1000).toFixed(1)+'km' : 'N/A'}</span>
        </div>
        <div className="detail-item">
          <span className="detail-icon">🔽</span>
          <span className="detail-label">Pressure</span>
          <span className="detail-val">{main.pressure} hPa</span>
        </div>
        <div className="detail-item">
          <span className="detail-icon">🌅</span>
          <span className="detail-label">Sunrise</span>
          <span className="detail-val">{sunrise}</span>
        </div>
        <div className="detail-item">
          <span className="detail-icon">🌇</span>
          <span className="detail-label">Sunset</span>
          <span className="detail-val">{sunset}</span>
        </div>
      </div>
    </div>
  );
}

function HourlyCard({ item }) {
  return (
    <div className="hourly-card">
      <p className="hour-label">{formatTime(item.dt)}</p>
      <span className="hour-icon">{getWeatherIcon(item.weather[0].id)}</span>
      <p className="hour-temp">{Math.round(item.main.temp)}°</p>
      <p className="hour-rain">{Math.round((item.pop || 0) * 100)}% 💧</p>
    </div>
  );
}

function ForecastCard({ day }) {
  const minTemp = Math.round(day.main.temp_min);
  const maxTemp = Math.round(day.main.temp_max);
  return (
    <div className="forecast-card">
      <p className="forecast-day">{formatDay(day.dt)}</p>
      <span className="forecast-icon">{getWeatherIcon(day.weather[0].id)}</span>
      <p className="forecast-desc">{day.weather[0].main}</p>
      <div className="forecast-temps">
        <span className="temp-high">{maxTemp}°</span>
        <span className="temp-divider">/</span>
        <span className="temp-low">{minTemp}°</span>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────
function App() {
  const [weather,  setWeather]  = useState(null);
  const [forecast, setForecast] = useState(null);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [bgTheme,  setBgTheme]  = useState('default');
  const [tab,      setTab]      = useState('forecast'); // 'forecast' | 'hourly'

  async function fetchWeather(city) {
    if (!city.trim()) return;
    setLoading(true);
    setError('');
    setWeather(null);
    setForecast(null);
    try {
      const [wRes, fRes] = await Promise.all([
        fetch(`${BASE}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`),
        fetch(`${BASE}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`)
      ]);
      if (!wRes.ok) throw new Error('City not found 😕 Please check the spelling!');
      const wData = await wRes.json();
      const fData = await fRes.json();
      setWeather(wData);
      setForecast(fData);
      setBgTheme(getBg(wData.weather[0].id));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Daily forecast: pick noon entry per day
  const daily = forecast
    ? forecast.list.filter(i => i.dt_txt.includes('12:00:00')).slice(0, 5)
    : [];

  // Hourly: next 8 entries (24 hours)
  const hourly = forecast ? forecast.list.slice(0, 8) : [];

  return (
    <div className={`app theme-${bgTheme}`}>
      <header className="app-header">
        <div className="logo-wrap">
          <span className="logo-icon">⛅</span>
          <span className="logo-text">SkyCast</span>
        </div>
        <SearchBar onSearch={fetchWeather} />
      </header>

      <main className="app-main">
        {loading && (
          <div className="status-card">
            <div className="spinner">🌀</div>
            <p>Fetching weather data…</p>
          </div>
        )}

        {error && (
          <div className="status-card error-card">
            <p className="error-msg">{error}</p>
            <p className="error-hint">Try cities like "Tokyo", "Paris" or "New York" 🌏</p>
          </div>
        )}

        {weather && <CurrentWeather data={weather} />}

        {forecast && (
          <div className="forecast-section">
            <div className="tab-bar">
              <button
                className={`tab-btn ${tab === 'forecast' ? 'active' : ''}`}
                onClick={() => setTab('forecast')}
              >📅 5-Day Forecast</button>
              <button
                className={`tab-btn ${tab === 'hourly' ? 'active' : ''}`}
                onClick={() => setTab('hourly')}
              >🕐 Hourly</button>
            </div>

            {tab === 'forecast' && (
              <div className="forecast-row">
                {daily.map(day => <ForecastCard key={day.dt} day={day} />)}
              </div>
            )}

            {tab === 'hourly' && (
              <div className="hourly-row">
                {hourly.map(item => <HourlyCard key={item.dt} item={item} />)}
              </div>
            )}
          </div>
        )}

        {!weather && !loading && !error && (
          <div className="welcome-card">
            <div className="welcome-icons">🌤️ 🌧️ ❄️ ⛅</div>
            <h2>Welcome to SkyCast!</h2>
            <p>Search for any city to see live weather ✨</p>
            <div className="quick-cities">
              {['London', 'Tokyo', 'New York', 'Sydney'].map(c => (
                <button key={c} className="quick-btn" onClick={() => fetchWeather(c)}>{c}</button>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by OpenWeatherMap 🌐 | Built with ❤️ SkyCast</p>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);