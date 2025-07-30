const CODE_VERSION = "v1.2.1";

/* =========================================
   VARIABLES GLOBALES
======================================== */
let map;
let marker;
let lat = 46.8139; // Latitude par défaut (Québec City)
let lng = -71.2080; // Longitude par défaut (Québec City)
let weatherData = null; // Pour stocker les données météo de l'API
let solarIrradianceChart; // Pour l'instance du graphique Chart.js

/* =========================================
   VARIABLES GLOBALES POUR RÉCUPÉRATION TEMPS RÉEL
======================================== */
let collectedTemperatureVector = [];
let collectedSolarFluxVector = [];
let recoveryIntervalId = null;
let recoveryStartTime = null; // Date object when recovery starts
let recoveryEndTime = null;   // Date object 10 hours after recoveryStartTime
let currentRecoveryDuration = 0; // Duration in minutes since recovery started
const TOTAL_RECOVERY_MINUTES = 10 * 60; // 10 hours * 60 minutes/hour

/* =========================================
   ÉLÉMENTS DU DOM
======================================== */
const mapDiv = document.getElementById('map');
const getUserLocationBtn = document.getElementById('getUserLocationBtn');
const latInput = document.getElementById('latInput');
const lngInput = document.getElementById('lngInput');
const validatePositionBtn = document.getElementById('validatePositionBtn');
const addressSearchInput = document.getElementById('addressSearchInput');
const searchAddressBtn = document.getElementById('searchAddressBtn');
const currentCoordinatesDisplay = document.getElementById('currentCoordinates');
const hourlyForecastDiv = document.getElementById('hourlyForecast');
const calculateSolarBtn = document.getElementById('calculateSolarBtn');
const solarCalcResultDiv = document.getElementById('solar-calc-result');
const directIrradiationSpan = document.getElementById('directIrradiation');
const diffuseIrradiationSpan = document.getElementById('diffuseIrradiation');
const reflectedIrradiationSpan = document.getElementById('reflectedIrradiation');
const totalSolarIrradiationSpan = document.getElementById('totalSolarIrradiation');
const wallOrientationSelect = document.getElementById('wallOrientationSelect');
const customAzimuthInput = document.getElementById('customAzimuthInput');
const wallTiltInput = document.getElementById('wallTiltInput');
const groundAlbedoInput = document.getElementById('groundAlbedoInput');
const windowHeightInput = document.getElementById('windowHeightInput');
const loadingOverlay = document.getElementById('loadingOverlay');
const statusMessageDiv = document.getElementById('statusMessage');

// Éléments du DOM pour la récupération en temps réel
const startRecoveryBtn = document.getElementById('startRecoveryBtn');
const stopRecoveryBtn = document.getElementById('stopRecoveryBtn');
const recoveryProgressBar = document.getElementById('recoveryProgressBar');
const recoveryProgressText = document.getElementById('recoveryProgressText');
const nextUpdateTimeDisplay = document.getElementById('nextUpdateTime');
const recoveryStatusDisplay = document.getElementById('recoveryStatus');
const copyCollectedVectorsBtn = document.getElementById('copyCollectedVectorsBtn');
const recoveryProgressContainer = document.querySelector('.progress-container'); // Select the container


const generateTempVectorBtn = document.getElementById('generateTempVectorBtn');
const tempVectorOutput = document.getElementById('tempVectorOutput');
const generateSolarFluxVectorBtn = document.getElementById('generateSolarFluxVectorBtn');
const solarFluxVectorOutput = document.getElementById('solarFluxVectorOutput');


/* =========================================
   FONCTIONS UTILITAIRES
======================================== */

/**
 * Convertit les degrés en radians.
 * @param {number} degrees - Angle en degrés.
 * @returns {number} Angle en radians.
 */
function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Convertit les radians en degrés.
 * @param {number} radians - Angle en radians.
 * @returns {number} Angle en degrés.
 */
function radToDeg(radians) {
    return radians * (180 / Math.PI);
}

// Fonctions trigonométriques avec entrée/sortie en degrés
function sind(angle) { return Math.sin(degToRad(angle)); }
function cosd(angle) { return Math.cos(degToRad(angle)); }
function tand(angle) { return Math.tan(degToRad(angle)); }
function asind(value) { return radToDeg(Math.asin(value)); }
function acosd(value) { return radToDeg(Math.acos(value)); }
function atan2d(y, x) { return radToDeg(Math.atan2(y, x)); }


/**
 * Calcule le jour de l'année (1-366) pour une date donnée.
 * @param {Date} date - L'objet Date.
 * @returns {number} Le jour de l'année.
 */
function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

/**
 * Calcule l'angle zénithal solaire.
 * Basé sur des formules simplifiées pour des latitudes non extrêmes.
 * @param {number} dayOfYear - Jour de l'année (1-366).
 * @param {number} latitude - Latitude du lieu.
 * @param {number} longitude - Longitude du lieu.
 * @param {number} localTimeHourFloat - Heure locale en flottant (ex: 14.5 pour 14h30).
 * @returns {number} Angle zénithal solaire en degrés.
 */
function getSolarZenithAngle(dayOfYear, latitude, longitude, localTimeHourFloat) {
    const B = (360 / 365) * (dayOfYear - 81);
    const EoT = 9.87 * sind(2 * B) - 7.53 * cosd(B) - 1.5 * sind(B); // Équation du temps en minutes
    
    // CORRECTION: Utiliser l'heure de l'API pour le décalage UTC
    const stdMeridian = Math.round(longitude / 15) * 15; // Méridien standard du fuseau horaire

    // Heure solaire vraie (TST)
    // localTimeHourFloat est déjà en heure locale du fuseau horaire de l'API
    const LSTM = stdMeridian / 15; // Longitude standard du méridien
    const TC = 4 * (longitude - LSTM) + EoT; // Correction du temps en minutes
    const TST = localTimeHourFloat + (TC / 60); // Heure solaire vraie en heures flottantes

    const H = 15 * (TST - 12); // Angle horaire en degrés

    const declination = 23.45 * sind(360 * (284 + dayOfYear) / 365); // Déclinaison solaire

    const sinAlphaS = sind(latitude) * sind(declination) + cosd(latitude) * cosd(declination) * cosd(H);
    let solarElevation = asind(sinAlphaS); // Angle d'élévation solaire

    // Si l'élévation est négative (soleil sous l'horizon), le zénith est 90 degrés ou plus.
    // L'angle zénithal est 90 - élévation
    let zenithAngle = 90 - solarElevation;

    // Assurer que le zénith ne dépasse pas 180 pour des calculs ultérieurs
    if (zenithAngle > 180) zenithAngle = 180;
    if (zenithAngle < 0) zenithAngle = 0; // Should not happen if elevation is capped at 90

    return zenithAngle;
}

