import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, BarChart2 } from "lucide-react";
import { useAppContext } from "@/lib/AppContext";
import { CATEGORY_LABELS } from "@/lib/categories";

const MONTHS_FR = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];

function pct(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

function TrendBadge({ current, previous, inverse = false }) {
  const delta = pct(current, previous);
  const isUp = delta > 0;
  const isGood = inverse ? !isUp : isUp;
  if (delta === 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
      <Minus className="w-3 h-3" /> stable
    </span>
  );
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isGood ? "text-primary" : "text-destructive"}`}>
      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isUp ? "+" : ""}{delta}%
    </span>
  );
}

export default function MonthlyReport({ transactions }) {
  const { formatCurrency } = useAppContext();
  const now = new Date();
  const curMonth = now.getMonth();
  const curYear  = now.getFullYear();
  const prevMonth = curMonth === 0 ? 11 : curMonth - 1;
  const prevYear  = curMonth === 0 ? curYear - 1 : curYear;

  const { cur, prev } = useMemo(() => {
    const cur  = transactions.filter(tx => {
      if (!tx.date) return false;
      const d = new Date(tx.date);
      return d.getFullYear() === curYear && d.getMonth() === curMonth;
    });
    const prev = transactions.filter(tx => {
      if (!tx.date) return false;
      const d = new Date(tx.date);
      return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
    });
    return { cur, prev };
  }, [transactions, curMonth, curYear, prevMonth, prevYear]);

  const stats = (txs) => {
    const revenus  = txs.filter(t => t.type === "revenu").reduce((s, t) => s + parseFloat(t.amount), 0);
    const depenses = txs.filter(t => t.type === "depense").reduce((s, t) => s + parseFloat(t.amount), 0);
    return { revenus, depenses, solde: revenus - depenses };
  };

  const curStats  = stats(cur);
  const prevStats = stats(prev);

  // Top 5 catégories de dépenses du mois courant
  const topCats = useMemo(() => {
    const map = {};
    cur.filter(t => t.type === "depense").forEach(t => {
      map[t.category] = (map[t.category] || 0) + parseFloat(t.amount);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [cur]);

  const maxCat = topCats[0]?.[1] || 1;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-muted-foreground" />
          <CardTitle className="text-base font-semibold">
            Rapport — {MONTHS_FR[curMonth]} {curYear}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">
          Comparé à {MONTHS_FR[prevMonth]} {prevYear}
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Stats comparées */}
        <div className="grid grid-cols-3 gap-3">
          {/* Revenus */}
          <div className="rounded-xl bg-primary/5 p-3 space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowUpRight className="w-3 h-3 text-primary" />
              Revenus
            </div>
            <p className="text-sm font-bold text-primary">{formatCurrency(curStats.revenus)}</p>
            <TrendBadge current={curStats.revenus} previous={prevStats.revenus} inverse={false} />
          </div>

          {/* Dépenses */}
          <div className="rounded-xl bg-destructive/5 p-3 space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowDownRight className="w-3 h-3 text-destructive" />
              Dépenses
            </div>
            <p className="text-sm font-bold text-destructive">{formatCurrency(curStats.depenses)}</p>
            <TrendBadge current={curStats.depenses} previous={prevStats.depenses} inverse={true} />
          </div>

          {/* Solde */}
          <div className="rounded-xl bg-muted/50 p-3 space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              Solde net
            </div>
            <p className={`text-sm font-bold ${curStats.solde >= 0 ? "text-primary" : "text-destructive"}`}>
              {curStats.solde >= 0 ? "+" : ""}{formatCurrency(curStats.solde)}
            </p>
            <TrendBadge current={curStats.solde} previous={prevStats.solde} inverse={false} />
          </div>
        </div>

        {/* Comparaison mois précédent */}
        <div className="text-xs text-muted-foreground border rounded-lg p-3 space-y-1.5">
          <p className="font-medium text-foreground text-[11px] uppercase tracking-wide mb-2">
            Mois précédent ({MONTHS_FR[prevMonth]})
          </p>
          <div className="flex justify-between">
            <span>Revenus</span>
            <span className="font-medium text-foreground">{formatCurrency(prevStats.revenus)}</span>
          </div>
          <div className="flex justify-between">
            <span>Dépenses</span>
            <span className="font-medium text-foreground">{formatCurrency(prevStats.depenses)}</span>
          </div>
          <div className="flex justify-between border-t pt-1.5 mt-1.5">
            <span>Solde</span>
            <span className={`font-semibold ${prevStats.solde >= 0 ? "text-primary" : "text-destructive"}`}>
              {prevStats.solde >= 0 ? "+" : ""}{formatCurrency(prevStats.solde)}
            </span>
          </div>
        </div>

        {/* Top catégories */}
        {topCats.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Top dépenses ce mois
            </p>
            {topCats.map(([cat, amount]) => (
              <div key={cat} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate">{CATEGORY_LABELS[cat] || cat}</span>
                  <span className="font-medium tabular-nums shrink-0 ml-2">{formatCurrency(amount)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-destructive/60 transition-all"
                    style={{ width: `${(amount / maxCat) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {cur.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Aucune transaction ce mois-ci.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
