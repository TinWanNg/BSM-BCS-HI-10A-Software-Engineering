import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, Footprints, Coins, Heart } from "lucide-react";
import catImg from "@/assets/pet-cat.png";
import dragonImg from "@/assets/pet-dragon.png";
import bunnyImg from "@/assets/pet-bunny.png";
import penguinImg from "@/assets/pet-penguin.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Petfit — Wellness habits with a pet you love" },
      { name: "description", content: "Hit your step, water, sleep, and workout goals to feed and play with your virtual pet." },
      { property: "og:title", content: "Petfit — Wellness habits with a pet" },
      { property: "og:description", content: "Track sleep and steps. Set goals. Raise a Tamagotchi-style pet that grows with your habits." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home" });
      else setChecked(true);
    });
  }, [navigate]);

  if (!checked) return null;

  return (
    <div className="min-h-screen">
      <div className="max-w-md mx-auto px-6 pt-10 pb-16">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-2xl bg-primary/30 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold text-lg">Petfit</span>
        </div>

        <div className="relative h-64 mb-6">
          <img src={catImg} alt="" className="absolute left-0 top-6 w-32 animate-[bob_3s_ease-in-out_infinite]" loading="lazy" />
          <img src={dragonImg} alt="" className="absolute right-0 top-0 w-36 animate-[bob_3.5s_ease-in-out_infinite]" loading="lazy" />
          <img src={bunnyImg} alt="" className="absolute left-8 bottom-0 w-28 animate-[bob_4s_ease-in-out_infinite]" loading="lazy" />
          <img src={penguinImg} alt="" className="absolute right-10 bottom-2 w-28 animate-[bob_3.2s_ease-in-out_infinite]" loading="lazy" />
        </div>

        <h1 className="text-4xl font-bold leading-tight mb-3">
          Build healthy habits with a pet you can't let down.
        </h1>
        <p className="text-muted-foreground mb-7">
          Track sleep, steps, water and workouts. Hit your goals to earn coins, then spoil your Tamagotchi-style pet.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { i: Footprints, t: "Track" },
            { i: Coins, t: "Earn" },
            { i: Heart, t: "Care" },
          ].map(({ i: Icon, t }) => (
            <div key={t} className="rounded-2xl bg-card/80 p-3 text-center">
              <Icon className="h-5 w-5 mx-auto mb-1 text-primary" />
              <div className="text-xs font-medium">{t}</div>
            </div>
          ))}
        </div>

        <Link to="/auth">
          <Button className="w-full rounded-2xl h-12 text-base">Adopt your pet</Button>
        </Link>
      </div>
      <style>{`@keyframes bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }`}</style>
    </div>
  );
}
