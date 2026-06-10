import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard, logToday } from "@/lib/api/app.functions";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BottomNav } from "@/components/BottomNav";
import { toast } from "sonner";
import { ArrowLeft, Smartphone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/log")({
  component: LogPage,
});

function LogPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const dashFn = useServerFn(getDashboard);
  const logFn = useServerFn(logToday);
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => dashFn() });

  const [steps, setSteps] = useState(0);
  const [water, setWater] = useState(0);
  const [sleep, setSleep] = useState(0);
  const [workout, setWorkout] = useState(false);

  useEffect(() => {
    if (data?.log) {
      setSteps(data.log.steps ?? 0);
      setWater(data.log.water ?? 0);
      setSleep(Number(data.log.sleep ?? 0));
      setWorkout(!!data.log.workout);
    }
  }, [data]);

  const mut = useMutation({
    mutationFn: logFn,
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      if (res?.coinsEarned > 0) toast.success(`+${res.coinsEarned} coins! 🪙`);
      else toast.success("Saved");
      navigate({ to: "/home" });
    },
    onError: (e: any) => toast.error(e.message ?? "Could not save"),
  });

  const syncMock = () => {
    setSteps(Math.max(steps, 4000 + Math.floor(Math.random() * 8000)));
    setSleep(Math.max(sleep, 6 + Math.random() * 2.5));
    toast.success("Synced from health app (demo)");
  };

  return (
    <div className="min-h-screen pb-28">
      <div className="max-w-md mx-auto px-5 pt-6">
        <button onClick={() => navigate({ to: "/home" })} className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="text-2xl font-bold mb-1">Log today</h1>
        <p className="text-muted-foreground mb-5 text-sm">Hit your goals to feed your pet.</p>

        <button onClick={syncMock} className="w-full mb-5 rounded-2xl bg-secondary/60 text-secondary-foreground p-4 flex items-center gap-3 text-left hover:bg-secondary transition">
          <Smartphone className="h-5 w-5" />
          <div className="flex-1">
            <div className="font-medium">Sync from Apple Health / Google Fit</div>
            <div className="text-xs text-muted-foreground">Demo: pulls today's steps & sleep</div>
          </div>
        </button>

        <Card className="p-5 rounded-3xl border-0 bg-card/90 space-y-5">
          <div>
            <Label>Steps</Label>
            <Input type="number" value={steps} onChange={(e) => setSteps(Number(e.target.value))} className="rounded-xl mt-1" />
          </div>
          <div>
            <Label>Water (cups)</Label>
            <div className="flex items-center gap-2 mt-1">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setWater(Math.max(0, water - 1))}>−</Button>
              <div className="flex-1 text-center text-xl font-semibold">{water}</div>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setWater(water + 1)}>+</Button>
            </div>
          </div>
          <div>
            <Label>Sleep last night (hrs)</Label>
            <Input type="number" step="0.5" value={sleep} onChange={(e) => setSleep(Number(e.target.value))} className="rounded-xl mt-1" />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
            <div>
              <div className="font-medium">Worked out today</div>
              <div className="text-xs text-muted-foreground">Counts toward weekly goal</div>
            </div>
            <Switch checked={workout} onCheckedChange={setWorkout} />
          </div>

          <Button
            className="w-full rounded-xl h-11"
            disabled={mut.isPending}
            onClick={() => mut.mutate({ data: { steps, water, sleep, workout } })}
          >
            Save today
          </Button>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
}
