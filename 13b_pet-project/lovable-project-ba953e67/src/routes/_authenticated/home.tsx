import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard } from "@/lib/api/app.functions";
import { PetAvatar } from "@/components/PetAvatar";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Footprints, Droplets, Moon, Dumbbell, Coins, Heart, Smile } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/home")({
  component: Dashboard,
});

function GoalRow({
  icon: Icon,
  label,
  value,
  target,
  unit,
  tint,
  rewarded,
}: any) {
  const pct = Math.min(100, Math.round((value / Math.max(1, target)) * 100));
  return (
    <Card className="p-4 rounded-2xl border-0 bg-card/90">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `color-mix(in oklab, ${tint} 35%, transparent)` }}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="font-semibold">
            {value}
            <span className="text-muted-foreground font-normal"> / {target} {unit}</span>
          </div>
        </div>
        {rewarded && <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">+✓</span>}
      </div>
      <Progress value={pct} className="h-2" />
    </Card>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const dashboardFn = useServerFn(getDashboard);
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardFn(),
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (data && data.profile && !data.profile.onboarded) {
      navigate({ to: "/onboarding" });
    }
  }, [data, navigate]);

  if (isLoading || !data || !data.profile || !data.goals) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }
  const { profile, goals, log, pet, workoutsThisWeek } = data;
  if (!profile.onboarded) return null;

  const avg = ((pet?.hunger ?? 0) + (pet?.fun ?? 0)) / 2;
  const mood: "happy" | "okay" | "sad" = avg > 65 ? "happy" : avg > 35 ? "okay" : "sad";
  const lowAlert = (pet?.hunger ?? 100) < 30 || (pet?.fun ?? 100) < 30;

  return (
    <div className="min-h-screen pb-28">
      <div className="max-w-md mx-auto px-5 pt-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-sm text-muted-foreground">Hi {profile.display_name} 👋</div>
            <div className="text-xl font-bold">Today's quest</div>
          </div>
          <div className="flex items-center gap-1.5 bg-card rounded-full px-3 py-1.5 border border-border/50">
            <Coins className="h-4 w-4" style={{ color: "var(--coin)" }} />
            <span className="font-semibold">{profile.coins}</span>
          </div>
        </div>

        <Card className="rounded-3xl border-0 p-5 mb-4 bg-card/90 overflow-hidden">
          <PetAvatar petId={profile.pet_id} petName={profile.pet_name} mood={mood} size={200} />
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Heart className="h-3.5 w-3.5" /> Hunger
              </div>
              <Progress value={pet?.hunger ?? 0} className="h-2" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Smile className="h-3.5 w-3.5" /> Fun
              </div>
              <Progress value={pet?.fun ?? 0} className="h-2" />
            </div>
          </div>
          {lowAlert && (
            <div className="mt-4 text-sm bg-accent/40 rounded-xl p-3">
              {profile.pet_name} is getting low. Hit your goals to earn coins, then visit the{" "}
              <Link to="/shop" className="underline font-medium">Shop</Link>!
            </div>
          )}
        </Card>

        <div className="grid gap-3">
          <GoalRow icon={Footprints} label="Steps" value={log.steps} target={goals.steps_target} unit="" tint="var(--pink)" rewarded={(log.rewarded as any)?.steps} />
          <GoalRow icon={Droplets} label="Water" value={log.water} target={goals.water_target} unit="cups" tint="var(--sky)" rewarded={(log.rewarded as any)?.water} />
          <GoalRow icon={Moon} label="Sleep" value={log.sleep} target={goals.sleep_target} unit="hrs" tint="var(--mint)" rewarded={(log.rewarded as any)?.sleep} />
          <GoalRow icon={Dumbbell} label="Workouts this week" value={workoutsThisWeek} target={goals.workouts_per_week} unit="" tint="var(--lemon)" rewarded={(log.rewarded as any)?.workout} />
        </div>

        <Link to="/log" className="block mt-4 text-center rounded-2xl bg-primary text-primary-foreground font-medium py-3.5">
          Log today's activity
        </Link>
      </div>
      <BottomNav />
    </div>
  );
}
