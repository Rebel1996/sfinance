import { useQuery } from '@tanstack/react-query';
import { goalsApi } from '@/api/phpClient';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Target, ChevronRight } from 'lucide-react';
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

export default function GoalsWidget() {
  const { formatCurrency } = useAppContext();
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalsApi.list(),
  });

  const active = goals
    .filter(g => g.status === 'en_cours' && g.current_amount < g.target_amount)
    .slice(0, 3);

  if (isLoading || active.length === 0) return null;

  return (
    <Card className="p-4 border-0 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Objectifs</h3>
        </div>
        <Link to="/goals" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors">
          Voir tout <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-3">
        {active.map((g, i) => {
          const pct = g.target_amount > 0
            ? Math.min((g.current_amount / g.target_amount) * 100, 100)
            : 0;
          const barColor = COLOR_BAR[g.color] || 'bg-primary';
          return (
            <motion.div key={g.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base">{g.icon}</span>
                  <span className="text-xs font-medium truncate">{g.name}</span>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{pct.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${barColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.07 + 0.1 }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                <span>{formatCurrency(g.current_amount)}</span>
                <span>{formatCurrency(g.target_amount)}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
