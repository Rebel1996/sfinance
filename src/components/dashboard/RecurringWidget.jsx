import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Repeat, TrendingUp, TrendingDown } from 'lucide-react';
import { useAppContext } from '@/lib/AppContext';
import { CATEGORY_LABELS } from '@/lib/categories';

const FREQ_LABEL = {
  quotidien:    'Quotidien',
  hebdomadaire: 'Hebdo',
  mensuel:      'Mensuel',
  trimestriel:  'Trimestriel',
  annuel:       'Annuel',
};

const FREQ_MONTHS = {
  quotidien:    1 / 30,
  hebdomadaire: 1 / 4.33,
  mensuel:      1,
  trimestriel:  3,
  annuel:       12,
};

export default function RecurringWidget({ transactions }) {
  const { formatCurrency } = useAppContext();

  const recurring = useMemo(() => (
    transactions.filter(tx => tx.is_recurring == 1 || tx.is_recurring === true)
  ), [transactions]);

  const { uniqueRecurring, monthlyIncome, monthlyExpense } = useMemo(() => {
    const seen = new Map();
    recurring.forEach(tx => {
      const key = `${tx.description}__${tx.type}__${tx.recurrence}`;
      if (!seen.has(key)) seen.set(key, tx);
    });
    const unique = Array.from(seen.values());

    let inc = 0, exp = 0;
    unique.forEach(tx => {
      const months = FREQ_MONTHS[tx.recurrence] || 1;
      const monthly = parseFloat(tx.amount) / months;
      if (tx.type === 'revenu') inc += monthly;
      else exp += monthly;
    });

    return { uniqueRecurring: unique, monthlyIncome: inc, monthlyExpense: exp };
  }, [recurring]);

  const monthlyNet = monthlyIncome - monthlyExpense;

  if (uniqueRecurring.length === 0) {
    return (
      <Card className="p-5 border-0 shadow-sm h-full flex flex-col items-center justify-center">
        <Repeat className="w-8 h-8 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Aucune transaction récurrente</p>
        <p className="text-xs text-muted-foreground mt-1">Activez l'option dans le formulaire</p>
      </Card>
    );
  }

  return (
    <Card className="p-5 border-0 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <Repeat className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Transactions récurrentes</h3>
        <Badge variant="secondary" className="ml-auto text-[10px]">
          {uniqueRecurring.length}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 shrink-0">
        <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
          <p className="text-[10px] text-muted-foreground mb-0.5">Revenus/mois</p>
          <p className="text-xs font-semibold text-primary truncate">{formatCurrency(monthlyIncome)}</p>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
          <p className="text-[10px] text-muted-foreground mb-0.5">Charges/mois</p>
          <p className="text-xs font-semibold text-destructive truncate">{formatCurrency(monthlyExpense)}</p>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
          <p className="text-[10px] text-muted-foreground mb-0.5">Net/mois</p>
          <p className={`text-xs font-semibold truncate ${monthlyNet >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {formatCurrency(monthlyNet)}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 -mr-1 pr-1">
        {uniqueRecurring
          .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
          .map((tx, i) => (
            <div key={i} className="flex items-center gap-2.5 py-1.5 border-b border-border/30 last:border-0">
              <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                tx.type === 'revenu' ? 'bg-primary/10' : 'bg-destructive/10'
              }`}>
                {tx.type === 'revenu'
                  ? <TrendingUp className="w-3 h-3 text-primary" />
                  : <TrendingDown className="w-3 h-3 text-destructive" />
                }
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{tx.description || '—'}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {CATEGORY_LABELS[tx.category] || tx.category}
                  {tx.recurrence && ` · ${FREQ_LABEL[tx.recurrence] || tx.recurrence}`}
                </p>
              </div>
              <span className={`text-xs font-semibold flex-shrink-0 ${
                tx.type === 'revenu' ? 'text-primary' : 'text-destructive'
              }`}>
                {tx.type === 'revenu' ? '+' : '-'}{formatCurrency(parseFloat(tx.amount))}
              </span>
            </div>
          ))}
      </div>
    </Card>
  );
}
