import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { format, eachMonthOfInterval, startOfYear, endOfYear } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAppContext, CURRENCIES } from '@/lib/AppContext';

function axisLabel(v, symbol) {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M ${symbol}`;
  if (abs >= 1_000)     return `${(v / 1_000).toFixed(0)}k ${symbol}`;
  return `${v} ${symbol}`;
}

export default function BalanceChart({ transactions, year }) {
  const { formatCurrency, currencyCode } = useAppContext();
  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];

  const data = useMemo(() => {
    const months = eachMonthOfInterval({
      start: startOfYear(new Date(year, 0)),
      end:   endOfYear(new Date(year, 0)),
    });

    const beforeYear = transactions
      .filter(tx => tx.date && new Date(tx.date).getFullYear() < year)
      .reduce((sum, tx) => {
        const amt = parseFloat(tx.amount);
        return sum + (tx.type === 'revenu' ? amt : -amt);
      }, 0);

    let cumulative = beforeYear;

    return months.map(month => {
      const monthStr = format(month, 'yyyy-MM');
      const monthTx = transactions.filter(t => t.date?.startsWith(monthStr));
      const net = monthTx.reduce((sum, tx) => {
        const amt = parseFloat(tx.amount);
        return sum + (tx.type === 'revenu' ? amt : -amt);
      }, 0);
      cumulative += net;
      return {
        name: format(month, 'MMM', { locale: fr }),
        Solde: parseFloat(cumulative.toFixed(2)),
      };
    });
  }, [transactions, year]);

  const minVal = Math.min(...data.map(d => d.Solde));
  const maxVal = Math.max(...data.map(d => d.Solde));
  const isAllPositive = minVal >= 0;

  return (
    <Card className="p-6 border-0 shadow-sm h-full flex flex-col">
      <h3 className="text-sm font-semibold mb-1">Évolution du solde</h3>
      <p className="text-xs text-muted-foreground mb-6">Solde cumulatif mois par mois — {year}</p>
      <div className="flex-1 min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              width={70}
              tickFormatter={v => axisLabel(v, currency.symbol)}
              domain={[
                isAllPositive ? 0 : (v => v * 1.1),
                (v => v * 1.05),
              ]}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                fontSize: '12px',
              }}
              formatter={(value) => [formatCurrency(value), 'Solde']}
            />
            {!isAllPositive && (
              <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="4 4" strokeWidth={1.5} />
            )}
            <Area
              type="monotone"
              dataKey="Solde"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2.5}
              fill="url(#balanceGradient)"
              dot={{ r: 3, fill: 'hsl(var(--chart-1))', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: 'hsl(var(--chart-1))' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
