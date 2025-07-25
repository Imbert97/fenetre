<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Météo & Flux Solaire</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css"/>
    <style>
        #map { height: 300px; width: 100%; margin-bottom: 10px; }
        #controls, #results { margin: 10px 0; }
        textarea { width: 100%; height: 80px; }
    </style>
</head>
<body>
    <h2>Météo & Simulation Solaire</h2>
    <div id="map"></div>
    <div id="controls">
        <input type="text" id="searchInput" placeholder="Adresse ou lieu"/>
        <button id="searchBtn">Rechercher</button>
        <button id="runCalcBtn">Calculer (Météo + Solaire)</button>
    </div>

    <!-- Paramètres utilisateurs optionnels -->
    <div>
        Orientation (azimut, °, sud=180): <input type="number" id="sliderOrient" min="0" max="360" value="180">
        Inclinaison (°, vertical=90): <input type="number" id="sliderInclinaison" min="0" max="180" value="90">
        Albédo: <input type="number" step="0.01" id="inputAlbedo" min="0" max="1" value="0.2">
    </div>

    <div>
        <canvas id="solarChart" height="120"></canvas>
    </div>
    <div id="results">
        <b>Vecteur Température (Python) :</b><br>
        <textarea id="python-temperature" readonly></textarea><br>
        <b>Vecteur Flux Solaire (Python) :</b><br>
        <textarea id="python-solar" readonly></textarea>
    </div>
    <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
    // === Variables globales ===
    let map = null, marker = null;
    let currentLat = 46.81, currentLng = -71.21;
    let weatherData = null, solarFluxVector = [], tempVector = [];
    let userParams = {
        orientation: 180,
        inclinaison: 90,
        albedo: 0.2,
    };
    let myChart = null;

    // === Initialisation carte Leaflet ===
    function initMap() {
        map = L.map('map').setView([currentLat, currentLng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);
        marker = L.marker([currentLat, currentLng], { draggable: true }).addTo(map);
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
        if (weatherData) controllerWorkflow();
    }

    // === Recherche adresse OpenStreetMap Nominatim ===
    async function searchAddress(query) {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1`;
        const response = await fetch(url);
        const results = await response.json();
        if (results.length > 0) {
            currentLat = parseFloat(results[0].lat);
            currentLng = parseFloat(results[0].lon);
            map.setView([currentLat, currentLng], 13);
            marker.setLatLng([currentLat, currentLng]);
            onPositionChanged();
        }
    }

    // === Récupération météo (Open-Meteo) ===
    async function getWeatherData(lat, lon) {
        const baseUrl = "https://api.open-meteo.com/v1/forecast";
        const params = `?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,cloudcover,precipitation,pressure_msl,relativehumidity_2m&timezone=auto`;
        const url = baseUrl + params;
        const res = await fetch(url);
        weatherData = await res.json();
    }

    // === Interpolation (linéaire) ===
    function interpolateHourlyToSeconds(hourlyArr) {
        const result = [];
        for (let h = 0; h < hourlyArr.length - 1; h++) {
            const v1 = hourlyArr[h], v2 = hourlyArr[h + 1];
            for (let s = 0; s < 3600; s++) {
                result.push(v1 * (1 - (s/3600)) + v2 * (s/3600));
            }
        }
        return result; // ex: 10h => 36 000 valeurs
    }

    // === Calcul solaire simplifié cohérent partout ===
    function getSolarPosition(date, lat, lng) {
        // Simplifié: précision ~quelques degrés, OK pour flux fenêtre
        const rad = Math.PI / 180;
        const day = Math.floor((date - new Date(date.getFullYear(),0,0)) / 86400000);
        const declDeg = -23.44 * Math.cos(rad * (360/365 * (day+10)));
        const decl = declDeg * rad;
        const hour = date.getHours() + date.getMinutes()/60;
        const lstm = 15 * Math.round(lng/15);
        const timeOffset = (lng - lstm) * 4; // minutes
        const solarNoon = 12 - timeOffset/60;
        const hAngle = rad * 15 * (hour - solarNoon);

        const latRad = lat * rad;
        const elev = Math.asin(Math.sin(latRad)*Math.sin(decl) + Math.cos(latRad)*Math.cos(decl)*Math.cos(hAngle));
        // Azim: 0=nord, sens des aiguilles, 180=sud
        const sinAz = -Math.sin(hAngle) * Math.cos(decl) / Math.cos(elev);
        let azim = Math.acos((Math.sin(decl)-Math.sin(elev)*Math.sin(latRad)) / (Math.cos(elev)*Math.cos(latRad)));
        azim = sinAz>0 ? 360-azim*(180/Math.PI): azim*(180/Math.PI);
        return {
            elevation: elev*180/Math.PI, // ° au-dessus horizon
            azimuth: azim
        };
    }

    function calculateAngleOfIncidence(sun, params) {
        // sun: {elevation, azimuth} en degrés
        // params: {orientation, inclinaison}
        const rad = Math.PI/180;
        const sAzi = sun.azimuth * rad;
        const sElv = sun.elevation * rad;
        const wAzi = params.orientation * rad;
        const wIncl = params.inclinaison * rad;
        const cosInc = Math.cos(wIncl)*Math.sin(sElv) + Math.sin(wIncl)*Math.cos(sElv)*Math.cos(sAzi-wAzi);
        return Math.acos(Math.min(Math.max(cosInc,-1),1)) * 180/Math.PI; // clamp cos for sécurité
    }

    function calculateSolarRadiation(date, lat, lng, params) {
        // Simple: pas d'ATM, flux direct sur surface selon incidence (+0 si soleil sous horizon)
        const Gsc = 1000; // W/m² max solstice
        const sun = getSolarPosition(date, lat, lng);
        if (sun.elevation <= 0) return 0;
        const theta = calculateAngleOfIncidence(sun, params);
        return Gsc * Math.max(0, Math.cos(theta*Math.PI/180));
    }

    function generateSolarDataHourly() {
        if (!weatherData) return [];
        const times = weatherData.hourly.time;
        const n = times.length;
        const out = [];
        for (let h=0; h<n; h++) {
            out.push(calculateSolarRadiation(new Date(times[h]), currentLat, currentLng, userParams));
        }
        return out;
    }
    function generateSolarFluxVector() {
        const hr = generateSolarDataHourly();
        solarFluxVector = interpolateHourlyToSeconds(hr);
        return solarFluxVector;
    }
    function generateTempVector() {
        tempVector = interpolateHourlyToSeconds(weatherData.hourly.temperature_2m);
        return tempVector;
    }

    // === Affichage graphique Chart.js (profil flux solaire) ===
    function updateSolarChart() {
        generateSolarFluxVector();
        const data = [];
        for (let i = 0; i < solarFluxVector.length; i += 60) data.push(solarFluxVector[i]);
        const labels = [];
        for (let k = 0; k < data.length; ++k) labels.push((k/60).toFixed(1)); // heure
        if (!myChart) {
            const ctx = document.getElementById('solarChart').getContext('2d');
            myChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: "Flux solaire (W/m²)",
                        data: data,
                        borderColor: "#ff7800",
                        fill: false,
                        pointRadius: 0
                    }]
                },
                options: {
                    scales: {
                        x: { display: true, title: {text: 'Temps (h)', display: true}},
                        y: { beginAtZero: true, title: {text: 'Flux solaire', display: true}}
                    },
                    plugins: {legend: {display: false}},
                    elements: {line:{tension:0}},
                }
            });
        } else {
            myChart.data.labels = labels;
            myChart.data.datasets[0].data = data;
            myChart.update();
        }
    }

    // === Génération vecteurs Python pour copie-coller ===
    function getPythonVector(vector) {
        return "[" + vector.map(v => v.toFixed(2)).join(", ") + "]";
    }

    // === Contrôleur principal ===
    async function controllerWorkflow() {
        // Récup. valeurs UI utilisateurs :
        userParams.orientation = Number(document.getElementById('sliderOrient').value);
        userParams.inclinaison = Number(document.getElementById('sliderInclinaison').value);
        userParams.albedo = Number(document.getElementById('inputAlbedo').value);

        await getWeatherData(currentLat, currentLng);
        generateTempVector();
        generateSolarFluxVector();
        updateSolarChart();

        document.getElementById('python-temperature').value = getPythonVector(tempVector);
        document.getElementById('python-solar').value = getPythonVector(solarFluxVector);
    }

    // === Initialisation UI/handlers ===
    window.onload = function() {
        initMap();
        document.getElementById('searchBtn').onclick = function() {
            const q = document.getElementById('searchInput').value;
            searchAddress(q);
        };
        document.getElementById('runCalcBtn').onclick = controllerWorkflow;
        document.getElementById('sliderOrient').oninput = controllerWorkflow;
        document.getElementById('sliderInclinaison').oninput = controllerWorkflow;
        document.getElementById('inputAlbedo').oninput = controllerWorkflow;
    };
    </script>
</body>
</html>

