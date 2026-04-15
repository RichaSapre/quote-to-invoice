import { useEffect, useState } from 'react'
import type { AxiosError } from 'axios'
import api from '../api'

type QuoteLineItem = {
  id: number
  product_name: string
  quantity: number
  unit_price: number
  line_total: number
}

type Quote = {
  id: number
  rep_id: number
  customer_name: string
  total_amount: number
  status: string
  line_items?: QuoteLineItem[]
}

type User = {
  id: number
  name: string
  role: string
}

export default function RepView() {
  const [customer, setCustomer] = useState('')
  const [repId, setRepId] = useState(1)
  const [repName, setRepName] = useState('Assigned rep')
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [product, setProduct] = useState('')
  const [qty, setQty] = useState(1)
  const [price, setPrice] = useState(0)
  const [msg, setMsg] = useState('')
  const selectedLineItems = selectedQuote?.line_items ?? []

  const getErrorMessage = (error: unknown) =>
    (error as AxiosError<{ detail?: string }>)?.response?.data?.detail ||
    'Something went wrong. Please try again.'

  const loadQuotes = async () => {
    const res = await api.get('/quotes')
    setQuotes(res.data as Quote[])
  }

  const loadRep = async () => {
    const res = await api.get('/users')
    const users = res.data as User[]
    const rep = users.find(user => user.role === 'rep')
    if (rep) {
      setRepId(rep.id)
      setRepName(rep.name)
    }
  }

  useEffect(() => {
    const bootstrap = async () => {
      await loadRep()
      await loadQuotes()
    }

    void bootstrap()
  }, [])

  const createQuote = async () => {
    if (!customer) return
    try {
      const res = await api.post('/quotes', { rep_id: repId, customer_name: customer })
      setCustomer('')
      setSelectedQuote(res.data as Quote)
      setMsg('Quote created!')
      await loadQuotes()
    } catch (error: unknown) {
      setMsg(getErrorMessage(error))
    }
  }

  const addItem = async () => {
    if (!selectedQuote || !product) return
    try {
      await api.post(`/quotes/${selectedQuote.id}/line-items`, {
        product_name: product,
        quantity: qty,
        unit_price: price
      })
      setProduct('')
      setQty(1)
      setPrice(0)
      setMsg('Item added!')
      await loadQuotes()
      const res = await api.get(`/quotes/${selectedQuote.id}`)
      setSelectedQuote(res.data as Quote)
    } catch (error: unknown) {
      setMsg(getErrorMessage(error))
    }
  }

  const submitQuote = async (quoteId: number) => {
    try {
      await api.post(`/quotes/${quoteId}/submit`)
      setMsg('Quote submitted!')
      await loadQuotes()
      setSelectedQuote(null)
    } catch (error: unknown) {
      setMsg(getErrorMessage(error))
    }
  }

  return (
    <div className="view-stack">
      {msg && <div className="status-message">{msg}</div>}

      <div className="quote-builder">
        <div className="view-stack">
          <section className="card section-card">
            <div className="section-heading">
              <div>
                <h2>Create quote</h2>
                <p>Start a new customer quote and add line items before submitting.</p>
              </div>
            </div>

            <div className="form-grid two-col">
              <div className="field">
                <label htmlFor="customer-name">Customer name</label>
                <input
                  id="customer-name"
                  placeholder="Acme Industries"
                  value={customer}
                  onChange={e => setCustomer(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="rep-id">Assigned rep</label>
                <input id="rep-id" value={`${repName} · ID ${repId}`} readOnly />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <button type="button" className="button button--primary button--full" onClick={createQuote}>
                Create quote
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </section>

          <section className="card section-card">
            <div className="section-heading">
              <div>
                <h3>Open quotes</h3>
                <p>Select a draft to add products or submit it for review.</p>
              </div>
            </div>

            {quotes.length === 0 ? (
              <p className="muted-text">No quotes yet.</p>
            ) : (
              <div className="quotes-list">
                {quotes.map(q => (
                  <div className="quote-row" key={q.id}>
                    <div>
                      <div className="quote-row__title">{q.customer_name}</div>
                      <div className="quote-row__meta">Quote #{q.id}</div>
                    </div>
                    <span className={`badge ${q.status}`}>{q.status.replace('_', ' ')}</span>
                    <strong>${q.total_amount.toFixed(2)}</strong>
                    <div className="button-row">
                      {q.status === 'draft' && (
                        <>
                          <button
                            type="button"
                            className="button button--secondary"
                            onClick={() => setSelectedQuote(q)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="button button--primary"
                            onClick={() => submitQuote(q.id)}
                          >
                            Submit
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card section-card">
            <div className="section-heading">
              <div>
                <h3>Line items</h3>
                <p>Build the current draft with products, quantities, and pricing.</p>
              </div>
            </div>

            {selectedQuote ? (
              <>
                <div className="form-grid" style={{ marginBottom: 20 }}>
                  <div className="field">
                    <label htmlFor="product-name">Product</label>
                    <input
                      id="product-name"
                      placeholder="Enterprise subscription"
                      value={product}
                      onChange={e => setProduct(e.target.value)}
                    />
                  </div>
                  <div className="form-grid two-col">
                    <div className="field">
                      <label htmlFor="quantity">Qty</label>
                      <input
                        id="quantity"
                        type="number"
                        value={qty}
                        onChange={e => setQty(Number(e.target.value))}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="unit-price">Unit price</label>
                      <input
                        id="unit-price"
                        type="number"
                        value={price}
                        onChange={e => setPrice(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <button type="button" className="button button--secondary button--full" onClick={addItem}>
                  Add line item
                </button>
              </>
            ) : (
              <p className="muted-text">Choose a draft quote from the list to start building.</p>
            )}
          </section>
        </div>

        <aside className="live-preview">
          <section className="card section-card">
            <div className="section-heading">
              <div>
                <h3>Live quote preview</h3>
                <p>Customer-ready totals update as you add products.</p>
              </div>
            </div>

            {selectedQuote ? (
              <>
                <div className="quote-preview__header">
                  <div>
                    <div className="quote-preview__number">Quote #{selectedQuote.id}</div>
                    <div className="quote-preview__customer">{selectedQuote.customer_name}</div>
                  </div>
                  <span className={`badge ${selectedQuote.status}`}>
                    {selectedQuote.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                        <th aria-label="Remove" />
                      </tr>
                    </thead>
                    <tbody>
                      {selectedLineItems.length > 0 ? (
                        selectedLineItems.map((item: QuoteLineItem) => (
                          <tr key={item.id}>
                            <td>{item.product_name}</td>
                            <td>{item.quantity}</td>
                            <td>${Number(item.unit_price).toFixed(2)}</td>
                            <td>${Number(item.line_total).toFixed(2)}</td>
                            <td className="remove-cell">
                              <button
                                type="button"
                                className="ghost-icon"
                                disabled
                                title="Remove action is not available in the current workflow"
                                aria-label="Remove line item"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="muted-text">
                            No line items yet. Add your first product from the form.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="table-total">
                  Running total
                  <strong>${selectedQuote.total_amount?.toFixed(2) ?? '0.00'}</strong>
                </div>

                {selectedQuote.total_amount >= 10000 && (
                  <div className="warning-banner">
                    <span aria-hidden="true">⚠</span>
                    <span>This quote requires manager approval</span>
                  </div>
                )}

                {selectedQuote.status === 'draft' && (
                  <button
                    type="button"
                    className="button button--primary button--full"
                    onClick={() => submitQuote(selectedQuote.id)}
                  >
                    Submit quote
                    <span aria-hidden="true">→</span>
                  </button>
                )}
              </>
            ) : (
              <div className="preview-empty">
                <div>
                  <strong>No quote selected</strong>
                  <p>Select a draft quote to preview totals and line items here.</p>
                </div>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
