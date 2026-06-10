import cat from "@/assets/pet-cat.png";
import dragon from "@/assets/pet-dragon.png";
import bunny from "@/assets/pet-bunny.png";
import penguin from "@/assets/pet-penguin.png";

export type PetId = "cat" | "dragon" | "bunny" | "penguin";

export interface PetDef {
  id: PetId;
  name: string;
  image: string;
  tint: string;
  blurb: string;
}

export const PETS: PetDef[] = [
  { id: "cat", name: "Mochi", image: cat, tint: "var(--pink)", blurb: "A cozy kitten who loves naps." },
  { id: "dragon", name: "Pip", image: dragon, tint: "var(--mint)", blurb: "A tiny dragon with big energy." },
  { id: "bunny", name: "Butter", image: bunny, tint: "var(--lemon)", blurb: "A fluffy bun who hops along." },
  { id: "penguin", name: "Bloop", image: penguin, tint: "var(--sky)", blurb: "A waddly penguin pal." },
];

export const getPet = (id?: string | null) =>
  PETS.find((p) => p.id === id) ?? PETS[0];
