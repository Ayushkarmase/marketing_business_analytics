import React from 'react';
import { useBusiness } from '../context/BusinessContext';
import { AlertTriangle, Clock, Activity, ShieldCheck } from 'lucide-react';

export default function FreshnessBanner() {
  const { hasSampleData, latestSyncDate, dataSources } = useBusiness();

  const formattedDate = latestSyncDate
    ? new Date(latestSyncDate).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    : 'Never Synced';

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      padding: '10px 18px',
      marginBottom: '20px',
      borderRadius: 'var(--radius-md)',
      background: hasSampleData ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)',
      border: `1px solid ${hasSampleData ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {hasSampleData ? (
          <span className="badge badge-sample">
            <AlertTriangle size={13} />
            SAMPLE / DEMO DATA ACTIVE
          </span>
        ) : (
          <span className="badge badge-realtime">
            <ShieldCheck size={13} />
            AUTHORIZED LIVE DATA
          </span>
        )}
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {hasSampleData 
            ? 'Operating in demonstration mode. Live external API credentials are not yet configured.'
            : 'Connected directly to authorized official APIs.'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="pulse-dot" />
          <span style={{ color: '#6ee7b7', fontWeight: 600 }}>GA4 Realtime Active</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={14} />
          <span>Last Data Sync: <strong style={{ color: 'var(--text-primary)' }}>{formattedDate}</strong></span>
        </div>
      </div>
    </div>
  );
}
