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

Remplis `.env` avec ton token Discord et, si besoin, le chemin vers Stockfish
(`SKILL_LEVEL=20` = force maximale par defaut).

### 5. Lancer le bot

```bash
python bot.py
```

## Difficulte

`SKILL_LEVEL` va de 0 (tres faible) a 20 (force maximale, quasi injouable).
`THINK_TIME` est le temps de reflexion du moteur par coup, en secondes : plus
il est eleve, plus le bot joue fort (et plus il met de temps a repondre).
