import React from 'react';
import { BadgeCheck, KeyRound, Plus, ShieldCheck } from 'lucide-react';

const claimFields = [
  { key: 'fullName', label: 'Synthetic full name', maxLength: 120 },
  { key: 'nin', label: 'Synthetic identifier', maxLength: 32 },
  { key: 'dob', label: 'Date of birth', type: 'date', maxLength: 10 },
  { key: 'nationality', label: 'Nationality', maxLength: 64 },
  { key: 'clearanceLevel', label: 'Clearance tier', maxLength: 64 },
  { key: 'residence', label: 'Fictional residence', maxLength: 160 },
];

export default function IssuerTab({
  issuers,
  issuer,
  selectedIssuerDid,
  setSelectedIssuerDid,
  selectedCred,
  credentials,
  selectedCredentialId,
  setSelectedCredentialId,
  newAttrs,
  setNewAttrs,
  handleInitIssuer,
  handleIssueCredential,
  loading,
}) {
  return (
    <div className="issuer-layout">
      <section className="card" aria-labelledby="issuer-heading">
        <div className="card-header">
          <div>
            <h2 id="issuer-heading" className="card-title">
              <KeyRound size={19} color="var(--accent-cyan)" aria-hidden="true" />
              Local issuer registry
            </h2>
            <p className="section-description">Issuer signing keys stay on the backend; this page receives public metadata only.</p>
          </div>
          <BadgeCheck size={21} color="var(--accent-emerald)" aria-hidden="true" />
        </div>

        {issuers.length > 0 ? (
          <div className="form-group">
            <label className="form-label" htmlFor="issuer-select">Trusted issuer</label>
            <select
              className="form-input"
              id="issuer-select"
              value={selectedIssuerDid}
              onChange={(event) => setSelectedIssuerDid(event.target.value)}
              disabled={loading}
            >
              {issuers.map((item) => (
                <option key={item.did} value={item.did}>{item.entity_name} · {item.scheme}</option>
              ))}
            </select>
          </div>
        ) : (
          <p className="empty-state">No local issuer is registered yet. Create a synthetic issuer to begin.</p>
        )}

        {issuer && (
          <dl className="metadata-list">
            <div><dt>Status</dt><dd><span className="badge badge-emerald">Active in local registry</span></dd></div>
            <div><dt>Scheme</dt><dd>{issuer.scheme}</dd></div>
            <div><dt>Issuer DID</dt><dd className="break-word">{issuer.did}</dd></div>
            <div><dt>Public key</dt><dd>{issuer.public_key_bytes} bytes · {issuer.public_key_b64?.length || 0} base64 characters</dd></div>
          </dl>
        )}

        <div className="issuer-actions">
          <button className="btn btn-secondary" onClick={() => handleInitIssuer('ML-DSA-65')} disabled={loading}>
            <Plus size={15} aria-hidden="true" /> Initialize ML-DSA-65 issuer
          </button>
          <button className="btn btn-secondary" onClick={() => handleInitIssuer('ECDSA-secp256k1-SHA256')} disabled={loading}>
            <Plus size={15} aria-hidden="true" /> Initialize ECDSA baseline
          </button>
        </div>
      </section>

      <section className="card" aria-labelledby="credential-heading">
        <div className="card-header">
          <div>
            <h2 id="credential-heading" className="card-title">
              <ShieldCheck size={19} color="var(--accent-purple)" aria-hidden="true" />
              Issue a synthetic credential
            </h2>
            <p className="section-description">All six fixed-schema claims are synthetic and stored in the simulated wallet.</p>
          </div>
          <button className="btn btn-primary" onClick={handleIssueCredential} disabled={loading || !issuer}>
            Issue &amp; sign
          </button>
        </div>

        {!issuer && <p className="inline-hint">Select or initialize an issuer before issuing.</p>}

        <div className="claim-form-grid">
          {claimFields.map(({ key, label, type = 'text', maxLength }) => (
            <div className="form-group" key={key}>
              <label className="form-label" htmlFor={`claim-${key}`}>{label}</label>
              <input
                className="form-input"
                id={`claim-${key}`}
                type={type}
                value={newAttrs[key]}
                maxLength={maxLength}
                required
                autoComplete="off"
                onChange={(event) => setNewAttrs((current) => ({ ...current, [key]: event.target.value }))}
              />
            </div>
          ))}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="wallet-select">Credential in simulated wallet</label>
          <select
            className="form-input"
            id="wallet-select"
            value={selectedCredentialId}
            onChange={(event) => setSelectedCredentialId(event.target.value)}
            disabled={loading || credentials.length === 0}
          >
            {credentials.length === 0 && <option value="">No credentials yet</option>}
            {credentials.map((credential) => (
              <option key={credential.id} value={credential.id}>
                {credential.subject_did} · {credential.status}
              </option>
            ))}
          </select>
        </div>

        {selectedCred && (
          <div className="commitment-summary">
            <span className={`badge ${selectedCred.status === 'revoked' ? 'badge-amber' : 'badge-cyan'}`}>
              {selectedCred.status === 'revoked' ? 'Revoked' : 'Active'} credential
            </span>
            <span className="mono-label">Merkle root</span>
            <code className="break-word">{selectedCred.merkle_root}</code>
          </div>
        )}
      </section>
    </div>
  );
}
