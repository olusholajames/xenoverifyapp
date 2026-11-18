import React from 'react';
import { FileText, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Header({ systemInfo, apiConnected }) {
  const docsUrl = `${API_BASE_URL.replace(/\/$/, '')}/docs/`;

  return (
    <header className="header-bar">
      <div className="logo-badge">
        <div className="logo-icon" aria-hidden="true">
          <ShieldCheck size={25} color="#fff" />
        </div>
        <div>
          <h1 className="brand-title">Xenoverify</h1>
          <p className="brand-subtitle">Selective-disclosure identity research prototype</p>
        </div>
      </div>

      <div className="header-meta">
        <span className={`badge ${apiConnected ? 'badge-emerald' : 'badge-amber'}`} role="status">
          <span className={`status-dot ${apiConnected ? 'is-online' : ''}`} aria-hidden="true" />
          {apiConnected ? 'API connected' : 'API unavailable'}
        </span>
        <span className="badge badge-purple">XV-FINAL-01</span>
        <a href={docsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary docs-link">
          <FileText size={15} aria-hidden="true" /> API documentation
        </a>
      </div>
    </header>
  );
}
