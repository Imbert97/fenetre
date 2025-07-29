const CODE_VERSION = "v1.2.0";

/* ========================================
   VARIABLES GLOBALES
======================================== */

let map, marker, lat = 46.8139, lng = -71.2080; // Québec par défaut
let weatherData = null;
let tempSelectedPosition = null;
let solarChartInstance = null;
let autoInterval = null; // Pour conserver l'intervalle actif
let currentInterpolatedTemp = null; // Pour stocker la température interpolée actuelle
let currentInterpolatedFlux = null; // Pour stocker le flux interpolé actuel

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
    getWeatherData();
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
   🔧 FONCTION : GÉNÉRATION VECTEUR PYTHON AVEC INTERPOLATION LINÉAIRE
======================================== */
function generatePythonVector() {
    if (!weatherData || !weatherData.hourly || !weatherData.hourly.temperature_2m) {
        alert('❌ Aucune donnée météo disponible. Récupérez d\'abord les prévisions.');
        return []; // Retourne un tableau vide en cas d'erreur
    }

    const now = new Date();
    let startIndex = 0;
    const currentTimeMs = now.getTime();

    for (let i = 0; i < weatherData.hourly.time.length; i++) {
        const weatherTime = new Date(weatherData.hourly.time[i]);
        const weatherTimeMs = weatherTime.getTime();
        if (weatherTimeMs >= (currentTimeMs - 30 * 60 * 1000)) {
            startIndex = i;
            break;
        }
    }

    // Récupérer 11 heures pour avoir des transitions entre 10 heures
    const maxHours = Math.min(10, weatherData.hourly.temperature_2m.length - startIndex);
    const temps = weatherData.hourly.temperature_2m.slice(startIndex, startIndex + maxHours);

    if (temps.length < 2) {
        alert('❌ Pas assez de données pour générer des transitions graduelles.');
        return [];
    }

    const vector = [];
    // 🔧 INTERPOLATION LINÉAIRE CORRIGÉE avec plus de précision
    for (let h = 0; h < Math.min(10, temps.length - 1); h++) {
        const currentTemp = temps[h];
        const nextTemp = temps[h + 1];
        const tempDiff = nextTemp - currentTemp;

        // Générer 60 valeurs interpolées pour cette heure (une par minute)
        for (let i = 0; i < 60; i++) {
            const progress = i / 60; // 0 à 1 (progression dans l'heure)
            const interpolatedTemp = currentTemp + (tempDiff * progress);
            vector.push(Math.round(interpolatedTemp * 10) / 10);
        }
    }
    // Ajoute la dernière valeur de la 10ème heure pour assurer 600 points si 10 heures complètes
    if (temps.length >= 10) {
        vector.push(Math.round(temps[temps.length - 1] * 10) / 10);
    }


    const pythonVectorString = `[${vector.join(', ')}]`;
    navigator.clipboard.writeText(pythonVectorString).then(() => {
        showSuccessMessage(`✅ Vecteur Python températures copié ! (${vector.length} valeurs)`);
    }).catch(err => {
        showVectorInTextArea(pythonVectorString, 'températures synchronisées');
    });
    return vector; // Retourne le vecteur pour une utilisation interne
}


/* ================================================
   🔧 FONCTION CORRIGÉE : GÉNÉRATION VECTEUR PYTHON FLUX SOLAIRES AVEC INTERPOLATION
================================================ */

