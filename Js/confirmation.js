(function () {
    const ORDER_KEY = 'coffee-last-order';

    const SHOP_NAME = 'Best Coffee';
    
    const SHOP_LINES = [];

    const PAYMENT_LABELS = {
        orange: 'Orange Money',
        mtn: 'MTN Mobile Money'
    };

    const $ = id => document.getElementById(id);

    const money = n => Math.round(n) + '\u00A0FCFA';

    const escapeHTML = str => String(str).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

    const formatPhone = digits =>
        String(digits).replace(/^(\d{3})(\d{2})(\d{2})(\d{2})$/, '$1 $2 $3 $4');

    let order = null;
    try {
        order = JSON.parse(localStorage.getItem(ORDER_KEY));
    } catch {
        order = null;
    }

    if (!order || !order.customer || !order.delivery || !order.payment ||
        !Array.isArray(order.items) || order.items.length === 0) {
        $('confirm-empty').hidden = false;
        return;
    }


    /* ===== Pas d'impression : la facture se voit et se télécharge ===== */
    document.body.classList.add('no-print');

    document.addEventListener('keydown', event => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') {
            event.preventDefault();
        }
    });


    /* ===== Textes communs à la page et à la facture ===== */
    const isDelivery = order.delivery.mode === 'delivery';
    const firstName = order.customer.name.trim().split(/\s+/)[0];
    const paymentLabel = PAYMENT_LABELS[order.payment.method] || order.payment.method;
    const phoneText = '+237 ' + formatPhone(order.customer.phone);
    const payPhoneText = '+237 ' + formatPhone(order.payment.phone);

    const dateText = new Date(order.paidAt || order.date).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // adresse de livraison, ou heure de retrait
    const placeLabel = isDelivery ? 'Delivery address' : 'Pickup time';
    let placeText;

    if (isDelivery) {
        placeText = order.delivery.landmark
            ? `${order.delivery.quarter}, ${order.delivery.city} (${order.delivery.landmark})`
            : `${order.delivery.quarter}, ${order.delivery.city}`;
    } else {
        placeText = order.delivery.time;
    }

    const invoiceNo = 'INV-' + order.id.replace(/^BC-/, '');


    /* ===== Page de confirmation ===== */
    $('c-name').textContent = firstName;
    $('c-id').textContent = order.id;
    $('c-date').textContent = dateText;
    $('c-eta').textContent = isDelivery ? '30–45 min' : `Ready at ${order.delivery.time}`;
    $('c-method').textContent = isDelivery ? 'Home delivery' : 'Pickup';
    $('c-payment').textContent = `${paymentLabel} · ${payPhoneText}`;
    $('c-phone').textContent = phoneText;
    $('c-place-label').textContent = placeLabel;
    $('c-place').textContent = placeText;

    const hasNotes = Boolean(order.customer.notes);
    $('c-notes-box').hidden = !hasNotes;
    if (hasNotes) {
        $('c-notes').textContent = order.customer.notes;
    }


    /* ===== Facture à l'écran ===== */
    $('inv-shop').textContent = SHOP_NAME;
    $('inv-shop-lines').innerHTML = SHOP_LINES.map(escapeHTML).join('<br>');
    $('inv-number').textContent = invoiceNo;
    $('inv-date').textContent = dateText;

    $('inv-name').textContent = order.customer.name;
    $('inv-email').textContent = order.customer.email;
    $('inv-phone').textContent = phoneText;

    $('inv-place-label').textContent = placeLabel;
    $('inv-place').textContent = placeText;
    $('inv-payment').textContent = `Paid with ${paymentLabel} · ${payPhoneText}`;

    $('inv-items').innerHTML = order.items.map(item => `
        <tr>
            <td>${escapeHTML(item.name)}</td>
            <td class="num">${item.quantity}</td>
            <td class="num">${money(item.price)}</td>
            <td class="num">${money(item.price * item.quantity)}</td>
        </tr>
    `).join('');

    $('inv-subtotal').textContent = money(order.subtotal);
    $('inv-fee').textContent = order.deliveryFee === 0 ? 'Free' : money(order.deliveryFee);
    $('inv-total').textContent = money(order.total);


    /* ===== Ouvrir et fermer la facture ===== */
    const overlay = $('invoice-overlay');
    let lastFocus = null;

    function openInvoice() {
        lastFocus = document.activeElement;
        overlay.hidden = false;
        document.body.style.overflow = 'hidden';
        $('invoice-download').focus();
    }

    function closeInvoice() {
        overlay.hidden = true;
        document.body.style.overflow = '';
        if (lastFocus) lastFocus.focus();
    }

    $('view-invoice-btn').addEventListener('click', openInvoice);
    $('invoice-close').addEventListener('click', closeInvoice);
    $('invoice-close-2').addEventListener('click', closeInvoice);

    overlay.addEventListener('click', event => {
        if (event.target === overlay) closeInvoice();
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !overlay.hidden) closeInvoice();
    });


    /* ===== Télécharger la facture en PDF ===== */

    const pdfText = text => String(text).replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');

    function downloadInvoice() {
        if (!window.jspdf) {
            alert('The PDF tool could not be loaded. Check your connection and try again.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });

        const PAGE_W = 210;
        const PAGE_H = 297;
        const M = 18;                    // marge
        const RIGHT = PAGE_W - M;

        const BROWN = [59, 20, 28];
        const ORANGE = [243, 150, 28];
        const GRAY = [105, 105, 105];
        const DARK = [40, 40, 40];
        const GREEN = [46, 158, 91];
        const LINE = [225, 215, 217];

        const font = (style, size) => {
            doc.setFont('helvetica', style);
            doc.setFontSize(size);
        };
        const ink = c => doc.setTextColor(c[0], c[1], c[2]);
        const stroke = (c, width) => {
            doc.setDrawColor(c[0], c[1], c[2]);
            doc.setLineWidth(width);
        };

        let y = 22;

        // --- en-tête : boutique à gauche, numéro à droite ---
        font('bold', 22);
        ink(BROWN);
        doc.text(pdfText(SHOP_NAME), M, y);

        font('bold', 20);
        ink(ORANGE);
        doc.text('INVOICE', RIGHT, y, { align: 'right' });

        font('normal', 10);
        ink(GRAY);
        let leftY = y + 7;
        SHOP_LINES.forEach(line => {
            doc.text(pdfText(line), M, leftY);
            leftY += 5;
        });

        font('bold', 10);
        ink(BROWN);
        doc.text(invoiceNo, RIGHT, y + 8, { align: 'right' });

        font('normal', 10);
        ink(GRAY);
        doc.text(pdfText(dateText), RIGHT, y + 13.5, { align: 'right' });
        doc.text('Order ' + order.id, RIGHT, y + 19, { align: 'right' });

        y = Math.max(leftY, y + 19) + 6;
        stroke(ORANGE, 0.8);
        doc.line(M, y, RIGHT, y);
        y += 10;

        // --- client à gauche, livraison et paiement à droite ---
        const colR = M + 98;

        font('normal', 8);
        ink(GRAY);
        doc.text('BILLED TO', M, y);
        doc.text(pdfText(placeLabel.toUpperCase()), colR, y);
        y += 5;

        const startY = y;

        font('bold', 11);
        ink(BROWN);
        const nameLines = doc.splitTextToSize(pdfText(order.customer.name), 85);
        doc.text(nameLines, M, startY);
        let leftEnd = startY + nameLines.length * 5;

        font('normal', 10);
        ink(GRAY);
        const emailLines = doc.splitTextToSize(pdfText(order.customer.email), 85);
        doc.text(emailLines, M, leftEnd);
        leftEnd += emailLines.length * 5;
        doc.text(pdfText(phoneText), M, leftEnd);
        leftEnd += 5;

        font('bold', 11);
        ink(BROWN);
        const placeLines = doc.splitTextToSize(pdfText(placeText), 74);
        doc.text(placeLines, colR, startY);
        let rightEnd = startY + placeLines.length * 5;

        font('normal', 10);
        ink(GRAY);
        const payLines = doc.splitTextToSize(pdfText(`Paid with ${paymentLabel} - ${payPhoneText}`), 74);
        doc.text(payLines, colR, rightEnd);
        rightEnd += payLines.length * 5;

        y = Math.max(leftEnd, rightEnd) + 8;

        // --- tableau des articles ---
        const COL = {
            name: M + 3,
            qty: 120,
            price: 152,
            total: RIGHT - 3
        };

        const drawTableHead = () => {
            doc.setFillColor(BROWN[0], BROWN[1], BROWN[2]);
            doc.roundedRect(M, y, RIGHT - M, 9, 1.5, 1.5, 'F');

            font('bold', 9);
            doc.setTextColor(255, 255, 255);
            doc.text('ITEM', COL.name, y + 6);
            doc.text('QTY', COL.qty, y + 6, { align: 'right' });
            doc.text('PRICE', COL.price, y + 6, { align: 'right' });
            doc.text('TOTAL', COL.total, y + 6, { align: 'right' });

            y += 9;
        };

        drawTableHead();

        order.items.forEach(item => {
            const itemLines = doc.splitTextToSize(pdfText(item.name), 82);
            const rowH = itemLines.length * 5 + 4;

            // nouvelle page si la ligne ne tient plus
            if (y + rowH > PAGE_H - 25) {
                doc.addPage();
                y = 22;
                drawTableHead();
            }

            font('normal', 10);
            ink(DARK);
            doc.text(itemLines, COL.name, y + 6);
            doc.text(String(item.quantity), COL.qty, y + 6, { align: 'right' });
            doc.text(pdfText(money(item.price)), COL.price, y + 6, { align: 'right' });
            doc.text(pdfText(money(item.price * item.quantity)), COL.total, y + 6, { align: 'right' });

            y += rowH;
            stroke(LINE, 0.2);
            doc.line(M, y, RIGHT, y);
        });

        // --- totaux ---
        y += 8;

        if (y > PAGE_H - 60) {
            doc.addPage();
            y = 22;
        }

        const labelX = 125;

        font('normal', 10);
        ink(GRAY);
        doc.text('Subtotal', labelX, y);
        doc.text(pdfText(money(order.subtotal)), RIGHT, y, { align: 'right' });
        y += 6;

        doc.text('Delivery', labelX, y);
        doc.text(order.deliveryFee === 0 ? 'Free' : pdfText(money(order.deliveryFee)), RIGHT, y, { align: 'right' });
        y += 4;

        stroke(LINE, 0.3);
        doc.line(labelX, y, RIGHT, y);
        y += 7;

        font('bold', 13);
        ink(BROWN);
        doc.text('Total', labelX, y);
        ink(ORANGE);
        doc.text(pdfText(money(order.total)), RIGHT, y, { align: 'right' });
        y += 16;

        // --- tampon "payé" et remerciement ---
        font('bold', 12);
        ink(GREEN);
        doc.text('PAID', PAGE_W / 2, y, { align: 'center' });
        y += 7;

        font('normal', 10);
        ink(GRAY);
        doc.text('Thank you for your order!', PAGE_W / 2, y, { align: 'center' });

        doc.save(`Invoice-${order.id}.pdf`);
    }

    $('invoice-download').addEventListener('click', downloadInvoice);


    $('confirm-card').hidden = false;
})();