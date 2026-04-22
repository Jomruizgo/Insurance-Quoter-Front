/* global React */
const { useState, useEffect, useMemo } = React;

// ============ GENERAL INFO ============
function GeneralInfo({ quote, onChange }) {
  const insured = quote.insuredData;
  const uw = quote.underwritingData;
  const patch = (path, val) => {
    const next = structuredClone(quote);
    const keys = path.split('.');
    let o = next; for (let i = 0; i < keys.length-1; i++) o = o[keys[i]];
    o[keys.at(-1)] = val;
    onChange(next);
  };

  return (
    <>
      <SectionHeader eyebrow={`Folio ${quote.folioNumber} · Paso 1 de 5`} title="Datos generales"
        subtitle="Captura la información del asegurado y suscripción. Todos los campos marcados con * son obligatorios."
      />

      <div className="card card-pad mb-4">
        <div className="row between mb-4">
          <div><div className="card-title">Asegurado</div><div className="card-subtitle">Persona moral o física titular del contrato</div></div>
          <Badge variant="ok" dot="currentColor">Completo</Badge>
        </div>
        <div className="grid grid-2">
          <Field label="Razón social" required>
            <Input value={insured.name} onChange={e => patch('insuredData.name', e.target.value)} />
          </Field>
          <Field label="RFC" required help="13 caracteres — persona moral o física">
            <Input value={insured.rfc} onChange={e => patch('insuredData.rfc', e.target.value.toUpperCase())} className="input mono" />
          </Field>
          <Field label="Correo de contacto" required>
            <Input type="email" value={insured.email} onChange={e => patch('insuredData.email', e.target.value)} />
          </Field>
          <Field label="Teléfono" required>
            <Input value={insured.phone} onChange={e => patch('insuredData.phone', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="card card-pad">
        <div className="row between mb-4">
          <div><div className="card-title">Suscripción</div><div className="card-subtitle">Asignación técnica y clasificación de riesgo</div></div>
        </div>
        <div className="grid grid-2">
          <Field label="Suscriptor" required>
            <Select value={uw.subscriberId} onChange={e => patch('underwritingData.subscriberId', e.target.value)}>
              {window.SEED.subscribers.map(s => <option key={s.id} value={s.id}>{s.id} — {s.name}</option>)}
            </Select>
          </Field>
          <Field label="Agente" required>
            <Select value={uw.agentCode} onChange={e => patch('underwritingData.agentCode', e.target.value)}>
              {window.SEED.agents.filter(a => a.subscriberId === uw.subscriberId).map(a => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
            </Select>
          </Field>
          <Field label="Clasificación de riesgo" required>
            <Select value={uw.riskClassification} onChange={e => patch('underwritingData.riskClassification', e.target.value)}>
              {window.SEED.riskClassifications.map(r => <option key={r.code} value={r.code}>{r.description}</option>)}
            </Select>
          </Field>
          <Field label="Tipo de negocio" required>
            <Select value={uw.businessType} onChange={e => patch('underwritingData.businessType', e.target.value)}>
              {window.SEED.businessTypes.map(b => <option key={b.code} value={b.code}>{b.description}</option>)}
            </Select>
          </Field>
        </div>

        <div className="alert alert-info mt-6">
          <Icon name="info" size={18} style={{ color: 'var(--info)' }}/>
          <div><div className="alert-title">Versionado optimista activo</div>Cualquier cambio incrementará la versión del folio. Actual: <span className="mono">v{quote.version}</span></div>
        </div>
      </div>
    </>
  );
}

// ============ LAYOUT STEP ============
function LayoutStep({ quote, onChange }) {
  const cfg = quote.layoutConfiguration;
  const patch = (k,v) => onChange({ ...quote, layoutConfiguration: { ...cfg, [k]: v } });
  return (
    <>
      <SectionHeader eyebrow={`Folio ${quote.folioNumber} · Paso 2 de 5`} title="Layout de ubicaciones"
        subtitle="Configura la cantidad y el tipo de ubicaciones a registrar en esta cotización."
      />
      <div className="card card-pad">
        <div className="grid grid-2">
          <Field label="Número de ubicaciones" required help="Entre 1 y 50">
            <Input type="number" min={1} max={50} value={cfg.numberOfLocations} onChange={e => patch('numberOfLocations', +e.target.value)} />
          </Field>
          <Field label="Tipo de ubicación" required>
            <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
              {[{v:'SINGLE',l:'Ubicación única'},{v:'MULTIPLE',l:'Múltiples ubicaciones'},{v:'DISTRIBUTED',l:'Distribuida'}].map(o => (
                <label key={o.v} style={{ flex: 1, minWidth: 140, cursor:'pointer' }}>
                  <input type="radio" name="ltype" checked={cfg.locationType===o.v} onChange={()=>patch('locationType', o.v)} style={{ display:'none' }}/>
                  <div style={{ padding: 14, borderRadius: 'var(--r-md)', border: `1px solid ${cfg.locationType===o.v?'var(--brand-500)':'var(--border-strong)'}`, background: cfg.locationType===o.v?'color-mix(in oklch, var(--brand-500) 10%, transparent)':'var(--surface)', transition: 'all 120ms' }}>
                    <div className="row between"><div style={{ fontWeight: 500, fontSize: 13 }}>{o.l}</div>{cfg.locationType===o.v && <Icon name="check-circle" size={14} style={{ color: 'var(--brand-700)'}}/>}</div>
                  </div>
                </label>
              ))}
            </div>
          </Field>
        </div>

        <div className="divider"/>
        <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
          Este layout se replicará como plantilla al registrar ubicaciones. Podrás sobrescribirlo ubicación por ubicación.
        </div>
      </div>
    </>
  );
}

Object.assign(window, { GeneralInfo, LayoutStep });
