# Jeu d'echecs Roblox (solo, contre Stockfish)

Une piece plongee dans le noir, un plateau eclaire par une seule source de
lumiere, un pion geant assis sur une chaise en face de toi. Tu t'assois sur
la chaise du joueur, la partie demarre automatiquement. Tu joues les
blancs, l'adversaire (Stockfish, a fond) joue les noirs.

Tout est construit par script (pas de modelisation manuelle necessaire) :
la salle, le plateau, les pieces, les chaises. Tu peux bien sur repasser
dessus dans Studio ensuite pour peaufiner si tu veux.

## Avant de commencer

Ce projet a besoin du backend Python (dossier `roblox-chess/backend`) **deja
deployé et accessible en HTTPS** avant de pouvoir tester quoi que ce soit
dans Roblox — Roblox ne peut pas contacter un `localhost` sur ta machine.
Suis d'abord `roblox-chess/backend/README.md`.

## 1. Installer Rojo

[Rojo](https://rojo.space/) synchronise ce dossier de fichiers (versionne
sur GitHub, editable dans un vrai editeur de code) avec Roblox Studio.

1. Installe le plugin Rojo dans Roblox Studio : dans Studio, va dans
   `Plugins > Manage Plugins`, cherche "Rojo" et installe-le. (Ou installe
   `rojo` en ligne de commande via https://rojo.space/docs/installation/
   si tu veux aussi le CLI.)
2. Ouvre une place Roblox vide dans Studio.

## 2. Configurer tes identifiants

```bash
cd roblox-chess/roblox
cp Config.example.lua src/ServerScriptService/Config.lua
```

Edite `src/ServerScriptService/Config.lua` et renseigne :
- `BackendUrl` : l'URL HTTPS publique de ton backend (donnee par Render/
  Railway/etc. apres le deploiement)
- `ApiKey` : exactement la meme valeur que `API_KEY` dans le `.env` du
  backend

**Ce fichier est ignore par git** (voir `.gitignore`), comme le `.env` du
bot Discord : tes vraies valeurs ne partent jamais sur GitHub.

## 3. Synchroniser avec Studio

Dans Studio, ouvre le panneau Rojo (plugin installe a l'etape 1), clique
sur **Connect**, en pointant vers ce dossier `roblox-chess/roblox`
(fichier `default.project.json`). Le script serveur et le script client
apparaissent alors dans l'arborescence de la place.

## 4. Autoriser les requetes HTTP

Indispensable, sinon le jeu ne pourra jamais parler au backend :

1. Dans Studio, menu `Home > Game Settings`.
2. Onglet `Security`.
3. Active **Allow HTTP Requests**.
4. Sauvegarde.

## 5. Tester

Appuie sur **Play** dans Studio. Ton personnage apparait dans une piece
noire. Approche-toi de la chaise (celle sans le pion geant dessus) et
assieds-toi (clic droit dessus, ou `E` selon la config). La partie doit
demarrer : les pieces apparaissent sur le plateau.

Pour jouer : clique sur une case avec une de tes pieces (elle se
surligne), puis clique sur la case de destination. Le coup est envoye au
backend, qui valide, joue le coup, calcule la reponse de Stockfish, et
renvoie le plateau a jour.

## Limites actuelles (a savoir)

- **Promotion automatique en dame.** Si un pion atteint la derniere
  rangee, il devient toujours une dame (pas de choix de piece). C'est le
  cas le plus frequent, une vraie interface de choix peut etre ajoutee
  plus tard si besoin.
- **Pas de surbrillance des coups legaux.** Cliquer une piece puis une
  case invalide renvoie juste "coup illegal, reessaie" — le plateau
  n'indique pas a l'avance ou tu peux aller. Amelioration possible plus
  tard (le backend peut deja calculer `board.legal_moves`).
- **Pieces en formes geometriques simples** (cylindres/boules/blocs), pas
  de modeles sculptes. Fonctionnel et lisible, mais pas du triple-A —
  remplaçables par de vrais meshes si tu veux polir le visuel plus tard.
- **Un seul joueur a la fois** (une seule chaise, un seul siege) : c'est
  voulu, le jeu est solo.

## Debug

- Le siege ne lance rien quand tu t'assois -> verifie la sortie de la
  fenetre "Output" dans Studio : le script affiche un `warn(...)` explicite
  si le backend ne repond pas (mauvaise URL, mauvaise cle, backend
  eteint, ou "Allow HTTP Requests" pas active).
- Erreur `Config.lua manquant` au demarrage -> tu as saute l'etape 2.
- Les pieces sont couchees / mal placees -> verifie que tu as bien la
  derniere version du script (le pivot des pieces a ete corrige pour
  eviter exactement ce probleme).
