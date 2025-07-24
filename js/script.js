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
    
    // Vider le contenu précédent
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
        
        // Utiliser addEventListener au lieu de onclick
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
   AFFICHAGE DES PRÉVISIONS HORAIRES
======================================== */

function displayHourlyForecast() {
    if (!weatherData || !weatherData.hourly) return;
    
    const hourly = weatherData.hourly;
    const forecastDiv = document.getElementById('hourlyForecast');
    if (!forecastDiv) return;
    
    const targetTimezone = weatherData.timezone || 'UTC';
    const now = new Date();
    
    // 🔧 CORRECTION : Chercher la prochaine heure PLEINE
    let startIndex = 0;
    const currentHour = new Intl.DateTimeFormat('en-US', {
        timeZone: targetTimezone,
        hour: 'numeric',
        hourCycle: 'h23'
    }).format(now);
    
    const currentMinute = new Intl.DateTimeFormat('en-US', {
        timeZone: targetTimezone,
        minute: 'numeric'
    }).format(now);
    
    // Si on est à XX:01 ou plus, prendre l'heure suivante
    const targetHour = parseInt(currentMinute) > 0 ? (parseInt(currentHour) + 1) % 24 : parseInt(currentHour);
    
    // Trouver le premier créneau correspondant à l'heure cible ou suivante
    for (let i = 0; i < hourly.time.length; i++) {
        const weatherTime = new Date(hourly.time[i]);
        const weatherHourInTz = new Intl.DateTimeFormat('en-US', {
            timeZone: targetTimezone,
            hour: 'numeric',
            hourCycle: 'h23'
        }).format(weatherTime);
        
        if (parseInt(weatherHourInTz) >= targetHour) {
            startIndex = i;
            break;
        }
    }
    
    // Si on n'a pas trouvé de créneau futur aujourd'hui, chercher demain
    if (startIndex === 0) {
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        for (let i = 0; i < hourly.time.length; i++) {
            const weatherTime = new Date(hourly.time[i]);
            if (weatherTime.getDate() === tomorrow.getDate()) {
                startIndex = i;
                break;
            }
        }
    }
    
    // Fallback final
    if (startIndex === 0) {
        startIndex = Math.max(0, hourly.time.length - 10);
    }
    
    // Affichage de debug amélioré
    const nowInTargetTz = new Intl.DateTimeFormat('fr-FR', {
        timeZone: targetTimezone,
        hour: '2-digit',
        minute: '2-digit'
    }).format(now);
    
    let forecastHTML = `
        <div class="hourly-forecast">
            <h3>⏰ PRÉVISIONS 10 PROCHAINES HEURES (${targetTimezone})</h3>
            <div class="info" style="background: rgba(255,255,255,0.1); color: white; margin: 10px 0; border: none;">
                🕐 Heure locale actuelle (${targetTimezone}) : ${nowInTargetTz}
                <br>📍 Fuseau horaire : ${targetTimezone}
                <br>🎯 Heure cible : ${targetHour}h00
                <br>🔍 Démarrage à l'index : ${startIndex}
                <br>📊 Total d'heures disponibles : ${hourly.time.length}
            </div>
            <div class="hourly-grid">
    `;
    
    // Génération des 10 prochaines heures
    for (let i = 0; i < 10 && (startIndex + i) < hourly.time.length; i++) {
        const dataIndex = startIndex + i;
        const weatherTime = new Date(hourly.time[dataIndex]);
        
        // Affichage de l'heure dans le bon fuseau horaire
        const timeStr = new Intl.DateTimeFormat('fr-FR', {
            timeZone: targetTimezone,
            hour: '2-digit',
            minute: '2-digit'
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
    const DHI = current.diffuse_radiation || 100;

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
        </div>
    `;

    if (weatherData.hourly && weatherData.hourly.time) {
        const canvasElement = document.getElementById('solarIrradianceChart');
        if (canvasElement) {
            const labels = [];
            const data = [];
            
            // 🔧 CORRECTION FINALE : Logique simplifiée et fiable
            const now = new Date();
            const targetTimezone = weatherData.timezone || 'UTC';
            const currentTime = now.getTime();
            
            // Trouver le premier créneau horaire qui vient après maintenant
            let startIndex = 0;
            for (let i = 0; i < weatherData.hourly.time.length; i++) {
                const weatherTime = new Date(weatherData.hourly.time[i]);
                if (weatherTime.getTime() > currentTime) {
                    startIndex = i;
                    break;
                }
            }
            
            // Si on n'a pas trouvé de créneau futur, prendre les 10 derniers
            if (startIndex === 0) {
                startIndex = Math.max(0, weatherData.hourly.time.length - 10);
            }
            
            for (let i = 0; i < 10; i++) {
                const dataIndex = startIndex + i;
                
                if (dataIndex >= weatherData.hourly.time.length) break;
                
                const weatherTime = new Date(weatherData.hourly.time[dataIndex]);
                
                // Affichage de l'heure dans le bon fuseau horaire
                const hourStr = new Intl.DateTimeFormat('fr-FR', {
                    timeZone: targetTimezone,
                    hour: '2-digit',
                    minute: '2-digit'
                }).format(weatherTime);
                
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
    console.log('🚀 Initialisation de l\'application...');
    
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
});

