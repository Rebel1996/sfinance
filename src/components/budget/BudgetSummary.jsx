import { Card } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, XCircle, PiggyBank } from 'lucide-react';
import { useAppContext } from '@/lib/AppContext';

export default function BudgetSummary({ budgets, spentMap }) {
  const { formatCurrency } = useAppContext();
  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + (spentMap[b.id] || 0), 0);

  const ok = budgets.filter(b => {
    const pct = b.amount > 0 ? (spentMap[b.id] || 0) / b.amount * 100 : 0;
    return pct < 80;
  }).length;
  const warning = budgets.filter(b => {
    const pct = b.amount > 0 ? (spentMap[b.id] || 0) / b.amount * 100 : 0;
    return pct >= 80 && (spentMap[b.id] || 0) <= b.amount;
  }).length;
  const exceeded = budgets.filter(b => (spentMap[b.id] || 0) > b.amount).length;

  const cards = [
    { label: 'Budget total', value: formatCurrency(totalBudget), icon: PiggyBank, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Dépensé', value: formatCurrency(totalSpent), icon: XCircle, color: 'text-muted-foreground', bg: 'bg-muted' },
    { label: 'Dans les limites', value: ok, icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Dépassés', value: exceeded, icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(c => (
        <Card key={c.label} className="p-4 border-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${c.bg}`}>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{c.label}</p>
              <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}