// POST /api/fulfill  { orderId }
// Tente d'envoyer automatiquement la commande à CJ Dropshipping.
// Si les identifiants CJ ou les références produit ne sont pas encore
// configurés, renvoie une erreur claire — la commande reste visible
// et traitable à la main dans le tableau de bord admin.

const { createClient } = require("@supabase/supabase-js");
const { requireAdmin } = require("../server/require-admin.js");
const { createFulfillmentOrder } = require("../server/cj-client.js");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Méthode non autorisée" });
    return;
  }
  if (!requireAdmin(req, res)) return;

  const { orderId } = req.body || {};
  if (!orderId) {
    res.status(400).json({ error: "orderId manquant" });
    return;
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    res.status(404).json({ error: "Commande introuvable" });
    return;
  }

  try {
    const cjResult = await createFulfillmentOrder(supabase, order, order.order_items);

    await supabase
      .from("orders")
      .update({
        status: "sent_to_supplier",
        cj_order_id: cjResult?.cjOrderId || cjResult?.orderId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    res.status(200).json({ ok: true, cj: cjResult });
  } catch (err) {
    console.error("fulfill error:", err);
    res.status(422).json({ error: err.message });
  }
};
