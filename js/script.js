/* ========================================
   VARIABLES GLOBALES
======================================== */

let map, marker, lat = 46.7795, lng = -71.2770; 
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

let solarChartInstance = null; // Pour pouvoir détruire le graphique précédent

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

    // Données météo actuelles
    const current = weatherData.current;
    const GHI = current.shortwave_radiation || 800; // W/m²
    const DNI = current.direct_radiation || 900;    // W/m²
    const DHI = current.diffuse_radiation || 100;   // W/m²

    // Calcul de la position solaire actuelle
    const now = new Date();
    const solarPos = calculateSolarPosition(lat, lng, now);

    // Calcul de l'angle d'incidence
    const aoi = calculateAngleOfIncidence(wallTilt, surfaceAzimuth, solarPos.zenith, solarPos.azimuth);

    // Rayonnement direct
    let directOnWall = 0;
    if (aoi < 90) {
        directOnWall = DNI * Math.max(0, cosd(aoi));
    }

    // Rayonnement diffus
    const diffuseOnWall = DHI * (1 + cosd(wallTilt)) / 2;

    // Facteur de réduction selon la hauteur
    function reflectedReductionFactor(height) {
        if (height <= 2) return 1;
        return Math.exp(-0.2 * (height - 2));
    }
    const reduction = reflectedReductionFactor(windowHeight);

    // Rayonnement réfléchi avec réduction selon la hauteur
    const reflectedOnWall = GHI * albedo * (1 - cosd(wallTilt)) / 2 * reduction;

    // Total
    const totalOnWall = directOnWall + diffuseOnWall + reflectedOnWall;

    // Affichage des résultats (inchangé)
    const resultsDiv = document.getElementById('solarResults');
    const orientationText = orientationSelect.value === 'custom' ? 
        `${surfaceAzimuth}° (personnalisé)` : 
        `${orientationSelect.options[orientationSelect.selectedIndex].text}`;

    resultsDiv.innerHTML = `
        <!-- ... ton affichage détaillé comme avant ... -->
    `;

    // ------------- AJOUT DU GRAPHIQUE -------------
    // Calcul pour les 10 prochaines heures
    if (weatherData.hourly && weatherData.hourly.time) {
        const labels = [];
        const data = [];
        const nowDate = new Date();
        for (let i = 0; i < 10; i++) {
            // Cherche l'index de l'heure correspondante dans weatherData.hourly.time
            const hourDate = new Date(nowDate.getTime() + i * 3600 * 1000);
            const hourStr = hourDate.toISOString().slice(0, 13); // format 'YYYY-MM-DDTHH'
            let idx = weatherData.hourly.time.findIndex(t => t.startsWith(hourStr));
            if (idx === -1) idx = i; // fallback

            // Récupère les valeurs horaires
            const GHIh = weatherData.hourly.shortwave_radiation ? weatherData.hourly.shortwave_radiation[idx] : GHI;
            const DNIh = weatherData.hourly.direct_radiation ? weatherData.hourly.direct_radiation[idx] : DNI;
            const DHIh = weatherData.hourly.diffuse_radiation ? weatherData.hourly.diffuse_radiation[idx] : DHI;

            // Calcul de la position solaire pour cette heure
            const solarPh = calculateSolarPosition(lat, lng, hourDate);
            const aoiH = calculateAngleOfIncidence(wallTilt, surfaceAzimuth, solarPh.zenith, solarPh.azimuth);

            let directH = 0;
            if (aoiH < 90) directH = DNIh * Math.max(0, cosd(aoiH));
            const diffuseH = DHIh * (1 + cosd(wallTilt)) / 2;
            const reflectedH = GHIh * albedo * (1 - cosd(wallTilt)) / 2 * reduction;
            const totalH = directH + diffuseH + reflectedH;

            labels.push(hourDate.getHours().toString().padStart(2, '0') + 'h');
            data.push(Math.round(totalH));
        }

        // Affiche le graphique avec Chart.js
        const ctx = document.getElementById('solarIrradianceChart').getContext('2d');
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
                        text: "Évolution du rayonnement solaire sur les 10 prochaines heures"
                    }
                },
                scales: {
                    y: {
                        title: { display: true, text: "W/m²" },
                        beginAtZero: true
                    },
                    x: {
                        title: { display: true, text: "Heure" }
                    }
                }
            }
        });
    }
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
    
    getWeatherData();
});


