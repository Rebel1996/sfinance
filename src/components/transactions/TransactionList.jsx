import { useQuery } from '@tanstack/react-query';
import { accountsApi } from '@/api/phpClient';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowUpRight, ArrowDownRight, Pencil, Trash2, Repeat, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/lib/AppContext";
import { CATEGORY_LABELS } from "@/lib/categories";

const RECURRENCE_LABELS = {
  quotidien:    "Quotidien",
  hebdomadaire: "Hebdo.",
  mensuel:      "Mensuel",
  annuel:       "Annuel",
};

export default function TransactionList({ transactions, onEdit, onDelete }) {
  const { formatCurrency } = useAppContext();

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.list(),
  });

  const accountMap = Object.fromEntries(accounts.map(a => [String(a.id), a]));

  if (transactions.length === 0) {
    return (
      <Card className="p-12 border-0 shadow-sm text-center">
        <p className="text-muted-foreground">Aucune transaction trouvée</p>
        <p className="text-xs text-muted-foreground mt-1">
          Ajustez les filtres ou ajoutez une nouvelle transaction
        </p>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <div className="divide-y">
        <AnimatePresence initial={false}>
          {transactions.map((tx, i) => {
            const account = tx.account_id ? accountMap[String(tx.account_id)] : null;
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className="flex items-center gap-3 px-5 py-4 hover:bg-muted/50 transition-colors group"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    tx.type === "revenu" ? "bg-primary/10" : "bg-destructive/10"
                  }`}
                >
                  {tx.type === "revenu" ? (
                    <ArrowUpRight className="w-4 h-4 text-primary" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-destructive" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description}</p>
                    {tx.is_recurring == 1 || tx.is_recurring === true ? (
                      <Repeat className="w-3 h-3 text-muted-foreground shrink-0" />
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {CATEGORY_LABELS[tx.category] || tx.category}
                    </Badge>
                    {(tx.is_recurring == 1 || tx.is_recurring === true) && tx.recurrence && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                        <Repeat className="w-2.5 h-2.5" />
                        {RECURRENCE_LABELS[tx.recurrence] || tx.recurrence}
                      </Badge>
                    )}
                    {account && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5 text-muted-foreground">
                        <Wallet className="w-2.5 h-2.5" />
                        {account.icon || '🏦'} {account.name}
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {tx.date ? format(new Date(tx.date), "d MMM yyyy", { locale: fr }) : ""}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-sm font-semibold tabular-nums shrink-0 ${
                    tx.type === "revenu" ? "text-primary" : "text-destructive"
                  }`}
                >
                  {tx.type === "revenu" ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </span>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(tx)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                    onClick={() => onDelete(tx)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Card>
  );
}
