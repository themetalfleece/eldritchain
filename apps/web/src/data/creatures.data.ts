import { type Rarity } from "@eldritchain/common";
import creaturesJson from "./creatures.json";

export type { Rarity };

export interface Creature {
  id: number;
  name: string;
  rarity: Rarity;
  description: string;
}

// Fixed ID namespaces per rarity (proportional to drop rates)
// Common: 0-999 (1000 IDs) - 70% drop rate
// Rare: 1000-1499 (500 IDs) - 25% drop rate
// Epic: 1500-1599 (100 IDs) - 4.5% drop rate
// Deity: 1600-1649 (50 IDs) - 0.5% drop rate

export const creatures: Creature[] = creaturesJson as Creature[];

/*
// Original creatures data now in creatures.json
const _oldCreatures = [
  // === COMMON (0-59): 60 creatures ===
  {
    id: 0,
    name: "House Sparrow",
    rarity: "common",
    description: "A small chirping bird found in urban areas.",
  },
  {
    id: 1,
    name: "Common Housefly",
    rarity: "common",
    description: "An annoying buzzing insect that spreads disease.",
  },
  {
    id: 2,
    name: "Brown Rat",
    rarity: "common",
    description: "A scurrying rodent that thrives in sewers and alleys.",
  },
  {
    id: 3,
    name: "Garden Snail",
    rarity: "common",
    description: "A slow-moving mollusk with a spiral shell.",
  },
  {
    id: 4,
    name: "Earthworm",
    rarity: "common",
    description: "A segmented creature that burrows through soil.",
  },
  {
    id: 5,
    name: "Common Mosquito",
    rarity: "common",
    description: "A blood-sucking insect with a high-pitched whine.",
  },
  {
    id: 6,
    name: "Domestic Chicken",
    rarity: "common",
    description: "A flightless bird raised for eggs and meat.",
  },
  {
    id: 7,
    name: "Tabby Cat",
    rarity: "common",
    description: "A common feline with striped fur.",
  },
  {
    id: 8,
    name: "House Mouse",
    rarity: "common",
    description: "A tiny rodent that sneaks through walls.",
  },
  {
    id: 9,
    name: "Goldfish",
    rarity: "common",
    description: "An orange fish swimming in circles.",
  },
  {
    id: 10,
    name: "Ant",
    rarity: "common",
    description: "A hardworking insect that lives in massive colonies.",
  },
  {
    id: 11,
    name: "Cockroach",
    rarity: "common",
    description: "A resilient pest that scurries when exposed to light.",
  },
  {
    id: 12,
    name: "Pigeon",
    rarity: "common",
    description: "A gray bird that roosts on city buildings.",
  },
  {
    id: 13,
    name: "Ladybug",
    rarity: "common",
    description: "A spotted beetle considered good luck.",
  },
  {
    id: 14,
    name: "Cricket",
    rarity: "common",
    description: "A chirping insect that sings on summer nights.",
  },
  {
    id: 15,
    name: "Fruit Fly",
    rarity: "common",
    description: "A tiny pest attracted to rotting produce.",
  },
  {
    id: 16,
    name: "Common Toad",
    rarity: "common",
    description: "A warty amphibian that hops through gardens.",
  },
  {
    id: 17,
    name: "Grasshopper",
    rarity: "common",
    description: "A leaping insect with powerful hind legs.",
  },
  {
    id: 18,
    name: "Garden Spider",
    rarity: "common",
    description: "An eight-legged weaver of delicate webs.",
  },
  {
    id: 19,
    name: "Slug",
    rarity: "common",
    description: "A shell-less mollusk that leaves a slimy trail.",
  },
  {
    id: 20,
    name: "Centipede",
    rarity: "common",
    description: "A many-legged arthropod with venomous fangs.",
  },
  {
    id: 21,
    name: "Millipede",
    rarity: "common",
    description: "A long-bodied creature with countless legs.",
  },
  {
    id: 22,
    name: "Moth",
    rarity: "common",
    description: "A nocturnal flying insect drawn to light.",
  },
  {
    id: 23,
    name: "Dragonfly",
    rarity: "common",
    description: "An iridescent insect with four wings.",
  },
  {
    id: 24,
    name: "Butterfly",
    rarity: "common",
    description: "A delicate flier with colorful wings.",
  },
  {
    id: 25,
    name: "Barn Swallow",
    rarity: "common",
    description: "A graceful bird with a forked tail.",
  },
  {
    id: 26,
    name: "Bumblebee",
    rarity: "common",
    description: "A fuzzy pollinator that buzzes from flower to flower.",
  },
  {
    id: 27,
    name: "Bat",
    rarity: "common",
    description: "A nocturnal flying mammal that uses echolocation.",
  },
  {
    id: 28,
    name: "Opossum",
    rarity: "common",
    description: "A marsupial that plays dead when threatened.",
  },
  {
    id: 29,
    name: "Raccoon",
    rarity: "common",
    description: "A masked bandit that raids trash cans.",
  },
  {
    id: 30,
    name: "Squirrel",
    rarity: "common",
    description: "A bushy-tailed rodent that hoards nuts.",
  },
  {
    id: 31,
    name: "Chipmunk",
    rarity: "common",
    description: "A striped ground squirrel with pouched cheeks.",
  },
  {
    id: 32,
    name: "Rabbit",
    rarity: "common",
    description: "A long-eared herbivore that hops swiftly.",
  },
  {
    id: 33,
    name: "Hamster",
    rarity: "common",
    description: "A small rodent with expandable cheek pouches.",
  },
  {
    id: 34,
    name: "Guinea Pig",
    rarity: "common",
    description: "A docile rodent that squeaks when excited.",
  },
  {
    id: 35,
    name: "Canary",
    rarity: "common",
    description: "A small songbird with bright yellow plumage.",
  },
  {
    id: 36,
    name: "Parakeet",
    rarity: "common",
    description: "A small parrot with colorful feathers.",
  },
  {
    id: 37,
    name: "Dove",
    rarity: "common",
    description: "A peaceful bird with a soft cooing call.",
  },
  {
    id: 38,
    name: "Duck",
    rarity: "common",
    description: "A waterbird with webbed feet.",
  },
  {
    id: 39,
    name: "Goose",
    rarity: "common",
    description: "A large waterfowl with a loud honk.",
  },
  {
    id: 40,
    name: "Sheep",
    rarity: "common",
    description: "A woolly herbivore that grazes in flocks.",
  },
  {
    id: 41,
    name: "Goat",
    rarity: "common",
    description: "A sure-footed climber that eats almost anything.",
  },
  {
    id: 42,
    name: "Pig",
    rarity: "common",
    description: "An intelligent omnivore that loves to root in mud.",
  },
  {
    id: 43,
    name: "Cow",
    rarity: "common",
    description: "A large bovine that chews cud contentedly.",
  },
  {
    id: 44,
    name: "Horse",
    rarity: "common",
    description: "A powerful mammal domesticated for riding.",
  },
  {
    id: 45,
    name: "Donkey",
    rarity: "common",
    description: "A sturdy pack animal with long ears.",
  },
  {
    id: 46,
    name: "Ferret",
    rarity: "common",
    description: "A playful mustelid with a long body.",
  },
  {
    id: 47,
    name: "Hedgehog",
    rarity: "common",
    description: "A spiny mammal that rolls into a ball for defense.",
  },
  {
    id: 48,
    name: "Meerkat",
    rarity: "common",
    description: "A social mongoose that stands guard on hind legs.",
  },
  {
    id: 49,
    name: "Prairie Dog",
    rarity: "common",
    description: "A burrowing rodent that barks warnings to its colony.",
  },
  {
    id: 50,
    name: "Capybara",
    rarity: "common",
    description: "The world's largest rodent, surprisingly chill.",
  },
  {
    id: 51,
    name: "Porcupine",
    rarity: "common",
    description: "A rodent covered in sharp quills.",
  },
  {
    id: 52,
    name: "Beaver",
    rarity: "common",
    description: "An industrious rodent that builds dams.",
  },
  {
    id: 53,
    name: "Otter",
    rarity: "common",
    description: "A playful aquatic mammal with sleek fur.",
  },
  {
    id: 54,
    name: "Frog",
    rarity: "common",
    description: "An amphibian that catches flies with its tongue.",
  },
  {
    id: 55,
    name: "Turtle",
    rarity: "common",
    description: "A reptile with a protective shell.",
  },
  {
    id: 56,
    name: "Lizard",
    rarity: "common",
    description: "A small reptile that basks in the sun.",
  },
  {
    id: 57,
    name: "Salamander",
    rarity: "common",
    description: "An amphibian with a long tail.",
  },
  {
    id: 58,
    name: "Crow",
    rarity: "common",
    description: "An intelligent black bird known for problem-solving.",
  },
  {
    id: 59,
    name: "Seagull",
    rarity: "common",
    description: "A coastal bird with a piercing cry.",
  },

  // === RARE (1000-1019): 20 creatures ===
  {
    id: 1000,
    name: "Gray Wolf",
    rarity: "rare",
    description: "A pack-hunting predator with piercing howls.",
  },
  {
    id: 1001,
    name: "Lion",
    rarity: "rare",
    description: "The king of beasts with a magnificent mane.",
  },
  {
    id: 1002,
    name: "Tiger",
    rarity: "rare",
    description: "A striped solitary hunter of the jungle.",
  },
  {
    id: 1003,
    name: "Leopard",
    rarity: "rare",
    description: "A spotted cat that drags kills into trees.",
  },
  {
    id: 1004,
    name: "Grizzly Bear",
    rarity: "rare",
    description: "A massive omnivore with devastating claws.",
  },
  {
    id: 1005,
    name: "Polar Bear",
    rarity: "rare",
    description: "The largest land carnivore on Earth.",
  },
  {
    id: 1006,
    name: "Crocodile",
    rarity: "rare",
    description: "An ancient reptile with crushing jaws.",
  },
  {
    id: 1007,
    name: "Great White Shark",
    rarity: "rare",
    description: "An oceanic apex predator with rows of teeth.",
  },
  {
    id: 1008,
    name: "Orca",
    rarity: "rare",
    description: "The killer whale, ocean's top predator.",
  },
  {
    id: 1009,
    name: "Eagle",
    rarity: "rare",
    description: "A soaring raptor with keen eyesight.",
  },
  {
    id: 1010,
    name: "Velociraptor",
    rarity: "rare",
    description: "An extinct feathered theropod with a sickle claw.",
  },
  {
    id: 1011,
    name: "Tyrannosaurus Rex",
    rarity: "rare",
    description: "The tyrant lizard king with bone-crushing jaws.",
  },
  {
    id: 1012,
    name: "Saber-Toothed Cat",
    rarity: "rare",
    description: "An ice age predator with elongated fangs.",
  },
  {
    id: 1013,
    name: "Dire Wolf",
    rarity: "rare",
    description: "A prehistoric wolf larger than modern species.",
  },
  {
    id: 1014,
    name: "Mammoth",
    rarity: "rare",
    description: "A woolly elephant of the ice age.",
  },
  {
    id: 1015,
    name: "Terror Bird",
    rarity: "rare",
    description: "A flightless predatory bird with a massive hooked beak.",
  },
  {
    id: 1016,
    name: "Megalodon",
    rarity: "rare",
    description: "A prehistoric shark the size of a bus.",
  },
  {
    id: 1017,
    name: "Spinosaurus",
    rarity: "rare",
    description: "A sail-backed dinosaur that hunted fish.",
  },
  {
    id: 1018,
    name: "Komodo Dragon",
    rarity: "rare",
    description: "The world's largest lizard with toxic saliva.",
  },
  {
    id: 1019,
    name: "King Cobra",
    rarity: "rare",
    description: "The world's longest venomous snake.",
  },

  // === EPIC (1500-1511): 12 creatures ===
  {
    id: 1500,
    name: "Shoggoth",
    rarity: "epic",
    description: "A protoplasmic mass of eyes and mouths created by Elder Things.",
  },
  {
    id: 1501,
    name: "Hound of Tindalos",
    rarity: "epic",
    description: "Angular predators that hunt through time's corners.",
  },
  {
    id: 1502,
    name: "Nightgaunt",
    rarity: "epic",
    description: "Faceless black humanoids with barbed tails.",
  },
  {
    id: 1503,
    name: "Mi-Go",
    rarity: "epic",
    description: "Fungoid crustaceans from beyond Pluto.",
  },
  {
    id: 1504,
    name: "Deep One",
    rarity: "epic",
    description: "Amphibious fish-frog humanoids serving Cthulhu.",
  },
  {
    id: 1505,
    name: "Star Vampire",
    rarity: "epic",
    description: "Invisible flying creatures that drain blood.",
  },
  {
    id: 1506,
    name: "Dimensional Shambler",
    rarity: "epic",
    description: "Hulking beings that shift between realities.",
  },
  {
    id: 1507,
    name: "Byakhee",
    rarity: "epic",
    description: "Winged steeds of interstellar void.",
  },
  {
    id: 1508,
    name: "Elder Thing",
    rarity: "epic",
    description: "Barrel-shaped aliens who created life on Earth.",
  },
  {
    id: 1509,
    name: "Color Out of Space",
    rarity: "epic",
    description: "An indescribable color not of this reality.",
  },
  {
    id: 1510,
    name: "Dark Young",
    rarity: "epic",
    description: "Tentacled tree-like monstrosities with hooves.",
  },
  {
    id: 1511,
    name: "Flying Polyp",
    rarity: "epic",
    description: "Partially invisible cylindrical horrors, masters of wind.",
  },

  // === DEITY (1600-1604): 5 creatures ===
  {
    id: 1600,
    name: "Azathoth",
    rarity: "deity",
    description:
      "The Blind Idiot God at the center of infinity. Nuclear chaos whose awakening would unmake reality.",
  },
  {
    id: 1601,
    name: "Cthulhu",
    rarity: "deity",
    description:
      "The Great Dreamer sleeping in R'lyeh. Dragon-octopus priest whose dreams drive mortals mad.",
  },
  {
    id: 1602,
    name: "Nyarlathotep",
    rarity: "deity",
    description:
      "The Crawling Chaos with a thousand masks. Messenger of the Outer Gods who delights in corrupting humanity.",
  },
  {
    id: 1603,
    name: "Yog-Sothoth",
    rarity: "deity",
    description:
      "The Gate and Key to all dimensions. Exists simultaneously in all times and spaces.",
  },
  {
    id: 1604,
    name: "Shub-Niggurath",
    rarity: "deity",
    description:
      "The Black Goat of the Woods with a Thousand Young. Fertility goddess whose offspring corrupt worlds.",
  },
];
*/

