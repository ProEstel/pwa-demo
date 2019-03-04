//ServiceWorkerGlobalScope.self
self.importScripts('js/global.js');

const version = 'v1';
const appShellList = [
    './',
    'index.html',
    'images/placeholder.jpg',
    'images/web.png',
    'js/app.js',
    'js/global.js',
    'js/worker.js',
    'pwa-demo.webmanifest'
];

//install
self.addEventListener('install', (e) => {
    console.log('Service Worker installing...');
    //hold the service worker until tasks complete
    e.waitUntil(
        //caches is a CacheStorage object of ServiceWorkerGlobalScope
        caches.open(version).then((cache) => {
            return cache.addAll(appShellList);
        })
    );
    //skip waiting to force activate
    //self.skipWaiting();
    console.log('Service Worker cached app shell.');
});

//fetch
self.addEventListener('fetch', (e) => {
    if (!e.request.url.includes('/push-server/')) {
        console.log('Service Worker fetching...');
        //intercept request and return custom respond
        e.respondWith(
            (async () => {
                let response = await caches.match(e.request);
                if (!response) {
                    //if no match then fetch and cache
                    response = await fetch(e.request, {
                        cache: "reload"
                    });
                    if (response.ok) {
                        let cache = await caches.open(version);
                        await cache.put(e.request, response.clone());
                        console.log(`Service Worker cached missing resource: ${e.request.url}`);
                    }
                }
                return response;
            })()
        );
    }
});

//activate
self.addEventListener('activate', (e) => {
    console.log('Service Worker activate triggered.');
    e.waitUntil(
        (async () => {
            //claim control of all clients
            await self.clients.claim();
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
            );
        })()
    )
});

//notificationclick
self.addEventListener('notificationclick', (e) => {
    console.log(`Notification "${e.notification.title}" clicked.`);
});
//notificationclose
self.addEventListener('notificationclose', (e) => {
    console.log(`Notification "${e.notification.title}" closed.`);
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

//pushsubscriptionchange
self.addEventListener('pushsubscriptionchange', (e) => {
    console.log('Push Subscription Changed.');
    e.waitUntil(
        (async () => {
            try {
                //get public key
                let res = await fetch('/push-server/getKey');
                let publicKey = await res.arrayBuffer();
                //subscribe to push service
                let subscription = await self.registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: publicKey
                });
                console.log(subscription.toJSON());
            } catch (e) {
                console.warn(e.message);
            }
        })()
    );
})

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

//message
self.addEventListener('message', async (e) => {
    if (e.data === 'calc') {
        e.waitUntil(
            (async () => {
                let result = calc();
                let clientList = await self.clients.matchAll();
                for (let client of clientList) {
                    client.postMessage(result);
                }
            })()
        );
    }
});