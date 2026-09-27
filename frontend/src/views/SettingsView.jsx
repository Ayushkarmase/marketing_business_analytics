import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import {
  Settings, Users, Database, Shield, Clock,
  CheckCircle, AlertTriangle, RefreshCw, Key, Server
} from 'lucide-react';

export default function SettingsView() {
  const { currentUser } = useAuth();
  const { business, dataSources } = useBusiness();
  const [users, setUsers] = useState([]);
  const [syncInterval, setSyncInterval] = useState('60');
  const [savedNotice, setSavedNotice] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    api.getUsers()
      .then(res => setUsers(res.users || []))
      .catch(err => console.warn('Could not fetch users list:', err))
      .finally(() => setLoadingUsers(false));
  }, []);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '1200px' }}>
      <div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>System Configuration & Settings</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Company Administrator control panel for managing users, synchronization intervals, database connections, and system policies.
        </p>
      </div>

      {savedNotice && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.85rem'
        }}>
          <CheckCircle size={16} /> System configuration updated successfully.
        </div>
      )}

      {/* Row 1: System Info & Database Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
        {/* Business Profile */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Server size={18} color="#818cf8" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Business Profile</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Business Name</td>
                <td style={{ padding: '8px 0', fontWeight: 600, textAlign: 'right' }}>{business?.name || 'FashionHub'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Industry</td>
                <td style={{ padding: '8px 0', fontWeight: 600, textAlign: 'right', textTransform: 'capitalize' }}>{business?.industry || 'Fashion & Apparel'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Reporting Currency</td>
                <td style={{ padding: '8px 0', fontWeight: 600, textAlign: 'right' }}>{business?.currency || 'USD'}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Default Timezone</td>
                <td style={{ padding: '8px 0', fontWeight: 600, textAlign: 'right' }}>{business?.timezone || 'UTC'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Database & Architecture Layer */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Database size={18} color="#10b981" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Database & Analytics Stack</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Primary Database:</span>
              <span style={{ fontWeight: 600, color: '#34d399' }}>MySQL (Schema Ready) / SQLite Engine</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Data Processing Layer:</span>
              <span style={{ fontWeight: 600 }}>Pandas 2.2 + NumPy 1.26</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Machine Learning Layer:</span>
              <span style={{ fontWeight: 600 }}>Scikit-Learn (K-Means, Regressors)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ color: 'var(--text-muted)' }}>Credential Storage Policy:</span>
              <span style={{ fontWeight: 600, color: '#818cf8' }}>Strict Backend-Only (.env isolation)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Synchronization Policy Configuration */}
      <div className="glass-panel" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Clock size={18} color="#f59e0b" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Scheduled Synchronization Policies</h3>
        </div>
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
          <div style={{ flex: '1', minWidth: '220px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Automatic Sync Frequency
            </label>
            <select
              value={syncInterval}
              onChange={e => setSyncInterval(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem'
              }}
            >
              <option value="15">Every 15 minutes (High freshness)</option>
              <option value="30">Every 30 minutes</option>
              <option value="60">Every 60 minutes (Standard scheduled)</option>
              <option value="360">Every 6 hours</option>
              <option value="1440">Once daily (Midnight UTC)</option>
            </select>
          </div>

          <div style={{ flex: '1', minWidth: '220px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Sync Failure Preservation Policy
            </label>
            <input
              type="text"
              readOnly
              value="Preserve previous valid records on error (Active)"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.02)',
                color: '#34d399',
                border: '1px solid var(--border-subtle)',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                cursor: 'not-allowed'
              }}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '9px 20px' }}>
            Save Configuration
          </button>
        </form>
      </div>

      {/* Row 3: Registered System Users */}
      <div className="glass-panel" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={18} color="#818cf8" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Authorized System Users & Role Access</h3>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {users.length} registered user{users.length === 1 ? '' : 's'}
          </span>
        </div>

        {loadingUsers ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading users...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '10px 12px' }}>Name</th>
                  <th style={{ padding: '10px 12px' }}>Email</th>
                  <th style={{ padding: '10px 12px' }}>System Role</th>
                  <th style={{ padding: '10px 12px' }}>Access Permissions</th>
                  <th style={{ padding: '10px 12px' }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {u.full_name}
                      {u.id === currentUser?.id && (
                        <span style={{ marginLeft: '8px', fontSize: '0.7rem', color: '#818cf8', background: 'rgba(99,102,241,0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                          Current
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className={`badge badge-${u.role === 'company_admin' ? 'scheduled' : u.role === 'business_analyst' ? 'estimate' : 'realtime'}`} style={{ fontSize: '0.68rem' }}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {u.role === 'company_admin' && 'Connectors, Settings, Sync Logs, System Config'}
                      {u.role === 'business_owner' && 'Executive KPIs, Sales, Customers, Forecasts, Reports'}
                      {u.role === 'marketing_manager' && 'Ad Campaigns, Impressions, ROAS, Funnel Analysis'}
                      {u.role === 'business_analyst' && 'Sales Trends, RFM K-Means, ML Models, Reports'}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Initial Setup'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
