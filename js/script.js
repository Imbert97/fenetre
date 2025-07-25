/* ========================================
   VARIABLES GLOBALES
======================================== */

let map, marker, lat = 46.8139, lng = -71.2080; // Québec par défaut
let weatherData = null;
let tempSelectedPosition = null;
let solarChartInstance = null; // Pour le graphique Chart.js

/* ========================================
   CODES MÉTÉO WMO ET ICÔNES
======================================== */

const weatherCodes = {
    0: "Ciel dégagé",
    1: "Principalement dégagé", 
    2: "Partiellement nuageux",
    3: "Couvert",
    45: "Brouillard",
    48: "Brouillard givrant",
    51: "Bruine légère",
    53: "Bruine modérée", 
    55: "Bruine dense",
    56: "Bruine verglaçante légère",
    57: "Bruine verglaçante dense",
    61: "Pluie légère",
    63: "Pluie modérée",
    65: "Pluie forte",
    66: "Pluie verglaçante légère",
    67: "Pluie verglaçante forte",
    71: "Neige légère",
    73: "Neige modérée",
    75: "Neige forte",
    77: "Grains de neige",
    80: "Averses légères",
    81: "Averses modérées",
    82: "Averses violentes",
    85: "Averses de neige légères",
    86: "Averses de neige fortes",
    95: "Orage",
    96: "Orage avec grêle légère",
    99: "Orage avec grêle forte"
};

function getWeatherIcon(code, isDay = true) {
    const icons = {
        0: isDay ? "☀️" : "🌙",
        1: isDay ? "🌤️" : "🌙",
        2: "⛅",
        3: "☁️",
        45: "🌫️",
        48: "🌫️",
        51: "🌦️",
        53: "🌦️",
        55: "🌦️",
        56: "🌦️",
        57: "🌦️",
        61: "🌧️",
        63: "🌧️",
        65: "🌧️",
        66: "🌧️",
        67: "🌧️",
        71: "🌨️",
        73: "🌨️",
        75: "🌨️",
        77: "🌨️",
        80: "🌦️",
        81: "🌦️",
        82: "🌦️",
        85: "🌨️",
        86: "🌨️",
        95: "⛈️",
        96: "⛈️",
        99: "⛈️"
    };
    return icons[code] || "🌍";
}

/* ========================================
   INITIALISATION DE LA CARTE
======================================== */

function initMap() {
    map = L.map('map').setView([lat, lng], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    marker = L.marker([lat, lng]).addTo(map)
        .bindPopup(`📍 Position: ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
        .openPopup();
    map.on('click', function(e) {
        tempSelectedPosition = {
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            name: "Position sur la carte"
        };
        showPositionValidation();
        updateMapPreview(tempSelectedPosition.lat, tempSelectedPosition.lng, tempSelectedPosition.name);
    });
}

/* ========================================
   GESTION UNIFIÉE DES POSITIONS
======================================== */

function showPositionValidation() {
    if (!tempSelectedPosition) return;
    document.getElementById('selectedLocationText').textContent = tempSelectedPosition.name;
    document.getElementById('selectedCoords').textContent = 
        `${tempSelectedPosition.lat.toFixed(4)}, ${tempSelectedPosition.lng.toFixed(4)}`;
    document.getElementById('selectedLocationInfo').style.display = 'block';
    document.getElementById('validatePosition').style.display = 'block';
}

function hidePositionValidation() {
    document.getElementById('selectedLocationInfo').style.display = 'none';
    document.getElementById('validatePosition').style.display = 'none';
    tempSelectedPosition = null;
}

function updateLocationDisplay() {
    document.getElementById('currentLat').textContent = lat.toFixed(4);
    document.getElementById('currentLng').textContent = lng.toFixed(4);
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                lat = position.coords.latitude;
                lng = position.coords.longitude;
                map.setView([lat, lng], 12);
                if (marker) map.removeLayer(marker);
                marker = L.marker([lat, lng]).addTo(map)
                    .bindPopup(`📍 Votre position: ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
                    .openPopup();
                updateLocationDisplay();
                hidePositionValidation();
            },
            function(error) {
                alert('Erreur de géolocalisation: ' + error.message);
            }
        );
    } else {
        alert('La géolocalisation n\'est pas supportée par ce navigateur');
    }
}