/**
 * Calcule l'angle azimutal solaire.
 * @param {number} dayOfYear - Jour de l'année (1-366).
 * @param {number} latitude - Latitude du lieu.
 * @param {number} longitude - Longitude du lieu.
 * @param {number} localTimeHourFloat - Heure locale en flottant.
 * @returns {number} Angle azimutal solaire en degrés (0-360, Nord=0, Est=90, Sud=180, Ouest=270).
 */
function getSolarAzimuthAngle(dayOfYear, latitude, longitude, localTimeHourFloat) {
    const B = (360 / 365) * (dayOfYear - 81);
    const EoT = 9.87 * sind(2 * B) - 7.53 * cosd(B) - 1.5 * sind(B);
    const stdMeridian = Math.round(longitude / 15) * 15;
    const LSTM = stdMeridian / 15;
    const TC = 4 * (longitude - LSTM) + EoT;
    const TST = localTimeHourFloat + (TC / 60);
    const H = 15 * (TST - 12); // Angle horaire

    const declination = 23.45 * sind(360 * (284 + dayOfYear) / 365);

    let solarElevation = asind(sind(latitude) * sind(declination) + cosd(latitude) * cosd(declination) * cosd(H));

    let azimuthAngle;
    const cosAzimuth = (sind(declination) * cosd(latitude) - cosd(declination) * sind(latitude) * cosd(H)) / cosd(solarElevation);

    // Éviter les erreurs de flottant pour acosd
    let valForAcos = Math.max(-1, Math.min(1, cosAzimuth));
    azimuthAngle = acosd(valForAcos);

    // Corriger l'azimut en fonction de l'angle horaire
    if (H > 0) { // Après midi solaire (Ouest)
        azimuthAngle = 360 - azimuthAngle;
    }

    // Normaliser l'azimut entre 0 et 360
    azimuthAngle = (azimuthAngle + 360) % 360;

    return azimuthAngle;
}


/**
 * Calcule l'angle d'incidence du rayonnement solaire sur une surface.
 * @param {number} solarZenith - Angle zénithal solaire en degrés.
 * @param {number} solarAzimuth - Angle azimutal solaire en degrés.
 * @param {number} wallTilt - Inclinaison de la paroi par rapport à l'horizontale en degrés (0=plat, 90=vertical).
 * @param {number} wallAzimuth - Azimut de la normale à la paroi en degrés (0=Nord, 90=Est, 180=Sud, 270=Ouest).
 * @returns {number} Angle d'incidence en degrés.
 */
function calculateIncidenceAngle(solarZenith, solarAzimuth, wallTilt, wallAzimuth) {
    const i = acosd(
        cosd(solarZenith) * cosd(wallTilt) +
        sind(solarZenith) * sind(wallTilt) * cosd(solarAzimuth - wallAzimuth)
    );
    return i;
}

/**
 * Affiche un message de statut temporaire à l'utilisateur.
 * @param {string} message - Le message à afficher.
 * @param {string} type - Le type de message ('info', 'success', 'error', 'warning').
 */
function showStatus(message, type = 'info') {
    statusMessageDiv.textContent = message;
    statusMessageDiv.className = `status-message ${type}`; // Réinitialise et ajoute la classe
    statusMessageDiv.style.display = 'block';
    statusMessageDiv.style.opacity = 1;

    setTimeout(() => {
        statusMessageDiv.style.opacity = 0;
        statusMessageDiv.addEventListener('transitionend', function handler() {
            statusMessageDiv.style.display = 'none';
            statusMessageDiv.removeEventListener('transitionend', handler);
        });
    }, 4000); // Le message disparaît après 4 secondes
}


