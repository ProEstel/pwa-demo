//generate content template
let content = '';
for (let path of imageData) {
    content += `<div class="img-container"><img src="/pwa-demo/images/placeholder.jpg" tmp="${path}"/></div>`;
}
document.querySelector('#content').innerHTML = content;

//register a service worker
document.querySelector('#register').addEventListener('click', async () => {
    await navigator.serviceWorker.register('/pwa-demo/sw.js');
    console.log('Service Worker registered.');
});

//unregister all
document.querySelector('#unregister').addEventListener('click', async () => {
    let registrations = await navigator.serviceWorker.getRegistrations();
    console.log('Unregistering all service worker...');
    for (let reg of registrations) {
        reg.unregister();
    }
});

//clear all caches
document.querySelector('#clear').addEventListener('click', async () => {
    let keyList = await caches.keys();
    console.log('Clearing all caches...');
    for (let key of keyList) {
        caches.delete(key);
    }
});

//generate notification
document.querySelector('#notification').addEventListener('click', async () => {
    let result = await Notification.requestPermission();
    if (result === 'granted') {
        new Notification('Notification Demo', {
            body: 'Hello, World!',
            icon: '/pwa-demo/images/web.png'
        });
    }
});

//subscribe to mozilla autopush
document.querySelector('#subscribe').addEventListener('click', async () => {
    try {
        let registration = await navigator.serviceWorker.ready;
        //get public key
        let res = await fetch('/push-server/getKey');
        let publicKey = await res.arrayBuffer();
        //subscribe to push service
        let subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: publicKey
        });
        console.log(subscription.toJSON());
    } catch (e) {
        console.warn(e.message);
    }
});

//trigger push
document.querySelector('#push').addEventListener('click', async () => {
    try {
        let registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        //send push request to push-server
        let res = await fetch('/push-server/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(subscription.toJSON())
        });
        let data = await res.text();
        console.log(data);
    } catch (e) {
        console.warn(e.message);
    }
});

//unsubscribe
document.querySelector('#unsubscribe').addEventListener('click', async () => {
    try {
        let registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        await subscription.unsubscribe();
        console.log('Unsubscribed.');
    } catch (e) {
        console.warn(e.message);
    }
});

//trigger sync: chrome only
document.querySelector('#sync').addEventListener('click', triggerSync);

window.addEventListener('beforeunload', triggerSync);

async function triggerSync() {
    try {
        let registration = await navigator.serviceWorker.ready;
        registration.sync.register(syncTag);
    } catch (e) {
        console.warn(e.message);
    }
}

//calc in Main Thread
document.querySelector('#calcMain').addEventListener('click', () => {
    console.time('main');
    console.log('From Main: ' + calc());
    console.timeEnd('main');
});
//calc in Service Worker
document.querySelector('#calcServiceWorker').addEventListener('click', () => {
    console.time('serviceworker');
    //It's just a demo, if you really want to do heavy work, you should use an independent Worker.
    navigator.serviceWorker.controller.postMessage('calc');
});
//message from service worker
navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.origin === location.origin) {
        console.log('From Service Worker: ' + e.data);
        console.timeEnd('serviceworker');
    }
});
//calc in Worker (recommended)
let calcWorker = new Worker('js/worker.js');
document.querySelector('#calcWorker').addEventListener('click', () => {
    console.time('worker');
    calcWorker.postMessage('calc');
});
calcWorker.addEventListener('message', (e) => {
    console.log('From Worker: ' + e.data);
    console.timeEnd('worker');
});

//loadimages
let observer = new IntersectionObserver((entries, observer) => {
    for (let entry of entries) {
        if (entry.isIntersecting) {
            let img = entry.target;
            img.setAttribute('src', img.getAttribute('tmp'));
            img.onload = () => {
                img.removeAttribute('tmp');
            };
            observer.unobserve(img);
        }
    }
});
let imgNodes = document.querySelectorAll('img[tmp]');
for (let img of imgNodes) {
    observer.observe(img);
}