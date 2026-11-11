// Reality Rank — order four explanations from most to least plausible *given the clues*.
// `o` is listed in the suggested order (index 0 = most plausible). Score = share of option pairs placed
// in the same relative order as the suggestion (6 pairs), so a near-miss keeps partial credit.
export const ITEMS = [
  { id: 'rr01',
    s: { en: 'You come home and find your front door ajar.', fr: 'En rentrant, vous trouvez votre porte d’entrée entrouverte.' },
    clues: { en: ['You left in a hurry this morning.', 'The lock is intact and nothing inside has been moved.', 'Your flatmate is away for the week.'],
      fr: ['Vous êtes parti précipitamment ce matin.', 'La serrure est intacte et rien n’a été déplacé à l’intérieur.', 'Votre colocataire est absent pour la semaine.'] },
    o: [
      { id: 'a', en: 'You did not pull the door fully shut this morning.', fr: 'Vous n’avez pas bien refermé la porte ce matin.', why: { en: 'fits the hurried departure', fr: 'cohérent avec le départ précipité' } },
      { id: 'b', en: 'The latch is worn and the door opened by itself.', fr: 'Le pêne est usé et la porte s’est ouverte toute seule.', why: { en: 'possible, no clue for or against', fr: 'possible, aucun indice pour ni contre' } },
      { id: 'c', en: 'Your flatmate came back earlier than planned.', fr: 'Votre colocataire est rentré plus tôt que prévu.', why: { en: 'one clue speaks against it', fr: 'un indice va à l’encontre' } },
      { id: 'd', en: 'Someone broke in.', fr: 'Quelqu’un est entré par effraction.', why: { en: 'two clues speak against it', fr: 'deux indices vont à l’encontre' } }] },
  { id: 'rr02',
    s: { en: 'A friend who usually replies quickly has not answered your message for four hours.', fr: 'Une amie qui répond d’habitude vite n’a pas répondu à votre message depuis quatre heures.' },
    clues: { en: ['Yesterday she told you she would be on a long flight today.', 'Her last message was friendly.', 'Your message is marked “not delivered”.'],
      fr: ['Hier, elle vous a dit qu’elle prendrait un long vol aujourd’hui.', 'Son dernier message était chaleureux.', 'Votre message est marqué « non distribué ».'] },
    o: [
      { id: 'a', en: 'She is on the plane with her phone in flight mode.', fr: 'Elle est dans l’avion, téléphone en mode avion.', why: { en: 'fits all three clues', fr: 'cohérent avec les trois indices' } },
      { id: 'b', en: 'Her battery has run out.', fr: 'Sa batterie est à plat.', why: { en: 'fits “not delivered”, nothing more', fr: 'cohérent avec « non distribué », sans plus' } },
      { id: 'c', en: 'She changed her number without telling you.', fr: 'Elle a changé de numéro sans vous prévenir.', why: { en: 'rare, and no clue suggests it', fr: 'rare, et aucun indice ne le suggère' } },
      { id: 'd', en: 'She is upset and is ignoring you.', fr: 'Elle est fâchée et vous ignore.', why: { en: 'two clues speak against it', fr: 'deux indices vont à l’encontre' } }] },
  { id: 'rr03',
    s: { en: 'Reported bike thefts in a town rose by 15% in the six months after an online reporting form was launched.', fr: 'Dans une ville, les vols de vélos déclarés ont augmenté de 15 % dans les six mois qui ont suivi le lancement d’un formulaire de déclaration en ligne.' },
    clues: { en: ['Before the form, reporting a theft meant going to the police station.', 'Thefts recorded by insurers stayed stable.', 'The number of cyclists did not change.'],
      fr: ['Avant le formulaire, il fallait se rendre au commissariat pour déclarer un vol.', 'Les vols enregistrés par les assureurs sont restés stables.', 'Le nombre de cyclistes n’a pas changé.'] },
    o: [
      { id: 'a', en: 'More thefts are being reported because reporting is easier.', fr: 'Davantage de vols sont déclarés parce que la démarche est plus simple.', why: { en: 'fits all three clues', fr: 'cohérent avec les trois indices' } },
      { id: 'b', en: 'Some thefts are entered twice on the form.', fr: 'Certains vols sont saisis deux fois dans le formulaire.', why: { en: 'possible, no clue for or against', fr: 'possible, aucun indice pour ni contre' } },
      { id: 'c', en: 'More bikes are actually being stolen.', fr: 'Davantage de vélos sont réellement volés.', why: { en: 'the insurers’ figures speak against it', fr: 'les chiffres des assureurs vont à l’encontre' } },
      { id: 'd', en: 'The form encourages people to steal bikes.', fr: 'Le formulaire incite à voler des vélos.', why: { en: 'no plausible mechanism, and contradicted', fr: 'aucun mécanisme plausible, et contredit' } }] },
  { id: 'rr04',
    s: { en: 'Since Monday, the office coffee machine has been making lukewarm coffee.', fr: 'Depuis lundi, la machine à café du bureau fait du café tiède.' },
    clues: { en: ['Its “descale” warning light has been on for two weeks.', 'The machine is three years old. This model usually lasts ten.', 'The kettle plugged into the same socket works normally.'],
      fr: ['Son voyant « détartrage » est allumé depuis deux semaines.', 'La machine a trois ans. Ce modèle dure en général dix ans.', 'La bouilloire branchée sur la même prise fonctionne normalement.'] },
    o: [
      { id: 'a', en: 'Limescale is stopping the water from heating properly.', fr: 'Le calcaire empêche l’eau de chauffer correctement.', why: { en: 'fits the warning light', fr: 'cohérent avec le voyant' } },
      { id: 'b', en: 'The heating element is failing early.', fr: 'La résistance tombe en panne prématurément.', why: { en: 'possible, but unusual at this age', fr: 'possible, mais inhabituel à cet âge' } },
      { id: 'c', en: 'The socket no longer supplies enough power.', fr: 'La prise ne fournit plus assez de courant.', why: { en: 'the kettle speaks against it', fr: 'la bouilloire va à l’encontre' } },
      { id: 'd', en: 'The new coffee beans make the coffee colder.', fr: 'Les nouveaux grains rendent le café plus froid.', why: { en: 'no link with temperature', fr: 'aucun lien avec la température' } }] },
];
export const itemById = (id) => ITEMS.find((i) => i.id === id);
export function generate(rng) {
  const item = rng.pick(ITEMS);
  return { itemId: item.id, display: rng.shuffle(item.o.map((o) => o.id)) };
}
export const expectedOrder = (itemId) => itemById(itemId).o.map((o) => o.id);

