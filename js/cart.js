/* =========================================================
   VELTA — Moteur panier (localStorage)
   ========================================================= */

const CART_KEY = "velta_cart";

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(productId, qty = 1) {
  const cart = readCart();
  cart[productId] = (cart[productId] || 0) + qty;
  writeCart(cart);
}

function setCartQty(productId, qty) {
  const cart = readCart();
  if (qty <= 0) {
    delete cart[productId];
  } else {
    cart[productId] = qty;
  }
  writeCart(cart);
}

function removeFromCart(productId) {
  const cart = readCart();
  delete cart[productId];
  writeCart(cart);
}

function getCartItems() {
  const cart = readCart();
  return Object.keys(cart)
    .map((id) => {
      const product = getProductById(id);
      if (!product) return null;
      return { product, qty: cart[id] };
    })
    .filter(Boolean);
}

function getCartCount() {
  const cart = readCart();
  return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
}

function getCartSubtotal() {
  return getCartItems().reduce((sum, item) => sum + item.product.price * item.qty, 0);
}

function updateCartBadge() {
  const badges = document.querySelectorAll("[data-cart-count]");
  const count = getCartCount();
  badges.forEach((el) => {
    el.textContent = count;
    el.setAttribute("data-count", count);
  });
}

/* ---------- Rendu de la page panier (cart.html) ---------- */
function iconMarkup(icon) {
  return `<img src="assets/icons/${icon}.svg" alt="" width="28" height="28" loading="lazy">`;
}

function renderCartPage() {
  const listEl = document.getElementById("cartList");
  const emptyEl = document.getElementById("cartEmpty");
  const summaryEl = document.getElementById("cartSummary");
  if (!listEl) return;

  const items = getCartItems();

  if (items.length === 0) {
    listEl.innerHTML = "";
    if (emptyEl) emptyEl.style.display = "block";
    if (summaryEl) summaryEl.style.display = "none";
    return;
  }

  if (emptyEl) emptyEl.style.display = "none";
  if (summaryEl) summaryEl.style.display = "block";

  listEl.innerHTML = items
    .map(
      (item) => `
    <div class="cart-row" data-row="${item.product.id}">
      <div class="cart-row-visual ${item.product.tint}">${iconMarkup(item.product.icon)}</div>
      <div>
        <a href="product.html?id=${item.product.id}"><h3>${item.product.name}</h3></a>
        <span class="product-cat">${item.product.category}</span>
        <button class="cart-row-remove" data-remove="${item.product.id}" type="button">Retirer</button>
      </div>
      <div class="pd-qty">
        <button type="button" data-decr="${item.product.id}" aria-label="Diminuer la quantité">−</button>
        <input type="text" inputmode="numeric" value="${item.qty}" data-qty-input="${item.product.id}" aria-label="Quantité">
        <button type="button" data-incr="${item.product.id}" aria-label="Augmenter la quantité">+</button>
      </div>
      <div class="cart-row-price">${formatPrice(item.product.price * item.qty)}</div>
    </div>
  `
    )
    .join("");

  const subtotal = getCartSubtotal();
  const shipping = subtotal >= 60 || subtotal === 0 ? 0 : 5.9;
  const total = subtotal + shipping;

  if (summaryEl) {
    summaryEl.querySelector("[data-subtotal]").textContent = formatPrice(subtotal);
    summaryEl.querySelector("[data-shipping]").textContent = shipping === 0 ? "Offerte" : formatPrice(shipping);
    summaryEl.querySelector("[data-total]").textContent = formatPrice(total);
  }

  listEl.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      removeFromCart(btn.dataset.remove);
      renderCartPage();
    });
  });
  listEl.querySelectorAll("[data-incr]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cart = readCart();
      setCartQty(btn.dataset.incr, (cart[btn.dataset.incr] || 0) + 1);
      renderCartPage();
    });
  });
  listEl.querySelectorAll("[data-decr]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cart = readCart();
      setCartQty(btn.dataset.decr, (cart[btn.dataset.decr] || 0) - 1);
      renderCartPage();
    });
  });
  listEl.querySelectorAll("[data-qty-input]").forEach((input) => {
    input.addEventListener("change", () => {
      const val = Math.max(0, parseInt(input.value, 10) || 0);
      setCartQty(input.dataset.qtyInput, val);
      renderCartPage();
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  renderCartPage();
});
