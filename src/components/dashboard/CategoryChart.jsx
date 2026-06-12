import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAppContext } from '@/lib/AppContext';
import { CATEGORY_LABELS } from '@/lib/categories';

const COLORS = [
  'hsl(160, 84%, 39%)', 'hsl(220, 60%, 50%)', 'hsl(43, 96%, 56%)',
  'hsl(280, 65%, 60%)', 'hsl(0, 72%, 51%)',   'hsl(190, 70%, 45%)',
  'hsl(30, 80%, 55%)',  'hsl(330, 60%, 50%)', 'hsl(100, 50%, 45%)',
  'hsl(260, 50%, 55%)', 'hsl(15, 70%, 50%)',  'hsl(200, 50%, 40%)',
  'hsl(60, 60%, 45%)',  'hsl(210, 20%, 60%)', 'hsl(170, 60%, 40%)',
  'hsl(350, 70%, 55%)', 'hsl(80, 50%, 42%)',  'hsl(240, 50%, 58%)',
];

function CustomTooltip({ active, payload, formatCurrency }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div style={{
      background: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '12px',
      padding: '8px 12px',
      fontSize: '12px',
    }}>
      <p className="font-medium">{name}</p>
      <p className="text-muted-foreground">{formatCurrency(value)}</p>
    </div>
  );
}

export default function CategoryChart({ transactions, type = 'depense' }) {
  const { formatCurrency } = useAppContext();

  const filtered = transactions.filter(t => t.type === type);
  const grouped = {};
  filtered.forEach(t => {
    grouped[t.category] = (grouped[t.category] || 0) + parseFloat(t.amount);
  });

  const data = Object.entries(grouped)
    .map(([key, value]) => ({
      key,
      name: CATEGORY_LABELS[key] || key,
      value,
    }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    return (
      <Card className="p-6 border-0 shadow-sm flex flex-col items-center justify-center min-h-[220px]">
        <p className="text-sm text-muted-foreground">Aucune donnée</p>
        <p className="text-xs text-muted-foreground mt-1">
          {type === 'depense' ? 'Ajoutez des dépenses' : 'Ajoutez des revenus'} pour voir le graphique
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-0 shadow-sm h-full flex flex-col">
      <h3 className="text-sm font-semibold mb-0.5">
        {type === 'depense' ? 'Dépenses' : 'Revenus'} par catégorie
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Total : {formatCurrency(total)}
      </p>

      <div className="h-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={78}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Légende — toutes les catégories */}
      <div className="space-y-1.5 mt-3 max-h-36 overflow-y-auto pr-1">
        {data.map((item, i) => (
          <div key={item.key} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="text-muted-foreground truncate">{item.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="font-medium">{((item.value / total) * 100).toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
