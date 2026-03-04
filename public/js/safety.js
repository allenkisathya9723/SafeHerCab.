// SafeHerCab – Predictive Safety Engine
// Tracks: route deviation, idle stops, delay, night-time zones

const SafetyEngine = (() => {
    let config = {};
    let watchId = null;
    let positions = [];
    let startTime = null;
    let stopTimer = null;
    let idleStartTime = null;
    let safeCheckInterval = null;
    let engineRunning = false;
    const NIGHT_START = 22; // 10 PM
    const NIGHT_END = 5;   // 5 AM
    const IDLE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes
    const IDLE_SPEED_KMH = 5;
    const DEVIATION_METERS = 300;
    const DELAY_BUFFER_MINS = 5;

    function start({ bookingId, showSafetyAlert, showSafePrompt, booking }) {
        if (engineRunning) return;
        engineRunning = true;
        config = { bookingId, showSafetyAlert, showSafePrompt, booking };
        startTime = Date.now();

        checkNightMode();
        startGPSTracking();
        startSafetyMonitoring();
        console.log('[SafetyEngine] Started for booking', bookingId);
    }

    function stop() {
        engineRunning = false;
        if (watchId) navigator.geolocation.clearWatch(watchId);
        if (stopTimer) clearTimeout(stopTimer);
        if (safeCheckInterval) clearInterval(safeCheckInterval);
    }

    // ── Night Mode Check ──────────────────────────────────────────────────
    function checkNightMode() {
        const hour = new Date().getHours();
        const isNight = hour >= NIGHT_START || hour < NIGHT_END;
        if (isNight) {
            updateSafetyStatus('🌙 Night ride detected. Extra monitoring enabled. Guardian notified.');
            config.showSafetyAlert?.('🌙 Night-time ride detected. Enhanced safety monitoring is active.', 'warning');
            // Guardian already notified via booking creation
        }
    }

    // ── GPS Tracking ──────────────────────────────────────────────────────
    function startGPSTracking() {
        if (!navigator.geolocation) return;
        watchId = navigator.geolocation.watchPosition(
            (pos) => onPositionUpdate(pos),
            (err) => console.warn('[SafetyEngine] GPS error:', err.code),
            { enableHighAccuracy: true, maximumAge: 15000, timeout: 30000 }
        );
    }

    function onPositionUpdate(pos) {
        const point = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speed: (pos.coords.speed || 0) * 3.6, // m/s to km/h
            accuracy: pos.coords.accuracy,
            timestamp: Date.now()
        };
        positions.push(point);

        // Keep last 50 positions
        if (positions.length > 50) positions.shift();

        checkIdleStop(point);
        checkRouteDeviation(point);
        checkDelay();

        // Update safety status
        const speedStr = point.speed > 0 ? `${Math.round(point.speed)} km/h` : 'idle';
        updateSafetyStatus(`✅ Monitoring active · Speed: ${speedStr} · GPS: ${point.accuracy < 30 ? 'accurate' : 'approx'}`);
    }

    // ── Idle/Stop Detection ───────────────────────────────────────────────
    function checkIdleStop(point) {
        if (point.speed < IDLE_SPEED_KMH) {
            if (!idleStartTime) idleStartTime = Date.now();
            const idleMs = Date.now() - idleStartTime;
            if (idleMs >= IDLE_THRESHOLD_MS) {
                idleStartTime = null; // Reset so we don't spam
                const hour = new Date().getHours();
                const isNight = hour >= NIGHT_START || hour < NIGHT_END;
                const msg = isNight
                    ? '🌙 Vehicle stopped for 3+ min at night. Are you safe?'
                    : '⚠️ Vehicle stopped for 3+ min in unusual location.';
                config.showSafetyAlert?.(msg, 'warning');
                config.showSafePrompt?.(msg);
                updateSafetyStatus('⚠️ Long stop detected – Safety check triggered');
            }
        } else {
            idleStartTime = null; // Moving – reset idle timer
        }
    }

    // ── Route Deviation Detection ─────────────────────────────────────────
    function checkRouteDeviation(currentPoint) {
        const booking = config.booking || JSON.parse(localStorage.getItem('active_booking') || '{}');
        if (!booking.drop) return;

        // Simple check: if we're moving AWAY from destination for too long
        if (positions.length < 5) return;
        const recentPositions = positions.slice(-5);
        const distanceToDest = haversine(currentPoint.lat, currentPoint.lng, booking.drop.lat, booking.drop.lng);
        const prevDistToDest = haversine(recentPositions[0].lat, recentPositions[0].lng, booking.drop.lat, booking.drop.lng);

        // If consistently moving away by more than DEVIATION_METERS
        if (distanceToDest - prevDistToDest > DEVIATION_METERS / 1000) {
            config.showSafetyAlert?.('🚨 Vehicle appears to be deviating from the expected route!', 'danger');
            config.showSafePrompt?.('Route deviation detected! Are you safe?');
            updateSafetyStatus('🚨 Route deviation detected!');
        }
    }

    // ── Delay Detection ───────────────────────────────────────────────────
    function checkDelay() {
        const booking = JSON.parse(localStorage.getItem('active_booking') || '{}');
        const expectedMins = booking.estimatedDuration || 30;
        const elapsedMins = (Date.now() - startTime) / 60000;
        if (elapsedMins > expectedMins + DELAY_BUFFER_MINS) {
            config.showSafetyAlert?.(`⏰ Ride is ${Math.round(elapsedMins - expectedMins)} min past estimated arrival.`, 'warning');
            updateSafetyStatus('⏰ Delay beyond estimated time detected');
        }
    }

    // ── Periodic Safety Monitoring ────────────────────────────────────────
    function startSafetyMonitoring() {
        safeCheckInterval = setInterval(() => {
            if (!engineRunning) return;
            const hour = new Date().getHours();
            const isNight = hour >= NIGHT_START || hour < NIGHT_END;
            if (isNight) {
                // Every 10 min at night, check-in
                const elapsedMins = (Date.now() - startTime) / 60000;
                if (Math.floor(elapsedMins) % 10 === 0) {
                    config.showSafePrompt?.('🌙 Night safety check. Are you okay?');
                }
            }
        }, 60 * 1000); // Check every 1 minute
    }

    // ── Haversine ─────────────────────────────────────────────────────────
    function haversine(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    function toRad(deg) { return deg * Math.PI / 180; }

    // ── Update UI ─────────────────────────────────────────────────────────
    function updateSafetyStatus(msg) {
        const el = document.getElementById('safetyStatus');
        if (el) el.textContent = msg;
    }

    return { start, stop };
})();
