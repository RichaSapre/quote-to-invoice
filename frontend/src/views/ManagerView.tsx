import { useEffect, useState } from 'react'
import api from '../api'

export default function ManagerView() {
  const [pending, setPending] = useState<any[]>([])
  const [comment, setComment] = useState<{ [key: number]: string }>({})
  const [msg, setMsg] = useState('')

  const loadPending = async () => {
    const res = await api.get('/approvals/pending')
    setPending(res.data)
  }

  useEffect(() => {
    loadPending()
  }, [])

  const act = async (approvalId: number, managerId: number, action: string) => {
    await api.post(`/approvals/${approvalId}/action`, {
      approver_id: managerId,
      action,
      comment: comment[approvalId] || ''
    })
    setMsg(`Quote ${action}!`)
    loadPending()
  }

  return (
    <div className="view-stack">
      {msg && <div className="status-message">{msg}</div>}

      {pending.length === 0 ? (
        <section className="card empty-state">
          <div className="empty-state__icon" aria-hidden="true">
            ✓
          </div>
          <div>
            <h2>All clear — no pending approvals</h2>
            <p className="muted-text">New quotes that cross approval thresholds will appear here.</p>
          </div>
        </section>
      ) : (
        <div className="approval-list">
          {pending.map(a => (
            <section className="card approval-card" key={a.approval_id}>
              <div className="approval-card__header">
                <div className="approval-card__meta">
                  <div className="approval-card__title">{a.customer_name}</div>
                  <span className="badge pending_approval">Pending Approval</span>
                  <div className="approval-card__quote">Quote #{a.quote_id}</div>
                </div>

                <div className="approval-card__amount">${a.total_amount.toFixed(2)}</div>
              </div>

              <div className="field" style={{ marginBottom: 18 }}>
                <label htmlFor={`comment-${a.approval_id}`}>Manager comment</label>
                <textarea
                  id={`comment-${a.approval_id}`}
                  placeholder="Add context for the rep or finance team"
                  value={comment[a.approval_id] || ''}
                  onChange={e => setComment({ ...comment, [a.approval_id]: e.target.value })}
                />
              </div>

              <div className="button-row">
                <button
                  type="button"
                  className="button button--success"
                  onClick={() => act(a.approval_id, a.approver_id, 'approved')}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="button button--danger"
                  onClick={() => act(a.approval_id, a.approver_id, 'rejected')}
                >
                  Reject
                </button>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
