import { useState, useEffect, useMemo } from 'react';
import { transactionsApi } from '@/api/phpClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, ChevronLeft, ChevronRight, X, Filter, ArrowUpDown, BarChart2, ChevronDown, Repeat, ArrowLeftRight } from 'lucide-react';
import TransactionForm from '../components/transactions/TransactionForm';
import TransactionList from '../components/transactions/TransactionList';
import MonthlyReport from '../components/transactions/MonthlyReport';
import ExportCSV from '../components/transactions/ExportCSV';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { CATEGORY_LABELS, ALL_CATEGORIES } from '@/lib/categories';
import { useCustomCategories } from '@/hooks/useCustomCategories';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const PAGE_SIZE = 15;

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const SORT_OPTIONS = [
  { value: 'date-desc',   label: 'Date (récent → ancien)' },
  { value: 'date-asc',    label: 'Date (ancien → récent)' },
  { value: 'amount-desc', label: 'Montant (élevé → bas)' },
  { value: 'amount-asc',  label: 'Montant (bas → élevé)' },
  { value: 'alpha-asc',   label: 'Description (A → Z)' },
  { value: 'alpha-desc',  label: 'Description (Z → A)' },
];

function sortTransactions(txs, sortBy) {
  return [...txs].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':   return new Date(b.date) - new Date(a.date) || b.id - a.id;
      case 'date-asc':    return new Date(a.date) - new Date(b.date) || a.id - a.id;
      case 'amount-desc': return parseFloat(b.amount) - parseFloat(a.amount);
      case 'amount-asc':  return parseFloat(a.amount) - parseFloat(b.amount);
      case 'alpha-asc':   return (a.description || '').localeCompare(b.description || '', 'fr');
      case 'alpha-desc':  return (b.description || '').localeCompare(b.description || '', 'fr');
      default:            return 0;
    }
  });
}

