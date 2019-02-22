//ServiceWorkerGlobalScope.self
self.importScripts('js/data.js');

const version = 'v4';
const appShellList = [
    '/pwa-demo/',
    '/pwa-demo/index.html',
    '/pwa-demo/images/web.png',
    '/pwa-demo/js/app.js',
    '/pwa-demo/js/data.js'
];

let cacheList = imageData.concat(appShellList);

//install
self.addEventListener('install', (e)=>{
    console.log('Service Worker installing...');
    //hold the service worker until tasks complete
    e.waitUntil(
        //caches is a CacheStorage object of ServiceWorkerGlobalScope
        caches.open(version).then((cache)=>{
            return cache.addAll(cacheList);
        })
    );
    console.log('Service Worker cached all.');
});

//fetch
self.addEventListener('fetch', (e) => {
    console.log(e.request.url);
    e.respondWith(
        caches.match(e.request).then((response)=>{
            return response || fetch(e.request);
        })
    );
});

//activate
self.addEventListener('activate', (e) => {
    console.log('Service Worker activate event.');
    e.waitUntil(
        caches.keys().then(function (keyList) {
            return Promise.all(
                keyList.map(function (key) {
                    if (version !== key) {
                        return caches.delete(key);
                    }
                })
            );
        })
    )
});