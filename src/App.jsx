import { useState, useEffect } from 'react'

export default function App() {
  const [nombre, setNombre] = useState('')
  const [personas, setPersonas] = useState(() => JSON.parse(localStorage.getItem('pj-personas') || '["Lucho","Alejo"]'))
  const [quienPago, setQuienPago] = useState('Lucho')
  const [monto, setMonto] = useState('')
  const [detalle, setDetalle] = useState('')
  const [gastos, setGastos] = useState(() => JSON.parse(localStorage.getItem('pj-gastos') || '[]'))

  useEffect(() => { localStorage.setItem('pj-personas', JSON.stringify(personas)) }, [personas])
  useEffect(() => { localStorage.setItem('pj-gastos', JSON.stringify(gastos)) }, [gastos])

  const agregarPersona = () => {
    if (!nombre.trim() || personas.includes(nombre.trim())) return
    setPersonas([...personas, nombre.trim()]); setNombre('')
  }
  const agregarGasto = () => {
    if (!monto || !detalle) return
    setGastos([...gastos, { id: Date.now(), quienPago, monto: Number(monto), detalle }])
    setMonto(''); setDetalle('')
  }
  const borrarGasto = (id) => setGastos(gastos.filter(g => g.id !== id))
  const borrarPersona = (p) => {
    setPersonas(personas.filter(x => x !== p))
    setGastos(gastos.filter(g => g.quienPago !== p))
  }
  const limpiarTodo = () => { if (confirm('¿Borrar todo?')) { setGastos([]); setPersonas(['Lucho','Alejo']) } }

  const total = gastos.reduce((s, g) => s + g.monto, 0)
  const porPersona = personas.length ? total / personas.length : 0
  const balance = (p) => gastos.filter(g => g.quienPago === p).reduce((s, g) => s + g.monto, 0) - porPersona

  // Quién le paga a quién
  let deudores = personas.map(p => ({ p, b: balance(p) })).filter(x => x.b < -0.5).sort((a,b) => a.b - b.b)
  let acreedores = personas.map(p => ({ p, b: balance(p) })).filter(x => x.b > 0.5).sort((a,b) => b.b - a.b)
  let transferencias = []
  let i = 0, j = 0
  while (i < deudores.length && j < acreedores.length) {
    let debe = -deudores[i].b
    let cobra = acreedores[j].b
    let paga = Math.min(debe, cobra)
    transferencias.push(`${deudores[i].p} le paga $${paga.toFixed(0)} a ${acreedores[j].p}`)
    deudores[i].b += paga; acreedores[j].b -= paga
    if (Math.abs(deudores[i].b) < 1) i++
    if (Math.abs(acreedores[j].b) < 1) j++
  }

  const compartir = () => {
    let texto = `PAGO JUSTO 💸\nTotal: $${total} - Cada uno: $${porPersona.toFixed(0)}\n\n`
    transferencias.forEach(t => texto += `👉 ${t}\n`)
    texto += `\nGastos:\n` + gastos.map(g => `${g.quienPago}: $${g.monto} - ${g.detalle}`).join('\n')
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  const inputStyle = { width: '100%', padding: 12, marginBottom: 8, borderRadius: 10, border: 'none', boxSizing: 'border-box', fontSize: 15, background: '#262626', color: 'white' }
  const btnStyle = { width: '100%', background: '#22c55e', border: 'none', padding: 13, borderRadius: 10, fontWeight: 'bold', fontSize: 16, color: 'black' }

  return (
    <div style={{ background: '#0f0f0f', color: 'white', minHeight: '100vh', padding: 16, fontFamily: 'sans-serif', maxWidth: 500, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', color: '#22c55e', marginBottom: 0 }}>PAGO JUSTO 💸</h1>
      <p style={{ textAlign: 'center', opacity: 0.7, marginTop: 4 }}>Que nadie pague de más.</p>

      <h3>👥 Quiénes están</h3>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre, ej: Marti" style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
        <button onClick={agregarPersona} style={{ background: '#22c55e', border: 'none', padding: '0 18px', borderRadius: 10, fontWeight: 'bold' }}>+</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {personas.map(p => <span key={p} style={{ background: '#262626', padding: '6px 10px', borderRadius: 20, fontSize: 14 }}>{p} <span onClick={() => borrarPersona(p)} style={{ color: '#ef4444', cursor: 'pointer' }}> ✕</span></span>)}
      </div>

      <h3>🧾 Agregar gasto</h3>
      <select value={quienPago} onChange={e => setQuienPago(e.target.value)} style={inputStyle}>
        {personas.map(p => <option key={p} value={p}>{p} pagó</option>)}
      </select>
      <input value={detalle} onChange={e => setDetalle(e.target.value)} placeholder="Qué compró? Ej: Asado" style={inputStyle} />
      <input value={monto} onChange={e => setMonto(e.target.value)} type="number" placeholder="Cuánto? Ej: 20000" style={inputStyle} />
      <button onClick={agregarGasto} style={btnStyle}>Sumar gasto</button>

      <h3>📊 Cuentas</h3>
      <div style={{ background: '#1a1a1a', padding: 14, borderRadius: 12 }}>
        <p style={{ margin: 0 }}>Total: <b>${total}</b> | Cada uno: <b>${porPersona.toFixed(0)}</b></p>
        {personas.map(p => {
          const b = balance(p)
          return <div key={p} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}><span>{p}</span><span style={{ color: b >= 0 ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>{b >= 0 ? `Le deben $${b.toFixed(0)}` : `Debe $${Math.abs(b).toFixed(0)}`}</span></div>
        })}
      </div>

      {transferencias.length > 0 && (
        <div style={{ background: '#14532d', padding: 14, borderRadius: 12, marginTop: 12 }}>
          <b>✅ Para quedar a mano:</b>
          {transferencias.map((t, idx) => <p key={idx} style={{ margin: '6px 0' }}>{t}</p>)}
          <button onClick={compartir} style={{ ...btnStyle, background: '#25D366', marginTop: 8 }}>Compartir por WhatsApp 📲</button>
        </div>
      )}

      <h3>Historial {gastos.length > 0 && <span onClick={limpiarTodo} style={{ color: '#ef4444', fontSize: 13, cursor: 'pointer' }}> - Borrar todo</span>}</h3>
      {gastos.length === 0 && <p style={{ opacity: 0.5 }}>Todavía no hay gastos. Sumá el primero arriba.</p>}
      {gastos.map(g => <div key={g.id} style={{ background: '#1e1e1e', padding: 10, borderRadius: 10, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}><span>• {g.quienPago} - {g.detalle} <b>${g.monto}</b></span><span onClick={() => borrarGasto(g.id)} style={{ color: '#ef4444', cursor: 'pointer' }}>🗑️</span></div>)}
    </div>
  )
}
