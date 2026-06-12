import { useState } from 'react';
import { transactionsApi, budgetsApi } from '@/api/phpClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import BudgetCard from '../components/budget/BudgetCard';
import BudgetForm from '../components/budget/BudgetForm';
import BudgetSummary from '../components/budget/BudgetSummary';
import { useToast } from '@/components/ui/use-toast';

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function Budgets() {
  const now = new Date();
  const [periodView, setPeriodView] = useState('mensuel');
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { toast } = useToast();

  const queryClient = useQueryClient();

  const { data: budgets = [], isLoading: loadingBudgets } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => budgetsApi.list(),
  });

  const { data: transactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionsApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => budgetsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setShowForm(false);
    },
    onError: (err) => {
      toast({ title: 'Erreur', description: err.message || 'Impossible de créer le budget.', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => budgetsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setShowForm(false);
      setEditing(null);
    },
    onError: (err) => {
      toast({ title: 'Erreur', description: err.message || 'Impossible de modifier le budget.', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => budgetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setDeleting(null);
    },
    onError: (err) => {
      toast({ title: 'Erreur', description: err.message || 'Impossible de supprimer le budget.', variant: 'destructive' });
      setDeleting(null);
    },
  });

  const handleSubmit = (data) => {
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  const computeSpent = (budget) => {
    let txs = transactions.filter(t => t.type === 'depense');

    if (budget.period === 'mensuel') {
      txs = txs.filter(t => {
        if (!t.date) return false;
        const d = new Date(t.date);
        return d.getFullYear() === budget.year && d.getMonth() === budget.month;
      });
    } else {
      txs = txs.filter(t => {
        if (!t.date) return false;
        return new Date(t.date).getFullYear() === budget.year;
      });
    }

    if (budget.category !== 'global') {
      txs = txs.filter(t => t.category === budget.category);
    }

    return txs.reduce((s, t) => s + parseFloat(t.amount), 0);
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const filteredBudgets = budgets.filter(b => {
    if (b.period !== periodView) return false;
    if (b.year !== year) return false;
    if (periodView === 'mensuel' && b.month !== month) return false;
    return true;
  });

  const spentMap = {};
  filteredBudgets.forEach(b => { spentMap[b.id] = computeSpent(b); });

  const isLoading = loadingBudgets || loadingTx;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budgets</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {periodView === 'mensuel' ? `${MONTHS_FR[month]} ${year}` : `Année ${year}`}
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau budget
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={periodView} onValueChange={setPeriodView}>
          <TabsList className="bg-secondary">
            <TabsTrigger value="mensuel" className="text-xs">Mensuel</TabsTrigger>
            <TabsTrigger value="annuel" className="text-xs">Annuel</TabsTrigger>
          </TabsList>
        </Tabs>

        {periodView === 'mensuel' && (
          <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
            <SelectTrigger className="w-36 h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS_FR.map((m, i) => (
                <SelectItem key={i} value={String(i)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
          <SelectTrigger className="w-24 h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!isLoading && filteredBudgets.length > 0 && (
        <BudgetSummary budgets={filteredBudgets} spentMap={spentMap} />
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : filteredBudgets.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Aucun budget pour cette période</p>
          <p className="text-xs text-muted-foreground mt-1">Créez votre premier budget ci-dessus</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBudgets.map((b, i) => (
            <BudgetCard
              key={b.id}
              budget={b}
              spent={spentMap[b.id] || 0}
              index={i}
              onEdit={(budget) => { setEditing(budget); setShowForm(true); }}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}

      {showForm && (
        <BudgetForm
          key={editing?.id ?? 'new'}
          open={showForm}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSubmit={handleSubmit}
          editing={editing}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce budget ?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleting?.name}" sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
              className="bg-destructive text-destructive-foreground"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
