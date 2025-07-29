const CODE_VERSION = "v1.1.7 test tableau";

/* ========================================\
   VARIABLES GLOBALES
======================================== */
// Initialisation des variables globales
let map, marker;
let lat = 46.8139; // Québec par défaut
let lng = -71.2080; // Québec par défaut
let weatherData = null;
let tempSelectedPosition = null;
let solarChartInstance = null;
let all_saves = []; // Historique des sauvegardes pour le tableau

/* ========================================\
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
    95: "Orage léger",
    96: "Orage avec grêle légère",
    99: "Orage avec grêle forte"
};

/* ========================================\
   FONCTIONS UTILITAIRES (PLACEHOLDERS - REMPLACER AVEC VOTRE CODE EXISTANT)
======================================== */

// Fonction pour récupérer les données météo d'Open-Meteo
async function getWeatherData() {
    // REMPLACER AVEC LE CONTENU DE VOTRE FONCTION getWeatherData()
    // Cette fonction devrait retourner les données météo.
    console.log("Appel de getWeatherData()... (insérer le code réel ici)");
    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m,shortwave_radiation&forecast_days=3&timezone=auto`);
        const data = await response.json();
        weatherData = data; // Mettre à jour la variable globale
        console.log("🔍 Données météo Open-Meteo récupérées:", weatherData);
        return weatherData;
    } catch (error) {
        console.error("Erreur lors de la récupération des données météo:", error);
        return null;
    }
}

// Fonction pour mettre à jour les informations de localisation
function updateLocationInfo(latitude, longitude, locationName = 'Position sur la carte') {
    document.getElementById('currentLat').textContent = latitude.toFixed(4);
    document.getElementById('currentLng').textContent = longitude.toFixed(4);
    // Ajoutez ici la logique pour d'autres affichages de localisation si nécessaire
}

// Fonctions de gestion de la localisation (getCurrentLocation, searchAddress, validatePosition)
function getCurrentLocation() {
    console.log("Appel de getCurrentLocation()... (insérer le code réel ici)");
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            lat = position.coords.latitude;
            lng = position.coords.longitude;
            updateMapAndMarker(lat, lng);
            updateLocationInfo(lat, lng, 'Ma position actuelle');
            document.getElementById('selectedLocationInfo').style.display = 'none';
            document.getElementById('validatePosition').style.display = 'none';
        }, error => {
            console.error("Erreur de géolocalisation:", error);
            alert("Impossible d'obtenir votre position actuelle.");
        });
    } else {
        alert("La géolocalisation n'est pas supportée par ce navigateur.");
    }
}

async function searchAddress() {
    console.log("Appel de searchAddress()... (insérer le code réel ici)");
    const address = document.getElementById('addressSearch').value;
    if (!address) {
        alert("Veuillez entrer une adresse.");
        return;
    }
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=5`);
        const data = await response.json();
        const addressResultsDiv = document.getElementById('addressResults');
        const addressListDiv = document.getElementById('addressList');
        addressListDiv.innerHTML = '';
        if (data.length > 0) {
            data.forEach(result => {
                const li = document.createElement('div');
                li.innerHTML = `<a href="#" data-lat="${result.lat}" data-lon="${result.lon}">${result.display_name}</a>`;
                li.querySelector('a').addEventListener('click', function(e) {
                    e.preventDefault();
                    tempSelectedPosition = {
                        lat: parseFloat(this.dataset.lat),
                        lng: parseFloat(this.dataset.lon),
                        name: this.textContent
                    };
                    updateMapAndMarker(tempSelectedPosition.lat, tempSelectedPosition.lng);
                    document.getElementById('selectedLocationText').textContent = tempSelectedPosition.name;
                    document.getElementById('selectedCoords').textContent = `${tempSelectedPosition.lat.toFixed(4)}°, ${tempSelectedPosition.lng.toFixed(4)}°`;
                    document.getElementById('selectedLocationInfo').style.display = 'block';
                    document.getElementById('validatePosition').style.display = 'block';
                    addressResultsDiv.style.display = 'none'; // Hide results after selection
                });
                addressListDiv.appendChild(li);
            });
            addressResultsDiv.style.display = 'block';
        } else {
            addressListDiv.innerHTML = 'Aucun résultat trouvé.';
            addressResultsDiv.style.display = 'block';
        }
    } catch (error) {
        console.error("Erreur lors de la recherche d'adresse:", error);
        alert("Erreur lors de la recherche d'adresse.");
    }
}

