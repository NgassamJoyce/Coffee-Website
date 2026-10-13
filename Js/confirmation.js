(function () {
    const LAST_ORDER_KEY = 'coffee-last-order';

    const card = document.querySelector('#confirm-card');
    const emptyBox = document.querySelector('#confirm-empty');

    const money = n => '$' + Number(n).toFixed(2);

    const escapeHTML = str => String(str).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

    const set = (id, text) => {
        document.getElementById(id).textContent = text;
    };

    // on récupère la dernière commande
    let order = null;
    try {
        order = JSON.parse(localStorage.getItem(LAST_ORDER_KEY));
    } catch { /* illisible */ }

    if (!order || !Array.isArray(order.items)) {
        emptyBox.hidden = false;
        return;
    }

    const isDelivery = order.delivery === 'delivery';

    // en-tête
    set('c-name', order.customer.name.split(' ')[0]);
    set('c-id', order.id);

    // détails
    set('c-date', new Date(order.date).toLocaleString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }));
    set('c-eta', isDelivery ? '30–45 minutes' : '15–20 minutes');
    set('c-method', isDelivery ? 'Home delivery' : 'Store pickup');
    set('c-payment', order.payment);
    set('c-phone', order.customer.phone);
    set('c-place-label', isDelivery ? 'Delivery address' : 'Pick up at');
    set('c-place', isDelivery ? order.customer.address : 'Yaoundé, Bastos');

    if (order.customer.notes) {
        set('c-notes', order.customer.notes);
        document.getElementById('c-notes-box').hidden = false;
    }

    // articles
    document.getElementById('c-items').innerHTML = order.items.map(item => `
        <li>
            <span>${escapeHTML(item.name)} <em>× ${item.quantity}</em></span>
            <span>${money(item.price * item.quantity)}</span>
        </li>
    `).join('');

    // totaux
    set('c-subtotal', money(order.subtotal));
    set('c-fee', order.fee > 0 ? money(order.fee) : 'Free');
    set('c-total', money(order.total));

    card.hidden = false;

    // impression du reçu
    document.getElementById('print-btn').addEventListener('click', () => window.print());
})();