// Hyderabad Geofencing with Turf.js polygon check
let turf;
try {
    turf = require('@turf/turf');
} catch (e) {
    turf = null;
}

// Hyderabad approximate bounding polygon (GeoJSON coordinates [lng, lat])
const HYDERABAD_POLYGON = {
    type: 'Feature',
    geometry: {
        type: 'Polygon',
        coordinates: [[
            [78.2060, 17.2000],
            [78.2060, 17.5500],
            [78.3500, 17.6200],
            [78.5200, 17.6500],
            [78.6500, 17.6000],
            [78.7500, 17.5500],
            [78.8000, 17.4500],
            [78.7800, 17.3000],
            [78.7000, 17.2200],
            [78.5500, 17.1500],
            [78.3800, 17.1500],
            [78.2500, 17.1800],
            [78.2060, 17.2000]
        ]]
    }
};

// Broad bounding box fallback
const HYDERABAD_BOUNDS = {
    north: 17.65,
    south: 17.15,
    east: 78.80,
    west: 78.20
};

/**
 * Check if a lat/lng point is within Hyderabad city limits
 * @param {number} lat
 * @param {number} lng
 * @returns {boolean}
 */
function isInHyderabad(lat, lng) {
    if (turf) {
        try {
            const point = turf.point([lng, lat]);
            return turf.booleanPointInPolygon(point, HYDERABAD_POLYGON);
        } catch (e) {
            return boundingBoxCheck(lat, lng);
        }
    }
    return boundingBoxCheck(lat, lng);
}

function boundingBoxCheck(lat, lng) {
    return (
        lat >= HYDERABAD_BOUNDS.south &&
        lat <= HYDERABAD_BOUNDS.north &&
        lng >= HYDERABAD_BOUNDS.west &&
        lng <= HYDERABAD_BOUNDS.east
    );
}

/**
 * Calculate distance between two points in km (Haversine)
 */
function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return deg * Math.PI / 180; }

module.exports = { isInHyderabad, getDistance };
