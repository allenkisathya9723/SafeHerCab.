// SafeHerCab – Booking JS
// Handles: location autocomplete, fare estimation, driver display, booking flow

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;

    // Show user info
    const user = getCurrentUser();
    const userInfoEl = document.getElementById('userInfo');
    if (userInfoEl && user.name) userInfoEl.textContent = `👋 ${user.name}`;

    if (user.guardianPhone) localStorage.setItem('guardian_phone', user.guardianPhone);

    // Init map
    setTimeout(() => {
        SafeHerMap.init('bookingMap');
        SafeHerMap.locateUser((lat, lng) => {
            pickupCoords = { lat, lng };
            if (document.getElementById('pickupInput')) document.getElementById('pickupInput').value = 'My Current Location';
            SafeHerMap.setPickup(lat, lng, 'My Location');
            onLocationChanged();
        }, () => showToast('Enable GPS for live tracking', 'info'));
    }, 100);

    // Init autocomplete
    const pickupInput = document.getElementById('pickupInput');
    const dropInput = document.getElementById('dropInput');
    if (pickupInput) autocomplete(pickupInput, document.getElementById('pickupSuggestions'));
    if (dropInput) autocomplete(dropInput, document.getElementById('dropSuggestions'));

    // Listen for location
    document.addEventListener('locationSelected', onLocationChanged);
    pickupInput?.addEventListener('change', onLocationChanged);
    dropInput?.addEventListener('change', onLocationChanged);
});

// ─── State ─────────────────────────────────────────────────────────────────
let selectedVehicle = 'Cab';
let selectedDriver = null;
let fareEstimates = {};
let pickupCoords = null;
let dropCoords = null;
let selectedPayment = 'cash';
let guardianEnabled = false;

// Hyderabad area coordinates lookup (major areas)
const AREA_COORDS = {
    'Banjara Hills': { lat: 17.4156, lng: 78.4490 },
    'Jubilee Hills': { lat: 17.4239, lng: 78.4062 },
    'Madhapur': { lat: 17.4400, lng: 78.3895 },
    'Gachibowli': { lat: 17.4408, lng: 78.3493 },
    'HITEC City': { lat: 17.4463, lng: 78.3808 },
    'Kondapur': { lat: 17.4682, lng: 78.3557 },
    'Ameerpet': { lat: 17.4374, lng: 78.4491 },
    'Begumpet': { lat: 17.4399, lng: 78.4677 },
    'Secunderabad': { lat: 17.4318, lng: 78.4997 },
    'Kukatpally': { lat: 17.4849, lng: 78.4138 },
    'KPHB': { lat: 17.4884, lng: 78.3980 },
    'Miyapur': { lat: 17.4967, lng: 78.3542 },
    'Uppal': { lat: 17.4065, lng: 78.5567 },
    'LB Nagar': { lat: 17.3468, lng: 78.5530 },
    'Dilsukhnagar': { lat: 17.3687, lng: 78.5280 },
    'Charminar': { lat: 17.3616, lng: 78.4747 },
    'Abids': { lat: 17.3883, lng: 78.4739 },
    'Nampally': { lat: 17.3816, lng: 78.4697 },
    'Himayatnagar': { lat: 17.4005, lng: 78.4681 },
    'Somajiguda': { lat: 17.4237, lng: 78.4488 },
    'Mehdipatnam': { lat: 17.3956, lng: 78.4254 },
    'Film Nagar': { lat: 17.4088, lng: 78.4059 },
    'Manikonda': { lat: 17.4092, lng: 78.3839 },
    'Narsingi': { lat: 17.4006, lng: 78.3545 },
    'Nallagandla': { lat: 17.4572, lng: 78.3244 },
    'Kokapet': { lat: 17.4048, lng: 78.3251 },
    'Shamshabad': { lat: 17.2424, lng: 78.4278 },
    'Falaknuma': { lat: 17.3224, lng: 78.4765 },
    'default': { lat: 17.3850, lng: 78.4867 }
};

function getCoordsForArea(address) {
    for (const [area, coords] of Object.entries(AREA_COORDS)) {
        if (address.toLowerCase().includes(area.toLowerCase())) return coords;
    }
    // Hyderabad center default
    return AREA_COORDS.default;
}

