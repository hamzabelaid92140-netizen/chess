// POST /api/create-checkout-session
// Reçoit le panier { items: [{ id, qty }] }, recalcule les prix côté
// serveur à partir du catalogue (jamais confiance au client) et crée
// une session Stripe Checkout hébergée.

const Stripe = require("stripe");
const { PRODUCTS } = require("../js/products.js");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Méthode non autorisée" });
    return;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(500).json({ error: "STRIPE_SECRET_KEY manquant côté serveur" });
    return;
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Panier vide" });
      return;
    }

    const line_items = [];
    for (const entry of items) {
      const product = PRODUCTS.find((p) => p.id === entry.id);
      const qty = Math.max(1, Math.min(20, parseInt(entry.qty, 10) || 1));
      if (!product) continue;

      line_items.push({
        quantity: qty,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(product.price * 100),
          product_data: {
            name: product.name,
            description: product.category,
            metadata: { product_id: product.id },
          },
        },
      });
    }

    if (line_items.length === 0) {
      res.status(400).json({ error: "Aucun produit valide dans le panier" });
      return;
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      shipping_address_collection: {
        allowed_countries: ["FR", "BE", "CH", "LU", "DE", "ES", "IT", "NL", "GB"],
      },
      phone_number_collection: { enabled: true },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 0, currency: "eur" },
            display_name: "Livraison standard offerte",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 2 },
              maximum: { unit: "business_day", value: 6 },
            },
          },
        },
      ],
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart.html`,
      metadata: {
        cart: JSON.stringify(items.map((i) => ({ id: i.id, qty: i.qty }))),
      },
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("create-checkout-session error:", err);
    res.status(500).json({ error: "Impossible de créer la session de paiement" });
  }
};
