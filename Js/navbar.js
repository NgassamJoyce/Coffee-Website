const menuOpenButton = document.querySelector('#menu-open-button');
const menuCloseButton = document.querySelector('#menu-close-button');
const navLinks = document.querySelectorAll('.nav-menu .nav-link');

// bouton hamburger : ouvre/ferme le menu
menuOpenButton.addEventListener('click', () => {
    document.body.classList.toggle('show-mobile-menu');
});

// bouton croix : ferme le menu
menuCloseButton.addEventListener('click', () => {
    document.body.classList.remove('show-mobile-menu');
});

// un clic sur un lien ferme aussi le menu
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        document.body.classList.remove('show-mobile-menu');
    });
});


/* ===== Lien actif : l'utilisateur voit sur quelle page il est ===== */
(function () {
    const currentFile = location.pathname.split('/').pop() || 'index.html';
    const isHome = currentFile === 'index.html' || currentFile === '';

    // pour chaque lien : sur quelle page il mène, et vers quelle section (#...)
    const items = Array.from(navLinks).map(link => {
        const url = new URL(link.getAttribute('href'), location.href);
        return {
            link: link,
            file: url.pathname.split('/').pop() || 'index.html',
            hash: url.hash
        };
    });

    function setActive(activeLink) {
        navLinks.forEach(link => {
            const on = link === activeLink;
            link.classList.toggle('active', on);

            if (on) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });
    }

    /* --- Page d'accueil : le lien change selon la section visible --- */
    if (isHome) {
        const homeItem = items.find(i => i.file === 'index.html' && i.hash === '');
        const sections = items
            .filter(i => i.file === 'index.html' && i.hash !== '')
            .map(i => ({ el: document.querySelector(i.hash), link: i.link }))
            .filter(s => s.el);

        const update = () => {
            let current = homeItem ? homeItem.link : null;

            // la dernière section dont le haut est passé sous le header
            sections.forEach(s => {
                if (s.el.getBoundingClientRect().top <= 140) current = s.link;
            });

            // tout en bas de la page : c'est la dernière section (Contact)
            const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
            if (atBottom && sections.length) current = sections[sections.length - 1].link;

            setActive(current);
        };

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                update();
                ticking = false;
            });
        }, { passive: true });

        window.addEventListener('resize', update);
        window.addEventListener('pageshow', update);
        update();


        /* --- Arrivée depuis une autre page vers une section (ex: menu.html -> index.html#about-section) ---
           Le contenu de l'accueil grandit après le chargement (cartes du menu, images) :
           on recale donc la page sur la section tant que la hauteur change. */
        const navEntry = performance.getEntriesByType('navigation')[0];
        const isReload = navEntry && navEntry.type === 'reload';

        if (location.hash && !isReload) {
            let stopped = false;
            let resizeObserver = null;

            const stop = () => {
                stopped = true;
                if (resizeObserver) resizeObserver.disconnect();
            };

            const jumpToHash = () => {
                if (stopped) return;

                let id = location.hash.slice(1);
                try { id = decodeURIComponent(id); } catch { /* on garde tel quel */ }

                const target = document.getElementById(id);
                if (!target) return;

                const header = document.querySelector('header');
                const offset = header ? header.offsetHeight : 85;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;

                // "instant" ignore le défilement doux du CSS : on se place tout de suite
                window.scrollTo({ top: Math.max(top, 0), behavior: 'instant' });
                update();
            };

            // dès que le client touche à la page, on arrête de le replacer
            ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(eventName => {
                window.addEventListener(eventName, stop, { once: true, passive: true });
            });

            jumpToHash();
            window.addEventListener('load', jumpToHash);

            if ('ResizeObserver' in window) {
                resizeObserver = new ResizeObserver(jumpToHash);
                resizeObserver.observe(document.body);
            } else {
                setTimeout(jumpToHash, 400);
                setTimeout(jumpToHash, 1000);
            }

            // la page est stable : on arrête
            setTimeout(stop, 3000);
        }

        return;
    }

    /* --- Autres pages : le lien qui mène à cette page est actif (ex: Menu) --- */
    const match = items.find(i => i.file === currentFile && i.hash === '');
    setActive(match ? match.link : null);
})();