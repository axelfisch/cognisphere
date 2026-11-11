# Dossier TestFlight / App Store

Tout ce qui suit est **préparé, pas soumis**. L'envoi à TestFlight ou à la revue se fait sur instruction d'Axel.
Une archive et des captures ne préjugent pas de la décision d'App Review.

## Fichiers

- `icon-1024.png` : icône 1024 × 1024, opaque, sans coins arrondis. Déjà dans l'asset catalog Xcode.
- `screenshots/fr-dark/`, `screenshots/en-light/` : 1320 × 2868 (format 6,9 pouces). **Brouillons rendus dans Chromium**,
  sans barre d'état iOS. À refaire sur simulateur avant soumission ; vérifier les tailles acceptées sur la page
  « Screenshot specifications » d'Apple.
- `privacy-policy.fr.md`, `privacy-policy.en.md` : texte à publier à une URL publique.

## Textes

| Champ | Français | English |
|---|---|---|
| Nom | Cognisphere | Cognisphere |
| Sous-titre (30 car. max) | Neuf mini-jeux pour l'esprit | Nine mini-games for your mind |
| Texte promotionnel | Logique, vitesse, mémoire, motifs : neuf exercices d'une minute, hors ligne et sans compte. | Logic, speed, memory, patterns: nine one-minute exercises, offline and with no account. |
| Mots-clés | logique,mémoire,réflexion,suites,analogies,puzzle,énigmes,hors ligne,jeu,casse-tête | logic,memory,puzzle,sequences,analogies,thinking,offline,brain teaser,game,riddle |
| Catégorie | Jeux → Réflexion (secondaire : Jeux → Quiz) | Games → Puzzle (secondary: Games → Trivia) |

**Description (FR)**

Cognisphere réunit neuf mini-jeux courts et élégants. Chaque partie dure environ une minute.

• Pont logique : trouvez la seule conclusion qui découle des prémisses.
• Sprint de symboles : touchez les cibles, laissez passer les autres.
• Pile mémorielle : retenez six symboles et restituez-les dans l'ordre.
• Triangles-motifs : déduisez la règle cachée.
• Classement réel : classez des explications selon les indices.
• Inférence iceberg : choisissez l'hypothèse la mieux étayée.
• Analogie verbale, Séquence numérique, Changement de règle.

Votre profil montre les domaines joués, votre score par domaine et votre historique. Exportez vos résultats en PDF ou en JSON avec la feuille de partage.

Entièrement hors ligne. Sans compte, sans publicité, sans suivi. Français et anglais, thèmes sombre et clair, retours haptiques, VoiceOver.

Cognisphere est un jeu. Les scores décrivent vos performances dans ses exercices. Ce n'est pas un test et il ne fournit aucun diagnostic.

**Description (EN)**

Cognisphere brings together nine short, elegant mini-games. Each one takes about a minute.

• Logic Bridge: find the one conclusion that follows from the premises.
• Symbol Sprint: tap the targets, let the others go by.
• Memory Stack: remember six symbols and enter them in order.
• Pattern Triangles: work out the hidden rule.
• Reality Rank: order explanations according to the clues.
• Iceberg Inference: choose the best-supported hypothesis.
• Verbal Analogy, Number Sequence, Rule Shift.

Your profile shows the domains you have played, your score in each and your history. Export your results as PDF or JSON through the share sheet.

Fully offline. No account, no ads, no tracking. English and French, dark and light themes, haptic feedback, VoiceOver.

Cognisphere is a game. Scores describe your performance in its exercises. It is not a test and gives no diagnosis.

## Notes pour la revue (à coller en anglais)

Cognisphere is a self-contained offline game. No login, no purchase, no network access is required.
To verify the nine games: launch the app, tap "Skip" on the introduction, open the "Games" tab, tap a game, then "Play".
Each game ends on a result screen with "Play again", "Games" and "Profile". Games last 30 to 90 seconds.
Profile tab: scores, history, and "Share JSON" / "Share PDF" which open the iOS share sheet with a real file.
More tab: language (EN/FR), appearance, haptics, privacy policy, and "Erase local data".
Scores are stored only on the device. The app presents itself as a game and makes no health or diagnostic claim.

## Confidentialité

**App Privacy (App Store Connect) : « Data Not Collected ».** Justification : aucune requête réseau n'est émise par
l'app (0 requête externe observée sur tous les parcours, CSP limitée au bundle), aucun SDK tiers de collecte.
Les exports ne quittent l'appareil que par un partage choisi par l'utilisateur. À reconfirmer sur l'appareil avec
un proxy ou le rapport de confidentialité des apps d'iOS.

**Manifeste `ios/App/App/PrivacyInfo.xcprivacy`** : pas de suivi, aucune donnée collectée, deux API à motif déclaré :
`UserDefaults` motif `CA92.1` (plugin Preferences) et horodatage de fichier motif `C617.1` (plugin Filesystem).
Ces deux plugins n'embarquent pas leur propre manifeste ; Capacitor en embarque un. À relire dans le rapport de
confidentialité produit par Xcode lors de l'archivage (*Generate Privacy Report*).

**Chiffrement** : `ITSAppUsesNonExemptEncryption = false` (aucun chiffrement propre à l'app).

## Classification par âge (réponses proposées, à valider par Axel)

Toutes les rubriques de contenu : « Aucun ». Pas de contenu généré par les utilisateurs, pas de messagerie, pas de
publicité, pas d'achats, pas de jeux d'argent, pas d'accès web libre. Pas de thème médical ou de santé (l'app ne
donne ni conseil ni mesure de santé). Résultat attendu : 4+. Ne pas cocher « Conçu pour les enfants » sans décision
explicite.

## Règle 4.2 (fonctionnalité minimale)

Éléments en faveur : neuf jeux complets et distincts, profil et historique, fonctionnement entièrement hors ligne,
aucun contenu web distant, intégrations iOS (feuille de partage avec de vrais fichiers, haptique, pause sur
interruption, stockage natif, VoiceOver, texte dynamique). Risque résiduel : l'interface est rendue dans une WebView ;
la revue juge sur l'expérience réelle. À vérifier sur appareil avant soumission : fluidité, absence de comportements
« page web » (sélection de texte, zoom, rebond).

## À fournir ou publier par Axel

| Élément | État |
|---|---|
| Identifiant de bundle officiel | à créer (actuel : `com.axelfisch.cognisphere.dev`) |
| URL de politique de confidentialité | **à publier**, puis à renseigner dans App Store Connect et dans `PRIVACY_URL` (`src/ui/app.js`) |
| URL de support | **à publier** (l'app utilise `mailto:a.fisch@icloud.com`) ; App Store Connect exige une URL web |
| Équipe Apple Developer, certificats, profils | sur le Mac d'Axel uniquement |
| Logo officiel en fichier source | souhaitable (voir docs/DECISIONS.md) |
| Coordonnées de contact pour la revue | à saisir dans App Store Connect |