/* =========================================
   INITIALISATION DE LA CARTE (LEAFLET)
======================================== */
function initMap() {
    map = L.map('map').setView([lat, lng], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    marker = L.marker([lat, lng]).addTo(map)
        .bindPopup('Position sélectionnée')
        .openPopup();

    updateCoordinatesDisplay();

    // Gestionnaire de clic sur la carte
    map.on('click', function(e) {
        lat = e.latlng.lat;
        lng = e.latlng.lng;
        marker.setLatLng([lat, lng]);
        updateInputsAndDisplay();
        showStatus(`Position mise à jour à Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`, 'info');
    });
}

/**
 * Met à jour les champs de saisie et l'affichage des coordonnées.
 */
function updateInputsAndDisplay() {
    latInput.value = lat.toFixed(4);
    lngInput.value = lng.toFixed(4);
    updateCoordinatesDisplay();
}

/**
 * Met à jour l'affichage des coordonnées actuelles.
 */
function updateCoordinatesDisplay() {
    currentCoordinatesDisplay.textContent = `Coordonnées actuelles: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

/* =========================================
   GÉOLOCALISATION
======================================== */
function getUserLocation() {
    showLoading();
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                lat = position.coords.latitude;
                lng = position.coords.longitude;
                map.setView([lat, lng], 13);
                marker.setLatLng([lat, lng]);
                updateInputsAndDisplay();
                hideLoading();
                showStatus('Position actuelle récupérée avec succès !', 'success');
                getWeatherData(lat, lng); // Récupérer les données météo pour la nouvelle position
            },
            (error) => {
                hideLoading();
                showStatus(`Erreur de géolocalisation: ${error.message}. Utilisation de la position par défaut.`, 'error');
                console.error("Erreur de géolocalisation:", error);
                getWeatherData(lat, lng); // Utiliser la position par défaut si échec
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
        hideLoading();
        showStatus('La géolocalisation n\'est pas supportée par votre navigateur.', 'error');
        getWeatherData(lat, lng); // Utiliser la position par défaut si non supporté
    }
}

/* =========================================
   RECHERCHE D'ADRESSE (NOMINATIM)
======================================== */
async function searchAddress() {
    const address = addressSearchInput.value;
    if (!address) {
        showStatus('Veuillez entrer une adresse.', 'warning');
        return;
    }

    showLoading();
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
        const data = await response.json();

        if (data && data.length > 0) {
            lat = parseFloat(data[0].lat);
            lng = parseFloat(data[0].lon);
            map.setView([lat, lng], 13);
            marker.setLatLng([lat, lng]);
            updateInputsAndDisplay();
            hideLoading();
            showStatus(`Adresse trouvée: ${data[0].display_name}`, 'success');
            getWeatherData(lat, lng); // Récupérer les données météo pour la nouvelle position
        } else {
            hideLoading();
            showStatus('Adresse introuvable. Veuillez réessayer.', 'error');
        }
    } catch (error) {
        hideLoading();
        showStatus('Erreur lors de la recherche d\'adresse.', 'error');
        console.error("Erreur de recherche d'adresse:", error);
    }
}


/* =========================================
   DONNÉES MÉTÉO (OPEN-METEO API)
======================================== */
async function getWeatherData(latitude, longitude) {
    showLoading();
    try {
        // CORRECTION: Ajout du paramètre `forecast_days=1` pour s'assurer d'avoir les données pour la journée actuelle
        // et les 10 prochaines heures. Open-Meteo donne par défaut 7 jours, mais on ne veut que le début.
        // On demande plus de détails pour le calcul solaire
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,apparent_temperature,precipitation,rain,showers,snowfall,weathercode,pressure_msl,surface_pressure,windspeed_10m,winddirection_10m,relativehumidity_2m,shortwave_radiation,direct_radiation,diffuse_radiation&forecast_days=1&timezone=auto`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        weatherData = await response.json();
        console.log("Données météo reçues:", weatherData); // Pour débogage

        displayHourlyForecast(weatherData);
        hideLoading();
        showStatus('Données météo chargées avec succès !', 'success');

        // Initialiser recoveryStartTime avec la première heure des données API si c'est la première récupération
        if (!recoveryStartTime && weatherData.hourly && weatherData.hourly.time.length > 0) {
            recoveryStartTime = new Date(weatherData.hourly.time[0]);
            recoveryEndTime = new Date(recoveryStartTime.getTime() + (10 * 60 * 60 * 1000));
        }

    } catch (error) {
        hideLoading();
        showStatus(`Erreur lors du chargement des données météo: ${error.message}`, 'error');
        console.error("Erreur fetch météo:", error);
        weatherData = null; // Assurez-vous que les données sont nulles en cas d'erreur
    }
}

/**
 * Affiche les prévisions météorologiques horaires.
 * @param {object} data - Les données météo de l'API Open-Meteo.
 */
function displayHourlyForecast(data) {
    hourlyForecastDiv.innerHTML = ''; // Nettoyer les anciennes prévisions

    if (!data || !data.hourly || !data.hourly.time || data.hourly.time.length === 0) {
        hourlyForecastDiv.innerHTML = '<p class="text-center">Aucune donnée horaire disponible.</p>';
        return;
    }

    const hourly = data.hourly;
    const timezone = data.timezone; // Récupérer le fuseau horaire de l'API

    // Tableau de correspondance WMO Weather codes to icons and descriptions
    const weatherCodes = {
        0: { icon: '☀️', desc: 'Ciel dégagé' },
        1: { icon: '🌤️', desc: 'Principalement dégagé' },
        2: { icon: '⛅', desc: 'Partiellement nuageux' },
        3: { icon: '☁️', desc: 'Couvert' },
        45: { icon: '🌫️', desc: 'Brouillard' },
        48: { icon: '🌫️', desc: 'Brouillard givrant' },
        51: { icon: '🌧️', desc: 'Bruine légère' },
        53: { icon: '🌧️', desc: 'Bruine modérée' },
        55: { icon: '🌧️', desc: 'Bruine dense' },
        56: { icon: '🌧️', desc: 'Bruine verglaçante légère' },
        57: { icon: '🌧️', desc: 'Bruine verglaçante dense' },
        61: { icon: '🌧️', desc: 'Pluie légère' },
        63: { icon: '🌧️', desc: 'Pluie modérée' },
        65: { icon: '🌧️', desc: 'Forte pluie' },
        66: { icon: '🧊🌧️', desc: 'Pluie verglaçante légère' },
        67: { icon: '🧊🌧️', desc: 'Pluie verglaçante forte' },
        71: { icon: '🌨️', desc: 'Chutes de neige légères' },
        73: { icon: '🌨️', desc: 'Chutes de neige modérées' },
        75: { icon: '🌨️', desc: 'Forte chute de neige' },
        77: { icon: '❄️', desc: 'Grains de neige' },
        80: { icon: '⛈️', desc: 'Averses de pluie légères' },
        81: { icon: '⛈️', desc: 'Averses de pluie modérées' },
        82: { icon: '⛈️', desc: 'Fortes averses de pluie' },
        85: { icon: '🌨️', desc: 'Averses de neige légères' },
        86: { icon: '🌨️', desc: 'Fortes averses de neige' },
        95: { icon: '⚡⛈️', desc: 'Orage' },
        96: { icon: '⚡⛈️', desc: 'Orage avec grêle légère' },
        99: { icon: '⚡⛈️', desc: 'Orage avec forte grêle' }
    };

    // N'afficher que les 10 premières heures (ou moins si moins sont disponibles)
    const numHoursToShow = Math.min(10, hourly.time.length);

    for (let i = 0; i < numHoursToShow; i++) {
        const time = new Date(hourly.time[i]);
        // Créer un objet Intl.DateTimeFormat pour formater l'heure selon le fuseau horaire de l'API
        const timeFormatter = new Intl.DateTimeFormat('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: timezone,
            hour12: false // Force 24-hour format
        });
        const formattedTime = timeFormatter.format(time);

        const temperature = hourly.temperature_2m[i].toFixed(1);
        const feelsLike = hourly.apparent_temperature[i].toFixed(1);
        const humidity = hourly.relativehumidity_2m[i].toFixed(0);
        const precipitation = hourly.precipitation[i] ? hourly.precipitation[i].toFixed(1) : '0.0';
        const windSpeed = hourly.windspeed_10m[i].toFixed(1);
        const windDirection = hourly.winddirection_10m[i]; // Directe en degrés
        const pressure = hourly.pressure_msl[i].toFixed(0);
        const weatherCode = hourly.weathercode[i];
        const weatherInfo = weatherCodes[weatherCode] || { icon: '❓', desc: 'Inconnu' };

        // Déterminer la direction du vent en texte
        const windDirText = getWindDirectionText(windDirection);

        const itemDiv = document.createElement('div');
        itemDiv.classList.add('forecast-item');
        itemDiv.innerHTML = `
            <p><strong>${formattedTime}</strong></p>
            <p class="weather-icon">${weatherInfo.icon}</p>
            <p>${weatherInfo.desc}</p>
            <p class="temp">${temperature}°C</p>
            <p>Ressenti: ${feelsLike}°C</p>
            <p>Humidité: ${humidity}%</p>
            <p>Précip.: ${precipitation} mm</p>
            <p>Vent: ${windSpeed} km/h ${windDirText}</p>
            <p>Pression: ${pressure} hPa</p>
        `;
        hourlyForecastDiv.appendChild(itemDiv);
    }
}