function generateSolarFluxVector() {
    if (!weatherData || !weatherData.hourly) {
        alert('❌ Aucune donnée météo disponible. Récupérez d\'abord les prévisions.');
        return [];
    }

    // 🔧 Paramètres identiques à ceux du graphique
    const orientationSelect = document.getElementById('wallOrientation');
    const customAzimuth = document.getElementById('customAzimuth');
    const wallTilt = parseFloat(document.getElementById('wallTilt').value) || 90;
    const albedo = parseFloat(document.getElementById('albedo').value) || 0.2;
    const windowHeight = parseFloat(document.getElementById('windowHeight').value) || 0;

    if (!orientationSelect) {
        alert('❌ Veuillez d\'abord configurer les paramètres solaires.');
        return [];
    }

    let surfaceAzimuth;
    if (orientationSelect.value === 'custom') {
        surfaceAzimuth = parseFloat(customAzimuth.value);
        if (isNaN(surfaceAzimuth)) {
            alert('❌ Veuillez entrer un azimuth personnalisé valide.');
            return [];
        }
    } else {
        surfaceAzimuth = orientationToAzimuth(orientationSelect.value);
    }

    // 🔧 Synchronisation sur la même plage que le graphique (index de départ)
    const now = new Date();
    let startIndex = 0;
    for (let i = 0; i < weatherData.hourly.time.length; i++) {
        const weatherTime = new Date(weatherData.hourly.time[i]);
        if (weatherTime.getTime() >= (now.getTime() - 30 * 60 * 1000)) {
            startIndex = i;
            break;
        }
    }

    const solarFluxes = [];
    const debugComparison = []; // Pour vérifier la correspondance

    // 🔧 Calculs strictement identiques à ceux du graphique
    const maxHours = Math.min(10, weatherData.hourly.time.length - startIndex);
    for (let i = 0; i < maxHours; i++) {
        const dataIndex = startIndex + i;
        const weatherTime = new Date(weatherData.hourly.time[dataIndex]);
        const GHIh = weatherData.hourly.shortwave_radiation ?
            weatherData.hourly.shortwave_radiation[dataIndex] : 800;
        const DNIh = weatherData.hourly.direct_radiation ?
            weatherData.hourly.direct_radiation[dataIndex] : 900;
        const DHIh = weatherData.hourly.diffuse_radiation ?
            weatherData.hourly.diffuse_radiation[dataIndex] : 100;
        const solarPos = calculateSolarPosition(lat, lng, weatherTime);
        const aoi = calculateAngleOfIncidence(wallTilt, surfaceAzimuth, solarPos.zenith, solarPos.azimuth);

        let directOnWall = 0;
        if (aoi < 90) directOnWall = DNIh * Math.max(0, cosd(aoi));
        const diffuseOnWall = DHIh * (1 + cosd(wallTilt)) / 2;
        const reduction = windowHeight <= 2 ? 1 : Math.exp(-0.2 * (windowHeight - 2));
        const reflectedOnWall = GHIh * albedo * (1 - cosd(wallTilt)) / 2 * reduction;
        const totalFlux = directOnWall + diffuseOnWall + reflectedOnWall;
        const roundedFlux = Math.round(totalFlux);
        solarFluxes.push(roundedFlux);

        debugComparison.push({
            heure: i,
            timestamp: weatherData.hourly.time[dataIndex],
            totalArrondi: roundedFlux
        });
    }

    if (solarFluxes.length < 2) {
        alert('❌ Pas assez de données pour générer des transitions graduelles.');
        return [];
    }

    // 🔧 Interpolation linéaire sur chaque intervalle horaire — identique au graphique
    const vector = [];
    for (let h = 0; h < Math.min(10, solarFluxes.length - 1); h++) {
        const currentFlux = solarFluxes[h];
        const nextFlux = solarFluxes[h + 1];
        const tempDiff = nextFlux - currentFlux;
        // Interpolation linéaire par minute (60 valeurs par heure)
        for (let i = 0; i < 60; i++) {
            const progress = i / 60; // de 0 à <1
            const interpolatedFlux = currentFlux + (tempDiff * progress);
            vector.push(Math.round(interpolatedFlux * 10) / 10);
        }
    }
    // Ajoute la dernière valeur de la 10ème heure
    if (solarFluxes.length >= 10) {
        vector.push(Math.round(solarFluxes[solarFluxes.length - 1] * 10) / 10);
    }


    // Debug pour contrôle rapide
    console.log('☀️ Synthèse graphique/vecteur:', debugComparison);
    console.log('Première valeur:', vector[0], '/ dernière valeur:', vector[vector.length - 1]);

    // Export/vérification
    const pythonVectorString = `[${vector.join(', ')}]`;
    navigator.clipboard.writeText(pythonVectorString).then(() => {
        showSuccessMessage(`✅ Vecteur Python flux solaires copié ! (${vector.length} valeurs)`);
    }).catch(err => {
        showVectorInTextArea(pythonVectorString, 'flux solaires synchronisés');
    });
    return vector; // Retourne le vecteur pour une utilisation interne
}



/* ========================================
   RÉCUPÉRATION DES DONNÉES MÉTÉO (OPEN-METEO CORRIGÉ)
======================================== */

