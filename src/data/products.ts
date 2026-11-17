import type { Product } from "../types/index.ts";

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "catla",
    nameEn: "Catla (Bocche)",
    nameTe: "బొచ్చె / కట్ల చేప",
    category: "freshwater",
    icon: "🐟",
    descEn:
      "Sweet, meaty freshwater carp. Prized fish head for traditional Andhra pulusu.",
    descTe:
      "తీపి నీటి చేప. చేపల పులుసుకి, బొచ్చె తలకాయ పులుసుకి అత్యంత ప్రత్యేకం.",
    pricePerKg: 240,
    isAvailable: true,
    badge: "Fresh Catch",
    cuts: ["Curry Cut (with Head)", "Fry Slices", "Whole Cleaned"],
  },
  {
    id: "korameenu",
    nameEn: "Korameenu (Murrel)",
    nameTe: "కొరమీను",
    category: "freshwater",
    icon: "🐠",
    descEn:
      "Premium freshwater delicacy. Dense, flaky white flesh with very few bones.",
    descTe:
      "ఆంధ్రుల ప్రియమైన చేప. తక్కువ ముళ్ళు, ఘుమఘుమలాడే కొరమీను చేపల పులుసుకి ఫేమస్.",
    pricePerKg: 650,
    isAvailable: true,
    badge: "High Demand",
    cuts: ["Ring Cut", "Traditional Curry Cut", "Boneless Cleaned"],
  },
  {
    id: "prawns",
    nameEn: "Fresh Prawns (Royyalu)",
    nameTe: "తాజా రొయ్యలు",
    category: "shellfish",
    icon: "🦐",
    descEn:
      "Crisp, sweet marine & aquaculture prawns for curries, fry, or biryani.",
    descTe:
      "తీపి రొయ్యలు. రొయ్యల వేపుడు, రొయ్యల బిర్యానీ, గోంగూర రొయ్యలకి పర్ఫెక్ట్.",
    pricePerKg: 520,
    isAvailable: true,
    badge: "Fresh Today",
    cuts: ["Whole with Shell", "Peeled & Deveined", "Tail-On Cleaned"],
  },
  {
    id: "crabs",
    nameEn: "Live Mud Crabs (Peethalu)",
    nameTe: "పీతలు (లైవ్)",
    category: "shellfish",
    icon: "🦀",
    descEn: "Live tied mud crabs full of sweet, tender meat and rich roe.",
    descTe: "లైవ్ పీతలు. పీతల ఇగురు మరియు రోస్ట్ కి చాలా రుచికరం.",
    pricePerKg: 580,
    isAvailable: true,
    badge: "Live Catch",
    cuts: ["Live Tied (Whole)", "Cleaned & Halved (Claws Cracked)"],
  },
  {
    id: "seelavathi",
    nameEn: "Seelavathi",
    nameTe: "శీలావతి చేప",
    category: "freshwater",
    icon: "🐟",
    descEn:
      "Everyday favourite freshwater carp. Tender texture, perfect for home curry.",
    descTe:
      "ప్రతిరోజు ఇంట్లో వండుకునే చేప. మెత్తని రుచి, వేపుడు మరియు పులుసుకి బాగుంటుంది.",
    pricePerKg: 220,
    isAvailable: true,
    badge: "Best Value",
    cuts: ["Curry Cut", "Fry Cut", "Whole Cleaned"],
  },
  {
    id: "apollo",
    nameEn: "Apollo Fish (Fillet)",
    nameTe: "అపోలో చేప (ఫిల్లెట్)",
    category: "freshwater",
    icon: "🥩",
    descEn:
      "Boneless fillets cut into strips, ready for spicy Hyderabadi Apollo Fry.",
    descTe:
      "ముళ్ళు లేని శుభ్రం చేసిన చేప ముక్కలు. స్పైసీ అపోలో ఫిష్ ఫ్రై కోసం ప్రత్యేకం.",
    pricePerKg: null, // Price on request
    isAvailable: true,
    badge: "Boneless",
    cuts: ["Boneless Finger Strips", "Boneless Cubes"],
  },
  {
    id: "tuna",
    nameEn: "Tuna Fish",
    nameTe: "ట్యూనా చేప",
    category: "marine",
    icon: "🐟",
    descEn:
      "Firm marine red meat fish. High protein, great for spicy roast or curry.",
    descTe:
      "సముద్రపు చేప. అధిక ప్రోటీన్, గట్టి మాంసం. ఫిష్ రోస్ట్ లేదా పులుసుకి బాగుంటుంది.",
    pricePerKg: 380,
    isAvailable: true,
    badge: "Marine Catch",
    cuts: ["Curry Cubes", "Steak Slices"],
  },
  {
    id: "nethallu",
    nameEn: "Nethallu (Anchovies)",
    nameTe: "నెత్తళ్ళు",
    category: "marine",
    icon: "🐟",
    descEn:
      "Small silver marine fish. Incredible when made as crispy fry or tangy pulusu.",
    descTe:
      "చిన్న చేపలు. కరకరలాడే నెత్తళ్ళ వేపుడు లేదా చింతకాయ నెత్తళ్ళ పులుసుకి ప్రత్యేకం.",
    pricePerKg: 320,
    isAvailable: true,
    badge: "Crispy Fry Special",
    cuts: ["Headless Cleaned", "Whole Fresh"],
  },
];
