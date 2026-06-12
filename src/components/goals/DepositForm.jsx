import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppContext } from '@/lib/AppContext';

export default function DepositForm({ open, onClose, onSubmit, goal }) {
  const { currencyCode, formatCurrency } = useAppContext();
  const [amount, setAmount] = useState('');
  const remaining = goal ? goal.target_amount - goal.current_amount : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    onSubmit(val);
    setAmount('');
  };

  if (!goal) return null;

  const quickAmounts = [
    Math.round(remaining * 0.1),
    Math.round(remaining * 0.25),
    Math.round(remaining * 0.5),
    Math.round(remaining),
  ].filter((v, i, a) => v > 0 && a.indexOf(v) === i);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{goal.icon} Alimenter l'objectif</DialogTitle>
          <DialogDescription>
            <span className="font-semibold">{goal.name}</span> — {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Montant à ajouter ({currencyCode})</Label>
            <Input
              type="number" step="0.01" min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              autoFocus
              required
            />
          </div>

          {quickAmounts.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Raccourcis</p>
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map(v => (
                  <button
                    type="button" key={v}
                    onClick={() => setAmount(String(v))}
                    className="text-xs px-2.5 py-1 rounded-full border hover:bg-secondary transition-colors"
                  >
                    {formatCurrency(v)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="flex-1">💰 Ajouter</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
