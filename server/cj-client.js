// Client minimal pour l'API CJ Dropshipping (v2.0).
// Documentation : https://developers.cjdropshipping.com/
//
// Fonctionnalité optionnelle : tant que les produits VELTA ne sont pas
// reliés à de vrais identifiants CJ (product.cjPid — en réalité un
// "variant id" / vid côté CJ), l'envoi automatique échoue proprement
// et l'commande reste "paid" : elle peut toujours être traitée à la
// main depuis le tableau de bord admin.

const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";
const TOKEN_CACHE_KEY = "cj_access_token";
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12h — bien sous la limite CJ (1 émission / 5 min)

async function getAccessToken(supabase) {
  const { data: cached } = await supabase
    .from("settings")
    .select("value, expires_at")
    .eq("key", TOKEN_CACHE_KEY)
    .maybeSingle();

  if (cached && cached.expires_at && new Date(cached.expires_at) > new Date()) {
    return cached.value;
  }

  const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.CJ_EMAIL,
      apiKey: process.env.CJ_API_KEY,
    }),
  });
  const json = await res.json();

  if (!json.result || !json.data?.accessToken) {
    throw new Error(`Authentification CJ échouée : ${json.message || "réponse inattendue"}`);
  }

  const token = json.data.accessToken;
  await supabase.from("settings").upsert({
    key: TOKEN_CACHE_KEY,
    value: token,
    expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
  });

  return token;
}

async function createFulfillmentOrder(supabase, order, items) {
  if (!process.env.CJ_EMAIL || !process.env.CJ_API_KEY) {
    throw new Error("CJ_EMAIL / CJ_API_KEY non configurés — fulfillment automatique désactivé.");
  }

  const missingVid = items.filter((it) => !it.cj_pid);
  if (missingVid.length > 0) {
    throw new Error(
      `Produit(s) non relié(s) à un identifiant CJ (cjPid) : ${missingVid
        .map((i) => i.product_name)
        .join(", ")}. Renseigne js/products.js une fois les produits sourcés sur CJ Dropshipping.`
    );
  }

  const token = await getAccessToken(supabase);

  const res = await fetch(`${CJ_BASE}/shopping/order/createOrderV3`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "CJ-Access-Token": token,
    },
    body: JSON.stringify({
      orderNumber: `VELTA-${order.id.slice(0, 8)}`,
      shippingCustomerName: order.customer_name || order.customer_email,
      shippingCountryCode: order.shipping_country,
      shippingProvince: order.shipping_city,
      shippingCity: order.shipping_city,
      shippingAddress: [order.shipping_line1, order.shipping_line2].filter(Boolean).join(", "),
      shippingZip: order.shipping_postal_code,
      shippingPhone: order.customer_phone || "",
      products: items.map((it) => ({
        vid: it.cj_pid,
        quantity: it.quantity,
        storeLineItemId: it.id,
      })),
    }),
  });

  const json = await res.json();
  if (!json.result) {
    throw new Error(`Création de commande CJ échouée : ${json.message || "réponse inattendue"}`);
  }

  return json.data; // contient notamment cjOrderId côté CJ
}

module.exports = { getAccessToken, createFulfillmentOrder };