// ─── Location Changed ─────────────────────────────────────────────────────
async function onLocationChanged(e) {
    const pickupEl = document.getElementById('pickupInput');
    const dropEl = document.getElementById('dropInput');
    if (!pickupEl || !dropEl) return; // Guard: DOM not ready

    // Picked up from custom event dataset?
    if (e && e.detail && e.target) {
        if (e.target.id === 'pickupInput') pickupCoords = { lat: e.detail.lat, lng: e.detail.lon };
        if (e.target.id === 'dropInput') dropCoords = { lat: e.detail.lat, lng: e.detail.lon };
    } else {
        // Fallback map query logic if no coords
        if (pickupEl.value && pickupEl.value.length > 3 && !pickupCoords) pickupCoords = getCoordsForArea(pickupEl.value);
        if (dropEl.value && dropEl.value.length > 3 && !dropCoords) dropCoords = getCoordsForArea(dropEl.value);
    }

    if (pickupCoords) SafeHerMap.setPickup(pickupCoords.lat, pickupCoords.lng, pickupEl.value || 'Pickup');
    if (dropCoords) SafeHerMap.setDrop(dropCoords.lat, dropCoords.lng, dropEl.value || 'Drop');

    if (pickupCoords && dropCoords) {
        await SafeHerMap.drawRoute();
        await fetchFareEstimate();
        await loadNearbyDrivers();
    }
}


// ─── Current Location ─────────────────────────────────────────────────────
function useCurrentLocation() {
    pickupCoords = null; // Clear so it re-fetches
    SafeHerMap.locateUser((lat, lng) => {
        pickupCoords = { lat, lng };
        document.getElementById('pickupInput').value = 'My Current Location, Hyderabad';
        SafeHerMap.setPickup(lat, lng, 'My Location');
        onLocationChanged();
    }, (err) => showToast('Location permission denied: ' + err, 'warning'));
}

// ─── Fare Estimate ────────────────────────────────────────────────────────
async function fetchFareEstimate() {
    if (!pickupCoords || !dropCoords) return;
    try {
        const res = await API.post('/booking/estimate', {
            pickupLat: pickupCoords.lat, pickupLng: pickupCoords.lng,
            dropLat: dropCoords.lat, dropLng: dropCoords.lng,
            vehicleType: selectedVehicle
        });
        fareEstimates = res.estimates;

        // Update vehicle tab fares
        ['Cab', 'Auto', 'Bike'].forEach(v => {
            const fareEl = document.getElementById(`fare-${v}`);
            if (fareEl && res.estimates[v]) fareEl.textContent = `₹${res.estimates[v].fare}`;
        });

        // Show fare card
        const fc = document.getElementById('fareCard');
        if (fc) fc.style.display = 'block';
        updateFareDisplay();

        // Enable book button
        document.getElementById('bookBtn').disabled = !selectedDriver;
        // Show payment section
        const ps = document.getElementById('paymentSection');
        if (ps) ps.style.display = 'block';
    } catch (e) {
        showToast(e.message || 'Could not estimate fare', 'error');
    }
}

function updateFareDisplay() {
    const est = fareEstimates[selectedVehicle];
    if (!est) return;
    const fa = document.getElementById('fareAmount');
    const fd = document.getElementById('fareDistance');
    const fe = document.getElementById('fareEta');
    if (fa) fa.textContent = `₹${est.fare}`;
    if (fd) fd.textContent = `${est.distance} km`;
    if (fe) fe.textContent = `ETA: ${est.eta} min`;
}

// ─── Vehicle Selection ────────────────────────────────────────────────────
function selectVehicle(type) {
    selectedVehicle = type;
    selectedDriver = null;
    document.querySelectorAll('.vehicle-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${type}`)?.classList.add('active');
    updateFareDisplay();
    if (pickupCoords) loadNearbyDrivers();
}

// ─── Load Nearby Drivers ──────────────────────────────────────────────────
async function loadNearbyDrivers() {
    if (!pickupCoords) return;
    const ds = document.getElementById('driversSection');
    if (ds) ds.style.display = 'block';

    const list = document.getElementById('driversList');
    list.innerHTML = '<div class="skeleton" style="height:80px;margin-bottom:10px"></div>'.repeat(3);

    try {
        const res = await API.get(`/drivers/available?lat=${pickupCoords.lat}&lng=${pickupCoords.lng}&vehicleType=${selectedVehicle}&radius=3`);
        const drivers = res.drivers || [];
        document.getElementById('driverCount').textContent = `${drivers.length} online`;

        if (!drivers.length) {
            list.innerHTML = '<div style="text-align:center;padding:24px;color:var(--gray-500)"><div style="font-size:2rem;margin-bottom:8px">😔</div>No drivers available in your area right now. Try again in a few minutes.</div>';
            return;
        }

        list.innerHTML = drivers.map(d => createDriverCard(d)).join('');
    } catch (e) {
        list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--danger)">Could not load drivers: ' + e.message + '</div>';
    }
}

