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

    // Affichage des résultats (tu peux personnaliser cette partie)
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
                <p><strong>Formule :</strong> DNI × cos(angle_incidence)</p>
                <p><strong>Résultat :</strong> <span style="color: #e17055;">${directOnWall.toFixed(1)} W/m²</span></p>
            </div>
            <div class="solar-card">
                <h4>2️⃣ Rayonnement Diffus</h4>
                <p><strong>Formule :</strong> DHI × (1 + cos(inclinaison_mur)) / 2</p>
                <p><strong>Résultat :</strong> <span style="color: #e17055;">${diffuseOnWall.toFixed(1)} W/m²</span></p>
            </div>
            <div class="solar-card">
                <h4>3️⃣ Rayonnement Réfléchi</h4>
                <p><strong>Formule :</strong> GHI × albédo × (1 - cos(inclinaison_mur)) / 2 × facteur_hauteur</p>
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

    // ------------- AJOUT DU GRAPHIQUE -------------
    if (weatherData.hourly && weatherData.hourly.time) {
        const labels = [];
        const data = [];
        const nowDate = new Date();
        for (let i = 0; i < 10; i++) {
            const hourDate = new Date(nowDate.getTime() + i * 3600 * 1000);
            const hourStr = hourDate.toISOString().slice(0, 13); // format 'YYYY-MM-DDTHH'
            let idx = weatherData.hourly.time.findIndex(t => t.startsWith(hourStr));
            if (idx === -1) idx = i; // fallback

            // Récupère les valeurs horaires (si disponibles)
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



