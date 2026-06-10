import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { getItem } from "@/lib/shop";

const DECAY_PER_HOUR = 4;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function clamp(v: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, v));
}

async function applyDecay(supabase: any, userId: string) {
  const { data: pet } = await supabase
    .from("pet_state")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (!pet) return null;
  const hoursPassed =
    (Date.now() - new Date(pet.last_decay).getTime()) / (1000 * 60 * 60);
  if (hoursPassed < 0.05) return pet;
  const dec = Math.floor(hoursPassed * DECAY_PER_HOUR);
  if (dec <= 0) return pet;
  const hunger = clamp(pet.hunger - dec);
  const fun = clamp(pet.fun - dec);
  const { data: updated } = await supabase
    .from("pet_state")
    .update({ hunger, fun, last_decay: new Date().toISOString() })
    .eq("user_id", userId)
    .select()
    .single();
  return updated;
}

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const date = todayISO();

    const pet = await applyDecay(supabase, userId);
    const [{ data: profile }, { data: goals }, { data: log }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("goals").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", userId)
        .eq("log_date", date)
        .maybeSingle(),
    ]);

    // weekly workout count (Mon-Sun)
    const now = new Date();
    const day = now.getDay(); // 0 Sun
    const diff = (day + 6) % 7; // days since Monday
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);
    const { data: weekLogs } = await supabase
      .from("daily_logs")
      .select("workout, log_date")
      .eq("user_id", userId)
      .gte("log_date", weekStart.toISOString().slice(0, 10));
    const workoutsThisWeek = (weekLogs ?? []).filter((l: any) => l.workout).length;

    return {
      profile,
      goals,
      log: log ?? {
        user_id: userId,
        log_date: date,
        steps: 0,
        water: 0,
        sleep: 0,
        workout: false,
        rewarded: {},
      },
      pet,
      workoutsThisWeek,
    };
  });

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { petId: string; petName: string; displayName: string }) =>
    z
      .object({
        petId: z.enum(["cat", "dragon", "bunny", "penguin"]),
        petName: z.string().min(1).max(20),
        displayName: z.string().min(1).max(40),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({
        pet_id: data.petId,
        pet_name: data.petName,
        display_name: data.displayName,
        onboarded: true,
      })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveGoals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      steps_target: number;
      water_target: number;
      sleep_target: number;
      workouts_per_week: number;
    }) =>
      z
        .object({
          steps_target: z.number().int().min(500).max(50000),
          water_target: z.number().int().min(1).max(30),
          sleep_target: z.number().min(3).max(14),
          workouts_per_week: z.number().int().min(0).max(14),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("goals")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const logToday = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { steps: number; water: number; sleep: number; workout: boolean }) =>
      z
        .object({
          steps: z.number().int().min(0).max(200000),
          water: z.number().int().min(0).max(50),
          sleep: z.number().min(0).max(24),
          workout: z.boolean(),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const date = todayISO();

    const { data: goals } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (!goals) throw new Error("No goals set");

    const { data: existing } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("log_date", date)
      .maybeSingle();

    const rewarded = (existing?.rewarded as Record<string, boolean>) ?? {};
    let coinsEarned = 0;
    const newRewards: Record<string, boolean> = { ...rewarded };

    if (!rewarded.steps && data.steps >= goals.steps_target) {
      coinsEarned += 15;
      newRewards.steps = true;
    }
    if (!rewarded.water && data.water >= goals.water_target) {
      coinsEarned += 10;
      newRewards.water = true;
    }
    if (!rewarded.sleep && data.sleep >= goals.sleep_target) {
      coinsEarned += 15;
      newRewards.sleep = true;
    }
    if (!rewarded.workout && data.workout) {
      coinsEarned += 25;
      newRewards.workout = true;
    }

    const payload = {
      user_id: userId,
      log_date: date,
      steps: data.steps,
      water: data.water,
      sleep: data.sleep,
      workout: data.workout,
      rewarded: newRewards,
      updated_at: new Date().toISOString(),
    };

    const { error: upErr } = await supabase
      .from("daily_logs")
      .upsert(payload, { onConflict: "user_id,log_date" });
    if (upErr) throw new Error(upErr.message);

    if (coinsEarned > 0) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("coins")
        .eq("id", userId)
        .single();
      await supabase
        .from("profiles")
        .update({ coins: (prof?.coins ?? 0) + coinsEarned })
        .eq("id", userId);
    }

    return { coinsEarned };
  });

export const buyItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { itemId: string }) =>
    z.object({ itemId: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const item = getItem(data.itemId);
    if (!item) throw new Error("Unknown item");

    const { data: prof } = await supabase
      .from("profiles")
      .select("coins")
      .eq("id", userId)
      .single();
    if (!prof || prof.coins < item.cost) throw new Error("Not enough coins");

    const pet = await applyDecay(supabase, userId);
    if (!pet) throw new Error("No pet");

    const hunger = item.kind === "food" ? clamp(pet.hunger + item.boost) : pet.hunger;
    const fun = item.kind === "toy" ? clamp(pet.fun + item.boost) : pet.fun;

    await supabase
      .from("pet_state")
      .update({ hunger, fun, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    await supabase
      .from("profiles")
      .update({ coins: prof.coins - item.cost })
      .eq("id", userId);

    return { ok: true };
  });