/**
 * Convertit un angle de direction de vent en texte.
 * @param {number} degrees - Angle en degrés (0=Nord, 90=Est).
 * @returns {string} Direction cardinale.
 */
function getWindDirectionText(degrees) {
    if (degrees >= 337.5 || degrees < 22.5) return 'N';
    if (degrees >= 22.5 && degrees < 67.5) return 'NE';
    if (degrees >= 67.5 && degrees < 112.5) return 'E';
    if (degrees >= 112.5 && degrees < 157.5) return 'SE';
    if (degrees >= 157.5 && degrees < 202.5) return 'S';
    if (degrees >= 202.5 && degrees < 247.5) return 'SO';
    if (degrees >= 247.5 && degrees < 292.5) return 'O';
    if (degrees >= 292.5 && degrees < 337.5) return 'NO';
    return '';
}

/* =========================================
   CALCUL ET AFFICHAGE SOLAIRE
======================================== */

/**
 * Calcule les composantes du rayonnement solaire incident sur une surface.
 * Utilise les modèles standard pour le rayonnement direct, diffus et réfléchi.
 * @param {number} incidenceAngle - Angle d'incidence en degrés sur la surface.
 * @param {number} solarZenith - Angle zénithal solaire en degrés.
 * @param {number} directNormalIrradiation - Rayonnement direct normal (API: direct_radiation).
 * @param {number} diffuseHorizontalIrradiation - Rayonnement diffus horizontal (API: diffuse_radiation).
 * @param {number} groundAlbedo - Albèdo du sol (0-1).
 * @param {number} windowHeight - Hauteur de la fenêtre en mètres.
 * @returns {{directIrradiation: number, diffuseIrradiation: number, reflectedIrradiation: number}} Les composantes du rayonnement.
 */
function calculateSolarRadiationComponents(incidenceAngle, solarZenith, directNormalIrradiation, diffuseHorizontalIrradiation, groundAlbedo, windowHeight) {
    let directIrradiation = 0;
    if (incidenceAngle < 90) { // Le soleil frappe la surface
        directIrradiation = directNormalIrradiation * cosd(incidenceAngle);
    }

    // Modèle Perez ou autres pourraient être plus précis, mais pour simplifier
    // on utilise une approche de base pour le diffus et le réfléchi.
    // Pour le diffus, souvent on utilise: Diffus_sur_surface = Diffus_horizontal * (facteur de vue du ciel)
    // Ici, nous utilisons l'approche PVlib simplifiée pour le diffuse
    // (facteur d'inclinaison pour une surface inclinée)
    let diffuseIrradiation = diffuseHorizontalIrradiation * ((1 + cosd(parseFloat(wallTiltInput.value))) / 2);

    // Rayonnement réfléchi du sol
    let reflectedIrradiation = 0;
    // Si la surface est verticale et que le soleil est au-dessus de l'horizon
    if (parseFloat(wallTiltInput.value) === 90 && solarZenith < 90) {
        // Approximation: radiation globale horizontale = direct_horizontal + diffuse_horizontal
        const globalHorizontalIrradiation = directNormalIrradiation * cosd(solarZenith) + diffuseHorizontalIrradiation;
        reflectedIrradiation = globalHorizontalIrradiation * groundAlbedo * (1 - cosd(parseFloat(wallTiltInput.value))) / 2;
        // Correction: L'albédo reflète le rayonnement global horizontal
        reflectedIrradiation = globalHorizontalIrradiation * groundAlbedo * sind(windowHeight); // Simplification, plus complexe en réalité
    }


    // Une formule plus générale et robuste pour le réfléchi:
    // Rayonnement global horizontal (GHI) = Direct horizontal + Diffus horizontal
    // Direct horizontal = DNI * cos(Zenith)
    const directHorizontal = directNormalIrradiation * cosd(solarZenith);
    const globalHorizontalIrradiation = directHorizontal + diffuseHorizontalIrradiation;

    // Le rayonnement réfléchi est une fonction du GHI, de l'albédo et de l'angle d'inclinaison de la paroi.
    // Pour une surface verticale (tilt = 90), le facteur de vue du sol est d'environ 0.5.
    // L'ajout de windowHeight est une simplification pour indiquer qu'une fenêtre plus haute peut capter plus de réfléchi.
    reflectedIrradiation = globalHorizontalIrradiation * groundAlbedo * ((1 - cosd(parseFloat(wallTiltInput.value))) / 2);


    return {
        directIrradiation: Math.max(0, directIrradiation),
        diffuseIrradiation: Math.max(0, diffuseIrradiation),
        reflectedIrradiation: Math.max(0, reflectedIrradiation)
    };
}


