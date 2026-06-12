import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalsApi } from '@/api/phpClient';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Plus, Target, Trophy, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useAppContext } from '@/lib/AppContext';
import GoalCard from '@/components/goals/GoalCard';
import GoalForm from '@/components/goals/GoalForm';
import DepositForm from '@/components/goals/DepositForm';

export default function Goals() {
  const { toast } = useToast();
  const { formatCurrency } = useAppContext();
  const queryClient = useQueryClient();

  const [filter, setFilter]         = useState('en_cours');
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState(null);
  const [deleting, setDeleting]     = useState(null);
  const [depositing, setDepositing] = useState(null);

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalsApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => goalsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setShowForm(false);
      toast({ title: '🎯 Objectif créé !', description: 'Bonne chance pour atteindre votre objectif.' });
    },
    onError: (err) => toast({ title: 'Erreur', description: err.message, variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => goalsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setShowForm(false);
      setEditing(null);
      toast({ title: 'Objectif mis à jour' });
    },
    onError: (err) => toast({ title: 'Erreur', description: err.message, variant: 'destructive' }),
  });

  const depositMutation = useMutation({
    mutationFn: ({ id, amount }) => goalsApi.addAmount(id, amount),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setDepositing(null);
      const done = updated.current_amount >= updated.target_amount;
      toast({
        title: done ? '🏆 Objectif atteint !' : '💰 Versement enregistré',
        description: done
          ? `Félicitations ! Vous avez atteint "${updated.name}" !`
          : `${formatCurrency(updated.current_amount)} / ${formatCurrency(updated.target_amount)}`,
        duration: done ? 8000 : 5000,
      });
    },
    onError: (err) => toast({ title: 'Erreur', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => goalsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setDeleting(null);
    },
    onError: (err) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
      setDeleting(null);
    },
  });

  const handleSubmit = (data) => {
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  // Statistiques globales
  const totalTarget  = goals.reduce((s, g) => s + g.target_amount, 0);
  const totalSaved   = goals.reduce((s, g) => s + g.current_amount, 0);
  const achieved     = goals.filter(g => g.status === 'atteint' || g.current_amount >= g.target_amount).length;

  const filtered = goals.filter(g => {
    if (filter === 'en_cours')   return g.status === 'en_cours' && g.current_amount < g.target_amount;
    if (filter === 'atteint')    return g.status === 'atteint'  || g.current_amount >= g.target_amount;
    if (filter === 'abandonne')  return g.status === 'abandonne';
    return true;
  });

  const tabs = [
    { value: 'en_cours',  label: 'En cours',   count: goals.filter(g => g.status === 'en_cours' && g.current_amount < g.target_amount).length },
    { value: 'atteint',   label: 'Atteints',   count: goals.filter(g => g.status === 'atteint'  || g.current_amount >= g.target_amount).length },
    { value: 'abandonne', label: 'Abandonnés', count: goals.filter(g => g.status === 'abandonne').length },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Objectifs d'épargne</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Suivez vos projets et votre progression
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" />
          Nouvel objectif
        </Button>
      </div>

      {/* Statistiques globales */}
      {!isLoading && goals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total épargné', value: formatCurrency(totalSaved), sub: `sur ${formatCurrency(totalTarget)}`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Progression globale', value: `${totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(0) : 0}%`, sub: `${goals.length} objectif${goals.length > 1 ? 's' : ''}`, icon: Target, color: 'text-accent', bg: 'bg-accent/10' },
            { label: 'Atteints', value: achieved, sub: `sur ${goals.length} objectif${goals.length > 1 ? 's' : ''}`, icon: Trophy, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card className="p-4 border-0 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${s.bg} shrink-0`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.sub}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filtres */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="bg-secondary">
          {tabs.map(t => (
            <TabsTrigger key={t.value} value={t.value} className="text-xs gap-1.5">
              {t.label}
              {t.count > 0 && (
                <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                  {t.count}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Liste */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <div className="text-5xl">🎯</div>
          <p className="text-muted-foreground font-medium">
            {filter === 'en_cours'  ? 'Aucun objectif en cours' :
             filter === 'atteint'   ? 'Aucun objectif atteint pour l\'instant' :
             'Aucun objectif abandonné'}
          </p>
          {filter === 'en_cours' && (
            <p className="text-xs text-muted-foreground">
              Créez votre premier objectif d'épargne ci-dessus !
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g, i) => (
            <GoalCard
              key={g.id}
              goal={g}
              index={i}
              onEdit={(goal) => { setEditing(goal); setShowForm(true); }}
              onDelete={setDeleting}
              onDeposit={setDepositing}
            />
          ))}
        </div>
      )}

      {/* Formulaire création / édition */}
      {showForm && (
        <GoalForm
          key={editing?.id ?? 'new'}
          open={showForm}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSubmit={handleSubmit}
          editing={editing}
        />
      )}

      {/* Formulaire versement */}
      {depositing && (
        <DepositForm
          open={!!depositing}
          onClose={() => setDepositing(null)}
          onSubmit={(amount) => depositMutation.mutate({ id: depositing.id, amount })}
          goal={depositing}
        />
      )}

      {/* Confirmation suppression */}
      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet objectif ?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleting?.name}" sera définitivement supprimé avec toute sa progression.
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
