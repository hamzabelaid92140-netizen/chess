# VELTA — Guide de mise en route

Le code est prêt. Il reste à créer quelques comptes (gratuits pour démarrer)
et à coller leurs clés dans Vercel. Compte environ 45 minutes la première fois.

## 0. Ce que fait chaque brique

- **Site** (fichiers `.html`, `css/`, `js/`) — la boutique elle-même, déjà en ligne visuellement.
- **Stripe** — encaisse le paiement du client, en toute sécurité (VELTA ne touche jamais les numéros de carte).
- **Supabase** — base de données qui enregistre chaque commande payée (client, adresse, articles, marge).
- **Vercel** — héberge le site ET les fonctions serveur (`/api`) gratuitement.
- **CJ Dropshipping** — fournisseur qui fabrique/stocke/expédie les produits (optionnel au départ, voir §6).

## 1. Créer le compte Stripe

1. [stripe.com](https://stripe.com) → créer un compte (nom d'entreprise = VELTA ou ton nom en attendant).
2. Reste en **mode Test** pour l'instant (bouton en haut à droite du dashboard).
3. Développeurs → Clés API → copie la **clé secrète** (`sk_test_...`). Elle ira dans `STRIPE_SECRET_KEY`.
4. On configurera le webhook à l'étape 5, une fois le site déployé (il faut son adresse en ligne).

## 2. Créer le compte Supabase

1. [supabase.com](https://supabase.com) → nouveau projet (région Europe conseillée, ex. `eu-central-1`).
2. Une fois créé : onglet **SQL Editor** → New query → colle tout le contenu de `server/schema.sql` → Run.
3. Project Settings → API :
   - `Project URL` → ira dans `SUPABASE_URL`
   - `service_role` key (⚠️ pas `anon`) → ira dans `SUPABASE_SERVICE_ROLE_KEY`

## 3. Choisir un ADMIN_TOKEN

Une simple valeur secrète pour te connecter à `admin.html`. Génère-la avec :
```
openssl rand -hex 24
```
Ou n'importe quelle phrase longue et unique. Garde-la de côté, elle ira dans `ADMIN_TOKEN`.

## 4. Déployer sur Vercel

1. [vercel.com](https://vercel.com) → connecte-toi avec ton compte GitHub.
2. "Add New Project" → sélectionne le repo `chess` (celui de ce site).
3. Vercel détecte automatiquement les fichiers statiques + le dossier `api/`. Ne change rien au build.
4. Avant de cliquer Deploy, section **Environment Variables**, ajoute :

| Nom | Valeur |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` (étape 1) |
| `SUPABASE_URL` | (étape 2) |
| `SUPABASE_SERVICE_ROLE_KEY` | (étape 2) |
| `ADMIN_TOKEN` | (étape 3) |

5. Clique **Deploy**. Au bout d'une minute tu as une URL du type `https://velta-xxxx.vercel.app`.

## 5. Connecter le webhook Stripe

Le webhook prévient automatiquement le site quand un client a payé.

1. Stripe Dashboard → Développeurs → Webhooks → **Add endpoint**.
2. URL : `https://<ton-url-vercel>/api/webhook`
3. Événement à écouter : `checkout.session.completed` (uniquement celui-là suffit).
4. Une fois créé, copie le **Signing secret** (`whsec_...`).
5. Retourne dans Vercel → Project → Settings → Environment Variables → ajoute `STRIPE_WEBHOOK_SECRET` avec cette valeur.
6. Redéploie (Vercel → Deployments → ⋯ → Redeploy) pour que la variable soit prise en compte.

## 6. Tester un achat (mode test)

1. Va sur ton site → ajoute un produit au panier → "Passer la commande".
2. Tu arrives sur la page de paiement Stripe (hébergée par Stripe, sécurisée).
3. Utilise une carte de test : numéro `4242 4242 4242 4242`, date future, CVC `123`, code postal quelconque.
4. Paiement validé → tu es redirigé vers `success.html`.
5. Va sur `https://<ton-url>/admin.html`, entre ton `ADMIN_TOKEN` → la commande doit apparaître.

Si la commande n'apparaît pas : Stripe Dashboard → Développeurs → Webhooks → clique sur ton endpoint →
onglet "Tentatives" pour voir l'erreur exacte (le plus souvent : mauvaise `STRIPE_WEBHOOK_SECRET` ou
Supabase mal configuré).

## 7. Passer en argent réel

1. Stripe : complète l'activation du compte (infos entreprise/IBAN demandées par Stripe — nécessaire
   pour recevoir de vrais paiements).
2. Bascule Stripe en **mode Live** → récupère les clés `sk_live_...` → refais l'étape 5 avec un
   **nouveau** webhook en mode live (les webhooks test et live sont séparés) → remplace
   `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` dans Vercel par les valeurs live → redéploie.

## 8. Fournisseur CJ Dropshipping (produits réels + envoi automatique)

C'est l'étape qui remplace les icônes par de vrais produits vendables.

1. Crée un compte sur [cjdropshipping.com](https://cjdropshipping.com).
2. Dans leur catalogue, cherche des produits qui correspondent à nos 4 catégories (sacs, accessoires,
   maison, bien-être) — vise un **coût fournisseur ≤ 45-50% du prix de vente** pour garder une marge saine.
3. Pour chaque produit choisi, note :
   - le **prix fournisseur réel** (remplace le `costPrice` provisoire dans `js/products.js`)
   - l'**identifiant variante (vid)** du produit CJ (remplace `cjPid: null` par cette valeur)
   - la **photo produit** fournie par CJ (remplace l'icône SVG — voir §9)
4. Pour activer l'envoi automatique des commandes à CJ : Mon compte CJ → API → "Get API Key" →
   ajoute `CJ_EMAIL` et `CJ_API_KEY` dans Vercel → redéploie. Le bouton "Envoyer à CJ" du tableau de
   bord admin fonctionnera alors pour les produits reliés à un `cjPid`.
5. **Tant que cette étape n'est pas faite**, ce n'est pas bloquant : les commandes payées arrivent quand
   même dans `admin.html`, avec l'adresse du client et les articles commandés — tu peux les passer à la
   main sur cjdropshipping.com le temps de mettre en place l'automatisation.

## 9. Vraies photos produits

Deux options, à mixer si tu veux :

- **Rapide** : reprends les photos produit fournies par CJ Dropshipping pour chaque référence choisie
  (pratique standard en dropshipping) et remplace le tag `<img src="assets/icons/...">` correspondant
  dans `js/products.js` (fonction `productCardHTML`) et `product.html` par la vraie photo.
- **Identité de marque** : garde le fond de couleur + l'icône en ligne pour les vignettes de catégorie
  et les listes, et n'utilise la vraie photo que sur la fiche produit détaillée — un style assez courant
  chez les marques premium (le "cadre" reste cohérent, seul le contenu devient réel).

Dis-le-moi quand tu as choisi tes premiers produits sur CJ : je peux directement éditer
`js/products.js` avec les vrais prix/photos/`cjPid` à ta place.

## Développement local (optionnel, pour tester avant de déployer)

```bash
npm install -g vercel
npm install
vercel dev
```
Puis crée un fichier `.env` (copie de `.env.example` avec tes vraies valeurs de test) — `vercel dev`
le charge automatiquement.
