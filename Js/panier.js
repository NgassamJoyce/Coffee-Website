const cartLayout = document.querySelector('.cart-layout');
const cartList = document.querySelector('.cart-list');
const cartCount = document.querySelector('.cart-count');
const cartSubtotal = document.querySelector('.cart-subtotal');
const cartTotal = document.querySelector('.cart-total');

const clearBtn = document.querySelector('.clear-cart-btn');
const clearDialog = document.querySelector('#clear-dialog');
const clearText = document.querySelector('#clear-text');
const clearCancel = document.querySelector('#clear-cancel');
const clearConfirm = document.querySelector('#clear-confirm');


const money = n => Math.round(n) + '\u00A0FCFA';

const escapeHTML = str => String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));



function renderTotals(cart) {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    cartCount.textContent = count;
    cartSubtotal.textContent = money(subtotal);
    cartTotal.textContent = money(subtotal);
}


/* ===== Affichage du panier ===== */
const renderCart = () => {
    const cart = getCart();

    cartLayout.classList.toggle('is-empty', cart.length === 0);

    renderTotals(cart);

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
            <a class="item-image" href="menu.html?product=${item.id}"
               aria-label="Show ${escapeHTML(item.name)} on the menu" title="See on the menu">
                <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}">
            </a>
            <div class="item-info">
                <h3><a href="menu.html?product=${item.id}">${escapeHTML(item.name)}</a></h3>
                <p class="unit-price">${money(item.price)} each</p>
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
            <p class="item-total">${money(item.price * item.quantity)}</p>
            <button class="remove-btn" aria-label="Remove ${escapeHTML(item.name)}">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </article>
    `).join('');
};


/* ===== Quantités et suppression ===== */
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
        }, 350);  
        return;
    }

    saveCart(cart);
    renderCart();
});



let lastFocus = null;

function openClearDialog() {
    const count = getCart().reduce((sum, item) => sum + item.quantity, 0);

    clearText.textContent =
        `All ${count} ${count === 1 ? 'item' : 'items'} will be removed from your cart. This cannot be undone.`;

    lastFocus = document.activeElement;
    clearDialog.hidden = false;
    document.body.style.overflow = 'hidden';

    clearCancel.focus();
}

function closeClearDialog() {
    clearDialog.hidden = true;
    document.body.style.overflow = '';

    if (lastFocus) lastFocus.focus();
}

clearBtn.addEventListener('click', openClearDialog);
clearCancel.addEventListener('click', closeClearDialog);

clearDialog.addEventListener('click', (e) => {
    if (e.target === clearDialog) closeClearDialog();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !clearDialog.hidden) closeClearDialog();
});

clearConfirm.addEventListener('click', () => {
    closeClearDialog();

    const cards = cartList.querySelectorAll('.cart-item');
    cards.forEach((card, i) => {
        card.style.transitionDelay = (i * 60) + 'ms';
        card.classList.add('removing');
    });

    setTimeout(() => {
        saveCart([]);
        renderCart();
    }, 350 + cards.length * 60);
});

renderCart();