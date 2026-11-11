// Verbal Analogy — each language has its own word list and was checked for a single valid answer.
// Option order in data: index 0 is the answer; options are shuffled at generation time.
export const ITEMS = [
  { id: 'va01', en: { a: 'Glove', b: 'Hand', c: 'Sock', o: ['Foot', 'Shoe', 'Wool', 'Knee'], why: 'A glove is worn on the hand. A sock is worn on the foot.' },
    fr: { a: 'Gant', b: 'Main', c: 'Chaussette', o: ['Pied', 'Chaussure', 'Laine', 'Genou'], why: 'Le gant se porte à la main. La chaussette se porte au pied.' } },
  { id: 'va02', en: { a: 'Author', b: 'Novel', c: 'Composer', o: ['Symphony', 'Piano', 'Concert', 'Orchestra'], why: 'An author creates a novel. A composer creates a symphony.' },
    fr: { a: 'Auteur', b: 'Roman', c: 'Compositeur', o: ['Symphonie', 'Piano', 'Concert', 'Orchestre'], why: 'L’auteur crée un roman. Le compositeur crée une symphonie.' } },
  { id: 'va03', en: { a: 'Caterpillar', b: 'Butterfly', c: 'Tadpole', o: ['Frog', 'Pond', 'Fish', 'Egg'], why: 'A caterpillar becomes a butterfly. A tadpole becomes a frog.' },
    fr: { a: 'Chenille', b: 'Papillon', c: 'Têtard', o: ['Grenouille', 'Mare', 'Poisson', 'Œuf'], why: 'La chenille devient papillon. Le têtard devient grenouille.' } },
  { id: 'va04', en: { a: 'Cold', b: 'Shiver', c: 'Heat', o: ['Sweat', 'Sun', 'Thermometer', 'Summer'], why: 'Cold makes the body shiver. Heat makes the body sweat.' },
    fr: { a: 'Froid', b: 'Frissonner', c: 'Chaleur', o: ['Transpirer', 'Soleil', 'Thermomètre', 'Été'], why: 'Le froid fait frissonner. La chaleur fait transpirer.' } },
  { id: 'va05', en: { a: 'Hour', b: 'Minute', c: 'Minute', o: ['Second', 'Clock', 'Day', 'Time'], why: 'An hour is divided into minutes. A minute is divided into seconds.' },
    fr: { a: 'Heure', b: 'Minute', c: 'Minute', o: ['Seconde', 'Horloge', 'Jour', 'Temps'], why: 'L’heure se divise en minutes. La minute se divise en secondes.' } },
  { id: 'va06', en: { a: 'Pilot', b: 'Plane', c: 'Captain', o: ['Ship', 'Port', 'Sea', 'Sailor'], why: 'A pilot is in command of a plane. A captain is in command of a ship.' },
    fr: { a: 'Pilote', b: 'Avion', c: 'Capitaine', o: ['Navire', 'Port', 'Mer', 'Marin'], why: 'Le pilote commande un avion. Le capitaine commande un navire.' } },
  { id: 'va07', en: { a: 'Petal', b: 'Flower', c: 'Page', o: ['Book', 'Ink', 'Word', 'Library'], why: 'A petal is a part of a flower. A page is a part of a book.' },
    fr: { a: 'Pétale', b: 'Fleur', c: 'Page', o: ['Livre', 'Encre', 'Mot', 'Bibliothèque'], why: 'Le pétale est une partie de la fleur. La page est une partie du livre.' } },
  { id: 'va08', en: { a: 'Hunger', b: 'Eat', c: 'Tiredness', o: ['Sleep', 'Bed', 'Night', 'Dream'], why: 'Eating relieves hunger. Sleeping relieves tiredness.' },
    fr: { a: 'Faim', b: 'Manger', c: 'Fatigue', o: ['Dormir', 'Lit', 'Nuit', 'Rêve'], why: 'Manger apaise la faim. Dormir apaise la fatigue.' } },
  { id: 'va09', en: { a: 'Thermometer', b: 'Temperature', c: 'Scale', o: ['Weight', 'Kitchen', 'Kilogram', 'Tray'], why: 'A thermometer measures temperature. A scale measures weight. The kilogram is only a unit.' },
    fr: { a: 'Thermomètre', b: 'Température', c: 'Balance', o: ['Poids', 'Cuisine', 'Kilogramme', 'Plateau'], why: 'Le thermomètre mesure la température. La balance mesure le poids. Le kilogramme n’est qu’une unité.' } },
  { id: 'va10', en: { a: 'Up', b: 'Down', c: 'Open', o: ['Closed', 'Door', 'Key', 'Wide'], why: 'Down is the opposite of up. Closed is the opposite of open.' },
    fr: { a: 'Haut', b: 'Bas', c: 'Ouvert', o: ['Fermé', 'Porte', 'Clé', 'Large'], why: 'Bas est le contraire de haut. Fermé est le contraire d’ouvert.' } },
];
export const ROUNDS = 5;
/** Options are referenced by their index in the data (0 = answer) so the item stays coherent in both languages. */
export function generate(rng) {
  return { rounds: rng.sample(ITEMS, ROUNDS).map((item) => ({ itemId: item.id, order: rng.shuffle([0, 1, 2, 3]) })) };
}
export const itemById = (id) => ITEMS.find((i) => i.id === id);
export const isCorrect = (_itemId, optionIndex) => optionIndex === 0;
