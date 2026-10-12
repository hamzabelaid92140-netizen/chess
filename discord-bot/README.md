# Bot Discord Deepwoken

Bot pour un serveur Discord de builder Deepwoken : salon de vérification
pour débloquer le reste du serveur, et salon de collecte d'ID (hair-id).

## Installation

```bash
cd discord-bot
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
- `HAIR_ID_CHANNEL_ID` : l'ID du salon où les membres soumettent leur ID.

Le bot a besoin des intents "Server Members" et "Message Content" activés
sur le portail développeurs, et de la permission "Manage Roles" sur le
serveur (son rôle doit être placé au-dessus du rôle vérifié).

## Lancement

```bash
python main.py
```

## Fonctionnement

- **Salon de vérification** : un administrateur lance `/setup-verification`
  dans le salon configuré. Ça poste un message avec un bouton "Je me
  vérifie". Au clic, le membre reçoit le rôle vérifié.
- **Salon hair-id** : les membres vérifiés y envoient leur ID (uniquement
  des chiffres, 4 à 15 caractères). Un ID valide reçoit une réaction ✅ et
  est enregistré dans `data/hair_ids.json`. Un message invalide, ou envoyé
  par un membre non vérifié, est supprimé avec une explication en message
  privé.

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
