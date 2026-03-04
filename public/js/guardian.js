// SafeHerCab – Guardian Tracking JS
// Manages guardian toggle, link generation, and real-time guardian updates

const GuardianModule = (() => {
    let isTracking = false;
    let socket = null;

    function init(socketInstance) {
        socket = socketInstance;
        const storedState = localStorage.getItem('guardian_tracking') === 'true';
        isTracking = storedState;
    }

    function enable(bookingId) {
        isTracking = true;
        localStorage.setItem('guardian_tracking', 'true');
        if (socket) {
            socket.emit('guardianTrackingEnabled', { bookingId });
        }
    }

    function disable(bookingId) {
        isTracking = false;
        localStorage.setItem('guardian_tracking', 'false');
    }

    function getTrackingUrl(bookingId, token) {
        return `${window.location.origin}/guardian.html?bookingId=${bookingId}&token=${token}`;
    }

    function isEnabled() { return isTracking; }

    return { init, enable, disable, getTrackingUrl, isEnabled };
})();
