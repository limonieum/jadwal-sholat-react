import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const Particles = () => {
  const [particles] = useState(() => 
    Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      size: Math.random() * 3 + 1, 
      left: Math.random() * 100, 
      animationDuration: Math.random() * 20 + 15, 
      animationDelay: Math.random() * 15,
    }))
  );

  return (
    <div className="particles-container">
      {particles.map(p => (
        <div 
          key={p.id}
          className="particle"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: `${p.left}%`,
            animationDuration: `${p.animationDuration}s`,
            animationDelay: `-${p.animationDelay}s`,
          }}
        />
      ))}
    </div>
  );
};

function App() {
  const [data, setData] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextPrayerId, setNextPrayerId] = useState(null);
  const [countdown, setCountdown] = useState(null);
  
  // Dynamic Theme State
  const getThemeClass = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 10) return 'theme-morning'; // Pagi
    if (hour >= 10 && hour < 15) return 'theme-day'; // Siang
    if (hour >= 15 && hour < 18) return 'theme-afternoon'; // Sore/Senja
    return 'theme-night'; // Malam
  };
  const [theme, setTheme] = useState(getThemeClass());
  
  // Default to Jakarta
  const city = "Jakarta";
  const country = "Indonesia";

  const getWeatherDescription = (code) => {
    if (code === 0) return { text: "Cerah", icon: "☀️" };
    if ([1, 2, 3].includes(code)) return { text: "Berawan", icon: "⛅" };
    if ([45, 48].includes(code)) return { text: "Berkabut", icon: "🌫️" };
    if ([51, 53, 55].includes(code)) return { text: "Gerimis", icon: "🌦️" };
    if ([61, 63, 65].includes(code)) return { text: "Hujan", icon: "🌧️" };
    if ([71, 73, 75].includes(code)) return { text: "Bersalju", icon: "❄️" };
    if ([95, 96, 99].includes(code)) return { text: "Badai Petir", icon: "⛈️" };
    return { text: "Cerah", icon: "☀️" };
  };

  const calculateCountdown = (timings) => {
    if (!timings) return;
    
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentSeconds = now.getSeconds();
    
    const timeToSeconds = (timeString) => {
      const [hours, minutes] = timeString.split(':').map(Number);
      return (hours * 3600) + (minutes * 60);
    };

    const currentTotalSeconds = (currentHours * 3600) + (currentMinutes * 60) + currentSeconds;

    const prayerSchedule = [
      { id: 'Fajr', time: timeToSeconds(timings.Fajr), name: 'Subuh' },
      { id: 'Sunrise', time: timeToSeconds(timings.Sunrise), name: 'Terbit' },
      { id: 'Dhuhr', time: timeToSeconds(timings.Dhuhr), name: 'Dzuhur' },
      { id: 'Asr', time: timeToSeconds(timings.Asr), name: 'Ashar' },
      { id: 'Maghrib', time: timeToSeconds(timings.Maghrib), name: 'Maghrib' },
      { id: 'Isha', time: timeToSeconds(timings.Isha), name: 'Isya' }
    ];

    let next = prayerSchedule.find(p => p.time > currentTotalSeconds);
    
    let diffSeconds = 0;
    if (!next) {
      next = { ...prayerSchedule[0] };
      setNextPrayerId(next.id);
      diffSeconds = (86400 - currentTotalSeconds) + next.time;
    } else {
      setNextPrayerId(next.id);
      diffSeconds = next.time - currentTotalSeconds;
    }

    const h = Math.floor(diffSeconds / 3600);
    const m = Math.floor((diffSeconds % 3600) / 60);
    const s = diffSeconds % 60;

    setCountdown({ 
      hours: h.toString().padStart(2, '0'), 
      minutes: m.toString().padStart(2, '0'), 
      seconds: s.toString().padStart(2, '0'),
      name: next.name
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const prayerResponse = await axios.get(
          `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=11`
        );
        const timingsData = prayerResponse.data.data.timings;
        setData(prayerResponse.data.data);
        
        calculateCountdown(timingsData);

        const weatherResponse = await axios.get(
          `https://api.open-meteo.com/v1/forecast?latitude=-6.2088&longitude=106.8456&current_weather=true`
        );
        setWeather(weatherResponse.data.current_weather);
        
        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Gagal mengambil data. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [city, country]);

  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    if (data && data.timings) {
      calculateCountdown(data.timings);
    }
    const interval = setInterval(() => {
      if (data && data.timings) {
        calculateCountdown(data.timings);
      }
      setTheme(getThemeClass());
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [data]);

  if (loading && !data) {
    return (
      <div className="app-container">
        <div className="loading">Memuat Data...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="app-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  const timings = data.timings;
  const dateInfo = data.date;
  
  const prayers = [
    { id: 'Fajr', name: 'Subuh', time: timings.Fajr },
    { id: 'Sunrise', name: 'Terbit', time: timings.Sunrise },
    { id: 'Dhuhr', name: 'Dzuhur', time: timings.Dhuhr },
    { id: 'Asr', name: 'Ashar', time: timings.Asr },
    { id: 'Maghrib', name: 'Maghrib', time: timings.Maghrib },
    { id: 'Isha', name: 'Isya', time: timings.Isha }
  ];

  let weatherData = { text: "Mencari cuaca...", icon: "⏳", temp: "" };
  if (weather) {
    const w = getWeatherDescription(weather.weathercode);
    weatherData = {
      text: w.text,
      icon: w.icon,
      temp: `${Math.round(weather.temperature)}°C`
    };
  }

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayName = days[currentTime.getDay()];
  const currentH = currentTime.getHours().toString().padStart(2, '0');
  const currentM = currentTime.getMinutes().toString().padStart(2, '0');
  const currentS = currentTime.getSeconds().toString().padStart(2, '0');

  return (
    <div className={`app-container ${theme}`}>
      <Particles />

      {/* Top Bar */}
      <div className="top-bar">
        <div className="location-wrapper">
          <div className="location-info">
            <h2>{city}</h2>
            <p>{country}</p>
          </div>
          {weather && (
            <div className="weather-info">
              <span className="weather-icon">{weatherData.icon}</span>
              <span className="weather-temp">{weatherData.temp}</span>
              <span className="weather-desc">• {weatherData.text}</span>
            </div>
          )}
        </div>
        
        <div className="date-wrapper">
          <div className="date-info">
            <div className="clock-wrapper">
              <div className="live-clock">
                {currentH}<span className="clock-separator">:</span>{currentM}<span className="clock-separator">:</span>{currentS}
              </div>
            </div>
            <div className="gregorian">{dayName}, {dateInfo.readable}</div>
            <div className="hijri">{dateInfo.hijri.day} {dateInfo.hijri.month.en} {dateInfo.hijri.year} H</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <h1 className="title">Jadwal Sholat</h1>
          <p className="subtitle">Waktu pengingat ibadah Anda hari ini</p>
          
          {countdown && (
            <div className="countdown-container">
              <span className="countdown-text">Menuju {countdown.name}</span>
              <div className="countdown-timer">
                <div className="countdown-box">
                  {countdown.hours}
                  <span className="countdown-label">JAM</span>
                </div>
                <span className="countdown-separator">:</span>
                <div className="countdown-box">
                  {countdown.minutes}
                  <span className="countdown-label">MENIT</span>
                </div>
                <span className="countdown-separator">:</span>
                <div className="countdown-box">
                  {countdown.seconds}
                  <span className="countdown-label">DETIK</span>
                </div>
              </div>
            </div>
          )}
        </header>

        <section className="times-row">
          {prayers.map((prayer) => (
            <div 
              key={prayer.id} 
              className={`time-card ${nextPrayerId === prayer.id ? 'next-prayer' : ''}`}
            >
              <div className="time-card-content">
                <div className="prayer-name">{prayer.name}</div>
                <div className="prayer-time">{prayer.time}</div>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

export default App;
