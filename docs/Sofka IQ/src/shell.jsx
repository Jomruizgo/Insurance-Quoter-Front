/* global React */
const { useState, useEffect, useRef } = React;

// ============ APP SHELL ============
function AppHeader({ folioNumber, onHome, onToggleTweaks, tweaksOpen }) {
  return (
    <header style={{
      height: 56, borderBottom: '1px solid var(--border)', background: 'var(--surface)',
      display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16, position: 'sticky', top: 0, zIndex: 30,
    }}>
      <div className="row gap-2" onClick={onHome} style={{ cursor: 'pointer' }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--ink-900)', color: 'var(--brand-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, letterSpacing: '-0.04em' }}>IQ</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Sofka IQ</div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: -2, letterSpacing: '0.02em' }}>Cotizador de Daños</div>
        </div>
      </div>

      <div className="row gap-2" style={{ marginLeft: 24, color: 'var(--text-dim)', fontSize: 13 }}>
        <span style={{ color: 'var(--text-mute)' }}>/</span>
        <span style={{ cursor: 'pointer' }} onClick={onHome}>Cotizaciones</span>
        {folioNumber && <>
          <span style={{ color: 'var(--text-mute)' }}>/</span>
          <span className="mono" style={{ color: 'var(--text)', fontWeight: 500 }}>{folioNumber}</span>
        </>}
      </div>

      <div className="grow"/>

      <div className="row gap-2">
        <div style={{ position: 'relative' }}>
          <Icon name="search" size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-mute)' }}/>
          <input className="input" placeholder="Buscar…" style={{ width: 220, height: 32, paddingLeft: 30, fontSize: 13 }}/>
          <span className="kbd" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>⌘K</span>
        </div>
        <Btn variant="ghost" icon="cog" aria-label="Preferencias"/>
        <Btn variant={tweaksOpen?'secondary':'ghost'} icon="sparkle" size="sm" onClick={onToggleTweaks}>Tweaks</Btn>
        <div className="row gap-2" style={{ paddingLeft: 12, borderLeft: '1px solid var(--border)' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--brand-200)', color: 'var(--ink-900)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>LT</div>
          <div style={{ fontSize: 12 }}>
            <div style={{ fontWeight: 500 }}>Laura T.</div>
            <div style={{ color: 'var(--text-dim)', fontSize: 11 }}>Suscriptor</div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Stepper({ currentStep, stepStatus, onGo }) {
  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', position: 'sticky', top: 56, zIndex: 20 }}>
      <div className="stepper" style={{ flexWrap: 'wrap' }}>
        {window.STEPS.map((s, i) => {
          const complete = stepStatus[s.id] === 'COMPLETE';
          const current = currentStep === s.id;
          return (
            <React.Fragment key={s.id}>
              <div className="step" data-complete={complete} aria-current={current} onClick={() => onGo(s.id)}>
                <div className="step-num">{complete ? <Icon name="check" size={12}/> : i+1}</div>
                <span>{s.label}</span>
                {stepStatus[s.id] === 'INCOMPLETE' && <Icon name="alert" size={12} style={{ color: 'var(--warn)' }}/>}
              </div>
              {i < window.STEPS.length - 1 && <div className="step-sep"/>}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function TweaksPanel({ open, tweaks, setTweaks, onClose }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, width: 300, zIndex: 200,
      background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--sh-pop)', overflow: 'hidden',
    }}>
      <div className="row between" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <div className="row gap-2"><Icon name="sparkle" size={14} style={{ color: 'var(--brand-700)' }}/><strong style={{ fontSize: 13 }}>Tweaks</strong></div>
        <Btn variant="ghost" size="xs" icon="x" onClick={onClose}/>
      </div>
      <div style={{ padding: 14 }} className="col gap-4">
        <TweakRow label="Tema">
          <div className="row gap-1" style={{ background: 'var(--surface-2)', padding: 2, borderRadius: 'var(--r-sm)' }}>
            {['light','dark'].map(t => (
              <button key={t} onClick={() => setTweaks({ ...tweaks, theme: t })} className="btn btn-xs" style={{ flex: 1, background: tweaks.theme === t ? 'var(--surface)' : 'transparent', border: 'none', boxShadow: tweaks.theme === t ? 'var(--sh-1)' : 'none' }}>{t === 'light' ? 'Claro' : 'Oscuro'}</button>
            ))}
          </div>
        </TweakRow>
        <TweakRow label="Densidad">
          <div className="row gap-1" style={{ background: 'var(--surface-2)', padding: 2, borderRadius: 'var(--r-sm)' }}>
            {[['compact','Compacta'],['standard','Estándar'],['cozy','Espaciosa']].map(([v,l]) => (
              <button key={v} onClick={() => setTweaks({ ...tweaks, density: v })} className="btn btn-xs" style={{ flex: 1, background: tweaks.density === v ? 'var(--surface)' : 'transparent', border: 'none', boxShadow: tweaks.density === v ? 'var(--sh-1)' : 'none' }}>{l}</button>
            ))}
          </div>
        </TweakRow>
        <TweakRow label="Color primario">
          <div className="row gap-2">
            {[['lime','#D4F04C'],['teal','#5EC1B1'],['indigo','#7C6BFF'],['amber','#F3B84C']].map(([v, c]) => (
              <button key={v} onClick={() => setTweaks({ ...tweaks, primary: v })} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: tweaks.primary === v ? '2px solid var(--text)' : '2px solid var(--border)', cursor: 'pointer', padding: 0 }}/>
            ))}
          </div>
        </TweakRow>
        <TweakRow label="Datos del folio">
          <div className="row gap-1" style={{ background: 'var(--surface-2)', padding: 2, borderRadius: 'var(--r-sm)' }}>
            {[['empty','Vacío'],['partial','Parcial'],['full','Completo']].map(([v,l]) => (
              <button key={v} onClick={() => setTweaks({ ...tweaks, data: v })} className="btn btn-xs" style={{ flex: 1, background: tweaks.data === v ? 'var(--surface)' : 'transparent', border: 'none', boxShadow: tweaks.data === v ? 'var(--sh-1)' : 'none' }}>{l}</button>
            ))}
          </div>
        </TweakRow>
        <div style={{ fontSize: 11, color: 'var(--text-mute)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          Prototipo en HTML — UI de referencia para implementación en Angular con Atomic Design. <a href="atomic.html" style={{ color: 'var(--brand-700)' }}>Ver inventario atómico →</a>
        </div>
      </div>
    </div>
  );
}
function TweakRow({ label, children }) {
  return <div><div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: 6 }}>{label}</div>{children}</div>;
}

