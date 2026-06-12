import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { useAppContext } from "@/lib/AppContext";
import { CATEGORIES_REVENU, CATEGORIES_DEPENSE } from "@/lib/categories";
import { useCustomCategories } from "@/hooks/useCustomCategories";
import { goalsApi, accountsApi } from "@/api/phpClient";
import { Repeat, Target, Wallet, Plus, Loader2 } from "lucide-react";

const RECURRENCE_OPTIONS = [
  { value: "quotidien",    label: "Quotidien" },
  { value: "hebdomadaire", label: "Hebdomadaire" },
  { value: "mensuel",      label: "Mensuel" },
  { value: "annuel",       label: "Annuel" },
];

export default function TransactionForm({ open, onClose, onSubmit, editingTx }) {
  const { currencyCode } = useAppContext();
  const { customRevenu, customDepense, createCategory, isCreating } = useCustomCategories();

  const { data: goals = [] } = useQuery({
    queryKey: ["goals"],
    queryFn: () => goalsApi.list(),
    enabled: open,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => accountsApi.list(),
    enabled: open,
  });

  const activeGoals = goals.filter(
    g => g.status === "en_cours" && g.current_amount < g.target_amount
  );

  const [form, setForm] = useState(
    editingTx
      ? {
          ...editingTx,
          is_recurring: !!editingTx.is_recurring,
          goal_id:    editingTx.goal_id    ?? null,
          account_id: editingTx.account_id ?? null,
        }
      : {
          description:  "",
          amount:       "",
          type:         "depense",
          category:     "",
          date:         format(new Date(), "yyyy-MM-dd"),
          notes:        "",
          is_recurring: false,
          recurrence:   "mensuel",
          goal_id:      null,
          account_id:   null,
        }
  );

  // Pré-sélectionner le premier compte pour une nouvelle transaction
  useEffect(() => {
    if (open && accounts.length > 0 && !form.account_id && !editingTx) {
      setForm(prev => ({ ...prev, account_id: accounts[0].id }));
    }
  }, [open, accounts]);

  const [newCatLabel, setNewCatLabel] = useState("");
  const [showAddCat, setShowAddCat]   = useState(false);
  const [catError, setCatError]       = useState("");

  const baseCategories = form.type === "revenu" ? CATEGORIES_REVENU : CATEGORIES_DEPENSE;
  const userCats       = form.type === "revenu" ? customRevenu       : customDepense;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      amount:       parseFloat(form.amount),
      is_recurring: form.is_recurring ? 1 : 0,
      recurrence:   form.is_recurring ? form.recurrence : null,
      goal_id:      form.goal_id    || null,
      account_id:   form.account_id || null,
    });
  };

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleTypeChange = (value) => {
    setForm(prev => ({ ...prev, type: value, category: "" }));
    setShowAddCat(false);
    setNewCatLabel("");
    setCatError("");
  };

  const handleAddCategory = async () => {
    const label = newCatLabel.trim();
    if (!label) return;
    setCatError("");
    try {
      const entry = await createCategory({ label, type: form.type === "revenu" ? "revenu" : "depense" });
      update("category", entry.value);
      setNewCatLabel("");
      setShowAddCat(false);
    } catch (err) {
      setCatError(err.message || "Erreur lors de la création");
    }
  };

  const selectedGoal = form.goal_id
    ? activeGoals.find(g => g.id === form.goal_id) ?? goals.find(g => g.id === form.goal_id)
    : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border-slate-200 dark:border-slate-800 p-6">
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800/60">
          <DialogTitle className="text-xl font-black tracking-tight text-slate-800 dark:text-slate-100">
            {editingTx ? "Modifier la" : "Nouvelle"} transaction
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-slate-400 dark:text-slate-500">
            {editingTx
              ? "Ajustez les détails de votre flux financier ci-dessous."
              : "Remplissez les informations pour ajouter une nouvelle opération à vos suivis."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Onglets Type de flux */}
          <Tabs value={form.type} onValueChange={handleTypeChange} className="w-full">
            <TabsList className="w-full grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl h-10">
              <TabsTrigger 
                value="depense" 
                className="rounded-lg text-xs font-bold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-rose-600 data-[state=active]:shadow-sm"
              >
                Dépense
              </TabsTrigger>
              <TabsTrigger 
                value="revenu"  
                className="rounded-lg text-xs font-bold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm"
              >
                Revenu
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-bold text-slate-600 dark:text-slate-300">Description</Label>
            <Input
              id="description"
              placeholder="Ex: Courses ou Salaire..."
              value={form.description}
              onChange={e => update("description", e.target.value)}
              className="rounded-xl border-slate-200 dark:border-slate-800 h-9.5 text-sm focus-visible:ring-indigo-500"
              required
            />
          </div>

          {/* Montant et Date côte à côte */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-xs font-bold text-slate-600 dark:text-slate-300">Montant ({currencyCode})</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.amount}
                onChange={e => update("amount", e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 h-9.5 text-sm focus-visible:ring-indigo-500 font-medium"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date" className="text-xs font-bold text-slate-600 dark:text-slate-300">Date</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={e => update("date", e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 h-9.5 text-sm focus-visible:ring-indigo-500 font-medium"
                required
              />
            </div>
          </div>

          {/* Catégorie */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Catégorie</Label>
              <button
                type="button"
                onClick={() => { setShowAddCat(v => !v); setCatError(""); }}
                className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-0.5 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Créer une catégorie
              </button>
            </div>

            {showAddCat && (
              <div className="space-y-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 animate-in fade-in-50 duration-150">
                <div className="flex gap-1.5">
                  <Input
                    placeholder="Nom de l'étiquette..."
                    value={newCatLabel}
                    onChange={e => { setNewCatLabel(e.target.value); setCatError(""); }}
                    className="h-8 text-xs rounded-lg border-slate-200 dark:border-slate-800"
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); } }}
                    autoFocus
                    disabled={isCreating}
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 px-2.5 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                    onClick={handleAddCategory}
                    disabled={isCreating || !newCatLabel.trim()}
                  >
                    {isCreating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Créer"}
                  </Button>
                </div>
                {catError && <p className="text-[10px] font-bold text-rose-500 pl-1">{catError}</p>}
              </div>
            )}

            <Select
              value={form.category}
              onValueChange={v => update("category", v)}
              required
            >
              <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 h-9.5 text-sm">
                <SelectValue placeholder="Choisir une catégorie..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-[220px]">
                {baseCategories.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
                {userCats.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider border-t mt-1.5 pt-1.5">
                      Mes catégories
                    </div>
                    {userCats.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label} ✦</SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Sélection du Compte */}
          {accounts.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-slate-400" />
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Compte bancaire</Label>
              </div>
              <Select
                value={form.account_id ? String(form.account_id) : ""}
                onValueChange={v => update("account_id", v ? parseInt(v) : null)}
              >
                <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 h-9.5 text-sm">
                  <SelectValue placeholder="Aucun compte sélectionné" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      <span className="mr-1.5">{a.icon}</span> {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Bloc Objectif d'épargne lié */}
          {activeGoals.length > 0 && (
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 p-3.5 space-y-3 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500">
                    <Target className="w-4 h-4" />
                  </div>
                  <Label className="cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                    Lier à un objectif d'épargne
                  </Label>
                </div>
                <Switch
                  checked={form.goal_id !== null}
                  onCheckedChange={v => update("goal_id", v ? activeGoals[0].id : null)}
                  className="data-[state=active]:bg-indigo-600"
                />
              </div>

              {form.goal_id !== null && (
                <div className="space-y-2.5 pt-1 border-t border-slate-100 dark:border-slate-800/40 animate-in slide-in-from-top-1 duration-200">
                  <Select
                    value={form.goal_id ? String(form.goal_id) : ""}
                    onValueChange={v => update("goal_id", v ? parseInt(v) : null)}
                  >
                    <SelectTrigger className="h-8 text-xs rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <SelectValue placeholder="Choisir un objectif..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {activeGoals.map(g => {
                        const pct = g.target_amount > 0
                          ? Math.round((g.current_amount / g.target_amount) * 100)
                          : 0;
                        return (
                          <SelectItem key={g.id} value={String(g.id)}>
                            <span className="mr-1">{g.icon}</span> {g.name} — {pct}%
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  {selectedGoal && (
                    <div className="space-y-1.5 px-0.5">
                      <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              (selectedGoal.current_amount / selectedGoal.target_amount) * 100,
                              100
                            )}%`
                          }}
                        />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-muted-foreground text-right">
                        {selectedGoal.current_amount} {currencyCode} / {selectedGoal.target_amount} {currencyCode}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bloc Transaction récurrente */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 p-3.5 space-y-3 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-500">
                  <Repeat className="w-4 h-4" />
                </div>
                <Label htmlFor="recurring" className="cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  Répéter cette transaction
                </Label>
              </div>
              <Switch
                id="recurring"
                checked={form.is_recurring}
                onCheckedChange={v => update("is_recurring", v)}
                className="data-[state=active]:bg-violet-600"
              />
            </div>

            {form.is_recurring && (
              <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/40 animate-in slide-in-from-top-1 duration-200">
                <Label className="text-[11px] font-bold text-slate-400 dark:text-slate-500">Périodicité des prélèvements</Label>
                <Select
                  value={form.recurrence}
                  onValueChange={v => update("recurrence", v)}
                >
                  <SelectTrigger className="h-8 text-xs rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {RECURRENCE_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Notes additionnelles */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-bold text-slate-600 dark:text-slate-300">Notes <span className="text-slate-400 font-normal">(optionnel)</span></Label>
            <Textarea
              id="notes"
              placeholder="Précisions ou commentaires supplémentaires..."
              value={form.notes}
              onChange={e => update("notes", e.target.value)}
              className="rounded-xl border-slate-200 dark:border-slate-800 h-18 text-sm focus-visible:ring-indigo-500 resize-none p-2.5"
            />
          </div>

          {/* Boutons d'action bas de formulaire */}
          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 h-9.5 text-xs font-bold rounded-xl border-slate-200" 
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="flex-1 h-9.5 text-xs font-bold rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-sm"
            >
              {editingTx ? "Confirmer la modification" : "Enregistrer l'opération"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}