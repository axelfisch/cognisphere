// Logic Bridge — one valid conclusion per item. Stable ids; texts per language.
export const ITEMS = [
  { id: 'lb01',
    p: { en: ['All musicians in the orchestra read sheet music.', 'Lina is a musician in the orchestra.'], fr: ['Tous les musiciens de l’orchestre lisent les partitions.', 'Lina est musicienne dans l’orchestre.'] },
    o: [
      { id: 'a', en: 'Lina reads sheet music.', fr: 'Lina lit les partitions.' },
      { id: 'b', en: 'Lina does not read sheet music.', fr: 'Lina ne lit pas les partitions.' },
      { id: 'c', en: 'Everyone who reads sheet music is in the orchestra.', fr: 'Toute personne qui lit les partitions est dans l’orchestre.' }],
    answer: 'a',
    why: { en: 'What is true of all the musicians is true of Lina. The reverse statement does not follow.', fr: 'Ce qui vaut pour tous les musiciens vaut pour Lina. L’affirmation inverse ne découle pas des prémisses.' } },
  { id: 'lb02',
    p: { en: ['No reptile is warm-blooded.', 'A snake is a reptile.'], fr: ['Aucun reptile n’est à sang chaud.', 'Un serpent est un reptile.'] },
    o: [
      { id: 'a', en: 'A snake is not warm-blooded.', fr: 'Un serpent n’est pas à sang chaud.' },
      { id: 'b', en: 'A snake is warm-blooded.', fr: 'Un serpent est à sang chaud.' },
      { id: 'c', en: 'Every animal that is not warm-blooded is a reptile.', fr: 'Tout animal qui n’est pas à sang chaud est un reptile.' }],
    answer: 'a',
    why: { en: 'A snake belongs to a group that has no warm-blooded member.', fr: 'Le serpent appartient à un groupe qui ne compte aucun membre à sang chaud.' } },
  { id: 'lb03',
    p: { en: ['If it rains, the courtyard is wet.', 'The courtyard is not wet.'], fr: ['S’il pleut, la cour est mouillée.', 'La cour n’est pas mouillée.'] },
    o: [
      { id: 'a', en: 'It is not raining.', fr: 'Il ne pleut pas.' },
      { id: 'b', en: 'It is raining.', fr: 'Il pleut.' },
      { id: 'c', en: 'The courtyard is never wet.', fr: 'La cour n’est jamais mouillée.' }],
    answer: 'a',
    why: { en: 'If it were raining, the courtyard would be wet. It is not, so it is not raining.', fr: 'S’il pleuvait, la cour serait mouillée. Elle ne l’est pas, donc il ne pleut pas.' } },
  { id: 'lb04',
    p: { en: ['If the alarm sounds, the door locks.', 'The alarm is sounding.'], fr: ['Si l’alarme sonne, la porte se verrouille.', 'L’alarme sonne.'] },
    o: [
      { id: 'a', en: 'The door locks.', fr: 'La porte se verrouille.' },
      { id: 'b', en: 'The door stays unlocked.', fr: 'La porte reste déverrouillée.' },
      { id: 'c', en: 'If the door locks, the alarm is sounding.', fr: 'Si la porte se verrouille, c’est que l’alarme sonne.' }],
    answer: 'a',
    why: { en: 'The condition is met, so its consequence follows. The door could also lock for other reasons.', fr: 'La condition est remplie, donc sa conséquence suit. La porte pourrait aussi se verrouiller pour d’autres raisons.' } },
  { id: 'lb05',
    p: { en: ['All squares are rectangles.', 'This shape is not a rectangle.'], fr: ['Tous les carrés sont des rectangles.', 'Cette figure n’est pas un rectangle.'] },
    o: [
      { id: 'a', en: 'This shape is not a square.', fr: 'Cette figure n’est pas un carré.' },
      { id: 'b', en: 'This shape is a square.', fr: 'Cette figure est un carré.' },
      { id: 'c', en: 'All rectangles are squares.', fr: 'Tous les rectangles sont des carrés.' }],
    answer: 'a',
    why: { en: 'A square would be a rectangle. This shape is not one, so it cannot be a square.', fr: 'Un carré serait un rectangle. Cette figure n’en est pas un, elle ne peut donc pas être un carré.' } },
  { id: 'lb06',
    p: { en: ['No cat is a dog.', 'Milo is a cat.'], fr: ['Aucun chat n’est un chien.', 'Milo est un chat.'] },
    o: [
      { id: 'a', en: 'Milo is not a dog.', fr: 'Milo n’est pas un chien.' },
      { id: 'b', en: 'Milo is a dog.', fr: 'Milo est un chien.' },
      { id: 'c', en: 'Some cats are dogs.', fr: 'Certains chats sont des chiens.' }],
    answer: 'a',
    why: { en: 'Milo is a cat, and no cat is a dog.', fr: 'Milo est un chat, et aucun chat n’est un chien.' } },
  { id: 'lb07',
    p: { en: ['Every prime number greater than 2 is odd.', '7 is a prime number greater than 2.'], fr: ['Tout nombre premier supérieur à 2 est impair.', '7 est un nombre premier supérieur à 2.'] },
    o: [
      { id: 'a', en: '7 is odd.', fr: '7 est impair.' },
      { id: 'b', en: '7 is even.', fr: '7 est pair.' },
      { id: 'c', en: 'Every odd number is prime.', fr: 'Tout nombre impair est premier.' }],
    answer: 'a',
    why: { en: '7 meets the condition, so it has the stated property. The reverse statement does not follow.', fr: '7 remplit la condition, il a donc la propriété énoncée. L’affirmation inverse ne découle pas des prémisses.' } },
  { id: 'lb08',
    p: { en: ['The key is either in the drawer or in the coat.', 'The key is not in the drawer.'], fr: ['La clé est soit dans le tiroir, soit dans le manteau.', 'La clé n’est pas dans le tiroir.'] },
    o: [
      { id: 'a', en: 'The key is in the coat.', fr: 'La clé est dans le manteau.' },
      { id: 'b', en: 'The key is in the drawer.', fr: 'La clé est dans le tiroir.' },
      { id: 'c', en: 'The key is lost.', fr: 'La clé est perdue.' }],
    answer: 'a',
    why: { en: 'Only two places are possible. One is ruled out, so the other remains.', fr: 'Deux emplacements seulement sont possibles. L’un est exclu, il reste donc l’autre.' } },
  { id: 'lb09',
    p: { en: ['All Blue Line trains stop at Valmont.', 'This train does not stop at Valmont.'], fr: ['Tous les trains de la ligne bleue s’arrêtent à Valmont.', 'Ce train ne s’arrête pas à Valmont.'] },
    o: [
      { id: 'a', en: 'This train is not a Blue Line train.', fr: 'Ce train n’est pas un train de la ligne bleue.' },
      { id: 'b', en: 'This train is a Blue Line train.', fr: 'Ce train est un train de la ligne bleue.' },
      { id: 'c', en: 'Every train that stops at Valmont is a Blue Line train.', fr: 'Tout train qui s’arrête à Valmont est un train de la ligne bleue.' }],
    answer: 'a',
    why: { en: 'A Blue Line train would stop at Valmont. This one does not, so it is not on the Blue Line.', fr: 'Un train de la ligne bleue s’arrêterait à Valmont. Celui-ci ne s’y arrête pas, il n’est donc pas de la ligne bleue.' } },
  { id: 'lb10',
    p: { en: ['Some painters are sculptors.', 'All sculptors work with their hands.'], fr: ['Certains peintres sont sculpteurs.', 'Tous les sculpteurs travaillent de leurs mains.'] },
    o: [
      { id: 'a', en: 'Some painters work with their hands.', fr: 'Certains peintres travaillent de leurs mains.' },
      { id: 'b', en: 'All painters are sculptors.', fr: 'Tous les peintres sont sculpteurs.' },
      { id: 'c', en: 'No painter works with their hands.', fr: 'Aucun peintre ne travaille de ses mains.' }],
    answer: 'a',
    why: { en: 'The painters who are sculptors work with their hands. Nothing is said about the other painters.', fr: 'Les peintres qui sont sculpteurs travaillent de leurs mains. Rien n’est dit des autres peintres.' } },
];

export const ROUNDS = 5;

export function generate(rng) {
  return { rounds: rng.sample(ITEMS, ROUNDS).map((item) => ({ itemId: item.id, order: rng.shuffle(item.o.map((o) => o.id)) })) };
}
export const itemById = (id) => ITEMS.find((i) => i.id === id);
export const isCorrect = (itemId, optionId) => itemById(itemId).answer === optionId;
