/* =========================================================
   VELTA — Catalogue produits
   ========================================================= */

const PRODUCTS = [
  {
    id: "sac-cabas-toile",
    name: "Cabas Toile Épaisse",
    category: "Sacs",
    price: 89,
    costPrice: 37.38, // coût fournisseur estimé — à remplacer par le vrai prix CJ Dropshipping
    cjPid: null, // identifiant produit CJ Dropshipping — à renseigner une fois le produit sourcé
    oldPrice: null,
    icon: "tote-bag",
    tint: "tint-1",
    tag: "Best-seller",
    rating: 4.8,
    reviews: 132,
    description: "Un cabas généreux en toile de coton épaisse, doublé et renforcé aux coutures. Pensé pour suivre le rythme d'une vraie journée, du marché au bureau.",
    details: [
      "Toile de coton 12oz, doublure intérieure",
      "Anses renforcées, poche zippée intérieure",
      "Dimensions : 42 × 38 × 14 cm",
      "Fabriqué en Europe"
    ]
  },
  {
    id: "portefeuille-cuir-grain",
    name: "Portefeuille Cuir Grainé",
    category: "Accessoires",
    price: 59,
    costPrice: 24.78, // coût fournisseur estimé — à remplacer par le vrai prix CJ Dropshipping
    cjPid: null, // identifiant produit CJ Dropshipping — à renseigner une fois le produit sourcé
    oldPrice: null,
    icon: "wallet",
    tint: "tint-2",
    tag: null,
    rating: 4.7,
    reviews: 88,
    description: "Portefeuille fin en cuir pleine fleur grainé, pensé pour l'essentiel : cartes, billets, une poche monnaie discrète. Le cuir se patine avec le temps.",
    details: [
      "Cuir pleine fleur tannage végétal",
      "6 emplacements cartes, 2 compartiments billets",
      "Dimensions : 11 × 9 cm",
      "Se patine naturellement à l'usage"
    ]
  },
  {
    id: "bouteille-isotherme",
    name: "Bouteille Isotherme 500ml",
    category: "Maison",
    price: 39,
    costPrice: 16.38, // coût fournisseur estimé — à remplacer par le vrai prix CJ Dropshipping
    cjPid: null, // identifiant produit CJ Dropshipping — à renseigner une fois le produit sourcé
    oldPrice: 49,
    icon: "bottle",
    tint: "tint-3",
    tag: "Promo",
    rating: 4.9,
    reviews: 214,
    description: "Garde vos boissons chaudes 12h ou fraîches 24h. Acier inoxydable double paroi, sans BPA, bouchon étanche pensé pour le sac comme pour le vélo.",
    details: [
      "Acier inoxydable 18/8, double paroi sous vide",
      "Contenance 500ml, sans BPA",
      "Chaud 12h / Froid 24h",
      "Bouchon étanche anti-fuite"
    ]
  },
  {
    id: "bougie-cedre",
    name: "Bougie Parfumée Cèdre",
    category: "Bien-être",
    price: 32,
    costPrice: 13.44, // coût fournisseur estimé — à remplacer par le vrai prix CJ Dropshipping
    cjPid: null, // identifiant produit CJ Dropshipping — à renseigner une fois le produit sourcé
    oldPrice: null,
    icon: "candle",
    tint: "tint-4",
    tag: "Nouveau",
    rating: 4.6,
    reviews: 61,
    description: "Cire de soja naturelle, mèche en coton, senteur boisée de cèdre et de vétiver. Environ 45h de combustion dans un bocal en verre réutilisable.",
    details: [
      "Cire de soja 100% naturelle",
      "Mèche coton sans plomb",
      "Combustion estimée : 45 heures",
      "Bocal en verre réutilisable"
    ]
  },
  {
    id: "montre-minimaliste",
    name: "Montre Minimaliste Acier",
    category: "Accessoires",
    price: 149,
    costPrice: 62.58, // coût fournisseur estimé — à remplacer par le vrai prix CJ Dropshipping
    cjPid: null, // identifiant produit CJ Dropshipping — à renseigner une fois le produit sourcé
    oldPrice: null,
    icon: "watch",
    tint: "tint-1",
    tag: "Best-seller",
    rating: 4.8,
    reviews: 176,
    description: "Boîtier fin en acier brossé, cadran épuré, bracelet cuir interchangeable. Une pièce discrète qui traverse les saisons sans jamais se démoder.",
    details: [
      "Boîtier acier brossé 38mm",
      "Mouvement quartz japonais",
      "Étanche 3 ATM",
      "Bracelet cuir interchangeable"
    ]
  },
  {
    id: "lunettes-rondes",
    name: "Lunettes de Soleil Rondes",
    category: "Accessoires",
    price: 79,
    costPrice: 33.18, // coût fournisseur estimé — à remplacer par le vrai prix CJ Dropshipping
    cjPid: null, // identifiant produit CJ Dropshipping — à renseigner une fois le produit sourcé
    oldPrice: null,
    icon: "sunglasses",
    tint: "tint-2",
    tag: null,
    rating: 4.5,
    reviews: 47,
    description: "Monture acétate ronde, verres polarisés anti-UV400. Une silhouette intemporelle, légère à porter toute la journée.",
    details: [
      "Monture acétate italien",
      "Verres polarisés UV400",
      "Étui rigide inclus",
      "Poids : 24g"
    ]
  },
  {
    id: "carnet-toile",
    name: "Carnet Ligné Relié Toile",
    category: "Maison",
    price: 24,
    costPrice: 10.08, // coût fournisseur estimé — à remplacer par le vrai prix CJ Dropshipping
    cjPid: null, // identifiant produit CJ Dropshipping — à renseigner une fois le produit sourcé
    oldPrice: null,
    icon: "notebook",
    tint: "tint-3",
    tag: null,
    rating: 4.7,
    reviews: 93,
    description: "192 pages de papier crème 100g, reliure cousue à plat, couverture toile rigide. Le compagnon discret pour les idées qui n'attendent pas.",
    details: [
      "192 pages, papier crème 100g",
      "Reliure cousue, ouverture à plat",
      "Couverture toile rigide",
      "Format A5 : 21 × 14,8 cm"
    ]
  },
  {
    id: "echarpe-merinos",
    name: "Écharpe Laine Mérinos",
    category: "Accessoires",
    price: 69,
    costPrice: 28.98, // coût fournisseur estimé — à remplacer par le vrai prix CJ Dropshipping
    cjPid: null, // identifiant produit CJ Dropshipping — à renseigner une fois le produit sourcé
    oldPrice: 89,
    icon: "scarf",
    tint: "tint-4",
    tag: "Promo",
    rating: 4.9,
    reviews: 58,
    description: "Laine mérinos extra-fine, douce contre la peau, chaude sans excès de volume. Tissée dans des teintes naturelles qui s'accordent à tout.",
    details: [
      "100% laine mérinos extra-fine",
      "Dimensions : 180 × 30 cm",
      "Lavage à la main recommandé",
      "Teintures naturelles"
    ]
  },
  {
    id: "mug-emaille",
    name: "Mug Céramique Émaillé",
    category: "Maison",
    price: 22,
    costPrice: 9.24, // coût fournisseur estimé — à remplacer par le vrai prix CJ Dropshipping
    cjPid: null, // identifiant produit CJ Dropshipping — à renseigner une fois le produit sourcé
    oldPrice: null,
    icon: "mug",
    tint: "tint-1",
    tag: null,
    rating: 4.6,
    reviews: 104,
    description: "Grès émaillé façonné à la main, anse pensée pour une prise en main naturelle. Passe au lave-vaisselle et au micro-ondes.",
    details: [
      "Grès émaillé, façonné à la main",
      "Contenance : 350ml",
      "Compatible lave-vaisselle et micro-ondes",
      "Chaque pièce est légèrement unique"
    ]
  },
  {
    id: "sac-banane-cuir",
    name: "Sac Banane Cuir Souple",
    category: "Sacs",
    price: 65,
    costPrice: 27.3, // coût fournisseur estimé — à remplacer par le vrai prix CJ Dropshipping
    cjPid: null, // identifiant produit CJ Dropshipping — à renseigner une fois le produit sourcé
    oldPrice: null,
    icon: "belt-bag",
    tint: "tint-2",
    tag: "Nouveau",
    rating: 4.5,
    reviews: 31,
    description: "Format compact en cuir souple, pensé pour l'essentiel : téléphone, cartes, clés. Se porte en ceinture ou en bandoulière croisée.",
    details: [
      "Cuir pleine fleur souple",
      "Sangle ajustable amovible",
      "Dimensions : 20 × 13 × 6 cm",
      "Fermeture zip YKK"
    ]
  },
  {
    id: "diffuseur-huiles",
    name: "Diffuseur Huiles Essentielles",
    category: "Bien-être",
    price: 45,
    costPrice: 18.9, // coût fournisseur estimé — à remplacer par le vrai prix CJ Dropshipping
    cjPid: null, // identifiant produit CJ Dropshipping — à renseigner une fois le produit sourcé
    oldPrice: null,
    icon: "diffuser",
    tint: "tint-3",
    tag: null,
    rating: 4.7,
    reviews: 72,
    description: "Diffusion ultrasonique silencieuse, réservoir 300ml, jusqu'à 8h d'autonomie. Une lumière d'ambiance douce, réglable en intensité.",
    details: [
      "Diffusion ultrasonique silencieuse",
      "Réservoir 300ml, jusqu'à 8h",
      "Lumière d'ambiance réglable",
      "Arrêt automatique sécurité"
    ]
  },
  {
    id: "plaid-coton-bio",
    name: "Plaid Coton Bio Gaufré",
    category: "Maison",
    price: 55,
    costPrice: 23.1, // coût fournisseur estimé — à remplacer par le vrai prix CJ Dropshipping
    cjPid: null, // identifiant produit CJ Dropshipping — à renseigner une fois le produit sourcé
    oldPrice: null,
    icon: "blanket",
    tint: "tint-4",
    tag: null,
    rating: 4.8,
    reviews: 66,
    description: "Coton biologique certifié, texture gaufrée douce et respirante. Idéal en fin de canapé ou en couverture d'appoint toute l'année.",
    details: [
      "100% coton biologique certifié GOTS",
      "Tissage gaufré, finition frangée",
      "Dimensions : 130 × 170 cm",
      "Lavable en machine à 30°C"
    ]
  }
];

