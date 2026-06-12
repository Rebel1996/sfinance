import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext } from '@/lib/AppContext';
import { CATEGORIES_DEPENSE } from '@/lib/categories';

// Catégories de budget = "global" + toutes les catégories de dépenses
const BUDGET_CATEGORIES = [
  { value: 'global', label: '🌐 Global (toutes dépenses)' },
  { value: 'logement',       label: '🏠 Logement' },
  { value: 'courses',        label: '🛒 Courses' },
  { value: 'alimentation',   label: '🍽️ Alimentation' },
  { value: 'restaurant_bar', label: '🍻 Restaurant & Bar' },
  { value: 'transport',      label: '🚗 Transport' },
  { value: 'loisirs',        label: '🎉 Loisirs' },
  { value: 'sante',          label: '❤️ Santé' },
  { value: 'education',      label: '📚 Éducation' },
  { value: 'services',       label: '💡 Services' },
  { value: 'impots',         label: '📋 Impôts' },
  { value: 'epargne',        label: '💰 Épargne' },
  { value: 'dettes',         label: '🏦 Dettes' },
  { value: 'autre',          label: '📦 Autre' },
];

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export default function BudgetForm({ open, onClose, onSubmit, editing }) {
  const { currencyCode } = useAppContext();
  const now = new Date();
  const [form, setForm] = useState(editing || {
    name: '',
    category: '',
    amount: '',
    period: 'mensuel',
    month: now.getMonth(),
    year: now.getFullYear(),
  });

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, amount: parseFloat(form.amount) });
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Modifier' : 'Nouveau'} budget</DialogTitle>
          <DialogDescription>
            {editing
              ? "Modifiez les paramètres de ce budget."
              : "Créez un nouveau budget pour suivre vos dépenses par catégorie."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={form.period} onValueChange={v => update('period', v)}>
            <TabsList className="w-full">
              <TabsTrigger value="mensuel" className="flex-1">Mensuel</TabsTrigger>
              <TabsTrigger value="annuel"  className="flex-1">Annuel</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <Label>Nom du budget</Label>
            <Input
              placeholder="Ex: Alimentation de Mai"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select value={form.category} onValueChange={v => update('category', v)} required>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie..." />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Montant budgété ({currencyCode})</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={form.amount}
              onChange={e => update('amount', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {form.period === 'mensuel' && (
              <div className="space-y-2">
                <Label>Mois</Label>
                <Select value={String(form.month)} onValueChange={v => update('month', Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Année</Label>
              <Select value={String(form.year)} onValueChange={v => update('year', Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1">
              {editing ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
