// SafeHerCab – Leaflet Map Engine
// Free tiles: OpenStreetMap + CartoDB (no API key required)
// Handles: booking map, tracking map, real-time driver marker, user GPS

const SafeHerMap = (() => {

    // ── Hyderabad centre ──────────────────────────────────────────────────────
    const HYD_CENTER = [17.3850, 78.4867];
    const HYD_BOUNDS = L.latLngBounds([17.15, 78.18], [17.68, 78.75]);

    // ── Tile layers (all 100% free, no API key) ───────────────────────────────
    const TILES = {
        carto: {
            url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
            attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
            maxZoom: 19
        },
        osm: {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19
        },
        cartoDark: {
            url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            attr: '&copy; <a href="https://www.openstreetmap.org">OSM</a> &copy; <a href="https://carto.com">CARTO</a>',
            maxZoom: 19
        }
    };

    // ── Custom marker SVG icons ────────────────────────────────────────────────
    function makeIcon(emoji, bg = '#e91e8c', size = 38) {
        return L.divIcon({
            className: '',
            html: `<div style="
        width:${size}px;height:${size}px;
        background:${bg};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 3px 12px rgba(0,0,0,0.3);
        border:2px solid white;
      "><span style="transform:rotate(45deg);font-size:${Math.round(size * 0.48)}px;line-height:1">${emoji}</span></div>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size],
            popupAnchor: [0, -size]
        });
    }

    function makePulseIcon(color = '#22c55e', size = 16) {
        return L.divIcon({
            className: '',
            html: `<div style="position:relative;width:${size}px;height:${size}px">
        <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.3;animation:leaflet-pulse 1.5s ease-out infinite"></div>
        <div style="position:absolute;inset:3px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>
      </div>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            popupAnchor: [0, -size / 2]
        });
    }

    // Inject pulse animation CSS once
    const styleEl = document.createElement('style');
    styleEl.textContent = `
    @keyframes leaflet-pulse {
      0% { transform: scale(1); opacity: 0.5; }
      100% { transform: scale(3); opacity: 0; }
    }
    .leaflet-container { font-family: 'Inter', sans-serif !important; border-radius: 12px; }
    .leaflet-popup-content-wrapper { border-radius: 12px !important; box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important; }
    .leaflet-popup-content { margin: 14px 16px !important; }
    .map-control-btn { background: white; border: none; border-radius: 8px; padding: 8px 14px; font-size: 0.82rem; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15); color: #333; transition: all 0.2s; }
    .map-control-btn:hover { background: #e91e8c; color: white; }
    .leaflet-routing-container { display: none; }
  `;
    document.head.appendChild(styleEl);

    // ── Internal state ─────────────────────────────────────────────────────────
    let mapInstance = null;
    let userMarker = null;
    let driverMarker = null;
    let pickupMarker = null;
    let dropMarker = null;
    let routeLine = null;
    let driverAnimTimer = null;

    // ── Init map ──────────────────────────────────────────────────────────────
    function init(containerId, options = {}) {
        if (mapInstance) { mapInstance.remove(); mapInstance = null; }

        const tile = options.darkMode ? TILES.cartoDark : TILES.carto;

        mapInstance = L.map(containerId, {
            center: options.center || HYD_CENTER,
            zoom: options.zoom || 13,
            maxBounds: HYD_BOUNDS,
            maxBoundsViscosity: 0.8,
            zoomControl: false
        });

        L.tileLayer(tile.url, {
            attribution: tile.attr,
            maxZoom: tile.maxZoom,
            subdomains: 'abcd'
        }).addTo(mapInstance);

        // Custom zoom control (top-right)
        L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

        return mapInstance;
    }

    // ── Place / update user's live GPS marker ─────────────────────────────────
    function setUserLocation(lat, lng, accuracy) {
        if (!mapInstance) return;
        if (!userMarker) {
            userMarker = L.marker([lat, lng], { icon: makePulseIcon('#22c55e', 20), zIndexOffset: 1000 })
                .addTo(mapInstance)
                .bindPopup('<b>📍 Your Location</b>');
        } else {
            userMarker.setLatLng([lat, lng]);
        }
        if (accuracy) {
            // Accuracy circle
            if (userMarker._accuracyCircle) mapInstance.removeLayer(userMarker._accuracyCircle);
            userMarker._accuracyCircle = L.circle([lat, lng], {
                radius: accuracy, color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.08, weight: 1
            }).addTo(mapInstance);
        }
    }

    // ── Pickup & drop markers ─────────────────────────────────────────────────
    function setPickup(lat, lng, label = 'Pickup') {
        if (!mapInstance) return;
        if (pickupMarker) mapInstance.removeLayer(pickupMarker);
        pickupMarker = L.marker([lat, lng], { icon: makeIcon('🟢', '#22c55e', 36) })
            .addTo(mapInstance)
            .bindPopup(`<b>📍 ${label}</b>`);
        fitMarkers();
    }

    function setDrop(lat, lng, label = 'Drop') {
        if (!mapInstance) return;
        if (dropMarker) mapInstance.removeLayer(dropMarker);
        dropMarker = L.marker([lat, lng], { icon: makeIcon('🔴', '#e91e8c', 36) })
            .addTo(mapInstance)
            .bindPopup(`<b>🏁 ${label}</b>`);
        fitMarkers();
        drawRoute();
    }

    // ── Route line (OSM OSRM free routing) ────────────────────────────────────
    async function drawRoute() {
        if (!mapInstance || !pickupMarker || !dropMarker) return;
        const p = pickupMarker.getLatLng();
        const d = dropMarker.getLatLng();

        try {
            // OSRM public API (free, no key)
            const url = `https://router.project-osrm.org/route/v1/driving/${p.lng},${p.lat};${d.lng},${d.lat}?overview=full&geometries=geojson`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.routes && data.routes[0]) {
                if (routeLine) mapInstance.removeLayer(routeLine);
                routeLine = L.geoJSON(data.routes[0].geometry, {
                    style: { color: '#e91e8c', weight: 4, opacity: 0.8, dashArray: null }
                }).addTo(mapInstance);
                fitMarkers(); // Ensure driver, pickup, and drop are all in bounding box
                return data.routes[0].distance / 1000; // km
            }
        } catch (e) {
            // Fallback: straight dashed line
            if (routeLine) mapInstance.removeLayer(routeLine);
            routeLine = L.polyline([[p.lat, p.lng], [d.lat, d.lng]], {
                color: '#e91e8c', weight: 3, dashArray: '8 6', opacity: 0.7
            }).addTo(mapInstance);
            fitMarkers();
        }
    }

    // ── Driver marker ─────────────────────────────────────────────────────────
    function setDriver(lat, lng, driverName = 'Driver', vehicleType = 'Cab') {
        const icons = { Cab: '🚕', Auto: '🛺', Bike: '🛵' };
        const driverIcon = makeIcon(icons[vehicleType] || '🚕', '#1a1a2e', 42);
        if (!mapInstance) return;
        if (!driverMarker) {
            driverMarker = L.marker([lat, lng], { icon: driverIcon, zIndexOffset: 500 })
                .addTo(mapInstance)
                .bindPopup(`<b>${icons[vehicleType] || '🚕'} ${driverName}</b><br><small>Female Driver · Verified ✅</small>`);
        } else {
            driverMarker.setLatLng([lat, lng]);
        }
        mapInstance.panTo([lat, lng], { animate: true, duration: 0.8 });
    }

    // ── Update driver position smoothly (for Socket.io updates) ──────────────
    function updateDriverPosition(lat, lng) {
        if (!mapInstance || !driverMarker) return;
        driverMarker.setLatLng([lat, lng]);
        mapInstance.panTo([lat, lng], { animate: true, duration: 1 });
    }

    // ── Fit all visible markers ───────────────────────────────────────────────
    function fitMarkers() {
        if (!mapInstance) return;
        const points = [];
        if (userMarker) points.push(userMarker.getLatLng());
        if (pickupMarker) points.push(pickupMarker.getLatLng());
        if (dropMarker) points.push(dropMarker.getLatLng());
        if (driverMarker) points.push(driverMarker.getLatLng());
        if (points.length >= 2) {
            mapInstance.fitBounds(L.latLngBounds(points), { padding: [50, 50] });
        } else if (points.length === 1) {
            mapInstance.setView(points[0], 15);
        }
    }

    // ── Nearest police stations on map ────────────────────────────────────────
    function showPoliceStations(stations) {
        if (!mapInstance) return;
        stations.forEach((ps, i) => {
            const m = L.marker([ps.lat, ps.lon], { icon: makeIcon('👮', '#1e40af', 34) })
                .addTo(mapInstance);
            m.bindPopup(`
        <b>🚔 ${ps.name}</b><br>
        <small>${ps.address}</small><br>
        📞 <a href="tel:${ps.phone}">${ps.phone}</a><br>
        📍 ${ps.distanceKm} km away
        ${i === 0 ? '<br><span style="color:#16a34a;font-weight:700">✅ Nearest Station</span>' : ''}
      `);
            if (i === 0) m.openPopup();
        });
    }

    // ── Get current GPS ───────────────────────────────────────────────────────
    function locateUser(onSuccess, onError) {
        if (!navigator.geolocation) { if (onError) onError('not supported'); return; }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude: lat, longitude: lng, accuracy } = pos.coords;
                setUserLocation(lat, lng, accuracy);
                mapInstance?.setView([lat, lng], 15);
                if (onSuccess) onSuccess(lat, lng);
            },
            (err) => { if (onError) onError(err.message); },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    // ── Watch GPS continuously ────────────────────────────────────────────────
    let watchId = null;
    function watchUser(onUpdate) {
        if (!navigator.geolocation) return;
        watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude: lat, longitude: lng, accuracy } = pos.coords;
                setUserLocation(lat, lng, accuracy);
                if (onUpdate) onUpdate(lat, lng);
            },
            null,
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 }
        );
    }
    function stopWatchUser() { if (watchId) navigator.geolocation.clearWatch(watchId); }

    // ── Pan to Hyderabad centre ───────────────────────────────────────────────
    function resetToHyderabad() {
        mapInstance?.setView(HYD_CENTER, 13);
    }

    // ── Cleanup ───────────────────────────────────────────────────────────────
    function destroy() {
        stopWatchUser();
        if (driverAnimTimer) clearInterval(driverAnimTimer);
        if (mapInstance) { mapInstance.remove(); mapInstance = null; }
        userMarker = driverMarker = pickupMarker = dropMarker = routeLine = null;
    }

    // ── Add landmark markers from hyderabadLocations data ────────────────────
    function addLandmarks(locations, categories = ['Landmark', 'Metro', 'Hospital']) {
        if (!mapInstance) return;
        const catIcons = {
            'Landmark': '🏛️', 'Temple': '🛕', 'Metro': '🚇',
            'Hospital': '🏥', 'Mall': '🛍️', 'Park': '🌳'
        };
        locations
            .filter(loc => categories.includes(loc.category))
            .forEach(loc => {
                L.marker([loc.lat, loc.lon], {
                    icon: makeIcon(catIcons[loc.category] || '📍', '#6b7280', 28)
                })
                    .addTo(mapInstance)
                    .bindPopup(`<b>${loc.name}</b><br><small>${loc.category}</small>`);
            });
    }

    return {
        init, setUserLocation, setPickup, setDrop, setDriver,
        updateDriverPosition, fitMarkers, drawRoute,
        showPoliceStations, locateUser, watchUser, stopWatchUser,
        resetToHyderabad, addLandmarks, destroy,
        get map() { return mapInstance; }
    };
})();