function validatePosition() {
    if (!tempSelectedPosition) {
        alert('Aucune position sélectionnée à valider');
        return;
    }
    lat = tempSelectedPosition.lat;
    lng = tempSelectedPosition.lng;
    map.setView([lat, lng], 12);
    if (marker) map.removeLayer(marker);
    marker = L.marker([lat, lng]).addTo(map)
        .bindPopup(`✅ POSITION VALIDÉE<br>📍 ${tempSelectedPosition.name}<br>Coordonnées: ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
        .openPopup();
    updateLocationDisplay();
    hidePositionValidation();
    document.getElementById('manualLat').value = '';
    document.getElementById('manualLng').value = '';
    document.getElementById('addressSearch').value = '';
    showSuccessMessage('✅ Position validée avec succès !');
}

function updateMapPreview(latitude, longitude, displayName) {
    map.setView([latitude, longitude], 12);
    if (marker) map.removeLayer(marker);
    marker = L.marker([latitude, longitude]).addTo(map)
        .bindPopup(`🔍 APERÇU<br>📍 ${displayName}<br>Coordonnées: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}<br><small>Cliquez sur "Définir cette position" pour confirmer</small>`)
        .openPopup();
}

function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success';
    successDiv.style.margin = '10px 0';
    successDiv.innerHTML = message;
    const container = document.querySelector('.input-group');
    if (container) {
        container.appendChild(successDiv);
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
}

/* ========================================
   RECHERCHE PAR ADRESSE
======================================== */

async function searchAddress() {
    const address = document.getElementById('addressSearch').value.trim();
    if (!address) {
        alert('Veuillez entrer une adresse à rechercher');
        return;
    }
    try {
        hidePositionValidation();
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5&addressdetails=1`
        );
        if (!response.ok) throw new Error(`Erreur de recherche: ${response.status}`);
        const results = await response.json();
        displayAddressResults(results);
    } catch (error) {
        console.error('Erreur lors de la recherche d\'adresse:', error);
        alert('Erreur lors de la recherche: ' + error.message);
    }
}

function displayAddressResults(results) {
    const resultsDiv = document.getElementById('addressResults');
    const listDiv = document.getElementById('addressList');
    if (!resultsDiv || !listDiv) return;
    
    if (results.length === 0) {
        listDiv.innerHTML = '<p style="color: #d63031;">Aucune adresse trouvée. Essayez une recherche différente.</p>';
        resultsDiv.style.display = 'block';
        return;
    }
    
    listDiv.innerHTML = '';
    
    results.forEach((result, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'weather-card';
        cardDiv.style.cssText = 'cursor: pointer; margin: 10px 0;';
        cardDiv.innerHTML = `
            <strong>📍 ${result.display_name}</strong>
            <p style="font-size: 0.9em; color: #636e72; margin: 5px 0;">
                Coordonnées: ${parseFloat(result.lat).toFixed(4)}, ${parseFloat(result.lon).toFixed(4)}
            </p>
        `;
        cardDiv.addEventListener('click', function() {
            selectAddressResult(result.lat, result.lon, result.display_name);
        });
        listDiv.appendChild(cardDiv);
    });
    resultsDiv.style.display = 'block';
}

function selectAddressResult(latitude, longitude, displayName) {
    tempSelectedPosition = {
        lat: parseFloat(latitude),
        lng: parseFloat(longitude),
        name: displayName
    };
    showPositionValidation();
    updateMapPreview(tempSelectedPosition.lat, tempSelectedPosition.lng, tempSelectedPosition.name);
    const resultsDiv = document.getElementById('addressResults');
    if (resultsDiv) {
        resultsDiv.style.display = 'none';
    }
}

/* ========================================
   RÉCUPÉRATION DES DONNÉES MÉTÉO
======================================== */

