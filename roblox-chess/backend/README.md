# Backend Stockfish pour le jeu Roblox

API HTTP qui fait tourner Stockfish a pleine puissance. Le script Roblox
lui envoie les coups du joueur, elle repond avec le coup de l'IA. Toute la
logique des regles d'echecs (coups legaux, echec, mat) vit ici, en Python
avec `python-chess` — le script Roblox n'a besoin de rien valider lui-meme.

## Pourquoi un serveur separe ?

Roblox (Luau) ne peut pas executer un binaire natif comme Stockfish. Le
jeu Roblox doit donc appeler un serveur externe en HTTP pour obtenir les
coups de l'IA. C'est ce backend.

## Endpoints

- `POST /new_game` -> cree une partie, renvoie `game_id` + l'etat du plateau
- `POST /move` -> `{game_id, from_square, to_square, promotion?}`, renvoie
  le plateau apres le coup du joueur ET la reponse de Stockfish
- `GET /board/{game_id}` -> etat actuel du plateau
- `DELETE /game/{game_id}` -> supprime une partie terminee

Toutes les routes attendent un header `X-API-Key` correspondant a la
valeur `API_KEY` de ton `.env`.

Format des cases : notation standard (`e2`, `e4`, ...). Format des pieces
dans `pieces` : lettre majuscule = blanc, minuscule = noir
(`P`=pion, `N`=cavalier, `B`=fou, `R`=tour, `Q`=dame, `K`=roi).

## Installation locale

```bash
sudo apt-get install stockfish   # ou brew install stockfish sur mac
cd roblox-chess/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# edite .env : STOCKFISH_PATH (ex: /usr/games/stockfish sur Debian/Ubuntu)
#              et API_KEY (choisis une valeur secrete)
uvicorn main:app --host 0.0.0.0 --port 8000
```

Verifie le chemin de Stockfish avec `which stockfish` (souvent
`/usr/games/stockfish` sur Debian/Ubuntu, `/usr/local/bin/stockfish` sur mac).

## Deploiement (obligatoire pour Roblox)

Roblox tourne sur les serveurs de Roblox, pas sur ton PC : `HttpService`
ne peut donc pas atteindre `localhost`. Il faut heberger ce backend sur une
adresse **HTTPS publique**. C'est cette URL-la que tu mets dans `BackendUrl`
cote Roblox.

Un `Dockerfile` est fourni dans ce dossier (il installe Stockfish
automatiquement), le chemin le plus simple est donc **Render** avec deploiement
Docker.

### Render, pas a pas

1. Va sur https://render.com et cree un compte (tu peux te connecter avec
   GitHub directement).
2. Clique sur **New +** -> **Web Service**.
3. Connecte ton compte GitHub si ce n'est pas deja fait, puis choisis le
   repo `hamzabelaid92140-netizen/chess`.
4. Dans les reglages du service :
   - **Root Directory** : `roblox-chess/backend`
   - **Environment** / **Runtime** : Render doit detecter automatiquement
     le `Dockerfile` et proposer "Docker" — laisse-le faire.
   - **Instance Type** : Free suffit pour tester.
5. Dans l'onglet **Environment** (variables d'environnement), ajoute :
   - `API_KEY` = ta cle secrete (celle que tu as generee, la meme que
     cote Roblox)
   - Les autres (`THINK_TIME`, `SF_HASH_MB`, etc.) sont optionnelles, les
     valeurs par defaut du code suffisent pour commencer.
6. Clique sur **Create Web Service**. Le premier build prend quelques
   minutes (il installe Stockfish + les dependances Python).
7. Une fois le statut passe a **Live**, Render affiche l'URL en haut de la
   page, du type :
   ```
   https://chess-backend-xxxx.onrender.com
   ```
   **C'est cette URL exacte que tu mets dans `BackendUrl`**, dans le
   `Config` Roblox (pas besoin d'ajouter `/` a la fin).

Note sur le plan gratuit Render : le service s'endort apres quelques
minutes d'inactivite et met 30-60s a se reveiller au premier appel suivant
— la premiere partie apres une pause peut donc mettre un peu de temps a
demarrer, c'est normal.

### Alternatives
- **Railway** (railway.app) : meme principe, detecte aussi le `Dockerfile`.
- **Fly.io** : un peu plus technique (CLI a installer) mais gratuit aussi.

## Securite

- `API_KEY` doit etre une valeur longue et aleatoire, jamais commitee.
- Sans cette cle, n'importe qui sur internet peut consommer ton temps de
  calcul Stockfish (et ta facture d'hebergement si le plan gratuit a des
  limites).
