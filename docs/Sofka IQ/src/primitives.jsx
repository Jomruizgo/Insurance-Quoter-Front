/* global React */
const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } = React;

// ============ ICONS (inline SVG) ============
const Icon = ({ name, size = 16, stroke = 1.6, style, className }) => {
  const s = { width: size, height: size, flexShrink: 0, ...style };
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round', className, style: s };
  const paths = {
    'file':        <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></>,
    'plus':        <><path d="M12 5v14M5 12h14"/></>,
    'search':      <><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></>,
    'filter':      <><path d="M3 6h18M7 12h10M10 18h4"/></>,
    'chevron-right':<path d="m9 18 6-6-6-6"/>,
    'chevron-down':<path d="m6 9 6 6 6-6"/>,
    'chevron-left':<path d="m15 18-6-6 6-6"/>,
    'check':       <path d="M20 6 9 17l-5-5"/>,
    'x':           <path d="M18 6 6 18M6 6l12 12"/>,
    'edit':        <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"/></>,
    'trash':       <><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></>,
    'dots':        <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    'alert':       <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></>,
    'info':        <><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></>,
    'check-circle':<><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></>,
    'x-circle':    <><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></>,
    'map-pin':     <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>,
    'building':    <><path d="M3 21h18M6 21V7l6-4 6 4v14"/><path d="M10 9h.01M14 9h.01M10 13h.01M14 13h.01M10 17h.01M14 17h.01"/></>,
    'calculator':  <><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h8"/></>,
    'shield':      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    'layers':      <><path d="m12 2 10 6-10 6L2 8z"/><path d="m2 17 10 6 10-6M2 12l10 6 10-6"/></>,
    'settings':    <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    'arrow-right':<path d="M5 12h14M12 5l7 7-7 7"/>,
    'arrow-left': <path d="M19 12H5M12 19l-7-7 7-7"/>,
    'download':    <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></>,
    'copy':        <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    'sparkle':     <><path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.64 5.64l4.24 4.24M14.12 14.12l4.24 4.24M5.64 18.36l4.24-4.24M14.12 9.88l4.24-4.24"/></>,
    'cog':         <><circle cx="12" cy="12" r="3"/><path d="m19.4 15-.45-.26a1.5 1.5 0 0 1 0-2.48l.45-.26a1.5 1.5 0 0 0 .55-2.05l-1-1.73a1.5 1.5 0 0 0-2.05-.55l-.45.26a1.5 1.5 0 0 1-2.15-1.24V6a1.5 1.5 0 0 0-1.5-1.5h-2A1.5 1.5 0 0 0 9.3 6v.52a1.5 1.5 0 0 1-2.15 1.24l-.45-.26a1.5 1.5 0 0 0-2.05.55l-1 1.73a1.5 1.5 0 0 0 .55 2.05l.45.26a1.5 1.5 0 0 1 0 2.48l-.45.26a1.5 1.5 0 0 0-.55 2.05l1 1.73a1.5 1.5 0 0 0 2.05.55l.45-.26a1.5 1.5 0 0 1 2.15 1.24V18a1.5 1.5 0 0 0 1.5 1.5h2a1.5 1.5 0 0 0 1.5-1.5v-.52a1.5 1.5 0 0 1 2.15-1.24l.45.26a1.5 1.5 0 0 0 2.05-.55l1-1.73a1.5 1.5 0 0 0-.55-2.05z"/></>,
    'clock':       <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
    'eye':         <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    'grid':        <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
    'list':        <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></>,
  };
  return <svg {...common}>{paths[name] || null}</svg>;
};

// ============ PRIMITIVES ============
function Btn({ variant='secondary', size, icon, iconRight, children, ...props }) {
  const cls = ['btn', `btn-${variant}`, size ? `btn-${size}` : '', !children && icon ? 'btn-icon' : ''].filter(Boolean).join(' ');
  return (
    <button className={cls} {...props}>
      {icon && <Icon name={icon} size={size === 'xs' ? 12 : size === 'sm' ? 14 : 16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'xs' ? 12 : 14} />}
    </button>
  );
}

function Badge({ variant='', children, dot }) {
  return <span className={`badge ${variant ? 'badge-'+variant : ''}`}>{dot && <span className="dot" style={{ background: dot }}/>}{children}</span>;
}

function Field({ label, required, help, error, children, span }) {
  return (
    <div className="field" style={span ? { gridColumn: `span ${span}` } : undefined}>
      {label && <label className="field-label">{label}{required && <span className="req">*</span>}</label>}
      {children}
      {error ? <div className="field-error"><Icon name="alert" size={12}/>{error}</div> : help ? <div className="field-help">{help}</div> : null}
    </div>
  );
}

function Input(props) { return <input className="input" {...props} />; }
function Select({ children, ...props }) { return <select className="select" {...props}>{children}</select>; }
function Textarea(props) { return <textarea className="textarea" {...props} />; }

function Switch({ on, onChange }) {
  return <div className="switch" data-on={on ? 'true':'false'} onClick={() => onChange(!on)} role="switch" aria-checked={on} tabIndex={0} onKeyDown={e => (e.key==='Enter'||e.key===' ') && onChange(!on)} />;
}

function StatusBadge({ status }) {
  const m = window.STATUS_META[status] || { label: status, cls: '' };
  return <Badge variant={m.cls.replace('badge-','').replace('badge','')} dot={m.dot}>{m.label}</Badge>;
}

function Sparkline({ pct, height = 4 }) {
  return <div className="progress" style={{ height }}><div className="progress-bar" style={{ width: `${pct}%` }}/></div>;
}

function SectionHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="row between gap-4" style={{ padding: '0 0 20px 0', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
      <div>
        {eyebrow && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 6 }}>{eyebrow}</div>}
        <h1 style={{ margin: 0, fontSize: 24, letterSpacing: '-0.02em', fontWeight: 600 }}>{title}</h1>
        {subtitle && <p style={{ margin: '6px 0 0', color: 'var(--text-dim)', fontSize: 14 }}>{subtitle}</p>}
      </div>
      {actions && <div className="row gap-2">{actions}</div>}
    </div>
  );
}

Object.assign(window, { Icon, Btn, Badge, Field, Input, Select, Textarea, Switch, StatusBadge, Sparkline, SectionHeader });
