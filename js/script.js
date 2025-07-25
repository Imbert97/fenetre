// === Variables globales ===
let map = null;
let currentLat = 46.81, currentLng = -71.21;
let weatherData = null;
let solarFluxVector = [];
let tempVector = [];
let userParams = {
    orientation: 180,      // azimuth du mur (par défaut plein sud)
    inclinaison: 90,       // inclinaison du mur (vertical)
    albedo: 0.2,           // albédo sol
    hauteurFenetre: 1.8    // hauteur de la fenêtre en m
};

// === Initialisation carte Leaflet ===
function initMap() {
    map = L.map('map').setView([currentLat, currentLng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);
    const marker = L.marker([currentLat, currentLng], { draggable: true }).addTo(map);
    marker.on('dragend', function (e) {
        const pos = e.target.getLatLng();
        currentLat = pos.lat;
        currentLng = pos.lng;
        onPositionChanged();
    });
    map.on('click', function (e) {
        currentLat = e.latlng.lat;
        currentLng = e.latlng.lng;
        marker.setLatLng([currentLat, currentLng]);
        onPositionChanged();
    });
}

// === Gestion changement position ===
function onPositionChanged() {
    if (weatherData) { controllerWorkflow(); }
}

// === Recherche adresse via OpenStreetMap ===
async function searchAddress(query) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1`;
    const response = await fetch(url);
    const results = await response.json();
    // Affichage/récupération du meilleur résultat :
    if (results.length > 0) {
        currentLat = parseFloat(results[0].lat);
        currentLng = parseFloat(results[0].lon);
        map.setView([currentLat, currentLng], 13);
        onPositionChanged();
    }
}

// === Récupération Météo Open-Meteo ===
async function getWeatherData(lat, lon) {
    const baseUrl = "https://api.open-meteo.com/v1/forecast";
    const params = `?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,cloudcover,precipitation,pressure_msl,relativehumidity_2m&timezone=auto`;
    const url = baseUrl + params;
    const res = await fetch(url);
    weatherData = await res.json();
    // Assurez-vous que weatherData.hourly.* existent
}

// === Interpolation linéaire (valeurs, par seconde) ===
function interpolateHourlyToSeconds(hourlyArr) {
    const result = [];
    for (let h = 0; h < hourlyArr.length - 1; h++) {
        const v1 = hourlyArr[h];
        const v2 = hourlyArr[h+1];
        for (let s = 0; s < 3600; s++) {
            const frac = s / 3600;
            result.push(v1 * (1 - frac) + v2 * frac);
        }
    }
    return result; // ex: 10h => 36 000 valeurs
}

// === Calculs Solaires de base (hauteur et azimut) ===
// Utilise la formule simplifiée et cohérente partout
function getSolarPosition(date, lat, lng) {
    // Méthode simplifiée : formule Spa/NOAA pour azimuth/élévation → à remplacer au besoin
    const JD = (date / 86400000) + 2440587.5;
    const d = JD - 2451545.0;
    const meanLongitude = (280.46 + 0.9856474 * d) % 360;
    const meanAnomaly = (357.528 + 0.9856003 * d) % 360;
    const eclipticLongitude = meanLongitude + 1.915 * Math.sin(meanAnomaly * Math.PI/180) + 0.02 * Math.sin(2*meanAnomaly * Math.PI/180);
    const obliquity = 23.439 - 0.0000004 * d;
    const declination = Math.asin(Math.sin(obliquity * Math.PI/180) * Math.sin(eclipticLongitude * Math.PI/180));
    const timeUTC = date.getUTCHours() + date.getUTCMinutes()/60 + date.getUTCSeconds()/3600;
    const GST = (18.697374558 + 24.06570982441908 * d) % 24;
    const LST = (GST + lng/15) % 24;
    const hourAngle = 15 * (LST - timeUTC);
    const haRad = hourAngle * Math.PI/180;
    const latRad = lat * Math.PI/180;
    const elevation = Math.asin(Math.sin(latRad)*Math.sin(declination) + Math.cos(latRad)*Math.cos(declination)*Math.cos(haRad));
    const azimuth = Math.atan2(-Math.sin(haRad), Math.tan(declination)*Math.cos(latRad) - Math.sin(latRad)*Math.cos(haRad));
    return {
        elevation: elevation * 180/Math.PI, // ° au-dessus de l’horizon
        azimuth: (azimuth * 180/Math.PI + 360) % 360 // azimut solaire
    };
}

// === Calcul incidence solaire sur la fenêtre ===
function calculateAngleOfIncidence(sun, params=userParams) {
    // sun : {elevation, azimuth}
    // θ = angle entre rayon incident et normale fenêtre
    const wallAz = params.orientation;
    const wallIncli = params.inclinaison;
    const sa = sun.azimuth * Math.PI/180;
    const ea = sun.elevation * Math.PI/180;
    const wa = wallAz * Math.PI/180;
    const wi = wallIncli * Math.PI/180;
    // Calcule scalaire
    const incident = Math.cos(wi)*Math.sin(ea) + Math.sin(wi)*Math.cos(ea)*Math.cos(sa-wa);
    return Math.acos(incident) * 180/Math.PI;
}

// == Flux solaire incident (excluant atmosphère complexe) ==
function calculateSolarRadiation(datetime, lat, lng, params=userParams) {
    // Irradiance directe normale supposée max (simplifié), atténuée par élévation
    const G_sc = 1000; // W/m²
    const sun = getSolarPosition(datetime, lat, lng);
    if (sun.elevation <= 0) return 0;
    const theta = calculateAngleOfIncidence(sun, params);
    const cosTheta = Math.max(0, Math.cos(theta * Math.PI / 180));
    // Atténuation nuage, param atm, etc. simplifiée...
    return G_sc * cosTheta;
}

// === Génération/Interpolation du flux Solaire ===
function generateSolarDataHourly() {
    if (!weatherData) return [];
    const lenH = weatherData.hourly.time.length;
    const hourlySolar = [];
    for (let h = 0; h < lenH; h++) {
        const date = new Date(weatherData.hourly.time[h]);
        hourlySolar.push(
            calculateSolarRadiation(date, currentLat, currentLng, userParams)
        );
    }
    return hourlySolar;
}

function generateSolarFluxVector() {
    const hourly = generateSolarDataHourly();
    solarFluxVector = interpolateHourlyToSeconds(hourly);
    return solarFluxVector;
}

function generateTempVector() {
    if (!weatherData || !weatherData.hourly.temperature_2m) return [];
    tempVector = interpolateHourlyToSeconds(weatherData.hourly.temperature_2m);
    return tempVector;
}

// === Synchronisation graphique solaire (Chart.js) ===
function updateSolarChart() {
    generateSolarFluxVector();
    // Downsample pour l’affichage (ex : 1 point/minute)
    const chartData = [];
    for (let i = 0; i < solarFluxVector.length; i += 60)
        chartData.push(solarFluxVector[i]);
    // MAJ du Chart.js (non inclus ici, à relier à l’instance chart existante)
    if (window.myChart && window.myChart.data) {
        window.myChart.data.datasets[0].data = chartData;
        window.myChart.update();
    }
}

// === Génération du vecteur Python (copier-coller) ===
function getPythonVector(vector) {
    return "[" + vector.map(v => v.toFixed(2)).join(", ") + "]";
}

// === Contrôleur principal (enchaînement complet UI) ===
async function controllerWorkflow() {
    await getWeatherData(currentLat, currentLng);
    generateTempVector();
    generateSolarFluxVector();
    updateSolarChart();
    // Affichage, activations boutons, etc : à compléter selon votre UI
    document.getElementById('python-temperature').value = getPythonVector(tempVector);
    document.getElementById('python-solar').value = getPythonVector(solarFluxVector);
}

// === Initialisation globale UI ===
window.onload = function() {
    initMap();
    document.getElementById('searchBtn').onclick = function() {
        const q = document.getElementById('searchInput').value;
        searchAddress(q);
    };
    document.getElementById('runCalcBtn').onclick = controllerWorkflow;
    // [Ajouter ici autres handlers selon vos entrées dynamiques]
};

