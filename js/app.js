//generate content template
let content = '';
imageData.forEach((name)=>{
    content += `<img src="${name}"/>`;
});
document.querySelector('#content').innerHTML = content;

//register ServiceWorker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/pwa-demo/sw.js').then(() => {
        console.log('Service Worker registered.');
    });
} else {
    console.warn('Does not support ServiceWorker!');
};
