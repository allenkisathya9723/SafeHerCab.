// SafeHerCab – Core App JavaScript
// API client, auth utilities, toast, modal, and common helpers

const BASE_URL = '/api';

// ─── API Client ──────────────────────────────────────────────────────────────
const API = {
    async request(method, path, body = null, adminMode = false) {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('safehercab_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (adminMode) headers['x-admin-secret'] = sessionStorage.getItem('admin_secret') || 'safehercab_admin_2024';

        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        const res = await fetch(`${BASE_URL}${path}`, options);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        return data;
    },
    get: (path, admin) => API.request('GET', path, null, admin),
    post: (path, body) => API.request('POST', path, body),
    patch: (path, body) => API.request('PATCH', path, body),
    put: (path, body) => API.request('PUT', path, body),
};

// ─── Auth Guard ───────────────────────────────────────────────────────────────
function requireAuth() {
    const token = localStorage.getItem('safehercab_token');
    if (!token) {
        const guard = document.getElementById('authGuard');
        if (guard) { guard.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
        else window.location.href = 'auth.html';
        return false;
    }
    return true;
}

function logout() {
    localStorage.removeItem('safehercab_token');
    localStorage.removeItem('safehercab_user');
    localStorage.removeItem('active_booking');
    localStorage.removeItem('active_booking_id');
    window.location.href = 'auth.html';
}

// ─── Toast Notifications ──────────────────────────────────────────────────────
function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span style="font-size:1.1rem">${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 350);
    }, duration);
}

// ─── Modal Helpers ─────────────────────────────────────────────────────────────
function openModal(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('open'); document.body.style.overflow = ''; }
}
// Close modal on overlay click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) closeModal(e.target.id);
});

// ─── Category Icons ───────────────────────────────────────────────────────────
const CATEGORY_ICONS = {
    'Landmark': '🏛️', 'Temple': '🛕', 'Engineering College': '🎓', 'Medical College': '🏥',
    'School': '🏫', 'Restaurant': '🍽️', 'IT Hub': '💻', 'Area': '📍',
    'Hospital': '🏨', 'Mall': '🛍️', 'Metro': '🚇', 'Bus Station': '🚌',
    'Railway': '🚂', 'Entertainment': '🎬', 'Park': '🌳', 'Tourist Place': '📸',
    'default': '📍'
};

// ─── Location Autocomplete (API-backed) ───────────────────────────────────────
let autocompleteCache = {}; // Simple in-memory cache for debounce

function autocomplete(inputEl, suggestionsEl) {
    let debounceTimer;
    inputEl.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const val = inputEl.value.trim();
        if (val.length < 2) { suggestionsEl.style.display = 'none'; return; }

        // Show loading hint
        suggestionsEl.innerHTML = '<div class="suggestion-item" style="color:var(--gray-400);cursor:default"><i class="fa-solid fa-spinner fa-spin"></i> Searching...</div>';
        suggestionsEl.style.display = 'block';

        debounceTimer = setTimeout(async () => {
            // Use cache if available
            if (autocompleteCache[val]) {
                renderSuggestions(autocompleteCache[val], suggestionsEl, inputEl.id);
                return;
            }
            try {
                const res = await fetch(`/api/booking/search?q=${encodeURIComponent(val)}&limit=7`);
                const data = await res.json();
                const places = data.locations || [];
                autocompleteCache[val] = places;
                renderSuggestions(places, suggestionsEl, inputEl.id);
            } catch (e) {
                // Fallback: filter from a small default list
                const fallback = ['Banjara Hills', 'Jubilee Hills', 'Madhapur', 'Gachibowli', 'HITEC City',
                    'Kondapur', 'Ameerpet', 'Kukatpally', 'Miyapur', 'Uppal', 'Dilsukhnagar', 'Charminar',
                    'Secunderabad', 'LB Nagar', 'Kompally', 'Mehdipatnam', 'Nampally', 'Begumpet']
                    .filter(a => a.toLowerCase().includes(val.toLowerCase())).slice(0, 6)
                    .map(name => ({ name, category: 'Area' }));
                renderSuggestions(fallback, suggestionsEl, inputEl.id);
            }
        }, 200);
    });
    document.addEventListener('click', (e) => {
        if (!inputEl.contains(e.target) && !suggestionsEl.contains(e.target)) {
            suggestionsEl.style.display = 'none';
        }
    });
}

function renderSuggestions(places, suggestionsEl, inputId) {
    if (!places.length) { suggestionsEl.style.display = 'none'; return; }
    suggestionsEl.innerHTML = places.map(p => {
        const icon = CATEGORY_ICONS[p.category] || CATEGORY_ICONS.default;
        const safeName = p.name.replace(/'/g, "\\'");
        return `<div class="suggestion-item" onclick="selectSuggestion('${safeName}', '${inputId}', '${suggestionsEl.id}', ${p.lat || 0}, ${p.lon || 0})">
      <span style="font-size:1rem;flex-shrink:0">${icon}</span>
      <div>
        <div style="font-size:0.88rem;font-weight:500">${p.name}</div>
        <div style="font-size:0.75rem;color:var(--gray-400)">${p.category} · Hyderabad</div>
      </div>
    </div>`;
    }).join('');
    suggestionsEl.style.display = 'block';
}

function selectSuggestion(name, inputId, suggId, lat = 0, lon = 0) {
    const input = document.getElementById(inputId);
    const sugg = document.getElementById(suggId);
    if (input) {
        input.value = name;
        // Store coords on the element for booking.js to pick up
        if (lat && lon) { input.dataset.lat = lat; input.dataset.lon = lon; }
    }
    if (sugg) sugg.style.display = 'none';
    input?.dispatchEvent(new CustomEvent('locationSelected', { bubbles: true, detail: { name, lat, lon } }));
}

// ─── Network Failure Detection ─────────────────────────────────────────────────
window.addEventListener('online', () => {
    showToast('✅ Internet restored. All systems normal.', 'success');
    if (typeof SafetyEngine !== 'undefined' && SafetyEngine.OfflineSafety) {
        SafetyEngine.OfflineSafety.onOnline();
    }
});
window.addEventListener('offline', () => {
    showToast('⚠️ Internet lost! Safety monitoring is now running offline.', 'error', 8000);
    if (typeof SafetyEngine !== 'undefined' && SafetyEngine.OfflineSafety) {
        SafetyEngine.OfflineSafety.onOffline();
    }
});

// ─── User Info Helper ─────────────────────────────────────────────────────────
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('safehercab_user') || '{}');
}

function getToken() {
    return localStorage.getItem('safehercab_token');
}

// ─── Format helpers ───────────────────────────────────────────────────────────
function formatTime(mins) {
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function formatCurrency(amount) {
    return `₹${Math.round(amount)}`;
}

// ─── Stars renderer ───────────────────────────────────────────────────────────
function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
}