export default function Transactions() {
  const { customCategories } = useCustomCategories();
  const [showForm, setShowForm]     = useState(false);
  const [editingTx, setEditingTx]   = useState(null);
  const [deletingTx, setDeletingTx] = useState(null);
  const [showReport, setShowReport] = useState(false);

  // Filtres de base
  const [search,       setSearch]       = useState('');
  const [typeFilter,   setTypeFilter]   = useState('all');
  const [monthFilter,  setMonthFilter]  = useState('all');
  const [yearFilter,   setYearFilter]   = useState(String(new Date().getFullYear()));
  const [catFilter,    setCatFilter]    = useState('all');

  // Filtres avancés
  const [recurringFilter, setRecurringFilter] = useState('all');
  const [amountMin,   setAmountMin]   = useState('');
  const [amountMax,   setAmountMax]   = useState('');
  const [sortBy,      setSortBy]      = useState('date-desc');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionsApi.list(),
  });

  const availableYears = useMemo(() => {
    const years = [...new Set(transactions.map(tx => new Date(tx.date).getFullYear()))];
    return years.sort((a, b) => b - a);
  }, [transactions]);

  useEffect(() => { setPage(1); }, [
    search, typeFilter, monthFilter, yearFilter, catFilter,
    recurringFilter, amountMin, amountMax, sortBy,
  ]);

  const filtered = useMemo(() => {
    const results = transactions.filter(tx => {
      const d = new Date(tx.date);
      const q = search.toLowerCase();
      const matchSearch   = !search
        || tx.description?.toLowerCase().includes(q)
        || tx.notes?.toLowerCase().includes(q);
      const matchType     = typeFilter  === 'all' || tx.type     === typeFilter;
      const matchYear     = !yearFilter  || d.getFullYear()  === parseInt(yearFilter);
      const matchMonth    = monthFilter === 'all' || d.getMonth() === parseInt(monthFilter);
      const matchCat      = catFilter   === 'all' || tx.category  === catFilter;
      const matchRecurring =
        recurringFilter === 'all'
          ? true
          : recurringFilter === 'recurring'
            ? tx.is_recurring == 1 || tx.is_recurring === true
            : !(tx.is_recurring == 1 || tx.is_recurring === true);
      const amt = parseFloat(tx.amount);
      const matchMin      = amountMin === '' || amt >= parseFloat(amountMin);
      const matchMax      = amountMax === '' || amt <= parseFloat(amountMax);
      return matchSearch && matchType && matchYear && matchMonth && matchCat
        && matchRecurring && matchMin && matchMax;
    });
    return sortTransactions(results, sortBy);
  }, [transactions, search, typeFilter, monthFilter, yearFilter, catFilter,
      recurringFilter, amountMin, amountMax, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeFilters = [
    typeFilter !== 'all',
    monthFilter !== 'all',
    yearFilter !== String(new Date().getFullYear()),
    catFilter !== 'all',
    recurringFilter !== 'all',
    amountMin !== '',
    amountMax !== '',
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearch(''); setTypeFilter('all');
    setMonthFilter('all'); setYearFilter(String(new Date().getFullYear()));
    setCatFilter('all'); setRecurringFilter('all');
    setAmountMin(''); setAmountMax('');
  };

  const createMutation = useMutation({
    mutationFn: (data) => transactionsApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['transactions'] }); setShowForm(false); },
    onError: (err) => toast({ title: 'Erreur', description: err.message, variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => transactionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setShowForm(false); setEditingTx(null);
    },
    onError: (err) => toast({ title: 'Erreur', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => transactionsApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['transactions'] }); setDeletingTx(null); },
    onError: (err) => { toast({ title: 'Erreur', description: err.message, variant: 'destructive' }); setDeletingTx(null); },
  });

  const handleSubmit = (data) => {
    if (editingTx) updateMutation.mutate({ id: editingTx.id, data });
    else createMutation.mutate(data);
  };

  const handleEdit = (tx) => { setEditingTx(tx); setShowForm(true); };

  if (isLoading) {
    return (
      <div className="space-y-6 w-full p-4 md:p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 rounded-2xl" />
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 relative isolation-isolate min-h-screen pb-12">

      {/* Halos Lumineux d'ambiance maximisés */}
      <div className="absolute top-[-5%] left-[-5%] w-[450px] h-[450px] bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/20">
            <ArrowLeftRight className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-white dark:via-indigo-200 dark:to-white bg-clip-text text-transparent">
              Transactions
            </h1>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
              Analyse globale : <span className="text-indigo-500 dark:text-indigo-400 font-bold">{filtered.length}</span> résultat{filtered.length !== 1 ? 's' : ''} indexé{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <ExportCSV transactions={filtered} label={`Exporter (${filtered.length})`} />

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReport(v => !v)}
            className={`rounded-xl font-bold transition-all h-10 text-xs border-slate-200/60 dark:border-slate-800/80 backdrop-blur-md ${
              showReport 
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 shadow-lg shadow-indigo-500/5' 
                : 'bg-white/40 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 hover:bg-slate-50/80 dark:hover:bg-slate-900/80'
            }`}
          >
            <BarChart2 className="w-4 h-4 mr-2 text-indigo-500" />
            Rapport mensuel
          </Button>

          <Button
            onClick={() => { setEditingTx(null); setShowForm(true); }}
            className="h-10 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/20 dark:shadow-indigo-500/10 border border-indigo-400/20 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nouvelle transaction
          </Button>
        </div>
      </div>

      {/* Rapport Mensuel avec encapsulation fluide */}
      {showReport && (
        <div className="relative z-10 p-[1px] rounded-2xl bg-gradient-to-r from-indigo-500/20 via-transparent to-violet-500/20 shadow-xl shadow-indigo-500/[0.02]">
          <div className="bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl rounded-[15px] p-3 border border-white/10">
            <MonthlyReport transactions={transactions} />
          </div>
        </div>
      )}

      {/* Panneau Central de Recherche et Filtres (Glassmorphism Vibré) */}
      <div className="relative z-10 p-5 rounded-2xl border border-indigo-500/15 dark:border-indigo-400/15 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl shadow-2xl shadow-indigo-950/[0.02] space-y-4">

        {/* Barre de recherche Translucide */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <Input
            placeholder="Filtrer par libellé, note, bénéficiaire..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-9 h-10 rounded-xl border-slate-200/60 focus-visible:ring-indigo-500 dark:border-slate-800/60 bg-white/30 dark:bg-slate-950/30 backdrop-blur-sm text-sm"
          />
          {search && (
            <button 
              onClick={() => setSearch('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtres Principaux Cristallins */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="h-9.5 text-xs rounded-xl bg-white/30 dark:bg-slate-950/20 border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm focus:ring-1 focus:ring-indigo-500/50">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
              {availableYears.length === 0
                ? <SelectItem value={String(new Date().getFullYear())}>{new Date().getFullYear()}</SelectItem>
                : availableYears.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))
              }
            </SelectContent>
          </Select>

          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="h-9.5 text-xs rounded-xl bg-white/30 dark:bg-slate-950/20 border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm focus:ring-1 focus:ring-indigo-500/50">
              <SelectValue placeholder="Mois" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
              <SelectItem value="all">Tous les mois</SelectItem>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={String(i)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9.5 text-xs rounded-xl bg-white/30 dark:bg-slate-950/20 border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm focus:ring-1 focus:ring-indigo-500/50">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
              <SelectItem value="all">Tous les flux</SelectItem>
              <SelectItem value="revenu" className="text-emerald-500 font-semibold">📈 Revenus</SelectItem>
              <SelectItem value="depense" className="text-rose-500 font-semibold">📉 Dépenses</SelectItem>
            </SelectContent>
          </Select>

          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="h-9.5 text-xs rounded-xl bg-white/30 dark:bg-slate-950/20 border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm focus:ring-1 focus:ring-indigo-500/50">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent className="rounded-xl max-h-[300px] border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
              <SelectItem value="all">Toutes catégories</SelectItem>
              {ALL_CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
              {customCategories.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-[10px] text-indigo-500 dark:text-indigo-400 uppercase tracking-widest border-t border-slate-500/10 mt-1 pt-2 font-black">
                    Structures perso
                  </div>
                  {customCategories.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label} ✦</SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Filtres Avancés Retravaillés */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced} className="w-full pt-1 border-t border-slate-500/10">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-indigo-500 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors py-1 mt-1">
              <Filter className="w-3.5 h-3.5" />
              Ajustements avancés & Tris
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showAdvanced ? 'rotate-180 text-indigo-500' : ''}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 pt-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="sm:col-span-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-9.5 text-xs rounded-xl bg-white/30 dark:bg-slate-950/20 border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm">
                    <ArrowUpDown className="w-3.5 h-3.5 mr-2 text-slate-400" />
                    <SelectValue placeholder="Trier par..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
                    {SORT_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Select value={recurringFilter} onValueChange={setRecurringFilter}>
                <SelectTrigger className="h-9.5 text-xs rounded-xl bg-white/30 dark:bg-slate-950/20 border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm">
                  <Repeat className="w-3.5 h-3.5 mr-2 text-slate-400" />
                  <SelectValue placeholder="Récurrence" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
                  <SelectItem value="all">Tous les contrats</SelectItem>
                  <SelectItem value="recurring">Abonnements / Récurrents</SelectItem>
                  <SelectItem value="non-recurring">Ponctuels uniques</SelectItem>
                </SelectContent>
              </Select>

              <div className="hidden sm:block" />

              <div>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Seuil min. (€)"
                  value={amountMin}
                  onChange={e => setAmountMin(e.target.value)}
                  className="h-9.5 text-xs rounded-xl border-slate-200/60 dark:border-slate-800/60 bg-white/30 dark:bg-slate-950/20 focus-visible:ring-indigo-500"
                />
              </div>

              <div>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Plafond max. (€)"
                  value={amountMax}
                  onChange={e => setAmountMax(e.target.value)}
                  className="h-9.5 text-xs rounded-xl border-slate-200/60 dark:border-slate-800/60 bg-white/30 dark:bg-slate-950/20 focus-visible:ring-indigo-500"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Tags Filtres Actifs Stylisés Cristal */}
        {activeFilters > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-slate-500/10">
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 dark:text-slate-500">
              <Filter className="w-3 h-3 text-indigo-500" /> {activeFilters} filtre{activeFilters > 1 ? 's' : ''} actif{activeFilters > 1 ? 's' : ''} :
            </span>
            {typeFilter !== 'all' && (
              <Badge variant="secondary" className="text-[10px] font-bold gap-1 cursor-pointer bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-slate-300 rounded-lg px-2 py-0.5 border-0" onClick={() => setTypeFilter('all')}>
                {typeFilter === 'revenu' ? 'Revenus' : 'Dépenses'} <X className="w-2.5 h-2.5" />
              </Badge>
            )}
            {monthFilter !== 'all' && (
              <Badge variant="secondary" className="text-[10px] font-bold gap-1 cursor-pointer bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-slate-300 rounded-lg px-2 py-0.5 border-0" onClick={() => setMonthFilter('all')}>
                {MONTHS[parseInt(monthFilter)]} <X className="w-2.5 h-2.5" />
              </Badge>
            )}
            {yearFilter !== String(new Date().getFullYear()) && (
              <Badge variant="secondary" className="text-[10px] font-bold gap-1 cursor-pointer bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-slate-300 rounded-lg px-2 py-0.5 border-0" onClick={() => setYearFilter(String(new Date().getFullYear()))}>
                {yearFilter} <X className="w-2.5 h-2.5" />
              </Badge>
            )}
            {catFilter !== 'all' && (
              <Badge variant="secondary" className="text-[10px] font-bold gap-1 cursor-pointer bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-slate-300 rounded-lg px-2 py-0.5 border-0" onClick={() => setCatFilter('all')}>
                {CATEGORY_LABELS[catFilter] || catFilter} <X className="w-2.5 h-2.5" />
              </Badge>
            )}
            {recurringFilter !== 'all' && (
              <Badge variant="secondary" className="text-[10px] font-bold gap-1 cursor-pointer bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-slate-300 rounded-lg px-2 py-0.5 border-0" onClick={() => setRecurringFilter('all')}>
                {recurringFilter === 'recurring' ? 'Récurrentes' : 'Non récurrentes'} <X className="w-2.5 h-2.5" />
              </Badge>
            )}
            {amountMin !== '' && (
              <Badge variant="secondary" className="text-[10px] font-bold gap-1 cursor-pointer bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-slate-300 rounded-lg px-2 py-0.5 border-0" onClick={() => setAmountMin('')}>
                ≥ {amountMin}€ <X className="w-2.5 h-2.5" />
              </Badge>
            )}
            {amountMax !== '' && (
              <Badge variant="secondary" className="text-[10px] font-bold gap-1 cursor-pointer bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-slate-300 rounded-lg px-2 py-0.5 border-0" onClick={() => setAmountMax('')}>
                ≤ {amountMax}€ <X className="w-2.5 h-2.5" />
              </Badge>
            )}
            <button onClick={resetFilters} className="text-[10px] font-black text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 transition-colors ml-auto">
              Tout effacer
            </button>
          </div>
        )}
      </div>

      {/* Tableau de Données (Plaque de verre surélevée) */}
      <div className="relative z-10 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl overflow-hidden shadow-2xl shadow-indigo-950/[0.01]">
        <TransactionList transactions={paginated} onEdit={handleEdit} onDelete={setDeletingTx} />
      </div>

      {/* Pagination Glass */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 relative z-10">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            Page {page} sur {totalPages} · {paginated.length} ligne{paginated.length > 1 ? 's' : ''} affichée{paginated.length > 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline" size="icon" className="h-8 w-8 rounded-xl border-slate-200/60 dark:border-slate-800/80 bg-white/40 dark:bg-slate-950/40 backdrop-blur-sm shadow-sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce((acc, p, i, arr) => {
                if (i > 0 && p - arr[i - 1] > 1) acc.push('…');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '…' ? (
                  <span key={`sep-${i}`} className="px-1 text-xs text-slate-400">…</span>
                ) : (
                  <Button
                    key={p}
                    variant={p === page ? 'default' : 'outline'}
                    size="icon"
                    className={`h-8 w-8 text-xs font-bold rounded-xl transition-all shadow-sm ${
                      p === page 
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0' 
                        : 'bg-white/40 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/80 text-slate-700 dark:text-slate-300'
                    }`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                )
              )
            }

            <Button
              variant="outline" size="icon" className="h-8 w-8 rounded-xl border-slate-200/60 dark:border-slate-800/80 bg-white/40 dark:bg-slate-950/40 backdrop-blur-sm shadow-sm"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modale Formulaire (Gérée en interne ou via sous-composant) */}
      {showForm && (
        <TransactionForm
          key={editingTx?.id ?? 'new'}
          open={showForm}
          onClose={() => { setShowForm(false); setEditingTx(null); }}
          onSubmit={handleSubmit}
          editingTx={editingTx}
        />
      )}

      {/* Alerte de Suppression (Style Alerte de Verre Néon) */}
      <AlertDialog open={!!deletingTx} onOpenChange={() => setDeletingTx(null)}>
        <AlertDialogContent className="rounded-2xl border-rose-500/20 bg-white/70 dark:bg-slate-900/80 backdrop-blur-2xl max-w-md shadow-2xl shadow-rose-950/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="text-rose-500">⚠️</span> Supprimer cette opération ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
              Cette action retirera définitivement l'écriture comptable <strong className="text-slate-800 dark:text-slate-200">"{deletingTx?.description}"</strong> de vos rapports. Cette manipulation est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-3">
            <AlertDialogCancel className="h-9.5 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-800 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
              Conserver
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTx && deleteMutation.mutate(deletingTx.id)}
              className="h-9.5 text-xs font-bold rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white border border-rose-500/20 shadow-lg shadow-rose-500/10"
            >
              Confirmer la destruction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}