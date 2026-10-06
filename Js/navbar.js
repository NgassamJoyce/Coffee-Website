const menuOpenButton = document.querySelector('#menu-open-button');
const menuCloseButton = document.querySelector('#menu-close-button');
const navLinks = document.querySelectorAll('.nav-menu .nav-link');

// bouton hamburger : ouvre/ferme le menu
menuOpenButton.addEventListener('click', () => {
    document.body.classList.toggle('show-mobile-menu');
});

// bouton croix : ferme le menu
menuCloseButton.addEventListener('click', () => {
    document.body.classList.remove('show-mobile-menu');
});

// un clic sur un lien ferme aussi le menu
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        document.body.classList.remove('show-mobile-menu');
    });
});