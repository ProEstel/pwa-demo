const images = [
    'archlinux-aftermath.jpg',
    'archlinux-aqua-vines.jpg',
    'archlinux-arrival.jpg',
    'archlinux-berry.jpg',
    'archlinux-burn.jpg',
    'archlinux-carbonite-knight.jpg',
    'archlinux-deep-aurora.jpg',
    'archlinux-ekisho-carbonite.jpg',
    'archlinux-elation.jpg',
    'archlinux-firestarter.jpg',
    'archlinux-luminous-uber.jpg',
    'archlinux-poison.jpg',
    'archlinux-poolclouds.jpg',
    'archlinux-simplyblack.png',
    'archlinux-tribute.jpg',
    'archlinux-underground.jpg'
];

let content = '';
images.forEach(function (name) {
    content += `<img src="images/archlinux/${name}"/>`;
});
document.querySelector('#content').innerHTML = content;