async function getWeatherData() {
    try {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }

        // 🔧 REQUÊTE OPEN-METEO OPTIMISÉE
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,shortwave_radiation,direct_radiation,diffuse_radiation&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,is_day,shortwave_radiation,direct_radiation,diffuse_radiation&timezone=auto&forecast_hours=48`
        );

        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        weatherData = await response.json();

        console.log('🔍 Données météo Open-Meteo récupérées:', weatherData);
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
   AFFICHAGE DES PRÉVISIONS HORAIRES (CORRIGÉ FUSEAUX HORAIRES)
======================================== */

function displayHourlyForecast() {
    if (!weatherData || !weatherData.hourly) return;

    const hourly = weatherData.hourly;
    const forecastDiv = document.getElementById('hourlyForecast');
    if (!forecastDiv) return;

    const targetTimezone = weatherData.timezone || 'UTC';
    const now = new Date();

    // 🔧 CORRECTION : Logique fiable pour trouver l'index de départ
    let startIndex = 0;
    const currentTimeMs = now.getTime();

    for (let i = 0; i < hourly.time.length; i++) {
        const weatherTime = new Date(hourly.time[i]);
        const weatherTimeMs = weatherTime.getTime();
        if (weatherTimeMs >= (currentTimeMs - 30 * 60 * 1000)) { // 30 minutes de marge
            startIndex = i;
            break;
        }
    }

    console.log(`🕐 Index de départ: ${startIndex}, Total heures: ${hourly.time.length}`);

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
            <h3>⏰ PRÉVISIONS 10 PROCHAINES HEURES (${targetTimezone}) - Open-Meteo</h3>
            <div class="info" style="background: rgba(255,255,255,0.1); color: white; margin: 10px 0; border: none;">
                🕐 Maintenant à ${targetTimezone} : ${nowInTargetTz}
                <br>🔍 Index démarrage : ${startIndex}
                <br>📊 Total heures API : ${hourly.time.length}
                <br>📍 Position : ${lat.toFixed(4)}, ${lng.toFixed(4)}
            </div>
            <div style="margin: 15px 0;">
                <button onclick="generatePythonVector()" style="background: #00b894; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                   🐍 Copier Vecteur Python (Températures/minute - Interpolation Linéaire)
               </button>
               <small style="display: block; margin-top: 5px; color: #636e72;">
                   Génère un vecteur avec transitions graduelles entre les températures horaires (540 valeurs avec interpolation linéaire)
               </small>
            </div>
            <div class="hourly-grid">
    `;

    // 🔧 CORRECTION PRINCIPALE : Affichage correct des heures sans double conversion
    for (let i = 0; i < 10 && (startIndex + i) < hourly.time.length; i++) {
        const dataIndex = startIndex + i;

        // ⚡ SOLUTION : Parser directement la chaîne ISO de l'API
        const timeString = hourly.time[dataIndex]; // Ex: "2025-07-25T09:00"

        // Extraire l'heure et la date directement de la chaîne ISO
        const [datePart, timePart] = timeString.split('T');
        const [year, month, day] = datePart.split('-');
        const [hour, minute] = timePart.split(':');

        // Afficher l'heure directement depuis la chaîne ISO (pas de conversion)
        const timeStr = `${hour}:${minute}`;
        const dateStr = `${day}/${month}`;

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
                <br>🐍 <strong>Vecteur Python:</strong> Cliquez sur le bouton ci-dessus pour copier un vecteur avec les températures de chaque seconde.
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
   CALCULS DE POSITION SOLAIRE
======================================== */

function calculateSolarPosition(latitude, longitude, date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();
    let a = Math.floor((14 - month) / 12);
    let y = year - a;
    let m = month + 12 * a - 3;
    let jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + 1721119.5;
    jd += (hour + minute / 60 + second / 3600) / 24;
    const n = jd - 2451545.0;
    const L = (280.460 + 0.9856474 * n) % 360;
    const g = ((357.528 + 0.9856003 * n) % 360) * Math.PI / 180;
    const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * Math.PI / 180;
    const delta = Math.asin(Math.sin(23.439 * Math.PI / 180) * Math.sin(lambda));
    const E = 4 * (L * Math.PI / 180 - 0.0057183 - Math.atan2(Math.tan(lambda), Math.cos(23.439 * Math.PI / 180)));
    const TSV = (hour + minute / 60) + longitude / 15 + E / 60;
    const H = 15 * (TSV - 12) * Math.PI / 180;
    const phi = latitude * Math.PI / 180;
    const elevation = Math.asin(Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(H));
    let azimuth = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(delta) * Math.cos(phi));
    azimuth = (azimuth * 180 / Math.PI + 180) % 360;
    return {
        elevation: elevation * 180 / Math.PI,
        azimuth: azimuth,
        zenith: 90 - elevation * 180 / Math.PI
    };
}

/* ========================================
   CALCULS DE RAYONNEMENT SOLAIRE
======================================== */

function orientationToAzimuth(orientation) {
    const orientations = {
        'nord': 0,
        'nord-est': 45,
        'est': 90,
        'sud-est': 135,
        'sud': 180,
        'sud-ouest': 225,
        'ouest': 270,
        'nord-ouest': 315
    };
    return orientations[orientation] || 180;
}

function calculateAngleOfIncidence(surfaceTilt, surfaceAzimuth, solarZenith, solarAzimuth) {
    const tilt = surfaceTilt * Math.PI / 180;
    const surfAz = surfaceAzimuth * Math.PI / 180;
    const zenith = solarZenith * Math.PI / 180;
    const solAz = solarAzimuth * Math.PI / 180;
    const cosIncidence = Math.sin(zenith) * Math.sin(tilt) * Math.cos(solAz - surfAz) + Math.cos(zenith) * Math.cos(tilt);
    return Math.acos(Math.max(-1, Math.min(1, cosIncidence))) * 180 / Math.PI;
}

function toggleCustomAzimuth() {
    const orientationSelect = document.getElementById('wallOrientation');
    const customAzimuthDiv = document.getElementById('customAzimuthDiv');
    if (orientationSelect && customAzimuthDiv) {
        if (orientationSelect.value === 'custom') {
            customAzimuthDiv.style.display = 'block';
        } else {
            customAzimuthDiv.style.display = 'none';
        }
    }
}

/* ========================================
   CALCUL PRINCIPAL DU RAYONNEMENT SOLAIRE
======================================== */

function calculateSolarRadiation() {
    if (!weatherData) {
        alert('Veuillez d\'abord récupérer les données météorologiques');
        return;
    }

    const orientationSelect = document.getElementById('wallOrientation');
    const customAzimuth = document.getElementById('customAzimuth');
    const wallTilt = parseFloat(document.getElementById('wallTilt').value);
    const albedo = parseFloat(document.getElementById('albedo').value);
    const windowHeight = parseFloat(document.getElementById('windowHeight').value) || 0;

    if (!orientationSelect) {
        console.error('Element wallOrientation not found');
        return;
    }

    let surfaceAzimuth;
    if (orientationSelect.value === 'custom') {
        surfaceAzimuth = parseFloat(customAzimuth.value);
        if (isNaN(surfaceAzimuth)) {
            alert('Veuillez entrer un azimuth personnalisé valide');
            return;
        }
    } else {
        surfaceAzimuth = orientationToAzimuth(orientationSelect.value);
    }

    const current = weatherData.current;
    const GHI = current.shortwave_radiation || 800;
    const DNI = current.direct_radiation || 900;
    const DHI = current.diffuses_radiation || 100;

    const now = new Date();
    const solarPos = calculateSolarPosition(lat, lng, now);

    const aoi = calculateAngleOfIncidence(wallTilt, surfaceAzimuth, solarPos.zenith, solarPos.azimuth);

    let directOnWall = 0;
    if (aoi < 90) {
        directOnWall = DNI * Math.max(0, cosd(aoi));
    }

    const diffuseOnWall = DHI * (1 + cosd(wallTilt)) / 2;

    function reflectedReductionFactor(height) {
        if (height <= 2) return 1;
        return Math.exp(-0.2 * (height - 2));
    }
    const reduction = reflectedReductionFactor(windowHeight);

    const reflectedOnWall = GHI * albedo * (1 - cosd(wallTilt)) / 2 * reduction;

    const totalOnWall = directOnWall + diffuseOnWall + reflectedOnWall;

    const resultsDiv = document.getElementById('solarResults');
    if (!resultsDiv) {
        console.error('Element solarResults not found');
        return;
    }

    const orientationText = orientationSelect.value === 'custom' ?
        `${surfaceAzimuth}° (personnalisé)` :
        `${orientationSelect.options[orientationSelect.selectedIndex].text}`;

    const timezoneInfo = weatherData.timezone ? `(${weatherData.timezone})` : '(UTC)';

    resultsDiv.innerHTML = `
        <div class="solar-current">
            <h3>☀️ CALCUL DU RAYONNEMENT SOLAIRE ${timezoneInfo}</h3>
            <div class="weather-grid">
                <div><strong>📍 Position:</strong> ${lat.toFixed(4)}°, ${lng.toFixed(4)}°</div>
                <div><strong>🕐 Fuseau horaire:</strong> ${weatherData.timezone || 'UTC'}</div>
                <div><strong>🧭 Orientation mur:</strong> ${orientationText}</div>
                <div><strong>📐 Inclinaison mur:</strong> ${wallTilt}°</div>
                <div><strong>🌍 Albédo sol:</strong> ${albedo}</div>
                <div><strong>🏢 Hauteur fenêtre:</strong> ${windowHeight} m</div>
            </div>
        </div>
        <div class="info" style="margin: 20px 0;">
            <h3>🔬 EXPLICATIONS DU CALCUL</h3>
            <ul style="text-align: left; margin: 10px 0;">
                <li><strong>Rayonnement direct :</strong> Lumière directe du soleil</li>
                <li><strong>Rayonnement diffus :</strong> Lumière diffusée par l'atmosphère et les nuages</li>
                <li><strong>Rayonnement réfléchi :</strong> Lumière réfléchie par le sol (diminué selon la hauteur de la fenêtre)</li>
            </ul>
        </div>
        <h3>🧮 DÉTAIL DES CALCULS</h3>
        <div class="weather-grid">
            <div class="solar-card">
                <h4>1️⃣ Rayonnement Direct</h4>
                <p><strong>Résultat :</strong> <span style="color: #e17055;">${directOnWall.toFixed(1)} W/m²</span></p>
            </div>
            <div class="solar-card">
                <h4>2️⃣ Rayonnement Diffus</h4>
                <p><strong>Résultat :</strong> <span style="color: #e17055;">${diffuseOnWall.toFixed(1)} W/m²</span></p>
            </div>
            <div class="solar-card">
                <h4>3️⃣ Rayonnement Réfléchi</h4>
                <p><strong>Facteur de réduction hauteur :</strong> ${reduction.toFixed(2)} (pour ${windowHeight} m)</p>
                <p><strong>Résultat :</strong> <span style="color: #e17055;">${reflectedOnWall.toFixed(1)} W/m²</span></p>
            </div>
        </div>
        <div class="solar-current" style="margin-top: 20px;">
            <h3>🎯 RÉSULTAT FINAL</h3>
            <div class="weather-grid">
                <div class="solar-card" style="border-left-color: #00b894; background: #d1f2eb;">
                    <h4>📊 SOMME TOTALE</h4>
                    <p><strong>TOTAL :</strong> <span style="font-size: 1.5em; color: #00b894;">${totalOnWall.toFixed(1)} W/m²</span></p>
                </div>
            </div>
            <div style="margin: 15px 0; text-align: center;">
                <button onclick="generateSolarFluxVector()" style="background: #fd7900; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; margin-right: 10px;">
                   ☀️ Copier Vecteur Python (Flux Solaires/minute - Interpolation Linéaire)
                </button>
                <small style="display: block; margin-top: 5px; color: #636e72;">
                    Génère un vecteur avec transitions graduelles entre les flux solaires horaires (540 valeurs en W/m² avec interpolation linéaire)
                </small>

            </div>
        </div>
    `;

    if (weatherData.hourly && weatherData.hourly.time) {
        const canvasElement = document.getElementById('solarIrradianceChart');
        if (canvasElement) {
            const labels = [];
            const data = [];
            const targetTimezone = weatherData.timezone || 'UTC';
            const now = new Date();
            let startIndex = 0;

            // Même logique pour trouver l'index de départ
            for (let i = 0; i < weatherData.hourly.time.length; i++) {
                const weatherTime = new Date(weatherData.hourly.time[i]);
                if (weatherTime.getTime() >= (now.getTime() - 30 * 60 * 1000)) {
                    startIndex = i;
                    break;
                }
            }

            for (let i = 0; i < 10; i++) {
                const dataIndex = startIndex + i;

                if (dataIndex >= weatherData.hourly.time.length) break;

                // 🔧 CORRECTION : Même traitement des heures que l'affichage
                const timeString = weatherData.hourly.time[dataIndex];
                const [datePart, timePart] = timeString.split('T');
                const [hour, minute] = timePart.split(':');
                const hourStr = `${hour}:${minute}`;

                const weatherTime = new Date(weatherData.hourly.time[dataIndex]);

                const GHIh = weatherData.hourly.shortwave_radiation ?
                    weatherData.hourly.shortwave_radiation[dataIndex] : GHI;
                const DNIh = weatherData.hourly.direct_radiation ?
                    weatherData.hourly.direct_radiation[dataIndex] : DNI;
                const DHIh = weatherData.hourly.diffuse_radiation ?
                    weatherData.hourly.diffuse_radiation[dataIndex] : DHI;

                const solarPh = calculateSolarPosition(lat, lng, weatherTime);
                const aoiH = calculateAngleOfIncidence(wallTilt, surfaceAzimuth, solarPh.zenith, solarPh.azimuth);

                let directH = 0;
                if (aoiH < 90) directH = DNIh * Math.max(0, cosd(aoiH));
                const diffuseH = DHIh * (1 + cosd(wallTilt)) / 2;
                const reflectedH = GHIh * albedo * (1 - cosd(wallTilt)) / 2 * reduction;
                const totalH = directH + diffuseH + reflectedH;

                labels.push(hourStr);
                data.push(Math.round(totalH));
            }

            const ctx = canvasElement.getContext('2d');
            if (solarChartInstance) {
                solarChartInstance.destroy();
            }
            solarChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: "Rayonnement solaire sur la fenêtre (W/m²)",
                        data: data,
                        fill: true,
                        backgroundColor: "rgba(255, 206, 86, 0.2)",
                        borderColor: "#fdcb6e",
                        borderWidth: 3,
                        pointBackgroundColor: "#e17055",
                        pointRadius: 5,
                        tension: 0.35
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: true },
                        title: {
                            display: true,
                            text: `Évolution du rayonnement solaire - ${targetTimezone}`
                        }
                    },
                    scales: {
                        y: {
                            title: { display: true, text: "W/m²" },
                            beginAtZero: true
                        },
                        x: {
                            title: { display: true, text: "Heure locale" }
                        }
                    }
                }
            });
        }
    }
}

