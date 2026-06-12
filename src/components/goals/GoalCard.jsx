import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, PlusCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/lib/AppContext';

const COLOR_BAR = {
  primary:     'bg-primary',
  violet:      'bg-violet-500',
  rose:        'bg-rose-500',
  amber:       'bg-amber-500',
  emerald:     'bg-emerald-500',
  destructive: 'bg-destructive',
};

const COLOR_BG = {
  primary:     'bg-primary/10',
  violet:      'bg-violet-500/10',
  rose:        'bg-rose-500/10',
  amber:       'bg-amber-500/10',
  emerald:     'bg-emerald-500/10',
  destructive: 'bg-destructive/10',
};

function daysLeft(deadline) {
  if (!deadline) return null;
  const d = Math.ceil((new Date(deadline) - new Date()) / 86400000);
  return d;
}

function formatDate(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function GoalCard({ goal, index, onEdit, onDelete, onDeposit }) {
  const { formatCurrency } = useAppContext();
  const pct  = goal.target_amount > 0
    ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
    : 0;
  const days = daysLeft(goal.deadline);
  const done = goal.status === 'atteint' || pct >= 100;
  const abandoned = goal.status === 'abandonne';

  const barColor = abandoned ? 'bg-muted-foreground/30' : (COLOR_BAR[goal.color] || 'bg-primary');
  const bgColor  = COLOR_BG[goal.color] || 'bg-primary/10';

  const StatusBadge = () => {
    if (done) return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-0 text-[10px]"><CheckCircle className="w-3 h-3 mr-1" />Atteint !</Badge>;
    if (abandoned) return <Badge variant="secondary" className="text-[10px]"><XCircle className="w-3 h-3 mr-1" />Abandonné</Badge>;
    if (days !== null && days <= 30) return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-0 text-[10px]"><Clock className="w-3 h-3 mr-1" />{days <= 0 ? 'Échu' : `${days}j restants`}</Badge>;
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Card className={`p-5 border-0 shadow-sm hover:shadow-md transition-shadow group ${abandoned ? 'opacity-60' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className={`text-2xl w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center shrink-0`}>
              {goal.icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{goal.name}</p>
              {goal.description && (
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{goal.description}</p>
              )}
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
            {!done && !abandoned && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={() => onDeposit(goal)} title="Alimenter">
                <PlusCircle className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(goal)}>
              <Pencil className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(goal)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-2.5">
          <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${barColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.06 + 0.15 }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1.5">
            <span>{formatCurrency(goal.current_amount)} épargné</span>
            <span className="font-medium">{pct.toFixed(0)}%</span>
            <span>Objectif : {formatCurrency(goal.target_amount)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <StatusBadge />
          {goal.deadline && !done && (
            <p className="text-[10px] text-muted-foreground ml-auto">
              Échéance : {formatDate(goal.deadline)}
            </p>
          )}
          {!done && !abandoned && goal.target_amount > goal.current_amount && (
            <p className="text-[10px] text-muted-foreground ml-auto">
              Reste {formatCurrency(goal.target_amount - goal.current_amount)}
            </p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