function validatePosition() {
    console.log("Appel de validatePosition()... (insérer le code réel ici)");
    if (tempSelectedPosition) {
        lat = tempSelectedPosition.lat;
        lng = tempSelectedPosition.lng;
        updateLocationInfo(lat, lng, tempSelectedPosition.name);
        document.getElementById('selectedLocationInfo').style.display = 'none';
        document.getElementById('validatePosition').style.display = 'none';
        alert(`Position définie sur: ${tempSelectedPosition.name}`);
        tempSelectedPosition = null; // Reset temp selected position
    }
}

// Fonctions de gestion de la météo (getWeather)
async function getWeather() {
    console.log("Appel de getWeather()... (insérer le code réel ici)");
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.style.display = 'block';
    try {
        const data = await getWeatherData();
        if (data && data.hourly) {
            displayHourlyForecast(data);
        } else {
            document.getElementById('hourlyForecast').innerHTML = '<p class="error">Impossible de récupérer les prévisions météo pour cette position.</p>';
        }
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

// Fonction pour afficher les prévisions horaires
function displayHourlyForecast(data) {
    console.log("Appel de displayHourlyForecast()... (insérer le code réel ici)");
    const hourlyForecastDiv = document.getElementById('hourlyForecast');
    if (!hourlyForecastDiv) return;

    hourlyForecastDiv.innerHTML = '<h3>Prévisions pour les 10 prochaines heures</h3><div class="hourly-cards">';

    const now = new Date();
    const currentHour = now.getHours();

    for (let i = 0; i < 10 && (currentHour + i) < data.hourly.time.length; i++) {
        const index = data.hourly.time.findIndex(timeStr => {
            const date = new Date(timeStr);
            return date.getHours() === (currentHour + i) % 24 && date.getDate() === now.getDate();
        });

        if (index === -1) continue; // Skip if hour not found (e.g., beyond forecast_days)

        const time = new Date(data.hourly.time[index]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const temperature = data.hourly.temperature_2m[index];
        const apparentTemperature = data.hourly.apparent_temperature[index];
        const weatherCode = data.hourly.weather_code[index];
        const weatherDescription = weatherCodes[weatherCode] || "Inconnu";
        const precipitationProbability = data.hourly.precipitation_probability[index];
        const windSpeed = data.hourly.wind_speed_10m[index];

        const card = document.createElement('div');
        card.className = 'hourly-card';
        card.innerHTML = `
            <strong>${time}</strong><br>
            Temp: ${temperature}°C (${apparentTemperature}°C ress.)<br>
            ${weatherDescription}<br>
            Prob. Préc: ${precipitationProbability}%<br>
            Vent: ${windSpeed} km/h
        `;
        hourlyForecastDiv.querySelector('.hourly-cards').appendChild(card);
    }
    hourlyForecastDiv.innerHTML += '</div>';
}


// Fonctions de calcul solaire (calculateSolar, etc.)
async function calculateSolar() {
    console.log("Appel de calculateSolar()... (insérer le code réel ici)");
    const data = await getWeatherData(); // Récupère les dernières données météo
    if (!data || !data.hourly) {
        document.getElementById('solarResults').innerHTML = '<p class="error">Impossible de calculer le rayonnement solaire sans données météo.</p>';
        return;
    }

    const wallOrientation = document.getElementById('wallOrientation').value;
    let wallAzimuth;

    if (wallOrientation === 'custom') {
        const customAzimuth = parseInt(document.getElementById('customAzimuth').value);
        if (isNaN(customAzimuth) || customAzimuth < 0 || customAzimuth > 360) {
            alert("Veuillez entrer un azimuth personnalisé valide (0-360°).");
            return;
        }
        wallAzimuth = customAzimuth;
    } else {
        const orientationMap = {
            'nord': 0, 'nord-est': 45, 'est': 90, 'sud-est': 135,
            'sud': 180, 'sud-ouest': 225, 'ouest': 270, 'nord-ouest': 315
        };
        wallAzimuth = orientationMap[wallOrientation];
    }

    const wallTilt = parseInt(document.getElementById('wallTilt').value);
    const albedo = parseFloat(document.getElementById('albedo').value);
    const windowHeight = parseFloat(document.getElementById('windowHeight').value);

    // Initialisation du tableau des heures et des flux solaires
    const hours = [];
    const directIrradiance = [];
    const diffuseIrradiance = [];
    const groundReflectedIrradiance = [];
    const totalIrradiance = [];
    const outdoorTemperatures = [];
    const curtainRecommendations = [];

    const now = new Date();
    const currentHourIndex = data.hourly.time.findIndex(timeStr => {
        const date = new Date(timeStr);
        return date.getHours() === now.getHours() && date.getDate() === now.getDate();
    });

    if (currentHourIndex === -1) {
        document.getElementById('solarResults').innerHTML = '<p class="error">Heure actuelle non trouvée dans les prévisions.</p>';
        return;
    }

    // Calcul pour les 10 prochaines heures
    for (let i = 0; i < 10; i++) {
        const hourlyIndex = currentHourIndex + i;
        if (hourlyIndex >= data.hourly.time.length) break;

        const time = new Date(data.hourly.time[hourlyIndex]);
        const shortwaveRadiation = data.hourly.shortwave_radiation[hourlyIndex]; // Rayonnement solaire horizontal global (Wm-2)
        const outdoorTemp = data.hourly.temperature_2m[hourlyIndex];

        // Simplification: estimer le rayonnement direct et diffus
        // Ceci est une simplification. Pour une précision élevée, des bibliothèques plus complexes sont nécessaires.
        // Ici, on va juste prendre le rayonnement global et l'utiliser comme base.
        // Un rayonnement solaire sur une surface inclinée (mur/fenêtre) est plus complexe.
        // Pour cet exemple, nous allons considérer shortwave_radiation comme l'irradiation globale horizontale
        // et estimer une part directe et diffuse.

        // Estimation très simplifiée pour le besoin :
        // Si le soleil est haut (midday), plus de direct. Si bas ou nuageux, plus de diffus.
        const cosZenith = Math.cos(solarPosition.zenithAngle * Math.PI / 180);
        let estimatedDirect = shortwaveRadiation * Math.max(0, cosZenith);
        let estimatedDiffuse = shortwaveRadiation * (1 - Math.max(0, cosZenith)); // Le reste est diffus

        // Composante réfléchie du sol (pour une surface verticale)
        const reflected = shortwaveRadiation * albedo * (1 - Math.cos(wallTilt * Math.PI / 180)) / 2; // Simplifié

        // Rayonnement sur la surface inclinée
        // Ceci est une formule très simplifiée et ne tient pas compte de l'angle du mur par rapport au soleil.
        // Il faudrait utiliser des librairies comme pvlib-js pour un calcul précis.
        // Pour la démonstration, on va simuler un rayonnement en fonction de l'heure.
        let totalIncidentIrradiance = 0;

        // Calculer la position du soleil
        // Note: Ces fonctions (getSolarPosition, calculateAngleOfIncidence) ne sont pas incluses
        // dans le script fourni et devraient être implémentées ou importées d'une bibliothèque
        // comme 'suncalc' ou des algorithmes astronomiques.
        // Pour la démonstration, je vais simuler un calcul simple.
        const currentLocalTime = time.getHours() + time.getMinutes() / 60; // Heure locale décimale
        let irradianceFactor = 0; // Facteur d'irradiation basé sur l'heure
        if (currentLocalTime >= 6 && currentLocalTime <= 18) { // Heures de jour
             // Simple sinus pour simuler le pic à midi
            irradianceFactor = Math.sin((currentLocalTime - 6) * Math.PI / 12);
        }

        const simulatedTotalSolarIrradiance = shortwaveRadiation * irradianceFactor; // Wm-2

        // Une estimation très grossière de la répartition
        const directPart = simulatedTotalSolarIrradiance * 0.7; // 70% direct
        const diffusePart = simulatedTotalSolarIrradiance * 0.2; // 20% diffus
        const groundReflectedPart = simulatedTotalSolarIrradiance * albedo * 0.1; // 10% réfléchi

        totalIncidentIrradiance = directPart + diffusePart + groundReflectedPart;


        hours.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        directIrradiance.push(directPart.toFixed(1));
        diffuseIrradiance.push(diffusePart.toFixed(1));
        groundReflectedIrradiance.push(groundReflectedPart.toFixed(1));
        totalIrradiance.push(totalIncidentIrradiance.toFixed(1));
        outdoorTemperatures.push(outdoorTemp.toFixed(1));

        // Recommandation pour les rideaux
        // Logique simplifiée: si le rayonnement est élevé et la température extérieure est élevée, fermer.
        // Ou si la température extérieure est très basse et qu'on veut le gain solaire, ouvrir.
        let recommendation = "Neutre";
        if (totalIncidentIrradiance > 200 && outdoorTemp > 25) { // Forte chaleur et soleil
            recommendation = "Fermer les rideaux (chaleur)";
        } else if (totalIncidentIrradiance > 150 && outdoorTemp < 5) { // Froid mais ensoleillé (gain passif)
            recommendation = "Ouvrir les rideaux (gain solaire)";
        }
        curtainRecommendations.push(recommendation);
    }

    // Affichage des résultats dans le HTML
    const solarResultsDiv = document.getElementById('solarResults');
    solarResultsDiv.innerHTML = `
        <h3>Résultats de Rayonnement Solaire</h3>
        <p>Calculs pour les 10 prochaines heures en ${wallOrientation} (${wallAzimuth}°) avec inclinaison ${wallTilt}° et albédo ${albedo}.</p>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Heure</th>
                        <th>Temp Ext (°C)</th>
                        <th>Ray. Direct (W/m²)</th>
                        <th>Ray. Diffus (W/m²)</th>
                        <th>Ray. Réf. Sol (W/m²)</th>
                        <th>Ray. Total (W/m²)</th>
                        <th>Recommandation Rideaux</th>
                    </tr>
                </thead>
                <tbody>
                    ${hours.map((h, idx) => `
                        <tr>
                            <td>${h}</td>
                            <td>${outdoorTemperatures[idx]}</td>
                            <td>${directIrradiance[idx]}</td>
                            <td>${diffuseIrradiance[idx]}</td>
                            <td>${groundReflectedIrradiance[idx]}</td>
                            <td>${totalIrradiance[idx]}</td>
                            <td>${curtainRecommendations[idx]}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    // Mise à jour du graphique Chart.js
    updateSolarIrradianceChart(hours, totalIrradiance, outdoorTemperatures);
}


// Fonction pour basculer l'affichage de l'azimuth personnalisé
function toggleCustomAzimuth() {
    console.log("Appel de toggleCustomAzimuth()... (insérer le code réel ici)");
    const wallOrientation = document.getElementById('wallOrientation').value;
    const customAzimuthDiv = document.getElementById('customAzimuthDiv');
    if (customAzimuthDiv) {
        customAzimuthDiv.style.display = (wallOrientation === 'custom') ? 'block' : 'none';
    }
}

// Fonction pour mettre à jour la carte et le marqueur
function updateMapAndMarker(latitude, longitude) {
    if (map && marker) {
        map.setView([latitude, longitude], map.getZoom());
        marker.setLatLng([latitude, longitude]);
    }
}

// Fonction pour gérer les clics sur la carte
function onMapClick(e) {
    tempSelectedPosition = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        name: 'Position cliquée sur la carte'
    };
    updateMapAndMarker(tempSelectedPosition.lat, tempSelectedPosition.lng);

    document.getElementById('selectedLocationText').textContent = tempSelectedPosition.name;
    document.getElementById('selectedCoords').textContent = `${tempSelectedPosition.lat.toFixed(4)}°, ${tempSelectedPosition.lng.toFixed(4)}°`;
    document.getElementById('selectedLocationInfo').style.display = 'block';
    document.getElementById('validatePosition').style.display = 'block';
    document.getElementById('addressResults').style.display = 'none'; // Cacher les résultats de recherche d'adresse
}

// Fonction pour mettre à jour le graphique de rayonnement solaire
function updateSolarIrradianceChart(labels, solarData, tempData) {
    const ctx = document.getElementById('solarIrradianceChart').getContext('2d');

    if (solarChartInstance) {
        solarChartInstance.destroy(); // Détruire l'instance précédente si elle existe
    }

    solarChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Rayonnement Solaire Total (W/m²)',
                data: solarData,
                borderColor: 'rgb(255, 159, 64)',
                backgroundColor: 'rgba(255, 159, 64, 0.2)',
                yAxisID: 'y',
                tension: 0.1,
                fill: true
            },
            {
                label: 'Température Extérieure (°C)',
                data: tempData,
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                yAxisID: 'y1',
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Rayonnement Solaire et Température pour les 10 Prochaines Heures',
                    color: '#fff' // Couleur du titre
                },
                legend: {
                    labels: {
                        color: '#fff' // Couleur des étiquettes de légende
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Heure',
                        color: '#fff' // Couleur du titre de l'axe X
                    },
                    ticks: {
                        color: '#fff' // Couleur des graduations de l'axe X
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)' // Couleur des lignes de grille de l'axe X
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Rayonnement Solaire (W/m²)',
                        color: 'rgb(255, 159, 64)' // Couleur du titre de l'axe Y (solaire)
                    },
                    ticks: {
                        color: 'rgb(255, 159, 64)' // Couleur des graduations de l'axe Y (solaire)
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)' // Couleur des lignes de grille de l'axe Y
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Température Extérieure (°C)',
                        color: 'rgb(54, 162, 235)' // Couleur du titre de l'axe Y1 (température)
                    },
                    grid: {
                        drawOnChartArea: false, // Ne pas dessiner les lignes de grille pour cet axe
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgb(54, 162, 235)' // Couleur des graduations de l'axe Y1 (température)
                    }
                }
            }
        }
    });
}