/**
 * Met à jour et affiche les résultats du calcul solaire et le graphique.
 */
function updateSolarCalculations() {
    if (!weatherData) {
        showStatus('Veuillez d\'abord récupérer les données météo.', 'warning');
        return;
    }

    const hourlyData = weatherData.hourly;
    const now = new Date();
    // Trouver l'index de l'heure actuelle dans les données de l'API
    // CORRECTION: Utiliser le fuseau horaire de l'API pour trouver l'heure correcte
    const currentHourString = new Intl.DateTimeFormat('fr-FR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false, timeZone: weatherData.timezone
    }).format(now).substring(0, 13); // Format "JJ/MM/AAAA HH"
    
    let currentIndex = -1;
    for (let i = 0; i < hourlyData.time.length; i++) {
        const apiHourString = new Date(hourlyData.time[i]).toLocaleString('fr-FR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false, timeZone: weatherData.timezone
        }).substring(0, 13);
        
        if (apiHourString === currentHourString) {
            currentIndex = i;
            break;
        }
    }

    if (currentIndex === -1 || currentIndex >= hourlyData.time.length) {
        showStatus('L\'heure actuelle ne correspond pas aux données horaires disponibles de l\'API.', 'warning');
        solarCalcResultDiv.style.display = 'none';
        return;
    }

    const wallTilt = parseFloat(wallTiltInput.value);
    const wallOrientation = parseFloat(wallOrientationSelect.value === 'custom' ? customAzimuthInput.value : wallOrientationSelect.value);
    const groundAlbedo = parseFloat(groundAlbedoInput.value);
    const windowHeight = parseFloat(windowHeightInput.value);

    if (isNaN(wallTilt) || isNaN(wallOrientation) || isNaN(groundAlbedo) || isNaN(windowHeight)) {
        showStatus('Veuillez entrer des valeurs valides pour le calcul solaire.', 'warning');
        return;
    }

    // Calcul pour l'heure actuelle
    const currentDayOfYear = getDayOfYear(now);
    const timezoneOffset = weatherData.utc_offset_seconds / 3600; // Offset en heures
    const currentLocalHourFloat = (now.getUTCHours() + now.getUTCMinutes() / 60 + timezoneOffset) % 24;

    const currentZenith = getSolarZenithAngle(currentDayOfYear, lat, lng, currentLocalHourFloat);
    const currentAzimuth = getSolarAzimuthAngle(currentDayOfYear, lat, lng, currentLocalHourFloat);
    const currentIncidentAngle = calculateIncidenceAngle(currentZenith, currentAzimuth, wallTilt, wallOrientation);

    const currentDirectRadiationAPI = hourlyData.direct_radiation[currentIndex];
    const currentDiffuseRadiationAPI = hourlyData.diffuse_radiation[currentIndex];

    const {
        directIrradiation,
        diffuseIrradiation,
        reflectedIrradiation
    } = calculateSolarRadiationComponents(
        currentIncidentAngle,
        currentZenith,
        currentDirectRadiationAPI,
        currentDiffuseRadiationAPI,
        groundAlbedo,
        windowHeight
    );
    const totalIrradiation = directIrradiation + diffuseIrradiation + reflectedIrradiation;

    directIrradiationSpan.textContent = directIrradiation.toFixed(2);
    diffuseIrradiationSpan.textContent = diffuseIrradiation.toFixed(2);
    reflectedIrradiationSpan.textContent = reflectedIrfection.toFixed(2);
    totalSolarIrradiationSpan.textContent = totalIrradiation.toFixed(2);
    solarCalcResultDiv.style.display = 'block';

    // Préparation des données pour le graphique sur 10 heures
    const chartLabels = [];
    const chartData = [];
    const numHoursForChart = Math.min(10, hourlyData.time.length - currentIndex); // Jusqu'à 10 heures à partir de l'heure actuelle

    for (let i = 0; i < numHoursForChart; i++) {
        const hourIndex = currentIndex + i;
        const hourTime = new Date(hourlyData.time[hourIndex]);
        const hourFormatter = new Intl.DateTimeFormat('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: weatherData.timezone,
            hour12: false
        });
        chartLabels.push(hourFormatter.format(hourTime));

        const dayOfYear = getDayOfYear(hourTime);
        const localHourFloat = (hourTime.getUTCHours() + hourTime.getUTCMinutes() / 60 + timezoneOffset) % 24;

        const zenith = getSolarZenithAngle(dayOfYear, lat, lng, localHourFloat);
        const azimuth = getSolarAzimuthAngle(dayOfYear, lat, lng, localHourFloat);
        const incidentAngle = calculateIncidenceAngle(zenith, azimuth, wallTilt, wallOrientation);

        const directAPI = hourlyData.direct_radiation[hourIndex];
        const diffuseAPI = hourlyData.diffuse_radiation[hourIndex];

        const {
            directIrradiation: hrDirect,
            diffuseIrradiation: hrDiffuse,
            reflectedIrradiation: hrReflected
        } = calculateSolarRadiationComponents(
            incidentAngle,
            zenith,
            directAPI,
            diffuseAPI,
            groundAlbedo,
            windowHeight
        );
        chartData.push(hrDirect + hrDiffuse + hrReflected);
    }

    renderSolarIrradianceChart(chartLabels, chartData);
}

/**
 * Affiche le graphique de rayonnement solaire horaire.
 * @param {string[]} labels - Étiquettes des heures.
 * @param {number[]} data - Données de rayonnement.
 */
function renderSolarIrradianceChart(labels, data) {
    const ctx = document.getElementById('solarIrradianceChart').getContext('2d');
    if (solarIrradianceChart) {
        solarIrradianceChart.destroy(); // Détruire l'ancien graphique s'il existe
    }
    solarIrradianceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Rayonnement Solaire Total (W/m²)',
                data: data,
                borderColor: var_primary_color, // Use the CSS variable directly
                backgroundColor: 'rgba(0, 184, 148, 0.2)',
                tension: 0.3,
                fill: true,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Rayonnement (W/m²)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Heure'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw.toFixed(2)} W/m²`;
                        }
                    }
                }
            }
        }
    });
}

