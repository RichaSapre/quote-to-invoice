import { useState } from 'react'
import RepView from './views/RepView'
import ManagerView from './views/ManagerView'
import FinanceView from './views/FinanceView'

type Role = 'rep' | 'manager' | 'finance'

const roleConfig: Record<
  Role,
  { label: string; icon: string; title: string; user: string }
> = {
  rep: {
    label: 'New Quote',
    icon: '📋',
    title: 'New Quote',
    user: 'Avery Chen'
  },
  manager: {
    label: 'Approvals',
    icon: '✅',
    title: 'Approvals',
    user: 'Morgan Lee'
  },
  finance: {
    label: 'Invoices',
    icon: '🧾',
    title: 'Invoices',
    user: 'Jordan Patel'
  }
}

export default function App() {
  const [role, setRole] = useState<Role>('rep')
  const current = roleConfig[role]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">Quote2Invoice</div>
        <nav className="sidebar__nav" aria-label="Primary">
          {(Object.keys(roleConfig) as Role[]).map(item => {
            const config = roleConfig[item]
            return (
              <button
                key={item}
                type="button"
                onClick={() => setRole(item)}
                className={`sidebar__nav-item ${role === item ? 'is-active' : ''}`}
              >
                <span className="sidebar__nav-icon" aria-hidden="true">
                  {config.icon}
                </span>
                <span>{config.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      <main className="app-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Quote2Invoice workflow</p>
            <h1>{current.title}</h1>
          </div>
          <div className="topbar__user">
            <span className="topbar__user-label">Logged in as</span>
            <span className="topbar__user-name">{current.user}</span>
          </div>
        </header>

        <section className="content-area">
          {role === 'rep' && <RepView />}
          {role === 'manager' && <ManagerView />}
          {role === 'finance' && <FinanceView />}
        </section>
      </main>
    </div>
  )
}
