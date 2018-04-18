// Initialize service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(function(registration) {
            // Registration was successful
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
            listenForWaitingServiceWorker(registration, promptUserToRefresh);
        }, function(err) {
            // registration failed :(
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

function listenForWaitingServiceWorker(reg, callback) {
    function awaitStateChange() {
        reg.installing.addEventListener('statechange', function() {
            if (this.state === 'installed') callback(reg);
        });
    }
    if (!reg) return;
    if (reg.waiting) return callback(reg);
    if (reg.installing) awaitStateChange();
    reg.addEventListener('updatefound', awaitStateChange);
}

// reload once when the new Service Worker starts activating
var refreshing;
navigator.serviceWorker.addEventListener('controllerchange',
function() {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
}
);
function promptUserToRefresh(reg) {
    // this is just an example
    // don't use window.confirm in real life; it's terrible
    if (window.confirm("New version available! OK to refresh?")) {
        reg.waiting.postMessage('skipWaiting');
    }
}