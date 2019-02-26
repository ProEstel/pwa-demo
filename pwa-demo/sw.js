//ServiceWorkerGlobalScope.self
self.importScripts('js/data.js');

const version = 'v1';
const appShellList = [
    '/pwa-demo/',
    '/pwa-demo/index.html',
    '/pwa-demo/images/placeholder.jpg',
    '/pwa-demo/images/web.png',
    '/pwa-demo/js/app.js',
    '/pwa-demo/js/data.js'
];

let cacheList = imageData.concat(appShellList);

//install
self.addEventListener('install', (e) => {
    console.log('Service Worker installing...');
    //hold the service worker until tasks complete
    e.waitUntil(
        //caches is a CacheStorage object of ServiceWorkerGlobalScope
        caches.open(version).then((cache) => {
            return cache.addAll(cacheList);
        })
    );
    console.log('Service Worker cached all.');
});

//fetch
self.addEventListener('fetch', (e) => {
    console.log('Service Worker fetching...');
    //intercept request and return custom respond
    e.respondWith(
        (async () => {
            let response = await caches.match(e.request);
            if (!response) {
                //if no match then fetch and cache
                response = await fetch(e.request);
                let cache = await caches.open(version);
                await cache.put(e.request, response.clone());
                console.log(`Service Worker cached missing resource: ${e.request.url}`);
            }
            return response;
        })()
    );
});

//activate
self.addEventListener('activate', (e) => {
    console.log('Service Worker activate triggered.');
    e.waitUntil(
        (async () => {
            let keyList = await caches.keys();
            return Promise.all(
                keyList.map(async (key) => {
                    if (version !== key) {
                        //delete other version
                        let result = await caches.delete(key);
                        console.log('Service Worker deleted cache: ' + key);
                        return result;
                    }
                })
            )
        })()
    )
});

//push
self.addEventListener('push', (e) => {
    let payload = e.data ? e.data.text() : 'no payload';
    e.waitUntil(
        self.registration.showNotification('Push Demo', {
            body: payload,
        })
    );
});

//sync
self.addEventListener('sync', (e) => {
    console.log(e.tag);
    if (e.tag === syncTag) {
        e.waitUntil(
            (async () => {
                let res = await fetch('/push-server/sync');
                let data = await res.text();
                self.registration.showNotification('Sync Demo', {
                    body: data,
                });
            })()
        );
    } else {
        console.log('Sync tag does not match, skipped.');
    }
});