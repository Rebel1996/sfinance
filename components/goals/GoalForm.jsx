import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAppContext } from '@/lib/AppContext';

const ICONS = ['🎯','🏠','🚗','✈️','💍','🎓','💻','🏖️','🛍️','💰','🏋️','🎸','📱','🐕','🌍'];
const COLORS = [
  { value: 'primary',     label: 'Bleu' },
  { value: 'violet',      label: 'Violet' },
  { value: 'rose',        label: 'Rose' },
  { value: 'amber',       label: 'Ambre' },
  { value: 'emerald',     label: 'Vert' },
  { value: 'destructive', label: 'Rouge' },
];

const COLOR_CLASSES = {
  primary:     'bg-primary',
  violet:      'bg-violet-500',
  rose:        'bg-rose-500',
  amber:       'bg-amber-500',
  emerald:     'bg-emerald-500',
  destructive: 'bg-destructive',
};

export default function GoalForm({ open, onClose, onSubmit, editing }) {
  const { currencyCode } = useAppContext();
  const now = new Date();
  const defaultDeadline = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
    .toISOString().split('T')[0];

  const [form, setForm] = useState(editing ? {
    ...editing,
    deadline: editing.deadline ? editing.deadline.split('T')[0] : '',
  } : {
    name: '',
    description: '',
    target_amount: '',
    current_amount: '',
    deadline: defaultDeadline,
    icon: '🎯',
    color: 'primary',
  });

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      target_amount:  parseFloat(form.target_amount)  || 0,
      current_amount: parseFloat(form.current_amount) || 0,
      deadline: form.deadline || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {form.icon} {editing ? 'Modifier' : 'Nouvel'} objectif
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Modifiez les informations de cet objectif d'épargne."
              : "Définissez un nouvel objectif d'épargne à atteindre."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Icône */}
          <div className="space-y-2">
            <Label>Icône</Label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(ic => (
                <button
                  type="button" key={ic}
                  onClick={() => update('icon', ic)}
                  className={`text-xl p-1.5 rounded-lg border-2 transition-all ${
                    form.icon === ic ? 'border-primary bg-primary/10' : 'border-transparent hover:border-border'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Nom */}
          <div className="space-y-2">
            <Label>Nom de l'objectif *</Label>
            <Input
              placeholder="Ex: Achat voiture, Voyage Japon…"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
            <Textarea
              placeholder="Quelques détails sur cet objectif…"
              value={form.description}
              onChange={e => update('description', e.target.value)}
              rows={2}
            />
          </div>

          {/* Montants */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Montant cible ({currencyCode}) *</Label>
              <Input
                type="number" step="0.01" min="1"
                placeholder="10000"
                value={form.target_amount}
                onChange={e => update('target_amount', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Déjà épargné ({currencyCode})</Label>
              <Input
                type="number" step="0.01" min="0"
                placeholder="0"
                value={form.current_amount}
                onChange={e => update('current_amount', e.target.value)}
              />
            </div>
          </div>

          {/* Date limite */}
          <div className="space-y-2">
            <Label>Date limite <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
            <Input
              type="date"
              value={form.deadline}
              onChange={e => update('deadline', e.target.value)}
            />
          </div>

          {/* Couleur */}
          <div className="space-y-2">
            <Label>Couleur</Label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button
                  type="button" key={c.value}
                  onClick={() => update('color', c.value)}
                  title={c.label}
                  className={`w-7 h-7 rounded-full ${COLOR_CLASSES[c.value]} transition-all ${
                    form.color === c.value ? 'ring-2 ring-offset-2 ring-foreground/40 scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="flex-1">{editing ? 'Enregistrer' : 'Créer'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
