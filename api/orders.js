// GET /api/orders
// Liste les commandes récentes pour le tableau de bord admin.
// Protégé par un jeton (voir server/require-admin.js).

const { createClient } = require("@supabase/supabase-js");
const { requireAdmin } = require("../server/require-admin.js");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Méthode non autorisée" });
    return;
  }
  if (!requireAdmin(req, res)) return;

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: "Configuration Supabase manquante" });
    return;
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false })
    .limit(150);

  if (error) {
    console.error("orders fetch error:", error);
    res.status(500).json({ error: "Impossible de charger les commandes" });
    return;
  }

  res.status(200).json({ orders: data });
};
