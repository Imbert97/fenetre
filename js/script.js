/* ========================================
   VARIABLES GLOBALES
======================================== */

let map, marker, lat = 48.8566, lng = 2.3522; // Paris par défaut
let weatherData = null;
let tempSelectedPosition = null;

/* ========================================
   CODES MÉTÉO WMO AMÉLIORÉS
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

/* ========================================
   ICÔNES MÉTÉO AMÉLIORÉES
======================================== */

function getWeatherIcon(code, isDay = true) {
    const icons = {
        0: isDay ? "☀️" : "🌙",  // Ciel dégagé
        1: isDay ? "🌤️" : "🌙", // Principalement dégagé
        2: "⛅",                 // Partiellement nuageux
        3: "☁️",                 // Couvert
        45: "🌫️",               // Brouillard
        48: "🌫️",               // Brouillard givrant
        51: "🌦️",               // Bruine légère
        53: "🌦️",               // Bruine modérée
        55: "🌦️",               // Bruine dense
        56: "🌦️",               // Bruine verglaçante légère
        57: "🌦️",               // Bruine verglaçante dense
        61: "🌧️",               // Pluie légère
        63: "🌧️",               // Pluie modérée
        65: "🌧️",               // Pluie forte
        66: "🌧️",               // Pluie verglaçante légère
        67: "🌧️",               // Pluie verglaçante forte
        71: "🌨️",               // Neige légère
        73: "🌨️",               // Neige modérée
        75: "🌨️",               // Neige forte
        77: "🌨️",               // Grains de neige
        80: "🌦️",               // Averses légères
        81: "🌦️",               // Averses modérées
        82: "🌦️",               // Averses violentes
        85: "🌨️",               // Averses de neige légères
        86: "🌨️",               // Averses de neige fortes
        95: "⛈️",                // Orage
        96: "⛈️",                // Orage avec grêle légère
        99: "⛈️"                 // Orage avec grêle forte
    };
    return icons[code] || "🌍";
}

/* ========================================
   INITIALISATION DE LA CARTE
======================================== */

