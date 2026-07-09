import { Link, useLocation } from "react-router-dom";
import { Home, Store, Grid, ShoppingCart, User } from "lucide-react";
import { useCartStore } from "../store/useCart";
import { cn } from "../lib/utils";

export function BottomNavigation() {
  const location = useLocation();
  const items = useCartStore((state) => state.items);
  const itemsCount = items.reduce((total, item) => total + item.quantity, 0);

  const navItems = [
    {
      label: "Home",
      path: "/",
      icon: Home,
    },
    {
      label: "Shop",
      path: "/shop",
      icon: Store,
    },
    {
      label: "Categories",
      path: "/categories",
      icon: Grid,
    },
    {
      label: "Cart",
      path: "/cart",
      icon: ShoppingCart,
      badge: itemsCount > 0 ? itemsCount : undefined,
    },
    {
      label: "Account",
      path: "/account",
      icon: User,
    },
  ];

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-40 pb-safe">
      <nav className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 relative text-stone-500 hover:text-stone-900 active:scale-95 transition-all",
                isActive && "text-gold-accent font-semibold"
              )}
              id={`bottom-nav-${item.label.toLowerCase()}`}
            >
              <div className="relative p-1">
                <Icon className={cn("w-5.5 h-5.5 transition-transform", isActive && "scale-110 text-gold-accent")} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-1.5 bg-gold-primary text-neutral-950 text-[10px] font-extrabold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-wider uppercase font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