function createDriverCard(driver) {
    return `
    <div class="driver-card" id="dcard-${driver.id}" onclick="selectDriver(${JSON.stringify(driver).replace(/"/g, '&quot;')})">
      <img class="driver-avatar" src="${driver.photo}" alt="${driver.name}" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.id}&backgroundColor=e91e8c'" />
      <div class="driver-info">
        <div class="driver-name">${driver.name}</div>
        <div class="driver-meta">
          <span class="driver-rating">⭐ ${driver.rating}</span>
          <span class="driver-vehicle">${driver.vehicleModel || driver.vehicleType}</span>
          <span class="badge badge-primary">${driver.vehicleType}</span>
        </div>
        <div style="display:flex;gap:8px;margin-top:4px">
          <span class="driver-eta">🕒 ETA: ${driver.eta} min</span>
          <span class="driver-distance">📍 ${driver.distance} km away</span>
          <span style="font-size:0.75rem;color:var(--gray-500)">${driver.totalRides} rides</span>
        </div>
        <div style="font-size:0.78rem;color:var(--gray-400);margin-top:2px">${driver.vehicleNumber}</div>
      </div>
      <div style="font-size:1.5rem">›</div>
    </div>`;
}

function selectDriver(driver) {
    selectedDriver = driver;
    // Highlight selected
    document.querySelectorAll('.driver-card').forEach(c => c.classList.remove('selected'));
    const card = document.getElementById(`dcard-${driver.id}`);
    if (card) card.classList.add('selected');

    // Move map to selected driver
    if (pickupCoords) {
        // Use driver's real API location, or fallback to slight offset
        const drLat = driver.location ? driver.location.lat : pickupCoords.lat + (Math.random() - 0.5) * 0.01;
        const drLng = driver.location ? driver.location.lng : pickupCoords.lng + (Math.random() - 0.5) * 0.01;
        SafeHerMap.setDriver(drLat, drLng, driver.name, driver.vehicleType);
        SafeHerMap.fitMarkers();
    }

    // Enable book button
    document.getElementById('bookBtn').disabled = false;
    showToast(`${driver.name} selected! ✅`, 'success');
}

function refreshDrivers() { loadNearbyDrivers(); }

// ─── Guardian Toggle ──────────────────────────────────────────────────────
function toggleGuardian(enabled) {
    guardianEnabled = enabled;
    const sub = document.getElementById('guardianBarSub');
    if (enabled) {
        const gPhone = localStorage.getItem('guardian_phone');
        sub.textContent = gPhone ? `Tracking link will be sent to +91${gPhone}` : 'Add guardian number in profile for SMS';
        sub.style.color = 'var(--success)';
    } else {
        sub.textContent = 'Toggle to share live ride with family';
        sub.style.color = '';
    }
}

// ─── Payment Mode ─────────────────────────────────────────────────────────
function selectPayment(method) {
    selectedPayment = method;
    document.querySelectorAll('[id^="pay-"]').forEach(b => b.classList.remove('active'));
    document.getElementById(`pay-${method}`)?.classList.add('active');
}

