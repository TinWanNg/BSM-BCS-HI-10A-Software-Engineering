const KEYS = {
  profile: "petfit_profile",
  goals: "petfit_goals",
  pet: "petfit_pet",
  logs: "petfit_logs",
} as const;

const DECAY_PER_HOUR = 4;

function clamp(v: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, v));
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export interface Profile {
  display_name: string;
  pet_id: string;
  pet_name: string;
  coins: number;
  onboarded: boolean;
}

export interface Goals {
  steps_target: number;
  water_target: number;
  sleep_target: number;
  workouts_per_week: number;
}

export interface PetState {
  hunger: number;
  fun: number;
  last_decay: string;
}

export interface DayLog {
  steps: number;
  water: number;
  sleep: number;
  workout: boolean;
  rewarded: Record<string, boolean>;
}

const DEFAULT_PROFILE: Profile = {
  display_name: "",
  pet_id: "cat",
  pet_name: "",
  coins: 0,
  onboarded: false,
};

const DEFAULT_GOALS: Goals = {
  steps_target: 8000,
  water_target: 8,
  sleep_target: 8,
  workouts_per_week: 3,
};

const DEFAULT_PET: PetState = {
  hunger: 80,
  fun: 80,
  last_decay: new Date().toISOString(),
};

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function store(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getProfile() {
  return get<Profile>(KEYS.profile, DEFAULT_PROFILE);
}

export function setProfile(p: Profile) {
  store(KEYS.profile, p);
}

export function getGoals() {
  return get<Goals>(KEYS.goals, DEFAULT_GOALS);
}

export function setGoals(g: Goals) {
  store(KEYS.goals, g);
}

export function getPetWithDecay(): PetState {
  const pet = get<PetState>(KEYS.pet, DEFAULT_PET);
  const hoursPassed = (Date.now() - new Date(pet.last_decay).getTime()) / (1000 * 60 * 60);
  if (hoursPassed < 0.05) return pet;
  const dec = Math.floor(hoursPassed * DECAY_PER_HOUR);
  if (dec <= 0) return pet;
  const updated: PetState = {
    hunger: clamp(pet.hunger - dec),
    fun: clamp(pet.fun - dec),
    last_decay: new Date().toISOString(),
  };
  store(KEYS.pet, updated);
  return updated;
}

export function setPet(p: PetState) {
  store(KEYS.pet, p);
}

export function getTodayLog(): DayLog {
  const logs = get<Record<string, DayLog>>(KEYS.logs, {});
  return logs[todayISO()] ?? { steps: 0, water: 0, sleep: 0, workout: false, rewarded: {} };
}

export function setTodayLog(log: DayLog) {
  const logs = get<Record<string, DayLog>>(KEYS.logs, {});
  logs[todayISO()] = log;
  store(KEYS.logs, logs);
}

export function getWeekLogs(): DayLog[] {
  const now = new Date();
  const diff = (now.getDay() + 6) % 7;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - diff);
  weekStart.setHours(0, 0, 0, 0);
  const weekStartISO = weekStart.toISOString().slice(0, 10);
  const logs = get<Record<string, DayLog>>(KEYS.logs, {});
  return Object.entries(logs)
    .filter(([date]) => date >= weekStartISO)
    .map(([, log]) => log);
}
