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



/* ===== Formulaire de contact ===== */
const contactForm = document.querySelector('#contact-form');

if (contactForm) {
  const rules = {
    name: value => value.trim().length >= 4
      ? '' : 'Please enter your name (at least 4 characters).',
    email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
      ? '' : 'Please enter a valid email address.',
    message: value => value.trim().length >= 10
      ? '' : 'Your message should be at least 10 characters.'
  };

  const fields = contactForm.querySelectorAll('input, textarea');
  const submitBtn = contactForm.querySelector('.contact-btn');
  const submitBtnHTML = submitBtn.innerHTML;

  // vérifie un champ et affiche ou efface son message d'erreur
  function validateField(field) {
    const group = field.closest('.form-group');
    const error = rules[field.id](field.value);

    group.classList.toggle('has-error', error !== '');
    group.querySelector('.error-msg').textContent = error;
    field.setAttribute('aria-invalid', error !== '' ? 'true' : 'false');

    return error === '';
  }

  fields.forEach(field => {
    // on vérifie quand le client quitte le champ
    field.addEventListener('blur', () => validateField(field));

    // puis on efface l'erreur dès qu'il corrige
    field.addEventListener('input', () => {
      if (field.closest('.form-group').classList.contains('has-error')) {
        validateField(field);
      }
    });
  });

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    let firstInvalid = null;
    fields.forEach(field => {
      if (!validateField(field) && !firstInvalid) firstInvalid = field;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    // petit temps d'attente pour simuler l'envoi
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    setTimeout(() => {
      const rawName = contactForm.querySelector('#name').value.trim().split(' ')[0];
      const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
      contactForm.querySelector('.sent-name').textContent = firstName;
      contactForm.classList.add('is-sent');
    }, 900);
  });

  // bouton "Send another message" : on remet le formulaire à zéro
  contactForm.querySelector('.send-again').addEventListener('click', () => {
    contactForm.reset();
    contactForm.classList.remove('is-sent');
    submitBtn.disabled = false;
    submitBtn.innerHTML = submitBtnHTML;
  });
}    