export function getCreature(id: number): Creature | undefined {
  return creatures.find((c) => c.id === id);
}

export function getRarityColor(rarity: Rarity): string {
  switch (rarity) {
    case "common":
      return "text-gray-400 border-gray-400";
    case "rare":
      return "text-blue-400 border-blue-400";
    case "epic":
      return "text-purple-400 border-purple-400";
    case "deity":
      return "text-yellow-400 border-yellow-400";
  }
}

export function getRarityBgColor(rarity: Rarity): string {
  switch (rarity) {
    case "common":
      return "bg-gray-900/50";
    case "rare":
      return "bg-blue-900/30";
    case "epic":
      return "bg-purple-900/30";
    case "deity":
      return "bg-yellow-900/30";
  }
}

// Helper to get all creatures by rarity
export function getCreaturesByRarity(rarity: Rarity): Creature[] {
  return creatures.filter((c) => c.rarity === rarity);
}

// Helper to get highest ID per rarity
export function getHighestIdByRarity(): {
  common: number;
  rare: number;
  epic: number;
  deity: number;
} {
  const commons = getCreaturesByRarity("common");
  const rares = getCreaturesByRarity("rare");
  const epics = getCreaturesByRarity("epic");
  const deities = getCreaturesByRarity("deity");

  return {
    common: commons.length > 0 ? Math.max(...commons.map((c) => c.id)) : -1,
    rare: rares.length > 0 ? Math.max(...rares.map((c) => c.id)) : 999,
    epic: epics.length > 0 ? Math.max(...epics.map((c) => c.id)) : 1499,
    deity: deities.length > 0 ? Math.max(...deities.map((c) => c.id)) : 1599,
  };
}
