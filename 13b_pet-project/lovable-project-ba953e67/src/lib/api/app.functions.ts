import {
  getProfile, setProfile,
  getGoals, setGoals,
  getPetWithDecay, setPet,
  getTodayLog, setTodayLog, getWeekLogs,
} from "@/lib/storage";
import { getItem } from "@/lib/shop";

function clamp(v: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, v));
}

export async function getDashboard() {
  const profile = getProfile();
  const goals = getGoals();
  const log = getTodayLog();
  const pet = getPetWithDecay();
  const workoutsThisWeek = getWeekLogs().filter((l) => l.workout).length;
  return { profile, goals, log, pet, workoutsThisWeek };
}

export async function completeOnboarding(data: { petId: string; petName: string; displayName: string }) {
  const profile = getProfile();
  setProfile({ ...profile, pet_id: data.petId, pet_name: data.petName, display_name: data.displayName, onboarded: true });
  return { ok: true };
}

export async function saveGoals(data: { steps_target: number; water_target: number; sleep_target: number; workouts_per_week: number }) {
  setGoals(data);
  return { ok: true };
}

export async function logToday(data: { steps: number; water: number; sleep: number; workout: boolean }) {
  const goals = getGoals();
  const existing = getTodayLog();
  const rewarded = { ...existing.rewarded };
  let coinsEarned = 0;

  if (!rewarded.steps && data.steps >= goals.steps_target) { coinsEarned += 15; rewarded.steps = true; }
  if (!rewarded.water && data.water >= goals.water_target) { coinsEarned += 10; rewarded.water = true; }
  if (!rewarded.sleep && data.sleep >= goals.sleep_target) { coinsEarned += 15; rewarded.sleep = true; }
  if (!rewarded.workout && data.workout) { coinsEarned += 25; rewarded.workout = true; }

  setTodayLog({ ...data, rewarded });

  if (coinsEarned > 0) {
    const profile = getProfile();
    setProfile({ ...profile, coins: profile.coins + coinsEarned });
  }

  return { coinsEarned };
}

export async function buyItem(data: { itemId: string }) {
  const item = getItem(data.itemId);
  if (!item) throw new Error("Unknown item");

  const profile = getProfile();
  if (profile.coins < item.cost) throw new Error("Not enough coins");

  const pet = getPetWithDecay();
  const hunger = item.kind === "food" ? clamp(pet.hunger + item.boost) : pet.hunger;
  const fun = item.kind === "toy" ? clamp(pet.fun + item.boost) : pet.fun;
  setPet({ ...pet, hunger, fun });
  setProfile({ ...profile, coins: profile.coins - item.cost });

  return { ok: true };
}
