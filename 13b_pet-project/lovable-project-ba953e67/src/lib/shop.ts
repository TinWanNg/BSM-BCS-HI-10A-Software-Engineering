export type ShopKind = "food" | "toy";

export interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  kind: ShopKind;
  cost: number;
  boost: number; // points added to hunger (food) or fun (toy)
}

export const SHOP: ShopItem[] = [
  { id: "berry", name: "Berry Bowl", emoji: "🍓", kind: "food", cost: 10, boost: 10 },
  { id: "sandwich", name: "Sandwich", emoji: "🥪", kind: "food", cost: 25, boost: 25 },
  { id: "cake", name: "Birthday Cake", emoji: "🎂", kind: "food", cost: 60, boost: 60 },
  { id: "ball", name: "Bouncy Ball", emoji: "⚽", kind: "toy", cost: 15, boost: 15 },
  { id: "kite", name: "Pastel Kite", emoji: "🪁", kind: "toy", cost: 35, boost: 35 },
  { id: "console", name: "Mini Console", emoji: "🎮", kind: "toy", cost: 70, boost: 70 },
];

export const getItem = (id: string) => SHOP.find((s) => s.id === id);
