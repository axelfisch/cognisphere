// Iceberg Inference — pick the hypothesis best supported by the clues. Answers are hypotheses, never certainties.
export const ITEMS = [
  { id: 'ic01',
    clues: { en: ['On some mornings the queue at a bakery is very long, on others it is almost empty.', 'The number of loaves sold per day is nearly the same all week.', 'Nothing else about the shop has changed.'],
      fr: ['Certains matins, la file d’attente d’une boulangerie est très longue ; d’autres matins, elle est presque vide.', 'Le nombre de pains vendus par jour est à peu près le même toute la semaine.', 'Rien d’autre n’a changé dans la boutique.'] },
    o: [
      { id: 'a', en: 'Customers probably arrive at different times from day to day, while total demand stays stable.', fr: 'Les clients arrivent sans doute à des heures différentes selon les jours, alors que la demande totale reste stable.' },
      { id: 'b', en: 'Demand changes a lot from one day to the next.', fr: 'La demande varie fortement d’un jour à l’autre.' },
      { id: 'c', en: 'The baker is hiding a drop in sales.', fr: 'Le boulanger cache une baisse des ventes.' },
      { id: 'd', en: 'A competitor has certainly opened nearby.', fr: 'Un concurrent a certainement ouvert à proximité.' }],
    answer: 'a',
    why: { en: 'Stable daily sales speak against changing demand. Different arrival times fit every clue. It remains a hypothesis: the clues do not prove it.', fr: 'Des ventes quotidiennes stables contredisent une demande variable. Des heures d’arrivée différentes s’accordent avec tous les indices. Cela reste une hypothèse : les indices ne la prouvent pas.' } },
  { id: 'ic02',
    clues: { en: ['The leaves of a houseplant are turning yellow.', 'Its soil has stayed wet for two weeks.', 'It sits by a bright window and has not been moved.'],
      fr: ['Les feuilles d’une plante d’intérieur jaunissent.', 'Sa terre est restée humide depuis deux semaines.', 'Elle est près d’une fenêtre lumineuse et n’a pas été déplacée.'] },
    o: [
      { id: 'a', en: 'It is probably getting too much water.', fr: 'Elle reçoit probablement trop d’eau.' },
      { id: 'b', en: 'It lacks light.', fr: 'Elle manque de lumière.' },
      { id: 'c', en: 'It certainly has an incurable disease.', fr: 'Elle a certainement une maladie incurable.' },
      { id: 'd', en: 'Its pot is too small.', fr: 'Son pot est trop petit.' }],
    answer: 'a',
    why: { en: 'Soil that stays wet points to overwatering, and the bright window speaks against a lack of light. Other causes are possible but no clue supports them.', fr: 'Une terre qui reste humide évoque un excès d’arrosage, et la fenêtre lumineuse contredit un manque de lumière. D’autres causes sont possibles, mais aucun indice ne les appuie.' } },
  { id: 'ic03',
    clues: { en: ['A colleague who usually answers within the hour has not replied since this morning.', 'Her shared calendar shows a full-day training course.', 'Her status says “away”.'],
      fr: ['Une collègue qui répond d’habitude dans l’heure n’a pas répondu depuis ce matin.', 'Son agenda partagé indique une formation toute la journée.', 'Son statut affiche « absente ».'] },
    o: [
      { id: 'a', en: 'She is probably busy with the course and will reply later.', fr: 'Elle est probablement occupée par la formation et répondra plus tard.' },
      { id: 'b', en: 'She is ignoring the message on purpose.', fr: 'Elle ignore volontairement le message.' },
      { id: 'c', en: 'She has left the company.', fr: 'Elle a quitté l’entreprise.' },
      { id: 'd', en: 'Her computer is certainly broken.', fr: 'Son ordinateur est certainement en panne.' }],
    answer: 'a',
    why: { en: 'The calendar and the status both point to the course. The other options add claims that no clue supports.', fr: 'L’agenda et le statut vont tous deux dans le sens de la formation. Les autres options ajoutent des affirmations qu’aucun indice n’appuie.' } },
  { id: 'ic04',
    clues: { en: ['The online rating of a café fell from 4.6 to 3.9 in one month.', 'Most recent negative reviews mention long waits.', 'Two members of staff left last month.'],
      fr: ['La note en ligne d’un café est passée de 4,6 à 3,9 en un mois.', 'La plupart des avis négatifs récents mentionnent une longue attente.', 'Deux membres de l’équipe sont partis le mois dernier.'] },
    o: [
      { id: 'a', en: 'Being short-staffed is probably making waits longer and pulling the rating down.', fr: 'Le manque de personnel allonge probablement l’attente et fait baisser la note.' },
      { id: 'b', en: 'The quality of the coffee has collapsed.', fr: 'La qualité du café s’est effondrée.' },
      { id: 'c', en: 'Competitors are posting fake reviews.', fr: 'Des concurrents publient de faux avis.' },
      { id: 'd', en: 'Ratings always fall at this time of year.', fr: 'Les notes baissent toujours à cette période de l’année.' }],
    answer: 'a',
    why: { en: 'The reviews mention waits, and the departures explain why waits could be longer. This link is likely, not proven.', fr: 'Les avis parlent d’attente, et les départs expliquent pourquoi elle a pu s’allonger. Ce lien est probable, pas démontré.' } },
  { id: 'ic05',
    clues: { en: ['In a class, students who sit at the front get higher marks on average.', 'Students choose their seats freely.', 'The most motivated students tend to arrive early.'],
      fr: ['Dans une classe, les élèves assis devant ont en moyenne de meilleures notes.', 'Les élèves choisissent librement leur place.', 'Les élèves les plus motivés arrivent souvent en avance.'] },
    o: [
      { id: 'a', en: 'Motivated students probably choose the front seats, so the seat itself may not explain the marks.', fr: 'Les élèves motivés choisissent probablement les places de devant ; la place elle-même n’explique donc peut-être pas les notes.' },
      { id: 'b', en: 'Sitting at the front causes better marks.', fr: 'S’asseoir devant fait obtenir de meilleures notes.' },
      { id: 'c', en: 'The teacher favours the front row.', fr: 'L’enseignant favorise le premier rang.' },
      { id: 'd', en: 'You cannot hear anything at the back of the room.', fr: 'On n’entend rien au fond de la salle.' }],
    answer: 'a',
    why: { en: 'Free seating and early arrivals suggest that motivation explains both the seat and the marks. A link between two things does not show that one causes the other.', fr: 'Le libre choix des places et les arrivées en avance suggèrent que la motivation explique à la fois la place et les notes. Un lien entre deux choses ne montre pas que l’une cause l’autre.' } },
];
export const ROUNDS = 3;
export function generate(rng) {
  return { rounds: rng.sample(ITEMS, ROUNDS).map((item) => ({ itemId: item.id, order: rng.shuffle(item.o.map((o) => o.id)) })) };
}
export const itemById = (id) => ITEMS.find((i) => i.id === id);
export const isCorrect = (itemId, optionId) => itemById(itemId).answer === optionId;
