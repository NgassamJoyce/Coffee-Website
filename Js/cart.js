const CART_KEY = 'coffee-cart';     // le nom de la "case" dans le carnet

// lire le panier (renvoie [] s'il est vide ou illisible)
function getCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
        return [];
    }
}

// écrire le panier, puis mettre à jour le compteur et les boutons
function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
    syncCardButtons();
}

function addToCart(product) {
    const cart = getCart();
    const existing = cart.find(item => item.id === product.id);

    if (existing) {
        existing.quantity += 1;                 // déjà présent : +1
    } else {
        cart.unshift({                          // unshift = ajout au DÉBUT
            id: product.id,
            name: product.name,
            image: product.image,
            price: parseFloat(product.price),   // "30$" devient 30
            quantity: 1
        });
    }

    saveCart(cart);
    bumpCartBadge();                            // le compteur rebondit
    showToast(product.name);                    // le message apparaît
}

function updateCartBadge() {
    const badge = document.querySelector('.cart-value');
    if (!badge) return;

    const total = getCart().reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = total;
}

/* ===== Boutons "Add to Cart" : l'état suit le contenu du panier ===== */

function syncCardButtons() {
    const cart = getCart();

    document.querySelectorAll('.menu-item').forEach(card => {
        const btn = card.querySelector('.card-btn');
        const name = card.querySelector('.name');
        if (!btn || !name) return;

        const item = cart.find(product => product.name === name.textContent.trim());

        if (item) {
            btn.classList.add('in-cart');
            btn.innerHTML = '<i class="fas fa-check"></i> Added';
        } else {
            btn.classList.remove('in-cart');
            btn.textContent = 'Add to Cart';
        }
    });
}

// les cartes sont créées par menu.js / script.js après le chargement du JSON :
// on surveille la liste et on colore les boutons dès que les cartes apparaissent
const cardListEl = document.querySelector('.card-list');
if (cardListEl) {
    new MutationObserver(syncCardButtons).observe(cardListEl, { childList: true });
}

// retour en arrière avec le navigateur, ou panier modifié dans un autre onglet
window.addEventListener('pageshow', () => {
    updateCartBadge();
    syncCardButtons();
});
window.addEventListener('storage', () => {
    updateCartBadge();
    syncCardButtons();
});

/* ===== Retour visuel quand on ajoute un produit ===== */

// petit rebond du compteur de la navbar
function bumpCartBadge() {
    const badge = document.querySelector('.cart-value');
    if (!badge) return;

    badge.classList.remove('bump');
    void badge.offsetWidth;                     // relance l'animation même si on clique vite
    badge.classList.add('bump');
}

// message "produit ajouté"
let toastTimer;

function showToast(productName) {
    let toast = document.querySelector('.cart-toast');

    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'cart-toast';
        document.body.appendChild(toast);
    }

    toast.innerHTML = `
        <i class="fas fa-circle-check"></i>
        <span><strong></strong> added to your cart</span>
        <a href="./panier.html">View cart</a>
    `;
    toast.querySelector('strong').textContent = productName;

    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

updateCartBadge();   // au chargement de chaque page