# Notation et données

## Score d'une session (0 à 100)

| Jeu | Calcul |
|---|---|
| Logic Bridge, Pattern Triangles, Verbal Analogy, Number Sequence | bonnes réponses / 5 |
| Iceberg Inference | bonnes réponses / 3 |
| Rule Shift | bonnes réponses / 8 (4 « oui », 4 « non » : répondre toujours pareil donne 50) |
| Memory Stack | symboles à la bonne position / 6 |
| Symbol Sprint | max(0, (cibles touchées − touches erronées) / 12). Aucune réponse : 0. Une cible sur douze : 8. Tout toucher : 0. Douze cibles sans erreur : 100 |
| Reality Rank | paires d'explications dans l'ordre suggéré / 6. Un échange de deux voisins : 83. Ordre inverse : 0 |

Les valeurs sont arrondies à l'entier.

## Agrégation (règles du web conservées, vérifiées dans `index.html`)

- Score d'un domaine : premier résultat tel quel, puis `arrondi(0,6 × ancien + 0,4 × nouveau)`.
- Moyenne : moyenne des scores des domaines joués.
- Historique : 60 sessions les plus récentes.

Ajouts : le nombre de sessions et le meilleur score de chaque domaine sont stockés à part. La **couverture**
(domaines joués sur 9) ne dépend donc pas de l'historique visible : un domaine reste « joué » même si ses sessions
sont sorties des 60 dernières. Les libellés de « fiabilité » du web, fondés sur le seul nombre total de sessions,
sont supprimés.

## Version de notation

- `sv: 1` : formules du web V2. `sv: 2` : formules iOS 1.0 (Symbol Sprint et Reality Rank ont changé).
- Chaque session porte sa version. Les anciennes sessions ne sont pas recalculées : le web n'a jamais stocké les
  réponses, seulement le score. Un score de domaine issu du web continue d'être lissé avec les nouveaux résultats ;
  pour Symbol Sprint et Reality Rank, les scores avant et après migration ne sont pas strictement comparables.

## Stockage

- Clé `cognisphere_ios_v3`, schéma 3 : `{ schema, scoringVersion, domains, sessions, prefs }`.
- iOS : `UserDefaults` via le plugin Preferences (durable), avec copie dans le `localStorage` de la WebView.
- Lecture : chaque entrée est validée. Une entrée invalide est écartée sans toucher aux autres. Un JSON illisible
  est conservé sous `cognisphere_ios_v3_corrupt` et l'app démarre vide.
- Format web V2 (`cognisphere_v2`, `cog_lang`) : reconnu et migré sans supprimer l'ancienne clé. Les données du site
  dans Safari et le conteneur de l'app sont distincts : **il n'y a pas de transfert automatique** des sauvegardes web.
  La migration ne sert que si ces clés se trouvent déjà dans la WebView de l'app.
- Échec d'écriture : le résultat reste affiché, l'écran de résultat et le profil signalent l'échec.

## Session de jeu

Une seule session active (`src/core/session.js`). Elle possède ses délais ; quitter, rejouer ou lancer un autre jeu
l'invalide. Session abandonnée : zéro écriture. Session terminée : une écriture, même si plusieurs événements de fin
arrivent (garde dans la session, dans le gestionnaire et sur l'identifiant de session au stockage).
Jeux chronométrés (Symbol Sprint, exposition de Memory Stack) : échéances mesurées sur `performance.now()`, mise en
pause dès que l'app passe en arrière-plan ou est interrompue, reprise uniquement par le bouton « Reprendre ».