/** Pairwise concordance, 0–100. `ranking` must contain each option id exactly once. */
export function score(itemId, ranking) {
  const expected = expectedOrder(itemId);
  if (!Array.isArray(ranking) || ranking.length !== expected.length || new Set(ranking).size !== expected.length || !ranking.every((r) => expected.includes(r))) {
    return { score: 0, concordant: 0, pairs: 6, exact: 0 };
  }
  const pos = Object.fromEntries(ranking.map((id, i) => [id, i]));
  let concordant = 0; let pairs = 0;
  for (let i = 0; i < expected.length; i++) for (let j = i + 1; j < expected.length; j++) { pairs += 1; if (pos[expected[i]] < pos[expected[j]]) concordant += 1; }
  const exact = ranking.filter((id, i) => id === expected[i]).length;
  return { score: Math.round((concordant / pairs) * 100), concordant, pairs, exact };
}

/** Ranking editor state (pure): pick → append, remove → back to pool, move up/down. */
export function createRanking(displayIds) {
  const ranked = [];
  const api = {
    get ranked() { return ranked.slice(); },
    get pool() { return displayIds.filter((id) => !ranked.includes(id)); },
    get complete() { return ranked.length === displayIds.length; },
    add(id) { if (displayIds.includes(id) && !ranked.includes(id)) { ranked.push(id); return true; } return false; },
    remove(id) { const i = ranked.indexOf(id); if (i < 0) return false; ranked.splice(i, 1); return true; },
    move(id, delta) {
      const i = ranked.indexOf(id); const j = i + delta;
      if (i < 0 || j < 0 || j >= ranked.length) return false;
      [ranked[i], ranked[j]] = [ranked[j], ranked[i]]; return true;
    },
    clear() { ranked.length = 0; },
  };
  return api;
}
