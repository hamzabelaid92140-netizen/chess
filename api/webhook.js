// POST /api/webhook
// Endpoint appelé par Stripe (jamais par le navigateur) quand un
// paiement est confirmé. Vérifie la signature, puis enregistre la
// commande et ses lignes dans Supabase.

const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");
const { PRODUCTS } = require("../js/products.js");

// Stripe a besoin du corps brut (non parsé) pour vérifier la signature.
module.exports.config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).end("Méthode non autorisée");
    return;
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    res.status(500).end("Configuration Stripe manquante");
    return;
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Signature de webhook invalide:", err.message);
    res.status(400).end(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    if (event.type === "checkout.session.completed") {
      await recordPaidOrder(event.data.object, stripe);
    }
    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Échec de l'enregistrement de la commande:", err);
    // 500 → Stripe retentera automatiquement l'envoi de cet événement.
    res.status(500).json({ error: "order recording failed" });
  }
};

async function recordPaidOrder(session, stripe) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Configuration Supabase manquante");
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Évite les doublons si Stripe renvoie le même événement deux fois.
  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();
  if (existing) return;

  const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["line_items.data.price.product"],
  });

  const address = fullSession.customer_details?.address || {};
  const items = fullSession.line_items.data.map((li) => {
    const productId = li.price?.product?.metadata?.product_id || null;
    const catalogProduct = PRODUCTS.find((p) => p.id === productId);
    return {
      product_id: productId || "inconnu",
      product_name: li.description || catalogProduct?.name || "Produit",
      unit_price: (li.price?.unit_amount || 0) / 100,
      unit_cost: catalogProduct?.costPrice || 0,
      quantity: li.quantity || 1,
      cj_pid: catalogProduct?.cjPid || null,
    };
  });

  const amountCost = items.reduce((sum, it) => sum + it.unit_cost * it.quantity, 0);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      stripe_session_id: fullSession.id,
      stripe_payment_intent: fullSession.payment_intent,
      customer_email: fullSession.customer_details?.email || "",
      customer_name: fullSession.customer_details?.name || "",
      shipping_line1: address.line1 || "",
      shipping_line2: address.line2 || "",
      shipping_city: address.city || "",
      shipping_postal_code: address.postal_code || "",
      shipping_country: address.country || "",
      amount_total: (fullSession.amount_total || 0) / 100,
      amount_cost: amountCost,
      currency: fullSession.currency || "eur",
      status: "paid",
    })
    .select()
    .single();

  if (orderError) throw orderError;

  const itemRows = items.map((it) => ({ ...it, order_id: order.id }));
  const { error: itemsError } = await supabase.from("order_items").insert(itemRows);
  if (itemsError) throw itemsError;
}
