import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Target,
  Wallet,
  Settings,
  Menu,
  X,
  LogOut,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/UserContext";

const navItems = [
  { path: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { path: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { path: "/budgets", label: "Budgets", icon: PiggyBank },
  { path: "/goals", label: "Objectifs", icon: Target },
  { path: "/accounts", label: "Comptes", icon: Wallet },
  { path: "/profile", label: "Profil & Paramètres", icon: Settings },
];

function UserAvatar({ user, size = "sm" }) {
  const dim = size === "lg" ? "w-12 h-12 text-lg" : "w-8 h-8 text-xs";
  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : (user?.email?.[0] || "?").toUpperCase();

  if (user?.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.full_name || "Avatar"}
        className={cn(
          "rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-800",
          dim,
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br from-violet-500 to-primary text-primary-foreground flex items-center justify-center font-bold shrink-0 shadow-sm",
        dim,
      )}
    >
      {initials}
    </div>
  );
}

export default function AppLayout() {
  const { user, onLogout } = useUser();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    /* Fond de page rafraîchi pour faire ressortir les cartes */
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-200">
      {/* MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-500/20 text-primary">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="font-black text-base tracking-tight uppercase">
            FinTrack
          </span>
        </div>
        <div className="flex items-center gap-2">
          {user && <UserAvatar user={user} />}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-slate-500 dark:text-slate-400"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE NAV OVERLAY */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute top-14 left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 space-y-1 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                  location.pathname === item.path
                    ? "bg-gradient-to-r from-violet-600 to-primary text-white shadow-md shadow-primary/20"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            <button
              onClick={onLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
            >
              <LogOut className="w-4 h-4" /> Déconnexion
            </button>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR - Adaptative Light/Dark Mode */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/80 z-40">
        {/* LOGO AREA */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet-100 to-violet-200 dark:from-slate-800 dark:to-slate-800/50 p-1.5 border border-violet-200/50 dark:border-transparent shadow-sm">
            <img src="slogo.png" alt="slogo" className="object-contain" />
          </div>
          <div>
            <h1 className="font-black text-base text-slate-800 dark:text-white leading-none tracking-tight">
              S-Finance
            </h1>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
              Suivi financier
            </p>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-3 space-y-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-violet-600 to-primary text-white shadow-md shadow-primary/25 font-extrabold"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200",
                )}
              >
                <item.icon
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    isActive ? "scale-110" : "opacity-80",
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* PROFILE CARD & LOGOUT AREA */}
        <div className="p-4 mx-3 mb-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950/40 dark:to-slate-950/10 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
          <Link
            to="/profile"
            className="flex items-center gap-3 hover:opacity-85 transition-opacity"
          >
            <UserAvatar user={user} />
            <div className="min-w-0">
              <p className="text-xs text-slate-800 dark:text-slate-200 font-bold truncate">
                {user?.full_name || "Utilisateur"}
              </p>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate mt-0.5">
                {user?.email}
              </p>
            </div>
          </Link>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors border-t border-slate-200 dark:border-slate-800/60 pt-2.5 w-full text-left"
          >
            <LogOut className="w-3.5 h-3.5" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen flex flex-col">
        {/* Le conteneur s'adapte à la largeur idéale maximale sans coller aux bords */}
        <div className="p-4 md:p-8 max-w-[1600px] w-full mx-auto space-y-6 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
