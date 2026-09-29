/* =========================================================
   VELTA — Interactions UI
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initHeaderScroll();
  initRevealOnScroll();
  initNewsletterForm();
  initContactForm();
  initAccordion();
  initQuickAdd();
  initYear();
});

/* ---------- Menu mobile ---------- */
function initMobileNav() {
  const toggle = document.querySelector(".menu-toggle");
  const drawer = document.querySelector(".nav-drawer");
  const scrim = document.querySelector(".nav-scrim");
  if (!toggle || !drawer || !scrim) return;

  const close = () => {
    drawer.classList.remove("is-open");
    scrim.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };
  const open = () => {
    drawer.classList.add("is-open");
    scrim.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
  };

  toggle.addEventListener("click", () => {
    drawer.classList.contains("is-open") ? close() : open();
  });
  scrim.addEventListener("click", close);
  drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
}

/* ---------- Header masqué au scroll vers le bas ---------- */
function initHeaderScroll() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  let lastY = window.scrollY;

  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      if (y > lastY && y > 140) {
        header.classList.add("is-hidden");
      } else {
        header.classList.remove("is-hidden");
      }
      lastY = y;
    },
    { passive: true }
  );
}

/* ---------- Apparition au scroll ---------- */
function initRevealOnScroll() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("in-view"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  items.forEach((el) => observer.observe(el));

  // Filet de sécurité : si un élément n'est jamais détecté (ex. contenu hors flux normal), on le révèle quand même.
  setTimeout(() => {
    items.forEach((el) => el.classList.add("in-view"));
  }, 2500);
}

/* ---------- Toast de notification ---------- */
let toastTimer = null;
function showToast(title, message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6 9 17l-5-5"/>
      </svg>
      <div><strong data-toast-title></strong><span data-toast-msg></span></div>
    `;
    document.body.appendChild(toast);
  }
  toast.querySelector("[data-toast-title]").textContent = title;
  toast.querySelector("[data-toast-msg]").textContent = message || "";

  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}
window.showToast = showToast;

/* ---------- Ajout rapide au panier (grilles produits) ---------- */
function initQuickAdd() {
  document.querySelectorAll("[data-add-to-cart]").forEach((btn) => {
    if (btn.dataset.qaBound) return;
    btn.dataset.qaBound = "1";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.addToCart;
      const product = typeof getProductById === "function" ? getProductById(id) : null;
      addToCart(id, 1);
      showToast("Ajouté au panier", product ? product.name : "");
    });
  });
}

/* ---------- Accordéon fiche produit ---------- */
function initAccordion() {
  document.querySelectorAll(".accordion-head").forEach((head) => {
    if (head.dataset.accBound) return;
    head.dataset.accBound = "1";
    head.addEventListener("click", () => {
      const item = head.closest(".accordion-item");
      item.classList.toggle("open");
    });
  });
}

/* ---------- Validation formulaire newsletter ---------- */
function initNewsletterForm() {
  const form = document.querySelector("[data-newsletter-form]");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = form.querySelector("input[type='email']");
    if (!input.checkValidity()) {
      input.focus();
      return;
    }
    showToast("Inscription confirmée", "Merci ! Vérifiez votre boîte mail.");
    form.reset();
  });
}

/* ---------- Validation formulaire contact ---------- */
function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;

    form.querySelectorAll("[data-field]").forEach((field) => {
      const input = field.querySelector("input, textarea, select");
      field.classList.remove("invalid");
      if (!input.checkValidity()) {
        field.classList.add("invalid");
        valid = false;
      }
    });

    if (!valid) {
      form.querySelector(".invalid input, .invalid textarea, .invalid select")?.focus();
      return;
    }

    const successEl = form.querySelector("[data-form-success]");
    form.reset();
    if (successEl) successEl.style.display = "flex";
    showToast("Message envoyé", "Nous répondons sous 24h ouvrées.");
  });
}

/* ---------- Année dynamique footer ---------- */
function initYear() {
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}
