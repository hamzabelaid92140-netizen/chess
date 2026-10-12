# Bot Discord Deepwoken

Bot pour un serveur Discord de builder Deepwoken : vérification par
captcha pour débloquer le reste du serveur, et commandes de modération
(kick, ban, mute, warn, clear...).

## Installation

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Remplis `.env` :

- `DISCORD_TOKEN` : le token du bot (portail développeurs Discord).
- `GUILD_ID` : l'ID du serveur, pour synchroniser les commandes slash plus vite.
- `VERIFIED_ROLE_ID` : l'ID du rôle attribué après vérification.
- `VERIFICATION_CHANNEL_ID` : l'ID du salon de vérification.
- `MOD_LOG_CHANNEL_ID` (optionnel) : l'ID d'un salon où le bot publie un
  message pour chaque action de modération. Laisse vide pour désactiver.
- `LINK_EXEMPT_CATEGORY_ID` : l'ID de la catégorie dans laquelle les liens
  sont autorisés (pas de suppression/timeout). Dans toutes les autres
  catégories, poster un lien supprime le message et timeout l'auteur 1h.
- `SHOWCASE_CHANNEL_ID` (optionnel) : l'ID du salon showcase où le bot
  réagit automatiquement (👍/❤️) aux messages contenant un lien.
- `GIF_ALLOWED_CHANNEL_IDS` (optionnel, par défaut les salons media et chat
  du serveur) : liste d'IDs de salons séparés par des virgules où les liens
  de GIF (tenor.com, giphy.com, gfycat.com, `.gif`) sont autorisés. Tout
  autre lien dans ces salons est supprimé et sanctionné comme ailleurs.

Le bot a besoin des intents "Server Members" et "Message Content" activés
sur le portail développeurs, et des permissions suivantes sur le serveur :
Manage Roles (son rôle doit être placé au-dessus du rôle vérifié et de
tous les rôles du menu de rôles), Kick Members, Ban Members, Moderate
Members (timeout), Manage Messages.

**Toutes les commandes sont des slash commands (`/`)**, et en plus des
permissions Discord classiques, chacune vérifie que l'auteur a un rôle
positionné au-dessus du rôle du bot dans la liste des rôles du serveur
(le propriétaire du serveur passe toujours). Place donc le rôle du bot
juste en dessous des rôles de modération/admin que tu veux autoriser.

## Lancement

```bash
python main.py
```

## Fonctionnement

- **Vérification par captcha** : un administrateur lance
  `/setup-verification` dans le salon configuré, ce qui poste un message
  avec un bouton "Je me vérifie". Au clic, le bot génère une image avec
  un code à 6 caractères (lettres/chiffres, distordu) et l'envoie en
  message éphémère avec un bouton "Entrer le code" qui ouvre un
  formulaire. 3 essais max, code valable 5 minutes ; un bouton "Nouveau
  code" permet d'en régénérer un sans tout recommencer. Le rôle vérifié
  n'est attribué qu'une fois le bon code entré.
- **Modération**, commandes slash (permissions Discord correspondantes
  requises) :
  - `/kick <membre> [raison]`
  - `/ban <membre> [raison]`
  - `/unban <id>`
  - `/mute <membre> <minutes> [raison]` (timeout Discord)
  - `/unmute <membre>`
  - `/warn <membre> <raison>` — enregistré dans `data/warnings.json`,
    DM envoyé au membre.
  - `/warnings <membre>` — liste ses avertissements.
  - `/clear <nombre>` — supprime les N derniers messages du salon.
  - Si `MOD_LOG_CHANNEL_ID` est configuré, chaque action est aussi
    postée dans ce salon.
- **Auto-modération des liens** : tout lien posté hors de la catégorie
  `LINK_EXEMPT_CATEGORY_ID` est supprimé, son auteur reçoit un timeout
  d'1h et un message privé en anglais ("No links allowed here..."). Les
  membres avec la permission "Manage Messages" (staff) ne sont pas
  concernés. Exception : dans les salons listés par `GIF_ALLOWED_CHANNEL_IDS`
  (media, chat), les liens de GIF sont autorisés ; tout autre lien y est
  quand même supprimé et sanctionné.
- **Menu de rôles**, commandes slash (admin) :
  - `/role-menu-add <label> <rôle> [emoji]` — ajoute une option (ex :
    archétype ou Oath Deepwoken).
  - `/role-menu-remove <label>` — retire une option.
  - `/role-menu-post` — poste le menu dans le salon courant. Les membres
    choisissent leurs rôles via un menu déroulant ; re-sélectionner
    retire le rôle (bascule).
- **Showcase** : dans `SHOWCASE_CHANNEL_ID`, tout message contenant un
  lien reçoit automatiquement les réactions 👍 et ❤️ (l'aperçu du lien
  lui-même est géré nativement par Discord).

## Hébergement sur Render

Le dépôt contient un `render.yaml` (à la racine) qui déclare un
**Background Worker** Render pour ce bot.

1. Sur https://dashboard.render.com, "New" → "Blueprint", et sélectionne
   ce dépôt GitHub. Render détecte `render.yaml` automatiquement.
2. Dans les paramètres du service créé (`deepwoken-bot`), onglet
   "Environment", ajoute les variables : `DISCORD_TOKEN`, `GUILD_ID`,
   `VERIFIED_ROLE_ID`, `VERIFICATION_CHANNEL_ID`, `MOD_LOG_CHANNEL_ID`,
   `LINK_EXEMPT_CATEGORY_ID`, `SHOWCASE_CHANNEL_ID`.
   Elles ne sont pas dans le repo (volontairement, pour ne pas exposer le
   token) : à saisir uniquement dans l'interface Render.
3. Déploie. Les logs du service doivent afficher `Connecté en tant que
   <nom du bot>`.

Un **Background Worker** ne reçoit pas de trafic HTTP, c'est fait pour un
processus qui tourne en continu comme ce bot (pas pour une page web).
