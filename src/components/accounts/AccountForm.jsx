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
import { cn } from '@/lib/utils';

const ACCOUNT_TYPES = [
  { value: 'courant',       label: 'Compte courant',  icon: '💳' },
  { value: 'epargne',       label: 'Épargne',         icon: '🏦' },
  { value: 'livret',        label: 'Livret',          icon: '📖' },
  { value: 'especes',       label: 'Espèces',         icon: '💵' },
  { value: 'investissement',label: 'Investissement',  icon: '📈' },
  { value: 'autre',         label: 'Autre',           icon: '🔖' },
];

const ICONS = ['🏦', '💳', '💰', '📖', '📈', '💵', '🏧', '💎', '🪙', '🏠'];

const COLORS = [
  { value: 'primary',  label: 'Bleu',    cls: 'bg-primary' },
  { value: 'violet',   label: 'Violet',  cls: 'bg-violet-500' },
  { value: 'emerald',  label: 'Vert',    cls: 'bg-emerald-500' },
  { value: 'amber',    label: 'Ambre',   cls: 'bg-amber-500' },
  { value: 'rose',     label: 'Rose',    cls: 'bg-rose-500' },
];

export default function AccountForm({ open, onClose, onSubmit, editing }) {
  const [form, setForm] = useState(
    editing
      ? { ...editing }
      : {
          name: '',
          type: 'courant',
          icon: '🏦',
          color: 'primary',
          initial_balance: '',
        }
  );

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      initial_balance: parseFloat(form.initial_balance) || 0,
    });
  };

  const selectedType = ACCOUNT_TYPES.find(t => t.value === form.type);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Modifier le compte' : 'Nouveau compte'}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? 'Modifiez les informations de ce compte.'
              : 'Créez un nouveau compte ou enveloppe budgétaire.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom du compte</Label>
            <Input
              id="name"
              placeholder="Ex: Compte courant BNP"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              required
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Type de compte</Label>
            <Select value={form.type} onValueChange={v => update('type', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.icon} {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Icône */}
          <div className="space-y-2">
            <Label>Icône</Label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => update('icon', icon)}
                  className={cn(
                    'w-9 h-9 rounded-lg text-lg flex items-center justify-center border-2 transition-all',
                    form.icon === icon
                      ? 'border-primary bg-primary/10 scale-110'
                      : 'border-transparent bg-muted hover:bg-muted/80'
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Couleur */}
          <div className="space-y-2">
            <Label>Couleur</Label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => update('color', c.value)}
                  title={c.label}
                  className={cn(
                    'w-7 h-7 rounded-full border-2 transition-all',
                    c.cls,
                    form.color === c.value
                      ? 'border-foreground scale-110'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Solde initial */}
          <div className="space-y-2">
            <Label htmlFor="initial_balance">Solde initial (€)</Label>
            <Input
              id="initial_balance"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.initial_balance}
              onChange={e => update('initial_balance', e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Montant présent sur ce compte avant de commencer à enregistrer vos transactions.
              Peut être négatif (ex: découvert autorisé).
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1">
              {editing ? 'Modifier' : 'Créer le compte'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
