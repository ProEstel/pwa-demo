//generate content template
let content = '';
imageData.forEach((name) => {
    content += `<img src="${name}"/>`;
});
document.querySelector('#content').innerHTML = content;

//register a service worker
document.querySelector('#register').addEventListener('click', async () => {
    try {
        navigator.serviceWorker.register('/pwa-demo/sw.js');
        let registration = await navigator.serviceWorker.ready;
        console.log('Service Worker registered.');
        //get public key
        let res = await fetch('/push-server/getKey');
        let publicKey = await res.text();
        console.log('Public Key: ' + publicKey);
        //subscribe to push service
        let subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey)
        });
        console.log(subscription.toJSON());
    } catch (e) {
        console.warn(e.message);
    }
});

//unregister all
document.querySelector('#unregister').addEventListener('click', async () => {
    let registrations = await navigator.serviceWorker.getRegistrations();
    console.log('Unregistering all service worker...');
    registrations.forEach((reg) => {
        reg.unregister();
    });
});

//clear all caches
document.querySelector('#clear').addEventListener('click', async () => {
    let keyList = await caches.keys();
    console.log('Clearing all caches...');
    keyList.forEach((key) => {
        caches.delete(key);
    });
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

//generate notification
document.querySelector('#push').addEventListener('click', async () => {
    try {
        let registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        //send subscription to push-server
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

//from Mozilla's serviceworker-cookbook https://github.com/mozilla/serviceworker-cookbook.git
function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}