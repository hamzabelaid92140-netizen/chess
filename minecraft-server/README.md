# Serveur Minecraft "de zinzin" (100% vanilla côté client)

Le principe : au lieu d'un modpack (Forge/Fabric) que chaque pote doit installer,
on utilise un serveur **Paper** (compatible vanilla) + des **plugins**. Les plugins
tournent uniquement sur le serveur : tes potes se connectent avec le client
Minecraft officiel, sans rien installer.

Limite à connaître : un plugin ne peut pas ajouter de nouveaux blocs/items qui
changent le rendu du jeu comme un vrai mod. Il peut par contre changer à peu
près tout le reste (mobs, commandes, économie, événements, grief-protection,
machines "façon mod" avec des items vanilla recolorés via Slimefun, etc.).

## Lancer le serveur

Prérequis : Docker + Docker Compose installés sur ta machine.

```bash
cd minecraft-server
docker compose up -d
docker compose logs -f mc   # suivre le démarrage, première fois ça télécharge Paper + les plugins
```

Pour l'arrêter : `docker compose down` (les données/le monde restent dans `./data`).

Le fichier `docker-compose.yml` installe déjà automatiquement, via Modrinth, un
socle de plugins utiles :

- **LuckPerms** — gestion des permissions/rangs
- **EssentialsX** — commandes de base (`/tpa`, `/home`, `/warp`, `/kit`...)
- **CoreProtect** — logs + rollback anti-grief (indispensable entre potes 😄)
- **WorldEdit** — outils de construction rapide
- **Chunky** — pré-génère le monde pour éviter les lags en explorant

Change la version dans `VERSION:` du `docker-compose.yml` si tu veux autre
chose que 1.21.1 (vérifie juste que les plugins ci-dessous suivent la version).

## Se connecter

- **Même réseau Wi-Fi/LAN** : les potes mettent l'IP locale de ta machine
  (ex. `192.168.1.42`) comme adresse de serveur.
- **Potes pas chez toi** (le plus probable) : le plus simple sans configurer
  de redirection de port sur ta box, c'est [playit.gg](https://playit.gg) :
  tu installes leur petit agent sur la machine qui héberge le serveur, il te
  donne une adresse publique du type `xxxx.joinmc.link` à donner à tes potes.
  Toujours 100% client vanilla, rien à installer côté joueur.

## Plugins "zinzin" à ajouter (effet modpack, sensations de mod)

Ceux-là demandent de récupérer le `.jar` toi-même (compatibilité de version
à vérifier au moment où tu le fais) et de le déposer dans `data/plugins/`,
puis `docker compose restart mc` :

- **Slimefun** — LE plus proche d'un vrai modpack en 100% serveur : électricité,
  machines, armures/items custom, multiverse de contenu. Build communautaire
  maintenu ici : https://modrinth.com/project/Fz9hstnG (vérifie la compatibilité
  avec ta version avant de l'installer).
- **MythicMobs** — mobs et boss custom avec compétences, loot, IA. (Spigot/Polymart,
  pas trouvé sur Modrinth au moment d'écrire ceci — cherche "MythicMobs" sur
  spigotmc.org.)
- **EcoEnchants** — tonnes d'enchantements délirants (lance-flammes, téléportation, etc.)
- **Oraxen** ou **ItemsAdder** — items/blocs custom avec textures (nécessite que le
  serveur pousse un resource pack ; le client vanilla l'accepte automatiquement
  à la connexion, donc toujours "rien à installer", juste à accepter le téléchargement).

Installer un plugin manuellement :

```bash
# le .jar téléchargé va dans data/plugins/
cp chemin/vers/Slimefun.jar minecraft-server/data/plugins/
docker compose restart mc
```

## Anti-grief / sécurité entre potes

CoreProtect est déjà installé (socle ci-dessus). Pense à configurer LuckPerms
pour donner un rang "admin" à toi-même et un rang "joueur" limité aux autres
si tu veux éviter les bêtises (`/lp` une fois le serveur lancé).
