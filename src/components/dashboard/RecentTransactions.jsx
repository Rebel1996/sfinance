import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppContext } from "@/lib/AppContext";
import { CATEGORY_LABELS } from "@/lib/categories";

export default function RecentTransactions({ transactions }) {
  const { formatCurrency } = useAppContext();
  const recent = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  return (
    <Card className="p-6 border-0 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h3 className="text-sm font-semibold">Dernières transactions</h3>
          <p className="text-xs text-muted-foreground">Les 8 plus récentes</p>
        </div>
        <Link to="/transactions" className="text-xs font-medium text-primary hover:underline">
          Voir tout →
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 -mr-1 pr-1">
        {recent.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucune transaction
          </p>
        )}
        {recent.map((tx) => (
          <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              tx.type === "revenu" ? "bg-primary/10" : "bg-destructive/10"
            }`}>
              {tx.type === "revenu"
                ? <ArrowUpRight className="w-4 h-4 text-primary" />
                : <ArrowDownRight className="w-4 h-4 text-destructive" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{tx.description}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {CATEGORY_LABELS[tx.category] || tx.category}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {tx.date ? format(new Date(tx.date), "d MMM yyyy", { locale: fr }) : ""}
                </span>
              </div>
            </div>
            <span className={`text-sm font-semibold tabular-nums shrink-0 ${
              tx.type === "revenu" ? "text-primary" : "text-destructive"
            }`}>
              {tx.type === "revenu" ? "+" : "-"}{formatCurrency(tx.amount)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
