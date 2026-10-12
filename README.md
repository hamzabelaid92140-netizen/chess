# Bot Discord Deepwoken

Bot pour un serveur Discord de builder Deepwoken : salon de vérification
pour débloquer le reste du serveur, et forum hair-id qui transforme les
ID Roblox postés par les membres en images, et publie lui-même des hair
cuts trouvés sur le catalogue Roblox.

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
- `HAIR_ID_CHANNEL_ID` : l'ID du **forum** où les membres postent leur ID
  et où le bot publie ses propres posts.

Le bot a besoin des intents "Server Members" et "Message Content" activés
sur le portail développeurs, de la permission "Manage Roles" sur le
serveur (son rôle doit être placé au-dessus du rôle vérifié), et sur le
forum hair-id : Envoyer des messages, Créer des posts publics, Gérer les
fils (pour verrouiller les posts des membres non vérifiés), Intégrer des
liens.

## Lancement

```bash
python main.py
```

## Fonctionnement

- **Salon de vérification** : un administrateur lance `/setup-verification`
  dans le salon configuré. Ça poste un message avec un bouton "Je me
  vérifie". Au clic, le membre reçoit le rôle vérifié.
- **Forum hair-id** : `HAIR_ID_CHANNEL_ID` doit être un salon **forum**
  (pas un salon texte classique). Quand un membre vérifié crée un post
  avec un ID Roblox dedans (4 à 15 chiffres), le bot répond dans le fil
  avec l'image du hair cut correspondant (via l'API de thumbnails
  Roblox). Un membre non vérifié voit son post verrouillé avec une
  explication.
- **Auto-post** : toutes les minutes, le bot pioche un hair cut sur le
  catalogue Roblox (sans répéter ceux déjà postés, suivis dans
  `data/posted_hair_ids.json`) et crée lui-même un post dans le forum
  avec son image. Les identifiants de catégorie Roblox utilisés
  (`Category=11`, `Subcategory=20`) viennent du forum développeurs
  Roblox, pas d'une doc officielle à jour — si l'auto-post s'arrête de
  trouver des items, ce sont probablement ces valeurs qui ont changé
  côté Roblox. L'intervalle (1 min) se change dans
  `cogs/hair_catalog.py`, `@tasks.loop(minutes=1)`.

## Hébergement sur Render

Le dépôt contient un `render.yaml` (à la racine) qui déclare un
**Background Worker** Render pour ce bot.

1. Sur https://dashboard.render.com, "New" → "Blueprint", et sélectionne
   ce dépôt GitHub. Render détecte `render.yaml` automatiquement.
2. Dans les paramètres du service créé (`deepwoken-bot`), onglet
   "Environment", ajoute les variables : `DISCORD_TOKEN`, `GUILD_ID`,
   `VERIFIED_ROLE_ID`, `VERIFICATION_CHANNEL_ID`, `HAIR_ID_CHANNEL_ID`.
   Elles ne sont pas dans le repo (volontairement, pour ne pas exposer le
   token) : à saisir uniquement dans l'interface Render.
3. Déploie. Les logs du service doivent afficher `Connecté en tant que
   <nom du bot>`.

Un **Background Worker** ne reçoit pas de trafic HTTP, c'est fait pour un
processus qui tourne en continu comme ce bot (pas pour une page web).
