# Composants tiers embarqués

| Composant | Version | Licence | Rôle |
|---|---|---|---|
| @capacitor/core, @capacitor/ios | 8.6.0 | MIT | Pont web/natif, WKWebView |
| @capacitor/app | 8.1.2 | MIT | Cycle de vie (pause, interruption) |
| @capacitor/filesystem | 8.1.5 | MIT | Fichier temporaire d'export (dépend de `ion-ios-filesystem` 2.0.1, MIT) |
| @capacitor/share | 8.0.3 | MIT | Feuille de partage iOS |
| @capacitor/haptics | 8.0.2 | MIT | Retours haptiques |
| @capacitor/preferences | 8.0.1 | MIT | Stockage local (UserDefaults) |
| jsPDF | 4.2.1 | MIT | Export PDF (avec fflate, MIT) |
| Sora | @fontsource/sora 5.3.0 | SIL OFL 1.1 | Police de texte |
| DM Serif Display | @fontsource/dm-serif-display 5.3.0 | SIL OFL 1.1 | Police de titre |

Outils de développement non embarqués : @capacitor/cli 8.6.0, esbuild 0.28.2, Playwright (tests).
Aucun SDK de publicité, d'analytique, de suivi ou de compte. `npm audit` : 0 vulnérabilité à l'installation.
Les modules optionnels de jsPDF (`html2canvas`, `dompurify`, `canvg`) ne sont ni installés ni appelés.
