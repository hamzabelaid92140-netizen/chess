// Vérifie l'en-tête "Authorization: Bearer <ADMIN_TOKEN>" sur les
// routes réservées au tableau de bord admin. Renvoie true si la
// requête est autorisée (et gère elle-même la réponse 401 sinon).

function requireAdmin(req, res) {
  const configured = process.env.ADMIN_TOKEN;
  if (!configured) {
    res.status(500).json({ error: "ADMIN_TOKEN non configuré côté serveur" });
    return false;
  }

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token || token !== configured) {
    res.status(401).json({ error: "Non autorisé" });
    return false;
  }

  return true;
}

module.exports = { requireAdmin };