// Status bar at the bottom: persistent folio summary
function StatusBar({ quote, onCalculate }) {
  const complete = quote.locations.filter(l => l.validationStatus === 'COMPLETE').length;
  const total = quote.locations.length;
  const pct = total === 0 ? 0 : Math.round((complete / total) * 100);
  return (
    <div style={{
      position: 'sticky', bottom: 0, background: 'var(--surface)', borderTop: '1px solid var(--border)',
      padding: '10px 20px', zIndex: 10,
    }}>
      <div className="row gap-4 between">
        <div className="row gap-4">
          <div className="row gap-2">
            <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Folio</span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 500 }}>{quote.folioNumber}</span>
            <StatusBadge status={quote.quoteStatus}/>
          </div>
          <div style={{ width: 1, height: 20, background: 'var(--border)' }}/>
          <div className="row gap-2">
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Progreso:</span>
            <div style={{ width: 120 }}><Sparkline pct={pct}/></div>
            <span className="tabular" style={{ fontSize: 12, fontWeight: 500 }}>{pct}%</span>
          </div>
          <div style={{ width: 1, height: 20, background: 'var(--border)' }}/>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            {complete}/{total} ubicaciones completas · versión <span className="mono" style={{ color: 'var(--text)' }}>v{quote.version}</span>
          </div>
        </div>
        <div className="row gap-2">
          <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>Guardado {new Date(quote.updatedAt).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}</span>
        </div>
      </div>
    </div>
  );
}

// ============ NEW FOLIO MODAL ============
function NewFolioModal({ onClose, onCreate }) {
  const [sub, setSub] = useState('SUB-001');
  const [agent, setAgent] = useState('AGT-123');
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose}/>
      <div style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 480, background: 'var(--bg)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-pop)', border: '1px solid var(--border-strong)', zIndex: 150, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div className="row between"><h2 style={{ margin: 0, fontSize: 18 }}>Nuevo folio</h2><Btn variant="ghost" icon="x" onClick={onClose}/></div>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-dim)' }}>Se generará un folio secuencial con idempotencia.</p>
        </div>
        <div style={{ padding: 24 }} className="col gap-4">
          <Field label="Suscriptor" required>
            <Select value={sub} onChange={e => setSub(e.target.value)}>
              {window.SEED.subscribers.map(s => <option key={s.id} value={s.id}>{s.id} — {s.name}</option>)}
            </Select>
          </Field>
          <Field label="Agente" required>
            <Select value={agent} onChange={e => setAgent(e.target.value)}>
              {window.SEED.agents.filter(a => a.subscriberId === sub).map(a => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
            </Select>
          </Field>
          <div className="alert alert-info" style={{ fontSize: 12 }}>
            <Icon name="info" size={14} style={{ color: 'var(--info)' }}/>
            <div><strong>POST /v1/folios</strong> — endpoint idempotente. Si ya existe un folio sin cotización para estos parámetros, se retorna el existente.</div>
          </div>
        </div>
        <div className="row between" style={{ padding: 16, borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
          <Btn onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" icon="plus" onClick={() => onCreate({ sub, agent })}>Crear folio</Btn>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { AppHeader, Stepper, TweaksPanel, StatusBar, NewFolioModal });
