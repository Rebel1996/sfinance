import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function PeriodSelector({ view, setView, month, setMonth, year, setYear }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Tabs value={view} onValueChange={setView}>
        <TabsList className="bg-secondary">
          <TabsTrigger value="month" className="text-xs">Mensuel</TabsTrigger>
          <TabsTrigger value="year" className="text-xs">Annuel</TabsTrigger>
        </TabsList>
      </Tabs>

      {view === 'month' && (
        <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
          <SelectTrigger className="w-36 h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => (
              <SelectItem key={i} value={String(i)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
        <SelectTrigger className="w-24 h-9 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map(y => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}