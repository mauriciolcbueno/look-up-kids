export interface WikiWord {
  word: string;
  hint: string;
  wiki: string;
}

export const wikiWords: WikiWord[] = [
  { word: "TIGER", hint: "Big orange cat with black stripes from Asia.", wiki: "Tiger" },
  { word: "EARTH", hint: "The planet you live on, third from the Sun.", wiki: "Earth" },
  { word: "PIANO", hint: "Instrument with 88 black and white keys.", wiki: "Piano" },
  { word: "OCEAN", hint: "Huge body of salt water covering most of Earth.", wiki: "Ocean" },
  { word: "PLUTO", hint: "Once the 9th planet, now called a dwarf planet.", wiki: "Pluto" },
  { word: "WHALE", hint: "The largest mammal alive lives in the sea.", wiki: "Whale" },
  { word: "BRAIN", hint: "The squishy organ in your head that thinks.", wiki: "Brain" },
  { word: "PARIS", hint: "Capital of France, home of the Eiffel Tower.", wiki: "Paris" },
  { word: "EAGLE", hint: "Large bird of prey with amazing eyesight.", wiki: "Eagle" },
  { word: "MAGMA", hint: "Hot melted rock found under volcanoes.", wiki: "Magma" },
  { word: "RIVER", hint: "Long stream of fresh water flowing to the sea.", wiki: "River" },
  { word: "SOLAR", hint: "Word for things to do with the Sun.", wiki: "Sun" },
  { word: "MOUSE", hint: "Tiny rodent that loves cheese in cartoons.", wiki: "Mouse" },
  { word: "GIANT", hint: "Very, very big — like a redwood tree.", wiki: "Sequoia" },
  { word: "STORM", hint: "Big weather event with wind and rain.", wiki: "Storm" },
];

export function wordOfTheDay(): WikiWord {
  const day = new Date();
  const epoch = Math.floor(day.getTime() / (1000 * 60 * 60 * 24));
  return wikiWords[epoch % wikiWords.length];
}
