/* global React */
const { useState, useEffect, useMemo } = React;

// ============ LOCATIONS LIST ============
function LocationsStep({ quote, onChange, onEdit }) {
  const locs = quote.locations;
  const [selected, setSelected] = useState(new Set());
  const toggleSel = (idx) => {
    const n = new Set(selected);
    n.has(idx) ? n.delete(idx) : n.add(idx);
    setSelected(n);
  };

  const completeCount = locs.filter(l => l.validationStatus === 'COMPLETE').length;
  const incomplete = locs.filter(l => l.validationStatus !== 'COMPLETE');
  const totalInsured = locs.reduce((a, l) => a + l.guarantees.reduce((b, g) => b + (g.insuredValue||0), 0), 0);

  const addLocation = () => {
    const next = structuredClone(quote);
    next.locations.push({
      index: next.locations.length + 1,
      locationName: `Ubicación ${next.locations.length + 1}`,
      address: '', zipCode: '', state: '', municipality: '', neighborhood: '', city: '',
      constructionType: 'MASONRY', level: 1, constructionYear: 2020,
      businessLine: { code: '', fireKey: '', description: '' },
      guarantees: [], catastrophicZone: null,
      validationStatus: 'INCOMPLETE',
      blockingAlerts: [{ code: 'MISSING_ZIP_CODE', message: 'Código postal requerido' }, { code: 'MISSING_FIRE_KEY', message: 'Clave incendio del giro requerida' }],
    });
    onChange(next);
  };

  return (
    <>
      <SectionHeader eyebrow={`Folio ${quote.folioNumber} · Paso 3 de 5`} title="Ubicaciones de riesgo"
        subtitle={`${locs.length} de ${quote.layoutConfiguration.numberOfLocations} ubicaciones registradas · ${completeCount} completas · ${incomplete.length} con alertas`}
        actions={<><Btn icon="copy">Duplicar</Btn><Btn variant="primary" icon="plus" onClick={addLocation}>Añadir ubicación</Btn></>}
      />

      {incomplete.length > 0 && (
        <div className="alert alert-warn mb-4">
          <Icon name="alert" size={18} style={{ color: 'var(--warn)' }}/>
          <div className="grow">
            <div className="alert-title">{incomplete.length} ubicaci{incomplete.length===1?'ón':'ones'} con alertas bloqueantes</div>
            <div style={{ fontSize: 13 }}>
              Las ubicaciones incompletas no bloquearán el cálculo de las demás, pero no tendrán prima calculada hasta que se corrijan.
            </div>
          </div>
          <Btn size="sm" variant="ghost">Ver detalles</Btn>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="row gap-4">
            <div className="card-title">Tabla de ubicaciones</div>
            {selected.size > 0 && <Badge variant="brand">{selected.size} seleccionadas</Badge>}
          </div>
          <div className="row gap-2">
            {selected.size > 0 && <>
              <Btn size="sm" variant="ghost" icon="trash">Eliminar</Btn>
              <div style={{ width: 1, height: 20, background: 'var(--border)' }}/>
            </>}
            <Btn size="sm" icon="filter">Filtrar</Btn>
            <Btn size="sm" icon="download">Exportar CSV</Btn>
          </div>
        </div>

        <div style={{ overflow: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 36 }}><input type="checkbox" className="chk" checked={selected.size === locs.length} onChange={e => setSelected(e.target.checked ? new Set(locs.map(l=>l.index)) : new Set())}/></th>
                <th style={{ width: 50 }}>#</th>
                <th>Nombre</th>
                <th>Dirección · CP</th>
                <th style={{ width: 170 }}>Giro</th>
                <th style={{ width: 130 }}>Construcción</th>
                <th className="num" style={{ width: 160 }}>Suma asegurada</th>
                <th style={{ width: 160 }}>Estado</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {locs.map(l => {
                const sum = l.guarantees.reduce((a, g) => a + (g.insuredValue||0), 0);
                return (
                  <tr key={l.index} data-state={selected.has(l.index) ? 'selected' : ''} onClick={() => onEdit(l.index)} style={{ cursor:'pointer' }}>
                    <td onClick={e => e.stopPropagation()}><input type="checkbox" className="chk" checked={selected.has(l.index)} onChange={() => toggleSel(l.index)}/></td>
                    <td className="mono" style={{ color: 'var(--text-dim)' }}>{String(l.index).padStart(2,'0')}</td>
                    <td style={{ fontWeight: 500 }}><div className="row gap-2"><Icon name="map-pin" size={14} style={{ color: 'var(--text-mute)'}}/>{l.locationName}</div></td>
                    <td>
                      <div style={{ fontSize: 13 }}>{l.address || <span style={{ color: 'var(--text-mute)'}}>— sin dirección —</span>}</div>
                      <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{l.zipCode ? `${l.zipCode} · ${l.city}` : <span style={{ color: 'var(--err)' }}>CP faltante</span>}</div>
                    </td>
                    <td><div style={{ fontSize: 13 }}>{l.businessLine.description || '—'}</div><div className="mono" style={{ fontSize: 11, color: l.businessLine.fireKey ? 'var(--text-mute)' : 'var(--err)' }}>{l.businessLine.fireKey || 'clave incendio faltante'}</div></td>
                    <td style={{ fontSize: 13 }}>{(window.SEED.constructionTypes.find(c=>c.code===l.constructionType)||{}).description}<div style={{ fontSize: 11, color: 'var(--text-mute)' }}>{l.level} nivel · {l.constructionYear}</div></td>
                    <td className="num tabular" style={{ fontWeight: 500 }}>{window.fmtMoney(sum, {decimals:0})}</td>
                    <td>
                      {l.validationStatus === 'COMPLETE'
                        ? <Badge variant="ok"><Icon name="check-circle" size={12}/> Completa</Badge>
                        : <Badge variant="warn"><Icon name="alert" size={12}/> {l.blockingAlerts.length} alerta{l.blockingAlerts.length===1?'':'s'}</Badge>}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="row gap-1">
                        <Btn size="xs" variant="ghost" icon="edit" onClick={() => onEdit(l.index)} />
                        <Btn size="xs" variant="ghost" icon="dots"/>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--surface-2)', fontWeight: 600 }}>
                <td colSpan={6} style={{ height: 40, padding: '0 12px', color: 'var(--text-dim)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total suma asegurada</td>
                <td className="num tabular" style={{ height: 40, padding: '0 12px' }}>{window.fmtMoney(totalInsured, {decimals:0})}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {locs.length < quote.layoutConfiguration.numberOfLocations && (
          <div style={{ padding: 20, borderTop: '1px solid var(--border)' }}>
            <div className="muted-block" onClick={addLocation} style={{ cursor: 'pointer' }}>
              + Añadir {quote.layoutConfiguration.numberOfLocations - locs.length} ubicaci{quote.layoutConfiguration.numberOfLocations - locs.length === 1 ? 'ón restante' : 'ones restantes'}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ============ LOCATION DRAWER ============
function LocationDrawer({ quote, index, onClose, onSave }) {
  const initial = quote.locations.find(l => l.index === index);
  const [loc, setLoc] = useState(structuredClone(initial));
  const [tab, setTab] = useState('basic');

  const patch = (path, val) => {
    const next = structuredClone(loc);
    const keys = path.split('.');
    let o = next; for (let i = 0; i < keys.length-1; i++) o = o[keys[i]];
    o[keys.at(-1)] = val;
    setLoc(next);
  };

  // Auto-fill from zipDB
  const onZipChange = (z) => {
    const info = window.SEED.zipDB[z];
    const next = structuredClone(loc);
    next.zipCode = z;
    if (info) {
      next.state = info.state; next.municipality = info.municipality; next.city = info.city;
      next.neighborhood = info.neighborhoods[0]; next.catastrophicZone = info.catastrophicZone;
    } else {
      next.state = ''; next.municipality = ''; next.city = ''; next.neighborhood = ''; next.catastrophicZone = null;
    }
    setLoc(next);
  };

  const onBusinessLineChange = (code) => {
    const bl = window.SEED.businessLines.find(b => b.code === code);
    const next = structuredClone(loc);
    next.businessLine = bl ? { ...bl } : { code: '', fireKey: '', description: '' };
    setLoc(next);
  };

  // Validation
  const alerts = [];
  if (!loc.zipCode || !window.SEED.zipDB[loc.zipCode]) alerts.push({ code: 'MISSING_ZIP_CODE', message: 'Código postal requerido o inválido' });
  if (!loc.businessLine.fireKey) alerts.push({ code: 'MISSING_FIRE_KEY', message: 'Clave incendio del giro requerida' });
  if (!loc.guarantees.some(g => g.insuredValue > 0)) alerts.push({ code: 'NO_TARIFABLE', message: 'Al menos una garantía tarifable con suma > 0' });
  const isComplete = alerts.length === 0;

  const toggleGuarantee = (code) => {
    const next = structuredClone(loc);
    const i = next.guarantees.findIndex(g => g.code === code);
    if (i >= 0) next.guarantees.splice(i, 1); else next.guarantees.push({ code, insuredValue: 0 });
    setLoc(next);
  };
  const updateGuaranteeValue = (code, val) => {
    const next = structuredClone(loc);
    const g = next.guarantees.find(g => g.code === code);
    if (g) g.insuredValue = +val || 0;
    setLoc(next);
  };

  const save = () => {
    const toSave = { ...loc, validationStatus: isComplete ? 'COMPLETE' : 'INCOMPLETE', blockingAlerts: alerts };
    const nextQuote = structuredClone(quote);
    const i = nextQuote.locations.findIndex(l => l.index === index);
    nextQuote.locations[i] = toSave;
    nextQuote.version++;
    nextQuote.updatedAt = new Date().toISOString();
    onSave(nextQuote);
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose}/>
      <div className="drawer">
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div className="row between mb-2">
            <div className="row gap-2">
              <span className="mono" style={{ fontSize: 12, color: 'var(--text-dim)' }}>Ubicación #{String(loc.index).padStart(2,'0')}</span>
              <Badge variant={isComplete ? 'ok' : 'warn'}>
                <Icon name={isComplete ? 'check-circle' : 'alert'} size={12}/>
                {isComplete ? 'Completa' : `${alerts.length} alerta${alerts.length===1?'':'s'}`}
              </Badge>
            </div>
            <Btn variant="ghost" icon="x" onClick={onClose}/>
          </div>
          <h2 style={{ margin: 0, fontSize: 20, letterSpacing: '-0.01em' }}>{loc.locationName || 'Sin nombre'}</h2>
          <div className="tabs mt-4" style={{ margin: '16px -24px -20px' }}>
            {[
              { id: 'basic',      label: 'Datos' },
              { id: 'construct',  label: 'Construcción' },
              { id: 'business',   label: 'Giro' },
              { id: 'guarantees', label: 'Garantías' },
            ].map(t => (
              <div key={t.id} className="tab" aria-selected={tab===t.id} onClick={()=>setTab(t.id)} style={{ padding: '10px 24px' }}>{t.label}</div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          {tab === 'basic' && (
            <div className="grid grid-2">
              <Field label="Nombre de ubicación" required span={2}>
                <Input value={loc.locationName} onChange={e => patch('locationName', e.target.value)}/>
              </Field>
              <Field label="Dirección" required span={2}>
                <Input value={loc.address} onChange={e => patch('address', e.target.value)}/>
              </Field>
              <Field label="Código postal" required error={!loc.zipCode ? 'Requerido' : (!window.SEED.zipDB[loc.zipCode] ? 'CP no encontrado en catálogo' : null)}>
                <Input className="input mono" value={loc.zipCode} onChange={e => onZipChange(e.target.value)} placeholder="06600 · 44100 · 64000"/>
              </Field>
              <Field label="Colonia">
                <Select value={loc.neighborhood} onChange={e => patch('neighborhood', e.target.value)} disabled={!window.SEED.zipDB[loc.zipCode]}>
                  {window.SEED.zipDB[loc.zipCode]?.neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
                </Select>
              </Field>
              <Field label="Municipio"><Input value={loc.municipality} disabled/></Field>
              <Field label="Estado"><Input value={loc.state} disabled/></Field>
              {loc.catastrophicZone && (
                <Field span={2} label="Zona catastrófica (resuelto automáticamente)">
                  <div className="row gap-2">
                    <Badge variant="info">TEV · {window.SEED.zipDB[loc.zipCode]?.tevZone}</Badge>
                    <Badge variant="info">FHM · {window.SEED.zipDB[loc.zipCode]?.fhmZone}</Badge>
                    <Badge variant="brand">{loc.catastrophicZone}</Badge>
                  </div>
                </Field>
              )}
            </div>
          )}

          {tab === 'construct' && (
            <div className="grid grid-2">
              <Field label="Tipo constructivo" required span={2}>
                <div className="grid grid-3" style={{ gap: 8 }}>
                  {window.SEED.constructionTypes.map(c => (
                    <label key={c.code} style={{ cursor: 'pointer' }}>
                      <input type="radio" checked={loc.constructionType===c.code} onChange={()=>patch('constructionType', c.code)} style={{ display: 'none' }}/>
                      <div style={{ padding: 10, borderRadius: 'var(--r-md)', fontSize: 13, textAlign: 'center', border: `1px solid ${loc.constructionType===c.code ? 'var(--brand-500)' : 'var(--border-strong)'}`, background: loc.constructionType===c.code ? 'color-mix(in oklch, var(--brand-500) 10%, transparent)' : 'var(--surface)' }}>{c.description}</div>
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Niveles" required><Input type="number" min={1} max={50} value={loc.level} onChange={e => patch('level', +e.target.value)}/></Field>
              <Field label="Año de construcción" required><Input type="number" min={1900} max={2026} value={loc.constructionYear} onChange={e => patch('constructionYear', +e.target.value)}/></Field>
            </div>
          )}

          {tab === 'business' && (
            <>
              <Field label="Giro / línea de negocio" required>
                <Select value={loc.businessLine.code} onChange={e => onBusinessLineChange(e.target.value)}>
                  <option value="">Seleccionar giro...</option>
                  {window.SEED.businessLines.map(b => <option key={b.code} value={b.code}>{b.description}</option>)}
                </Select>
              </Field>
              {loc.businessLine.code && (
                <div className="card card-pad mt-4" style={{ background: 'var(--surface-2)' }}>
                  <div className="row between">
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>Resuelto del catálogo</div>
                      <div style={{ fontWeight: 500 }}>{loc.businessLine.description}</div>
                      <div className="mono mt-2" style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                        Código: {loc.businessLine.code} · Clave incendio: <strong style={{ color: 'var(--brand-700)' }}>{loc.businessLine.fireKey}</strong>
                      </div>
                    </div>
                    <Icon name="check-circle" size={20} style={{ color: 'var(--ok)' }}/>
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'guarantees' && (
            <div className="col gap-2">
              <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 8 }}>Selecciona las garantías aplicables y su suma asegurada. Al menos una tarifable es obligatoria.</div>
              {window.SEED.guarantees.map(g => {
                const active = loc.guarantees.find(lg => lg.code === g.code);
                return (
                  <div key={g.code} className="row gap-3" style={{ padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: active ? 'var(--surface)' : 'var(--surface-2)' }}>
                    <input type="checkbox" className="chk" checked={!!active} onChange={() => toggleGuarantee(g.code)} />
                    <div className="grow">
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{g.description}</div>
                      <div className="mono" style={{ fontSize: 11, color: 'var(--text-mute)' }}>{g.code} · {g.tarifable ? 'tarifable' : 'no tarifable'}</div>
                    </div>
                    {active && (
                      <div style={{ width: 180 }}>
                        <div className="row" style={{ border: '1px solid var(--border-strong)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                          <span style={{ padding: '0 10px', background: 'var(--surface-2)', color: 'var(--text-dim)', fontSize: 12, borderRight: '1px solid var(--border)', lineHeight: '36px' }}>MXN</span>
                          <input className="input" style={{ border: 'none', borderRadius: 0, fontFamily: 'var(--font-mono)', textAlign: 'right' }} value={active.insuredValue} onChange={e => updateGuaranteeValue(g.code, e.target.value.replace(/[^0-9]/g,''))} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="row between mt-3" style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>Suma asegurada total</span>
                <span className="mono tabular" style={{ fontSize: 15, fontWeight: 600 }}>{window.fmtMoney(loc.guarantees.reduce((a,g)=>a+g.insuredValue,0), {decimals:0})}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
          {alerts.length > 0 && (
            <div className="alert alert-warn mb-4" style={{ padding: '10px 12px' }}>
              <Icon name="alert" size={16} style={{ color: 'var(--warn)' }}/>
              <div className="grow" style={{ fontSize: 12 }}>
                {alerts.map(a => <div key={a.code}>• {a.message}</div>)}
              </div>
            </div>
          )}
          <div className="row between">
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-mute)' }}>v{quote.version} → v{quote.version + 1}</span>
            <div className="row gap-2">
              <Btn onClick={onClose}>Cancelar</Btn>
              <Btn variant="primary" icon="check" onClick={save}>Guardar ubicación</Btn>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { LocationsStep, LocationDrawer });
