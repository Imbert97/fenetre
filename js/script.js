/* ========================================
   VARIABLES GLOBALES
======================================== */

let map, marker, lat = 46.8139, lng = -71.2080; // QuÃ©bec par dÃ©faut
let weatherData = null;
let tempSelectedPosition = null;
let solarChartInstance = null;

/* ========================================
   CODES MÃ‰TÃ‰O WMO ET ICÃ”NES
======================================== */

const weatherCodes = {
    0: "Ciel dÃ©gagÃ©",
    1: "Principalement dÃ©gagÃ©", 
    2: "Partiellement nuageux",
    3: "Couvert",
    45: "Brouillard",
    48: "Brouillard givrant",
    51: "Bruine lÃ©gÃ¨re",
    53: "Bruine modÃ©rÃ©e", 
    55: "Bruine dense",
    56: "Bruine verglaÃ§ante lÃ©gÃ¨re",
    57: "Bruine verglaÃ§ante dense",
    61: "Pluie lÃ©gÃ¨re",
    63: "Pluie modÃ©rÃ©e",
    65: "Pluie forte",
    66: "Pluie verglaÃ§ante lÃ©gÃ¨re",
    67: "Pluie verglaÃ§ante forte",
    71: "Neige lÃ©gÃ¨re",
    73: "Neige modÃ©rÃ©e",
    75: "Neige forte",
    77: "Grains de neige",
    80: "Averses lÃ©gÃ¨res",
    81: "Averses modÃ©rÃ©es",
    82: "Averses violentes",
    85: "Averses de neige lÃ©gÃ¨res",
    86: "Averses de neige fortes",
    95: "Orage",
    96: "Orage avec grÃªle lÃ©gÃ¨re",
    99: "Orage avec grÃªle forte"
};

function getWeatherIcon(code, isDay = true) {
    const icons = {
        0: isDay ? "â˜€ï¸" : "ðŸŒ™",
        1: isDay ? "ðŸŒ¤ï¸" : "ðŸŒ™",
        2: "â›…",
        3: "â˜ï¸",
        45: "ðŸŒ«ï¸",
        48: "ðŸŒ«ï¸",
        51: "ðŸŒ¦ï¸",
        53: "ðŸŒ¦ï¸",
        55: "ðŸŒ¦ï¸",
        56: "ðŸŒ¦ï¸",
        57: "ðŸŒ¦ï¸",
        61: "ðŸŒ§ï¸",
        63: "ðŸŒ§ï¸",
        65: "ðŸŒ§ï¸",
        66: "ðŸŒ§ï¸",
        67: "ðŸŒ§ï¸",
        71: "ðŸŒ¨ï¸",
        73: "ðŸŒ¨ï¸",
        75: "ðŸŒ¨ï¸",
        77: "ðŸŒ¨ï¸",
        80: "ðŸŒ¦ï¸",
        81: "ðŸŒ¦ï¸",
        82: "ðŸŒ¦ï¸",
        85: "ðŸŒ¨ï¸",
        86: "ðŸŒ¨ï¸",
        95: "â›ˆï¸",
        96: "â›ˆï¸",
        99: "â›ˆï¸"
    };
    return icons[code] || "ðŸŒ";
}

/* ========================================
   INITIALISATION DE LA CARTE
======================================== */

function initMap() {
    map = L.map('map').setView([lat, lng], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Â© OpenStreetMap contributors'
    }).addTo(map);
    marker = L.marker([lat, lng]).addTo(map)
        .bindPopup(`ðŸ“ Position: ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
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
   GESTION UNIFIÃ‰E DES POSITIONS
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
                    .bindPopup(`ðŸ“ Votre position: ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
                    .openPopup();
                updateLocationDisplay();
                hidePositionValidation();
            },
            function(error) {
                alert('Erreur de gÃ©olocalisation: ' + error.message);
            }
        );
    } else {
        alert('La gÃ©olocalisation n\'est pas supportÃ©e par ce navigateur');
    }
}