// ─── Confirm Booking (shows modal) ───────────────────────────────────────
function confirmBooking() {
    const pickup = document.getElementById('pickupInput')?.value;
    const drop = document.getElementById('dropInput')?.value;
    if (!pickup || !drop) { showToast('Please enter pickup and drop locations', 'error'); return; }
    if (!selectedDriver) { showToast('Please select a driver', 'error'); return; }

    const est = fareEstimates[selectedVehicle] || {};
    const icons = { Cab: '🚕', Auto: '🛺', Bike: '🛵' };
    document.getElementById('confirmDetails').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;align-items:center;gap:12px;padding:14px;background:var(--gray-100);border-radius:var(--radius-md)">
        <img src="${selectedDriver.photo}" style="width:48px;height:48px;border-radius:50%;border:2px solid var(--primary)" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=driver'" />
        <div>
          <div style="font-weight:700">${selectedDriver.name}</div>
          <div style="font-size:0.82rem;color:var(--gray-500)">⭐ ${selectedDriver.rating} · ${selectedDriver.vehicleNumber}</div>
        </div>
        <div style="margin-left:auto;font-size:1.8rem">${icons[selectedVehicle]}</div>
      </div>
      <div style="padding:12px;background:var(--gray-100);border-radius:var(--radius-md);display:flex;flex-direction:column;gap:6px">
        <div style="display:flex;gap:8px"><div style="width:8px;height:8px;background:var(--success);border-radius:50%;margin-top:5px;flex-shrink:0"></div><div style="font-size:0.88rem">${pickup}</div></div>
        <div style="border-left:2px dashed var(--gray-300);margin-left:3px;height:10px"></div>
        <div style="display:flex;gap:8px"><div style="width:8px;height:8px;background:var(--primary);border-radius:50%;margin-top:5px;flex-shrink:0"></div><div style="font-size:0.88rem">${drop}</div></div>
      </div>
      <div style="display:flex;justify-content:space-between;padding:12px;background:var(--pink-50);border-radius:var(--radius-md);border:1px solid var(--pink-200)">
        <span style="color:var(--gray-600);font-size:0.9rem">Estimated Fare</span>
        <span style="font-size:1.2rem;font-weight:800;color:var(--primary)">₹${est.fare || '--'}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:0.85rem;color:var(--gray-500)">
        <span>Distance: ${est.distance || '--'} km</span>
        <span>ETA: ${est.eta || '--'} min</span>
        <span>Payment: ${selectedPayment}</span>
      </div>
      ${guardianEnabled ? '<div class="badge badge-success" style="display:inline-flex"><i class="fa-solid fa-eye" style="margin-right:4px"></i> Guardian tracking will be enabled</div>' : ''}
    </div>`;
    openModal('confirmModal');
}

// ─── Finalize Booking ─────────────────────────────────────────────────────
async function finalizeBooking() {
    const btn = document.getElementById('finalizeBtn');
    btn.classList.add('loading'); btn.disabled = true;
    const user = getCurrentUser();
    const pickup = document.getElementById('pickupInput')?.value;
    const drop = document.getElementById('dropInput')?.value;

    try {
        const res = await API.post('/booking/create', {
            userId: user.id || user.phone,
            pickupAddress: pickup, pickupLat: pickupCoords?.lat, pickupLng: pickupCoords?.lng,
            dropAddress: drop, dropLat: dropCoords?.lat, dropLng: dropCoords?.lng,
            vehicleType: selectedVehicle,
            driverId: selectedDriver?.id,
            guardianPhone: guardianEnabled ? localStorage.getItem('guardian_phone') : null,
            paymentMethod: selectedPayment
        });

        // Assign driver
        await API.post('/drivers/assign', { driverId: selectedDriver.id, bookingId: res.bookingId });

        // Save booking locally for tracking page
        localStorage.setItem('active_booking_id', res.bookingId);
        localStorage.setItem('active_booking', JSON.stringify({
            ...res.booking,
            driver: selectedDriver,
            userName: user.name || user.phone,
            userPhone: user.phone
        }));

        closeModal('confirmModal');
        showToast('🌸 Ride booked! Driver is on the way!', 'success');
        setTimeout(() => window.location.href = `tracking.html?bookingId=${res.bookingId}`, 1200);
    } catch (e) {
        showToast(e.message || 'Booking failed. Try again.', 'error');
    } finally {
        btn.classList.remove('loading'); btn.disabled = false;
    }
}

// ─── Demo Map (no API key) ─────────────────────────────────────────────────
function initDemoMap() {
    // This function is obsolete since we are using SafeHerMap Leaflet engine inherently.
    // Kept empty to satisfy previous inline bindings if they trigger manually.
}
