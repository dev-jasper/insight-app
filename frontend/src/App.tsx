
import React, { useEffect, useState } from 'react'

type Insight = { id: number; title: string; category: string; tags: string[] }

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function App() {
  const [items, setItems] = useState<Insight[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`${API}/api/insights/`)
      .then(r => r.json())
      .then(data => setItems(data.results || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Insights</h1>
      {loading ? <p>Loading…</p> : (
        <ul>
          {items.map(it => (
            <li key={it.id}><strong>{it.title}</strong> — <em>{it.category}</em></li>
          ))}
        </ul>
      )}
    </main>
  )
}
