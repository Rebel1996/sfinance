import { useQuery } from "@tanstack/react-query";
import { accountsApi } from "@/api/phpClient";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Wallet, ChevronRight, LayoutGrid } from "lucide-react";
import { useAppContext } from "@/lib/AppContext";
import { cn } from "@/lib/utils";

// Styles des comptes - Couleurs boostées au maximum en Light Mode
const ACCOUNT_STYLES = {
  primary: {
    bgActive:
      "bg-gradient-to-br from-violet-200 via-violet-100/70 to-background dark:from-violet-950/30 dark:via-slate-900 dark:to-slate-900 border-violet-400 dark:border-violet-800/80 shadow-md scale-[1.02]",
    text: "text-violet-800 dark:text-violet-400",
    iconBg:
      "bg-violet-300/80 dark:bg-violet-500/30 text-violet-900 dark:text-violet-300",
  },
  violet: {
    bgActive:
      "bg-gradient-to-br from-violet-200 via-violet-100/70 to-background dark:from-violet-950/30 dark:via-slate-900 dark:to-slate-900 border-violet-400 dark:border-violet-800/80 shadow-md scale-[1.02]",
    text: "text-violet-800 dark:text-violet-400",
    iconBg:
      "bg-violet-300/80 dark:bg-violet-500/30 text-violet-900 dark:text-violet-300",
  },
  emerald: {
    bgActive:
      "bg-gradient-to-br from-emerald-200 via-emerald-100/70 to-background dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 border-emerald-400 dark:border-emerald-800/80 shadow-md scale-[1.02]",
    text: "text-emerald-800 dark:text-emerald-400",
    iconBg:
      "bg-emerald-300/80 dark:bg-emerald-500/30 text-emerald-900 dark:text-emerald-300",
  },
  amber: {
    bgActive:
      "bg-gradient-to-br from-amber-200 via-amber-100/70 to-background dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 border-amber-400 dark:border-amber-800/80 shadow-md scale-[1.02]",
    text: "text-amber-800 dark:text-amber-400",
    iconBg:
      "bg-amber-300/80 dark:bg-amber-500/30 text-amber-900 dark:text-amber-300",
  },
  rose: {
    bgActive:
      "bg-gradient-to-br from-rose-200 via-rose-100/70 to-background dark:from-rose-950/30 dark:via-slate-900 dark:to-slate-900 border-rose-400 dark:border-rose-800/80 shadow-md scale-[1.02]",
    text: "text-rose-800 dark:text-rose-400",
    iconBg:
      "bg-rose-300/80 dark:bg-rose-500/30 text-rose-900 dark:text-rose-300",
  },
};

