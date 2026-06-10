import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "@/lib/api/app.functions";
import { Card } from "@/components/ui/card";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft } from "lucide-react";
import { PetAvatar } from "@/components/PetAvatar";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: getDashboard });

  return (
    <div className="min-h-screen pb-28">
      <div className="max-w-md mx-auto px-5 pt-6">
        <button onClick={() => navigate({ to: "/home" })} className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="text-2xl font-bold mb-5">You & your pet</h1>

        <Card className="p-5 rounded-3xl border-0 bg-card/90 mb-4 text-center">
          <PetAvatar petId={data?.profile?.pet_id} petName={data?.profile?.pet_name} size={140} />
          <div className="text-sm text-muted-foreground mt-2">
            Hello, {data?.profile?.display_name}
          </div>
        </Card>

        <Card className="p-2 rounded-2xl border-0 bg-card/90">
          <button onClick={() => navigate({ to: "/goals" })} className="w-full text-left px-3 py-3 hover:bg-muted/50 rounded-xl">
            Edit goals
          </button>
          <button onClick={() => navigate({ to: "/onboarding" })} className="w-full text-left px-3 py-3 hover:bg-muted/50 rounded-xl">
            Change pet
          </button>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
}
