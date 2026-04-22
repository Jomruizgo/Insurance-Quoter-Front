/* global React, ReactDOM */
const { useState, useEffect, useMemo } = React;

function App() {
  const [tweaks, setTweaksState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sofka-tweaks')) || defaults(); } catch { return defaults(); }
  });
  function defaults() { return { theme: 'light', density: 'standard', primary: 'lime', data: 'partial' }; }
  const setTweaks = (t) => { setTweaksState(t); localStorage.setItem('sofka-tweaks', JSON.stringify(t)); };
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tweaks.theme);
    document.documentElement.setAttribute('data-density', tweaks.density);
    document.documentElement.setAttribute('data-primary', tweaks.primary);
  }, [tweaks]);

  // Navigation
  const [route, setRoute] = useState(() => localStorage.getItem('sofka-route') || 'dashboard'); // dashboard | folio
  const [step, setStep] = useState(() => localStorage.getItem('sofka-step') || 'general');
  useEffect(() => { localStorage.setItem('sofka-route', route); }, [route]);
  useEffect(() => { localStorage.setItem('sofka-step', step); }, [step]);

  // Quote state — reset when tweaks.data changes
  const [quote, setQuote] = useState(() => buildQuote(tweaks.data));
  useEffect(() => { setQuote(buildQuote(tweaks.data)); }, [tweaks.data]);

  function buildQuote(mode) {
    const q = structuredClone(window.SEED.quote);
    if (mode === 'empty') {
      q.insuredData = { name: '', rfc: '', email: '', phone: '' };
      q.locations = [];
      q.netPremium = null; q.commercialPremium = null; q.premiumsByLocation = null;
    } else if (mode === 'full') {
      // Fix incomplete location #2
      q.locations[1].zipCode = '44100';
      q.locations[1].state = 'Jalisco'; q.locations[1].municipality = 'Guadalajara'; q.locations[1].neighborhood = 'Centro'; q.locations[1].city = 'Guadalajara';
      q.locations[1].catastrophicZone = 'ZONE_B';
      q.locations[1].businessLine = { code: 'BL-002', fireKey: 'FK-INC-02', description: 'Oficina administrativa' };
      q.locations[1].guarantees = [{ code: 'GUA-FIRE', insuredValue: 1800000 }, { code: 'GUA-ELEC', insuredValue: 300000 }];
      q.locations[1].validationStatus = 'COMPLETE';
      q.locations[1].blockingAlerts = [];
      const r = window.calculatePremiums(q);
      q.netPremium = r.netPremium; q.commercialPremium = r.commercialPremium; q.premiumsByLocation = r.premiumsByLocation;
      q.quoteStatus = 'CALCULATED';
    }
    return q;
  }

  // Step validation status
  const stepStatus = useMemo(() => {
    const s = {};
    s.general = (quote.insuredData.name && quote.insuredData.rfc) ? 'COMPLETE' : 'INCOMPLETE';
    s.layout = quote.layoutConfiguration ? 'COMPLETE' : 'INCOMPLETE';
    const locComplete = quote.locations.filter(l => l.validationStatus === 'COMPLETE').length;
    s.locations = quote.locations.length === 0 ? 'PENDING' : locComplete === quote.locations.length ? 'COMPLETE' : 'INCOMPLETE';
    s.coverage = (quote.coverageOptions || window.SEED.coverageOptions).some(o => o.selected) ? 'COMPLETE' : 'PENDING';
    s.calculate = quote.netPremium != null ? 'COMPLETE' : 'PENDING';
    return s;
  }, [quote]);

  // Drawer
  const [editingIndex, setEditingIndex] = useState(null);

  // New folio
  const [newOpen, setNewOpen] = useState(false);
  const [tweaksOpen, setTweaksOpen] = useState(false);

  // Navigation handlers
  const goStep = (id) => setStep(id);
  const nextStep = () => {
    const i = window.STEPS.findIndex(s => s.id === step);
    if (i < window.STEPS.length - 1) setStep(window.STEPS[i+1].id);
  };
  const prevStep = () => {
    const i = window.STEPS.findIndex(s => s.id === step);
    if (i > 0) setStep(window.STEPS[i-1].id);
  };

  const onCalculate = (r) => {
    setQuote({ ...quote, netPremium: r.netPremium, commercialPremium: r.commercialPremium, premiumsByLocation: r.premiumsByLocation, quoteStatus: 'CALCULATED' });
  };

  // ---------- RENDER ----------
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader folioNumber={route === 'folio' ? quote.folioNumber : null} onHome={() => setRoute('dashboard')} onToggleTweaks={() => setTweaksOpen(!tweaksOpen)} tweaksOpen={tweaksOpen}/>

      {route === 'folio' && <Stepper currentStep={step} stepStatus={stepStatus} onGo={goStep}/>}

      <main style={{ flex: 1, padding: '32px 24px', maxWidth: 1400, width: '100%', margin: '0 auto' }}>
        {route === 'dashboard' && (
          <Dashboard
            onOpenFolio={(f) => { setRoute('folio'); setStep('general'); }}
            onNewFolio={() => setNewOpen(true)}
          />
        )}

        {route === 'folio' && (
          <>
            {step === 'general'    && <GeneralInfo quote={quote} onChange={setQuote}/>}
            {step === 'layout'     && <LayoutStep quote={quote} onChange={setQuote}/>}
            {step === 'locations'  && <LocationsStep quote={quote} onChange={setQuote} onEdit={setEditingIndex}/>}
            {step === 'coverage'   && <CoverageStep quote={quote} onChange={setQuote}/>}
            {step === 'calculate'  && <CalculateStep quote={quote} onCalculate={onCalculate}/>}

            {/* Nav */}
            <div className="row between mt-6" style={{ paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <Btn icon="arrow-left" onClick={prevStep} disabled={step === window.STEPS[0].id}>Anterior</Btn>
              <div className="row gap-2">
                <Btn variant="ghost">Guardar borrador</Btn>
                {step !== 'calculate'
                  ? <Btn variant="primary" iconRight="arrow-right" onClick={nextStep}>Siguiente</Btn>
                  : quote.netPremium == null && <Btn variant="primary" icon="sparkle" onClick={() => { const r = window.calculatePremiums(quote); onCalculate(r); }}>Ejecutar cálculo</Btn>}
              </div>
            </div>
          </>
        )}
      </main>

      {route === 'folio' && <StatusBar quote={quote}/>}

      {editingIndex != null && (
        <LocationDrawer
          quote={quote}
          index={editingIndex}
          onClose={() => setEditingIndex(null)}
          onSave={(q) => { setQuote(q); setEditingIndex(null); }}
        />
      )}

      {newOpen && (
        <NewFolioModal
          onClose={() => setNewOpen(false)}
          onCreate={() => { setNewOpen(false); setRoute('folio'); setStep('general'); }}
        />
      )}

      <TweaksPanel open={tweaksOpen} tweaks={tweaks} setTweaks={setTweaks} onClose={() => setTweaksOpen(false)}/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
