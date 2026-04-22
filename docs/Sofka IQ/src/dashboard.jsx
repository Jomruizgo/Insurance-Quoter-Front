/* global React */
const { useState, useMemo, useEffect } = React;

// Steps metadata
const STEPS = [
  { id: 'general',    label: 'Datos generales',   icon: 'file' },
  { id: 'layout',     label: 'Layout',            icon: 'layers' },
  { id: 'locations',  label: 'Ubicaciones',       icon: 'map-pin' },
  { id: 'coverage',   label: 'Coberturas',        icon: 'shield' },
  { id: 'calculate',  label: 'Cálculo',           icon: 'calculator' },
];

// ============ DASHBOARD ============
function Dashboard({ onOpenFolio, onNewFolio }) {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [view, setView] = useState('list');
  const folios = window.SEED.folios;
  const filtered = folios.filter(f => {
    const matchQ = !q || f.folioNumber.toLowerCase().includes(q.toLowerCase()) || f.client.toLowerCase().includes(q.toLowerCase());
    const matchS = statusFilter === 'ALL' || f.status === statusFilter;
    return matchQ && matchS;
  });

  const stats = useMemo(() => {
    const byStatus = folios.reduce((a, f) => { a[f.status] = (a[f.status]||0)+1; return a; }, {});
    const calcTotal = folios.filter(f => f.commercial).reduce((a,f) => a + f.commercial, 0);
    return { total: folios.length, inProgress: byStatus.IN_PROGRESS||0, calculated: (byStatus.CALCULATED||0)+(byStatus.ISSUED||0), amount: calcTotal };
  }, [folios]);

  return (
    <>
      <SectionHeader
        eyebrow="Cotizaciones"
        title="Panel de folios"
        subtitle="Gestiona cotizaciones de seguros de daños patrimoniales"
        actions={<>
          <Btn icon="download">Exportar</Btn>
          <Btn variant="primary" icon="plus" onClick={onNewFolio}>Nuevo folio</Btn>
        </>}
      />

      <div className="grid grid-4 mb-4">
        <StatCard label="Folios totales" value={stats.total} sub="últimos 30 días" tone="neutral" />
        <StatCard label="En progreso" value={stats.inProgress} sub="requieren atención" tone="info" />
        <StatCard label="Calculados" value={stats.calculated} sub="listos para emisión" tone="brand" />
        <StatCard label="Prima comercial" value={window.fmtMoney(stats.amount, {decimals:0})} sub="acumulado" tone="neutral" />
      </div>

      <div className="card">
        <div className="card-header">
          <div className="row gap-3 grow">
            <div style={{ position: 'relative', flex: '0 1 340px' }}>
              <Icon name="search" size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color: 'var(--text-mute)'}} />
              <Input placeholder="Buscar por folio o cliente..." value={q} onChange={e => setQ(e.target.value)} style={{ paddingLeft: 34 }} />
            </div>
            <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 180 }}>
              <option value="ALL">Todos los estados</option>
              <option value="CREATED">Creado</option>
              <option value="IN_PROGRESS">En progreso</option>
              <option value="CALCULATED">Calculado</option>
              <option value="ISSUED">Emitido</option>
            </Select>
            <Btn icon="filter">Más filtros</Btn>
          </div>
          <div className="row gap-1" style={{ border: '1px solid var(--border-strong)', borderRadius: 'var(--r-md)', padding: 2 }}>
            <button onClick={()=>setView('list')} className={`btn btn-xs ${view==='list'?'btn-secondary':'btn-ghost'}`} style={view==='list'?{}:{border:'none'}}><Icon name="list" size={12}/></button>
            <button onClick={()=>setView('grid')} className={`btn btn-xs ${view==='grid'?'btn-secondary':'btn-ghost'}`} style={view==='grid'?{}:{border:'none'}}><Icon name="grid" size={12}/></button>
          </div>
        </div>

        {view === 'list' ? (
          <div style={{ overflow: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 170 }}>Folio</th>
                  <th>Cliente</th>
                  <th style={{ width: 150 }}>Agente</th>
                  <th style={{ width: 130 }}>Estado</th>
                  <th className="num" style={{ width: 100 }}>Ubic.</th>
                  <th style={{ width: 160 }}>Progreso</th>
                  <th className="num" style={{ width: 160 }}>Prima comercial</th>
                  <th style={{ width: 130 }}>Actualizado</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(f => (
                  <tr key={f.folioNumber} onClick={() => onOpenFolio(f.folioNumber)} style={{ cursor: 'pointer' }}>
                    <td className="mono" style={{ fontWeight: 500 }}>{f.folioNumber}</td>
                    <td style={{ fontWeight: 500 }}>{f.client}</td>
                    <td><div style={{ fontSize: 13 }}>{f.agentName}</div><div className="mono" style={{ fontSize: 11, color: 'var(--text-mute)'}}>{f.agent}</div></td>
                    <td><StatusBadge status={f.status} /></td>
                    <td className="num tabular">{f.locations}</td>
                    <td><div className="row gap-2"><Sparkline pct={f.completion} /><span className="tabular" style={{ fontSize: 12, color: 'var(--text-dim)', minWidth: 28 }}>{f.completion}%</span></div></td>
                    <td className="num tabular">{window.fmtMoney(f.commercial)}</td>
                    <td style={{ color: 'var(--text-dim)', fontSize: 12 }}>{window.fmtDate(f.updatedAt)}</td>
                    <td><Btn size="xs" variant="ghost" icon="dots" onClick={(e)=>{e.stopPropagation();}}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-3" style={{ padding: 20 }}>
            {filtered.map(f => (
              <div key={f.folioNumber} className="card" onClick={()=>onOpenFolio(f.folioNumber)} style={{ padding: 16, cursor:'pointer' }}>
                <div className="row between mb-2">
                  <span className="mono" style={{ fontSize: 12, color: 'var(--text-dim)' }}>{f.folioNumber}</span>
                  <StatusBadge status={f.status}/>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{f.client}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12 }}>{f.agentName} · {f.locations} ubicaciones</div>
                <Sparkline pct={f.completion} />
                <div className="row between mt-3"><span style={{ fontSize: 11, color: 'var(--text-mute)' }}>{window.fmtDate(f.updatedAt)}</span><span className="tabular" style={{ fontSize: 13, fontWeight: 500 }}>{window.fmtMoney(f.commercial)}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({ label, value, sub, tone }) {
  const borderAccent = { brand: 'var(--brand-500)', info: 'var(--info)', neutral: 'var(--border)' }[tone] || 'var(--border)';
  return (
    <div className="card" style={{ padding: 'var(--pad-card)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: borderAccent }}/>
      <div className="stat">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard, STEPS });
