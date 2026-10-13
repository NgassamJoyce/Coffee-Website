(function () {
    const LAST_ORDER_KEY = 'coffee-last-order';
    const DELIVERY_FEE = 10;              // frais de livraison en $ (change ici si besoin)

    const PAYMENT_LABELS = {
        cash: 'Cash',
        momo: 'Mobile Money',
        card: 'Card'
    };

    const layout = document.querySelector('.checkout-layout');
    const emptyBox = document.querySelector('.checkout-empty');
    const form = document.querySelector('#checkout-form');
    const itemsBox = document.querySelector('.summary-items');
    const subtotalEl = document.querySelector('.summary-subtotal');
    const deliveryEl = document.querySelector('.summary-delivery');
    const totalEl = document.querySelector('.summary-total');
    const placeBtn = document.querySelector('.place-order-btn');
    const placeBtnHTML = placeBtn.innerHTML;

    const money = n => '$' + n.toFixed(2);

    const escapeHTML = str => String(str).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

    const getMode = () => form.querySelector('input[name="delivery"]:checked').value;
    const getPayment = () => form.querySelector('input[name="payment"]:checked').value;


    /* ===== Récapitulatif ===== */
    function updateTotals(cart) {
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const fee = getMode() === 'delivery' ? DELIVERY_FEE : 0;

        subtotalEl.textContent = money(subtotal);
        deliveryEl.textContent = fee > 0 ? money(fee) : 'Free';
        totalEl.textContent = money(subtotal + fee);
    }

    function renderSummary() {
        const cart = getCart();

        // panier vide : rien à commander
        if (cart.length === 0) {
            layout.hidden = true;
            emptyBox.hidden = false;
            return;
        }

        layout.hidden = false;
        emptyBox.hidden = true;

        itemsBox.innerHTML = cart.map(item => `
            <li class="summary-item">
                <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}">
                <div>
                    <span class="si-name">${escapeHTML(item.name)}</span>
                    <span class="si-qty">Qty ${item.quantity} × ${money(item.price)}</span>
                </div>
                <span class="si-price">${money(item.price * item.quantity)}</span>
            </li>
        `).join('');

        updateTotals(cart);
    }


    /* ===== Livraison ou retrait ===== */
    form.querySelectorAll('input[name="delivery"]').forEach(radio => {
        radio.addEventListener('change', () => {
            form.classList.toggle('is-pickup', getMode() === 'pickup');
            updateTotals(getCart());

            // on efface une éventuelle erreur d'adresse
            const group = document.querySelector('#address').closest('.form-group');
            group.classList.remove('has-error');
            group.querySelector('.error-msg').textContent = '';
        });
    });


    /* ===== Vérification des champs ===== */
    const rules = {
        fullname: value => value.trim().length >= 2
            ? '' : 'Please enter your full name.',
        phone: value => value.replace(/\D/g, '').length >= 9
            ? '' : 'Please enter a valid phone number.',
        address: value => getMode() === 'pickup' || value.trim().length >= 5
            ? '' : 'Please enter your delivery address.'
    };

    const fields = Array.from(form.querySelectorAll('#fullname, #phone, #address'));

    function validateField(field) {
        const group = field.closest('.form-group');
        const error = rules[field.id](field.value);

        group.classList.toggle('has-error', error !== '');
        group.querySelector('.error-msg').textContent = error;
        field.setAttribute('aria-invalid', error !== '' ? 'true' : 'false');

        return error === '';
    }

    fields.forEach(field => {
        field.addEventListener('blur', () => validateField(field));

        field.addEventListener('input', () => {
            if (field.closest('.form-group').classList.contains('has-error')) {
                validateField(field);
            }
        });
    });


    /* ===== Envoi de la commande ===== */
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const cart = getCart();
        if (cart.length === 0) return;

        let firstInvalid = null;
        fields.forEach(field => {
            if (!validateField(field) && !firstInvalid) firstInvalid = field;
        });

        if (firstInvalid) {
            firstInvalid.focus();
            return;
        }

        placeBtn.disabled = true;
        placeBtn.textContent = 'Placing order...';

        const mode = getMode();
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const fee = mode === 'delivery' ? DELIVERY_FEE : 0;

        const order = {
            id: 'BC-' + (Math.floor(Math.random() * 90000) + 10000),
            date: new Date().toISOString(),
            customer: {
                name: form.querySelector('#fullname').value.trim(),
                phone: form.querySelector('#phone').value.trim(),
                address: mode === 'delivery' ? form.querySelector('#address').value.trim() : '',
                notes: form.querySelector('#notes').value.trim()
            },
            delivery: mode,
            payment: PAYMENT_LABELS[getPayment()],
            items: cart,
            subtotal: subtotal,
            fee: fee,
            total: subtotal + fee
        };

        // petit temps d'attente pour simuler l'envoi
        setTimeout(() => {
            try {
                localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
            } catch { /* stockage indisponible : on continue quand même */ }

            saveCart([]);        // la commande est passée : le panier repart de zéro

            document.documentElement.classList.add('page-leaving');
            setTimeout(() => { location.href = './confirmation.html'; }, 250);
        }, 900);
    });

    // retour en arrière avec le navigateur : on recalcule tout
    window.addEventListener('pageshow', () => {
        placeBtn.disabled = false;
        placeBtn.innerHTML = placeBtnHTML;
        document.documentElement.classList.remove('page-leaving');
        renderSummary();
    });

    renderSummary();
})();