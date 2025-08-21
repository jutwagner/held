import React from 'react';

interface Invoice {
  id: string;
  created: number;
  amount_paid: number;
  currency: string;
  hosted_invoice_url: string;
}

interface InvoiceHistoryProps {
  uid?: string;
}

const InvoiceHistory: React.FC<InvoiceHistoryProps> = ({ uid }) => {
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!uid) return;
    setLoading(true);
    fetch('/api/invoice-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    })
      .then(res => res.json())
      .then((data: { invoices?: Invoice[] }) => {
        setInvoices(data.invoices || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Unable to fetch invoice history');
        setLoading(false);
      });
  }, [uid]);

  if (loading) return <div className="text-gray-400 text-sm">Loading invoice history…</div>;
  if (error) return <div className="text-red-600 text-sm">{error}</div>;

  return (
    <div>
      <div className="font-bold text-lg mb-2">Invoice History</div>
      {invoices.length === 0 ? (
        <div className="text-gray-500 text-sm">No invoice history.</div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {invoices.map(inv => (
            <li key={inv.id} className="py-2 flex justify-between items-center">
              <span className="text-gray-900">{new Date(inv.created * 1000).toLocaleDateString()}</span>
              <span className="text-gray-700">{(inv.amount_paid / 100).toLocaleString('en-US', { style: 'currency', currency: inv.currency.toUpperCase() })}</span>
              <a href={inv.hosted_invoice_url} target="_blank" rel="noopener" className="text-blue-600 underline text-sm">View</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default InvoiceHistory;
