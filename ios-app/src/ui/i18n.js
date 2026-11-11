// All interface strings, FR and EN. Game item content lives with each game.
export const STR = {
  en: {
    locale: 'en-GB',
    tabs: { home: 'Home', games: 'Games', profile: 'Profile', more: 'More' },
    tagline: 'Explore your mind. Train your spectrum.',
    home: {
      cover: 'Domains played', of9: 'of 9', suggested: 'Suggested game', continue: 'Play again', browse: 'All games', guide: 'Game guide',
      note: 'Cognisphere is a game. Scores describe how you played each exercise, nothing more.',
      sessions: (n) => (n === 1 ? '1 session played' : `${n} sessions played`), avg: 'Average of played domains', firstRun: 'Play a first game to start your profile.',
      coverLabel: (n) => `${n} of 9 domains played`,
    },
    games: { title: 'Games', sub: 'Nine short exercises. Pick one.', best: 'Best', notPlayed: 'Not played', plays: (n) => (n === 1 ? '1 session' : `${n} sessions`), about: (s) => `about ${s} s` },
    detail: { play: 'Play', how: 'How to play', scoring: 'Scoring', last: 'Domain score', back: 'Back' },
    play: {
      quit: 'Quit', quitQ: 'Quit this game?', quitB: 'The session will not be saved.', quitYes: 'Quit', quitNo: 'Keep playing',
      paused: 'Game paused', pausedB: 'Time spent away does not count.', resume: 'Resume', next: 'Next', seeResult: 'See result', start: 'Start',
      ok: '✓ Correct', ko: '✕ Incorrect', answerWas: 'Answer:', item: (i, n) => `${i} of ${n}`, validate: 'Submit',
    },
    result: { title: 'Session complete', perf: 'Score for this session', outOf: 'out of 100', okn: (a, b) => `${a} of ${b} correct`, note: 'Describes this session only.',
      replay: 'Play again', toGames: 'Games', toProfile: 'Profile', saved: 'Saved on this device', saveError: 'Could not save on this device. Free up some storage and play again.',
      domainNow: (v) => `Domain score now ${v}`, announce: (s) => `Session complete. Score ${s} out of 100.` },
    profile: {
      title: 'Profile', avg: 'Average of played domains', basis: (d, s) => `${d} of 9 domains · ${s === 1 ? '1 session' : `${s} sessions`}`, empty: 'No game played yet.', emptyCta: 'Choose a game',
      domains: 'Domains', radar: 'Overview', radarAlt: (rows) => `Radar chart of domain scores. ${rows}`, notPlayed: 'Not played', history: 'History', historyEmpty: 'Finished sessions will appear here.',
      showAll: (n) => `Show all ${n}`, showLess: 'Show fewer', historyNote: 'The history keeps the 60 most recent sessions.', exportT: 'Export', exJson: 'Share JSON', exPdf: 'Share PDF',
      exporting: 'Preparing file…', exportDone: 'File ready', exportFail: 'The export failed. Try again.', sessionsN: (n) => (n === 1 ? '1 session' : `${n} sessions`),
      scoreInfo: 'Domain score: first result, then 60% previous score + 40% new result.',
    },
    more: {
      title: 'More', lang: 'Language', appear: 'Appearance', dark: 'Dark', light: 'Light', haptics: 'Haptic feedback', on: 'On', off: 'Off', guide: 'Game guide', intro: 'Show the introduction again',
      privacy: 'Privacy', privacyB: 'Scores stay on this device. No account, no ads, no tracking, nothing sent.', privacyLink: 'Read the privacy policy', support: 'Contact support',
      saved: 'Saved on this device', saveError: 'Saving failed', about: 'About', aboutB: 'Cognisphere by Axel Fisch. A game of nine short exercises. It is not a test and gives no diagnosis.', version: 'Version',
      licenses: 'Open-source licences', reset: 'Erase local data', resetQ: 'Erase all local data?', resetB: 'Scores and history will be deleted from this device. This cannot be undone.', cancel: 'Cancel', erase: 'Erase', erased: 'Local data erased',
    },
    guide: { title: 'Game guide', sub: 'How each game works and how it is scored.' },
    onb: {
      steps: [['Nine short games', 'Logic, speed, memory, patterns and more. Each game takes about a minute.'], ['Just a game', 'Scores describe how you played. Cognisphere is not a test and gives no diagnosis.'], ['Private by design', 'Scores stay on this device. No account, no tracking, nothing sent.']],
      cont: 'Continue', begin: 'Start playing', skip: 'Skip', step: (i) => `Step ${i} of 3`,
    },
    policy: {
      title: 'Privacy policy', updated: 'Last updated: 11 November 2026',
      body: [
        ['Summary', 'Cognisphere does not collect, transmit or sell any personal data. The app works entirely offline.'],
        ['Data kept on your device', 'Your game scores, the history of your last 60 sessions and your settings (language, appearance, haptics) are stored only on your device, inside the app. They are deleted when you erase local data in the app or uninstall it.'],
        ['No account, no tracking', 'There is no account, no advertising, no analytics and no third-party tracking. The app makes no network request while you play.'],
        ['Exports you choose to share', 'When you tap “Share JSON” or “Share PDF”, the app creates a file on your device and opens the iOS share sheet. The file goes only where you decide to send it. The temporary copy is removed afterwards.'],
        ['External links', 'The support link opens your mail app. A link to the online version of this policy opens in your browser. These services have their own policies.'],
        ['Children', 'The app does not knowingly collect data from anyone, including children.'],
        ['Contact', 'Axel Fisch — a.fisch@icloud.com'],
      ],
    },
    domains: { reasoning: 'Logical reasoning', speed: 'Processing speed', memory: 'Working memory', pattern: 'Pattern finding', reality: 'Plausibility', epistemic: 'Cautious inference', analogy: 'Verbal analogies', sequence: 'Number sequences', flex: 'Mental flexibility' },
    names: { logic_bridge: 'Logic Bridge', symbol_sprint: 'Symbol Sprint', memory_stack: 'Memory Stack', pattern_tri: 'Pattern Triangles', reality_rank: 'Reality Rank', iceberg: 'Iceberg Inference', verbal_analogy: 'Verbal Analogy', num_sequence: 'Number Sequence', rule_shift: 'Rule Shift' },
    how: {
      logic_bridge: 'Read two premises and pick the one conclusion that necessarily follows. 5 puzzles.',
      symbol_sprint: 'Symbols appear one at a time. Tap only when you see one of the two targets. 30 symbols, about 30 seconds.',
      memory_stack: 'Six symbols are shown for 5 seconds, then hidden. Enter them again in the same order.',
      pattern_tri: 'Three solved triangles follow the same hidden rule. Work out the rule and find the missing number. 5 puzzles.',
      reality_rank: 'Read a situation and its clues, then order four explanations from most to least plausible.',
      iceberg: 'Read the clues and choose the hypothesis they support best, without going beyond them. 3 situations.',
      verbal_analogy: 'Find the word that completes the second pair with the same relation as the first. 5 analogies.',
      num_sequence: 'Find the rule behind five numbers and choose the next one. 5 series.',
      rule_shift: 'Say whether the shape follows the rule shown. The rule changes during the game: switch with it. 8 shapes.',
    },
    scoring: {
      logic_bridge: 'Correct answers out of 5, as a score out of 100.',
      symbol_sprint: 'Targets tapped minus wrong taps, divided by the 12 targets. One response per symbol. Minimum 0.',
      memory_stack: 'Symbols in the right position out of 6.',
      pattern_tri: 'Correct answers out of 5.',
      reality_rank: 'Share of the 6 pairs of explanations placed in the suggested order.',
      iceberg: 'Correct answers out of 3.',
      verbal_analogy: 'Correct answers out of 5.',
      num_sequence: 'Correct answers out of 5.',
      rule_shift: 'Correct answers out of 8 (4 “yes” and 4 “no”).',
    },
    g: {
      lbQ: 'Which conclusion necessarily follows?', premises: 'Premises',
      ssIntro: 'Tap when you see one of these two symbols:', ssTap: 'Tap', ssReady: 'Ready?', ssHit: '✓ Target', ssFa: '✕ Not a target',
      ssTargets: 'Targets shown', ssHits: 'Targets tapped', ssMisses: 'Targets missed', ssFas: 'Wrong taps', ssLive: (i, n) => `Symbol ${i} of ${n}`,
      msMemorize: 'Memorise the order', msRecall: 'Enter the symbols in order', msBack: 'Delete last', msClear: 'Clear all', msSlot: (i) => `Position ${i}`, msEmpty: 'empty',
      msShown: 'Sequence shown', msYours: 'Your answer', msHidden: 'The sequence is now hidden.',
      ptQ: 'Find the rule, then the missing number.', ptExample: (a, b, v) => `Example: A ${a}, B ${b}, result ${v}.`, ptTarget: (a, b) => `To solve: A ${a}, B ${b}, result unknown.`, ptRule: 'Rule:',
      rrSituation: 'Situation', clues: 'Clues', rrYour: 'Your ranking, most plausible first', rrPool: 'Tap an explanation to add it', rrEmpty: 'Nothing ranked yet.',
      rrUp: 'Move up', rrDown: 'Move down', rrRemove: 'Remove', rrSuggested: 'Order suggested by the clues', rrYours: 'Your order', rrPairs: (a, b) => `${a} of ${b} pairs in the suggested order`, rrRank: (i) => `Rank ${i}`,
      icQ: 'Which hypothesis do the clues support best?',
      vaIsTo: 'is to', vaAs: 'as', vaQ: 'Which word completes the pair?',
      nsQ: 'Which number comes next?',
      rsRule: 'Rule', rsQ: 'Does the shape follow the rule?', yes: 'Yes', no: 'No', rsChanged: 'The rule has changed', rsRuleTxt: (shape) => `Is it a ${shape}?`,
      shapes: { circle: 'circle', square: 'square', triangle: 'triangle', diamond: 'diamond', star: 'star', hexagon: 'hexagon', cross: 'cross', pentagon: 'pentagon' },
    },
    exp: {
      title: 'Cognisphere — game results', generated: 'Generated on', note: 'Cognisphere is a game. These scores describe performance in its exercises on this device. They are not a test result or a diagnosis.',
      summary: 'Summary', coverage: 'Domains played', average: 'Average of played domains', total: 'Sessions played', domain: 'Domain', game: 'Game', score: 'Score', sessions: 'Sessions', best: 'Best', date: 'Date',
      history: 'History (most recent first)', none: 'None', page: (a, b) => `Page ${a} of ${b}`, emptyHistory: 'No finished session yet.', notPlayed: 'Not played',
      filePrefix: 'cognisphere-results', shareTitle: 'Cognisphere results', scoringNote: 'Domain score: first result, then 60% previous score + 40% new result. History is limited to the 60 most recent sessions.',
    },
  },
  fr: {
    locale: 'fr-FR',
    tabs: { home: 'Accueil', games: 'Jeux', profile: 'Profil', more: 'Plus' },
    tagline: 'Explorez votre esprit. Entraînez votre spectre.',
    home: {
      cover: 'Domaines joués', of9: 'sur 9', suggested: 'Jeu suggéré', continue: 'Rejouer', browse: 'Tous les jeux', guide: 'Guide des jeux',
      note: 'Cognisphere est un jeu. Les scores décrivent votre façon de jouer chaque exercice, rien de plus.',
      sessions: (n) => (n === 1 ? '1 session jouée' : `${n} sessions jouées`), avg: 'Moyenne des domaines joués', firstRun: 'Jouez une première partie pour commencer votre profil.',
      coverLabel: (n) => `${n} domaines joués sur 9`,
    },
    games: { title: 'Jeux', sub: 'Neuf exercices courts. Choisissez-en un.', best: 'Meilleur', notPlayed: 'Non joué', plays: (n) => (n === 1 ? '1 session' : `${n} sessions`), about: (s) => `environ ${s} s` },
    detail: { play: 'Jouer', how: 'Comment jouer', scoring: 'Calcul du score', last: 'Score du domaine', back: 'Retour' },
    play: {
      quit: 'Quitter', quitQ: 'Quitter cette partie ?', quitB: 'La session ne sera pas enregistrée.', quitYes: 'Quitter', quitNo: 'Continuer à jouer',
      paused: 'Partie en pause', pausedB: 'Le temps passé hors de l’app ne compte pas.', resume: 'Reprendre', next: 'Suivant', seeResult: 'Voir le résultat', start: 'Commencer',
      ok: '✓ Correct', ko: '✕ Incorrect', answerWas: 'Réponse :', item: (i, n) => `${i} sur ${n}`, validate: 'Valider',
    },
    result: { title: 'Session terminée', perf: 'Score de cette session', outOf: 'sur 100', okn: (a, b) => `${a} ${a > 1 ? 'bonnes réponses' : 'bonne réponse'} sur ${b}`, note: 'Décrit uniquement cette session.',
      replay: 'Rejouer', toGames: 'Jeux', toProfile: 'Profil', saved: 'Enregistré sur cet appareil', saveError: 'Enregistrement impossible sur cet appareil. Libérez de l’espace puis rejouez.',
      domainNow: (v) => `Score du domaine : ${v}`, announce: (s) => `Session terminée. Score ${s} sur 100.` },
    profile: {
      title: 'Profil', avg: 'Moyenne des domaines joués', basis: (d, s) => `${d} domaines sur 9 · ${s === 1 ? '1 session' : `${s} sessions`}`, empty: 'Aucune partie jouée pour l’instant.', emptyCta: 'Choisir un jeu',
      domains: 'Domaines', radar: 'Vue d’ensemble', radarAlt: (rows) => `Graphique radar des scores par domaine. ${rows}`, notPlayed: 'Non joué', history: 'Historique', historyEmpty: 'Les sessions terminées apparaîtront ici.',
      showAll: (n) => `Afficher les ${n}`, showLess: 'Afficher moins', historyNote: 'L’historique conserve les 60 sessions les plus récentes.', exportT: 'Export', exJson: 'Partager en JSON', exPdf: 'Partager en PDF',
      exporting: 'Préparation du fichier…', exportDone: 'Fichier prêt', exportFail: 'L’export a échoué. Réessayez.', sessionsN: (n) => (n === 1 ? '1 session' : `${n} sessions`),
      scoreInfo: 'Score d’un domaine : premier résultat, puis 60 % du score précédent + 40 % du nouveau résultat.',
    },
    more: {
      title: 'Plus', lang: 'Langue', appear: 'Apparence', dark: 'Sombre', light: 'Clair', haptics: 'Retour haptique', on: 'Activé', off: 'Désactivé', guide: 'Guide des jeux', intro: 'Revoir l’introduction',
      privacy: 'Confidentialité', privacyB: 'Les scores restent sur cet appareil. Aucun compte, aucune publicité, aucun suivi, aucun envoi.', privacyLink: 'Lire la politique de confidentialité', support: 'Contacter le support',
      saved: 'Enregistré sur cet appareil', saveError: 'Échec de l’enregistrement', about: 'À propos', aboutB: 'Cognisphere par Axel Fisch. Un jeu de neuf exercices courts. Ce n’est pas un test et il ne fournit aucun diagnostic.', version: 'Version',
      licenses: 'Licences open source', reset: 'Effacer les données locales', resetQ: 'Effacer toutes les données locales ?', resetB: 'Les scores et l’historique seront supprimés de cet appareil. Cette action est irréversible.', cancel: 'Annuler', erase: 'Effacer', erased: 'Données locales effacées',
    },
    guide: { title: 'Guide des jeux', sub: 'Le fonctionnement de chaque jeu et le calcul de son score.' },
    onb: {
      steps: [['Neuf jeux courts', 'Logique, vitesse, mémoire, motifs et plus encore. Chaque jeu dure environ une minute.'], ['Simplement un jeu', 'Les scores décrivent votre façon de jouer. Cognisphere n’est pas un test et ne fournit aucun diagnostic.'], ['Privé par conception', 'Les scores restent sur cet appareil. Aucun compte, aucun suivi, aucun envoi.']],
      cont: 'Continuer', begin: 'Commencer à jouer', skip: 'Passer', step: (i) => `Étape ${i} sur 3`,
    },
    policy: {
      title: 'Politique de confidentialité', updated: 'Dernière mise à jour : 11 novembre 2026',
      body: [
        ['En bref', 'Cognisphere ne collecte, ne transmet et ne vend aucune donnée personnelle. L’app fonctionne entièrement hors ligne.'],
        ['Données conservées sur votre appareil', 'Vos scores de jeu, l’historique de vos 60 dernières sessions et vos réglages (langue, apparence, haptique) sont stockés uniquement sur votre appareil, dans l’app. Ils sont supprimés lorsque vous effacez les données locales dans l’app ou que vous la désinstallez.'],
        ['Ni compte, ni suivi', 'Il n’y a ni compte, ni publicité, ni mesure d’audience, ni suivi par des tiers. L’app n’émet aucune requête réseau pendant le jeu.'],
        ['Exports que vous choisissez de partager', 'Lorsque vous touchez « Partager en JSON » ou « Partager en PDF », l’app crée un fichier sur votre appareil et ouvre la feuille de partage iOS. Le fichier va uniquement là où vous décidez de l’envoyer. La copie temporaire est ensuite supprimée.'],
        ['Liens externes', 'Le lien de support ouvre votre app de messagerie. Un lien vers la version en ligne de cette politique s’ouvre dans votre navigateur. Ces services ont leurs propres règles.'],
        ['Enfants', 'L’app ne collecte sciemment aucune donnée, de qui que ce soit, enfants compris.'],
        ['Contact', 'Axel Fisch — a.fisch@icloud.com'],
      ],
    },
    domains: { reasoning: 'Raisonnement logique', speed: 'Vitesse de traitement', memory: 'Mémoire de travail', pattern: 'Recherche de motifs', reality: 'Plausibilité', epistemic: 'Inférence prudente', analogy: 'Analogies verbales', sequence: 'Suites numériques', flex: 'Flexibilité mentale' },
    names: { logic_bridge: 'Pont logique', symbol_sprint: 'Sprint de symboles', memory_stack: 'Pile mémorielle', pattern_tri: 'Triangles-motifs', reality_rank: 'Classement réel', iceberg: 'Inférence iceberg', verbal_analogy: 'Analogie verbale', num_sequence: 'Séquence numérique', rule_shift: 'Changement de règle' },
    how: {
      logic_bridge: 'Lisez deux prémisses et choisissez la seule conclusion qui en découle nécessairement. 5 énigmes.',
      symbol_sprint: 'Les symboles apparaissent un par un. Touchez uniquement quand vous voyez l’une des deux cibles. 30 symboles, environ 30 secondes.',
      memory_stack: 'Six symboles sont affichés 5 secondes, puis masqués. Saisissez-les à nouveau dans le même ordre.',
      pattern_tri: 'Trois triangles résolus suivent la même règle cachée. Déduisez la règle et trouvez le nombre manquant. 5 énigmes.',
      reality_rank: 'Lisez une situation et ses indices, puis classez quatre explications de la plus plausible à la moins plausible.',
      iceberg: 'Lisez les indices et choisissez l’hypothèse qu’ils étayent le mieux, sans aller au-delà. 3 situations.',
      verbal_analogy: 'Trouvez le mot qui complète la seconde paire avec la même relation que la première. 5 analogies.',
      num_sequence: 'Trouvez la règle qui relie cinq nombres et choisissez le suivant. 5 suites.',
      rule_shift: 'Dites si la forme respecte la règle affichée. La règle change en cours de partie : adaptez-vous. 8 formes.',
    },
    scoring: {
      logic_bridge: 'Bonnes réponses sur 5, ramenées à un score sur 100.',
      symbol_sprint: 'Cibles touchées moins touches erronées, divisé par les 12 cibles. Une réponse par symbole. Minimum 0.',
      memory_stack: 'Symboles à la bonne position sur 6.',
      pattern_tri: 'Bonnes réponses sur 5.',
      reality_rank: 'Part des 6 paires d’explications placées dans l’ordre suggéré.',
      iceberg: 'Bonnes réponses sur 3.',
      verbal_analogy: 'Bonnes réponses sur 5.',
      num_sequence: 'Bonnes réponses sur 5.',
      rule_shift: 'Bonnes réponses sur 8 (4 « oui » et 4 « non »).',
    },
    g: {
      lbQ: 'Quelle conclusion en découle nécessairement ?', premises: 'Prémisses',
      ssIntro: 'Touchez quand vous voyez l’un de ces deux symboles :', ssTap: 'Toucher', ssReady: 'Prêt ?', ssHit: '✓ Cible', ssFa: '✕ Pas une cible',
      ssTargets: 'Cibles proposées', ssHits: 'Cibles touchées', ssMisses: 'Cibles manquées', ssFas: 'Touches erronées', ssLive: (i, n) => `Symbole ${i} sur ${n}`,
      msMemorize: 'Mémorisez l’ordre', msRecall: 'Saisissez les symboles dans l’ordre', msBack: 'Effacer le dernier', msClear: 'Tout effacer', msSlot: (i) => `Position ${i}`, msEmpty: 'vide',
      msShown: 'Séquence affichée', msYours: 'Votre réponse', msHidden: 'La séquence est maintenant masquée.',
      ptQ: 'Trouvez la règle, puis le nombre manquant.', ptExample: (a, b, v) => `Exemple : A ${a}, B ${b}, résultat ${v}.`, ptTarget: (a, b) => `À résoudre : A ${a}, B ${b}, résultat inconnu.`, ptRule: 'Règle :',
      rrSituation: 'Situation', clues: 'Indices', rrYour: 'Votre classement, du plus plausible au moins plausible', rrPool: 'Touchez une explication pour l’ajouter', rrEmpty: 'Rien de classé pour l’instant.',
      rrUp: 'Monter', rrDown: 'Descendre', rrRemove: 'Retirer', rrSuggested: 'Ordre suggéré par les indices', rrYours: 'Votre ordre', rrPairs: (a, b) => `${a} paires sur ${b} dans l’ordre suggéré`, rrRank: (i) => `Rang ${i}`,
      icQ: 'Quelle hypothèse les indices étayent-ils le mieux ?',
      vaIsTo: 'est à', vaAs: 'ce que', vaQ: 'Quel mot complète la paire ?',
      nsQ: 'Quel nombre vient ensuite ?',
      rsRule: 'Règle', rsQ: 'La forme respecte-t-elle la règle ?', yes: 'Oui', no: 'Non', rsChanged: 'La règle a changé', rsRuleTxt: (shape) => `Est-ce un ${shape} ?`,
      shapes: { circle: 'cercle', square: 'carré', triangle: 'triangle', diamond: 'losange', star: 'étoile', hexagon: 'hexagone', cross: 'croix', pentagon: 'pentagone' },
    },
    exp: {
      title: 'Cognisphere — résultats de jeu', generated: 'Généré le', note: 'Cognisphere est un jeu. Ces scores décrivent des performances dans ses exercices, sur cet appareil. Ce ne sont ni des résultats de test ni un diagnostic.',
      summary: 'Résumé', coverage: 'Domaines joués', average: 'Moyenne des domaines joués', total: 'Sessions jouées', domain: 'Domaine', game: 'Jeu', score: 'Score', sessions: 'Sessions', best: 'Meilleur', date: 'Date',
      history: 'Historique (du plus récent au plus ancien)', none: 'Aucun', page: (a, b) => `Page ${a} sur ${b}`, emptyHistory: 'Aucune session terminée pour l’instant.', notPlayed: 'Non joué',
      filePrefix: 'cognisphere-resultats', shareTitle: 'Résultats Cognisphere', scoringNote: 'Score d’un domaine : premier résultat, puis 60 % du score précédent + 40 % du nouveau résultat. L’historique est limité aux 60 sessions les plus récentes.',
    },
  },
};

export function strings(lang) { return STR[lang === 'fr' ? 'fr' : 'en']; }

export function detectLang(languages) {
  const list = Array.isArray(languages) ? languages : [];
  for (const l of list) { if (typeof l === 'string') { if (l.toLowerCase().startsWith('fr')) return 'fr'; if (l.toLowerCase().startsWith('en')) return 'en'; } }
  return 'en';
}

export function formatDate(ts, lang, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  try { return new Intl.DateTimeFormat(strings(lang).locale, opts).format(new Date(ts)); } catch { return new Date(ts).toISOString().slice(0, 10); }
}
export function formatDateTime(ts, lang) {
  return formatDate(ts, lang, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
