import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '@/api/phpClient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Wallet, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useAppContext } from '@/lib/AppContext';
import AccountCard from '@/components/accounts/AccountCard';
import AccountForm from '@/components/accounts/AccountForm';
import TransferForm from '@/components/accounts/TransferForm';

export default function Accounts() {
  const { toast } = useToast();
  const { formatCurrency } = useAppContext();
  const queryClient = useQueryClient();

  const [showForm, setShowForm]       = useState(false);
  const [editing, setEditing]         = useState(null);
  const [deleting, setDeleting]       = useState(null);
  const [transferFrom, setTransferFrom] = useState(null);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.list(),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  const createMutation = useMutation({
    mutationFn: (data) => accountsApi.create(data),
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      toast({ title: '🚀 Compte propulsé !', description: 'Votre nouveau portefeuille est prêt.' });
    },
    onError: (err) => toast({ title: 'Erreur', description: err.message, variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => accountsApi.update(id, data),
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      setEditing(null);
      toast({ title: 'Compte mis à jour ✨' });
    },
    onError: (err) => toast({ title: 'Erreur', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => accountsApi.delete(id),
    onSuccess: () => {
      invalidate();
      setDeleting(null);
      toast({ title: 'Compte supprimé' });
    },
    onError: (err) => {
      toast({ title: 'Suppression impossible', description: err.message, variant: 'destructive' });
      setDeleting(null);
    },
  });

  const transferMutation = useMutation({
    mutationFn: (data) => accountsApi.transfer(data),
    onSuccess: (_, vars) => {
      invalidate();
      setTransferFrom(null);
      toast({
        title: '⚡ Virement instantané',
        description: `${formatCurrency(vars.amount)} transféré avec succès.`,
      });
    },
    onError: (err) => toast({ title: 'Erreur', description: err.message, variant: 'destructive' }),
  });

  const handleSubmit = (data) => {
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  const totalBalance   = accounts.reduce((s, a) => s + a.balance, 0);
  const positiveTotal  = accounts.filter(a => a.balance >= 0).reduce((s, a) => s + a.balance, 0);
  const negativeTotal  = accounts.filter(a => a.balance < 0).reduce((s, a) => s + a.balance, 0);

  return (
    <div className="relative space-y-6 pb-12 min-h-screen isolation-isolate">

      {/* Halos lumineux d'ambiance (Blobs arrière-plan) */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-white dark:via-indigo-200 dark:to-white bg-clip-text text-transparent">
            Mes portefeuilles
          </h1>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-400 mt-1">
            Pilotez vos liquidités et enveloppes budgétaires en temps réel
          </p>
        </div>
        <div className="flex items-center gap-3.5">
          {accounts.length >= 2 && (
            <Button 
              variant="outline" 
              onClick={() => setTransferFrom(accounts[0])}
              className="h-10 text-xs font-bold rounded-xl border-slate-200/60 dark:border-slate-800/80 bg-white/40 dark:bg-slate-950/40 backdrop-blur-md text-slate-700 dark:text-slate-300 hover:bg-slate-50/80 dark:hover:bg-slate-900/80 transition-all"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 mr-2 text-indigo-500" />
              Virement interne
            </Button>
          )}
          <Button 
            onClick={() => { setEditing(null); setShowForm(true); }} 
            className="h-10 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/20 dark:shadow-indigo-500/10 border border-indigo-400/20 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nouveau compte
          </Button>
        </div>
      </div>

      {/* Cartes de Synthèse Glassmorphic & Glow */}
      {!isLoading && accounts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: 'Patrimoine Net',
              value: formatCurrency(totalBalance),
              sub:   `${accounts.length} compte(s) connecté(s)`,
              icon:  Wallet,
              glow:  totalBalance >= 0 ? 'border-indigo-500/30 dark:border-indigo-400/30 shadow-indigo-500/5' : 'border-rose-500/30 dark:border-rose-400/30 shadow-rose-500/5',
              iconColor: totalBalance >= 0 ? 'text-indigo-500' : 'text-rose-500',
              badgeBg: totalBalance >= 0 ? 'bg-indigo-500/10' : 'bg-rose-500/10',
            },
            {
              label: 'Actifs Créditeurs',
              value: formatCurrency(positiveTotal),
              sub:   'Disponibilités totales',
              icon:  TrendingUp,
              glow:  'border-emerald-500/30 dark:border-emerald-400/30 shadow-emerald-500/5',
              iconColor: 'text-emerald-500',
              badgeBg: 'bg-emerald-500/10',
            },
            {
              label: 'Dettes & Débits',
              value: formatCurrency(Math.abs(negativeTotal)),
              sub:   'Engagements ou découverts',
              icon:  TrendingDown,
              glow:  negativeTotal < 0 ? 'border-rose-500/30 dark:border-rose-400/30 shadow-rose-500/5' : 'border-slate-200/50 dark:border-slate-800/50 shadow-sm',
              iconColor: negativeTotal < 0 ? 'text-rose-500' : 'text-slate-400',
              badgeBg: negativeTotal < 0 ? 'bg-rose-500/10' : 'bg-slate-500/10',
            },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className={`p-4 bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl border ${s.glow} shadow-xl rounded-2xl transition-all hover:scale-[1.01]`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${s.badgeBg} ${s.iconColor} shrink-0 flex items-center justify-center border border-white/10`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{s.label}</p>
                    <p className="text-xl font-black tracking-tight mt-0.5 truncate text-slate-800 dark:text-slate-100">{s.value}</p>
                    <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">{s.sub}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Grille principale */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl bg-slate-200/50 dark:bg-slate-800/40 backdrop-blur-sm" />)}
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-indigo-500/20 dark:border-indigo-400/20 rounded-2xl bg-white/30 dark:bg-slate-900/20 backdrop-blur-md space-y-4 max-w-md mx-auto shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-500 flex items-center justify-center text-2xl mx-auto border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
            🏦
          </div>
          <div className="space-y-1 px-6">
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">Aucun actif répertorié</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed max-w-xs mx-auto">
              Injectez votre premier compte bancaire ou espace de stockage pour activer le tracking et générer vos flux.
            </p>
          </div>
          <Button 
            onClick={() => setShowForm(true)} 
            className="h-9 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Initialiser un compte
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map((account, i) => (
            <AccountCard
              key={account.id}
              account={account}
              index={i}
              onEdit={(a) => { setEditing(a); setShowForm(true); }}
              onDelete={setDeleting}
              onTransfer={setTransferFrom}
            />
          ))}
        </div>
      )}

      {/* Modal : Formulaire (Doit lui aussi hériter du style Glass si possible en interne) */}
      {showForm && (
        <AccountForm
          key={editing?.id ?? 'new'}
          open={showForm}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSubmit={handleSubmit}
          editing={editing}
        />
      )}

      {/* Modal : Transfert */}
      {transferFrom && accounts.length >= 2 && (
        <TransferForm
          open={!!transferFrom}
          onClose={() => setTransferFrom(null)}
          onSubmit={(data) => transferMutation.mutate(data)}
          accounts={accounts}
          defaultFrom={transferFrom}
        />
      )}

      {/* Alerte de Suppression Style Glass */}
      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent className="rounded-2xl border-rose-500/20 bg-white/70 dark:bg-slate-900/80 backdrop-blur-2xl max-w-md shadow-2xl shadow-rose-950/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="text-rose-500">⚠️</span> Rompre la liaison du compte ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
              Le compte <strong className="text-slate-800 dark:text-slate-200">"{deleting?.name}"</strong> sera retiré du système.
              {deleting?.tx_count > 0 ? (
                <span className="block mt-3 p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-medium">
                  Verrouillage d'intégrité : Ce compte héberge actuellement {deleting.tx_count} transaction(s). Sa suppression est impossible sans avoir préalablement nettoyé ou migré ces écritures.
                </span>
              ) : (
                <span className="block mt-2 font-semibold text-rose-500 dark:text-rose-400">
                  Cette action détruira définitivement l'historique associé.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-3">
            <AlertDialogCancel className="h-9.5 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-800 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
              Avorter
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
              disabled={deleting?.tx_count > 0}
              className="h-9.5 text-xs font-bold rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white disabled:opacity-30 border border-rose-500/20"
            >
              Confirmer l'effacement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}