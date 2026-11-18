import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from './config';

import Header from './components/Header';
import NavigationTabs from './components/NavigationTabs';
import ScopeTab from './components/ScopeTab';
import IssuerTab from './components/IssuerTab';
import DisclosureTab from './components/DisclosureTab';
import BenchmarkTab from './components/BenchmarkTab';
import benchmarkSummary from './benchmark-summary.json';

const SYNTHETIC_ATTRIBUTES = {
  fullName: 'Casey Example',
  nin: 'SYN-000042',
  dob: '1992-06-14',
  nationality: 'Exampleland',
  clearanceLevel: 'Tier-3',
  residence: 'Fictional District, Example City',
};

const DEFAULT_DISCLOSURES = ['fullName', 'nationality'];

function getApiError(response, body) {
  const detail = body?.error || body?.detail || body?.message;
  if (detail) return detail;
  if (response.status === 404) return 'The requested API route was not found. Confirm the configured backend URL.';
  if (response.status === 429) return 'The API is rate-limiting requests. Wait briefly, then retry.';
  if (response.status >= 500) return 'The backend could not complete the request. Retry in a moment.';
  return `The request failed (HTTP ${response.status}). Check the inputs and retry.`;
}

async function apiRequest(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Cannot reach the Xenoverify API. Check the connection and backend URL, then retry.');
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    if (response.ok) throw new Error('The backend returned an unreadable response. Retry or check the API logs.');
  }
  if (!response.ok) throw new Error(getApiError(response, data));
  return data;
}

function errorMessage(error) {
  return error instanceof Error ? error.message : 'The request could not be completed. Retry.';
}

