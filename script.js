const API_KEY = '84ecdcc082cb609ad1b85a80eb91ac94';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct';

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const loadingElement = document.getElementById('loading');
    const errorMsgElement = document.getElementById('errorMsg');
    const suggestionsDropdown = document.getElementById('suggestions');
    const mainWeatherCard = document.getElementById('mainWeatherCard');
    const welcomeCard = document.getElementById('welcomeCard');

    const cityName = document.getElementById('cityName');
    const countryCode = document.getElementById('countryCode');
    const temperature = document.getElementById('temperature');
    const feelsLike = document.getElementById('feelsLike');
    const humidity = document.getElementById('humidity');
    const windSpeed = document.getElementById('windSpeed');
    const pressure = document.getElementById('pressure');
    const visibility = document.getElementById('visibility');
    const cloudiness = document.getElementById('cloudiness');
    const weatherIcon = document.getElementById('weatherIcon');
    const weatherDescription = document.getElementById('weatherDescription');
    const sunrise = document.getElementById('sunrise');
    const sunset = document.getElementById('sunset');
    const uvIndex = document.getElementById('uvIndex');

    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    searchInput.addEventListener('input', handleSuggestions);

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-section')) {
            suggestionsDropdown.classList.remove('active');
        }
    });

    async function handleSearch() {
        const city = searchInput.value.trim();
        if (!city) {
            showError('Please enter a city name');
            return;
        }
        await fetchWeatherData(city);
        suggestionsDropdown.classList.remove('active');
    }

    async function handleSuggestions() {
        const query = searchInput.value.trim();
        if (query.length < 2) {
            suggestionsDropdown.classList.remove('active');
            return;
        }

        try {
            const suggestions = await getLocationSuggestions(query);
            displaySuggestions(suggestions);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    }

    async function fetchWeatherData(city) {
        try {
            showLoading(true);
            hideError();

            const weatherData = await fetchWeatherByCity(city);
            const uvData = await fetchUVIndex(weatherData.coord.lat, weatherData.coord.lon);

            displayWeatherData(weatherData, uvData);
            searchInput.value = '';
            showLoading(false);
        } catch (error) {
            showLoading(false);
            showError(error.message || 'Failed to fetch weather data');
            console.error('Error:', error);
        }
    }

    async function getLocationSuggestions(query) {
        try {
            const response = await fetch(`${GEO_URL}?q=${query}&limit=5&appid=${API_KEY}`);

            if (!response.ok) {
                throw new Error('Failed to fetch suggestions');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            throw error;
        }
    }

    async function fetchWeatherByCity(city) {
        try {
            const response = await fetch(`${BASE_URL}?q=${city}&units=metric&appid=${API_KEY}`);

            if (response.status === 404) {
                throw new Error(`City "${city}" not found. Please check the spelling and try again.`);
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            throw error;
        }
    }

    async function fetchUVIndex(lat, lon) {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch UV index');
            }

            const data = await response.json();
            return data.value;
        } catch (error) {
            console.error('Error fetching UV index:', error);
            return 'N/A';
        }
    }

    async function fetchWeatherByCoordinates(lat, lon) {
        try {
            const response = await fetch(
                `${BASE_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch weather data');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    function displayWeatherData(data, uvData) {
        cityName.textContent = data.name;
        countryCode.textContent = `${data.sys.country}`;

        temperature.textContent = Math.round(data.main.temp);
        feelsLike.textContent = Math.round(data.main.feels_like);

        weatherDescription.textContent = data.weather[0].main;
        const iconCode = data.weather[0].icon;
        weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
        weatherIcon.alt = data.weather[0].description;

        humidity.textContent = `${data.main.humidity}%`;
        windSpeed.textContent = `${data.wind.speed} m/s`;
        pressure.textContent = `${data.main.pressure} hPa`;
        visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
        cloudiness.textContent = `${data.clouds.all}%`;
        uvIndex.textContent = typeof uvData === 'number' ? parseFloat(uvData).toFixed(1) : uvData;

        sunrise.textContent = formatTime(data.sys.sunrise);
        sunset.textContent = formatTime(data.sys.sunset);

        mainWeatherCard.classList.remove('hidden');
        welcomeCard.classList.add('hidden');
    }

    function displaySuggestions(suggestions) {
        suggestionsDropdown.innerHTML = '';

        if (suggestions.length === 0) {
            suggestionsDropdown.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">No cities found</div>';
            suggestionsDropdown.classList.add('active');
            return;
        }

        suggestions.forEach((location) => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            const countryName = getCountryName(location.country);
            const state = location.state ? `, ${location.state}` : '';
            item.innerHTML = `
                <i class="fas fa-map-marker-alt"></i>
                <div>
                    <strong>${location.name}</strong>
                    <small style="display: block; color: var(--text-secondary); font-size: 0.85rem;">${countryName}${state}</small>
                </div>
            `;

            item.addEventListener('click', async () => {
                searchInput.value = location.name;
                await fetchWeatherData(location.name);
                suggestionsDropdown.classList.remove('active');
            });

            suggestionsDropdown.appendChild(item);
        });

        suggestionsDropdown.classList.add('active');
    }

    function formatTime(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    function getCountryName(code) {
        const countryNames = {
            'US': 'United States',
            'GB': 'United Kingdom',
            'IN': 'India',
            'JP': 'Japan',
            'FR': 'France',
            'DE': 'Germany',
            'IT': 'Italy',
            'ES': 'Spain',
            'CA': 'Canada',
            'AU': 'Australia',
            'BR': 'Brazil',
            'MX': 'Mexico',
            'CN': 'China',
            'RU': 'Russia',
            'ZA': 'South Africa',
            'NG': 'Nigeria',
            'KR': 'South Korea',
            'SG': 'Singapore',
            'NZ': 'New Zealand',
            'AE': 'United Arab Emirates',
        };

        return countryNames[code] || code;
    }

    function showLoading(show) {
        if (show) {
            loadingElement.classList.add('active');
        } else {
            loadingElement.classList.remove('active');
        }
    }

    function showError(message) {
        errorMsgElement.textContent = '⚠️ ' + message;
        errorMsgElement.classList.add('active');
        mainWeatherCard.classList.add('hidden');
        welcomeCard.classList.remove('hidden');
    }

    function hideError() {
        errorMsgElement.classList.remove('active');
        errorMsgElement.textContent = '';
    }

    console.log('Weather Hub loaded successfully!');
    console.log('Note: Please update the API_KEY with your OpenWeatherMap API key');
    console.log('Get your free API key from: https://openweathermap.org/api');

});