/* =========================================
   AFFICHAGE DU CHARGEMENT
======================================== */
function showLoading() {
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}


/* =========================================
   FONCTIONS DE RÉCUPÉRATION DES DONNÉES EN TEMPS RÉEL
======================================== */

/**
 * Démarre le processus de récupération des données minute par minute.
 */
async function startRecovery() {
    if (!weatherData) {
        showStatus('Veuillez d\'abord obtenir les données météo.', 'error');
        // Tente de récupérer les données si elles ne sont pas là
        await getWeatherData(lat, lng); 
        if (!weatherData) return; // Si toujours pas de données, on sort
    }

    if (recoveryIntervalId) {
        showStatus('La récupération est déjà en cours.', 'info');
        return;
    }

    // Réinitialiser les données précédentes si elles existent
    collectedTemperatureVector = [];
    collectedSolarFluxVector = [];
    currentRecoveryDuration = 0;
    
    // Définir les heures de début et de fin basées sur la première heure des données météo de l'API
    // IMPORTANT: Utilisez la première heure de `weatherData.hourly.time` pour aligner les collectes.
    const firstHourlyTimeStr = weatherData.hourly.time[0];
    recoveryStartTime = new Date(firstHourlyTimeStr);
    recoveryEndTime = new Date(recoveryStartTime.getTime() + (10 * 60 * 60 * 1000)); // 10 heures plus tard

    // Mise à jour de l'UI
    startRecoveryBtn.style.display = 'none';
    stopRecoveryBtn.style.display = 'block';
    recoveryProgressContainer.style.display = 'block';
    nextUpdateTimeDisplay.style.display = 'block';
    recoveryStatusDisplay.style.display = 'block';
    copyCollectedVectorsBtn.style.display = 'none'; // Cacher le bouton de copie initialement

    showStatus('Récupération lancée...', 'info');
    updateProgressBar(0);
    
    // Appel initial immédiat
    updateRecoveryData();

    // Démarrer l'intervalle (toutes les minutes)
    recoveryIntervalId = setInterval(updateRecoveryData, 60 * 1000); // Toutes les 60 secondes (1 minute)
}

/**
 * Arrête le processus de récupération des données.
 */
function stopRecovery() {
    if (recoveryIntervalId) {
        clearInterval(recoveryIntervalId);
        recoveryIntervalId = null;
        showStatus('Récupération arrêtée.', 'warning');
        updateProgressBar(currentRecoveryDuration / TOTAL_RECOVERY_MINUTES * 100); // Afficher la progression finale
        stopRecoveryBtn.style.display = 'none';
        startRecoveryBtn.style.display = 'block';
        if (collectedTemperatureVector.length > 0) {
            copyCollectedVectorsBtn.style.display = 'block'; // Afficher le bouton de copie si des données ont été collectées
        }
    }
}

/**
 * Met à jour les vecteurs de température et de flux solaire toutes les minutes.
 * Effectue une nouvelle requête API à chaque minute.
 */
async function updateRecoveryData() { // Rendre la fonction asynchrone
    showStatus('Récupération des données météo la plus récente...', 'info');
    await getWeatherData(lat, lng); // <-- Appel de l'API à chaque minute

    if (!weatherData || !weatherData.hourly || weatherData.hourly.time.length === 0) {
        showStatus('Impossible d\'obtenir des données météo de l\'API.', 'error');
        stopRecovery();
        return;
    }

    // Obtenir le temps actuel par rapport au début de la récupération
    const now = new Date();
    currentRecoveryDuration = Math.floor((now.getTime() - recoveryStartTime.getTime()) / (60 * 1000)); 

    if (currentRecoveryDuration < 0) {
        // Cela signifie que l'heure système actuelle est avant le début de la première heure de données de l'API.
        // On attend que l'heure système "rattrape" le début des données API.
        showStatus(`En attente du début de la période de récupération. Début à ${recoveryStartTime.toLocaleTimeString('fr-FR')}`, 'info');
        const nextUpdateMinute = new Date(now.getTime() + (60 * 1000));
        displayNextUpdateTime(nextUpdateMinute);
        // Ne rien collecter encore, juste attendre
        return;
    }

    if (currentRecoveryDuration >= TOTAL_RECOVERY_MINUTES) {
        showStatus('Récupération des 10 heures terminée !', 'success');
        updateProgressBar(100);
        stopRecovery(); // Arrêter l'intervalle
        copyCollectedVectorsBtn.style.display = 'block'; // Afficher le bouton de copie
        nextUpdateTimeDisplay.style.display = 'none'; // Cacher le temps de la prochaine mise à jour
        return;
    }

    // --- Température ---
    // Nous prenons toujours la première valeur de température disponible dans la réponse API
    // car c'est la "plus actuelle" que l'API nous donne pour l'heure en cours.
    const currentTemp = weatherData.hourly.temperature_2m[0]; 
    collectedTemperatureVector.push(currentTemp);

    // --- Calcul du flux solaire ---
    // Utilisation de l'heure actuelle pour la position solaire
    const currentCalculationDate = new Date(); // Utiliser l'heure actuelle du système pour la précision minute par minute
    
    const currentHourUTC = currentCalculationDate.getUTCHours();
    const currentMinuteUTC = currentCalculationDate.getUTCMinutes();
    const currentDayOfYear = getDayOfYear(currentCalculationDate);

    // Assurez-vous d'utiliser l'offset UTC de la dernière donnée météo reçue
    const timezoneOffset = weatherData.utc_offset_seconds / 3600; 
    const currentLocalHourFloat = (currentHourUTC + currentMinuteUTC / 60 + timezoneOffset) % 24;

    const currentZenith = getSolarZenithAngle(currentDayOfYear, lat, lng, currentLocalHourFloat);
    const currentAzimuth = getSolarAzimuthAngle(currentDayOfYear, lat, lng, currentLocalHourFloat);

    const incidentAngle = calculateIncidenceAngle(
        currentZenith,
        currentAzimuth,
        parseFloat(wallTiltInput.value),
        parseFloat(wallOrientationSelect.value === 'custom' ? customAzimuthInput.value : wallOrientationSelect.value)
    );

    // Récupérer les valeurs de rayonnement de l'API.
    // Nous prenons les toutes premières valeurs disponibles dans la réponse API
    // car ce sont les "plus actuelles" que l'API nous donne.
    const hourlyDirectRadiation = weatherData.hourly.direct_radiation[0];
    const hourlyDiffuseRadiation = weatherData.hourly.diffuse_radiation[0];

    const { directIrradiation, diffuseIrradiation, reflectedIrradiation } = calculateSolarRadiationComponents(
        incidentAngle,
        currentZenith,
        hourlyDirectRadiation, 
        hourlyDiffuseRadiation, 
        parseFloat(groundAlbedoInput.value),
        parseFloat(windowHeightInput.value)
    );
    const totalSolarIrradiation = directIrradiation + diffuseIrradiation + reflectedIrradiation;
    collectedSolarFluxVector.push(totalSolarIrradiation);

    // Mise à jour de l'UI
    const progress = (currentRecoveryDuration / TOTAL_RECOVERY_MINUTES) * 100;
    updateProgressBar(progress);
    
    const nextUpdateMinute = new Date(now.getTime() + (60 * 1000)); // Temps pour la prochaine mise à jour
    displayNextUpdateTime(nextUpdateMinute);
    
    recoveryStatusDisplay.textContent = `Collecte en cours : ${collectedTemperatureVector.length} points (temp), ${collectedSolarFluxVector.length} points (flux).`;

    console.log(`Min ${currentRecoveryDuration}: Temp=${currentTemp.toFixed(2)}°C (API), Flux=${totalSolarIrradiation.toFixed(2)} W/m²`); 
}