const CATEGORIES = ["Tous", "Sacs", "Accessoires", "Maison", "Bien-être"];

function getProductById(id) {
  return PRODUCTS.find((p) => p.id === id) || null;
}

function formatPrice(value) {
  return value.toFixed(2).replace(".", ",") + " €";
}

function productCardHTML(product) {
  const priceHTML = product.oldPrice
    ? `<span class="old">${formatPrice(product.oldPrice)}</span><span>${formatPrice(product.price)}</span>`
    : formatPrice(product.price);
  const tagHTML = product.tag
    ? `<span class="product-tag${product.oldPrice ? " sale" : ""}">${product.tag}</span>`
    : "";

  return `
    <article class="product-card">
      <div class="product-visual ${product.tint}">
        <a href="product.html?id=${product.id}" class="product-visual-link" aria-label="${product.name}"></a>
        ${tagHTML}
        <img src="assets/icons/${product.icon}.svg" alt="" width="80" height="80" loading="lazy">
        <button class="product-quickadd" data-add-to-cart="${product.id}" type="button" aria-label="Ajouter ${product.name} au panier">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6h15l-1.5 9h-12z"/><path d="M6 6 4.5 2H2"/><circle cx="9.5" cy="20" r="1.4"/><circle cx="17.5" cy="20" r="1.4"/></svg>
        </button>
      </div>
      <div class="product-info">
        <a href="product.html?id=${product.id}"><h3>${product.name}</h3></a>
        <span class="product-cat">${product.category}</span>
        <div class="product-price">${priceHTML}</div>
      </div>
    </article>
  `;
}

// Rend ce fichier utilisable à la fois dans le navigateur (variables globales)
// et côté serveur (Node, fonctions /api) sans dupliquer le catalogue.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { PRODUCTS, CATEGORIES, getProductById, formatPrice };
}
