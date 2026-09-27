import React, { useState } from 'react';
import { api } from '../services/api';
import { X, CheckCircle, AlertTriangle, Link, Info } from 'lucide-react';

export default function ConnectModal({ isOpen, onClose, source, onConnected }) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!isOpen || !source) return null;

  const handleTestConnect = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.connectDataSource(source.id, {});
      setFeedback({ type: 'success', message: res.message || 'Successfully connected!' });
      if (onConnected) onConnected();
      setTimeout(onClose, 1500);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Connection test failed. API credentials missing or invalid.',
        missing_credentials: err.data?.missing_credentials || []
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '520px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link size={18} color="#818cf8" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Connect {source.display_name}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            gap: '10px'
          }}>
            <Info size={16} color="#818cf8" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Backend Credential Isolation:</strong> API credentials are never sent from the frontend or exposed to users. The Python backend reads official API keys from <code>backend/.env</code>.
            </div>
          </div>

          {feedback && (
            <div style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.825rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
              border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
              color: feedback.type === 'success' ? '#34d399' : '#f87171'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {feedback.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
                <span>{feedback.message}</span>
              </div>
              {feedback.missing_credentials?.length > 0 && (
                <div style={{ marginTop: '4px', fontSize: '0.78rem', color: '#cbd5e1' }}>
                  <strong>Missing backend configuration keys:</strong>
                  <ul style={{ marginTop: '4px', paddingLeft: '18px' }}>
                    {feedback.missing_credentials.map((c, i) => (
                      <li key={i}><code style={{ color: '#fcd34d' }}>{c}</code></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            Clicking <strong>Verify & Connect</strong> instructs the Python backend to validate authorization headers and tokens against the official provider API endpoint.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={loading}
              onClick={handleTestConnect}
            >
              {loading ? 'Verifying Authorization...' : 'Verify & Connect'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
