export interface Question {
  q: string;
  options: string[];
  answer: number;
  wiki: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
  questions: Question[];
}

export const categories: Category[] = [
  {
    id: "animals",
    name: "Animals",
    emoji: "🦁",
    color: "from-amber-300 to-orange-400",
    description: "Lions, octopuses, and weird bugs",
    questions: [
      { q: "How many hearts does an octopus have?", options: ["1", "3", "5", "8"], answer: 1, wiki: "Octopus" },
      { q: "Which animal is the fastest on land?", options: ["Lion", "Cheetah", "Horse", "Ostrich"], answer: 1, wiki: "Cheetah" },
      { q: "Which is the largest mammal alive?", options: ["Elephant", "Blue whale", "Giraffe", "Polar bear"], answer: 1, wiki: "Blue_whale" },
      { q: "What do giant pandas eat almost only?", options: ["Fish", "Bamboo", "Insects", "Meat"], answer: 1, wiki: "Giant_panda" },
      { q: "Bats are the only mammals that can…", options: ["Swim", "Fly", "Glow", "Talk"], answer: 1, wiki: "Bat" },
      { q: "A baby kangaroo is called a…", options: ["Cub", "Pup", "Joey", "Calf"], answer: 2, wiki: "Kangaroo" },
      { q: "How many legs does a spider have?", options: ["6", "8", "10", "12"], answer: 1, wiki: "Spider" },
    ],
  },
  {
    id: "space",
    name: "Space",
    emoji: "🚀",
    color: "from-indigo-400 to-purple-500",
    description: "Planets, stars, and rockets",
    questions: [
      { q: "Which planet is closest to the Sun?", options: ["Venus", "Mars", "Mercury", "Earth"], answer: 2, wiki: "Mercury_(planet)" },
      { q: "What galaxy do we live in?", options: ["Andromeda", "Milky Way", "Sombrero", "Pinwheel"], answer: 1, wiki: "Milky_Way" },
      { q: "Who was the first person on the Moon?", options: ["Buzz Aldrin", "Yuri Gagarin", "Neil Armstrong", "John Glenn"], answer: 2, wiki: "Neil_Armstrong" },
      { q: "What is the hottest planet?", options: ["Mercury", "Venus", "Mars", "Jupiter"], answer: 1, wiki: "Venus" },
      { q: "How many moons does Earth have?", options: ["0", "1", "2", "4"], answer: 1, wiki: "Moon" },
      { q: "A shooting star is really a…", options: ["Star", "Comet", "Meteor", "Planet"], answer: 2, wiki: "Meteor" },
      { q: "The Sun is a…", options: ["Planet", "Star", "Moon", "Comet"], answer: 1, wiki: "Sun" },
    ],
  },
  {
    id: "history",
    name: "History",
    emoji: "🏛️",
    color: "from-rose-300 to-pink-500",
    description: "Pyramids, kings, and explorers",
    questions: [
      { q: "Where were the pyramids of Giza built?", options: ["Mexico", "Egypt", "China", "Greece"], answer: 1, wiki: "Giza_pyramid_complex" },
      { q: "Who painted the Mona Lisa?", options: ["Picasso", "Van Gogh", "Da Vinci", "Michelangelo"], answer: 2, wiki: "Mona_Lisa" },
      { q: "The Great Wall is in which country?", options: ["Japan", "India", "China", "Russia"], answer: 2, wiki: "Great_Wall_of_China" },
      { q: "Who wrote the play Romeo and Juliet?", options: ["Dickens", "Shakespeare", "Tolkien", "Twain"], answer: 1, wiki: "William_Shakespeare" },
      { q: "Vikings came mostly from…", options: ["Africa", "Scandinavia", "Australia", "South America"], answer: 1, wiki: "Vikings" },
      { q: "The Roman Empire used which language?", options: ["Greek", "Latin", "French", "English"], answer: 1, wiki: "Latin" },
    ],
  },
  {
    id: "science",
    name: "Science",
    emoji: "🔬",
    color: "from-emerald-300 to-teal-500",
    description: "Atoms, weather, and how stuff works",
    questions: [
      { q: "What gas do plants breathe in?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Helium"], answer: 2, wiki: "Photosynthesis" },
      { q: "Water boils at how many °C?", options: ["50", "75", "100", "200"], answer: 2, wiki: "Water" },
      { q: "How many bones are in an adult human body?", options: ["106", "206", "306", "406"], answer: 1, wiki: "Human_skeleton" },
      { q: "What is the closest star to Earth?", options: ["Sirius", "Proxima Centauri", "The Sun", "Polaris"], answer: 2, wiki: "Sun" },
      { q: "Lightning is what kind of energy?", options: ["Sound", "Magnetic", "Electric", "Chemical"], answer: 2, wiki: "Lightning" },
      { q: "What does H2O mean?", options: ["Oxygen", "Salt", "Water", "Air"], answer: 2, wiki: "Water" },
    ],
  },
  {
    id: "geography",
    name: "Geography",
    emoji: "🌍",
    color: "from-sky-300 to-blue-500",
    description: "Countries, rivers, and oceans",
    questions: [
      { q: "Which is the longest river in the world?", options: ["Amazon", "Nile", "Yangtze", "Mississippi"], answer: 1, wiki: "Nile" },
      { q: "What is the capital of France?", options: ["Lyon", "Madrid", "Paris", "Berlin"], answer: 2, wiki: "Paris" },
      { q: "Mount Everest is in which range?", options: ["Andes", "Alps", "Himalayas", "Rockies"], answer: 2, wiki: "Mount_Everest" },
      { q: "Which is the largest ocean?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], answer: 3, wiki: "Pacific_Ocean" },
      { q: "Which continent is the Sahara desert in?", options: ["Asia", "Africa", "Australia", "Europe"], answer: 1, wiki: "Sahara" },
      { q: "Brazil is in which continent?", options: ["Europe", "Africa", "South America", "Asia"], answer: 2, wiki: "Brazil" },
    ],
  },
  {
    id: "art",
    name: "Art & Music",
    emoji: "🎨",
    color: "from-fuchsia-300 to-violet-500",
    description: "Famous artists, songs, and instruments",
    questions: [
      { q: "Who composed the Fifth Symphony starting da-da-da-DUM?", options: ["Mozart", "Beethoven", "Bach", "Chopin"], answer: 1, wiki: "Symphony_No._5_(Beethoven)" },
      { q: "How many strings does a violin have?", options: ["3", "4", "5", "6"], answer: 1, wiki: "Violin" },
      { q: "Pablo Picasso was born in which country?", options: ["France", "Italy", "Spain", "Portugal"], answer: 2, wiki: "Pablo_Picasso" },
      { q: "Which instrument has black and white keys?", options: ["Guitar", "Piano", "Drums", "Flute"], answer: 1, wiki: "Piano" },
      { q: "The Statue of Liberty was a gift from…", options: ["UK", "France", "Italy", "Spain"], answer: 1, wiki: "Statue_of_Liberty" },
    ],
  },
];

export function pickDaily<T>(arr: T[], count: number, seed: string): T[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const rng = () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 0xffffffff;
  };
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

export const todayKey = () => new Date().toISOString().slice(0, 10);
