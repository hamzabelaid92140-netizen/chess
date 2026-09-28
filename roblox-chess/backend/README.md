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
adresse **HTTPS publique**. Options simples et gratuites/pas cheres pour
demarrer :

- **Render** (render.com) : deploiement direct depuis GitHub, plan gratuit
  suffisant pour tester.
- **Railway** (railway.app) : pareil, tres simple.
- **Fly.io** : un peu plus technique mais gratuit pour un petit service.

Dans tous les cas :
1. Connecte ce repo GitHub au service.
2. Indique le dossier `roblox-chess/backend` comme racine du projet.
3. Renseigne les variables d'environnement (`STOCKFISH_PATH`, `API_KEY`,
   etc.) dans les settings du service — jamais dans un fichier commite.
4. Assure-toi que Stockfish est installe sur l'image (certains services
   permettent un `Dockerfile` ou un `apt.txt`/`nixpacks.toml` pour ca).
5. Recupere l'URL HTTPS publique donnee par le service, tu en auras besoin
   cote Roblox.

## Securite

- `API_KEY` doit etre une valeur longue et aleatoire, jamais commitee.
- Sans cette cle, n'importe qui sur internet peut consommer ton temps de
  calcul Stockfish (et ta facture d'hebergement si le plan gratuit a des
  limites).