function validatePosition() {
    if (!tempSelectedPosition) {
        alert('Aucune position sÃ©lectionnÃ©e Ã  valider');
        return;
    }
    
    lat = tempSelectedPosition.lat;
    lng = tempSelectedPosition.lng;
    map.setView([lat, lng], 12);
    if (marker) map.removeLayer(marker);
    marker = L.marker([lat, lng]).addTo(map)
        .bindPopup(`âœ… POSITION VALIDÃ‰E<br>ðŸ“ ${tempSelectedPosition.name}<br>CoordonnÃ©es: ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
        .openPopup();
    updateLocationDisplay();
    hidePositionValidation();
    document.getElementById('manualLat').value = '';
    document.getElementById('manualLng').value = '';
    document.getElementById('addressSearch').value = '';
    showSuccessMessage('âœ… Position validÃ©e avec succÃ¨s !');
    getWeatherData();
}

function updateMapPreview(latitude, longitude, displayName) {
    map.setView([latitude, longitude], 12);
    if (marker) map.removeLayer(marker);
    marker = L.marker([latitude, longitude]).addTo(map)
        .bindPopup(`ðŸ” APERÃ‡U<br>ðŸ“ ${displayName}<br>CoordonnÃ©es: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}<br><small>Cliquez sur "DÃ©finir cette position" pour confirmer</small>`)
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
        alert('Veuillez entrer une adresse Ã  rechercher');
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
        listDiv.innerHTML = '<p style="color: #d63031;">Aucune adresse trouvÃ©e. Essayez une recherche diffÃ©rente.</p>';
        resultsDiv.style.display = 'block';
        return;
    }
    
    listDiv.innerHTML = '';
    
    results.forEach((result, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'weather-card';
        cardDiv.style.cssText = 'cursor: pointer; margin: 10px 0;';
        
        cardDiv.innerHTML = `
            <strong>ðŸ“ ${result.display_name}</strong>
            <p style="font-size: 0.9em; color: #636e72; margin: 5px 0;">
                CoordonnÃ©es: ${parseFloat(result.lat).toFixed(4)}, ${parseFloat(result.lon).toFixed(4)}
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
   ðŸ”§ FONCTION CORRIGÃ‰E : GÃ‰NÃ‰RATION VECTEUR PYTHON AVEC INTERPOLATION LINÃ‰AIRE
======================================== */

function generatePythonVector() {
    if (!weatherData || !weatherData.hourly || !weatherData.hourly.temperature_2m) {
        alert('âŒ Aucune donnÃ©e mÃ©tÃ©o disponible. RÃ©cupÃ©rez d\'abord les prÃ©visions.');
        return;
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

    // RÃ©cupÃ©rer 11 heures pour avoir des transitions entre 10 heures
    const maxHours = Math.min(11, weatherData.hourly.temperature_2m.length - startIndex);
    const temps = weatherData.hourly.temperature_2m.slice(startIndex, startIndex + maxHours);
    
    if (temps.length < 2) {
        alert('âŒ Pas assez de donnÃ©es pour gÃ©nÃ©rer des transitions graduelles.');
        return;
    }

    const vector = [];
    const debugInfo = []; // Pour vÃ©rifier l'interpolation
    
    // ðŸ”§ INTERPOLATION LINÃ‰AIRE CORRIGÃ‰E avec plus de prÃ©cision
    for (let h = 0; h < Math.min(10, temps.length - 1); h++) {
        const currentTemp = temps[h];
        const nextTemp = temps[h + 1];
        const tempDiff = nextTemp - currentTemp;
        
        // Stocker info de debug
        debugInfo.push({
            heure: h,
            tempActuelle: currentTemp,
            tempSuivante: nextTemp,
            difference: tempDiff
        });
        
        // GÃ©nÃ©rer 3600 valeurs interpolÃ©es pour cette heure
        for (let i = 0; i < 3600; i++) {
            const progress = i / 3600; // 0 Ã  1 (progression dans l'heure)
            
            // ðŸ”§ CORRECTION : Utiliser plus de prÃ©cision avant l'arrondi
            const interpolatedTemp = currentTemp + (tempDiff * progress);
            
            // Arrondir Ã  1 dÃ©cimale pour garder plus de nuances
            vector.push(Math.round(interpolatedTemp * 10) / 10);
        }
    }

    // ðŸ”§ DEBUG : Afficher les premiers et derniers Ã©chantillons pour vÃ©rifier
    console.log('ðŸ” VÃ©rification interpolation tempÃ©ratures:', {
        infoTransitions: debugInfo,
        premieres20Valeurs: vector.slice(0, 20),
        valeursAutourHeure1: vector.slice(3580, 3620), // Autour de la transition 1Ã¨reâ†’2Ã¨me heure
        dernieres20Valeurs: vector.slice(-20)
    });

    const pythonVectorString = `[${vector.join(', ')}]`;
    
    navigator.clipboard.writeText(pythonVectorString).then(() => {
        showSuccessMessage(`âœ… Vecteur Python avec interpolation linÃ©aire copiÃ© ! (${vector.length} valeurs - ${Math.min(10, temps.length - 1)} heures)`);
        
        // Afficher un rÃ©sumÃ© des transitions
        let transitionSummary = "Transitions dÃ©tectÃ©es:\n";
        debugInfo.forEach(info => {
            transitionSummary += `Heure ${info.heure}: ${info.tempActuelle}Â°C â†’ ${info.tempSuivante}Â°C (${info.difference > 0 ? '+' : ''}${info.difference.toFixed(1)}Â°C)\n`;
        });
        console.log(transitionSummary);
        
    }).catch(err => {
        console.error('Erreur copie presse-papier:', err);
        showVectorInTextArea(pythonVectorString, 'tempÃ©ratures avec interpolation linÃ©aire');
    });
}



/* ========================================
   ðŸ”§ FONCTION CORRIGÃ‰E : GÃ‰NÃ‰RATION VECTEUR PYTHON FLUX SOLAIRES AVEC INTERPOLATION
======================================== */

function generateSolarFluxVector() {
    if (!weatherData || !weatherData.hourly) {
        alert('âŒ Aucune donnÃ©e mÃ©tÃ©o disponible. RÃ©cupÃ©rez d\'abord les prÃ©visions.');
        return;
    }

    // ðŸ”§ RÃ‰CUPÃ‰RATION EXACTE DES MÃŠMES PARAMÃˆTRES QUE LE GRAPHIQUE
    const orientationSelect = document.getElementById('wallOrientation');
    const customAzimuth = document.getElementById('customAzimuth');
    const wallTilt = parseFloat(document.getElementById('wallTilt').value) || 90;
    const albedo = parseFloat(document.getElementById('albedo').value) || 0.2;
    const windowHeight = parseFloat(document.getElementById('windowHeight').value) || 0;

    if (!orientationSelect) {
        alert('âŒ Veuillez d\'abord configurer les paramÃ¨tres solaires.');
        return;
    }

    let surfaceAzimuth;
    if (orientationSelect.value === 'custom') {
        surfaceAzimuth = parseFloat(customAzimuth.value);
        if (isNaN(surfaceAzimuth)) {
            alert('âŒ Veuillez entrer un azimuth personnalisÃ© valide.');
            return;
        }
    } else {
        surfaceAzimuth = orientationToAzimuth(orientationSelect.value);
    }

    // ðŸ”§ MÃŠME LOGIQUE D'INDEX QUE LE GRAPHIQUE
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
    const debugComparison = []; // Pour comparer avec le graphique
    
    // ðŸ”§ CALCULS IDENTIQUES AU GRAPHIQUE
    const maxHours = Math.min(11, weatherData.hourly.time.length - startIndex);
    for (let i = 0; i < maxHours; i++) {
        const dataIndex = startIndex + i;
        const weatherTime = new Date(weatherData.hourly.time[dataIndex]);
        
        // MÃŠMES calculs que dans calculateSolarRadiation()
        const GHIh = weatherData.hourly.shortwave_radiation ? 
            weatherData.hourly.shortwave_radiation[dataIndex] : 800;
        const DNIh = weatherData.hourly.direct_radiation ? 
            weatherData.hourly.direct_radiation[dataIndex] : 900;
        const DHIh = weatherData.hourly.diffuse_radiation ? 
            weatherData.hourly.diffuse_radiation[dataIndex] : 100;
        
        const solarPos = calculateSolarPosition(lat, lng, weatherTime);
        const aoi = calculateAngleOfIncidence(wallTilt, surfaceAzimuth, solarPos.zenith, solarPos.azimuth);
        
        let directOnWall = 0;
        if (aoi < 90) {
            directOnWall = DNIh * Math.max(0, cosd(aoi));
        }
        
        const diffuseOnWall = DHIh * (1 + cosd(wallTilt)) / 2;
        const reduction = windowHeight <= 2 ? 1 : Math.exp(-0.2 * (windowHeight - 2));
        const reflectedOnWall = GHIh * albedo * (1 - cosd(wallTilt)) / 2 * reduction;
        
        const totalFlux = directOnWall + diffuseOnWall + reflectedOnWall;
        const roundedFlux = Math.round(totalFlux);
        solarFluxes.push(roundedFlux);
        
        // Debug pour comparaison
        debugComparison.push({
            heure: i,
            timestamp: weatherData.hourly.time[dataIndex],
            GHI: GHIh,
            DNI: DNIh,
            DHI: DHIh,
            direct: directOnWall.toFixed(1),
            diffuse: diffuseOnWall.toFixed(1),
            reflected: reflectedOnWall.toFixed(1),
            total: totalFlux.toFixed(1),
            totalArrondi: roundedFlux
        });
    }

    if (solarFluxes.length < 2) {
        alert('âŒ Pas assez de donnÃ©es pour gÃ©nÃ©rer des transitions graduelles.');
        return;
    }

    // ðŸ”§ INTERPOLATION LINÃ‰AIRE avec debug
    const vector = [];
    const transitionDebug = [];
    
    for (let h = 0; h < Math.min(10, solarFluxes.length - 1); h++) {
        const currentFlux = solarFluxes[h];
        const nextFlux = solarFluxes[h + 1];
        const fluxDiff = nextFlux - currentFlux;
        
        transitionDebug.push({
            heure: h,
            fluxActuel: currentFlux,
            fluxSuivant: nextFlux,
            difference: fluxDiff
        });
        
        for (let i = 0; i < 3600; i++) {
            const progress = i / 3600;
            const interpolatedFlux = currentFlux + (fluxDiff * progress);
            vector.push(Math.round(interpolatedFlux * 10) / 10); // 1 dÃ©cimale de prÃ©cision
        }
    }

    // ðŸ”§ DEBUG COMPLET
    console.log('â˜€ï¸ Debug flux solaires - Comparaison graphique vs vecteur:', {
        parametres: {
            orientation: surfaceAzimuth + 'Â°',
            inclinaison: wallTilt + 'Â°',
            albedo: albedo,
            hauteur: windowHeight + 'm'
        },
        indexDemarrage: startIndex,
        calculsPourGraphique: debugComparison,
        transitionsInterpolation: transitionDebug,
        premieres20Valeurs: vector.slice(0, 20),
        valeursAutourTransition: vector.slice(3580, 3620),
        dernieres20Valeurs: vector.slice(-20)
    });

    const pythonVectorString = `[${vector.join(', ')}]`;
    
    navigator.clipboard.writeText(pythonVectorString).then(() => {
        showSuccessMessage(`âœ… Vecteur Python flux solaires avec interpolation synchronisÃ©e copiÃ© ! (${vector.length} valeurs)`);
        
        // Afficher rÃ©sumÃ© pour vÃ©rification
        let summary = "ðŸ” RÃ©sumÃ© pour vÃ©rification:\n";
        debugComparison.slice(0, 10).forEach((calc, idx) => {
            summary += `${calc.timestamp.slice(11, 16)}: ${calc.totalArrondi}W/mÂ² (graphique) \n`;
        });
        console.log(summary);
        
    }).catch(err => {
        console.error('Erreur copie presse-papier:', err);
        showVectorInTextArea(pythonVectorString, 'flux solaires synchronisÃ©s');
    });
}



/* ========================================
   RÃ‰CUPÃ‰RATION DES DONNÃ‰ES MÃ‰TÃ‰O (OPEN-METEO CORRIGÃ‰)
======================================== */

async function getWeatherData() {
    try {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }
        
        // ðŸ”§ REQUÃŠTE OPEN-METEO OPTIMISÃ‰E
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,shortwave_radiation,direct_radiation,diffuse_radiation&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,is_day,shortwave_radiation,direct_radiation,diffuse_radiation&timezone=auto&forecast_hours=48`
        );

        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        weatherData = await response.json();
        
        console.log('ðŸ” DonnÃ©es mÃ©tÃ©o Open-Meteo rÃ©cupÃ©rÃ©es:', weatherData);
        displayHourlyForecast();
        
    } catch (error) {
        console.error('Erreur lors de la rÃ©cupÃ©ration des donnÃ©es mÃ©tÃ©o:', error);
        alert('Erreur lors de la rÃ©cupÃ©ration des donnÃ©es mÃ©tÃ©o: ' + error.message);
    } finally {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }
}

/* ========================================
   AFFICHAGE DES PRÃ‰VISIONS HORAIRES (CORRIGÃ‰ FUSEAUX HORAIRES)
======================================== */

function displayHourlyForecast() {
    if (!weatherData || !weatherData.hourly) return;
    
    const hourly = weatherData.hourly;
    const forecastDiv = document.getElementById('hourlyForecast');
    if (!forecastDiv) return;
    
    const targetTimezone = weatherData.timezone || 'UTC';
    const now = new Date();
    
    // ðŸ”§ CORRECTION : Logique fiable pour trouver l'index de dÃ©part
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
    
    console.log(`ðŸ• Index de dÃ©part: ${startIndex}, Total heures: ${hourly.time.length}`);
    
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
            <h3>â° PRÃ‰VISIONS 10 PROCHAINES HEURES (${targetTimezone}) - Open-Meteo</h3>
            <div class="info" style="background: rgba(255,255,255,0.1); color: white; margin: 10px 0; border: none;">
                ðŸ• Maintenant Ã  ${targetTimezone} : ${nowInTargetTz}
                <br>ðŸ” Index dÃ©marrage : ${startIndex}
                <br>ðŸ“Š Total heures API : ${hourly.time.length}
                <br>ðŸ“ Position : ${lat.toFixed(4)}, ${lng.toFixed(4)}
            </div>
            <div style="margin: 15px 0;">
                <button onclick="generatePythonVector()" style="background: #00b894; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                   ðŸ Copier Vecteur Python (TempÃ©ratures/seconde - Interpolation LinÃ©aire)
               </button>
               <small style="display: block; margin-top: 5px; color: #636e72;">
                   GÃ©nÃ¨re un vecteur avec transitions graduelles entre les tempÃ©ratures horaires (36,000 valeurs avec interpolation linÃ©aire)
               </small>
            </div>
            <div class="hourly-grid">
    `;
    
    // ðŸ”§ CORRECTION PRINCIPALE : Affichage correct des heures sans double conversion
    for (let i = 0; i < 10 && (startIndex + i) < hourly.time.length; i++) {
        const dataIndex = startIndex + i;
        
        // âš¡ SOLUTION : Parser directement la chaÃ®ne ISO de l'API
        const timeString = hourly.time[dataIndex]; // Ex: "2025-07-25T09:00"
        
        // Extraire l'heure et la date directement de la chaÃ®ne ISO
        const [datePart, timePart] = timeString.split('T');
        const [year, month, day] = datePart.split('-');
        const [hour, minute] = timePart.split(':');
        
        // Afficher l'heure directement depuis la chaÃ®ne ISO (pas de conversion)
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
                <div class="hourly-temp">${temp}Â°C</div>
                <div class="hourly-details">
                    <div>ðŸŒ¡ï¸ Ressenti: ${tempFeel}Â°C</div>
                    <div>ðŸ’§ HumiditÃ©: ${humidity}%</div>
                    <div>ðŸŒ§ï¸ Pluie: ${precipitation}mm</div>
                    <div>ðŸ’¨ Vent: ${windSpeed}km/h</div>
                    <div>ðŸ§­ Dir: ${windDir}Â°</div>
                    <div>ðŸŒŠ Pression: ${pressure}hPa</div>
                </div>
            </div>
        `;
    }
    
    forecastHTML += `
            </div>
            <div class="info" style="margin-top: 20px; background: rgba(255,255,255,0.2); color: white; border: none;">
                ðŸ’¡ <strong>Conseil rideaux:</strong> Consultez ces prÃ©visions pour planifier l'ouverture/fermeture de vos rideaux selon la tempÃ©rature et l'ensoleillement attendus.
                <br>ðŸ <strong>Vecteur Python:</strong> Cliquez sur le bouton ci-dessus pour copier un vecteur avec les tempÃ©ratures de chaque seconde.
            </div>
        </div>
    `;
    
    forecastDiv.innerHTML = forecastHTML;
}

/* ========================================
   FONCTIONS MATHÃ‰MATIQUES SOLAIRES
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
        alert('Veuillez d\'abord rÃ©cupÃ©rer les donnÃ©es mÃ©tÃ©orologiques');
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
            alert('Veuillez entrer un azimuth personnalisÃ© valide');
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
        `${surfaceAzimuth}Â° (personnalisÃ©)` : 
        `${orientationSelect.options[orientationSelect.selectedIndex].text}`;
    
    const timezoneInfo = weatherData.timezone ? `(${weatherData.timezone})` : '(UTC)';
    
    resultsDiv.innerHTML = `
        <div class="solar-current">
            <h3>â˜€ï¸ CALCUL DU RAYONNEMENT SOLAIRE ${timezoneInfo}</h3>
            <div class="weather-grid">
                <div><strong>ðŸ“ Position:</strong> ${lat.toFixed(4)}Â°, ${lng.toFixed(4)}Â°</div>
                <div><strong>ðŸ• Fuseau horaire:</strong> ${weatherData.timezone || 'UTC'}</div>
                <div><strong>ðŸ§­ Orientation mur:</strong> ${orientationText}</div>
                <div><strong>ðŸ“ Inclinaison mur:</strong> ${wallTilt}Â°</div>
                <div><strong>ðŸŒ AlbÃ©do sol:</strong> ${albedo}</div>
                <div><strong>ðŸ¢ Hauteur fenÃªtre:</strong> ${windowHeight} m</div>
            </div>
        </div>
        <div class="info" style="margin: 20px 0;">
            <h3>ðŸ”¬ EXPLICATIONS DU CALCUL</h3>
            <ul style="text-align: left; margin: 10px 0;">
                <li><strong>Rayonnement direct :</strong> LumiÃ¨re directe du soleil</li>
                <li><strong>Rayonnement diffus :</strong> LumiÃ¨re diffusÃ©e par l'atmosphÃ¨re et les nuages</li>
                <li><strong>Rayonnement rÃ©flÃ©chi :</strong> LumiÃ¨re rÃ©flÃ©chie par le sol (diminuÃ© selon la hauteur de la fenÃªtre)</li>
            </ul>
        </div>
        <h3>ðŸ§® DÃ‰TAIL DES CALCULS</h3>
        <div class="weather-grid">
            <div class="solar-card">
                <h4>1ï¸âƒ£ Rayonnement Direct</h4>
                <p><strong>RÃ©sultat :</strong> <span style="color: #e17055;">${directOnWall.toFixed(1)} W/mÂ²</span></p>
            </div>
            <div class="solar-card">
                <h4>2ï¸âƒ£ Rayonnement Diffus</h4>
                <p><strong>RÃ©sultat :</strong> <span style="color: #e17055;">${diffuseOnWall.toFixed(1)} W/mÂ²</span></p>
            </div>
            <div class="solar-card">
                <h4>3ï¸âƒ£ Rayonnement RÃ©flÃ©chi</h4>
                <p><strong>Facteur de rÃ©duction hauteur :</strong> ${reduction.toFixed(2)} (pour ${windowHeight} m)</p>
                <p><strong>RÃ©sultat :</strong> <span style="color: #e17055;">${reflectedOnWall.toFixed(1)} W/mÂ²</span></p>
            </div>
        </div>
        <div class="solar-current" style="margin-top: 20px;">
            <h3>ðŸŽ¯ RÃ‰SULTAT FINAL</h3>
            <div class="weather-grid">
                <div class="solar-card" style="border-left-color: #00b894; background: #d1f2eb;">
                    <h4>ðŸ“Š SOMME TOTALE</h4>
                    <p><strong>TOTAL :</strong> <span style="font-size: 1.5em; color: #00b894;">${totalOnWall.toFixed(1)} W/mÂ²</span></p>
                </div>
            </div>
            <div style="margin: 15px 0; text-align: center;">
                <button onclick="generateSolarFluxVector()" style="background: #fd7900; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; margin-right: 10px;">
                   â˜€ï¸ Copier Vecteur Python (Flux Solaires/seconde - Interpolation LinÃ©aire)
                </button>
                <small style="display: block; margin-top: 5px; color: #636e72;">
                    GÃ©nÃ¨re un vecteur avec transitions graduelles entre les flux solaires horaires (36,000 valeurs en W/mÂ² avec interpolation linÃ©aire)
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
            
            // MÃªme logique pour trouver l'index de dÃ©part
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
                
                // ðŸ”§ CORRECTION : MÃªme traitement des heures que l'affichage
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
                        label: "Rayonnement solaire sur la fenÃªtre (W/mÂ²)",
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
                            text: `Ã‰volution du rayonnement solaire - ${targetTimezone}`
                        }
                    },
                    scales: {
                        y: {
                            title: { display: true, text: "W/mÂ²" },
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
    console.log('ðŸš€ Initialisation de l\'application avec Open-Meteo...');
    
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
    
    console.log('âœ… Application initialisÃ©e avec succÃ¨s !');
});

