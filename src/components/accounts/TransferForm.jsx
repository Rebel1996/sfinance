import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { useAppContext } from '@/lib/AppContext';

export default function TransferForm({ open, onClose, onSubmit, accounts, defaultFrom }) {
  const { formatCurrency } = useAppContext();

  const othersFrom = accounts.filter(a => a.id !== defaultFrom?.id);
  const initialTo  = othersFrom[0]?.id ?? null;

  const [form, setForm] = useState({
    from_account_id: defaultFrom?.id ?? accounts[0]?.id ?? null,
    to_account_id:   initialTo,
    amount:          '',
    description:     '',
    date:            format(new Date(), 'yyyy-MM-dd'),
  });

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const fromAccount = accounts.find(a => a.id === form.from_account_id);
  const toAccount   = accounts.find(a => a.id === form.to_account_id);

  const availableTargets = accounts.filter(a => a.id !== form.from_account_id);

  const handleFromChange = (v) => {
    const newFrom = parseInt(v);
    const newAvailable = accounts.filter(a => a.id !== newFrom);
    update('from_account_id', newFrom);
    if (form.to_account_id === newFrom) {
      update('to_account_id', newAvailable[0]?.id ?? null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.from_account_id || !form.to_account_id) return;
    onSubmit({
      from_account_id: form.from_account_id,
      to_account_id:   form.to_account_id,
      amount:          parseFloat(form.amount),
      description:     form.description || 'Virement interne',
      date:            form.date,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Virement entre comptes</DialogTitle>
          <DialogDescription>
            Transférez un montant d'un compte à un autre.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* De → Vers */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">De</Label>
              <Select
                value={form.from_account_id ? String(form.from_account_id) : ''}
                onValueChange={handleFromChange}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.icon} {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fromAccount && (
                <p className="text-[10px] text-muted-foreground">
                  Solde : {formatCurrency(fromAccount.balance)}
                </p>
              )}
            </div>

            <ArrowRight className="w-4 h-4 text-muted-foreground mb-2.5" />

            <div className="space-y-1.5">
              <Label className="text-xs">Vers</Label>
              <Select
                value={form.to_account_id ? String(form.to_account_id) : ''}
                onValueChange={v => update('to_account_id', parseInt(v))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTargets.map(a => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.icon} {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {toAccount && (
                <p className="text-[10px] text-muted-foreground">
                  Solde : {formatCurrency(toAccount.balance)}
                </p>
              )}
            </div>
          </div>

          {/* Montant + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transfer-amount">Montant (€)</Label>
              <Input
                id="transfer-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={e => update('amount', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-date">Date</Label>
              <Input
                id="transfer-date"
                type="date"
                value={form.date}
                onChange={e => update('date', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="transfer-desc">Libellé (optionnel)</Label>
            <Input
              id="transfer-desc"
              placeholder="Virement interne"
              value={form.description}
              onChange={e => update('description', e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!form.from_account_id || !form.to_account_id || !form.amount}
            >
              Transférer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