/**
 * Met à jour la barre de progression.
 * @param {number} progress - Pourcentage de progression (0-100).
 */
function updateProgressBar(progress) {
    recoveryProgressBar.style.width = `${progress.toFixed(1)}%`;
    recoveryProgressText.textContent = `${progress.toFixed(1)}%`;
}

/**
 * Affiche l'heure de la prochaine mise à jour.
 * @param {Date} nextTime - Objet Date de la prochaine mise à jour.
 */
function displayNextUpdateTime(nextTime) {
    const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    nextUpdateTimeDisplay.textContent = `Prochaine mise à jour à : ${nextTime.toLocaleTimeString('fr-FR', options)}`;
}

/**
 * Copie les vecteurs collectés dans le presse-papiers au format CSV.
 */
function copyCollectedVectorsToClipboard() {
    if (collectedTemperatureVector.length === 0 || collectedSolarFluxVector.length === 0) {
        showStatus("Aucune donnée à copier. Lancez la récupération d'abord.", 'warning');
        return;
    }

    let csvContent = "Minute,Temperature (°C),Solar Flux (W/m2)\n";
    for (let i = 0; i < collectedTemperatureVector.length; i++) {
        csvContent += `${i + 1},${collectedTemperatureVector[i].toFixed(2)},${collectedSolarFluxVector[i].toFixed(2)}\n`;
    }

    navigator.clipboard.writeText(csvContent).then(() => {
        showStatus('Vecteurs de données copiés dans le presse-papiers (CSV) !', 'success');
    }).catch(err => {
        showStatus('Erreur lors de la copie : ' + err, 'error');
        console.error('Erreur de copie:', err);
    });
}


/* =========================================
   GÉNÉRATION DES VECTEURS PYTHON
======================================== */

/**
 * Génère un vecteur Python de températures interpolées sur 10 heures (60 valeurs/heure).
 * @returns {string} Le vecteur Python sous forme de chaîne.
 */
function generatePythonVector() {
    if (!weatherData) {
        showStatus('Veuillez charger les données météo d\'abord.', 'error');
        return '';
    }

    const hourlyTemps = weatherData.hourly.temperature_2m;
    const interpolatedTemps = [];

    // Nous voulons 60 points par heure pour les 10 prochaines heures.
    // Cela signifie 9 heures de transitions entre 10 points horaires.
    // Total: 9 * 60 = 540 points.
    const totalInterpolationPoints = 9 * 60; 

    for (let i = 0; i < 9; i++) { // Pour chaque intervalle de 1 heure (entre heure i et heure i+1)
        if (i + 1 < hourlyTemps.length) { // S'assurer qu'il y a une prochaine heure
            const temp1 = hourlyTemps[i];
            const temp2 = hourlyTemps[i + 1];
            for (let j = 0; j < 60; j++) { // 60 points par heure
                const interpolatedValue = temp1 + (temp2 - temp1) * (j / 60);
                interpolatedTemps.push(interpolatedValue.toFixed(2));
            }
        }
    }
    return `temperature_vector = [${interpolatedTemps.join(', ')}]`;
}

/**
 * Génère un vecteur Python de flux solaires interpolés sur 10 heures (60 valeurs/heure).
 * @returns {string} Le vecteur Python sous forme de chaîne.
 */
