import React from 'react';
import { Activity, Download, Terminal } from 'lucide-react';

const configurations = ['ML-DSA-65', 'ECDSA-secp256k1-SHA256'];
const schemeLabels = { 'ML-DSA-65': 'ML-DSA-65', 'ECDSA-secp256k1-SHA256': 'ECDSA' };
const operations = [
  { key: 'keygen', label: 'Key generation' },
  { key: 'sign', label: 'Signing' },
  { key: 'verify', label: 'Verification' },
];
const LOG_AXIS_MAX = Math.log10(1000);
const AXIS_TICKS = ['1', '10', '100', '1000 ms'];

function formatMs(value) {
  return Number.isFinite(value) ? `${value.toFixed(2)} ms` : '—';
}

function formatBytes(value) {
  return Number.isFinite(value) ? `${value.toLocaleString()} bytes` : '—';
}

function logPct(ms) {
  return `${Math.max(2, (Math.log10(ms) / LOG_AXIS_MAX) * 100)}%`;
}

function LatencyComparison({ summary }) {
  return (
    <section className="latency-chart" aria-label="Mean latency comparison on a logarithmic scale">
      <div className="latency-head">
        <h3>Mean latency</h3>
        <span className="latency-scale-note">log scale</span>
      </div>
      <div className="latency-axis" aria-hidden="true">
        {AXIS_TICKS.map((tick, index) => (
          <span key={tick} style={{ left: `${(index / (AXIS_TICKS.length - 1)) * 100}%` }}>{tick}</span>
        ))}
      </div>
      {operations.map(({ key, label }) => (
        <div className="latency-op" key={key}>
          <span className="latency-op-label">{label}</span>
          <div className="latency-rows">
            {configurations.map((configuration) => {
              const mean = summary.operation_summaries[configuration]?.[key]?.mean_ms;
              return (
                <div className="latency-row" key={configuration}>
                  <span className="latency-scheme">{schemeLabels[configuration]}</span>
                  <span className="latency-track">
                    {Number.isFinite(mean) && (
                      <span
                        className={`latency-fill ${configuration.startsWith('ML-DSA') ? 'is-pqc' : 'is-baseline'}`}
                        style={{ width: logPct(mean) }}
                      />
                    )}
                  </span>
                  <span className="latency-val">{formatMs(mean)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <p className="latency-note">Bars compare the mean of {summary.measured_trials_per_operation_configuration} measured sequential trials per operation; the axis is logarithmic.</p>
    </section>
  );
}

export default function BenchmarkTab({ summary }) {
  const hasMeasurements = Boolean(summary?.operation_summaries);
  const memoryProfiles = summary?.memory_profiles || [];

  return (
    <div className="scope-layout">
      <section className="card" aria-labelledby="evaluation-heading">
        <div className="card-header">
          <div>
            <h2 id="evaluation-heading" className="card-title">
              <Activity size={18} strokeWidth={1.75} aria-hidden="true" />
              Bounded cryptographic comparison
            </h2>
            <p className="section-description">Sequential local trials; the browser does not trigger or time the evaluation</p>
          </div>
          {hasMeasurements && <span className="badge badge-emerald">Measured evidence</span>}
        </div>

        {!hasMeasurements ? (
          <div className="empty-state">
            <p>No benchmark artifact is bundled with this build.</p>
            <p>Run the frozen protocol from the backend repository root:</p>
            <code className="command-block">python manage.py run_final_evaluation --mode benchmark</code>
          </div>
        ) : (
          <>
            <p className="evidence-note">
              Run <code>{summary.run_id}</code> · {summary.protocol_id} · {summary.measured_trials_per_operation_configuration} measured trials per operation and scheme, after {summary.warmups_per_operation_configuration} warm-ups.
            </p>
            <LatencyComparison summary={summary} />
            <div className="table-scroll">
              <table className="scope-table results-table">
                <thead>
                  <tr>
                    <th scope="col">Configuration</th><th scope="col">Operation</th><th scope="col">n / failures</th>
                    <th scope="col">Mean</th><th scope="col">SD</th><th scope="col">Median</th><th scope="col">p95</th>
                  </tr>
                </thead>
                <tbody>
                  {configurations.flatMap((configuration) => operations.map(({ key, label }) => {
                    const result = summary.operation_summaries[configuration]?.[key];
                    return (
                      <tr key={`${configuration}-${key}`}>
                        <th scope="row">{configuration}</th><td>{label}</td>
                        <td>{result?.attempts ?? 0} / {result?.failed_calls ?? 0}</td>
                        <td>{formatMs(result?.mean_ms)}</td><td>{formatMs(result?.sample_sd_ms)}</td>
                        <td>{formatMs(result?.median_ms)}</td><td>{formatMs(result?.p95_nearest_rank_ms)}</td>
                      </tr>
                    );
                  }))}
                </tbody>
              </table>
            </div>

            <div className="scope-details results-details">
              {configurations.map((configuration) => {
                const sizes = summary.configurations[configuration];
                const presentation = summary.sample_serialized_sizes[configuration];
                return (
                  <section className="measurement-card" key={configuration}>
                    <h3>{configuration}</h3>
                    <dl className="metadata-list">
                      <div><dt>Public key</dt><dd>{formatBytes(sizes?.public_key_bytes)} · {sizes?.public_key_b64_chars?.toLocaleString()} base64 characters</dd></div>
                      <div><dt>Secret key (local)</dt><dd>{formatBytes(sizes?.secret_key_bytes)} · {sizes?.secret_key_b64_chars?.toLocaleString()} base64 characters</dd></div>
                      <div><dt>Canonical keypair JSON</dt><dd>{formatBytes(sizes?.keypair_json_bytes)}</dd></div>
                      <div><dt>Signature size(s)</dt><dd>{(sizes?.signature_bytes_unique_in_measured_sign_trials || []).map((value) => `${value} B`).join(', ') || formatBytes(sizes?.signature_bytes_sample)}</dd></div>
                      <div><dt>Presentation JSON</dt><dd>{formatBytes(presentation?.presentation_json_bytes)}</dd></div>
                    </dl>
                  </section>
                );
              })}
            </div>
            {summary.mean_ratio_MLDSA_over_ECDSA && (
              <p className="evidence-note">
                Mean-latency ratio, ML-DSA-65 / ECDSA: {summary.mean_ratio_MLDSA_over_ECDSA.keygen?.toFixed(2)}× key generation · {summary.mean_ratio_MLDSA_over_ECDSA.sign?.toFixed(2)}× signing · {summary.mean_ratio_MLDSA_over_ECDSA.verify?.toFixed(2)}× verification.
              </p>
            )}

            <section className="privacy-panel memory-panel" aria-labelledby="memory-heading">
              <h3 id="memory-heading">Separate process memory profile</h3>
              <p>Separate child per scheme and operation. Five warm-ups are excluded; RSS is sampled every 20 ms across the 50 measured calls. `tracemalloc` excludes native allocations.</p>
              <div className="table-scroll">
                <table className="scope-table">
                  <thead><tr><th scope="col">Configuration / operation</th><th scope="col">Baseline RSS</th><th scope="col">Peak sampled RSS</th><th scope="col">Python allocation peak</th><th scope="col">Status</th></tr></thead>
                  <tbody>
                    {memoryProfiles.map((profile) => (
                      <tr key={`${profile.configuration}-${profile.operation}`}>
                        <th scope="row">{profile.configuration} · {profile.operation}</th>
                        <td>{formatBytes(profile.baseline_rss_bytes)}</td><td>{formatBytes(profile.max_sampled_rss_bytes)}</td>
                        <td>{formatBytes(profile.tracemalloc_peak_bytes)}</td><td>{profile.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <p className="evidence-note"><Download size={16} strokeWidth={1.75} aria-hidden="true" /> Raw CSV, environment manifest and signed-byte fixtures are preserved under <code>experiments/results/{summary.run_id}/</code>. OpenSSL is an interoperability cross-check, not a benchmark arm.</p>
            <p className="inline-hint">These measurements describe this machine, software revision and fixed workload only; they do not establish production performance or security.</p>
          </>
        )}
      </section>

      <section className="card protocol-command" aria-labelledby="protocol-command-heading">
        <h3 id="protocol-command-heading" className="card-title"><Terminal size={18} strokeWidth={1.75} aria-hidden="true" /> Reproduce the experiment</h3>
        <p className="section-description">The run writes raw observations first, retains failures, and creates a manifest before processing results</p>
        <code className="command-block">python manage.py run_final_evaluation --mode benchmark</code>
        <p className="inline-hint">Protocol: canonical signed envelope; six synthetic string claims; disclose <code>fullName</code> and <code>nationality</code>; five warm-ups and fifty measured sequential trials for each operation.</p>
      </section>
    </div>
  );
}
