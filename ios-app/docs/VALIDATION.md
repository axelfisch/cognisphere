# Recette et preuves

Date : 11 novembre 2026. Environnement : conteneur Linux (Node 22.23.4, Chromium 153 headless via Playwright, poppler).
**Aucun Mac, aucun Xcode, aucun simulateur, aucun iPhone n'était disponible.** Les vérifications sont donc classées
en trois états : réussie, échouée, non exécutée.

## Synthèse

| Vérification | État | Preuve ou raison |
|---|---|---|
| Tests unitaires (32) | Réussie | `npm test` → 32 réussis, 0 échec |
| Parcours sur le bundle livré (44 scénarios) | Réussie | `npm run test:e2e` → 44 réussis, 0 échec, `docs/results/e2e-results.json` |
| Une partie complète de chacun des neuf jeux, FR et EN | Réussie (navigateur) | matrice ci-dessous |
| Premier lancement sans réseau externe | Réussie (navigateur) | toute requête hors bundle est bloquée et comptée : 0 sur 289 requêtes |
| Exports JSON et PDF générés et relus | Réussie (navigateur) | `docs/results/exports/`, contenu relu par `pdftotext` |
| Pont natif (Preferences, Haptics, Filesystem, Share) | Réussie sur **runtime iOS simulé** | faux `window.Capacitor` : séquence écriture → partage → suppression, annulation, échec |
| Génération du projet Xcode et `cap sync` | Réussie | `npx cap add ios`, `npx cap sync ios` sans erreur ; plists et storyboard valides (analyse XML) |
| Build Debug Xcode | **Non exécutée** | `xcodebuild` absent (Linux) |
| Build Release Xcode | **Non exécutée** | idem |
| Lancement et parties sur simulateur iPhone | **Non exécutée** | pas de simulateur |
| Mode avion réel au premier lancement | **Non exécutée** | à faire sur simulateur ou appareil |
| VoiceOver réel, Dynamic Type réel, zones sûres réelles | **Non exécutée** | structure et mise en page vérifiées en navigateur seulement |
| Haptique, feuille de partage, Fichiers, interruptions réelles | **Non exécutée** | nécessite un appareil |
| iPhone physique | **Non exécutée** | pas d'appareil ni de signature |
| Archive Release signée, TestFlight | **Non exécutée** | pas d'équipe Apple ; l'envoi se fait sur instruction d'Axel |
| Captures App Store issues du simulateur | **Non exécutée** | les captures livrées viennent de Chromium (brouillons) |

Aucune vérification exécutée n'est en échec. Défauts trouvés et corrigés pendant la recette : état de sauvegarde lu
avant son initialisation au premier enregistrement, débordement horizontal du profil en texte agrandi, collision
de classe CSS qui écrasait le bouton « Valider » de Reality Rank.

Limite à garder en tête : Chromium n'est pas le WebKit d'iOS. Un rendu correct et une console propre dans le
navigateur prouvent le fonctionnement du code web, pas celui de l'app installée.

## Matrice des neuf jeux

Accès : onglet Jeux → fiche → Jouer. FR : thème sombre, 375 × 667 (iPhone compact). EN : thème clair, 430 × 932
(grand écran). Le « joueur » automatique résout chaque item à partir de l'écran, sans crochet de test dans l'app.
Pour chaque partie : score affiché = score attendu = score enregistré, **une** session ajoutée, puis Rejouer
ouvre une session neuve, Quitter → Annuler reste en jeu, Quitter → confirmer n'ajoute rien.

