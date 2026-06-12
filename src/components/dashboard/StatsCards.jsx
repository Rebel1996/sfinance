import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, ArrowUpDown } from "lucide-react";
import { motion } from "framer-motion";
import { useAppContext } from "@/lib/AppContext";

export default function StatsCards({
  transactions,
  reportedBalance = 0,
  periodLabel = "",
}) {
  const { formatCurrency } = useAppContext();

  const revenus = transactions
    .filter((t) => t.type === "revenu")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const depenses = transactions
    .filter((t) => t.type === "depense")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  // Net de la période seule (sans report)
  const netPeriode = revenus - depenses;

  // Solde cumulatif = report des mois précédents + net de la période
  const soldeCumulatif = reportedBalance + netPeriode;

  const nbTransactions = transactions.length;

  const cards = [
    {
      label: "Solde cumulatif",
      value: formatCurrency(soldeCumulatif),
      sub:
        reportedBalance !== 0
          ? `${reportedBalance >= 0 ? "+" : ""}${formatCurrency(reportedBalance)} reporté ✓`
          : "Aucun report disponible",
      icon: Wallet,
      // Texte ultra-prononcé en light mode (emerald-700 / rose-700)
      color:
        soldeCumulatif >= 0
          ? "text-emerald-700 dark:text-emerald-400"
          : "text-rose-700 dark:text-rose-400",
      iconColor:
        soldeCumulatif >= 0
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-rose-600 dark:text-rose-400",
      bgIcon:
        soldeCumulatif >= 0
          ? "bg-emerald-200/60 dark:bg-emerald-500/20"
          : "bg-rose-200/60 dark:bg-rose-500/20",
      // Arrière-plan amplifié en light mode (from-emerald-100/70) et inchangé en dark mode
      cardBg:
        soldeCumulatif >= 0
          ? "bg-gradient-to-br from-emerald-100/70 via-emerald-50/30 to-background dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 border-emerald-200/80 dark:border-emerald-900/40"
          : "bg-gradient-to-br from-rose-100/70 via-rose-50/30 to-background dark:from-rose-950/20 dark:via-slate-900 dark:to-slate-900 border-rose-200/80 dark:border-rose-900/40",
    },
    {
      label: `Revenus${periodLabel ? ` — ${periodLabel}` : ""}`,
      value: formatCurrency(revenus),
      sub: "Total encaissé",
      icon: TrendingUp,
      // Violet assumé
      color: "text-violet-700 dark:text-violet-400",
      iconColor: "text-violet-600 dark:text-primary",
      bgIcon: "bg-violet-200/60 dark:bg-primary/20",
      cardBg:
        "bg-gradient-to-br from-violet-100/70 via-violet-50/30 to-background dark:from-violet-950/20 dark:via-slate-900 dark:to-slate-900 border-violet-200/80 dark:border-violet-900/40",
    },
    {
      label: `Dépenses${periodLabel ? ` — ${periodLabel}` : ""}`,
      value: formatCurrency(depenses),
      sub: "Total décaissé",
      icon: TrendingDown,
      // Ambre / Orange vif
      color: "text-amber-700 dark:text-amber-400",
      iconColor: "text-amber-600 dark:text-amber-500",
      bgIcon: "bg-amber-200/60 dark:bg-amber-500/20",
      cardBg:
        "bg-gradient-to-br from-amber-100/70 via-amber-50/30 to-background dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 border-amber-200/80 dark:border-amber-900/40",
    },
    {
      label: "Transactions",
      value: nbTransactions,
      sub:
        netPeriode !== 0
          ? `Flux net : ${netPeriode >= 0 ? "+" : ""}${formatCurrency(netPeriode)}`
          : "Aucun mouvement",
      icon: ArrowUpDown,
      // Bleu dynamique
      color: "text-blue-700 dark:text-blue-400",
      iconColor: "text-blue-600 dark:text-blue-500",
      bgIcon: "bg-blue-200/60 dark:bg-blue-500/20",
      cardBg:
        "bg-gradient-to-br from-blue-100/70 via-blue-50/30 to-background dark:from-blue-950/20 dark:via-slate-900 dark:to-slate-900 border-blue-200/80 dark:border-blue-900/40",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, ease: "easeOut" }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="h-full"
        >
          <Card
            className={`p-6 transition-all duration-300 hover:shadow-md border shadow-sm h-full flex flex-col justify-between ${card.cardBg}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1 min-w-0">
                <p className="text-[11px] font-bold text-slate-500 dark:text-muted-foreground/80 uppercase tracking-widest truncate">
                  {card.label}
                </p>
                <p
                  className={`text-2xl font-black tracking-tight ${card.color}`}
                >
                  {card.value}
                </p>
              </div>

              <div className={`p-2.5 rounded-xl shrink-0 ${card.bgIcon}`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
            </div>

            {/* Zone de sous-titre */}
            {card.sub && (
              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-muted-foreground truncate flex items-center gap-1.5">
                  {card.sub}
                </p>
              </div>
            )}
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
