 function getWeatherIcon(code, isDay = true) {
            const icons = {
                0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
                45: '🌫️', 48: '🌫️',
                51: '🌦️', 53: '🌦️', 55: '🌧️',
                61: '🌧️', 63: '🌧️', 65: '🌧️',
                71: '🌨️', 73: '🌨️', 75: '🌨️',
                77: '🌨️', 80: '🌦️', 81: '🌧️',
                82: '🌧️', 85: '🌨️', 86: '🌨️',
                95: '⛈️', 96: '⛈️', 99: '⛈️'
            };
            return icons[code] || '🌤️';
        }

        function getWeatherDescription(code) {
            const descriptions = {
                0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
                45: 'Foggy', 48: 'Foggy',
                51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
                61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
                71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
                77: 'Snow grains', 80: 'Slight rain showers', 81: 'Moderate rain showers',
                82: 'Violent rain showers', 85: 'Slight snow showers', 86: 'Heavy snow showers',
                95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail'
            };
            return descriptions[code] || 'Unknown';
        }

        async function getCoordinates(city) {
            const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
            const data = await response.json();
            if (!data.results || data.results.length === 0) {
                throw new Error('City not found');
            }
            return {
                lat: data.results[0].latitude,
                lon: data.results[0].longitude,
                name: data.results[0].name,
                country: data.results[0].country
            };
        }

        async function getWeather(lat, lon) {
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
            return await response.json();
        }

        function updateCurrentWeather(location, weather) {
            const current = weather.current;
            
            document.getElementById('location').textContent = `${location.name}, ${location.country}`;
            document.getElementById('date').textContent = new Date().toLocaleDateString('en-US', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            });
            document.getElementById('currentIcon').textContent = getWeatherIcon(current.weather_code);
            document.getElementById('temperature').textContent = `${Math.round(current.temperature_2m)}°C`;
            document.getElementById('description').textContent = getWeatherDescription(current.weather_code);
            document.getElementById('feelsLike').textContent = `${Math.round(current.apparent_temperature)}°C`;
            document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;
            document.getElementById('windSpeed').textContent = `${Math.round(current.wind_speed_10m)} km/h`;
            document.getElementById('pressure').textContent = `${Math.round(current.pressure_msl)} hPa`;
        }

        function updateHourlyForecast(weather) {
            const hourly = weather.hourly;
            const container = document.getElementById('hourlyForecast');
            container.innerHTML = '';

            for (let i = 0; i < 24; i++) {
                const time = new Date(hourly.time[i]);
                const div = document.createElement('div');
                div.className = 'hourly-item';
                div.innerHTML = `
                    <div class="time">${time.getHours()}:00</div>
                    <div class="icon">${getWeatherIcon(hourly.weather_code[i])}</div>
                    <div class="temp">${Math.round(hourly.temperature_2m[i])}°C</div>
                `;
                container.appendChild(div);
            }
        }

        function updateDailyForecast(weather) {
            const daily = weather.daily;
            const container = document.getElementById('dailyForecast');
            container.innerHTML = '';

            for (let i = 0; i < 7; i++) {
                const date = new Date(daily.time[i]);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const div = document.createElement('div');
                div.className = 'daily-item';
                div.innerHTML = `
                    <div class="day">${i === 0 ? 'Today' : dayName}</div>
                    <div class="icon">${getWeatherIcon(daily.weather_code[i])}</div>
                    <div class="temps">
                        <span class="temp-max">${Math.round(daily.temperature_2m_max[i])}°</span>
                        <span class="temp-min">${Math.round(daily.temperature_2m_min[i])}°</span>
                    </div>
                `;
                container.appendChild(div);
            }
        }

        async function searchWeather() {
            const city = document.getElementById('cityInput').value.trim();
            if (!city) return;

            const loading = document.getElementById('loading');
            const content = document.getElementById('weatherContent');
            const errorMsg = document.getElementById('errorMsg');

            loading.style.display = 'block';
            content.style.display = 'none';
            errorMsg.style.display = 'none';

            try {
                const location = await getCoordinates(city);
                const weather = await getWeather(location.lat, location.lon);

                updateCurrentWeather(location, weather);
                updateHourlyForecast(weather);
                updateDailyForecast(weather);

                loading.style.display = 'none';
                content.style.display = 'block';
            } catch (error) {
                loading.style.display = 'none';
                errorMsg.textContent = error.message || 'Failed to fetch weather data. Please try again.';
                errorMsg.style.display = 'block';
            }
        }

        document.getElementById('cityInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchWeather();
        });

        // Load default city on page load
        searchWeather();