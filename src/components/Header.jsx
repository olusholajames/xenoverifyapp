import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function Header({ apiConnected }) {
  return (
    <div className="sidebar-brand">
      <div className="brand-row">
        <div className="logo-icon" aria-hidden="true">
          <ShieldCheck size={20} strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="brand-title">Xenoverify</h1>
          <p className="brand-subtitle">Selective-disclosure identity research prototype</p>
        </div>
      </div>
      <div className="brand-meta">
        <span className={`api-status ${apiConnected ? 'is-online' : ''}`} role="status">
          <span className="status-dot" aria-hidden="true" />
          {apiConnected ? 'API connected' : 'API unavailable'}
        </span>
        <span className="mono-meta">XV-FINAL-01</span>
      </div>
    </div>
  );
}
