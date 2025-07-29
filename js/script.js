const CODE_VERSION = "v1.2.1 (Simplified)"; // Updated version

/* ========================================
   VARIABLES GLOBALES
======================================== */

let map, marker, lat = 46.8139, lng = -71.2080; // Québec par défaut
let weatherData = null;
let tempSelectedPosition = null;
let solarChartInstance = null;
let autoInterval = null; // To keep track of the auto-retrieval interval

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
    getWeatherData(); // Refresh weather data for new location
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

    results.forEach((result) => {
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
   RÉCUPÉRATION DES DONNÉES MÉTÉO (OPEN-METEO)
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

        console.log('🔍 Données météo Open-Meteo récupérées:', weatherData);
        // Removed displayHourlyForecast() as per user request to simplify for real-time focus
        calculateSolarRadiation(); // Recalculate solar radiation with new data

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
    const customAzimuthInput = document.getElementById('customAzimuth');
    const wallTiltInput = document.getElementById('wallTilt');
    const albedoInput = document.getElementById('albedo');
    const windowHeightInput = document.getElementById('windowHeight');

    const wallTilt = parseFloat(wallTiltInput.value);
    const albedo = parseFloat(albedoInput.value);
    const windowHeight = parseFloat(windowHeightInput.value) || 0;

    if (!orientationSelect) {
        console.error('Element wallOrientation not found');
        return;
    }

    let surfaceAzimuth;
    if (orientationSelect.value === 'custom') {
        surfaceAzimuth = parseFloat(customAzimuthInput.value);
        if (isNaN(surfaceAzimuth)) {
            alert('Veuillez entrer un azimuth personnalisé valide');
            return;
        }
    } else {
        surfaceAzimuth = orientationToAzimuth(orientationSelect.value);
    }

    const current = weatherData.current;
    const GHI = current.shortwave_radiation || 0; // Use 0 if data is missing, avoid NaN
    const DNI = current.direct_radiation || 0;
    const DHI = current.diffuse_radiation || 0;

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

    // Chart logic for 10-hour solar irradiance still present for manual display
    if (weatherData.hourly && weatherData.hourly.time) {
        const canvasElement = document.getElementById('solarIrradianceChart');
        if (canvasElement) {
            const labels = [];
            const data = [];
            const targetTimezone = weatherData.timezone || 'UTC';
            const now = new Date();
            let startIndex = 0;

            for (let i = 0; i < weatherData.hourly.time.length; i++) {
                const weatherTime = new Date(weatherData.hourly.time[i]);
                if (weatherTime.getTime() >= (now.getTime() - 30 * 60 * 1000)) {
                    startIndex = i;
                    break;
                }
            }

            for (let i = 0; i < 10; i++) { // Display 10 hours for the chart
                const dataIndex = startIndex + i;

                if (dataIndex >= weatherData.hourly.time.length) break;

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
    const autoRetrieveBtn = document.getElementById('autoRetrieveBtn'); // Get the correct button

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

    getWeatherData(); // Initial data fetch

    console.log('✅ Application initialisée avec succès !');

    const autoRetrieveMessageElement = document.getElementById('autoRetrieveMessage');
    const currentTempDisplayElement = document.getElementById('currentTempDisplay');
    const currentFluxDisplayElement = document.getElementById('currentFluxDisplay');

    if (autoRetrieveBtn) {
        autoRetrieveBtn.addEventListener('click', function() {
            if (autoInterval) {
                alert("La récupération automatique est déjà activée.");
                return;
            }
            // Update status to "Actif"
            if (autoRetrieveMessageElement) {
                autoRetrieveMessageElement.textContent = "Actif";
            }

            // Execute once immediately
            retrieveAndSaveForecast();
            // Start interval to run every minute
            autoInterval = setInterval(function() {
                let now = new Date();
                if (now.getHours() >= 20 || now.getHours() < 6) { // Stop between 8 PM and 6 AM
                    clearInterval(autoInterval);
                    autoInterval = null;
                    if (autoRetrieveMessageElement) {
                        autoRetrieveMessageElement.textContent = "Inactif (Hors heures de service)";
                    }
                    alert("Fin de la récupération automatique (heure hors service: 20h-6h)");
                    return;
                }
                retrieveAndSaveForecast(); // Save current data every minute
            }, 60 * 1000); // Every minute

            alert("🌡️ Lancement de la récupération automatique (sauvegarde chaque minute)");
        });
    }


    async function retrieveAndSaveForecast() {
        try {
            await getWeatherData(); // Retrieve weather data

            if (!weatherData || !weatherData.current) {
                console.error("❌ Données météo actuelles absentes.");
                return;
            }

            const now = new Date();

            const currentTemp = weatherData.current.temperature_2m;

            const orientationSelect = document.getElementById('wallOrientation');
            const customAzimuthInput = document.getElementById('customAzimuth');
            const wallTiltInput = document.getElementById('wallTilt');
            const albedoInput = document.getElementById('albedo');
            const windowHeightInput = document.getElementById('windowHeight');

            let wallTilt = wallTiltInput ? parseFloat(wallTiltInput.value) : 90;
            let albedo = albedoInput ? parseFloat(albedoInput.value) : 0.2;
            let windowHeight = windowHeightInput ? parseFloat(windowHeightInput.value) : 0;

            let surfaceAzimuth = 180;
            if (orientationSelect) {
                if (orientationSelect.value === 'custom' && customAzimuthInput) {
                    surfaceAzimuth = parseFloat(customAzimuthInput.value);
                    if (isNaN(surfaceAzimuth)) surfaceAzimuth = 180;
                } else {
                    surfaceAzimuth = orientationToAzimuth(orientationSelect.value);
                }
            }

            const GHI_current = weatherData.current.shortwave_radiation || 0;
            const DNI_current = weatherData.current.direct_radiation || 0;
            const DHI_current = weatherData.current.diffuse_radiation || 0;

            const solarPos_current = calculateSolarPosition(lat, lng, now);
            const aoi_current = calculateAngleOfIncidence(wallTilt, surfaceAzimuth, solarPos_current.zenith, solarPos_current.azimuth);

            let directOnWall_current = 0;
            if (aoi_current < 90) {
                directOnWall_current = DNI_current * Math.max(0, cosd(aoi_current));
            }

            const diffuseOnWall_current = DHI_current * (1 + cosd(wallTilt)) / 2;
            const reduction = windowHeight <= 2 ? 1 : Math.exp(-0.2 * (windowHeight - 2));
            const reflectedOnWall_current = GHI_current * albedo * (1 - cosd(wallTilt)) / 2 * reduction;

            const currentTotalFlux = Math.round((directOnWall_current + diffuseOnWall_current + reflectedOnWall_current) * 10) / 10;

            const dataToSave = {
                date: now.toISOString(),
                temperature_actuelle: currentTemp,
                flux_solaires_actuel: currentTotalFlux
            };
            addToSauvegardes(dataToSave);
            console.log("✔️ Données actuelles sauvegardées:", dataToSave);

            // Update display elements
            if (currentTempDisplayElement) {
                currentTempDisplayElement.textContent = `${currentTemp}°C`;
            }
            if (currentFluxDisplayElement) {
                currentFluxDisplayElement.textContent = `${currentTotalFlux} W/m²`;
            }

        } catch (e) {
            console.error("Erreur de récupération automatique:", e);
        }
    }

    let all_saves = [];

    function loadSavesFromStorage() {
        const json = localStorage.getItem('weather_forecast_history');
        if (json) {
            all_saves = JSON.parse(json);
        } else {
            all_saves = [];
        }
    }
    loadSavesFromStorage();

    function updateSauvegardesTable() {
        const tableBody = document.querySelector('#sauvegardesTable #tableBody');
        const tableHeader = document.querySelector('#sauvegardesTable #tableHeader');
        if (!tableBody || !tableHeader) {
            console.error('Table elements not found');
            return;
        }
        tableBody.innerHTML = "";
        tableHeader.innerHTML = "";

        if (all_saves.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='3'>Aucune sauvegarde enregistrée.</td></tr>"; // Changed colspan to 3
            document.getElementById('sauvegardesTableInfo').textContent = "Aucune sauvegarde historique récente.";
            return;
        }

        let headers = ['Date sauvegarde', 'T° Actuelle', 'Flux Actuel'];
        headers.forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            tableHeader.appendChild(th);
        });

        all_saves.forEach(save => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${new Date(save.date).toLocaleString()}</td>` +
                           `<td>${save.temperature_actuelle}</td>` +
                           `<td>${save.flux_solaires_actuel}</td>`;
            tableBody.appendChild(tr);
        });

        document.getElementById('sauvegardesTableInfo').textContent = `Dernière sauvegarde : ${new Date(all_saves[all_saves.length - 1].date).toLocaleTimeString()}`;
    }

    function addToSauvegardes(dataToSave) {
        if (all_saves.length > 0) {
            let last = all_saves[all_saves.length - 1];
            let lastMinute = (new Date(last.date)).toISOString().slice(0,16);
            let newMinute = (new Date(dataToSave.date)).toISOString().slice(0,16);
            if (lastMinute === newMinute) return;
        }
        all_saves.push(dataToSave);
        localStorage.setItem('weather_forecast_history', JSON.stringify(all_saves));
        updateSauvegardesTable();
    }

    document.addEventListener('DOMContentLoaded', updateSauvegardesTable); // Ensure table is updated on load

    const copyTableBtn = document.getElementById('copyTableBtn');
    if (copyTableBtn) {
        copyTableBtn.addEventListener('click', function() {
            if (all_saves.length === 0) {
                alert("Aucune donnée à copier !");
                return;
            }
            let csv = [];
            let titles = ['Date', 'Température Actuelle', 'Flux Solaire Actuel'];
            csv.push(titles.join("\t"));

            all_saves.forEach(save => {
                let line = [
                    new Date(save.date).toLocaleString(),
                    save.temperature_actuelle,
                    save.flux_solaires_actuel
                ];
                csv.push(line.join("\t"));
            });
            let text = csv.join("\n");
            navigator.clipboard.writeText(text).then(() => {
                alert("✅ Tableau copié ! Colle-le dans Excel directement.");
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                alert("Impossible de copier le tableau automatiquement. Erreur: " + err);
            });
        });
    }
});

