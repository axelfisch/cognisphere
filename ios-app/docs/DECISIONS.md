# Décisions, provenance et écarts

## Provenance

- Code de référence : `axelfisch/cognisphere`, branche `main`, commit `670986c9a25b59d8c43ce59bf9fc43611d32eb0b`
  (HEAD vérifié le 11 novembre 2026). `index.html` : 106 505 octets, lu en entier.
- Maquette : `Cognisphere iOS.dc.html` (41 344 octets), identique dans les deux archives fournies. Lue en entier.
  Constats vérifiés dans son code : seuls Rule Shift et Number Sequence sont jouables (`PLAYABLE = ['shift','sequence']`),
  les deux boutons d'export affichent un message (`doExport` → toast), aucun parcours n'y est testé.
- Audit `Cognisphere_Prompt_Claude.md` : ses observations ont servi de scénarios de régression (voir VALIDATION).
- Non accessibles depuis l'environnement : les deux sites Netlify (bloqués par le réseau), le dépôt privé
  `Cognisphere-beta-v1`, l'archive `Cognisphere_V2_recuperee.zip`.

## Architecture

- **Capacitor 8.6** (une seule architecture, un seul moteur de jeu). Aucun projet iOS n'existait dans le dépôt.
- Projet Xcode généré avec Swift Package Manager (pas de CocoaPods). Aucun code Swift ajouté au gabarit Capacitor.
- Le web est servi depuis l'origine locale stable `capacitor://localhost`. Pas de `server.url` : aucune build ne
  pointe vers un serveur de développement. Une CSP interdit tout script, style ou police hors du bundle.
- Bibliothèques embarquées : jsPDF 4.2.1 (chargé à la demande au premier export PDF), polices Sora et DM Serif Display.
- **Chart.js est remplacé** par un radar SVG local (`src/ui/radar.js`), doublé d'une liste lisible des neuf domaines.
- Plugins natifs : App (cycle de vie), Haptics, Preferences (stockage durable), Filesystem + Share (vrais fichiers).
  Les liens externes (support par e-mail, politique en ligne) sortent de l'app via le comportement standard de Capacitor.
- Le code web d'origine (`index.html` à la racine) n'est **pas modifié**. Le portage vit dans `ios-app/`.

## Cible

- iOS 15.0 minimum, iPhone uniquement, portrait uniquement. iPad et paysage ne sont pas annoncés.
- Envoi à Apple : Xcode 26 / SDK iOS 26 obligatoires (page « Upcoming Requirements » d'Apple consultée le 11 novembre 2026).

## Corrections apportées aux jeux (par rapport au web)

| Jeu | Problème constaté dans `index.html` | Décision |
|---|---|---|
| Rule Shift | La règle affichée était lue avant un changement aléatoire de `ruleIdx`, puis la note utilisait la nouvelle règle | Règle figée dans chaque item et seule utilisée pour noter. 8 items, 4 oui / 4 non, changement forcé au 5ᵉ, formes neutres (pas de couleur) |
| Symbol Sprint | Chaque pression comptait, cibles manquées ignorées, cibles en cyan et distracteurs en rouge, 1 réussite = 100 | 30 symboles, 12 cibles, une réponse par symbole, même couleur pour tous, score = (réussites − erreurs) / 12 |
| Memory Stack | `setTimeout` de 5,2 s jamais annulé, pastilles distinguées par la seule couleur | Délai possédé par la session, symboles distincts par la forme et le nom, effacement du dernier ou de tout |
| Pattern Triangles | La consigne demandait de trouver une règle « cachée » alors qu'elle était affichée | La règle est à déduire de trois exemples, révélée dans le retour. Une règle différente par énigme |
| Reality Rank | Ordre « optimal » sans justification, pas d'annulation, écran de fin sans bouton Profil, score par position exacte | Scénarios avec indices, retrait et déplacement, score par paires, explication de l'ordre, écran de résultat commun |
| Iceberg Inference | Réponses attendues discutables (« tricherie ») | Nouveaux scénarios : l'hypothèse la mieux étayée, formulée avec prudence |
| Verbal Analogy | Mots uniquement en anglais, plusieurs réponses défendables (Museum/Gallery, Sky/Nest…) | Dix items rédigés séparément en FR et en EN, une seule réponse valable |
| Number Sequence | Suite 100, 50, 25, 12, 6 → 3 avec arrondi | Suites générées, divisions toujours exactes, distracteurs uniques et bornés |
| Logic Bridge | Une option FR ambiguë (« Toutes les planètes n'orbitent pas ») | Dix items revus, explication dans chaque langue |
| Tous | `sort(() => Math.random() - .5)`, retour par `innerHTML`, score enregistré à chaque événement de fin | Fisher–Yates avec générateur contrôlable, données insérées comme texte, finalisation idempotente |

## Écarts avec la maquette

- **Logo** : la maquette et le dépôt contiennent le logo simple (triangle + cercle). Les captures de la bêta en ligne
  montrent un logo plus riche (triangle dégradé, lettre C, sphère, trois points). Le fichier source n'étant pas
  accessible, ce logo a été **redessiné en vectoriel d'après les captures** (`src/assets/logo.svg`). À remplacer par
  le fichier officiel si Axel le fournit.
- Fiche de jeu : ajout des rubriques « Comment jouer » et « Calcul du score ».
- Rule Shift : la maquette enchaîne après 750 ms, l'app après 650 ms. Les autres jeux à choix attendent un appui sur
  « Suivant » pour laisser lire l'explication.
- Accueil : anneau de couverture à neuf segments au lieu de neuf barres. Suggestion = premier domaine non joué.
- Profil : ajout du radar, du meilleur score, de l'état de sauvegarde. Plus : ajout du réglage haptique, de la
  politique de confidentialité, du support et des licences.
- Mention « V2 BETA » retirée de l'en-tête. Formulations « QI », « diagnostic », « fiabilité » supprimées partout.
- Animations ajoutées : transitions d'écran, lumière d'ambiance, compteur de score, tracé du radar, retours de
  réponse. Toutes neutralisées avec « Réduire les animations ».

## Langue en cours de partie

Le réglage de langue se trouve dans l'onglet Plus, inaccessible pendant une partie (la barre d'onglets est masquée).
Les items sont de toute façon identifiés par des identifiants stables et notés indépendamment de la langue.
