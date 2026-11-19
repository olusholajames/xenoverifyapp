import React from 'react';
import { AlertTriangle, CheckCircle2, FileText, LockKeyhole } from 'lucide-react';

const scopeRows = [
  {
    component: 'ML-DSA-65 signing',
    status: 'Demonstrated locally',
    treatment: 'FIPS 204 implementation; cross-checked against the ML-DSA API exposed by linked OpenSSL.',
  },
  {
    component: 'Selective disclosure',
    status: 'Demonstrated locally',
    treatment: 'Canonical claim encoding and positional Merkle inclusion proofs. Not a zero-knowledge proof.',
  },
  {
    component: 'Credential verification',
    status: 'Demonstrated locally',
    treatment: 'Active local issuer registry, simulated status ledger, Merkle proof, signature and one-time challenge.',
  },
  {
    component: 'Holder wallet',
    status: 'Simulated',
    treatment: 'Local database stores the issued credential for this research prototype.',
  },
  {
    component: 'Issuer registry and status ledger',
    status: 'Simulated',
    treatment: 'Local database is the trusted registry/status source; it is not a decentralized ledger.',
  },
];

export default function ScopeTab({ systemInfo }) {
  const acceptanceCount = systemInfo?.study_scope?.acceptance_executions || 100;

  return (
    <div className="scope-layout">
      <section className="card" aria-labelledby="scope-heading">
        <div className="card-header">
          <div>
            <h2 id="scope-heading" className="card-title">
              <FileText size={18} strokeWidth={1.75} aria-hidden="true" />
              Project scope and evidence
            </h2>
            <p className="section-description">The implemented cryptographic functions are separated from simulated infrastructure</p>
          </div>
        </div>

        <div className="table-scroll">
          <table className="scope-table">
            <thead>
              <tr><th scope="col">Component</th><th scope="col">Status</th><th scope="col">Evaluation treatment</th></tr>
            </thead>
            <tbody>
              {scopeRows.map((row) => (
                <tr key={row.component}>
                  <th scope="row">{row.component}</th>
                  <td><span className={`badge ${row.status === 'Simulated' ? 'badge-amber' : 'badge-emerald'}`}>{row.status}</span></td>
                  <td>{row.treatment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="scope-details">
        <section className="card" aria-labelledby="protocol-heading">
          <h3 id="protocol-heading" className="card-title">
            <LockKeyhole size={18} strokeWidth={1.75} aria-hidden="true" />
            Frozen evaluation protocol
          </h3>
          <dl className="metadata-list">
            <div><dt>Primary comparison</dt><dd>ML-DSA-65 vs ECDSA secp256k1 / SHA-256</dd></div>
            <div><dt>Workload</dt><dd>One synthetic credential with {systemInfo?.study_scope?.claim_count || 6} string claims; disclose full name and nationality.</dd></div>
            <div><dt>Acceptance</dt><dd>{acceptanceCount} sequential functional executions, separate from timing trials.</dd></div>
            <div><dt>Timing trials</dt><dd>5 warm-ups + 50 measured trials for key generation, signing and verification.</dd></div>
            <div><dt>Tree format</dt><dd>SHA-256; 0x00 leaves, 0x01 internal nodes, positional paths and odd-node promotion.</dd></div>
          </dl>
        </section>

        <section className="card" aria-labelledby="limits-heading">
          <h3 id="limits-heading" className="card-title">
            <AlertTriangle size={18} strokeWidth={1.75} aria-hidden="true" />
            Claims and limitations
          </h3>
          <ul className="limitation-list">
            <li>No zero-knowledge, zero-leakage, unlinkability or holder-authentication claim.</li>
            <li>Challenges provide bounded replay control; copied credential material can be presented with a fresh challenge.</li>
            <li>The local issuer registry, wallet and status ledger are simulated and trusted for this study.</li>
            <li>No production wallet, decentralized ledger, regulatory conformity or quantum-safe absolute is claimed.</li>
            <li>Use synthetic values only; expiry is not enforced by this protocol.</li>
          </ul>
        </section>
      </div>

      <p className="evidence-note"><CheckCircle2 size={16} strokeWidth={1.75} aria-hidden="true" /> Acceptance and negative-case evidence is preserved as raw artifacts with its environment manifest.</p>
    </div>
  );
}
