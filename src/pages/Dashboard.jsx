import { useState } from "react";
import { transactionsApi, budgetsApi } from "@/api/phpClient";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import StatsCards from "../components/dashboard/StatsCards";
import MonthlyChart from "../components/dashboard/MonthlyChart";
import BalanceChart from "../components/dashboard/BalanceChart";
import CategoryChart from "../components/dashboard/CategoryChart";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import PeriodSelector from "../components/dashboard/PeriodSelector";
import BudgetWidget from "../components/dashboard/BudgetWidget";
import GoalsWidget from "../components/dashboard/GoalsWidget";
import RecurringWidget from "../components/dashboard/RecurringWidget";
import AccountsWidget from "../components/dashboard/AccountsWidget";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeftRight,
  PiggyBank,
  Wallet,
  Target,
  Sparkles,
  LayoutDashboard,
} from "lucide-react";

const MONTHS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export default function Dashboard() {
  const now = new Date();
  const [view, setView] = useState("month");
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [chartView, setChartView] = useState("cashflow");

  const { data: rawTransactions = [], isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => transactionsApi.list(),
  });

  const { data: allBudgets = [] } = useQuery({
    queryKey: ["budgets"],
    queryFn: () => budgetsApi.list(),
  });

  const accountTransactions = selectedAccountId
    ? rawTransactions.filter((t) => t.account_id === selectedAccountId)
    : rawTransactions;

  const filtered = accountTransactions.filter((tx) => {
    if (!tx.date) return false;
    const d = new Date(tx.date);
    if (view === "year") return d.getFullYear() === year;
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const reportedBalance = accountTransactions
    .filter((tx) => {
      if (!tx.date) return false;
      const d = new Date(tx.date);
      if (view === "year") return d.getFullYear() < year;
      return (
        d.getFullYear() < year ||
        (d.getFullYear() === year && d.getMonth() < month)
      );
    })
    .reduce((sum, t) => {
      const amount = parseFloat(t.amount);
      return sum + (t.type === "revenu" ? amount : -amount);
    }, 0);

  const periodBudgets = allBudgets.filter((b) => {
    if (b.year !== year) return false;
    if (view === "month") return b.period === "mensuel" && b.month === month;
    return b.period === "annuel";
  });

  const computeSpent = (budget) => {
    let txs = accountTransactions.filter((t) => t.type === "depense");
    if (budget.period === "mensuel") {
      txs = txs.filter(
        (t) =>
          t.date &&
          new Date(t.date).getFullYear() === budget.year &&
          new Date(t.date).getMonth() === budget.month,
      );
    } else {
      txs = txs.filter(
        (t) => t.date && new Date(t.date).getFullYear() === budget.year,
      );
    }
    if (budget.category !== "global")
      txs = txs.filter((t) => t.category === budget.category);
    return txs.reduce((s, t) => s + parseFloat(t.amount), 0);
  };

  const spentMap = {};
  periodBudgets.forEach((b) => {
    spentMap[b.id] = computeSpent(b);
  });

  if (isLoading) {
    return (
      <div className="space-y-6 w-full p-4 md:p-8">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[450px] rounded-xl" />
          <Skeleton className="h-[450px] rounded-xl" />
        </div>
      </div>
    );
  }

  const periodLabel = view === "month" ? MONTHS_FR[month] : String(year);

  return (
    <div className="w-full space-y-6 relative isolation-blur">
      {/* ─── HALOS LUMINEUX D'ARRIÈRE-PLAN (AMBIENT GLOW) ─── */}
      <div className="absolute top-[-10%] left-[5%] w-[450px] h-[450px] bg-gradient-to-br from-violet-400/20 to-indigo-400/20 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse duration-[6s]" />
      <div className="absolute top-[30%] right-[-5%] w-[400px] h-[400px] bg-gradient-to-br from-emerald-400/15 to-teal-400/15 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-rose-400/10 to-amber-400/15 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* ─── HEADER CONTRASTÉ ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-200/50 dark:shadow-none">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">
              Tableau de bord
            </h1>
            <p className="text-sm font-semibold text-slate-500 dark:text-muted-foreground mt-0.5">
              Suivi financier pour{" "}
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">
                {view === "month"
                  ? `${MONTHS_FR[month]} ${year}`
                  : `l'année ${year}`}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 shadow-sm">
          <PeriodSelector
            view={view}
            setView={setView}
            month={month}
            setMonth={setMonth}
            year={year}
            setYear={setYear}
          />
        </div>
      </div>

      {/* ─── SÉLECTEUR DE COMPTES ─── */}
      <div className="w-full relative z-10">
        <AccountsWidget
          selectedAccountId={selectedAccountId}
          onSelect={setSelectedAccountId}
        />
      </div>

      {/* ─── ONBOARDING COLORÉ ─── */}
      {rawTransactions.length === 0 && (
        <Card className="p-8 border-2 border-violet-300 dark:border-slate-800 bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-xl shadow-indigo-200/40 rounded-2xl relative z-10">
          <div className="text-center space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mx-auto border border-white/30 backdrop-blur-md">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black">Bienvenue sur FinTrack</h2>
              <p className="text-sm font-medium text-indigo-100 mt-1">
                Configurez votre espace pour générer vos premières analyses
                graphiques.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <Button
                asChild
                size="sm"
                variant="secondary"
                className="justify-start rounded-xl font-bold bg-white text-indigo-950 hover:bg-indigo-50"
              >
                <Link to="/transactions">
                  <ArrowLeftRight className="w-4 h-4 mr-2 text-violet-600" />{" "}
                  Transactions
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="secondary"
                className="justify-start rounded-xl font-bold bg-white text-indigo-950 hover:bg-indigo-50"
              >
                <Link to="/accounts">
                  <Wallet className="w-4 h-4 mr-2 text-emerald-600" /> Créer un
                  compte
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="secondary"
                className="justify-start rounded-xl font-bold bg-white text-indigo-950 hover:bg-indigo-50"
              >
                <Link to="/budgets">
                  <PiggyBank className="w-4 h-4 mr-2 text-amber-600" /> Définir
                  un budget
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="secondary"
                className="justify-start rounded-xl font-bold bg-white text-indigo-950 hover:bg-indigo-50"
              >
                <Link to="/goals">
                  <Target className="w-4 h-4 mr-2 text-rose-600" /> Fixer un
                  objectif
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ─── CARTES KPIS DE HAUT DE PAGE ─── */}
      <div className="relative z-10">
        <StatsCards
          transactions={filtered}
          reportedBalance={reportedBalance}
          periodLabel={periodLabel}
        />
      </div>

      {/* ─── DISPOSITION PRINCIPALE BENTO GRID ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start relative z-10">
        {/* COLONNE GAUCHE : CŒUR DE L'ANALYSE (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* ANALYSE GRAPHIQUE - Glassmorphism Indigo */}
          <Card className="shadow-lg shadow-indigo-100/40 dark:shadow-none border border-indigo-200/80 dark:border-slate-800/80 bg-white/75 dark:bg-slate-900/75 backdrop-blur-lg rounded-2xl overflow-hidden">
            <Tabs
              value={chartView}
              onValueChange={setChartView}
              className="w-full"
            >
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 pb-4 border-b border-indigo-100/60 dark:border-slate-800/80">
                <div>
                  <CardTitle className="text-base font-black tracking-tight text-slate-800 dark:text-slate-100">
                    Analyse globale
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold text-slate-500 dark:text-slate-500">
                    Visualisation de vos flux et soldes de trésorerie
                  </CardDescription>
                </div>
                <TabsList className="grid grid-cols-2 h-10 w-full sm:w-[280px] p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200/50">
                  <TabsTrigger
                    value="cashflow"
                    className="text-xs font-bold rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                  >
                    Flux de trésorerie
                  </TabsTrigger>
                  <TabsTrigger
                    value="balance"
                    className="text-xs font-bold rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                  >
                    Évolution solde
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent className="pt-6">
                <TabsContent
                  value="cashflow"
                  className="mt-0 focus-visible:outline-none w-full block"
                >
                  {chartView === "cashflow" && (
                    <div className="w-full h-[350px]">
                      <MonthlyChart
                        transactions={accountTransactions}
                        year={year}
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent
                  value="balance"
                  className="mt-0 focus-visible:outline-none w-full block"
                >
                  {chartView === "balance" && (
                    <div className="w-full h-[350px]">
                      <BalanceChart
                        transactions={accountTransactions}
                        year={year}
                      />
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          {/* RÉPARTITION PAR CATÉGORIES - Glassmorphism Purple */}
          <Card className="shadow-lg shadow-purple-100/40 dark:shadow-none border border-purple-200/80 dark:border-slate-800/80 bg-white/75 dark:bg-slate-900/75 backdrop-blur-lg rounded-2xl">
            <CardHeader className="pb-4 border-b border-purple-100/60 dark:border-slate-800/80">
              <CardTitle className="text-base font-black tracking-tight text-slate-800 dark:text-slate-100">
                Structure des postes
              </CardTitle>
              <CardDescription className="text-xs font-semibold text-slate-500 dark:text-slate-500">
                Répartition de vos revenus et d'épargne sur l'année
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 dark:bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-200">
                      Dépenses
                    </span>
                  </div>
                  <CategoryChart transactions={filtered} type="depense" />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200">
                      Revenus
                    </span>
                  </div>
                  <CategoryChart transactions={filtered} type="revenu" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TRANSACTIONS RÉCENTES - Slate Chaud */}
          <Card className="shadow-lg shadow-slate-100/50 dark:shadow-none border border-slate-200 dark:border-slate-800/80 bg-white/75 dark:bg-slate-900/75 backdrop-blur-lg rounded-2xl">
            <CardHeader className="pb-4 border-b border-slate-200/60 dark:border-slate-800/80">
              <CardTitle className="text-base font-black tracking-tight text-slate-800 dark:text-slate-100">
                Dernières opérations
              </CardTitle>
              <CardDescription className="text-xs font-semibold text-slate-500 dark:text-slate-500">
                Liste des mouvements récents appliqués à vos filtres
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <RecentTransactions transactions={filtered} />
            </CardContent>
          </Card>
        </div>

        {/* COLONNE DROITE : CONTROLES ET ETATS SECONDAIRES (1/3) */}
        <div className="space-y-6">
          {/* BUDGETS CONTROLE - Éclat Ambre */}
          <Card className="shadow-lg shadow-amber-100/40 dark:shadow-none border border-amber-200/80 dark:border-slate-800/80 bg-gradient-to-br from-white/90 to-amber-50/40 dark:from-slate-900/90 dark:to-slate-900/40 backdrop-blur-md rounded-2xl">
            <CardHeader className="pb-4 border-b border-amber-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-black tracking-tight text-slate-800 dark:text-slate-100">
                  Enveloppes Budgétaires
                </CardTitle>
                <span className="text-[10px] font-black tracking-wider uppercase text-amber-800 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg">
                  {periodLabel}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <BudgetWidget budgets={periodBudgets} spentMap={spentMap} />
            </CardContent>
          </Card>

          {/* OBJECTIFS D'ÉPARGNE - Éclat Émeraude */}
          <Card className="shadow-lg shadow-emerald-100/40 dark:shadow-none border border-emerald-200/80 dark:border-slate-800/80 bg-gradient-to-br from-white/90 to-emerald-50/30 dark:from-slate-900/90 dark:to-slate-900/40 backdrop-blur-md rounded-2xl">
            <CardHeader className="pb-4 border-b border-emerald-100 dark:border-slate-800/80">
              <CardTitle className="text-base font-black tracking-tight text-slate-800 dark:text-slate-100">
                Objectifs d'épargne
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <GoalsWidget />
            </CardContent>
          </Card>

          {/* TRANSACTIONS RÉCURRENTES - Éclat Rose */}
          <Card className="shadow-lg shadow-rose-100/40 dark:shadow-none border border-rose-200/80 dark:border-slate-800/80 bg-gradient-to-br from-white/90 to-rose-50/30 dark:from-slate-900/90 dark:to-slate-900/40 backdrop-blur-md rounded-2xl">
            <CardHeader className="pb-4 border-b border-rose-100 dark:border-slate-800/80">
              <CardTitle className="text-base font-black tracking-tight text-slate-800 dark:text-slate-100">
                Échéances & Récurrences
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <RecurringWidget transactions={accountTransactions} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
