import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard, completeOnboarding } from "@/lib/api/app.functions";
import { useState } from "react";
import { PETS } from "@/lib/pets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const dashboardFn = useServerFn(getDashboard);
  const onboardFn = useServerFn(completeOnboarding);

  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => dashboardFn() });
  const [petId, setPetId] = useState<string>("cat");
  const [petName, setPetName] = useState("");
  const [displayName, setDisplayName] = useState(data?.profile?.display_name ?? "");

  const mut = useMutation({
    mutationFn: onboardFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Welcome aboard! 🎉");
      navigate({ to: "/home" });
    },
    onError: (e: any) => toast.error(e.message ?? "Could not save"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mut.mutate({ data: { petId, petName: petName || "Buddy", displayName: displayName || "Friend" } });
  };

  return (
    <div className="min-h-screen p-6 pb-24 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-1">Adopt your pet</h1>
      <p className="text-muted-foreground mb-6">Pick a companion to grow alongside your habits.</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {PETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPetId(p.id)}
            className={`rounded-3xl p-4 text-left border-2 transition ${
              petId === p.id ? "border-primary bg-card scale-[1.02]" : "border-transparent bg-card/60"
            }`}
          >
            <div
              className="aspect-square rounded-2xl flex items-center justify-center mb-2"
              style={{ background: `color-mix(in oklab, ${p.tint} 40%, transparent)` }}
            >
              <img src={p.image} alt={p.name} className="w-full h-full object-contain" loading="lazy" />
            </div>
            <div className="font-semibold">{p.name}</div>
            <div className="text-xs text-muted-foreground">{p.blurb}</div>
          </button>
        ))}
      </div>

      <Card className="p-5 rounded-3xl space-y-4 border-0 bg-card/90">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Your name</label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Alex" className="rounded-xl mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Name your pet</label>
            <Input value={petName} onChange={(e) => setPetName(e.target.value)} placeholder="Mochi" className="rounded-xl mt-1" />
          </div>
          <Button type="submit" className="w-full rounded-xl h-11" disabled={mut.isPending}>
            Start the journey
          </Button>
        </form>
        <button
          type="button"
          className="block mx-auto text-xs text-muted-foreground hover:underline"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/auth" });
          }}
        >
          Sign out
        </button>
      </Card>
    </div>
  );
}