function initMap() {
    // Initialiser la carte Leaflet
    map = L.map('map').setView([lat, lng], 10);
    
    // Ajouter le layer de tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Ajouter un marqueur initial
    marker = L.marker([lat, lng]).addTo(map)
        .bindPopup(`📍 Position: ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
        .openPopup();
    
    // Gérer les clics sur la carte
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
                
                if (marker) {
                    map.removeLayer(marker);
                }
                
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

function setManualLocation() {
    const inputLat = parseFloat(document.getElementById('manualLat').value);
    const inputLng = parseFloat(document.getElementById('manualLng').value);
    
    if (isNaN(inputLat) || isNaN(inputLng)) {
        alert('Veuillez entrer des coordonnées valides');
        return;
    }
    
    if (inputLat < -90 || inputLat > 90) {
        alert('La latitude doit être entre -90 et 90');
        return;
    }
    
    if (inputLng < -180 || inputLng > 180) {
        alert('La longitude doit être entre -180 et 180');
        return;
    }
    
    tempSelectedPosition = {
        lat: inputLat,
        lng: inputLng,
        name: "Position manuelle"
    };
    
    showPositionValidation();
    updateMapPreview(tempSelectedPosition.lat, tempSelectedPosition.lng, tempSelectedPosition.name);
}

function validatePosition() {
    if (!tempSelectedPosition) {
        alert('Aucune position sélectionnée à valider');
        return;
    }
    
    lat = tempSelectedPosition.lat;
    lng = tempSelectedPosition.lng;
    
    map.setView([lat, lng], 12);
    
    if (marker) {
        map.removeLayer(marker);
    }
    
    marker = L.marker([lat, lng]).addTo(map)
        .bindPopup(`✅ POSITION VALIDÉE<br>📍 ${tempSelectedPosition.name}<br>Coordonnées: ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
        .openPopup();
    
    updateLocationDisplay();
    hidePositionValidation();
    
    // Vider les champs
    document.getElementById('manualLat').value = '';
    document.getElementById('manualLng').value = '';
    document.getElementById('addressSearch').value = '';
    
    // Message de confirmation
    showSuccessMessage('✅ Position validée avec succès !');
}

function updateMapPreview(latitude, longitude, displayName) {
    map.setView([latitude, longitude], 12);
    
    if (marker) {
        map.removeLayer(marker);
    }
    
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
    container.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
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
        
        if (!response.ok) {
            throw new Error(`Erreur de recherche: ${response.status}`);
        }
        
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
    
    if (results.length === 0) {
        listDiv.innerHTML = '<p style="color: #d63031;">Aucune adresse trouvée. Essayez une recherche différente.</p>';
        resultsDiv.style.display = 'block';
        return;
    }
    
    let html = '';
    results.forEach((result, index) => {
        html += `
            <div class="weather-card" style="cursor: pointer; margin: 10px 0;" 
                 onclick="selectAddressResult(${result.lat}, ${result.lon}, '${result.display_name.replace(/'/g, "\\'")}')">
                <strong>📍 ${result.display_name}</strong>
                <p style="font-size: 0.9em; color: #636e72; margin: 5px 0;">
                    Coordonnées: ${parseFloat(result.lat).toFixed(4)}, ${parseFloat(result.lon).toFixed(4)}
                </p>
            </div>
        `;
    });
    
    listDiv.innerHTML = html;
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
    
    // Masquer les résultats de recherche
    document.getElementById('addressResults').style.display = 'none';
}

/* ========================================
   RÉCUPÉRATION DES DONNÉES MÉTÉO
======================================== */

async function getWeatherData() {
    try {
        document.getElementById('loadingIndicator').style.display = 'block';
        
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,shortwave_radiation,direct_radiation,diffuse_radiation&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,is_day&timezone=auto&forecast_hours=24`
        );
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        weatherData = await response.json();
        displayWeatherData();
        displayHourlyForecast();
        
    } catch (error) {
        console.error('Erreur lors de la récupération des données météo:', error);
        alert('Erreur lors de la récupération des données météo: ' + error.message);
    } finally {
        document.getElementById('loadingIndicator').style.display = 'none';
    }
}

/* ========================================
   AFFICHAGE DES DONNÉES MÉTÉO
======================================== */

function displayWeatherData() {
    if (!weatherData) return;
    
    const current = weatherData.current;
    
    // Affichage des conditions actuelles
    const currentWeatherDiv = document.getElementById('currentWeather');
    const weatherCode = current.weather_code;
    const weatherIcon = getWeatherIcon(weatherCode, true);
    const weatherDesc = weatherCodes[weatherCode] || "Conditions inconnues";
    
    currentWeatherDiv.innerHTML = `
        <div class="weather-current">
            <h3>🌍 MÉTÉO ACTUELLE</h3>
            <div class="weather-icon">${weatherIcon}</div>
            <div class="temperature">${Math.round(current.temperature_2m)}°C</div>
            <div class="weather-description">${weatherDesc}</div>
            <div class="weather-grid">
                <div class="weather-card">
                    <strong>🌡️ Ressenti:</strong><br>
                    ${Math.round(current.apparent_temperature)}°C
                </div>
                <div class="weather-card">
                    <strong>💧 Humidité:</strong><br>
                    ${current.relative_humidity_2m}%
                </div>
                <div class="weather-card">
                    <strong>🌊 Pression:</strong><br>
                    ${Math.round(current.surface_pressure)} hPa
                </div>
                <div class="weather-card">
                    <strong>💨 Vent:</strong><br>
                    ${Math.round(current.wind_speed_10m)} km/h
                </div>
                <div class="weather-card">
                    <strong>🧭 Direction vent:</strong><br>
                    ${current.wind_direction_10m}°
                </div>
                <div class="weather-card">
                    <strong>🌧️ Précipitations:</strong><br>
                    ${current.precipitation} mm
                </div>
            </div>
        </div>
    `;
}

/* ========================================
   AFFICHAGE DES PRÉVISIONS HORAIRES
======================================== */

function displayHourlyForecast() {
    if (!weatherData || !weatherData.hourly) return;
    
    const hourly = weatherData.hourly;
    const forecastDiv = document.getElementById('hourlyForecast');
    
    // Prendre les 10 prochaines heures
    const hours = hourly.time.slice(0, 10);
    
    let forecastHTML = `
        <div class="hourly-forecast">
            <h3>⏰ PRÉVISIONS 10 PROCHAINES HEURES</h3>
            <div class="hourly-grid">
    `;
    
    for (let i = 0; i < hours.length; i++) {
        const datetime = new Date(hours[i]);
        const hour = datetime.getHours();
        const timeStr = `${hour.toString().padStart(2, '0')}h`;
        
        const temp = Math.round(hourly.temperature_2m[i]);
        const tempFeel = Math.round(hourly.apparent_temperature[i]);
        const humidity = hourly.relative_humidity_2m[i];
        const precipitation = hourly.precipitation[i];
        const windSpeed = Math.round(hourly.wind_speed_10m[i]);
        const windDir = hourly.wind_direction_10m[i];
        const pressure = Math.round(hourly.surface_pressure[i]);
        const weatherCode = hourly.weather_code[i];
        const isDay = hourly.is_day[i] === 1;
        
        const icon = getWeatherIcon(weatherCode, isDay);
        const description = weatherCodes[weatherCode] || "Inconnu";
        
        forecastHTML += `
            <div class="hourly-item">
                <div class="hourly-time">${timeStr}</div>
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

function sind(degrees) {
    return Math.sin(degrees * Math.PI / 180);
}

function cosd(degrees) {
    return Math.cos(degrees * Math.PI / 180);
}

function tand(degrees) {
    return Math.tan(degrees * Math.PI / 180);
}

function asind(value) {
    return Math.asin(value) * 180 / Math.PI;
}

function acosd(value) {
    return Math.acos(value) * 180 / Math.PI;
}

function atan2d(y, x) {
    return Math.atan2(y, x) * 180 / Math.PI;
}

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
    
    // Calcul du jour julien
    let a = Math.floor((14 - month) / 12);
    let y = year - a;
    let m = month + 12 * a - 3;
    let jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + 1721119.5;
    
    // Ajouter la fraction du jour
    jd += (hour + minute / 60 + second / 3600) / 24;
    
    // Nombre de jours depuis J2000.0
    const n = jd - 2451545.0;
    
    // Longitude solaire moyenne
    const L = (280.460 + 0.9856474 * n) % 360;
    
    // Anomalie moyenne
    const g = ((357.528 + 0.9856003 * n) % 360) * Math.PI / 180;
    
    // Longitude solaire vraie
    const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * Math.PI / 180;
    
    // Déclinaison solaire
    const delta = Math.asin(Math.sin(23.439 * Math.PI / 180) * Math.sin(lambda));
    
    // Équation du temps
    const E = 4 * (L * Math.PI / 180 - 0.0057183 - Math.atan2(Math.tan(lambda), Math.cos(23.439 * Math.PI / 180)));
    
    // Temps solaire vrai
    const TSV = (hour + minute / 60) + longitude / 15 + E / 60;
    
    // Angle horaire
    const H = 15 * (TSV - 12) * Math.PI / 180;
    
    // Latitude en radians
    const phi = latitude * Math.PI / 180;
    
    // Élévation solaire
    const elevation = Math.asin(Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(H));
    
    // Azimuth solaire
    let azimuth = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(delta) * Math.cos(phi));
    azimuth = (azimuth * 180 / Math.PI + 180) % 360; // Conversion en degrés et ajustement
    
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

/* ========================================
   GESTION DES ORIENTATIONS PERSONNALISÉES
======================================== */

function toggleCustomAzimuth() {
    const orientationSelect = document.getElementById('wallOrientation');
    const customAzimuthDiv = document.getElementById('customAzimuthDiv');
    
    if (orientationSelect.value === 'custom') {
        customAzimuthDiv.style.display = 'block';
    } else {
        customAzimuthDiv.style.display = 'none';
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

    // Utilisation des données météo actuelles
    const current = weatherData.current;
    const GHI = current.shortwave_radiation || 800; // W/m²
    const DNI = current.direct_radiation || 900; // W/m²
    const DHI = current.diffuse_radiation || 100; // W/m²

    // Calcul de la position solaire actuelle
    const now = new Date();
    const solarPos = calculateSolarPosition(lat, lng, now);

    // Calcul de l'angle d'incidence
    const aoi = calculateAngleOfIncidence(wallTilt, surfaceAzimuth, solarPos.zenith, solarPos.azimuth);

    // Calcul du rayonnement sur le mur
    let directOnWall = 0;
    if (aoi < 90) {
        directOnWall = DNI * Math.max(0, cosd(aoi));
    }

    const diffuseOnWall = DHI * (1 + cosd(wallTilt)) / 2;
    const reflectedOnWall = GHI * albedo * (1 - cosd(wallTilt)) / 2;
    const totalOnWall = directOnWall + diffuseOnWall + reflectedOnWall;

    // Affichage des résultats avec explications détaillées
    const resultsDiv = document.getElementById('solarResults');
    const orientationText = orientationSelect.value === 'custom' ? 
        `${surfaceAzimuth}° (personnalisé)` : 
        `${orientationSelect.options[orientationSelect.selectedIndex].text}`;

    resultsDiv.innerHTML = `
        <div class="solar-current">
            <h3>☀️ CALCUL DU RAYONNEMENT SOLAIRE</h3>
            <div class="weather-grid">
                <div><strong>📍 Position:</strong> ${lat.toFixed(4)}°, ${lng.toFixed(4)}°</div>
                <div><strong>🧭 Orientation mur:</strong> ${orientationText}</div>
                <div><strong>📐 Inclinaison mur:</strong> ${wallTilt}°</div>
                <div><strong>🌍 Albédo sol:</strong> ${albedo}</div>
            </div>
        </div>

        <div class="info" style="margin: 20px 0;">
            <h3>🔬 EXPLICATIONS DU CALCUL</h3>
            <p><strong>Le rayonnement total sur votre mur/fenêtre se compose de 3 parties :</strong></p>
            <ul style="text-align: left; margin: 10px 0;">
                <li><strong>Rayonnement direct :</strong> Lumière directe du soleil</li>
                <li><strong>Rayonnement diffus :</strong> Lumière diffusée par l'atmosphère et les nuages</li>
                <li><strong>Rayonnement réfléchi :</strong> Lumière réfléchie par le sol</li>
            </ul>
        </div>

        <h3>🧮 DÉTAIL DES CALCULS</h3>
        <div class="weather-grid">
            <div class="solar-card">
                <h4>1️⃣ Rayonnement Direct</h4>
                <p><strong>Formule :</strong> DNI × cos(angle_incidence)</p>
                <p><strong>Calcul :</strong> ${DNI.toFixed(1)} × cos(${aoi.toFixed(1)}°)</p>
                <p><strong>= ${DNI.toFixed(1)} × ${Math.max(0, cosd(aoi)).toFixed(3)}</strong></p>
                <p><strong>Résultat :</strong> <span style="color: #e17055;">${directOnWall.toFixed(1)} W/m²</span></p>
                ${aoi >= 90 ? '<p style="color: #d63031;">⚠️ Soleil derrière le mur (pas de rayonnement direct)</p>' : ''}
            </div>
            
            <div class="solar-card">
                <h4>2️⃣ Rayonnement Diffus</h4>
                <p><strong>Formule :</strong> DHI × (1 + cos(inclinaison_mur)) / 2</p>
                <p><strong>Calcul :</strong> ${DHI.toFixed(1)} × (1 + cos(${wallTilt}°)) / 2</p>
                <p><strong>= ${DHI.toFixed(1)} × (1 + ${cosd(wallTilt).toFixed(3)}) / 2</strong></p>
                <p><strong>= ${DHI.toFixed(1)} × ${((1 + cosd(wallTilt)) / 2).toFixed(3)}</strong></p>
                <p><strong>Résultat :</strong> <span style="color: #e17055;">${diffuseOnWall.toFixed(1)} W/m²</span></p>
            </div>
            
            <div class="solar-card">
                <h4>3️⃣ Rayonnement Réfléchi</h4>
                <p><strong>Formule :</strong> GHI × albédo × (1 - cos(inclinaison_mur)) / 2</p>
                <p><strong>Calcul :</strong> ${GHI.toFixed(1)} × ${albedo} × (1 - cos(${wallTilt}°)) / 2</p>
                <p><strong>= ${GHI.toFixed(1)} × ${albedo} × (1 - ${cosd(wallTilt).toFixed(3)}) / 2</strong></p>
                <p><strong>= ${GHI.toFixed(1)} × ${albedo} × ${((1 - cosd(wallTilt)) / 2).toFixed(3)}</strong></p>
                <p><strong>Résultat :</strong> <span style="color: #e17055;">${reflectedOnWall.toFixed(1)} W/m²</span></p>
            </div>
        </div>

        <div class="solar-current" style="margin-top: 20px;">
            <h3>🎯 RÉSULTAT FINAL</h3>
            <div class="weather-grid">
                <div class="solar-card" style="border-left-color: #00b894; background: #d1f2eb;">
                    <h4>📊 SOMME TOTALE</h4>
                    <p><strong>Formule :</strong> Direct + Diffus + Réfléchi</p>
                    <p><strong>Calcul :</strong> ${directOnWall.toFixed(1)} + ${diffuseOnWall.toFixed(1)} + ${reflectedOnWall.toFixed(1)}</p>
                    <p><strong>TOTAL :</strong> <span style="font-size: 1.5em; color: #00b894;">${totalOnWall.toFixed(1)} W/m²</span></p>
                </div>
            </div>
        </div>

        <h3>🌞 Position Solaire Actuelle</h3>
        <div class="weather-grid">
            <div class="solar-card">
                <strong>🧭 Azimuth solaire:</strong> ${solarPos.azimuth.toFixed(1)}°
                <p style="font-size: 0.9em; margin-top: 5px;">Direction du soleil (0°=Nord, 90°=Est, 180°=Sud, 270°=Ouest)</p>
            </div>
            <div class="solar-card">
                <strong>📐 Élévation solaire:</strong> ${solarPos.elevation.toFixed(1)}°
                <p style="font-size: 0.9em; margin-top: 5px;">Hauteur du soleil au-dessus de l'horizon</p>
            </div>
            <div class="solar-card">
                <strong>🔺 Angle zénithal:</strong> ${solarPos.zenith.toFixed(1)}°
                <p style="font-size: 0.9em; margin-top: 5px;">Angle depuis la verticale (90° - élévation)</p>
            </div>
            <div class="solar-card">
                <strong>📐 Angle d'incidence:</strong> ${aoi.toFixed(1)}°
                <p style="font-size: 0.9em; margin-top: 5px;">Angle entre les rayons solaires et la normale au mur</p>
            </div>
        </div>

        <h3>☀️ Données de Rayonnement Météo</h3>
        <div class="weather-grid">
            <div class="solar-card">
                <strong>🌍 GHI (Global Horizontal):</strong><br>
                ${GHI.toFixed(1)} W/m²
                <p style="font-size: 0.9em; margin-top: 5px;">Rayonnement total sur surface horizontale</p>
            </div>
            <div class="solar-card">
                <strong>☀️ DNI (Direct Normal):</strong><br>
                ${DNI.toFixed(1)} W/m²
                <p style="font-size: 0.9em; margin-top: 5px;">Rayonnement direct perpendiculaire au soleil</p>
            </div>
            <div class="solar-card">
                <strong>☁️ DHI (Diffuse Horizontal):</strong><br>
                ${DHI.toFixed(1)} W/m²
                <p style="font-size: 0.9em; margin-top: 5px;">Rayonnement diffus sur surface horizontale</p>
            </div>
        </div>

        <div class="success" style="margin-top: 20px;">
            💡 <strong>Interprétation pour vos rideaux :</strong> ${
                totalOnWall > 500 ? 
                '🔥 Rayonnement ÉLEVÉ - Fermer les rideaux pour éviter la surchauffe' : 
                totalOnWall > 200 ? 
                '🌤️ Rayonnement MODÉRÉ - Ajuster selon vos besoins de chauffage/refroidissement' : 
                '❄️ Rayonnement FAIBLE - Ouvrir les rideaux pour maximiser l\'apport solaire'
            }
        </div>
    `;
}

/* ========================================
   INITIALISATION AU CHARGEMENT DE LA PAGE
======================================== */

document.addEventListener('DOMContentLoaded', function() {
    // Initialiser la carte
    initMap();
    
    // Mettre à jour l'affichage de la position
    updateLocationDisplay();
    
    // Ajouter les event listeners
    document.getElementById('getCurrentLocation').addEventListener('click', getCurrentLocation);
    document.getElementById('getWeather').addEventListener('click', getWeatherData);
    document.getElementById('calculateSolar').addEventListener('click', calculateSolarRadiation);
    document.getElementById('wallOrientation').addEventListener('change', toggleCustomAzimuth);
    
    // Event listeners pour la gestion unifiée des positions
    document.getElementById('validatePosition').addEventListener('click', validatePosition);
    document.getElementById('searchAddress').addEventListener('click', searchAddress);
    
    // Event listeners pour les coordonnées manuelles
    document.getElementById('manualLat').addEventListener('input', function() {
        const lat = parseFloat(this.value);
        const lng = parseFloat(document.getElementById('manualLng').value);
        if (!isNaN(lat) && !isNaN(lng)) {
            tempSelectedPosition = {
                lat: lat,
                lng: lng,
                name: "Position manuelle"
            };
            showPositionValidation();
            updateMapPreview(lat, lng, "Position manuelle");
        }
    });
    
    document.getElementById('manualLng').addEventListener('input', function() {
        const lat = parseFloat(document.getElementById('manualLat').value);
        const lng = parseFloat(this.value);
        if (!isNaN(lat) && !isNaN(lng)) {
            tempSelectedPosition = {
                lat: lat,
                lng: lng,
                name: "Position manuelle"
            };
            showPositionValidation();
            updateMapPreview(lat, lng, "Position manuelle");
        }
    });
    
    // Permettre la recherche avec la touche Entrée
    document.getElementById('addressSearch').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchAddress();
        }
    });
    
    // Récupérer automatiquement les données météo pour Paris au démarrage
    getWeatherData();
});


