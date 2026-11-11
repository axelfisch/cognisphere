# Cognisphere pour iPhone

Jeu bilingue FR/EN d'Axel Fisch : neuf mini-jeux courts, entièrement hors ligne, sans compte.
Application iOS **Capacitor 8** (WKWebView + plugins natifs), projet Xcode en Swift Package Manager.

> **État au 11 novembre 2026.** Le code, le projet Xcode, les tests et le dossier App Store sont livrés.
> La compilation Xcode, le simulateur et l'iPhone physique **n'ont pas été exécutés** : l'environnement de
> développement était un conteneur Linux sans Mac. Tout ce qui a été vérifié et tout ce qui reste à faire
> sur le Mac d'Axel est listé dans [docs/VALIDATION.md](docs/VALIDATION.md).

## Lancer sur un Mac

Prérequis : macOS avec **Xcode 26 ou plus récent** (SDK iOS 26, exigé par Apple pour tout envoi depuis le
28 avril 2026), **Node.js 22**, une connexion réseau pour la première résolution des paquets Swift.

```bash
cd ios-app
npm ci
npm run sync
npm run open
```

- `npm ci` installe les versions figées par `package-lock.json`.
- `npm run sync` construit le bundle web hors ligne (`www/`) puis le copie dans `ios/App/App/public`.
  À relancer après toute modification de `src/`.
- `npm run open` ouvre `ios/App/App.xcodeproj`. Schéma partagé : **App**.

Dans Xcode : cible **App** → *Signing & Capabilities* → choisir votre **Team** (signature automatique).
Aucun certificat, profil ou identifiant privé n'est dans le dépôt.

Builds en ligne de commande (simulateur, sans signature) :

```bash
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -destination 'generic/platform=iOS Simulator' build
```

```bash
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -destination 'generic/platform=iOS Simulator' build
```

Archive Release signée (remplacer `XXXXXXXXXX` par l'identifiant d'équipe) :

```bash
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -destination 'generic/platform=iOS' -archivePath build/Cognisphere.xcarchive DEVELOPMENT_TEAM=XXXXXXXXXX archive
```

## Identifiants

| Élément | Valeur |
|---|---|
| Identifiant de bundle (développement) | `com.axelfisch.cognisphere.dev` |
| Où le changer | `capacitor.config.json` (`appId`) **et** Xcode → cible App → *Bundle Identifier* |
| Version / build | 1.0.0 (1) |
| Cible minimale | iOS 15.0 (minimum de Capacitor 8) |
| Appareils | iPhone, portrait uniquement |

L'identifiant `.dev` est provisoire : l'identifiant officiel doit être créé dans le compte Apple Developer d'Axel.

## Tests

```bash
npm test
```

```bash
npm run test:e2e
```

- `npm test` : 32 tests unitaires (notation, générateurs, cycle de vie de session, stockage, exports). Les
  tests PDF utilisent `pdftotext`/`pdfinfo` (poppler) et sont ignorés s'ils sont absents.
- `npm run test:e2e` : 44 scénarios dans Chromium (Playwright) sur le bundle livré, dont une partie complète de
  chacun des neuf jeux en FR et en EN. Résultats : `docs/results/e2e-results.json`, exports produits :
  `docs/results/exports/`.

Aperçu local dans un navigateur : `npm run build && npm run serve`.

## Organisation

| Chemin | Contenu |
|---|---|
| `src/core/` | RNG, session de jeu unique, stockage et migrations, catalogue |
| `src/games/` | Règles, contenu FR/EN et notation des neuf jeux (sans DOM, testables) |
| `src/ui/` | Écrans, vues de jeu, textes, graphique radar |
| `src/native/bridge.js` | Seul point de contact avec iOS (haptique, partage, fichiers, préférences, cycle de vie) |
| `src/export/` | Exports JSON et PDF |
| `ios/` | Projet Xcode (`App.xcodeproj`, schéma `App`, icône, écran de lancement, `PrivacyInfo.xcprivacy`) |
| `tests/` | Tests unitaires et de parcours |
| `appstore/` | Icône 1024, captures, textes FR/EN, confidentialité, notes de revue |
| `docs/` | Décisions, notation, recette, licences |

Documents : [décisions et écarts](docs/DECISIONS.md) · [notation](docs/SCORING.md) ·
[recette et preuves](docs/VALIDATION.md) · [licences](docs/THIRD_PARTY.md) · [dossier App Store](appstore/README.md).
