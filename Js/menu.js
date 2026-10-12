const cardList = document.querySelector('.card-list');
const tabs = document.querySelectorAll('.tab-btn');

let productList = [];

const showCards = (category) => {
    cardList.innerHTML = '';   

    const filtered = category === 'all'
        ? productList
        : productList.filter(product => product.category === category);

    filtered.forEach(product => {
        const menuItem = document.createElement('li');
        menuItem.classList.add('menu-item');

        menuItem.innerHTML = `
            <div class="card-image">
                <img src="${product.image}">
            </div>
            <h3 class="name">${product.name}</h3>
            <p class="price">${product.price}</p>
            <button class="btn card-btn">Add to Cart</button>
        `;

        cardList.appendChild(menuItem);
        menuItem.querySelector('.card-btn').addEventListener('click', () => addToCart(product));
    });
};

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));   // retire "active" partout
        tab.classList.add('active');                       // le met sur le bouton cliqué
        showCards(tab.dataset.category);                   // affiche sa catégorie
    });
});

fetch('products.json')
    .then(response => response.json())
    .then(data => {
        productList = data;
        showCards('all');   // au chargement : tout afficher
    })
    .catch(error => console.error('Erreur de chargement :', error));

    