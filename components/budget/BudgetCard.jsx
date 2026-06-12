import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/lib/AppContext';
import { CATEGORY_LABELS } from '@/lib/categories';

const CATEGORY_EMOJI = {
  global:        '🌐',
  logement:      '🏠',
  loyer:         '🏠',
  courses:       '🛒',
  alimentation:  '🍽️',
  restaurant_bar:'🍻',
  transport:     '🚗',
  loisirs:       '🎉',
  sante:         '❤️',
  education:     '📚',
  services:      '💡',
  impots:        '📋',
  epargne:       '💰',
  dettes:        '🏦',
  autre:         '📦',
};

function categoryLabel(cat) {
  const emoji = CATEGORY_EMOJI[cat] || '📦';
  const label = CATEGORY_LABELS[cat] || cat;
  return `${emoji} ${label}`;
}

export default function BudgetCard({ budget, spent, index, onEdit, onDelete }) {
  const { formatCurrency } = useAppContext();
  const pct       = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;
  const over      = spent > budget.amount;
  const warning   = !over && pct >= 80;
  const remaining = budget.amount - spent;

  const statusColor = over ? 'text-destructive' : warning ? 'text-yellow-600' : 'text-primary';
  const barColor    = over ? 'bg-destructive'   : warning ? 'bg-yellow-500'   : 'bg-primary';
  const StatusIcon  = over ? XCircle : warning ? AlertTriangle : CheckCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{budget.name}</p>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mt-1">
              {categoryLabel(budget.category)}
            </Badge>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(budget)}>
              <Pencil className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(budget)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="mb-3">
          <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${barColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: index * 0.05 + 0.2 }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
            <span>{formatCurrency(spent)} dépensé</span>
            <span>{pct.toFixed(0)}%</span>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 text-xs font-medium ${statusColor}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {over ? (
            <span>Dépassé de {formatCurrency(Math.abs(remaining))}</span>
          ) : (
            <span>{formatCurrency(remaining)} restant sur {formatCurrency(budget.amount)}</span>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
