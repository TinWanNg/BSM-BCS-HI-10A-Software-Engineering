import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Target, PlusCircle, ShoppingBag, Settings } from "lucide-react";

const items = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/log", label: "Log", icon: PlusCircle },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/shop", label: "Shop", icon: ShoppingBag },
  { to: "/settings", label: "Me", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-border/60 bg-card/85 backdrop-blur-lg">
      <div className="max-w-md mx-auto grid grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 py-2.5 text-xs transition ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "scale-110" : ""}`} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
