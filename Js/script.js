//Initialize Swiper
const swiper = new Swiper('.slider-wrapper', {
  loop: true,
  grabCursor: true,
  spaceBetween: 25,

  // If we need pagination
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
    dynamicBullets: true,
  },

  // Navigation arrows
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },

  //Responsive breakpoints
  breakpoints: {
    0: {
      slidesPerView: 1
    },
    768: {
      slidesPerView: 2
    },
    1024: {
      slidesPerView: 3
    },
  }
});

const aboutSwiper = new Swiper('.about-swiper', {
    loop: true,
    effect: 'fade',                              // fondu entre les slides
    fadeEffect: { crossFade: true },
    speed: 800,                                  // durée du fondu (ms)
    autoplay: {
        delay: 5000,                             // 5 secondes par slide
        disableOnInteraction: false,             // continue après un clic sur les points
        pauseOnMouseEnter: true                  // pause quand la souris est dessus
    },
    pagination: {
        el: '.about-swiper .swiper-pagination',
        clickable: true
    }
});



const cartIcon = document.querySelector('.cart-icon');
const cartTab = document.querySelector('.cart-tab');
const closeBtn = document.querySelector('.close-btn');
const cardList = document.querySelector('.card-list');
const cartList = document.querySelector('.cart-list');
const cartTotal = document.querySelector('.cart-total');
const cartValue = document.querySelector('.cart-value');


// for the your cart section 

let productList = [];

const showCards = () => {
    productList
        .filter(product => product.category === 'coffee')
        .forEach(product => {
            const menuItem = document.createElement('li');
            menuItem.classList.add('menu-item');

            menuItem.innerHTML = `
                <div class="card-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <h3 class="name">${product.name}</h3>
                <p class="price">${product.price}</p>
                <button class="btn card-btn">Add to Cart</button>
            `;

            cardList.appendChild(menuItem);

            // le clic envoie le produit dans le panier
            menuItem.querySelector('.card-btn').addEventListener('click', () => addToCart(product));
        });
};

fetch('products.json')
    .then(response => response.json())
    .then(data => {
        productList = data;
        showCards();
    })
    .catch(error => console.error('Erreur de chargement :', error));
