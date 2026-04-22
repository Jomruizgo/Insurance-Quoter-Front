/* global React */
const { useState, useMemo, useEffect } = React;

// ============ COVERAGE (por ubicación) ============
function CoverageStep({ quote, onChange }) {
  // Estructura: quote.coveragesByLocation = { [locationIndex]: CoverageOption[] }
  // Si no existe, se inicializa con el template global
  const template = window.SEED.coverageOptions;
  const [activeLoc, setActiveLoc] = useState(0);

  // Inicializar coberturas por ubicación si no existen
  useEffect(() => {
    if (!quote.coveragesByLocation) {
      const next = structuredClone(quote);
      next.coveragesByLocation = {};
      quote.locations.forEach((_, i) => {
        next.coveragesByLocation[i] = structuredClone(template);
      });
      onChange(next);
    }
    // eslint-disable-next-line
  }, []);

  const coverages = (quote.coveragesByLocation && quote.coveragesByLocation[activeLoc]) || template;

  const toggle = (code) => {
    const next = structuredClone(quote);
    if (!next.coveragesByLocation) next.coveragesByLocation = {};
    const cur = next.coveragesByLocation[activeLoc] || structuredClone(template);
    next.coveragesByLocation[activeLoc] = cur.map(o => o.code === code ? { ...o, selected: !o.selected } : { ...o });
    onChange(next);
  };
  const update = (code, field, val) => {
    const next = structuredClone(quote);
    if (!next.coveragesByLocation) next.coveragesByLocation = {};
    const cur = next.coveragesByLocation[activeLoc] || structuredClone(template);
    next.coveragesByLocation[activeLoc] = cur.map(o => o.code === code ? { ...o, [field]: +val } : { ...o });
    onChange(next);
  };

  const copyFromLocation = (fromIdx) => {
    const next = structuredClone(quote);
    if (!next.coveragesByLocation) next.coveragesByLocation = {};
    next.coveragesByLocation[activeLoc] = structuredClone(next.coveragesByLocation[fromIdx] || template);
    onChange(next);
  };

  const applyToAll = () => {
    const next = structuredClone(quote);
    if (!next.coveragesByLocation) next.coveragesByLocation = {};
    const src = structuredClone(next.coveragesByLocation[activeLoc] || template);
    quote.locations.forEach((_, i) => {
      next.coveragesByLocation[i] = structuredClone(src);
    });
    onChange(next);
  };

  const selCount = coverages.filter(o => o.selected).length;
  const loc = quote.locations[activeLoc];

  // Resumen por ubicación para la tira superior
  const summary = quote.locations.map((l, i) => {
    const covs = (quote.coveragesByLocation && quote.coveragesByLocation[i]) || template;
    return { loc: l, index: i, selected: covs.filter(c => c.selected).length, total: covs.length };
  });

  return (
    <>
      <SectionHeader eyebrow={`Folio ${quote.folioNumber} · Paso 4 de 5`} title="Opciones de cobertura por ubicación"
        subtitle="Cada ubicación puede tener su propio paquete de coberturas. Selecciona la ubicación a configurar."
      />

      {/* Selector de ubicaciones */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <div className="row between" style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Ubicaciones · {quote.locations.length}
          </div>
          <div className="row gap-2">
            <Btn variant="ghost" size="sm" icon="copy" onClick={applyToAll} disabled={quote.locations.length < 2}>
              Aplicar a todas
            </Btn>
          </div>
        </div>
        <div style={{ display: 'flex', overflowX: 'auto', gap: 1, background: 'var(--border)' }}>
          {summary.map(s => {
            const active = s.index === activeLoc;
            return (
              <button
                key={s.index}
                onClick={() => setActiveLoc(s.index)}
                style={{
                  flex: '1 1 180px', minWidth: 180, textAlign: 'left',
                  padding: '12px 14px',
                  background: active ? '#e4e6ea' : 'var(--surface)',
                  border: 'none', cursor: 'pointer',
                  borderBottom: active ? '2px solid var(--brand-500)' : '2px solid transparent',
                  boxShadow: active ? 'inset 0 0 0 1px #c7cbd1' : 'none',
                  transition: 'background var(--t-fast) var(--ease)',
                }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 2 }} className="mono">
                  UBIC {String(s.index + 1).padStart(2,'0')}
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.loc.name || `Ubicación ${s.index + 1}`}
                </div>
                <div style={{ fontSize: 12, color: active ? 'var(--ink-700)' : 'var(--text-dim)', marginTop: 4 }} className="tabular">
                  {s.selected}/{s.total} coberturas
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contexto de ubicación activa + copiar desde otra */}
      <div className="row between mb-4" style={{ alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Configurando
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>
            {loc?.name || `Ubicación ${activeLoc + 1}`}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            {selCount} de {coverages.length} coberturas activas
          </div>
        </div>
        {quote.locations.length > 1 && (
          <div className="row gap-2" style={{ alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Copiar desde:</span>
            <select
              className="input"
              style={{ width: 'auto', minWidth: 180, fontSize: 13 }}
              value=""
              onChange={e => e.target.value !== '' && copyFromLocation(+e.target.value)}>
              <option value="">— Seleccionar —</option>
              {quote.locations.map((l, i) => i !== activeLoc && (
                <option key={i} value={i}>{l.name || `Ubicación ${i + 1}`}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-2 gap-4">
        {coverages.map(o => (
          <div key={o.code} className="card" style={{ padding: 0, overflow: 'hidden', borderColor: o.selected ? 'color-mix(in oklch, var(--brand-500) 45%, var(--border))' : 'var(--border)' }}>
            <div className="row between" style={{ padding: '14px 16px', background: o.selected ? 'color-mix(in oklch, var(--brand-500) 7%, transparent)' : 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
              <div className="row gap-3">
                <Switch on={o.selected} onChange={() => toggle(o.code)}/>
                <div>
                  <div style={{ fontWeight: 500 }}>{o.description}</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{o.code}</div>
                </div>
              </div>
              {o.selected && <Badge variant="brand">Activa</Badge>}
            </div>
            <div style={{ padding: 16, opacity: o.selected ? 1 : 0.5, pointerEvents: o.selected ? 'auto' : 'none' }}>
              <div className="grid grid-2">
                <Field label="Deducible (%)" help="Franquicia sobre la suma asegurada">
                  <Input type="number" step="0.5" value={o.deductiblePercentage} onChange={e => update(o.code, 'deductiblePercentage', e.target.value)}/>
                </Field>
                <Field label="Coaseguro (%)" help="Participación del asegurado">
                  <Input type="number" step="5" value={o.coinsurancePercentage} onChange={e => update(o.code, 'coinsurancePercentage', e.target.value)}/>
                </Field>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="alert alert-info mt-6">
        <Icon name="info" size={18} style={{ color: 'var(--info)' }}/>
        <div>
          <div className="alert-title">Coberturas por ubicación</div>
          Cada ubicación mantiene su propio paquete de coberturas, deducibles y coaseguros. Usa <em>"Aplicar a todas"</em> para replicar la configuración actual a todas las ubicaciones, o <em>"Copiar desde"</em> para tomar la de otra puntualmente.
        </div>
      </div>
    </>
  );
}

// ============ CALCULATE ============
function CalculateStep({ quote, onCalculate }) {
  const [calculating, setCalculating] = useState(false);
  const result = quote.netPremium != null ? {
    netPremium: quote.netPremium, commercialPremium: quote.commercialPremium, premiumsByLocation: quote.premiumsByLocation,
  } : null;

  const runCalc = () => {
    setCalculating(true);
    setTimeout(() => {
      const r = window.calculatePremiums(quote);
      onCalculate(r);
      setCalculating(false);
    }, 900);
  };

  const calculable = quote.locations.filter(l => l.validationStatus === 'COMPLETE').length;
  const incomplete = quote.locations.length - calculable;

  if (!result) {
    return (
      <>
        <SectionHeader eyebrow={`Folio ${quote.folioNumber} · Paso 5 de 5`} title="Cálculo de prima"
          subtitle="Ejecuta el cálculo para obtener la prima neta y prima comercial del folio."
        />
        <div className="card card-pad" style={{ textAlign: 'center', padding: 48 }}>
          <Icon name="calculator" size={48} style={{ color: 'var(--text-mute)', margin: '0 auto 16px', display: 'block' }}/>
          <h3 style={{ margin: '0 0 8px', fontSize: 20, letterSpacing: '-0.01em' }}>Listo para calcular</h3>
          <p style={{ color: 'var(--text-dim)', maxWidth: 520, margin: '0 auto 24px' }}>
            Se calcularán <strong>{calculable}</strong> ubicaci{calculable===1?'ón':'ones'} completas.
            {incomplete > 0 && <> Las <strong>{incomplete}</strong> incompletas generarán alerta pero no bloquearán el proceso.</>}
          </p>
          <div className="row center gap-3 mb-6">
            <Badge variant="ok"><Icon name="check-circle" size={12}/> {calculable} calculables</Badge>
            {incomplete > 0 && <Badge variant="warn"><Icon name="alert" size={12}/> {incomplete} con alertas</Badge>}
          </div>
          <Btn variant="primary" size="sm" icon={calculating?null:'sparkle'} onClick={runCalc} disabled={calculating || calculable===0}>
            {calculating ? 'Calculando…' : 'Ejecutar cálculo'}
          </Btn>
        </div>
      </>
    );
  }

  // Results view
  return (
    <>
      <SectionHeader eyebrow={`Folio ${quote.folioNumber} · Resultado`} title="Desglose financiero"
        subtitle="Prima calculada y trazada por componente técnico"
        actions={<>
          <Btn icon="download">Descargar PDF</Btn>
          <Btn icon="copy">Recalcular</Btn>
          <Btn variant="primary" iconRight="arrow-right">Continuar a emisión</Btn>
        </>}
      />

      {/* Top stats */}
      <div className="grid grid-3 mb-4">
        <div className="card" style={{ padding: 20, background: 'var(--ink-900)', color: 'var(--ink-0)', border: 'none' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 8 }}>Prima neta</div>
          <div className="tabular" style={{ fontSize: 32, letterSpacing: '-0.02em', fontWeight: 600 }}>{window.fmtMoney(result.netPremium)}</div>
          <div style={{ fontSize: 12, opacity: 0.5, marginTop: 6 }}>Suma de componentes técnicos</div>
        </div>
        <div className="card" style={{ padding: 20, background: 'var(--brand-500)', color: 'var(--ink-900)', border: 'none' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.7, marginBottom: 8 }}>Prima comercial</div>
          <div className="tabular" style={{ fontSize: 32, letterSpacing: '-0.02em', fontWeight: 600 }}>{window.fmtMoney(result.commercialPremium)}</div>
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>Neta · factor 1.16 (recargos)</div>
        </div>
        <div className="card card-pad">
          <div className="stat-label">Por ubicación</div>
          <div className="col gap-2 mt-2">
            {result.premiumsByLocation.map(p => (
              <div key={p.index} className="row between">
                <div className="row gap-2"><span className="mono" style={{ color: 'var(--text-mute)', fontSize: 11 }}>#{String(p.index).padStart(2,'0')}</span><span style={{ fontSize: 13 }}>{p.locationName}</span></div>
                {p.calculable ? <span className="tabular" style={{ fontSize: 13, fontWeight: 500 }}>{window.fmtMoney(p.commercialPremium, {decimals:0})}</span> : <Badge variant="warn">No calculable</Badge>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Desglose por componente y ubicación</div>
          <div className="row gap-2">
            <Btn size="sm" icon="eye">Solo calculables</Btn>
            <Btn size="sm" icon="download">CSV</Btn>
          </div>
        </div>
        <div style={{ overflow: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 220 }}>Componente</th>
                {result.premiumsByLocation.filter(p=>p.calculable).map(p => (
                  <th key={p.index} className="num">#{String(p.index).padStart(2,'0')} {p.locationName}</th>
                ))}
                <th className="num" style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border-strong)' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['fireBuildings','Incendio edificios'],
                ['fireContents','Incendio contenidos'],
                ['coverageExtension','Extensión de cobertura'],
                ['cattev','CATTEV'],
                ['catfhm','CATFHM'],
                ['debrisRemoval','Remoción de escombros'],
                ['extraordinaryExpenses','Gastos extraordinarios'],
                ['rentalLoss','Pérdida de rentas'],
                ['businessInterruption','BI'],
                ['electronicEquipment','Equipo electrónico'],
                ['theft','Robo'],
                ['cashAndValues','Dinero y valores'],
                ['glass','Vidrios'],
                ['luminousSignage','Anuncios luminosos'],
              ].map(([key,label]) => {
                const total = result.premiumsByLocation.filter(p=>p.calculable).reduce((a,p) => a + (p.coverageBreakdown?.[key] || 0), 0);
                return (
                  <tr key={key}>
                    <td style={{ fontSize: 13 }}>{label}</td>
                    {result.premiumsByLocation.filter(p=>p.calculable).map(p => (
                      <td key={p.index} className="num tabular" style={{ color: p.coverageBreakdown[key] ? 'var(--text)' : 'var(--text-mute)' }}>
                        {p.coverageBreakdown[key] ? window.fmtMoney(p.coverageBreakdown[key]) : '—'}
                      </td>
                    ))}
                    <td className="num tabular" style={{ background: 'var(--surface-2)', fontWeight: 500, borderLeft: '1px solid var(--border-strong)' }}>{window.fmtMoney(total)}</td>
                  </tr>
                );
              })}
              <tr style={{ background: 'var(--surface-2)' }}>
                <td style={{ fontWeight: 600 }}>Prima neta por ubicación</td>
                {result.premiumsByLocation.filter(p=>p.calculable).map(p => (
                  <td key={p.index} className="num tabular" style={{ fontWeight: 600 }}>{window.fmtMoney(p.netPremium)}</td>
                ))}
                <td className="num tabular" style={{ fontWeight: 700, background: 'var(--ink-100)', borderLeft: '1px solid var(--border-strong)' }}>{window.fmtMoney(result.netPremium)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Incompletas */}
      {quote.premiumsByLocation.some(p => !p.calculable) && (
        <div className="alert alert-warn mt-4">
          <Icon name="alert" size={18} style={{ color: 'var(--warn)' }}/>
          <div className="grow">
            <div className="alert-title">Ubicaciones no calculadas</div>
            {quote.premiumsByLocation.filter(p=>!p.calculable).map(p => (
              <div key={p.index} style={{ fontSize: 13, marginTop: 4 }}>
                <strong>#{String(p.index).padStart(2,'0')} {p.locationName}:</strong>{' '}{p.blockingAlerts.map(a=>a.message).join(' · ')}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

Object.assign(window, { CoverageStep, CalculateStep });