| Jeu | FR : scénario → score | EN : scénario → score | Enregistrements |
|---|---|---|---|
| Logic Bridge | sans faute → 100 | 1 erreur → 80 | 1 par partie |
| Symbol Sprint | 12 cibles, 0 erreur → 100 | 12 cibles, 2 erreurs, pressions répétées → 83 | 1 par partie |
| Memory Stack | 6 positions → 100 | 2 positions fausses → 67 | 1 par partie |
| Pattern Triangles | sans faute → 100 | 2 erreurs → 60 | 1 par partie |
| Reality Rank | ordre suggéré → 100 | deux premiers inversés → 83 | 1 par partie |
| Iceberg Inference | sans faute → 100 | 1 erreur → 67 | 1 par partie |
| Verbal Analogy | sans faute → 100 | 3 erreurs → 40 | 1 par partie |
| Number Sequence | sans faute → 100 | 5 erreurs → 0 (affiché « 0 », pas « Non joué ») | 1 par partie |
| Rule Shift | sans faute → 100 | 3 erreurs → 63 | 1 par partie |

Scénarios complémentaires réussis : Symbol Sprint sans réponse → 0 avec 12 cibles manquées ; une seule cible → 8 ;
Reality Rank ordre inverse → 0 puis boutons Jeux et Profil ; même couleur pour cibles et distracteurs ; règle
affichée de Rule Shift comparée à la règle notée à chaque item, changement constaté au 5ᵉ uniquement ; seconde
pression pendant la transition ignorée ; séquence de Memory Stack absente de la page après 5 s.

## Scénarios de régression issus de l'audit

| Observation de l'audit | Test |
|---|---|
| Règle affichée ≠ règle notée (Rule Shift) | unitaire « the displayed rule is the scored rule » + contrôle à chaque item en parcours |
| Délais non nettoyés, passage rapide A→B | unitaire « fast switch A to B » + parcours « abandon with a pending delay » |
| Fin enregistrée plusieurs fois | unitaire « commits exactly once » + contrôle « une session ajoutée » sur 18 parties |
| Symbol Sprint : pressions, cibles manquées, couleur | unitaire « bounded score for every required scenario » + parcours |
| Stockage invalide ou bloqué | unitaires stockage + parcours « invalid storage », « storage blocked » |
| Sauvegarde V2 réelle | unitaire et parcours « schema update » avec une fixture au format `cognisphere_v2` |
| PDF anglais, 15 lignes fixes | unitaires PDF vide / rempli / 60 sessions (2 pages), accents vérifiés |
| Arrière-plan pendant un jeu chronométré | unitaire « pause » + parcours « background/foreground » (reste d'exposition mesuré : 4,3 s sur 5 après 1 s jouée et 6 s cachées) |
| Processus tué | parcours « process killed mid-game » |

## Accessibilité et mise en page (navigateur)

- 42 écrans audités à 16, 23 et 28 px de corps de texte, deux tailles d'écran, deux thèmes : aucun débordement
  horizontal, toutes les cibles ≥ 44 × 44.
- Un `h1` par écran, tous les boutons nommés, tous les graphiques décrits ou masqués, régions d'annonce, attribut `lang`.
- Réduire les animations : animations neutralisées, score affiché sans compteur.
- Le contraste n'a pas été mesuré par un outil ; les couleurs de texte du thème clair ont été assombries à la main.

## Reprise sur le Mac d'Axel

1. `cd ios-app && npm ci && npm run sync && npm run open`
2. Xcode : schéma **App**, choisir l'équipe, lancer sur un simulateur iPhone (Debug). Puis *Product → Build* en Release.
3. Rejouer la matrice ci-dessus à la main en FR et en EN, sur un iPhone compact et un grand écran.
4. Mode avion **avant** le premier lancement : onboarding, neuf jeux, profil, deux exports.
5. Pendant Symbol Sprint : bouton latéral ou appel entrant → retour dans l'app → la pause doit attendre « Reprendre ».
6. Profil → Partager en JSON puis en PDF → « Enregistrer dans Fichiers » → ouvrir les deux fichiers. Refaire en annulant.
7. Plus → Contacter le support (doit ouvrir Mail). Fermer puis relancer l'app : scores, langue, thème conservés.
8. Réglages iOS : VoiceOver, plus grande taille de texte, Réduire les animations.
9. Reprendre les captures sur simulateur 6,9 pouces, puis archiver (*Product → Archive*).

Si une étape échoue, le message exact de Xcode ou de la console (Safari → Développement → simulateur) suffit pour corriger.
