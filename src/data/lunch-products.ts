import type { CartProduct } from "../types/cart";

export type LunchProduct = CartProduct & {
  description?: string;
};

export const lunchProducts: LunchProduct[] = [
  {
    id: "rice-stew",
    name: "تمن ومرق",
    price: 4000,
    category: "وجبات الغداء",
    description: "تمن عراقي مع مرق اليوم",
  },
  {
    id: "rice-fish-stew",
    name: "تمن ومرق سمك",
    price: 6000,
    category: "وجبات الغداء",
    description: "تمن عراقي مع مرق السمك",
  },
  {
    id: "quarter-chicken-rice",
    name: "ربع دجاج على التمن",
    price: 7000,
    category: "الدجاج على التمن",
    description: "ربع دجاج عراقي مع التمن",
  },
  {
    id: "half-chicken-rice",
    name: "نصف دجاج على التمن",
    price: 12000,
    category: "الدجاج على التمن",
    description: "نصف دجاج عراقي مع التمن",
  },
  {
    id: "full-chicken-rice",
    name: "دجاجة كاملة على التمن",
    price: 18000,
    category: "الدجاج على التمن",
    description: "دجاجة كاملة مع التمن",
  },
  {
    id: "half-dry-chicken",
    name: "نصف دجاج ناشف",
    price: 9000,
    category: "الدجاج الناشف",
    description: "نصف دجاج بدون تمن ومرق",
  },
  {
    id: "full-dry-chicken",
    name: "دجاجة ناشف",
    price: 14000,
    category: "الدجاج الناشف",
    description: "دجاجة كاملة بدون تمن ومرق",
  },
  {
    id: "shrimp-meal",
    name: "نفر روبيان",
    price: 10000,
    category: "المأكولات البحرية",
  },
  {
    id: "grilled-fish-kilo",
    name: "سمك شوي كيلو",
    price: 12000,
    category: "المأكولات البحرية",
  },
  {
    id: "grilled-fish-combo",
    name: "كيلو سمك شوي مع تمن",
    price: 15000,
    category: "المأكولات البحرية",
    description: "مع تمن وسلطة ومخللات وخبز",
  },
  {
    id: "fried-fish-meal",
    name: "نفر سمك قلي",
    price: 10000,
    category: "المأكولات البحرية",
  },
];