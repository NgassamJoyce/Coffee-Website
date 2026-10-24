(function () {
    const MAX_QTY = 20;

    // noms affichés pour chaque catégorie de products.json
    const CATEGORY_LABELS = {
        'coffee': 'Coffee',
        'cold-drinks': 'Cold Drinks',
        'hot-drinks': 'Hot Drinks',
        'pastries': 'Pastries',
        'meals': 'Meals'
    };

    // description par défaut (si le produit n'a pas de champ "description" dans products.json)
    const DEFAULT_DESCRIPTIONS = {
        'coffee': 'Freshly brewed with carefully selected beans and made to order, just the way you like it.',
        'cold-drinks': 'Cold, fresh and refreshing. Prepared to order with plenty of ice.',
        'hot-drinks': 'A warm and comforting cup, prepared fresh for you.',
        'pastries': 'Baked fresh every day and served warm. Perfect with your coffee.',
        'meals': 'A generous, freshly prepared dish made with quality ingredients.'
    };
    const FALLBACK_DESCRIPTION = 'Made fresh to order with quality ingredients.';

    const cardList = document.querySelector('.card-list');
    const tabs = document.querySelectorAll('.tab-btn');
    const searchInput = document.querySelector('#menu-search');
    const searchClear = document.querySelector('.search-clear');
    const sortSelect = document.querySelector('#menu-sort');
    const countEl = document.querySelector('#results-count');
    const emptyBox = document.querySelector('.menu-empty');
    const emptyText = document.querySelector('.menu-empty-text');
    const errorBox = document.querySelector('.menu-error');

    // fenêtre de détail
    const modal = document.querySelector('#product-modal');
    const pmImg = document.querySelector('#pm-img');
    const pmCategory = document.querySelector('#pm-category');
    const pmName = document.querySelector('#pm-name');
    const pmPrice = document.querySelector('#pm-price');
    const pmDesc = document.querySelector('#pm-desc');
    const pmInCart = document.querySelector('#pm-incart');
    const pmQty = document.querySelector('#pm-qty');
    const pmMinus = document.querySelector('#pm-minus');
    const pmPlus = document.querySelector('#pm-plus');
    const pmAdd = document.querySelector('#pm-add');
    const hasDialog = modal && typeof modal.showModal === 'function';

    let productList = [];
    const state = { category: 'all', query: '', sort: 'default' };

    const money = n => '$' + n.toFixed(2);
    const priceOf = p => parseFloat(p.price) || 0;

    const escapeHTML = str => String(str).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

    // minuscules + sans accents : "Ménthe" et "menthe" sont pareils
    const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');


    /* ===== Squelette de chargement ===== */
    function renderSkeleton(count = 8) {
        cardList.classList.add('instant');
        cardList.innerHTML = Array.from({ length: count }, () => `
            <li class="skeleton-card" aria-hidden="true">
                <div class="sk sk-img"></div>
                <div class="sk sk-name"></div>
                <div class="sk sk-price"></div>
                <div class="sk sk-btn"></div>
            </li>
        `).join('');
    }


    /* ===== Filtrer et trier ===== */
    function getVisible() {
        let list = productList.filter(p =>
            state.category === 'all' || p.category === state.category
        );

        const q = norm(state.query.trim());
        if (q) {
            list = list.filter(p =>
                norm(p.name).includes(q) ||
                norm(CATEGORY_LABELS[p.category] || p.category).includes(q)
            );
        }

        if (state.sort === 'price-asc') list.sort((a, b) => priceOf(a) - priceOf(b));
        if (state.sort === 'price-desc') list.sort((a, b) => priceOf(b) - priceOf(a));
        if (state.sort === 'name-asc') list.sort((a, b) => a.name.localeCompare(b.name));

        return list;
    }

    function countText(n) {
        const base = n === 1 ? '1 item' : n + ' items';
        const q = state.query.trim();
        return q ? base + ' found for “' + q + '”' : 'Showing ' + base;
    }


    /* ===== Affichage des cartes ===== */
    function createCard(product) {
        const li = document.createElement('li');
        li.className = 'menu-item';
        li.id = `product-${product.id}`;
        li.dataset.id = product.id;

        li.innerHTML = `
            <div class="card-image" role="button" tabindex="0" aria-label="View details of ${escapeHTML(product.name)}">
                <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" loading="lazy">
            </div>
            <h3 class="name">${escapeHTML(product.name)}</h3>
            <p class="price">${escapeHTML(product.price)}</p>
            <button type="button" class="btn card-btn">Add to Cart</button>
        `;

        li.querySelector('.card-btn').addEventListener('click', () => addToCart(product));
        return li;
    }

    // animate = false quand le client tape dans la recherche (sinon tout clignote à chaque lettre)
    function render(animate = true) {
        cardList.classList.toggle('instant', !animate);
        cardList.innerHTML = '';

        const items = getVisible();
        items.forEach(product => cardList.appendChild(createCard(product)));

        emptyBox.hidden = items.length > 0;
        if (items.length === 0) {
            emptyText.textContent = state.query.trim()
                ? 'No result for “' + state.query.trim() + '”. Try another word or another category.'
                : 'Nothing in this category yet.';
        }

        countEl.textContent = countText(items.length);

        // colore les boutons des produits déjà dans le panier (fonction de cart.js)
        if (typeof syncCardButtons === 'function') syncCardButtons();
    }


    /* ===== Catégories, recherche, tri ===== */
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.category = tab.dataset.category;
            render(true);
        });
    });

    searchInput.addEventListener('input', () => {
        state.query = searchInput.value;
        searchClear.hidden = searchInput.value === '';
        render(false);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchInput.value) {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
        }
    });

    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
        searchInput.focus();
    });

    sortSelect.addEventListener('change', () => {
        state.sort = sortSelect.value;
        render(true);
    });

    document.querySelector('.reset-filters').addEventListener('click', () => {
        state.category = 'all';
        state.query = '';
        state.sort = 'default';

        searchInput.value = '';
        searchClear.hidden = true;
        sortSelect.value = 'default';
        tabs.forEach(t => t.classList.toggle('active', t.dataset.category === 'all'));

        render(true);
    });


    /* ===== Fenêtre de détail produit ===== */
    let current = null;
    let qty = 1;

    function updateModal() {
        pmQty.textContent = qty;
        pmMinus.disabled = qty <= 1;
        pmPlus.disabled = qty >= MAX_QTY;

        const total = priceOf(current) * qty;
        pmAdd.innerHTML = '<i class="fas fa-bag-shopping"></i> Add '
            + (qty > 1 ? qty + ' ' : '') + 'to cart · ' + money(total);
    }

    function openModal(product) {
        if (!hasDialog) return;

        current = product;
        qty = 1;

        pmImg.src = product.image;
        pmImg.alt = product.name;
        pmCategory.textContent = CATEGORY_LABELS[product.category] || product.category;
        pmName.textContent = product.name;
        pmPrice.textContent = money(priceOf(product));
        pmDesc.textContent = product.description
            || DEFAULT_DESCRIPTIONS[product.category]
            || FALLBACK_DESCRIPTION;

        // déjà dans le panier ?
        const inCart = getCart().find(item => item.id === product.id);
        pmInCart.hidden = !inCart;
        if (inCart) {
            pmInCart.innerHTML = '<i class="fas fa-check"></i> Already in your cart ('
                + inCart.quantity + ')';
        }

        updateModal();
        document.body.classList.add('modal-open');
        modal.showModal();
    }

    if (hasDialog) {
        // clic sur l'image ou le nom d'une carte (les cartes sont créées après coup)
        cardList.addEventListener('click', (e) => {
            const trigger = e.target.closest('.card-image, .name');
            if (!trigger) return;

            const li = trigger.closest('.menu-item');
            const product = li && productList.find(p => String(p.id) === li.dataset.id);
            if (product) openModal(product);
        });

        // touche Entrée ou Espace sur l'image (navigation au clavier)
        cardList.addEventListener('keydown', (e) => {
            if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.card-image')) {
                e.preventDefault();
                e.target.click();
            }
        });

        pmMinus.addEventListener('click', () => {
            if (qty > 1) { qty--; updateModal(); }
        });

        pmPlus.addEventListener('click', () => {
            if (qty < MAX_QTY) { qty++; updateModal(); }
        });

        pmAdd.addEventListener('click', () => {
            const product = current;
            const quantity = qty;

            modal.close();                   // on ferme d'abord pour que le message d'ajout soit visible
            addToCart(product, quantity);
        });

        modal.querySelector('.pm-close').addEventListener('click', () => modal.close());

        // clic en dehors de la fiche : on ferme
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.close();
        });

        modal.addEventListener('close', () => {
            document.body.classList.remove('modal-open');
        });
    }

    /* ===== Aller directement à un produit (adresse se terminant par #product-12) ===== */
    function scrollToProduct() {
        const id = window.location.hash.slice(1);
        if (!id) return;

        const card = document.getElementById(id);
        if (!card) return;

        card.scrollIntoView({ behavior: 'smooth', block: 'center' });

        card.classList.add('highlight');                 // halo pour repérer la carte
        setTimeout(() => card.classList.remove('highlight'), 2500);
    }

       /* ===== Arrivée depuis le panier : aller au produit et le mettre en évidence ===== */
    function focusProductFromUrl() {
        const id = new URLSearchParams(location.search).get('product');
        if (!id) return;

        // on nettoie l'adresse pour que le rechargement ne refasse pas le défilement
        history.replaceState(null, '', location.pathname + location.hash);

        const card = cardList.querySelector('.menu-item[data-id="' + CSS.escape(id) + '"]');
        if (!card) return;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // petit délai : on laisse la page finir de s'afficher avant de défiler
        setTimeout(() => {
            card.scrollIntoView({
                behavior: reduceMotion ? 'auto' : 'smooth',
                block: 'center'
            });

            card.classList.add('product-highlight');
            setTimeout(() => card.classList.remove('product-highlight'), 3000);
        }, 350);
    }


    /* ===== Chargement des produits ===== */
    function load() {
        errorBox.hidden = true;
        emptyBox.hidden = true;
        countEl.textContent = '';
        renderSkeleton();

        fetch('products.json')
            .then(response => {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.json();
            })
            .then(data => {
                productList = data;
                render(true);
                focusProductFromUrl();
            })
            .catch(error => {
                console.error('Erreur de chargement :', error);
                cardList.innerHTML = '';
                countEl.textContent = '';
                errorBox.hidden = false;
            });
    }

    document.querySelector('.retry-load').addEventListener('click', load);

    load();
})();