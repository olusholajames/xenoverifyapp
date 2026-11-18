import React from 'react';
import { Check, Eye, EyeOff, Fingerprint, ShieldAlert, ShieldCheck, X } from 'lucide-react';

const attributes = [
  { key: 'fullName', label: 'Synthetic full name' },
  { key: 'nin', label: 'Synthetic identifier' },
  { key: 'dob', label: 'Date of birth' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'clearanceLevel', label: 'Clearance tier' },
  { key: 'residence', label: 'Fictional residence' },
];

function ClaimSelector({ disclosedKeys, setDisclosedKeys, loading }) {
  return (
    <>
      <p className="inline-hint" id="claim-selection-hint">
        The verifier request is bound to this exact claim set. Select at least one claim; the backend enforces the same rule.
      </p>
      <div className="claim-choice-list" role="group" aria-describedby="claim-selection-hint">
        {attributes.map(({ key, label }) => {
          const checked = disclosedKeys.includes(key);
          return (
            <label className={`claim-choice ${checked ? 'is-selected' : ''}`} key={key} htmlFor={`disclose-${key}`}>
              <span className="claim-choice-copy">
                <span className="claim-choice-name">{label}</span>
                <span className="claim-choice-state">{checked ? 'Included in presentation' : 'Omitted from presentation'}</span>
              </span>
              <span className="claim-choice-control">
                {checked ? <Eye size={17} aria-hidden="true" /> : <EyeOff size={17} aria-hidden="true" />}
                <input
                  id={`disclose-${key}`}
                  type="checkbox"
                  checked={checked}
                  disabled={loading || (checked && disclosedKeys.length === 1)}
                  onChange={() => setDisclosedKeys((current) => (
                    checked ? current.filter((item) => item !== key) : [...current, key]
                  ))}
                />
              </span>
            </label>
          );
        })}
      </div>
    </>
  );
}

