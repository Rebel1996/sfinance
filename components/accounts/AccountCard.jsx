import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, ArrowLeftRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/lib/AppContext';
import { cn } from '@/lib/utils';

const TYPE_LABELS = {
  courant:       'Courant',
  epargne:       'Épargne',
  livret:        'Livret',
  especes:       'Espèces',
  investissement:'Investissement',
  autre:         'Autre',
};

// Injection des bordures néon et halos translucides
const COLOR_BORDER = {
  primary: 'border-indigo-500/30 dark:border-indigo-400/30 shadow-indigo-500/5',
  violet:  'border-violet-500/30 dark:border-violet-400/30 shadow-violet-500/5',
  emerald: 'border-emerald-500/30 dark:border-emerald-400/30 shadow-emerald-500/5',
  amber:   'border-amber-500/30 dark:border-amber-400/30 shadow-amber-500/5',
  rose:    'border-rose-500/30 dark:border-rose-400/30 shadow-rose-500/5',
};

// Badges d'icônes stylisés style cristaux
const COLOR_BG = {
  primary: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 dark:border-indigo-400/20',
  violet:  'bg-violet-500/10 text-violet-500 border-violet-500/20 dark:border-violet-400/20',
  emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:border-emerald-400/20',
  amber:   'bg-amber-500/10 text-amber-500 border-amber-500/20 dark:border-amber-400/20',
  rose:    'bg-rose-500/10 text-rose-500 border-rose-500/20 dark:border-rose-400/20',
};

const COLOR_TEXT = {
  primary: 'text-indigo-600 dark:text-indigo-400',
  violet:  'text-violet-600 dark:text-violet-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  amber:   'text-amber-600 dark:text-amber-400',
  rose:    'text-rose-600 dark:text-rose-400',
};

export default function AccountCard({ account, index, onEdit, onDelete, onTransfer }) {
  const { formatCurrency } = useAppContext();
  const isNegative = account.balance < 0;

  const borderGlow = COLOR_BORDER[account.color] || COLOR_BORDER.primary;
  const iconBg     = COLOR_BG[account.color]     || COLOR_BG.primary;
  const textColor  = COLOR_TEXT[account.color]    || COLOR_TEXT.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -2 }}
    >
      <Card className={cn(
        "p-5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border shadow-xl rounded-2xl transition-all duration-300 hover:shadow-2xl",
        borderGlow
      )}>
        {/* En-tête de la carte */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-xl border backdrop-blur-sm', iconBg)}>
              {account.icon}
            </div>
            <div>
              <p className="font-bold text-sm tracking-tight text-slate-800 dark:text-slate-100 leading-tight">
                {account.name}
              </p>
              <Badge variant="secondary" className="text-[10px] font-semibold mt-1 bg-slate-500/10 dark:bg-slate-400/10 text-slate-600 dark:text-slate-300 border-0">
                {TYPE_LABELS[account.type] || account.type}
              </Badge>
            </div>
          </div>

          {/* Actions rapides contextuelles */}
          <div className="flex items-center gap-1 bg-slate-500/5 p-0.5 rounded-lg border border-white/5">
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 rounded-md text-slate-400 hover:text-indigo-500 hover:bg-white/60 dark:hover:bg-slate-900/60 transition-colors"
              onClick={() => onEdit(account)}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 rounded-md text-slate-400 hover:text-rose-500 hover:bg-white/60 dark:hover:bg-slate-900/60 transition-colors"
              onClick={() => onDelete(account)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Section Solde et Indicateurs */}
        <div className="space-y-1 mb-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Solde disponible</p>
          <p className={cn(
            'text-2xl font-black tracking-tight tabular-nums',
            isNegative ? 'text-rose-500 dark:text-rose-400' : textColor
          )}>
            {formatCurrency(account.balance)}
          </p>
          {account.initial_balance !== 0 && (
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 pt-0.5">
              Origine : <span className="font-mono">{formatCurrency(account.initial_balance)}</span>
            </p>
          )}
        </div>

        {/* Pied de Carte et Virement Direct */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-500/10">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            {account.tx_count} transaction{account.tx_count !== 1 ? 's' : ''}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7.5 text-xs font-bold gap-1.5 rounded-lg border-slate-200/60 dark:border-slate-800/80 bg-white/20 dark:bg-slate-950/20 backdrop-blur-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50/80 dark:hover:bg-slate-900/80 transition-all shadow-sm"
            onClick={() => onTransfer(account)}
          >
            <ArrowLeftRight className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
            Transférer
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}