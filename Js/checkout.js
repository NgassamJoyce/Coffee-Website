(function () {
    const form = document.querySelector('#checkout-form');

    // Vérifier que le formulaire existe
    if (!form) {
        console.error('Checkout : formulaire introuvable.');
        return;
    }

    const panels = Array.from(form.querySelectorAll('[data-panel]'));
    const steps = Array.from(document.querySelectorAll('#steps [data-step]'));
    const caption = document.querySelector('#step-caption');
    const detailsAlert = document.querySelector('#details-alert');
    const deliveryAlert = document.querySelector('#delivery-alert');
    const paymentAlert = document.querySelector('#payment-alert');
    const notes = document.querySelector('#notes');
    const notesCount = document.querySelector('#notes-count');

    // Fenêtre de simulation du paiement (en dehors du formulaire)
    const overlay = document.querySelector('#pay-overlay');

    // Frais de livraison à domicile (le retrait en boutique est gratuit)
    const DELIVERY_FEE = 1000;

    // Page affichée après un paiement accepté (change le nom si ton fichier est différent)
    const CONFIRMATION_URL = './confirmation.html';

    // Clés de stockage
    const DRAFT_KEY = 'coffee-checkout-draft';
    const ORDER_KEY = 'coffee-last-order';
    const CART_KEY = 'coffee-cart';

    const STEP_ORDER = ['cart', 'details', 'delivery', 'payment', 'confirmation'];
    const FORM_STEPS = ['details', 'delivery', 'payment'];

    // Champs à mémoriser dans le brouillon
    const TEXT_FIELDS = [
        'fullname', 'email', 'phone', 'notes',
        'city', 'quarter', 'landmark', 'pickup-time',
        'payment-phone'
    ];
    const RADIO_GROUPS = ['delivery', 'payment'];

    const PAYMENT_HELP = {
        orange: 'Open your Orange Money app or dial #150# and approve the payment.',
        mtn: 'Open your MoMo app or dial *126# and approve the payment.'
    };

    let currentStep = 'details';
    let pendingOrder = null;
    let payState = 'waiting';
    let lastFocus = null;

    const money = n => Math.round(n) + '\u00A0FCFA';

    const escapeHTML = str => String(str).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

    const formatPhone = digits =>
        digits.replace(/^(\d{3})(\d{2})(\d{2})(\d{2})$/, '$1 $2 $3 $4');

    function normalizePhone(value) {
        let digits = value.replace(/\D/g, '');
        if (digits.length === 12 && digits.startsWith('237')) {
            digits = digits.slice(3);
        }
        return digits;
    }

    const readCart = () => (typeof getCart === 'function' ? getCart() : []);

    function readStore(storage, key) {
        try {
            return JSON.parse(storage.getItem(key));
        } catch {
            return null;
        }
    }

    function writeStore(storage, key, value) {
        try {
            storage.setItem(key, JSON.stringify(value));
        } catch {
        }
    }

    function getDeliveryMode() {
        return form.querySelector('input[name="delivery"]:checked')?.value;
    }

    function saveDraft(step) {
        const values = {};

        TEXT_FIELDS.forEach(id => {
            const field = form.querySelector('#' + id);
            if (field) values[id] = field.value;
        });

        RADIO_GROUPS.forEach(name => {
            const checked = form.querySelector(`input[name="${name}"]:checked`);
            if (checked) values[name] = checked.value;
        });

        writeStore(sessionStorage, DRAFT_KEY, { step, values });
    }

    function restoreValues(values) {
        TEXT_FIELDS.forEach(id => {
            const field = form.querySelector('#' + id);
            if (field && typeof values[id] === 'string') {
                field.value = values[id];
            }
        });

        RADIO_GROUPS.forEach(name => {
            if (!values[name]) return;

            const radio = Array.from(form.querySelectorAll(`input[name="${name}"]`))
                .find(input => input.value === values[name]);

            if (radio) radio.checked = true;
        });
    }


    function renderSummary() {
        const cart = readCart();
        const mode = getDeliveryMode();

        const itemsBox = document.querySelector('#summary-items');
        const subEl = document.querySelector('#summary-sub');
        const subtotalEl = document.querySelector('#summary-subtotal');
        const deliveryEl = document.querySelector('#summary-delivery');
        const totalEl = document.querySelector('#summary-total');
        const payAmountEl = document.querySelector('#pay-submit-amount');

        if (!itemsBox || !subtotalEl || !deliveryEl || !totalEl) return;

        itemsBox.innerHTML = cart.length === 0
            ? '<p class="summary-empty">Your cart is empty.</p>'
            : cart.map(item => `
                <div class="summary-item">
                    <div class="summary-thumb">
                        <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}">
                    </div>
                    <div>
                        <span class="si-name">${escapeHTML(item.name)}</span>
                        <span class="si-qty">Qty ${item.quantity} × ${money(item.price)}</span>
                    </div>
                    <span class="si-price">${money(item.price * item.quantity)}</span>
                </div>
            `).join('');

        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const delivery = mode === 'delivery' ? DELIVERY_FEE : 0;
        const total = subtotal + delivery;

        if (subEl) {
            subEl.textContent =
                `${count} ${count === 1 ? 'item' : 'items'} · ` +
                (mode === 'delivery' ? 'Home delivery' : 'Pickup');
        }

        subtotalEl.textContent = money(subtotal);
        deliveryEl.textContent = delivery === 0 ? 'Free' : money(delivery);
        totalEl.textContent = money(total);

        if (payAmountEl) payAmountEl.textContent = money(total);
    }


    /* ===== Navigation entre les étapes ===== */

    function showStep(stepName) {
        currentStep = stepName;

        panels.forEach(panel => {
            panel.hidden = panel.dataset.panel !== stepName;
        });

        form.classList.toggle('is-wide', stepName === 'payment');

        if (stepName === 'payment') {
            renderSummary();
        }

        const stepIndex = STEP_ORDER.indexOf(stepName);

        steps.forEach(step => {
            const index = STEP_ORDER.indexOf(step.dataset.step);

            step.classList.toggle('active', step.dataset.step === stepName);
            step.classList.toggle('done', index < stepIndex);

            if (step.dataset.step === stepName) {
                step.setAttribute('aria-current', 'step');
            } else {
                step.removeAttribute('aria-current');
            }
        });

        if (caption) {
            caption.textContent =
                `Step ${stepIndex + 1} of 5 · ` +
                stepName.charAt(0).toUpperCase() + stepName.slice(1);
        }

        const activePanel = panels.find(
            panel => panel.dataset.panel === stepName
        );

        const heading = activePanel?.querySelector('h2[tabindex="-1"]');

        if (heading) {
            heading.focus();
        }

        saveDraft(stepName);

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }


    // Panier vide : on remplace tout le formulaire par le message "panier vide"
    function showEmptyState() {
        form.hidden = true;

        const stepsBar = document.querySelector('#steps');
        if (stepsBar) stepsBar.hidden = true;
        if (caption) caption.hidden = true;

        const empty = document.querySelector('.checkout-empty');
        if (empty) empty.hidden = false;
    }



    /* ===== Validation ===== */
    function setError(field, message) {
        const group = field.closest('.form-group');
        if (!group) return;

        group.classList.toggle('has-error', Boolean(message));
        field.setAttribute('aria-invalid', message ? 'true' : 'false');

        const error = group.querySelector('.error-msg');
        if (error) {
            error.textContent = message;
        }

        return !message;
    }


    // Étape Details
    function validateDetails() {
        let firstInvalid = null;

        const fullname = form.querySelector('#fullname');
        const email = form.querySelector('#email');
        const phone = form.querySelector('#phone');

        const checks = [
            {
                field: fullname,
                valid: fullname.value.trim().length >= 2,
                message: 'Please enter your full name.'
            },
            {
                field: email,
                valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()),
                message: 'Please enter a valid email address.'
            },
            {
                field: phone,
                valid: /^6\d{8}$/.test(phone.value.replace(/\D/g, '')),
                message: 'Enter a valid Cameroonian mobile number: 9 digits starting with 6.'
            }
        ];

        checks.forEach(check => {
            const valid = setError(
                check.field,
                check.valid ? '' : check.message
            );

            if (!valid && !firstInvalid) {
                firstInvalid = check.field;
            }
        });

        if (detailsAlert) {
            detailsAlert.hidden = !firstInvalid;
        }

        if (firstInvalid) {
            firstInvalid.focus();
            return false;
        }

        return true;
    }


    // Étape Delivery
    function validateDelivery() {
        let firstInvalid = null;

        if (getDeliveryMode() === 'delivery') {
            ['#city', '#quarter'].forEach(selector => {
                const field = form.querySelector(selector);
                const valid = setError(
                    field,
                    field.value.trim().length < 2 ? 'This field is required.' : ''
                );

                if (!valid && !firstInvalid) {
                    firstInvalid = field;
                }
            });
        } else {
            const time = form.querySelector('#pickup-time');
            const valid = setError(
                time,
                time.value ? '' : 'Please select your preferred pickup time.'
            );

            if (!valid) {
                firstInvalid = time;
            }
        }

        if (deliveryAlert) {
            deliveryAlert.hidden = !firstInvalid;
        }

        if (firstInvalid) {
            firstInvalid.focus();
            return false;
        }

        return true;
    }


    // Étape Payment
    function validatePayment() {
        const field = form.querySelector('#payment-phone');
        const valid = /^6\d{8}$/.test(normalizePhone(field.value));

        setError(field, valid ? '' : 'Enter a valid number: 9 digits starting with 6.');

        if (paymentAlert) {
            paymentAlert.hidden = valid;
        }

        if (!valid) {
            field.focus();
        }

        return valid;
    }

    // Vérification en direct après une première erreur
    ['fullname', 'email', 'phone'].forEach(id => {
        const field = form.querySelector(`#${id}`);

        field.addEventListener('input', () => {
            if (field.closest('.form-group')?.classList.contains('has-error')) {
                const value = field.value.trim();

                let message = '';

                if (id === 'fullname' && value.length < 2) {
                    message = 'Please enter your full name.';
                }

                if (id === 'email' &&
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    message = 'Please enter a valid email address.';
                }

                if (id === 'phone' &&
                    !/^6\d{8}$/.test(field.value.replace(/\D/g, ''))) {
                    message = 'Enter a valid mobile number: 9 digits starting with 6.';
                }

                setError(field, message);
            }
        });
    });

    const paymentPhone = form.querySelector('#payment-phone');
    if (paymentPhone) {
        paymentPhone.addEventListener('input', () => {
            if (paymentPhone.closest('.form-group')?.classList.contains('has-error')) {
                const valid = /^6\d{8}$/.test(normalizePhone(paymentPhone.value));
                setError(paymentPhone, valid ? '' : 'Enter a valid number: 9 digits starting with 6.');
            }
        });
    }


    /* ===== Paiement : simulation Orange Money / MTN ===== */

    function showPayState(name) {
        if (!overlay) return;

        payState = name;

        overlay.querySelectorAll('.pay-state').forEach(box => {
            box.hidden = !box.classList.contains('pay-' + name);
        });
    }

    function openPayment(order) {
        overlay.querySelector('.pay-amount').textContent = money(order.total);
        overlay.querySelector('.pay-phone').textContent = '+237 ' + formatPhone(order.payment.phone);
        overlay.querySelector('.pay-help').textContent = PAYMENT_HELP[order.payment.method] || '';

        showPayState('waiting');

        lastFocus = document.activeElement;
        overlay.hidden = false;
        document.body.style.overflow = 'hidden';

        document.querySelector('#pay-approve')?.focus();
    }

    function closePayment() {
        if (!overlay) return;

        overlay.hidden = true;
        document.body.style.overflow = '';
        pendingOrder = null;

        if (lastFocus) lastFocus.focus();
    }


    // Paiement accepté : on enregistre la commande, on vide le panier, on passe à la confirmation
    function completePayment() {
        if (!pendingOrder) return;

        const order = {
            ...pendingOrder,
            status: 'paid',
            paidAt: new Date().toISOString()
        };

        showPayState('success');

        writeStore(localStorage, ORDER_KEY, order);

        if (typeof saveCart === 'function') {
            saveCart([]);
        } else {
            localStorage.removeItem(CART_KEY);
        }

        // la commande est passée : plus besoin du brouillon
        try {
            sessionStorage.removeItem(DRAFT_KEY);
        } catch { }

        pendingOrder = null;

        setTimeout(() => {
            window.location.href = CONFIRMATION_URL;
        }, 1500);
    }


    // Paiement refusé : le panier reste intact
    function declinePayment() {
        showPayState('failed');
        document.querySelector('#pay-retry')?.focus();
    }

    function retryPayment() {
        showPayState('waiting');
        document.querySelector('#pay-approve')?.focus();
    }

    if (overlay) {
        document.querySelector('#pay-approve')?.addEventListener('click', completePayment);
        document.querySelector('#pay-decline')?.addEventListener('click', declinePayment);
        document.querySelector('#pay-retry')?.addEventListener('click', retryPayment);
        document.querySelector('#pay-close')?.addEventListener('click', closePayment);

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && !overlay.hidden && payState !== 'success') {
                closePayment();
            }
        });
    }

    // Construire la commande à partir du formulaire et du panier
    function buildOrder(cart) {
        const mode = getDeliveryMode();
        const value = id => form.querySelector('#' + id).value.trim();

        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const deliveryFee = mode === 'delivery' ? DELIVERY_FEE : 0;

        return {
            id: 'BC-' + String(Date.now()).slice(-6),
            date: new Date().toISOString(),
            customer: {
                name: value('fullname'),
                email: value('email'),
                phone: normalizePhone(value('phone')),
                notes: value('notes')
            },
            delivery: mode === 'delivery'
                ? {
                    mode: 'delivery',
                    city: value('city'),
                    quarter: value('quarter'),
                    landmark: value('landmark')
                }
                : {
                    mode: 'pickup',
                    time: value('pickup-time')
                },
            payment: {
                method: form.querySelector('input[name="payment"]:checked')?.value || 'orange',
                phone: normalizePhone(value('payment-phone'))
            },
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                image: item.image,
                price: item.price,
                quantity: item.quantity
            })),
            subtotal,
            deliveryFee,
            total: subtotal + deliveryFee
        };
    }

    function placeOrder() {
        if (!validatePayment()) return;

        const cart = readCart();

        if (cart.length === 0) {
            alert('Your cart is empty.');
            return;
        }

        pendingOrder = buildOrder(cart);

        if (overlay) {
            openPayment(pendingOrder);
        } else {
            completePayment();
        }
    }


    /* ===== Boutons Next et Back ===== */

    form.querySelectorAll('[data-action]').forEach(button => {
        button.addEventListener('click', () => {
            const action = button.dataset.action;

            if (action === 'back') {
                if (currentStep === 'delivery') showStep('details');
                else if (currentStep === 'payment') showStep('delivery');
                return;
            }

            if (action === 'next') {
                if (currentStep === 'details') {
                    if (validateDetails()) showStep('delivery');
                    return;
                }

                if (currentStep === 'delivery') {
                    if (validateDelivery()) showStep('payment');
                    return;
                }

                if (currentStep === 'payment') {
                    placeOrder();
                }
            }
        });
    });

    // Empêcher un rechargement accidentel du formulaire
    form.addEventListener('submit', event => {
        event.preventDefault();
    });

    // Chaque modification est mise de côté dans le brouillon
    form.addEventListener('input', () => saveDraft(currentStep));
    form.addEventListener('change', () => saveDraft(currentStep));

    window.addEventListener('pageshow', event => {
        if (event.persisted) {
            window.location.reload();
        }
    });



    function updateDeliveryFields() {
        const isPickup = getDeliveryMode() === 'pickup';

        const addressGroup = form.querySelector('#delivery-address-group');
        const quarterGroup = form.querySelector('#delivery-quarter-group');
        const landmarkGroup = form.querySelector('#delivery-landmark-group');
        const pickupTimeGroup = form.querySelector('#pickup-time-group');

        // Masquer ou afficher les champs seulement s'ils existent
        if (addressGroup) addressGroup.hidden = isPickup;
        if (quarterGroup) quarterGroup.hidden = isPickup;
        if (landmarkGroup) landmarkGroup.hidden = isPickup;
        if (pickupTimeGroup) pickupTimeGroup.hidden = !isPickup;

        const city = form.querySelector('#city');
        const quarter = form.querySelector('#quarter');
        const pickupTime = form.querySelector('#pickup-time');

        if (city) city.required = !isPickup;
        if (quarter) quarter.required = !isPickup;
        if (pickupTime) pickupTime.required = isPickup;
    }

    form.querySelectorAll('input[name="delivery"]').forEach(radio => {
        radio.addEventListener('change', updateDeliveryFields);
    });

    // Compteur des notes facultatives
    function updateNotesCount() {
        if (!notes || !notesCount) return;
        notesCount.textContent = `${notes.value.length} / 250`;
    }

    if (notes) {
        notes.addEventListener('input', updateNotesCount);
    }


    /* ===== Démarrage : on reprend là où le client s'était arrêté ===== */

    const draft = readStore(sessionStorage, DRAFT_KEY);

    // 1. remettre les champs saisis
    if (draft && draft.values) {
        restoreValues(draft.values);
    }

    updateDeliveryFields();
    updateNotesCount();

    // 2. choisir l'étape de départ
    const startStep = draft && FORM_STEPS.includes(draft.step) ? draft.step : 'details';

    if (typeof getCart === 'function' && getCart().length === 0) {
        showEmptyState();
    } else {
        showStep(startStep);
    }
})();