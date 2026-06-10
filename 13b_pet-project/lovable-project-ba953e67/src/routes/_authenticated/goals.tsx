import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard, saveGoals } from "@/lib/api/app.functions";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BottomNav } from "@/components/BottomNav";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/goals")({
  component: GoalsPage,
});

function GoalsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const dashFn = useServerFn(getDashboard);
  const saveFn = useServerFn(saveGoals);

  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => dashFn() });
  const [steps, setSteps] = useState(8000);
  const [water, setWater] = useState(8);
  const [sleep, setSleep] = useState(8);
  const [workouts, setWorkouts] = useState(3);

  useEffect(() => {
    if (data?.goals) {
      setSteps(data.goals.steps_target);
      setWater(data.goals.water_target);
      setSleep(Number(data.goals.sleep_target));
      setWorkouts(data.goals.workouts_per_week);
    }
  }, [data]);

  const mut = useMutation({
    mutationFn: saveFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Goals updated");
      navigate({ to: "/home" });
    },
    onError: (e: any) => toast.error(e.message ?? "Save failed"),
  });

  return (
    <div className="min-h-screen pb-28">
      <div className="max-w-md mx-auto px-5 pt-6">
        <button onClick={() => navigate({ to: "/home" })} className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="text-2xl font-bold mb-1">Your goals</h1>
        <p className="text-muted-foreground text-sm mb-5">Set realistic targets. You earn coins each time you hit one.</p>

        <Card className="p-5 rounded-3xl border-0 bg-card/90 space-y-4">
          <div>
            <Label>Daily steps</Label>
            <Input type="number" value={steps} onChange={(e) => setSteps(Number(e.target.value))} className="rounded-xl mt-1" />
          </div>
          <div>
            <Label>Daily water (cups)</Label>
            <Input type="number" value={water} onChange={(e) => setWater(Number(e.target.value))} className="rounded-xl mt-1" />
          </div>
          <div>
            <Label>Daily sleep (hours)</Label>
            <Input type="number" step="0.5" value={sleep} onChange={(e) => setSleep(Number(e.target.value))} className="rounded-xl mt-1" />
          </div>
          <div>
            <Label>Workouts per week</Label>
            <Input type="number" value={workouts} onChange={(e) => setWorkouts(Number(e.target.value))} className="rounded-xl mt-1" />
          </div>

          <Button
            className="w-full rounded-xl h-11"
            disabled={mut.isPending}
            onClick={() =>
              mut.mutate({
                data: {
                  steps_target: steps,
                  water_target: water,
                  sleep_target: sleep,
                  workouts_per_week: workouts,
                },
              })
            }
          >
            Save goals
          </Button>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
}
