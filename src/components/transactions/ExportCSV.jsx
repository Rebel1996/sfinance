import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/lib/AppContext';
import { CATEGORY_LABELS } from '@/lib/categories';

const RECURRENCE_LABELS = {
  quotidien: 'Quotidien',
  hebdomadaire: 'Hebdomadaire',
  mensuel: 'Mensuel',
  trimestriel: 'Trimestriel',
  annuel: 'Annuel',
};

function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function ExportCSV({ transactions, label = 'Exporter CSV' }) {
  const { currencyCode } = useAppContext();

  const handleExport = () => {
    const headers = [
      'Date', 'Type', 'Description', 'Catégorie', 'Montant', 'Devise',
      'Récurrente', 'Fréquence', 'Notes',
    ];

    const rows = transactions.map(tx => [
      tx.date ? tx.date.split('T')[0] : '',
      tx.type === 'revenu' ? 'Revenu' : 'Dépense',
      tx.description || '',
      CATEGORY_LABELS[tx.category] || tx.category || '',
      parseFloat(tx.amount || 0).toFixed(2),
      currencyCode,
      (tx.is_recurring == 1 || tx.is_recurring === true) ? 'Oui' : 'Non',
      RECURRENCE_LABELS[tx.recurrence] || '',
      tx.notes || '',
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(escapeCSV).join(','))
      .join('\n');

    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fintrack-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={transactions.length === 0}>
      <Download className="w-4 h-4 mr-2" />
      {label}
    </Button>
  );
}
