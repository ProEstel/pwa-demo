//generate content template
const imageData = [
    'images/archlinux/archlinux-aftermath.jpg',
    'images/archlinux/archlinux-aqua-vines.jpg',
    'images/archlinux/archlinux-arrival.jpg',
    'images/archlinux/archlinux-berry.jpg',
    'images/archlinux/archlinux-burn.jpg',
    'images/archlinux/archlinux-carbonite-knight.jpg',
    'images/archlinux/archlinux-deep-aurora.jpg',
    'images/archlinux/archlinux-ekisho-carbonite.jpg',
    'images/archlinux/archlinux-elation.jpg',
    'images/archlinux/archlinux-firestarter.jpg',
    'images/archlinux/archlinux-luminous-uber.jpg',
    'images/archlinux/archlinux-poison.jpg',
    'images/archlinux/archlinux-poolclouds.jpg',
    'images/archlinux/archlinux-simplyblack.png',
    'images/archlinux/archlinux-tribute.jpg',
    'images/archlinux/archlinux-underground.jpg'
];
let content = '';
for (let path of imageData) {
    content += `<div class="img-container"><img src="images/placeholder.jpg" tmp="${path}"/></div>`;
}
document.querySelector('#content').innerHTML = content;

//register a service worker
document.querySelector('#register').addEventListener('click', async () => {
    await navigator.serviceWorker.register('sw.js');
    console.log('Service Worker registered.');
});

//unregister all
document.querySelector('#unregister').addEventListener('click', async () => {
    let registrations = await navigator.serviceWorker.getRegistrations();
    console.log('Unregistering all service worker...');
    for (let reg of registrations) {
        reg.unregister();
    }
    clearCaches();
});

//clear all caches
document.querySelector('#clear').addEventListener('click', clearCaches);

async function clearCaches() {
    let keyList = await caches.keys();
    console.log('Clearing all caches...');
    for (let key of keyList) {
        caches.delete(key);
    }
}

//generate notification by constructor
document.querySelector('#notification').addEventListener('click', async () => {
    let result = await Notification.requestPermission();
    if (result === 'granted') {
        new Notification('Notification Demo', {
            body: '"Hello, World!" from Notification constructor.',
            icon: 'images/web.png'
        });
    }
});

//generate notification by ServiceWorkerRegistration.showNotification()
document.querySelector('#showNotification').addEventListener('click', async () => {
    let result = await Notification.requestPermission();
    if (result === 'granted') {
        let registration = await navigator.serviceWorker.ready;
        registration.showNotification('Notification Demo', {
            body: '"Hello, World!" from ServiceWorkerRegistration.showNotification()',
            icon: 'images/web.png'
        });
    }
});

//subscribe to mozilla autopush
document.querySelector('#subscribe').addEventListener('click', async () => {
    let registration = await navigator.serviceWorker.ready;
    subscribe(registration);
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
        if (res.ok) {
            let data = await res.text();
            console.log(`HTTP status code from push service: ${data}`);
            if (data === '401') {
                console.log('Push Service returned unauthorized, trying to fetch new key...');
                //try subscribe again
                await subscribe(registration);
            }
            if (!data.startsWith('20')) {
                new Notification('Push Demo', {
                    body: 'Error from push service, Please try again.'
                });
            }
        } else {
            console.warn(res.statusText);
        }
    } catch (e) {
        console.warn(e.message);
    }
});

async function subscribe(registration) {
    try {
        let subscription = await registration.pushManager.getSubscription();
        if (!!subscription) {
            console.log('Re-subscribing...');
            //if exists a subscription, unsubscribe first
            await subscription.unsubscribe();
        }
        //get public key
        let res = await fetch('/push-server/getKey');
        if (res.ok) {
            let publicKey = await res.arrayBuffer();
            //subscribe to push service
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: publicKey
            });
            console.log(subscription.toJSON());
        } else {
            console.warn(res.statusText);
        }
    } catch (e) {
        console.warn(e.message);
    }
}

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

//postMessage (Normal)
document.querySelector('#postMessage').addEventListener('click', () => {
    navigator.serviceWorker.controller.postMessage(helloText);
});
//message from service worker
navigator.serviceWorker.addEventListener('message', e => {
    console.log(`Message from ServiceWorker: ${e.data}`);
});

//postMessage (MessageChannel)
document.querySelector('#messageChannel').addEventListener('click', () => {
    let messageChannel = new MessageChannel();
    //message from port2
    messageChannel.port1.onmessage = e => {
        console.log(`Message from MessageChannel: ${e.data}`);
    }
    navigator.serviceWorker.controller.postMessage(hiText, [messageChannel.port2]);
});

//calc in Main Thread
document.querySelector('#calcMain').addEventListener('click', () => {
    console.time('main');
    console.log('From Main: ' + calc());
    console.timeEnd('main');
});
//calc in Worker
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