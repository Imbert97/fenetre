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
    <button id="setPositionBtn">Définir comme position</button><!-- <== le bouton explicite -->
    <button id="runCalcBtn">Calculer météo + solaire</button>
</div>
<div>
    Orientation (azimut°): <input type="number" id="sliderOrient" min="0" max="360" value="180">
    Inclinaison (°): <input type="number" id="sliderInclinaison" min="0" max="180" value="90">
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
    let tempLat = 46.81, tempLng = -71.21;        // Position courante sur la carte (modifiable)
    let validLat = 46.81, validLng = -71.21;      // Dernière position validée
    let weatherData = null, solarFluxVector = [], tempVector = [];
    let userParams = {
        orientation: 180,
        inclinaison: 90,
        albedo: 0.2,
    };
    let myChart = null;

    // === Carte Leaflet/init ===
    function initMap() {
        map = L.map('map').setView([validLat, validLng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);
        marker = L.marker([validLat, validLng], { draggable: true }).addTo(map);
        marker.on('dragend', function(e) {
            let pos = e.target.getLatLng();
            tempLat = pos.lat;
            tempLng = pos.lng;
            updatePositionDisplay();
        });
        map.on('click', function(e) {
            tempLat = e.latlng.lat;
            tempLng = e.latlng.lng;
            marker.setLatLng([tempLat, tempLng]);
            updatePositionDisplay();
        });
    }

    // === Mise à jour d'info position affichée ===
    function updatePositionDisplay() {
        // Option : afficher la position proposée, non confirmée, par exemple via un label
        // document.getElementById('positionAffichee').textContent = `Position proposée : ${tempLat.toFixed(5)}, ${tempLng.toFixed(5)}`;
    }

    // === Recherche adresse, MAJ du marqueur TEMPORAIRE uniquement ===
    async function searchAddress(query) {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1`;
        const response = await fetch(url);
        const results = await response.json();
        if (results.length > 0) {
            tempLat = parseFloat(results[0].lat);
            tempLng = parseFloat(results[0].lon);
            map.setView([tempLat, tempLng], 13);
            marker.setLatLng([tempLat, tempLng]);
            updatePositionDisplay();
        }
    }

    // === Validation de la position => MAJ coordonnées "validées" et lance calcul ===
    function setPositionAndRun() {
        validLat = tempLat;
        validLng = tempLng;
        document.getElementById('runCalcBtn').textContent = "Calculer météo + solaire"; // reset bouton
        controllerWorkflow();
    }

    // === Open Meteo API ===
    async function getWeatherData(lat, lon) {
        const baseUrl = "https://api.open-meteo.com/v1/forecast";
        const params = `?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,cloudcover,precipitation,pressure_msl,relativehumidity_2m&timezone=auto`;
        const url = baseUrl + params;
        const res = await fetch(url);
        weatherData = await res.json();
    }

    // === Interpolation linéaire ===
    function interpolateHourlyToSeconds(hourlyArr) {
        const result = [];
        for (let h = 0; h < hourlyArr.length - 1; h++) {
            const v1 = hourlyArr[h], v2 = hourlyArr[h + 1];
            for (let s = 0; s < 3600; s++) {
                result.push(v1 * (1 - (s/3600)) + v2 * (s/3600));
            }
        }
        return result;
    }

    // === Calcul solaire : élévation, azimut, incidence, flux ===
    function getSolarPosition(date, lat, lng) {
        const rad = Math.PI/180;
        const day = Math.floor((date - new Date(date.getFullYear(),0,0)) / 86400000);
        const declDeg = -23.44 * Math.cos(rad * (360/365 * (day+10)));
        const decl = declDeg * rad;
        const hour = date.getHours() + date.getMinutes()/60;
        const lstm = 15 * Math.round(lng/15);
        const timeOffset = (lng - lstm) * 4;
        const solarNoon = 12 - timeOffset/60;
        const hAngle = rad * 15 * (hour - solarNoon);

        const latRad = lat * rad;
        const elev = Math.asin(Math.sin(latRad)*Math.sin(decl) + Math.cos(latRad)*Math.cos(decl)*Math.cos(hAngle));
        const sinAz = -Math.sin(hAngle) * Math.cos(decl) / Math.cos(elev);
        let azim = Math.acos((Math.sin(decl)-Math.sin(elev)*Math.sin(latRad)) / (Math.cos(elev)*Math.cos(latRad)));
        azim = sinAz>0 ? 360-azim*(180/Math.PI): azim*(180/Math.PI);
        return { elevation: elev*180/Math.PI, azimuth: azim };
    }
    function calculateAngleOfIncidence(sun, params) {
        const rad = Math.PI/180;
        const sAzi = sun.azimuth * rad, sElv = sun.elevation * rad;
        const wAzi = params.orientation * rad, wIncl = params.inclinaison * rad;
        const cosInc = Math.cos(wIncl)*Math.sin(sElv) + Math.sin(wIncl)*Math.cos(sElv)*Math.cos(sAzi-wAzi);
        return Math.acos(Math.min(Math.max(cosInc,-1),1)) * 180/Math.PI;
    }
    function calculateSolarRadiation(date, lat, lng, params) {
        const Gsc = 1000; // W/m²
        const sun = getSolarPosition(date, lat, lng);
        if (sun.elevation <= 0) return 0;
        const theta = calculateAngleOfIncidence(sun, params);
        return Gsc * Math.max(0, Math.cos(theta*Math.PI/180));
    }

    // === Génération/interpolation flux solaire ===
    function generateSolarDataHourly(lat, lng, params) {
        if (!weatherData) return [];
        const times = weatherData.hourly.time;
        const out = [];
        for (let h=0; h<times.length; h++) {
            out.push(calculateSolarRadiation(new Date(times[h]), lat, lng, params));
        }
        return out;
    }
    function generateSolarFluxVector(lat, lng, params) {
        const hr = generateSolarDataHourly(lat, lng, params);
        solarFluxVector = interpolateHourlyToSeconds(hr);
        return solarFluxVector;
    }
    function generateTempVector() {
        tempVector = interpolateHourlyToSeconds(weatherData.hourly.temperature_2m);
        return tempVector;
    }

    // === Affichage graphique (profil flux solaire) ===
    function updateSolarChart() {
        // downsample 1/min pour le graph
        const data = [];
        for (let i = 0; i < solarFluxVector.length; i += 60) data.push(solarFluxVector[i]);
        const labels = [];
        for (let k = 0; k < data.length; ++k) labels.push((k/60).toFixed(1));
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

    // === Génération vecteurs Python exportables ===
    function getPythonVector(vector) {
        return "[" + vector.map(v => v.toFixed(2)).join(", ") + "]";
    }

    // === Contrôleur principal (EXÉCUTÉ uniquement lors du clic "Définir position") ===
    async function controllerWorkflow() {
        // Récup. valeurs UI utilisateurs :
        userParams.orientation = Number(document.getElementById('sliderOrient').value);
        userParams.inclinaison = Number(document.getElementById('sliderInclinaison').value);
        userParams.albedo = Number(document.getElementById('inputAlbedo').value);
        // Météo + calculs
        document.getElementById('runCalcBtn').textContent = "Chargement ...";
        await getWeatherData(validLat, validLng);
        generateTempVector();
        generateSolarFluxVector(validLat, validLng, userParams);
        updateSolarChart();
        document.getElementById('python-temperature').value = getPythonVector(tempVector);
        document.getElementById('python-solar').value = getPythonVector(solarFluxVector);
        document.getElementById('runCalcBtn').textContent = "Calculer météo + solaire";
    }

    // === Init Handlers ===
    window.onload = function() {
        initMap();
        document.getElementById('searchBtn').onclick = function() {
            const q = document.getElementById('searchInput').value;
            searchAddress(q);
        };
        document.getElementById('setPositionBtn').onclick = setPositionAndRun;
        document.getElementById('runCalcBtn').onclick = controllerWorkflow;
        document.getElementById('sliderOrient').oninput = controllerWorkflow;
        document.getElementById('sliderInclinaison').oninput = controllerWorkflow;
        document.getElementById('inputAlbedo').oninput = controllerWorkflow;
    };
</script>
</body>
</html>


