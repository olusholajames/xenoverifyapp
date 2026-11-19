import React from 'react';
import { Activity, Cpu, Fingerprint, Key } from 'lucide-react';

const tabs = [
  { id: 'dsrm', label: 'Scope & specifications', icon: Cpu },
  { id: 'issuer', label: 'Issuer & signing', icon: Key },
  { id: 'disclosure', label: 'Selective disclosure', icon: Fingerprint },
  { id: 'benchmarks', label: 'Evaluation evidence', icon: Activity },
];

export default function NavigationTabs({ activeTab, setActiveTab }) {
  return (
    <nav className="nav-tabs" aria-label="Project sections">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className={`nav-tab-btn ${activeTab === id ? 'active' : ''}`}
          aria-current={activeTab === id ? 'page' : undefined}
          onClick={() => {
            setActiveTab(id);
            window.history.replaceState(null, '', `#${id}`);
            window.scrollTo(0, 0);
          }}
        >
          <Icon size={16} strokeWidth={1.75} aria-hidden="true" /> {label}
        </button>
      ))}
    </nav>
  );
}
