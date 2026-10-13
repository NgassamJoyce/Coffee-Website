(function () {
    // Si le client a désactivé les animations dans son système : on ne fait rien
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    /* ===== 1. Transition entre les pages ===== */
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href]');
        if (!link) return;

        // on laisse le navigateur gérer les cas spéciaux
        if (e.defaultPrevented || e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (link.target === '_blank' || link.hasAttribute('download')) return;

        const url = new URL(link.href, location.href);

        if (url.protocol !== location.protocol || url.origin !== location.origin) return;
        if (url.pathname === location.pathname) return;   // même page (ancres, href="#")

        e.preventDefault();
        document.documentElement.classList.add('page-leaving');
        setTimeout(() => { location.href = url.href; }, 300);
    });

    // bouton "retour" du navigateur : on enlève l'effet de sortie
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) document.documentElement.classList.remove('page-leaving');
    });


    /* ===== 2. Apparition des éléments au défilement ===== */
    const targets = [
        '.section-title',
        '.category-tabs',
        '.feature',
        '.about-slider',
        '.testimonials-section .slider-container',
        '.contact-card',
        '.footer-about',
        '.footer-column',
        '.btn-plus'
    ].join(', ');

    const observer = 'IntersectionObserver' in window
        ? new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('in-view');
                obs.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
        : null;

    function prepare(el) {
        if (el.dataset.revealReady) return;
        el.dataset.revealReady = '1';

        // petit décalage entre voisins : ils arrivent l'un après l'autre
        const index = Array.prototype.indexOf.call(el.parentElement.children, el);
        el.style.setProperty('--delay', (index % 4) * 0.1 + 's');

        el.classList.add('reveal');
        if (observer) observer.observe(el);
        else el.classList.add('in-view');
    }

    document.querySelectorAll(targets).forEach(prepare);


    /* ===== 3. Cartes du menu (créées par menu.js / script.js) ===== */
    const cardList = document.querySelector('.card-list');

    if (cardList) {
        cardList.querySelectorAll('.menu-item').forEach(prepare);

        new MutationObserver((mutations) => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.classList.contains('menu-item')) prepare(node);
                });
            });
        }).observe(cardList, { childList: true });
    }
})();