// Fonction pour ajouter une sauvegarde à l'historique et mettre à jour le tableau
function addToSauvegardes(dataToSave) {
    if (all_saves.length > 0) {
        let last = all_saves[all_saves.length - 1];
        let lastMinute = (new Date(last.date)).toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
        let newMinute = (new Date(dataToSave.date)).toISOString().slice(0, 16);
        if (lastMinute === newMinute) return; // Ne pas ajouter de doublon pour la même minute
    }
    all_saves.push(dataToSave);
    localStorage.setItem('weather_forecast_history', JSON.stringify(all_saves));
    updateSauvegardesTable();
    const sauvegardesTableInfo = document.getElementById('sauvegardesTableInfo');
    if (sauvegardesTableInfo) { // Vérification de l'existence de l'élément
        sauvegardesTableInfo.textContent = `Dernière sauvegarde : ${new Date(dataToSave.date).toLocaleTimeString()}`;
    }
}

// Fonction pour charger les sauvegardes depuis le stockage local
function loadSavesFromStorage() {
    const savedData = localStorage.getItem('weather_forecast_history');
    if (savedData) {
        all_saves = JSON.parse(savedData);
    }
}

// Fonction pour mettre à jour le tableau des sauvegardes
function updateSauvegardesTable() {
    loadSavesFromStorage(); // Recharger au cas où il y a eu des modifications
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    const sauvegardesTableInfo = document.getElementById('sauvegardesTableInfo');

    if (!tableHeader || !tableBody) {
        console.error("Éléments du tableau (tableHeader ou tableBody) non trouvés.");
        return;
    }

    // Effacer les contenus précédents
    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';

    if (all_saves.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="22">Aucune sauvegarde enregistrée.</td></tr>'; // Colspan ajusté au nombre maximum de colonnes (Date + 10T + 10Flux)
        if (sauvegardesTableInfo) sauvegardesTableInfo.textContent = "Aucune sauvegarde.";
        return;
    }

    // Créer les en-têtes du tableau
    let headerRow = '<th>Date</th>';
    for (let i = 1; i <= 10; i++) {
        headerRow += `<th>T°+${i}h</th>`;
    }
    for (let i = 1; i <= 10; i++) {
        headerRow += `<th>Flux+${i}h</th>`;
    }
    tableHeader.innerHTML = headerRow;

    // Remplir le corps du tableau
    all_saves.forEach(save => {
        let row = `<tr><td>${new Date(save.date).toLocaleString()}</td>`;
        save.temperatures.forEach(temp => {
            row += `<td>${temp.toFixed(1)}</td>`;
        });
        save.flux_solaires.forEach(flux => {
            row += `<td>${flux.toFixed(1)}</td>`;
        });
        row += '</tr>';
        tableBody.innerHTML += row;
    });

    if (sauvegardesTableInfo) {
        sauvegardesTableInfo.textContent = `Dernière sauvegarde : ${new Date(all_saves[all_saves.length - 1].date).toLocaleTimeString()}`;
    }
}