/* ========================================
   INITIALISATION AU CHARGEMENT DE LA PAGE
======================================== */

document.addEventListener('DOMContentLoaded', function() {
    // --- Affiche la version en haut à droite, si présent dans le HTML ---
    const versionDiv = document.getElementById('version-number');
    if (versionDiv) versionDiv.textContent = CODE_VERSION;

    console.log('🚀 Initialisation de l\'application avec Open-Meteo...');

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

    if (getCurrentLocationBtn) {
        getCurrentLocationBtn.addEventListener('click', getCurrentLocation);
    }
    if (getWeatherBtn) {
        getWeatherBtn.addEventListener('click', getWeatherData);
    }
    if (calculateSolarBtn) {
        calculateSolarBtn.addEventListener('click', calculateSolarRadiation);
    }
    if (wallOrientationSelect) {
        wallOrientationSelect.addEventListener('change', toggleCustomAzimuth);
    }
    if (validatePositionBtn) {
        validatePositionBtn.addEventListener('click', validatePosition);
    }
    if (searchAddressBtn) {
        searchAddressBtn.addEventListener('click', searchAddress);
    }

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
            if (e.key === 'Enter') {
                searchAddress();
            }
        });
    }

    getWeatherData();

    console.log('✅ Application initialisée avec succès !');

    // Ajout de la section pour l'affichage des valeurs interpolées actuelles
    const autoRetrieveStatusDiv = document.createElement('div');
    autoRetrieveStatusDiv.id = 'autoRetrieveStatus';
    autoRetrieveStatusDiv.style.marginTop = '20px';
    autoRetrieveStatusDiv.style.padding = '10px';
    autoRetrieveStatusDiv.style.border = '1px solid #00b894';
    autoRetrieveStatusDiv.style.borderRadius = '5px';
    autoRetrieveStatusDiv.style.backgroundColor = 'rgba(0, 184, 148, 0.1)';
    autoRetrieveStatusDiv.style.color = '#00b894';
    autoRetrieveStatusDiv.innerHTML = `
        <h3>🚀 Suivi des prévisions interpolées</h3>
        <p>Statut: <span id="autoRetrieveMessage">Inactif</span></p>
        <p>Température actuelle interpolée: <span id="currentTempDisplay">N/A</span></p>
        <p>Flux solaire actuel interpolé: <span id="currentFluxDisplay">N/A</span></p>
    `;
    // Trouvez où insérer ce div, par exemple après la section des prévisions horaires
    const hourlyForecastSection = document.getElementById('hourlyForecast');
    if (hourlyForecastSection) {
        hourlyForecastSection.parentNode.insertBefore(autoRetrieveStatusDiv, hourlyForecastSection.nextSibling);
    }


    document.getElementById('autoRetrieveBtn').addEventListener('click', function() {
        if (autoInterval) {
            clearInterval(autoInterval);
            autoInterval = null;
            document.getElementById('autoRetrieveMessage').textContent = "Arrêté.";
            this.textContent = "Lancer la récupération automatique";
            alert("⚠️ Récupération automatique arrêtée.");
            return;
        }
        // Exécute tout de suite une fois au clic
        retrieveAndSaveForecast();
        document.getElementById('autoRetrieveMessage').textContent = "Actif (mise à jour chaque minute)...";
        this.textContent = "Arrêter la récupération automatique";

        // Lance toutes les minutes
        autoInterval = setInterval(function() {
            // Arrête à 20h (optionnel, laisse si tu veux stopper le soir)
            let now = new Date();
            if (now.getHours() >= 20 || now.getHours() < 6) { // Arrête la nuit aussi
                clearInterval(autoInterval);
                autoInterval = null;
                document.getElementById('autoRetrieveMessage').textContent = "Arrêté (hors heures de service).";
                document.getElementById('autoRetrieveBtn').textContent = "Lancer la récupération automatique";
                alert("Fin de la récupération automatique (heure >= 20h ou < 6h)");
                return;
            }
            retrieveAndSaveForecast();
        }, 60 * 1000); // Chaque minute

        alert("🌡️ Lancement de la récupération automatique (prévisions et sauvegarde chaque minute)");
    });

    async function retrieveAndSaveForecast() {
        try {
            document.getElementById('autoRetrieveMessage').textContent = "Actif (récupération en cours)...";
            await getWeatherData(); // récupère en asynchrone

            if (!weatherData || !weatherData.hourly) {
                console.error("❌ Données météo absentes.");
                document.getElementById('autoRetrieveMessage').textContent = "Erreur de récupération des données.";
                return;
            }

            const interpolatedTemps = generatePythonVector(); // Renvoie le vecteur de 600 températures
            const interpolatedFlux = generateSolarFluxVector(); // Renvoie le vecteur de 600 flux solaires

            if (interpolatedTemps.length === 0 || interpolatedFlux.length === 0) {
                console.error("❌ Vecteurs interpolés non générés.");
                document.getElementById('autoRetrieveMessage').textContent = "Erreur: vecteurs interpolés non générés.";
                return;
            }

            // Calcul de l'index pour la minute actuelle
            const now = new Date();
            const minutesIntoHour = now.getMinutes();
            // L'index dans le vecteur de 600 valeurs est (heure actuelle depuis le début de la prévision) * 60 + minutes
            // Simplifions en prenant la minute actuelle dans l'heure.
            // Si on veut les 10 prochaines heures, l'index est juste la minute dans l'heure (0-59)
            // + (l'heure de la journée - l'heure de début de la prévision) * 60
            // Pour simplifier, puisque le vecteur est généré sur 10h glissantes, prenons l'index
            // correspondant à l'heure et la minute actuelles dans le segment des 10 heures.
            // On peut considérer que le vecteur commence à l'heure actuelle.
            const currentMinuteIndex = minutesIntoHour; // Pour la première heure du vecteur
            // Si on veut être plus précis et inclure l'heure de la prévision
            let currentHourOffset = 0; // L'heure "0" du vecteur est l'heure de la première prévision affichée.
            const firstHourlyForecastTime = new Date(weatherData.hourly.time[weatherData.hourly.time.length - 10]); // Approximation
            const currentHour = now.getHours();
            if (weatherData.hourly.time && weatherData.hourly.time.length > 0) {
                 // Trouver l'heure de début réelle de la prévision utilisée pour le vecteur
                 const startTimeForVector = new Date(weatherData.hourly.time[0]); // Le début de toutes les données Open-Meteo
                 // Trouver l'index de départ des 10 heures utilisées pour l'interpolation
                 let actualStartIndex = 0;
                 const currentTimeMs = now.getTime();
                 for (let i = 0; i < weatherData.hourly.time.length; i++) {
                     const weatherTime = new Date(weatherData.hourly.time[i]);
                     const weatherTimeMs = weatherTime.getTime();
                     if (weatherTimeMs >= (currentTimeMs - 30 * 60 * 1000)) { // 30 minutes de marge
                         actualStartIndex = i;
                         break;
                     }
                 }
                 const firstRelevantHour = new Date(weatherData.hourly.time[actualStartIndex]).getHours();
                 currentHourOffset = currentHour - firstRelevantHour;
                 if (currentHourOffset < 0) currentHourOffset += 24; // Handle midnight crossing
                 currentHourOffset = Math.min(currentHourOffset, 9); // Max 9 heures d'offset
            }


            const exactMinuteIndex = (currentHourOffset * 60) + minutesIntoHour;

            currentInterpolatedTemp = interpolatedTemps[exactMinuteIndex];
            currentInterpolatedFlux = interpolatedFlux[exactMinuteIndex];

            document.getElementById('currentTempDisplay').textContent =
                currentInterpolatedTemp !== undefined ? `${currentInterpolatedTemp}°C` : 'N/A';
            document.getElementById('currentFluxDisplay').textContent =
                currentInterpolatedFlux !== undefined ? `${currentInterpolatedFlux} W/m²` : 'N/A';

            document.getElementById('autoRetrieveMessage').textContent =
                `Actif. Dernière mise à jour : ${new Date().toLocaleTimeString()} (Valeurs ${exactMinuteIndex + 1}/600 disponibles).`;

            // Ajoute la sauvegarde à l'historique (une fois par heure si l'intervalle est toutes les minutes)
            const dataToSave = {
                date: now.toISOString(),
                temperatures: interpolatedTemps, // Sauvegarde tout le vecteur de 600 valeurs
                flux_solaires: interpolatedFlux // Sauvegarde tout le vecteur de 600 valeurs
            };
            addToSauvegardes(dataToSave); // Cette fonction vérifiera si un ajout est pertinent ou non
        } catch (e) {
            console.error("Erreur de récupération automatique:", e);
            document.getElementById('autoRetrieveMessage').textContent = `Erreur: ${e.message}`;
        }
    }

    // LISTE des sauvegardes (persistantes) pour affichage en tableau
    let all_saves = [];

    // Charge l'historique depuis le localStorage au démarrage
    function loadSavesFromStorage() {
        const json = localStorage.getItem('weather_forecast_history');
        if (json) {
            all_saves = JSON.parse(json);
        } else {
            all_saves = [];
        }
    }
    loadSavesFromStorage();

    // Pour afficher ou mettre à jour le tableau sur la page (maintenant un tableau de résumés)
    function updateSauvegardesTable() {
        const tableBody = document.getElementById('tableBody');
        const tableHeader = document.getElementById('tableHeader');
        if (!tableBody || !tableHeader) return;
        tableBody.innerHTML = "";
        tableHeader.innerHTML = "";

        if (all_saves.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='3'>Aucune sauvegarde enregistrée.</td></tr>";
            return;
        }

        // Simplifié: seulement date, première temp et premier flux
        tableHeader.innerHTML = "<th>Date sauvegarde</th><th>1ère T°</th><th>1er Flux</th><th>Dernière T°</th><th>Dernier Flux</th>";

        all_saves.forEach(save => {
            const tr = document.createElement('tr');
            const firstTemp = save.temperatures.length > 0 ? save.temperatures[0] : 'N/A';
            const firstFlux = save.flux_solaires.length > 0 ? save.flux_solaires[0] : 'N/A';
            const lastTemp = save.temperatures.length > 0 ? save.temperatures[save.temperatures.length - 1] : 'N/A';
            const lastFlux = save.flux_solaires.length > 0 ? save.flux_solaires[save.flux_solaires.length - 1] : 'N/A';

            tr.innerHTML = `
                <td>${new Date(save.date).toLocaleString()}</td>
                <td>${firstTemp}</td>
                <td>${firstFlux}</td>
                <td>${lastTemp}</td>
                <td>${lastFlux}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Ajoute une sauvegarde dans la liste + stockage + rafraîchit tableau
    function addToSauvegardes(dataToSave) {
        // Empêche le doublon même heure (pour la sauvegarde de l'historique)
        if (all_saves.length > 0) {
            let last = all_saves[all_saves.length - 1];
            // On vérifie que la dernière sauvegarde n'est pas dans la même heure que la nouvelle.
            // Si la récupération se fait toutes les minutes, on ne veut pas 60 entrées par heure dans le tableau.
            // Sauvegardons une fois par heure.
            let lastHour = (new Date(last.date)).getHours();
            let newHour = (new Date(dataToSave.date)).getHours();
            if (lastHour === newHour && (new Date(last.date)).getDate() === (new Date(dataToSave.date)).getDate()) {
                // Si c'est la même heure et même jour, on ne sauvegarde pas, ou on met à jour la dernière.
                // Pour cet exemple, on ne sauvegarde pas. Si vous voulez update, il faudrait une logique différente.
                return;
            }
        }
        all_saves.push(dataToSave);
        localStorage.setItem('weather_forecast_history', JSON.stringify(all_saves));
        updateSauvegardesTable();
        document.getElementById('sauvegardesTableInfo').textContent = `Dernière sauvegarde historique : ${new Date(dataToSave.date).toLocaleTimeString()}`;
    }


    // Réactive l'affichage au rechargement de page
    document.addEventListener('DOMContentLoaded', updateSauvegardesTable);

    // Ajoute fonction pour bouton "Copier tableau"
    document.getElementById('copyTableBtn').addEventListener('click', function() {
        if (all_saves.length === 0) {
            alert("Aucune donnée à copier !");
            return;
        }
        let csv = [];
        // titres pour les vecteurs complets de 600 valeurs
        let titles = ['Date'];
        for (let i = 0; i < 600; i++) titles.push(`T°_min${i}`);
        for (let i = 0; i < 600; i++) titles.push(`Flux_min${i}`);
        csv.push(titles.join("\t"));
        // lignes
        all_saves.forEach(save => {
            let line = [new Date(save.date).toLocaleString()];
            line = line.concat(save.temperatures, save.flux_solaires);
            csv.push(line.join("\t"));
        });
        let text = csv.join("\n");
        // copie dans le presse-papiers
        navigator.clipboard.writeText(text).then(() => {
            alert("✅ Tableau complet des vecteurs copié ! Colle-le dans Excel directement.");
        });
    });
});