async function createPresentation(credentialId, disclosedKeys) {
  const challenge = await apiRequest('/verifier/nonce/', {
    method: 'POST',
    body: {
      audience: window.location.origin,
      requested_claims: disclosedKeys,
    },
  });
  return apiRequest('/proofs/generate/', {
    method: 'POST',
    body: {
      credential_id: credentialId,
      disclosed_keys: disclosedKeys,
      verifier_nonce: challenge.verifier_nonce,
    },
  });
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dsrm');
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [apiError, setApiError] = useState('');
  const initialLoading = systemInfo === null && apiError === '';

  const [issuers, setIssuers] = useState([]);
  const [selectedIssuerDid, setSelectedIssuerDid] = useState('');
  const [credentials, setCredentials] = useState([]);
  const [selectedCredentialId, setSelectedCredentialId] = useState('');
  const [newAttrs, setNewAttrs] = useState(SYNTHETIC_ATTRIBUTES);

  const [disclosedKeys, setDisclosedKeys] = useState(DEFAULT_DISCLOSURES);
  const [proofPacket, setProofPacket] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [tamperSimulated, setTamperSimulated] = useState(false);

  const busy = initialLoading || loading;
  const selectedCred = useMemo(
    () => credentials.find((item) => item.id === selectedCredentialId) || credentials[0] || null,
    [credentials, selectedCredentialId],
  );
  const issuer = useMemo(
    () => issuers.find((item) => item.did === selectedIssuerDid) || issuers[0] || null,
    [issuers, selectedIssuerDid],
  );

  const loadInitialData = useCallback(async (signal) => {
    setApiError('');
    try {
      const [info, issuerRows, walletRows] = await Promise.all([
        apiRequest('/system/info/', { signal }),
        apiRequest('/issuers/', { signal }),
        apiRequest('/wallet/credentials/', { signal }),
      ]);
      if (signal?.aborted) return;
      const activeIssuers = Array.isArray(issuerRows) ? issuerRows.filter((item) => item.is_active) : [];
      const wallet = Array.isArray(walletRows) ? walletRows : [];
      setSystemInfo(info);
      setIssuers(activeIssuers);
      setCredentials(wallet);
      setSelectedIssuerDid((current) => activeIssuers.some((item) => item.did === current) ? current : activeIssuers[0]?.did || '');
      setSelectedCredentialId((current) => wallet.some((item) => item.id === current) ? current : wallet[0]?.id || '');
      setApiError('');
    } catch (error) {
      if (!signal?.aborted) setApiError(errorMessage(error));
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadInitialData(controller.signal);
    return () => controller.abort();
  }, [loadInitialData]);

  const runAction = useCallback(async (message, action) => {
    if (loading || initialLoading) return null;
    setLoading(true);
    setProcessingMessage(message);
    setApiError('');
    try {
      return await action();
    } catch (error) {
      if (error.name !== 'AbortError') setApiError(errorMessage(error));
      return null;
    } finally {
      setLoading(false);
      setProcessingMessage('');
    }
  }, [initialLoading, loading]);

  const handleInitIssuer = (scheme) => runAction(
    `Creating a local ${scheme} issuer key and registering its public key…`,
    async () => {
      const result = await apiRequest('/issuers/', {
        method: 'POST',
        body: { scheme, entity_name: 'Xenoverify Synthetic Issuer' },
      });
      const created = result.issuer;
      setIssuers((current) => [created, ...current.filter((item) => item.did !== created.did)]);
      setSelectedIssuerDid(created.did);
      return created;
    },
  );

  const handleIssueCredential = () => {
    if (!issuer) {
      setApiError('Initialize or select a trusted issuer before issuing a credential.');
      return;
    }
    return runAction('Committing the six synthetic claims and signing the credential envelope…', async () => {
      const result = await apiRequest('/credentials/issue/', {
        method: 'POST',
        body: { issuer_did: issuer.did, attributes: newAttrs },
      });
      const walletSummary = {
        id: result.credential_id,
        issuer_did: result.issuer_did,
        subject_did: result.subject_did,
        schema_id: result.schema_id,
        merkle_root: result.envelope?.merkle_root,
        status: result.status,
        issued_at: result.issued_at,
        attribute_count: result.attribute_count,
      };
      setCredentials((current) => [walletSummary, ...current.filter((item) => item.id !== walletSummary.id)]);
      setSelectedCredentialId(walletSummary.id);
      setProofPacket(null);
      setVerificationResult(null);
      setActiveTab('disclosure');
      return result;
    });
  };

  const handleGenerateProof = () => {
    if (!selectedCred) {
      setApiError('Issue a synthetic credential before generating a presentation.');
      return;
    }
    if (!disclosedKeys.length) {
      setApiError('Select at least one claim to disclose.');
      return;
    }
    if (selectedCred.status === 'revoked') {
      setApiError('This credential is revoked. Select an active credential to continue.');
      return;
    }
    return runAction('Creating a one-time challenge and preparing the selected disclosure…', async () => {
      const packet = await createPresentation(selectedCred.id, disclosedKeys);
      setProofPacket(packet);
      setVerificationResult(null);
      setTamperSimulated(false);
      return packet;
    });
  };

  const handleVerifyProof = (tamper = false) => {
    if (!proofPacket || verificationResult) return;
    return runAction(
      tamper ? 'Creating a fresh challenge and testing a modified claim value…' : 'Checking issuer trust, ledger status, Merkle paths, signature and challenge…',
      async () => {
        let packet = proofPacket;
        if (tamper) {
          packet = await createPresentation(selectedCred.id, disclosedKeys);
          setProofPacket(packet);
        }
        const payload = structuredClone(packet);
        if (tamper) {
          if (!payload.disclosed_claims?.length) throw new Error('Generate a presentation with at least one claim before simulating tampering.');
          payload.disclosed_claims[0].value = `${payload.disclosed_claims[0].value} [modified]`;
        }
        const result = await apiRequest('/proofs/verify/', { method: 'POST', body: payload });
        setTamperSimulated(tamper);
        setVerificationResult(result);
        return result;
      },
    );
  };

  return (
    <div className="app-container">
      <Header systemInfo={systemInfo} apiConnected={Boolean(systemInfo)} />

      <section className="prototype-notice" aria-label="Prototype and privacy limitations">
        <AlertTriangle size={19} aria-hidden="true" />
        <p>
          <strong>Synthetic-data research prototype.</strong> The wallet, issuer registry and status ledger are local simulations.
          Selective disclosure is not zero-knowledge; stable credential details may be linkable, and copied material can be presented with a fresh challenge.
        </p>
      </section>

      {apiError && (
        <div className="error-banner" role="alert">
          <div>
            <strong>Could not complete the request</strong>
            <p>{apiError}</p>
          </div>
          <button className="btn btn-secondary" onClick={() => void loadInitialData()} disabled={busy}>
            Retry connection
          </button>
        </div>
      )}

      {busy && (
        <div className="processing-banner" role="status" aria-live="polite">
          <RefreshCw size={18} className="spinner" aria-hidden="true" />
          <span>{processingMessage || 'Connecting to the local prototype API…'}</span>
        </div>
      )}

      <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <main id="main-content">
        {activeTab === 'dsrm' && <ScopeTab systemInfo={systemInfo} />}
        {activeTab === 'issuer' && (
          <IssuerTab
            issuers={issuers}
            issuer={issuer}
            selectedIssuerDid={selectedIssuerDid}
            setSelectedIssuerDid={setSelectedIssuerDid}
            selectedCred={selectedCred}
            credentials={credentials}
            selectedCredentialId={selectedCred?.id || ''}
            setSelectedCredentialId={setSelectedCredentialId}
            newAttrs={newAttrs}
            setNewAttrs={setNewAttrs}
            handleInitIssuer={handleInitIssuer}
            handleIssueCredential={handleIssueCredential}
            loading={busy}
          />
        )}
        {activeTab === 'disclosure' && (
          <DisclosureTab
            selectedCred={selectedCred}
            disclosedKeys={disclosedKeys}
            setDisclosedKeys={setDisclosedKeys}
            proofPacket={proofPacket}
            verificationResult={verificationResult}
            tamperSimulated={tamperSimulated}
            handleGenerateProof={handleGenerateProof}
            handleVerifyProof={handleVerifyProof}
            loading={busy}
          />
        )}
        {activeTab === 'benchmarks' && <BenchmarkTab summary={benchmarkSummary} />}
      </main>
    </div>
  );
}