// Fonction de récupération automatique des prévisions et sauvegarde
async function retrieveAndSaveForecast() {
    try {
        const data = await getWeatherData(); // Récupère les dernières données météo
        if (!data || !data.hourly) {
            console.error("❌ Données météo absentes pour la sauvegarde automatique.");
            return;
        }

        // Simule les calculs de température et de flux (comme dans calculateSolar)
        // Vous devrez adapter cette partie pour correspondre exactement à vos besoins de sauvegarde
        // Basé sur le code HTML fourni, il semble que 'flux_solaires' provienne du calcul solaire.
        // Si vous voulez sauvegarder des données de rayonnement, vous devez les calculer ici.
        // Pour cet exemple, je vais juste extraire les températures et simuler des flux simples.

        const temperatures = [];
        const shortwaveRadiations = []; // Assuming this is 'flux' for your table
        const now = new Date();
        const currentHourIndex = data.hourly.time.findIndex(timeStr => {
            const date = new Date(timeStr);
            return date.getHours() === now.getHours() && date.getDate() === now.getDate();
        });

        if (currentHourIndex === -1) {
            console.error("Heure actuelle non trouvée dans les prévisions pour la sauvegarde.");
            return;
        }

        for (let i = 0; i < 10; i++) { // Pour les 10 prochaines heures
            const hourlyIndex = currentHourIndex + i;
            if (hourlyIndex >= data.hourly.time.length) break;

            temperatures.push(data.hourly.temperature_2m[hourlyIndex]);
            // Pour flux_solaires, vous devrez utiliser une logique de calcul similaire à celle de calculateSolar,
            // ou extraire une donnée pertinente si elle existe directement dans weatherData.
            // Ici, je vais utiliser shortwave_radiation comme un proxy très simple.
            shortwaveRadiations.push(data.hourly.shortwave_radiation[hourlyIndex] || 0); // Utiliser 0 si non disponible
        }

        const dataToSave = {
            date: now.toISOString(),
            temperatures: temperatures,
            flux_solaires: shortwaveRadiations // Assurez-vous que c'est ce que vous voulez sauvegarder
        };

        addToSauvegardes(dataToSave);
        console.log("✅ Données météo sauvegardées automatiquement.");
    } catch (error) {
        console.error("Erreur de récupération automatique:", error);
    }
}


