const cartLayout = document.querySelector('.cart-layout');
const cartList = document.querySelector('.cart-list');
const cartTotal = document.querySelector('.cart-total');
const cartCount = document.querySelector('.cart-count');

const renderCart = () => {
    const cart = getCart();

    // un panier vide cache le récapitulatif (voir le CSS)
    cartLayout.classList.toggle('is-empty', cart.length === 0);

    if (cart.length === 0) {
        cartList.innerHTML = `
            <div class="empty-cart">
                <i class="fa-solid fa-mug-hot"></i>
                <p>Your cart is empty</p>
                <a href="menu.html" class="btn">Browse the menu</a>
            </div>
        `;
        return;
    }

    cartList.innerHTML = cart.map(item => `
        <article class="cart-item" data-id="${item.id}">
            <div class="item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="item-info">
                <h3>${item.name}</h3>
                <p class="unit-price">$${item.price.toFixed(2)} each</p>
            </div>
            <div class="quantity-control">
                <button class="quantity-btn minus" aria-label="Decrease quantity">
                    <i class="fa-solid fa-minus"></i>
                </button>
                <span class="quantity-value">${item.quantity}</span>
                <button class="quantity-btn plus" aria-label="Increase quantity">
                    <i class="fa-solid fa-plus"></i>
                </button>
            </div>
            <p class="item-total">$${(item.price * item.quantity).toFixed(2)}</p>
            <button class="remove-btn" aria-label="Remove ${item.name}">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </article>
    `).join('');

    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    cartCount.textContent = totalQuantity;
    cartTotal.textContent = `$${totalPrice.toFixed(2)}`;
};

cartList.addEventListener('click', (e) => {
    const card = e.target.closest('.cart-item');
    if (!card || card.classList.contains('removing')) return;

    const id = Number(card.dataset.id);
    const cart = getCart();
    const item = cart.find(product => product.id === id);
    if (!item) return;

    if (e.target.closest('.plus')) {
        item.quantity += 1;
    } else if (e.target.closest('.minus')) {
        item.quantity -= 1;
    } else if (e.target.closest('.remove-btn')) {
        item.quantity = 0;
    } else {
        return;
    }

    // si l'article va disparaître : on joue l'animation d'abord
    if (item.quantity <= 0) {
        card.classList.add('removing');

        setTimeout(() => {
            saveCart(cart.filter(product => product.quantity > 0));
            renderCart();
        }, 350);   // même durée que la transition CSS
        return;
    }

    saveCart(cart);
    renderCart();
});

renderCart();