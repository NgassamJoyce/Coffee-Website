const menuOpenButton = document.querySelector("#menu-open-button");
const menuCloseButton = document.querySelector("#menu-close-button");


menuOpenButton.addEventListener("click", () => {
  //Toggle mobile menu visibility
  document.body.classList.toggle("show-mobile-menu");
});

// close menu when the close button is clicked
menuCloseButton.addEventListener("click", () => menuOpenButton.click());

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

const cartIcon = document.querySelector('.cart-icon');
const cartTab = document.querySelector('.cart-tab');
const closeBtn = document.querySelector('.close-btn');
const cardList = document.querySelector('.card-list');
const cartList = document.querySelector('.cart-list');
const cartTotal = document.querySelector('.cart-total');
const cartValue = document.querySelector('.cart-value');



cartIcon.addEventListener('click', () => cartTab.classList.add('cart-tab-active'));
closeBtn.addEventListener('click', () => cartTab.classList.remove('cart-tab-active'));

let productList = [];
let cartProduct = [];

const updateTotals = () =>{

  let totalPrice = 0;
  let totalQuantity = 0;

  document.querySelectorAll('.item').forEach(item =>{
     
    const quantity = parseInt(item.querySelector('.quantity-value').textContent);
    const price = parseFloat(item.querySelector('.item-total').textContent.replace('$', ''));

    totalPrice += price;
    totalQuantity += quantity;
  });

  cartTotal.textContent = `$${totalPrice.toFixed(2)}`;
  cartValue.textContent = totalQuantity;
}

const showCards = () => {

  productList    
    .filter(product => product.category === 'coffee')
    .forEach(product => {

    const menuItem = document.createElement('li');
    menuItem.classList.add('menu-item');

    menuItem.innerHTML = `
    <div class="card-image">
      <img src="${product.image}">
    </div>
    <h3>${product.name}</h3>
    <p class="price">${product.price}</p>
    <button class="btn card-btn">
        Add to Cart
    </button>
    `;

    cardList.appendChild(menuItem);

    const cardBtn = menuItem.querySelector('.card-btn');
    cardBtn.addEventListener('click', (e) => {
      e.preventDefault();
      addToCart(product);

    });
  });
};

const addToCart = (product) => {

  const existingProduct = cartProduct.find(item => item.id === product.id);
  if (existingProduct) {

    alert('Item already in your cart!');
    return;
  }

  cartProduct.push(product);

  let quantity = 1;
  let price = parseFloat(product.price.replace('$', ''));

  const cartItem = document.createElement('div');
  cartItem.classList.add('item');

  cartItem.innerHTML = `
    <div class="item-image">
        <img src="${product.image}">
    </div>
    <div class="detail">
        <h3>${product.name}</h3>
        <h4 class="item-total">${product.price}</h4>
    </div>
    <div class="bouton">
        <a href="#" class="quantity-btn minus">
            <i class="fa-solid fa-minus"></i>
        </a>
        <h4 class="quantity-value">${quantity}</h4>
        <a href="#" class="quantity-btn plus">
            <i class="fa-solid fa-plus"></i>
        </a>
    </div>
  `;

  cartList.appendChild(cartItem);
  updateTotals();

  const plusBtn = cartItem.querySelector('.plus');
  const minusBtn = cartItem.querySelector('.minus');

  const quantityvalue = cartItem.querySelector('.quantity-value');
  const itemTotal = cartItem.querySelector('.item-total');


  plusBtn.addEventListener('click', (e) => {
    e.preventDefault();
    quantity++;
    quantityvalue.textContent = quantity;
    itemTotal.textContent = `$${(price * quantity).toFixed(2)}`;
    updateTotals();
  });

  minusBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (quantity > 1) {
      quantity--;
      quantityvalue.textContent = quantity;
      itemTotal.textContent = `$${(price * quantity).toFixed(2)}`;
    }
    else{
      cartItem.classList.add('slide-out');

      setTimeout(() =>{
        cartItem.remove();
        cartProduct = cartProduct.filter(item => item.id !== product.id);
        updateTotals();
      }, 300);
    } 

  })
}

const initApp = () => {
  fetch('products.json').then
    (response => response.json()).then
    (data => {

      productList = data;
      showCards();
    })
}

initApp();