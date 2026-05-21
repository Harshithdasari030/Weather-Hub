const API_KEY = 'YOUR_API_KEY';

const BASE_URL =
    'https://api.openweathermap.org/data/2.5/weather';

const GEO_URL =
    'https://api.openweathermap.org/geo/1.0/direct';

document.addEventListener('DOMContentLoaded', () => {

    const searchInput =
        document.getElementById('searchInput');

    const searchBtn =
        document.getElementById('searchBtn');

    const locationBtn =
        document.getElementById('locationBtn');

    const loadingElement =
        document.getElementById('loading');

    const errorMsgElement =
        document.getElementById('errorMsg');

    const suggestionsDropdown =
        document.getElementById('suggestions');

    const mainWeatherCard =
        document.getElementById('mainWeatherCard');

    const welcomeCard =
        document.getElementById('welcomeCard');

    const cityName =
        document.getElementById('cityName');

    const countryCode =
        document.getElementById('countryCode');

    const temperature =
        document.getElementById('temperature');

    const feelsLike =
        document.getElementById('feelsLike');

    const humidity =
        document.getElementById('humidity');

    const windSpeed =
        document.getElementById('windSpeed');

    const pressure =
        document.getElementById('pressure');

    const visibility =
        document.getElementById('visibility');

    const cloudiness =
        document.getElementById('cloudiness');

    const weatherIcon =
        document.getElementById('weatherIcon');

    const weatherDescription =
        document.getElementById('weatherDescription');

    const sunrise =
        document.getElementById('sunrise');

    const sunset =
        document.getElementById('sunset');

    const uvIndex =
        document.getElementById('uvIndex');

    let debounceTimer;

    searchBtn.addEventListener('click', handleSearch);

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    searchInput.addEventListener('input', () => {

        clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {
            handleSuggestions();
        }, 300);

    });

    locationBtn.addEventListener(
        'click',
        fetchCurrentLocationWeather
    );

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

            const suggestions =
                await getLocationSuggestions(query);

            displaySuggestions(suggestions);

        } catch (error) {

            console.error(error);

        }
    }

    async function fetchWeatherData(city) {

        try {

            if (!navigator.onLine) {
                throw new Error('No internet connection');
            }

            showLoading(true);

            hideError();

            const weatherData =
                await fetchWeatherByCity(city);

            const uvData =
                await fetchUVIndex(
                    weatherData.coord.lat,
                    weatherData.coord.lon
                );

            displayWeatherData(weatherData, uvData);

            searchInput.value = '';

        } catch (error) {

            showError(
                error.message ||
                'Failed to fetch weather data'
            );

        } finally {

            showLoading(false);

        }
    }

    async function getLocationSuggestions(query) {

        const response = await fetch(
            `${GEO_URL}?q=${query}&limit=5&appid=${API_KEY}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch suggestions');
        }

        return await response.json();
    }

    async function fetchWeatherByCity(city) {

        const response = await fetch(
            `${BASE_URL}?q=${city}&units=metric&appid=${API_KEY}`
        );

        if (response.status === 404) {
            throw new Error(
                `City "${city}" not found`
            );
        }

        if (!response.ok) {
            throw new Error(
                `HTTP error ${response.status}`
            );
        }

        return await response.json();
    }

    async function fetchWeatherByCoordinates(lat, lon) {

        const response = await fetch(
            `${BASE_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch weather');
        }

        return await response.json();
    }

    async function fetchUVIndex(lat, lon) {

        try {

            const response = await fetch(
                `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily,alerts&appid=${API_KEY}`
            );

            if (!response.ok) {
                throw new Error('UV fetch failed');
            }

            const data = await response.json();

            return data.current.uvi;

        } catch {

            return 'N/A';

        }
    }

    async function fetchCurrentLocationWeather() {

        if (!navigator.geolocation) {

            showError(
                'Geolocation is not supported'
            );

            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {

                try {

                    showLoading(true);

                    const weatherData =
                        await fetchWeatherByCoordinates(
                            position.coords.latitude,
                            position.coords.longitude
                        );

                    const uvData =
                        await fetchUVIndex(
                            position.coords.latitude,
                            position.coords.longitude
                        );

                    displayWeatherData(
                        weatherData,
                        uvData
                    );

                } catch (error) {

                    showError(error.message);

                } finally {

                    showLoading(false);

                }

            },

            () => {

                showError(
                    'Unable to access your location'
                );

            }
        );
    }

    function displayWeatherData(data, uvData) {

        cityName.textContent = data.name;

        countryCode.textContent =
            data.sys.country;

        temperature.textContent =
            Math.round(data.main.temp);

        feelsLike.textContent =
            Math.round(data.main.feels_like);

        weatherDescription.textContent =
            data.weather[0].main;

        weatherIcon.src =
            `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;

        humidity.textContent =
            `${data.main.humidity}%`;

        windSpeed.textContent =
            `${data.wind.speed} m/s`;

        pressure.textContent =
            `${data.main.pressure} hPa`;

        visibility.textContent =
            `${(data.visibility / 1000).toFixed(1)} km`;

        cloudiness.textContent =
            `${data.clouds.all}%`;

        uvIndex.textContent =
            typeof uvData === 'number'
                ? uvData.toFixed(1)
                : uvData;

        sunrise.textContent =
            formatTime(data.sys.sunrise);

        sunset.textContent =
            formatTime(data.sys.sunset);

        updateBackground(data.weather[0].main);

        mainWeatherCard.classList.remove('hidden');

        welcomeCard.classList.add('hidden');
    }

    function displaySuggestions(suggestions) {

        suggestionsDropdown.innerHTML = '';

        if (suggestions.length === 0) {

            suggestionsDropdown.innerHTML =
                '<div class="suggestion-item">No cities found</div>';

            suggestionsDropdown.classList.add('active');

            return;
        }

        suggestions.forEach((location) => {

            const item =
                document.createElement('div');

            item.className = 'suggestion-item';

            item.innerHTML = `
                <i class="fas fa-map-marker-alt"></i>
                <div>
                    <strong>${location.name}</strong>
                    <small>
                        ${location.country}
                    </small>
                </div>
            `;

            item.addEventListener('click', async () => {

                const weatherData =
                    await fetchWeatherByCoordinates(
                        location.lat,
                        location.lon
                    );

                const uvData =
                    await fetchUVIndex(
                        location.lat,
                        location.lon
                    );

                displayWeatherData(
                    weatherData,
                    uvData
                );

                suggestionsDropdown.classList.remove(
                    'active'
                );
            });

            suggestionsDropdown.appendChild(item);
        });

        suggestionsDropdown.classList.add('active');
    }

    function updateBackground(weather) {

        document.body.className = '';

        switch (weather.toLowerCase()) {

            case 'clear':
                document.body.classList.add('sunny');
                break;

            case 'clouds':
                document.body.classList.add('cloudy');
                break;

            case 'rain':
                document.body.classList.add('rainy');
                break;

            default:
                document.body.classList.add(
                    'default-weather'
                );
        }
    }

    function formatTime(timestamp) {

        return new Date(timestamp * 1000)
            .toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
    }

    function showLoading(show) {

        loadingElement.classList.toggle(
            'active',
            show
        );
    }

    function showError(message) {

        errorMsgElement.textContent =
            '⚠️ ' + message;

        errorMsgElement.classList.add('active');

        mainWeatherCard.classList.add('hidden');

        welcomeCard.classList.remove('hidden');
    }

    function hideError() {

        errorMsgElement.classList.remove('active');

        errorMsgElement.textContent = '';
    }

    console.log('Weather Hub loaded successfully!');
});