export default function AccountsWidget({ selectedAccountId, onSelect }) {
  const { formatCurrency } = useAppContext();
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => accountsApi.list(),
  });

  if (isLoading) {
    return (
      <Card className="p-6 border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-3 flex-wrap">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-36 rounded-xl" />
          ))}
        </div>
      </Card>
    );
  }

  if (accounts.length === 0) return null;

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    /* Fond global du widget teinté d'un léger bleu/ardoise pour éliminer le blanc pur */
    <Card className="p-6 border border-emerald-200/80 dark:border-emerald-800/60 bg-gradient-to-br from-blue-100/70 via-blue-50/30 to-background dark:from-blue-950/20 dark:via-slate-900 dark:to-slate-900 border-blue-200/80 dark:border-blue-900/40">
      {/* EN-TÊTE DU COMPOSANT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          {/* Badge de l'icône principale plus coloré */}
          <div className="p-2 rounded-xl bg-violet-100 dark:bg-slate-800 text-violet-600 dark:text-slate-400 border border-violet-200 dark:border-transparent">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-tight uppercase text-slate-700 dark:text-slate-200">
              Mes comptes
            </h3>
            {selectedAccount && (
              <p className="text-[11px] text-slate-500 dark:text-muted-foreground mt-0.5">
                Vue filtrée sur{" "}
                <span className="font-bold text-violet-700 dark:text-violet-400">
                  {selectedAccount.name}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 self-end sm:self-center bg-white/80 dark:bg-slate-900/40 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
          <div className="text-right px-1">
            <span className="text-[9px] font-black text-slate-400 dark:text-muted-foreground/70 uppercase tracking-widest block">
              {selectedAccount ? "Solde ciblé" : "Solde Global"}
            </span>
            <span
              className={cn(
                "text-base font-black tracking-tight tabular-nums",
                (selectedAccount ? selectedAccount.balance : totalBalance) >= 0
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-rose-700 dark:text-rose-400",
              )}
            >
              {selectedAccount
                ? formatCurrency(selectedAccount.balance)
                : formatCurrency(totalBalance)}
            </span>
          </div>
          <Link
            to="/accounts"
            className="text-xs font-bold text-slate-500 hover:text-violet-700 dark:hover:text-violet-400 flex items-center gap-0.5 transition-colors border-l pl-3 h-8 border-slate-200 dark:border-slate-800"
          >
            Gérer <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* LISTE DES BOUTONS FILTRES */}
      <div className="flex flex-wrap gap-3">
        {/* BOUTON : TOUS LES COMPTES */}
        <button
          onClick={() => onSelect(null)}
          className={cn(
            "flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-200 text-left cursor-pointer min-w-[145px]",
            selectedAccountId === null
              ? "bg-gradient-to-br from-violet-200 via-violet-100/70 to-background dark:from-violet-950/30 dark:via-slate-900 dark:to-slate-900 border-violet-400 dark:border-violet-800/80 shadow-md font-semibold scale-[1.02]"
              : "border-slate-200 bg-white hover:bg-violet-50/50 dark:border-slate-800/60 dark:bg-background dark:hover:bg-slate-800/60 shadow-sm",
          )}
        >
          <span
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
              selectedAccountId === null
                ? "bg-violet-300/80 dark:bg-violet-500/20 text-violet-900 dark:text-violet-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500",
            )}
          >
            <LayoutGrid className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p
              className={cn(
                "text-xs font-black uppercase tracking-wider text-[10px]",
                selectedAccountId === null
                  ? "text-violet-950 dark:text-slate-200"
                  : "text-slate-400 dark:text-muted-foreground",
              )}
            >
              Tous
            </p>
            <p
              className={cn(
                "text-sm font-black tracking-tight tabular-nums mt-0.5",
                selectedAccountId === null
                  ? totalBalance >= 0
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-rose-700 dark:text-rose-400"
                  : "text-slate-700 dark:text-slate-400",
              )}
            >
              {formatCurrency(totalBalance)}
            </p>
          </div>
        </button>

        {/* BOUTONS PAR COMPTE */}
        {accounts.map((account) => {
          const isSelected = selectedAccountId === account.id;
          const style = ACCOUNT_STYLES[account.color] || ACCOUNT_STYLES.primary;
          const isNegative = account.balance < 0;

          return (
            <button
              key={account.id}
              onClick={() => onSelect(isSelected ? null : account.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-200 text-left cursor-pointer min-w-[145px]",
                isSelected
                  ? style.bgActive
                  : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800/60 dark:bg-background dark:hover:bg-slate-800/60 shadow-sm",
              )}
            >
              <span
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 transition-all border dark:border-transparent",
                  isSelected
                    ? `${style.iconBg} border-black/5`
                    : "bg-slate-100 border-slate-200 dark:bg-slate-800 text-slate-700",
                )}
              >
                {account.icon || "🏦"}
              </span>
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-xs font-black uppercase tracking-wider text-[10px] truncate max-w-[110px]",
                    isSelected
                      ? "text-slate-900 dark:text-slate-200"
                      : "text-slate-400 dark:text-muted-foreground",
                  )}
                >
                  {account.name}
                </p>
                <p
                  className={cn(
                    "text-sm font-black tracking-tight tabular-nums mt-0.5",
                    isNegative
                      ? "text-rose-700 dark:text-rose-400"
                      : isSelected
                        ? style.text
                        : "text-slate-700 dark:text-slate-400",
                  )}
                >
                  {formatCurrency(account.balance)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
