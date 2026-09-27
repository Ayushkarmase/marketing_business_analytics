import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { ScatterPlot } from '../components/InteractiveCharts';
import { Users, RefreshCw, AlertTriangle, Info } from 'lucide-react';

const CLUSTER_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

export default function SegmentationView() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [kParam, setKParam] = useState(null);
  const [error, setError] = useState(null);

  const runSegmentation = async (k) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.runSegmentation(k);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runSegmentation(null); }, []);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Customer Segmentation</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            K-Means clustering on RFM behavioral features. Cluster labels assigned dynamically from centroid analysis — not preset.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={kParam || ''}
            onChange={e => setKParam(e.target.value ? Number(e.target.value) : null)}
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
          >
            <option value="">Auto-detect K</option>
            {[3, 4, 5].map(k => <option key={k} value={k}>K = {k} clusters</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => runSegmentation(kParam)} disabled={loading}>
            <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Analyzing...' : 'Run Segmentation'}
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(99, 102, 241, 0.07)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
        <Info size={16} color="#818cf8" />
        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          Segmentation uses RFM features (Recency, Frequency, Monetary). Cluster business labels are interpreted from actual centroid characteristics, not hardcoded. Algorithm: scikit-learn KMeans.
        </span>
      </div>

      {error && (
        <div style={{ padding: '14px 18px', borderRadius: 'var(--radius-md)', background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.25)', color: '#fca5a5', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {result?.success === false && (
        <div style={{ padding: '20px', borderRadius: 'var(--radius-lg)', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', textAlign: 'center', color: '#fcd34d' }}>
          <AlertTriangle size={28} style={{ marginBottom: '8px' }} />
          <p style={{ fontWeight: 600 }}>{result.message}</p>
          <p style={{ fontSize: '0.8rem', marginTop: '6px', color: 'var(--text-muted)' }}>Segmentation requires at least 6 customer records with RFM data.</p>
        </div>
      )}

      {result?.success && (
        <>
          {/* Cluster Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {result.clusters.map((cluster, i) => (
              <div key={cluster.cluster_id} className="glass-panel" style={{ padding: '20px', borderLeft: `3px solid ${CLUSTER_COLORS[i % CLUSTER_COLORS.length]}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: CLUSTER_COLORS[i % CLUSTER_COLORS.length] }} />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{cluster.label}</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Customers</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{cluster.customer_count} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({cluster.pct_of_total}%)</span></div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Avg Spend</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>${cluster.avg_monetary_spend}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Avg Recency</div>
                    <div style={{ fontWeight: 600 }}>{cluster.avg_recency_days} days</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Avg Orders</div>
                    <div style={{ fontWeight: 600 }}>{cluster.avg_order_frequency}</div>
                  </div>
                </div>
                <div style={{ marginTop: '12px', padding: '8px', borderRadius: 'var(--radius-sm)', background: `rgba(${CLUSTER_COLORS[i % CLUSTER_COLORS.length].replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')}, 0.08)` }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Cluster Revenue</div>
                  <div style={{ fontWeight: 700, color: CLUSTER_COLORS[i % CLUSTER_COLORS.length] }}>${cluster.total_cluster_revenue?.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Scatter Plot */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>RFM Scatter Plot (Recency vs Monetary Spend)</h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {result.clusters.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: CLUSTER_COLORS[i % CLUSTER_COLORS.length] }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <ScatterPlot points={result.scatter_points} xKey="recency" yKey="monetary" height={280} />
          </div>

          {/* Summary */}
          <div style={{ padding: '14px 18px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Analysis completed: <strong style={{ color: 'var(--text-primary)' }}>{result.total_customers_analyzed}</strong> customers grouped into <strong style={{ color: 'var(--text-primary)' }}>K={result.k_clusters}</strong> clusters using K-Means on standardized RFM features.
            Cluster labels assigned after examining centroid characteristics (no forced preset labels).
          </div>
        </>
      )}
    </div>
  );
}
