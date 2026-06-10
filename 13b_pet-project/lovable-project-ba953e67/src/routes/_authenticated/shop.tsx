import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard, buyItem } from "@/lib/api/app.functions";
import { SHOP } from "@/lib/shop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { toast } from "sonner";
import { ArrowLeft, Coins } from "lucide-react";

export const Route = createFileRoute("/_authenticated/shop")({
  component: ShopPage,
});

function ShopPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const dashFn = useServerFn(getDashboard);
  const buyFn = useServerFn(buyItem);
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => dashFn() });

  const mut = useMutation({
    mutationFn: buyFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Yum/Yay! Your pet is happier 💖");
    },
    onError: (e: any) => toast.error(e.message ?? "Couldn't buy"),
  });

  const coins = data?.profile?.coins ?? 0;
  const foods = SHOP.filter((s) => s.kind === "food");
  const toys = SHOP.filter((s) => s.kind === "toy");

  return (
    <div className="min-h-screen pb-28">
      <div className="max-w-md mx-auto px-5 pt-6">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate({ to: "/home" })} className="flex items-center gap-1 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-1.5 bg-card rounded-full px-3 py-1.5 border border-border/50">
            <Coins className="h-4 w-4" style={{ color: "var(--coin)" }} />
            <span className="font-semibold">{coins}</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-5">Pet shop</h1>

        <h2 className="font-semibold mb-2">🍱 Food (boosts hunger)</h2>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {foods.map((it) => (
            <Card key={it.id} className="p-4 rounded-2xl border-0 bg-card/90 text-center">
              <div className="text-5xl mb-2">{it.emoji}</div>
              <div className="font-semibold">{it.name}</div>
              <div className="text-xs text-muted-foreground mb-3">+{it.boost} hunger</div>
              <Button
                size="sm"
                className="w-full rounded-xl"
                disabled={mut.isPending || coins < it.cost}
                onClick={() => mut.mutate({ data: { itemId: it.id } })}
              >
                <Coins className="h-3.5 w-3.5 mr-1" /> {it.cost}
              </Button>
            </Card>
          ))}
        </div>

        <h2 className="font-semibold mb-2">🎈 Toys (boosts fun)</h2>
        <div className="grid grid-cols-2 gap-3">
          {toys.map((it) => (
            <Card key={it.id} className="p-4 rounded-2xl border-0 bg-card/90 text-center">
              <div className="text-5xl mb-2">{it.emoji}</div>
              <div className="font-semibold">{it.name}</div>
              <div className="text-xs text-muted-foreground mb-3">+{it.boost} fun</div>
              <Button
                size="sm"
                className="w-full rounded-xl"
                disabled={mut.isPending || coins < it.cost}
                onClick={() => mut.mutate({ data: { itemId: it.id } })}
              >
                <Coins className="h-3.5 w-3.5 mr-1" /> {it.cost}
              </Button>
            </Card>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
