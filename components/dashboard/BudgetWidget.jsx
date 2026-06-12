import { Card } from "@/components/ui/card";
import { AlertTriangle, XCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAppContext } from "@/lib/AppContext";
import { CATEGORY_LABELS } from "@/lib/categories";
import { CheckSquareIcon } from "@/components/icons/CheckSquareIcon";

export default function BudgetWidget({ budgets, spentMap }) {
  const { formatCurrency } = useAppContext();
  const critical = budgets
    .map((b) => ({
      ...b,
      pct: b.amount > 0 ? ((spentMap[b.id] || 0) / b.amount) * 100 : 0,
      spent: spentMap[b.id] || 0,
    }))
    .filter((b) => b.pct >= 80)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4);

  return (
    <Card className="p-5 border-0 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h3 className="text-sm font-semibold">Budgets critiques</h3>
          <p className="text-xs text-muted-foreground">≥ 80% utilisé</p>
        </div>
        <Link
          to="/budgets"
          className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
        >
          Gérer <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex-1">
        {critical.length === 0 ? (
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 py-4">
            <CheckSquareIcon />
            <span>Tous les budgets sont sous contrôle</span>
          </p>
        ) : (
          <div className="space-y-4">
            {critical.map((b, i) => {
              const over = b.spent > b.amount;
              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {over ? (
                        <XCircle className="w-3.5 h-3.5 text-destructive" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                      )}
                      <span className="text-xs font-medium truncate max-w-[120px]">
                        {b.name}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold shrink-0 ${over ? "text-destructive" : "text-yellow-600"}`}
                    >
                      {b.pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${over ? "bg-destructive" : "bg-yellow-500"}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(b.pct, 100)}%` }}
                      transition={{ duration: 0.6, delay: i * 0.07 + 0.2 }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatCurrency(b.spent)} / {formatCurrency(b.amount)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
