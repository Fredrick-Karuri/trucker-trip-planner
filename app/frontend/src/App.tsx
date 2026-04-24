import { useState } from 'react'
import { colors } from '../tokens'

/**
 * Root application shell.
 * Owns top-level layout and route-level feature composition.
 */

type ActiveFeature = 'planner' | 'map' | 'logs'

export default function App() {
  const [active, setActive] = useState<ActiveFeature>('planner')

  return (
    <div style={{ backgroundColor: colors.background, minHeight: '100vh', color: colors.onPrimary }}>
      <Header active={active} onNavigate={setActive} />
      <main style={{ padding: '24px' }}>
        {active === 'planner' && <div>Planner feature</div>}
        {active === 'map'     && <div>Map feature</div>}
        {active === 'logs'    && <div>Logs feature</div>}
      </main>
    </div>
  )
}

interface HeaderProps {
  active: ActiveFeature
  onNavigate: (feature: ActiveFeature) => void
}

function Header({ active, onNavigate }: HeaderProps) {
  const navItems: { label: string; key: ActiveFeature }[] = [
    { label: 'Plan Trip', key: 'planner' },
    { label: 'Map',       key: 'map'     },
    { label: 'Log Sheets',key: 'logs'    },
  ]

  return (
    <header style={{ backgroundColor: colors.surface, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '32px' }}>
      <span style={{ color: colors.primary, fontWeight: 600, fontSize: '1.1rem' }}>
        Trucker Trip Planner
      </span>
      <nav style={{ display: 'flex', gap: '16px' }}>
        {navItems.map(({ label, key }) => (
          <button
            key={key}
            onClick={() => onNavigate(key)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: active === key ? colors.primary : colors.onPrimary,
              borderBottom: active === key ? `2px solid ${colors.primary}` : '2px solid transparent',
              paddingBottom: '4px',
              fontSize: '0.9rem',
            }}
          >
            {label}
          </button>
        ))}
      </nav>
    </header>
  )
}