var CACHE = "budget-floor-v1";
var SHELL = ["/", "/assets/app.js", "/assets/dinners.js", "/assets/site.css", "/data/prices.json", "/manifest.webmanifest"];

self.addEventListener("install", function (event) {
    event.waitUntil(caches.open(CACHE).then(function (cache) {
        return cache.addAll(SHELL);
    }));
    self.skipWaiting();
});

self.addEventListener("activate", function (event) {
    event.waitUntil(caches.keys().then(function (keys) {
        return Promise.all(keys.filter(function (key) {
            return key !== CACHE;
        }).map(function (key) {
            return caches.delete(key);
        }));
    }).then(function () {
        return self.clients.claim();
    }));
});

self.addEventListener("fetch", function (event) {
    var request = event.request;
    if (request.method !== "GET") return;
    var url;
    try {
        url = new URL(request.url);
    } catch (e) {
        return;
    }
    if (url.origin !== self.location.origin) return;
    event.respondWith(fetch(request).then(function (response) {
        if (response && response.ok) {
            var copy = response.clone();
            caches.open(CACHE).then(function (cache) {
                cache.put(request, copy);
            });
        }
        return response;
    }).catch(function () {
        return caches.match(request).then(function (cached) {
            return cached || caches.match("/");
        });
    }));
});
