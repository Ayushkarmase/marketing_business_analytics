import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import ConnectModal from '../components/ConnectModal';
import { Database, RefreshCw, Link, Unlink, AlertTriangle, CheckCircle, Clock, Info, Upload, FileSpreadsheet } from 'lucide-react';

const PROVIDER_META = {
  google_analytics: { icon: '📊', color: '#4285f4', label: 'Google Analytics 4', description: 'Realtime sessions, users, traffic sources, conversion events.' },
  google_ads: { icon: '📢', color: '#fbbc04', label: 'Google Ads API', description: 'Campaign impressions, clicks, cost, conversions, ROAS.' },
  shopify: { icon: '🛍️', color: '#96bf48', label: 'Shopify Store', description: 'Orders, products, customers, revenue, inventory.' },
  csv: { icon: '📄', color: '#64748b', label: 'Fallback CSV Import', description: 'FALLBACK ONLY: Use when official API authorization is unavailable.' }
};

export default function DataSourcesView() {
  const { dataSources, syncingSourceId, syncFeedback, triggerSyncNow, refreshDataSources } = useBusiness();
  const [connectingSource, setConnectingSource] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  // CSV Fallback Upload State
  const fileInputRef = useRef(null);
  const [csvCategory, setCsvCategory] = useState('orders');
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [csvNotice, setCsvNotice] = useState(null);

  const handleSyncNow = async (sourceId) => {
    try {
      await triggerSyncNow(sourceId);
    } catch (e) {
      // Error captured in syncFeedback
    }
  };

  const handleDisconnect = async (sourceId, displayName) => {
    try {
      await api.disconnectDataSource(sourceId);
      setActionNotice({ type: 'success', text: `Disconnected ${displayName}. Data preserved.` });
      await refreshDataSources();
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      setActionNotice({ type: 'error', text: err.message || 'Disconnect failed.' });
    }
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0]) {
      setCsvNotice({ type: 'error', text: 'Please select a CSV file to upload.' });
      return;
    }

    setUploadingCsv(true);
    setCsvNotice(null);
    try {
      const formData = new FormData();
      formData.append('file', fileInputRef.current.files[0]);
      formData.append('category', csvCategory);

      const res = await api.uploadCSV(formData);
      setCsvNotice({ type: 'success', text: res.message || 'CSV fallback data imported successfully!' });
      await refreshDataSources();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setCsvNotice({ type: 'error', text: err.message || 'Failed to import CSV fallback data.' });
    } finally {
      setUploadingCsv(false);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '1200px' }}>
      <ConnectModal
        isOpen={Boolean(connectingSource)}
        source={connectingSource}
        onClose={() => setConnectingSource(null)}
        onConnected={() => refreshDataSources()}
      />

      <div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Data Sources Manager</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Manage official API connections and synchronization workflows. Credentials remain exclusively on the backend.
        </p>
      </div>

      {actionNotice && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          background: actionNotice.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
          border: `1px solid ${actionNotice.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
          color: actionNotice.type === 'success' ? '#34d399' : '#f87171',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.85rem'
        }}>
          {actionNotice.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
          <span>{actionNotice.text}</span>
        </div>
      )}

      {/* Architecture Notice */}
      <div style={{ padding: '14px 18px', borderRadius: 'var(--radius-md)', background: 'rgba(99, 102, 241, 0.07)', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <Info size={18} color="#818cf8" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          <strong style={{ color: 'var(--text-primary)' }}>Official API Architecture:</strong> Google Analytics 4, Google Ads, and Shopify integrations use official REST/gRPC endpoints. External API tokens are stored in <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: '4px' }}>backend/.env</code>.
          CSV import is strictly an <strong>offline fallback</strong> per PDF specification (Page 3, Rule 8–9).
        </div>
      </div>

      {/* Sync Feedback Banner */}
      {syncFeedback && (
        <div style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          background: syncFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
          border: `1px solid ${syncFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
          color: syncFeedback.type === 'success' ? '#6ee7b7' : '#fca5a5',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start'
        }}>
          {syncFeedback.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <div>
            <div>{syncFeedback.message}</div>
            {syncFeedback.type === 'error' && (
              <div style={{ fontSize: '0.78rem', marginTop: '6px', color: 'var(--text-muted)' }}>
                ⚠️ Previous valid data has been preserved. Synchronization failure does not overwrite existing data.
              </div>
            )}
            {syncFeedback.missing_credentials?.length > 0 && (
              <div style={{ marginTop: '8px', fontSize: '0.78rem' }}>
                <strong>Required backend credentials:</strong>
                <ul style={{ marginTop: '4px', paddingLeft: '18px' }}>
                  {syncFeedback.missing_credentials.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Data Source Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '18px' }}>
        {dataSources.map(source => {
          const meta = PROVIDER_META[source.provider] || PROVIDER_META.csv;
          const isSyncing = syncingSourceId === source.id;
          const isConnected = source.status === 'connected';

          return (
            <div key={source.id} className="glass-panel" style={{ padding: '22px', borderTop: `3px solid ${meta.color}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '1.8rem' }}>{meta.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{source.display_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{meta.description}</div>
                  </div>
                </div>
                <div>
                  {isConnected ? (
                    <span className="badge badge-realtime"><CheckCircle size={11} /> Connected</span>
                  ) : (
                    <span className="badge badge-historical"><AlertTriangle size={11} /> Disconnected</span>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <span className={`badge badge-${source.data_type === 'realtime' ? 'realtime' : source.data_type === 'sample_demo' || source.is_sample_data ? 'sample' : 'scheduled'}`}>
                  {source.data_type === 'realtime' ? 'REALTIME' : source.is_sample_data ? 'SAMPLE DATA' : source.data_type?.toUpperCase()}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Provider: <strong>{source.provider}</strong></span>
              </div>

              {/* Last Sync */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                <Clock size={13} />
                <span>Last Sync: <strong style={{ color: 'var(--text-secondary)' }}>
                  {source.last_sync_at ? new Date(source.last_sync_at).toLocaleString() : 'Never'}
                </strong></span>
                {source.last_sync_status && (
                  <span style={{
                    marginLeft: '8px',
                    color: source.last_sync_status === 'SUCCESS' ? '#34d399' : source.last_sync_status === 'FAILED' ? '#f87171' : 'var(--text-muted)'
                  }}>
                    [{source.last_sync_status}]
                  </span>
                )}
              </div>

              {/* Error Message */}
              {source.last_error_message && (
                <div style={{ fontSize: '0.75rem', color: '#fca5a5', padding: '8px 12px', background: 'rgba(244, 63, 94, 0.07)', borderRadius: 'var(--radius-sm)', marginBottom: '14px', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                  <AlertTriangle size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  {source.last_error_message.length > 100 ? source.last_error_message.slice(0, 100) + '...' : source.last_error_message}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-emerald"
                  disabled={isSyncing || !isConnected}
                  onClick={() => handleSyncNow(source.id)}
                  style={{ fontSize: '0.82rem', padding: '8px 14px', opacity: isSyncing || !isConnected ? 0.6 : 1 }}
                >
                  <RefreshCw size={14} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
                {isConnected ? (
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDisconnect(source.id, source.display_name)}
                    style={{ fontSize: '0.82rem', padding: '8px 14px' }}
                  >
                    <Unlink size={14} /> Disconnect
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={() => setConnectingSource(source)}
                    style={{ fontSize: '0.82rem', padding: '8px 14px' }}
                  >
                    <Link size={14} /> Connect via Official API
                  </button>
                )}
              </div>

              {/* Credential Requirement Note */}
              {!isConnected && source.provider !== 'csv' && (
                <div style={{ marginTop: '12px', padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '0.75rem', color: '#fcd34d' }}>
                  <strong>External API Credentials Required:</strong> Configure <code>{source.provider.toUpperCase().replace('_', ' ')}</code> API credentials in <code>backend/.env</code> to activate live data.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CSV Fallback Upload Form (PDF Page 3: CSV import as fallback for unavailable API connections) */}
      <div className="glass-panel" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <FileSpreadsheet size={18} color="#818cf8" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Offline CSV Fallback Data Ingestion</h3>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Per PDF specification, CSV upload is supported strictly as a fallback when an official API cannot be authorized.
        </p>

        {csvNotice && (
          <div style={{
            marginBottom: '14px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.825rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: csvNotice.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
            border: `1px solid ${csvNotice.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            color: csvNotice.type === 'success' ? '#34d399' : '#f87171'
          }}>
            {csvNotice.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
            <span>{csvNotice.text}</span>
          </div>
        )}

        <form onSubmit={handleCsvUpload} style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Data Category
            </label>
            <select
              value={csvCategory}
              onChange={e => setCsvCategory(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem'
              }}
            >
              <option value="orders">Orders & Sales (Shopify fallback)</option>
              <option value="campaigns">Advertising Campaigns (Google Ads fallback)</option>
              <option value="web_metrics">Website Sessions & Traffic (GA4 fallback)</option>
            </select>
          </div>

          <div style={{ flex: '2', minWidth: '250px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              CSV File (.csv)
            </label>
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              style={{
                width: '100%',
                background: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                padding: '7px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={uploadingCsv}
            style={{ padding: '8px 18px' }}
          >
            <Upload size={14} />
            {uploadingCsv ? 'Ingesting CSV...' : 'Import Fallback CSV'}
          </button>
        </form>
      </div>

      {/* Credential Configuration Guide */}
      <div className="glass-panel" style={{ padding: '22px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={18} color="#818cf8" /> Backend Configuration: backend/.env
        </h3>
        <pre style={{
          background: 'rgba(0,0,0,0.3)',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.8rem',
          lineHeight: '1.8',
          color: '#94a3b8',
          overflowX: 'auto',
          border: '1px solid var(--border-subtle)'
        }}>
{`# Google Analytics 4 (GA4 API)
GA_PROPERTY_ID=XXXXXXXXX
GA_ACCESS_TOKEN=ya29.xxx...

# Google Ads API
GOOGLE_ADS_DEVELOPER_TOKEN=xxxx
GOOGLE_ADS_CUSTOMER_ID=xxx-xxx-xxxx
GOOGLE_ADS_ACCESS_TOKEN=ya29.xxx...

# Shopify Admin API
SHOPIFY_SHOP_URL=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxx...

# MySQL Configuration (falls back to local SQLite if unconfigured)
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DB=marketing_analytics`}
        </pre>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '12px' }}>
          API credentials are NEVER exposed to the React frontend. All external API communication occurs exclusively on the Python Flask backend.
        </p>
      </div>
    </div>
  );
}
