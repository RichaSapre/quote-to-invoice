import { useEffect, useState } from 'react'
import api from '../api'

export default function FinanceView() {
  const [invoices, setInvoices] = useState<any[]>([])

  useEffect(() => {
    api.get('/invoices').then(res => setInvoices(res.data))
  }, [])

  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0)
  const collected = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + Number(inv.total_amount), 0)
  const outstanding = invoices
    .filter(inv => inv.status !== 'paid')
    .reduce((sum, inv) => sum + Number(inv.total_amount), 0)

  return (
    <div className="view-stack">
      <section className="summary-grid">
        <div className="card stat-card">
          <div className="stat-card__label">Total Invoiced</div>
          <div className="stat-card__value">${totalInvoiced.toFixed(2)}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-card__label">Collected</div>
          <div className="stat-card__value">${collected.toFixed(2)}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-card__label">Outstanding</div>
          <div className="stat-card__value">${outstanding.toFixed(2)}</div>
        </div>
      </section>

      <section className="card section-card">
        <div className="section-heading">
          <div>
            <h2>Invoice register</h2>
            <p>Track invoice status, source quote, and receivables in one place.</p>
          </div>
        </div>

        {invoices.length === 0 ? (
          <p className="muted-text">No invoices yet. Approved quotes will appear here.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Quote Ref</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td>INV-{inv.id}</td>
                    <td>{inv.customer_name}</td>
                    <td>${inv.total_amount.toFixed(2)}</td>
                    <td>Quote #{inv.quote_id}</td>
                    <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${inv.status}`}>{inv.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
