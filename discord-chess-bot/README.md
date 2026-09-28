# Bot Discord d'echecs (Stockfish)

Bot Discord pour jouer aux echecs contre Stockfish (moteur open-source, configurable
en force maximale = quasi injouable). Le bot n'envoie jamais de texte de
commentaire : il renvoie uniquement l'image du plateau apres chaque coup.

## Commandes

- `/chess` : demarre une nouvelle partie (tu joues les blancs, le bot les noirs).
- `/move <coup>` : joue un coup, en notation UCI (`e2e4`) ou SAN (`Nf3`).
- `/resign` : abandonne la partie en cours.

## Installation

### 1. Stockfish

Le bot a besoin du binaire Stockfish installe sur la machine qui le fait tourner.

```bash
# Debian/Ubuntu
sudo apt-get install stockfish

# macOS
brew install stockfish
```

Ou telecharge le binaire officiel sur https://stockfishchess.org/download/ et
renseigne son chemin complet dans `STOCKFISH_PATH`.

### 2. Dependances Python

```bash
cd discord-chess-bot
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Creer le bot Discord

1. Va sur https://discord.com/developers/applications et cree une application.
2. Dans l'onglet "Bot", cree un bot et copie son token.
3. Dans l'onglet "OAuth2 > URL Generator", coche le scope `bot` et
   `applications.commands`, puis les permissions `Send Messages` et
   `Attach Files`.
4. Utilise l'URL generee pour inviter le bot sur ton serveur.

### 4. Configuration

```bash
cp .env.example .env
```

Remplis `.env` avec ton token Discord et, si besoin, le chemin vers Stockfish.

### 5. Lancer le bot

```bash
python bot.py
```

## Reglages pour la force maximale

Le bot ne limite jamais artificiellement Stockfish (pas de "Skill Level" qui
simule des erreurs humaines). Sa force vient de ces reglages, dans `.env` :

- **`THINK_TIME`** : temps de reflexion par coup, en secondes. Plus il est
  eleve, plus la recherche va loin. 3 secondes suffit deja largement contre
  un joueur amateur ; monte a 5-10s pour un adversaire plus fort.
- **`SF_THREADS`** : nombre de coeurs CPU utilises pour la recherche.
  Laisse-le vide pour un choix automatique (nb de coeurs - 1), ou fixe-le
  si tu veux garder des coeurs libres pour autre chose sur la machine.
- **`SF_HASH_MB`** : taille de la table de transposition. Plus elle est
  grande, moins le moteur recalcule des positions deja vues. 256 Mo est un
  bon defaut, monte a 1024+ si la machine a assez de RAM.
- **`SF_DEPTH`** : profondeur de recherche minimale garantie (en plus du
  temps). Optionnel, utile si tu veux forcer une recherche tres profonde
  independamment du temps disponible.
- **`SF_SYZYGY_PATH`** : chemin vers des tables de finales Syzygy
  (telechargeables sur https://tablebase.lichess.ovh/tables/standard/).
  Avec ca, le moteur joue les finales a 7 pieces ou moins de facon
  mathematiquement parfaite, plus de recherche heuristique du tout.