/* ========================================\
   CODE PRINCIPAL - Exécuté lorsque le DOM est prêt
======================================== */
document.addEventListener('DOMContentLoaded', function() {
    // Initialisation du numéro de version
    const versionNumberElement = document.getElementById('version-number');
    if (versionNumberElement && typeof CODE_VERSION !== 'undefined') {
        versionNumberElement.textContent = CODE_VERSION;
    }
    console.log(`🚀 Initialisation de l'application avec Open-Meteo (${typeof CODE_VERSION !== 'undefined' ? CODE_VERSION : 'version non définie'})...`);

    // Charge les sauvegardes existantes et met à jour le tableau au chargement de la page
    updateSauvegardesTable();
    console.log("✅ Application initialisée avec succès !");

    /* ========================================\
       Écouteurs d'événements pour les boutons et les interactions
       (Tous les appels getElementById sont maintenant sécurisés dans DOMContentLoaded)
    ======================================== */

    // Section Localisation
    const getCurrentLocationBtn = document.getElementById('getCurrentLocation');
    if (getCurrentLocationBtn) {
        getCurrentLocationBtn.addEventListener('click', getCurrentLocation);
    }

    const manualLatInput = document.getElementById('manualLat');
    const manualLngInput = document.getElementById('manualLng');
    const currentLatSpan = document.getElementById('currentLat');
    const currentLngSpan = document.getElementById('currentLng');

    // Mettre à jour les champs de saisie manuelle avec la position actuelle affichée
    if (manualLatInput && currentLatSpan) {
        manualLatInput.value = currentLatSpan.textContent;
    }
    if (manualLngInput && currentLngSpan) {
        manualLngInput.value = currentLngSpan.textContent;
    }

    const searchAddressBtn = document.getElementById('searchAddress');
    if (searchAddressBtn) {
        searchAddressBtn.addEventListener('click', searchAddress);
    }

    const validatePositionBtn = document.getElementById('validatePosition');
    if (validatePositionBtn) {
        validatePositionBtn.addEventListener('click', validatePosition);
    }

    // Section Météo
    const getWeatherBtn = document.getElementById('getWeather');
    if (getWeatherBtn) {
        getWeatherBtn.addEventListener('click', getWeather);
    }

    // Section Calcul Solaire
    const calculateSolarBtn = document.getElementById('calculateSolar');
    if (calculateSolarBtn) {
        calculateSolarBtn.addEventListener('click', calculateSolar);
    }

    const wallOrientationSelect = document.getElementById('wallOrientation');
    if (wallOrientationSelect) {
        wallOrientationSelect.addEventListener('change', toggleCustomAzimuth);
    }
    // Appel initial pour cacher/afficher l'azimuth personnalisé si 'custom' est déjà sélectionné au chargement
    toggleCustomAzimuth();


    // Bouton "Copier tableau pour Excel"
    const copyTableBtn = document.getElementById('copyTableBtn');
    if (copyTableBtn) {
        copyTableBtn.addEventListener('click', function() {
            if (all_saves.length === 0) {
                alert("Aucune donnée à copier !");
                return;
            }
            let csv = [];
            // titres
            let titles = ['Date'];
            for (let i = 1; i <= 10; i++) titles.push("T°+" + i + "h");
            for (let i = 1; i <= 10; i++) titles.push("Flux+" + i + "h");
            csv.push(titles.join("\t"));
            // lignes
            all_saves.forEach(save => {
                let line = [new Date(save.date).toLocaleString()];
                // Assurez-vous que save.temperatures et save.flux_solaires existent et sont des tableaux
                line = line.concat((save.temperatures || []).map(t => t.toFixed(1)), (save.flux_solaires || []).map(f => f.toFixed(1)));
                csv.push(line.join("\t"));
            });
            navigator.clipboard.writeText(csv.join("\n"))
                .then(() => alert("Tableau copié dans le presse-papiers !"))
                .catch(err => console.error('Erreur lors de la copie du tableau:', err));
        });
    }

    // Bouton "Activer récupération et sauvegarde automatique"
    const autoRetrieveBtn = document.getElementById('autoRetrieveBtn');
    if (autoRetrieveBtn) {
        autoRetrieveBtn.addEventListener('click', function() {
            retrieveAndSaveForecast();
            // Lancement de la récupération automatique toutes les heures (60 minutes * 60 secondes * 1000 ms)
            setInterval(retrieveAndSaveForecast, 60 * 60 * 1000);
            alert("🌡️ Lancement de la récupération automatique (prévisions et sauvegarde chaque heure jusqu'à 20h)");
        });
    }

    // Initialisation de la carte Leaflet
    const mapElement = document.getElementById('map');
    if (mapElement) {
        // Initialiser `map` et `marker` une seule fois si l'élément map existe
        if (!map) { // Vérifier si la carte n'a pas déjà été initialisée
            map = L.map('map').setView([lat, lng], 10);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            marker = L.marker([lat, lng]).addTo(map);

            // Gérer les clics sur la carte pour sélectionner une position
            if (typeof onMapClick === 'function') {
                map.on('click', onMapClick);
            } else {
                console.warn("La fonction 'onMapClick' n'est pas définie. Le clic sur la carte ne fonctionnera pas.");
            }
        }
    } else {
        console.warn("L'élément avec l'ID 'map' n'a pas été trouvé. La carte Leaflet ne sera pas initialisée.");
    }
});