function PresentationPreview({ proofPacket }) {
  if (!proofPacket) return null;
  return (
    <div className="presentation-preview" aria-live="polite">
      <h3>Review what will be disclosed</h3>
      <p className="section-description">Only these claim values and their proof material are packaged.</p>
      <dl className="disclosed-values">
        {proofPacket.disclosed_claims.map((claim) => (
          <div key={claim.key}>
            <dt>{attributes.find((item) => item.key === claim.key)?.label || claim.key}</dt>
            <dd>{claim.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mono-label">Credential {proofPacket.envelope?.credential_id}</p>
    </div>
  );
}

function VerifierPrivacyPanel({ proofPacket, hiddenKeys }) {
  if (!proofPacket) return null;
  return (
    <section className="privacy-panel" aria-labelledby="verifier-view-heading">
      <h3 id="verifier-view-heading">What the verifier receives</h3>
      <p>
        Issuer and subject DIDs, credential ID, issue time, schema and Merkle root; the issuer signature; the selected values with their salts and Merkle paths; plus the verifier audience and one-time nonce.
      </p>
      <div className="privacy-columns">
        <div>
          <span className="privacy-label">Included claims</span>
          <ul className="privacy-key-list">
            {proofPacket.disclosed_claims.map((claim) => (
              <li key={claim.key}><Check size={14} aria-hidden="true" />{claim.key}</li>
            ))}
          </ul>
        </div>
        <div>
          <span className="privacy-label">Omitted values &amp; salts</span>
          <ul className="privacy-key-list">
            {hiddenKeys.map(({ key }) => <li key={key}><X size={14} aria-hidden="true" />{key}</li>)}
            {hiddenKeys.length === 0 && <li>None</li>}
          </ul>
        </div>
      </div>
      <p className="privacy-caveat">
        Omitted values and salts are not in this presentation. This is not zero-knowledge: stable identifiers and disclosed content can still enable correlation.
      </p>
    </section>
  );
}

function VerificationHeading({ verificationResult, tamperSimulated }) {
  const valid = verificationResult.valid;
  let message = `${verificationResult.error_stage || 'Validation'}${verificationResult.error ? ` · ${verificationResult.error}` : ''}`;
  if (tamperSimulated) {
    message = 'The value was changed in a fresh test presentation; rejection is expected.';
  } else if (valid) {
    message = 'All returned checks passed using the local simulated trust store and status ledger.';
  }

  return (
    <div className={`result-heading ${valid ? 'is-valid' : 'is-invalid'}`}>
      {valid ? <Check size={21} aria-hidden="true" /> : <X size={21} aria-hidden="true" />}
      <div>
        <h3>{valid ? 'Presentation accepted by the prototype' : 'Presentation rejected'}</h3>
        <p>{message}</p>
      </div>
    </div>
  );
}

function VerificationChecks({ checks }) {
  return (
    <ul className="check-list" aria-label="Individual verification checks">
      {checks.map((check) => (
        <li className="check-row" key={check.id}>
          <span className={`check-state ${check.passed ? 'is-valid' : 'is-invalid'}`}>
            {check.passed ? <Check size={15} aria-hidden="true" /> : <X size={15} aria-hidden="true" />}
            {check.passed ? 'Passed' : 'Failed'}
          </span>
          <span className="check-copy">
            <strong>{check.id.replaceAll('_', ' ')}</strong>
            <span>{check.detail}</span>
          </span>
        </li>
      ))}
      {checks.length === 0 && <li className="inline-hint">The API returned no individual check details.</li>}
    </ul>
  );
}

function VerificationResultPanel({ verificationResult, tamperSimulated }) {
  if (!verificationResult) return null;
  const checks = verificationResult.checks || [];
  const elapsed = verificationResult.metrics?.total_workflow_verification_ms;

  return (
    <div className="result-panel" aria-live="polite">
      <VerificationHeading verificationResult={verificationResult} tamperSimulated={tamperSimulated} />
      <VerificationChecks checks={checks} />
      {elapsed !== undefined && (
        <p className="measurement-note">
          Observed prototype verification time: {Number(elapsed).toFixed(2)} ms. This single request is not a benchmark result.
        </p>
      )}
      <p className="inline-hint">This challenge is now consumed. Generate a fresh presentation before verifying again.</p>
    </div>
  );
}

export default function DisclosureTab({
  selectedCred,
  disclosedKeys,
  setDisclosedKeys,
  proofPacket,
  verificationResult,
  tamperSimulated,
  handleGenerateProof,
  handleVerifyProof,
  loading,
}) {
  const presentedKeys = new Set((proofPacket?.disclosed_claims || []).map((claim) => claim.key));
  const hiddenKeys = attributes.filter(({ key }) => !presentedKeys.has(key));
  const hasResult = Boolean(verificationResult);

  return (
    <div className="disclosure-layout">
      <section className="card" aria-labelledby="holder-heading">
        <div className="card-header">
          <div>
            <h2 id="holder-heading" className="card-title">
              <Fingerprint size={19} color="var(--accent-cyan)" aria-hidden="true" />
              Prepare a presentation
            </h2>
            <p className="section-description">Choose which synthetic values to disclose to this verifier.</p>
          </div>
          <button className="btn btn-primary" onClick={handleGenerateProof} disabled={loading || !selectedCred}>
            Generate fresh challenge &amp; proof
          </button>
        </div>

        {!selectedCred ? (
          <p className="empty-state">No wallet credential is available. Issue a synthetic credential first.</p>
        ) : (
          <ClaimSelector disclosedKeys={disclosedKeys} setDisclosedKeys={setDisclosedKeys} loading={loading} />
        )}
        <PresentationPreview proofPacket={proofPacket} />
      </section>

      <section className="card" aria-labelledby="verifier-heading">
        <div className="card-header">
          <div>
            <h2 id="verifier-heading" className="card-title">
              <ShieldCheck size={19} color="var(--accent-emerald)" aria-hidden="true" />
              Verification results
            </h2>
            <p className="section-description">Every trust, status, proof, signature and challenge check is reported.</p>
          </div>
        </div>

        <div className="verification-actions">
          <button className="btn btn-primary" onClick={() => handleVerifyProof(false)} disabled={!proofPacket || loading || hasResult}>
            Verify presentation
          </button>
          <button className="btn btn-danger" onClick={() => handleVerifyProof(true)} disabled={!proofPacket || loading || hasResult}>
            <ShieldAlert size={15} aria-hidden="true" /> Simulate claim tampering
          </button>
        </div>

        {!proofPacket && (
          <p className="empty-state">Generate a presentation to create a one-time verifier challenge and inspect the checks.</p>
        )}
        <VerifierPrivacyPanel proofPacket={proofPacket} hiddenKeys={hiddenKeys} />
        <VerificationResultPanel verificationResult={verificationResult} tamperSimulated={tamperSimulated} />
      </section>
    </div>
  );
}
