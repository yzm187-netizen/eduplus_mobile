// Map lessonId to slide deck JSON. These are generated JSON files under content/slides.
// Using require to keep bundler-friendly without extra TS config.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Deck = any;

export const decks: Record<string, Deck> = {
  'l-cs305-1': require('../content/slides/c-cs305_l-cs305-1_deck.json'),
  'l-cs305-2': require('../content/slides/c-cs305_l-cs305-2_deck.json'),
  'l-eng201-1': require('../content/slides/c-eng201_l-eng201-1_deck.json'),
  'l-eng201-2': require('../content/slides/c-eng201_l-eng201-2_deck.json'),
  'l-math220-1': require('../content/slides/c-math220_l-math220-1_deck.json'),
  'l-math220-2': require('../content/slides/c-math220_l-math220-2_deck.json'),
};
