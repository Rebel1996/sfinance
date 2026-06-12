import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, eachMonthOfInterval, startOfYear, endOfYear } from "date-fns";
import { fr } from "date-fns/locale";
import { useAppContext, CURRENCIES } from "@/lib/AppContext";

function axisLabel(v, symbol) {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M ${symbol}`;
  if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}k ${symbol}`;
  return `${v} ${symbol}`;
}

export default function MonthlyChart({ transactions, year }) {
  const { formatCurrency, currencyCode } = useAppContext();
  const currency =
    CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];

  const months = eachMonthOfInterval({
    start: startOfYear(new Date(year, 0)),
    end: endOfYear(new Date(year, 0)),
  });

  const data = months.map((month) => {
    const monthStr = format(month, "yyyy-MM");
    const monthTx = transactions.filter((t) => t.date?.startsWith(monthStr));
    const revenus = monthTx
      .filter((t) => t.type === "revenu")
      .reduce((s, t) => s + parseFloat(t.amount), 0);
    const depenses = monthTx
      .filter((t) => t.type === "depense")
      .reduce((s, t) => s + parseFloat(t.amount), 0);
    return {
      name: format(month, "MMM", { locale: fr }),
      Revenus: revenus,
      Dépenses: depenses,
    };
  });

  return (
    <Card className="p-6 border-0 shadow-sm h-full flex flex-col">
      <h3 className="text-sm font-semibold mb-1">Flux mensuels</h3>
      <p className="text-xs text-muted-foreground mb-6">
        Revenus vs Dépenses — {year}
      </p>
      <div className="flex-1 min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4} barCategoryGap="30%">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={70}
              tickFormatter={(v) => axisLabel(v, currency.symbol)}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                fontSize: "12px",
              }}
              formatter={(value, name) => [formatCurrency(value), name]}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
            <Bar
              dataKey="Revenus"
              fill="hsl(var(--chart-1))"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="Dépenses"
              fill="hsl(var(--chart-5))"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
