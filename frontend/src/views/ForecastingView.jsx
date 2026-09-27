import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { LineChart } from '../components/InteractiveCharts';
import { TrendingUp, RefreshCw, AlertTriangle, Info, ShieldAlert } from 'lucide-react';

export default function ForecastingView() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modelType, setModelType] = useState('RandomForest');
  const [horizon, setHorizon] = useState(14);
  const [error, setError] = useState(null);

  const runForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.runForecast(modelType, horizon);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runForecast(); }, []);

  // Build combined chart data
  const buildChartData = () => {
    if (!result?.success) return [];
    const history = (result.recent_history || []).map(d => ({ date: d.date, value: d.actual_value, type: 'actual' }));
    const forecast = (result.predictions || []).map(d => ({ date: d.forecast_date, value: d.predicted_value, type: 'predicted' }));
    return [...history, ...forecast];
  };

  const chartData = buildChartData();
  const forecastStart = result?.recent_history?.length ?? 0;

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Predictive Sales Forecast</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Machine learning time-series regression on historical daily sales. Results are MODEL ESTIMATES — not guaranteed outcomes.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select
            value={modelType}
            onChange={e => setModelType(e.target.value)}
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
          >
            <option value="RandomForest">Random Forest Regressor</option>
            <option value="LinearRegression">Linear Regression</option>
          </select>
          <select
            value={horizon}
            onChange={e => setHorizon(Number(e.target.value))}
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}
          >
            {[7, 14, 21, 30].map(h => <option key={h} value={h}>{h}-Day Horizon</option>)}
          </select>
          <button className="btn btn-primary" onClick={runForecast} disabled={loading}>
            <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Training Model...' : 'Run Forecast'}
          </button>
        </div>
      </div>

      {/* Model Estimate Disclaimer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(139, 92, 246, 0.07)', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
        <ShieldAlert size={16} color="#c4b5fd" />
        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <strong style={{ color: '#c4b5fd' }}>MODEL ESTIMATE ONLY:</strong> Predictions are based on historical sales patterns and algorithmic feature extraction. They are not guaranteed future outcomes. Always consult business context before decisions.
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
          <p style={{ fontSize: '0.8rem', marginTop: '6px', color: 'var(--text-muted)' }}>At least 14 days of historical sales data required to train predictive models.</p>
        </div>
      )}

      {result?.success && (
        <>
          {/* Validation Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              { label: 'Model', val: result.model_name, unit: '' },
              { label: 'MAE', val: `$${result.evaluation_metrics.mae}`, unit: 'Mean Abs. Error' },
              { label: 'RMSE', val: `$${result.evaluation_metrics.rmse}`, unit: 'Root Mean Sq. Error' },
              { label: 'R² Score', val: result.evaluation_metrics.r2, unit: result.evaluation_metrics.evaluation_interpretation }
            ].map((m, i) => (
              <div key={i} className="glass-panel" style={{ padding: '16px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>{m.label}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: i === 3 && m.val > 0.6 ? '#34d399' : i === 3 && m.val < 0.2 ? '#f87171' : 'var(--text-primary)' }}>{m.val}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{m.unit}</div>
              </div>
            ))}
          </div>

          {/* Forecast Chart */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Historical + Forecast Timeline</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '24px', height: '2px', background: '#6366f1', borderRadius: '1px' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Actual Revenue</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '24px', height: '2px', background: '#10b981', borderRadius: '1px', borderTop: '2px dashed #10b981' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Model Estimate</span>
                </div>
                <span className="badge badge-estimate">MODEL ESTIMATE</span>
              </div>
            </div>
            <LineChart data={chartData} xKey="date" yKey="value" height={280} strokeColor="#6366f1" />
          </div>

          {/* Forecast Table */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>
              {horizon}-Day Forecast Detail
              <span className="badge badge-estimate" style={{ marginLeft: '12px' }}>MODEL ESTIMATE</span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {result.predictions.map((p, i) => (
                <div key={i} style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.forecast_date}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#a5b4fc' }}>${p.predicted_value.toLocaleString()}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Range: ${p.lower_bound} – ${p.upper_bound}
                  </div>
                </div>
              ))}
            </div>
            <p style={{ marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {result.disclaimer}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