function generateSolarFluxVector() {
    if (!weatherData) {
        showStatus('Veuillez charger les données météo d\'abord.', 'error');
        return '';
    }

    const hourlyData = weatherData.hourly;
    const interpolatedSolarFluxes = [];

    const wallTilt = parseFloat(wallTiltInput.value);
    const wallOrientation = parseFloat(wallOrientationSelect.value === 'custom' ? customAzimuthInput.value : wallOrientationSelect.value);
    const groundAlbedo = parseFloat(groundAlbedoInput.value);
    const windowHeight = parseFloat(windowHeightInput.value);

    if (isNaN(wallTilt) || isNaN(wallOrientation) || isNaN(groundAlbedo) || isNaN(windowHeight)) {
        showStatus('Veuillez entrer des valeurs valides pour le calcul solaire avant de générer le vecteur de flux.', 'warning');
        return '';
    }

    const timezoneOffset = weatherData.utc_offset_seconds / 3600; // Offset en heures

    // Nous voulons 60 points par heure pour les 10 prochaines heures.
    // Cela signifie 9 heures de transitions entre 10 points horaires.
    // Total: 9 * 60 = 540 points.
    
    // CORRECTION: Pour générer des valeurs de flux solaire interpolées sur 60 minutes,
    // nous devons interpoler les composants direct et diffus, puis recalculer le flux total.
    // Ou, plus précisément, recalculer la position solaire pour chaque minute.
    
    // Le plus robuste est de recalculer la position solaire pour chaque minute,
    // et d'interpoler les valeurs direct/diffus de l'API entre les heures.

    for (let i = 0; i < 9; i++) { // Pour chaque intervalle de 1 heure
        if (i + 1 < hourlyData.time.length) { // S'assurer qu'il y a une prochaine heure
            const time1 = new Date(hourlyData.time[i]);
            const time2 = new Date(hourlyData.time[i+1]);

            const direct1 = hourlyData.direct_radiation[i];
            const direct2 = hourlyData.direct_radiation[i+1];
            const diffuse1 = hourlyData.diffuse_radiation[i];
            const diffuse2 = hourlyData.diffuse_radiation[i+1];

            for (let j = 0; j < 60; j++) { // 60 points par heure
                // Calculer l'heure exacte pour cette minute d'interpolation
                const interpolatedMs = time1.getTime() + (time2.getTime() - time1.getTime()) * (j / 60);
                const interpolatedDate = new Date(interpolatedMs);

                const currentDayOfYear = getDayOfYear(interpolatedDate);
                const currentHourUTC = interpolatedDate.getUTCHours();
                const currentMinuteUTC = interpolatedDate.getUTCMinutes();
                const currentLocalHourFloat = (currentHourUTC + currentMinuteUTC / 60 + timezoneOffset) % 24;

                const zenith = getSolarZenithAngle(currentDayOfYear, lat, lng, currentLocalHourFloat);
                const azimuth = getSolarAzimuthAngle(currentDayOfYear, lat, lng, currentLocalHourFloat);
                const incidentAngle = calculateIncidenceAngle(zenith, azimuth, wallTilt, wallOrientation);

                // Interpoler les valeurs de rayonnement direct et diffus de l'API
                const interpolatedDirect = direct1 + (direct2 - direct1) * (j / 60);
                const interpolatedDiffuse = diffuse1 + (diffuse2 - diffuse1) * (j / 60);

                const {
                    directIrradiation,
                    diffuseIrradiation,
                    reflectedIrradiation
                } = calculateSolarRadiationComponents(
                    incidentAngle,
                    zenith,
                    interpolatedDirect, // Utilisez les valeurs interpolées
                    interpolatedDiffuse, // Utilisez les valeurs interpolées
                    groundAlbedo,
                    windowHeight
                );
                const totalSolarIrradiation = directIrradiation + diffuseIrradiation + reflectedIrradiation;
                interpolatedSolarFluxes.push(totalSolarIrradiation.toFixed(2));
            }
        }
    }
    return `solar_flux_vector = [${interpolatedSolarFluxes.join(', ')}]`;
}


/**
 * Copie le contenu d'un textarea dans le presse-papiers.
 * @param {HTMLTextAreaElement} textareaElement - L'élément textarea dont le contenu doit être copié.
 */
function copyTextareaToClipboard(textareaElement) {
    if (textareaElement.value) {
        textareaElement.select();
        textareaElement.setSelectionRange(0, 99999); // Pour les appareils mobiles
        navigator.clipboard.writeText(textareaElement.value).then(() => {
            showStatus('Vecteur copié dans le presse-papiers !', 'success');
        }).catch(err => {
            showStatus('Erreur lors de la copie du vecteur.', 'error');
            console.error('Erreur de copie:', err);
        });
    } else {
        showStatus('Rien à copier. Générez le vecteur d\'abord.', 'warning');
    }
}


/* =========================================
   GESTIONNAIRES D'ÉVÉNEMENTS (EVENT LISTENERS)
======================================== */
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    getWeatherData(lat, lng); // Charger les données météo initiales

    getUserLocationBtn.addEventListener('click', getUserLocation);
    validatePositionBtn.addEventListener('click', () => {
        lat = parseFloat(latInput.value);
        lng = parseFloat(lngInput.value);
        if (isNaN(lat) || isNaN(lng)) {
            showStatus('Veuillez entrer des coordonnées valides.', 'error');
            return;
        }
        map.setView([lat, lng], 13);
        marker.setLatLng([lat, lng]);
        updateCoordinatesDisplay();
        showStatus(`Position mise à jour à Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`, 'info');
        getWeatherData(lat, lng); // Mettre à jour les données météo pour la nouvelle position
    });
    searchAddressBtn.addEventListener('click', searchAddress);

    wallOrientationSelect.addEventListener('change', () => {
        if (wallOrientationSelect.value === 'custom') {
            customAzimuthInput.style.display = 'inline-block';
        } else {
            customAzimuthInput.style.display = 'none';
        }
    });

    calculateSolarBtn.addEventListener('click', updateSolarCalculations);

    // Event listeners for Python vector generation
    generateTempVectorBtn.addEventListener('click', () => {
        const vector = generatePythonVector();
        if (vector) {
            tempVectorOutput.value = vector;
            copyTextareaToClipboard(tempVectorOutput);
        }
    });

    generateSolarFluxVectorBtn.addEventListener('click', () => {
        const vector = generateSolarFluxVector();
        if (vector) {
            solarFluxVectorOutput.value = vector;
            copyTextareaToClipboard(solarFluxVectorOutput);
        }
    });

    // Event listeners for real-time recovery
    if (startRecoveryBtn) {
        startRecoveryBtn.addEventListener('click', startRecovery);
    }
    if (stopRecoveryBtn) {
        stopRecoveryBtn.addEventListener('click', stopRecovery);
    }
    if (copyCollectedVectorsBtn) {
        copyCollectedVectorsBtn.addEventListener('click', copyCollectedVectorsToClipboard);
    }

    console.log('✅ Application initialisée avec succès !');
});