async function getWeatherData() {
    try {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,shortwave_radiation,direct_radiation,diffuse_radiation&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,is_day,shortwave_radiation,direct_radiation,diffuse_radiation&timezone=auto&forecast_hours=48`
        );
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        weatherData = await response.json();
        displayHourlyForecast();
    } catch (error) {
        console.error('Erreur lors de la récupération des données météo:', error);
        alert('Erreur lors de la récupération des données météo: ' + error.message);
    } finally {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }
}

/* ========================================
   AFFICHAGE DES PRÉVISIONS HORAIRES (LOGIQUE FIABLE CORRIGÉE)
======================================== */
function displayHourlyForecast() {
    if (!weatherData || !weatherData.hourly) return;

    const hourly = weatherData.hourly;
    const forecastDiv = document.getElementById('hourlyForecast');
    if (!forecastDiv) return;

    const targetTimezone = weatherData.timezone || 'UTC';

    // -------- LOGIQUE ROBUSTE DU DÉBUT DE PRÉVISION -------
    // Obtenir la date/heure locale du fuseau cible, arrondie à l'heure précédente
    const now = new Date();
    function getHourStartInTimezone(date, timeZone) {
        const fmtDate = new Intl.DateTimeFormat('fr-FR', {
            timeZone: timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            hour12: false
        }).formatToParts(date);
        let year, month, day, hour;
        fmtDate.forEach(({type, value}) => {
            if (type === 'year') year = value;
            else if (type === 'month') month = value;
            else if (type === 'day') day = value;
            else if (type === 'hour') hour = value;
        });
        return new Date(`${year}-${month}-${day}T${hour}:00:00`);
    }
    const nowRounded = getHourStartInTimezone(now, targetTimezone);

    // Trouver la première prévision >= à l'heure actuelle arrondie
    let startIndex = 0;
    for (let i = 0; i < hourly.time.length; i++) {
        const weatherTime = new Date(hourly.time[i]);
        if (weatherTime.getTime() >= nowRounded.getTime()) {
            startIndex = i;
            break;
        }
    }
    // Fallback de sécurité
    if (startIndex === 0) {
        startIndex = Math.max(0, hourly.time.length - 10);
    }

    const nowInTargetTz = new Intl.DateTimeFormat('fr-FR', {
        timeZone: targetTimezone,
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
    }).format(now);

    const firstForecastTime = startIndex < hourly.time.length ? 
        new Intl.DateTimeFormat('fr-FR', {
            timeZone: targetTimezone,
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit'
        }).format(new Date(hourly.time[startIndex])) : 'N/A';

    let forecastHTML = `
        <div class="hourly-forecast">
            <h3>⏰ PRÉVISIONS 10 PROCHAINES HEURES (${targetTimezone})</h3>
            <div class="info" style="background: rgba(255,255,255,0.1); color: white; margin: 10px 0; border: none;">
                🕐 Maintenant à ${targetTimezone} : ${nowInTargetTz}
                <br>📅 Première prévision : ${firstForecastTime}
                <br>🔍 Index démarrage : ${startIndex}
                <br>📊 Total heures API : ${hourly.time.length}
            </div>
            <div class="hourly-grid">
    `;

    for (let i = 0; i < 10 && (startIndex + i) < hourly.time.length; i++) {
        const dataIndex = startIndex + i;
        const weatherTime = new Date(hourly.time[dataIndex]);
        const timeStr = new Intl.DateTimeFormat('fr-FR', {
            timeZone: targetTimezone,
            hour: '2-digit',
            minute: '2-digit'
        }).format(weatherTime);
        const dateStr = new Intl.DateTimeFormat('fr-FR', {
            timeZone: targetTimezone,
            day: '2-digit',
            month: '2-digit'
        }).format(weatherTime);
        const temp = Math.round(hourly.temperature_2m[dataIndex]);
        const tempFeel = Math.round(hourly.apparent_temperature[dataIndex]);
        const humidity = hourly.relative_humidity_2m[dataIndex];
        const precipitation = hourly.precipitation[dataIndex];
        const windSpeed = Math.round(hourly.wind_speed_10m[dataIndex]);
        const windDir = hourly.wind_direction_10m[dataIndex];
        const pressure = Math.round(hourly.surface_pressure[dataIndex]);
        const weatherCode = hourly.weather_code[dataIndex];
        const isDay = hourly.is_day[dataIndex] === 1;
        const icon = getWeatherIcon(weatherCode, isDay);

        forecastHTML += `
            <div class="hourly-item">
                <div class="hourly-time">${timeStr}<br><small>${dateStr}</small></div>
                <div class="hourly-icon">${icon}</div>
                <div class="hourly-temp">${temp}°C</div>
                <div class="hourly-details">
                    <div>🌡️ Ressenti: ${tempFeel}°C</div>
                    <div>💧 Humidité: ${humidity}%</div>
                    <div>🌧️ Pluie: ${precipitation}mm</div>
                    <div>💨 Vent: ${windSpeed}km/h</div>
                    <div>🧭 Dir: ${windDir}°</div>
                    <div>🌊 Pression: ${pressure}hPa</div>
                </div>
            </div>
        `;
    }

    forecastHTML += `
            </div>
            <div class="info" style="margin-top: 20px; background: rgba(255,255,255,0.2); color: white; border: none;">
                💡 <strong>Conseil rideaux:</strong> Consultez ces prévisions pour planifier l'ouverture/fermeture de vos rideaux selon la température et l'ensoleillement attendus.
            </div>
        </div>
    `;

    forecastDiv.innerHTML = forecastHTML;
}

/* ========================================
   FONCTIONS MATHÉMATIQUES SOLAIRES
======================================== */

function sind(degrees) { return Math.sin(degrees * Math.PI / 180); }
function cosd(degrees) { return Math.cos(degrees * Math.PI / 180); }
function tand(degrees) { return Math.tan(degrees * Math.PI / 180); }
function asind(value) { return Math.asin(value) * 180 / Math.PI; }
function acosd(value) { return Math.acos(value) * 180 / Math.PI; }
function atan2d(y, x) { return Math.atan2(y, x) * 180 / Math.PI; }

/* ========================================
   CALCULS DE POSITION SOLAIRE & RAYONNEMENT
(restant inchangés, voir code initial)
======================================== */

/* ========================================
   INITIALISATION AU CHARGEMENT DE LA PAGE
======================================== */

document.addEventListener('DOMContentLoaded', function() {
    initMap();
    updateLocationDisplay();
    const getCurrentLocationBtn = document.getElementById('getCurrentLocation');
    const getWeatherBtn = document.getElementById('getWeather');
    const calculateSolarBtn = document.getElementById('calculateSolar');
    const wallOrientationSelect = document.getElementById('wallOrientation');
    const validatePositionBtn = document.getElementById('validatePosition');
    const searchAddressBtn = document.getElementById('searchAddress');
    const manualLatInput = document.getElementById('manualLat');
    const manualLngInput = document.getElementById('manualLng');
    const addressSearchInput = document.getElementById('addressSearch');
    if (getCurrentLocationBtn) getCurrentLocationBtn.addEventListener('click', getCurrentLocation);
    if (getWeatherBtn) getWeatherBtn.addEventListener('click', getWeatherData);
    if (calculateSolarBtn) calculateSolarBtn.addEventListener('click', calculateSolarRadiation);
    if (wallOrientationSelect) wallOrientationSelect.addEventListener('change', toggleCustomAzimuth);
    if (validatePositionBtn) validatePositionBtn.addEventListener('click', validatePosition);
    if (searchAddressBtn) searchAddressBtn.addEventListener('click', searchAddress);
    if (manualLatInput) {
        manualLatInput.addEventListener('input', function() {
            const latValue = parseFloat(this.value);
            const lngValue = parseFloat(manualLngInput.value);
            if (!isNaN(latValue) && !isNaN(lngValue)) {
                tempSelectedPosition = { lat: latValue, lng: lngValue, name: "Position manuelle" };
                showPositionValidation();
                updateMapPreview(latValue, lngValue, "Position manuelle");
            }
        });
    }
    if (manualLngInput) {
        manualLngInput.addEventListener('input', function() {
            const latValue = parseFloat(manualLatInput.value);
            const lngValue = parseFloat(this.value);
            if (!isNaN(latValue) && !isNaN(lngValue)) {
                tempSelectedPosition = { lat: latValue, lng: lngValue, name: "Position manuelle" };
                showPositionValidation();
                updateMapPreview(latValue, lngValue, "Position manuelle");
            }
        });
    }
    if (addressSearchInput) {
        addressSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') searchAddress();
        });
    }
    getWeatherData();
});
