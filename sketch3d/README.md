# Le couloir

Un site en 3D navigable (three.js), rendu pour ressembler à un dessin au
crayon fait main, dans l'esprit du croquis d'origine : un couloir menant à
un ascenseur, avec ses lignes de fuite qui rayonnent depuis le fond, et une
petite pièce sur le côté où un personnage se plaint au téléphone sous
l'inscription « BLAME JOHN ».

Le principe : la géométrie, la caméra et les déplacements sont une vraie
scène 3D (three.js + contrôles FPS souris/clavier), mais chaque surface est
texturée avec un dessin généré au runtime via [rough.js](https://roughjs.com/)
(hachures, contours qui tremblent, papier légèrement grainé). Les contours
noirs des objets en volume (piliers, comptoir) utilisent une extrusion de
coque inversée, animée pour un léger tremblé « fait main ».

## Lancer le site

C'est un site 100% statique, sans build, mais il utilise des modules ES
(`import`) : ouvrir `index.html` directement avec `file://` sera bloqué par
le navigateur (CORS). Il faut le servir avec un petit serveur local, par
exemple :

```bash
cd sketch3d
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```

Ou n'importe quel serveur statique (Vite `vite preview`, `npx serve`,
GitHub Pages, Netlify, Vercel...). Toutes les dépendances (three.js,
PointerLockControls, rough.js, les polices) sont vendorisées dans
`vendor/` — aucune requête vers un CDN externe au chargement.

## Contrôles

- Clic sur la scène : verrouille la souris et entre dans la scène
- `Z/Q/S/D` ou `W/A/S/D` (+ flèches) : marcher
- Souris : regarder autour de soi
- `Échap` : relâcher le curseur

## Structure

- `index.html` — squelette de la page, import map vers `vendor/`
- `style.css` — overlay d'intro, curseur, bulle de dialogue
- `js/textures.js` — génère tous les « dessins » (sol, murs, porte
  d'ascenseur, personnage, texte) sous forme de textures canvas
- `js/main.js` — scène three.js : géométrie du couloir, caméra FPS,
  collisions, contours à la main, animation

## Pour aller plus loin

- Éditer `REGIONS` dans `js/main.js` pour agrandir le plan (nouvelles
  pièces, couloirs) — chaque région est un rectangle dans lequel le joueur
  peut marcher ; les murs sont construits à partir des mêmes coordonnées.
- Éditer `js/textures.js` pour changer le style du dessin (couleurs,
  densité des hachures, police du texte).
