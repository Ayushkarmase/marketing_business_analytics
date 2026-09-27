import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { BarChart3, UserCheck, Building2, RefreshCw, User, PlusCircle } from 'lucide-react';

const ROLES = [
  { id: 'business_owner', label: 'Business Owner' },
  { id: 'marketing_manager', label: 'Marketing Manager' },
  { id: 'business_analyst', label: 'Business Analyst' },
  { id: 'company_admin', label: 'Company Administrator' }
];

export default function Navbar({ onOpenAuth }) {
  const { currentUser, switchRole } = useAuth();
  const { business, syncingSourceId } = useBusiness();

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 28px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--bg-secondary)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '8px',
          background: 'var(--accent-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff'
        }}>
          <BarChart3 size={20} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
            Marketing Business Analytics
          </h1>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Academic Year 2026–2027 • Official API Architecture
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {business && (
          <button
            onClick={() => onOpenAuth && onOpenAuth('business')}
            title="Click to edit business setup"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8rem',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <Building2 size={14} color="#818cf8" />
            <span style={{ fontWeight: 600 }}>{business.name}</span>
            <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>• {business.industry}</span>
          </button>
        )}

        {/* Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserCheck size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Role:</span>
          <select
            value={currentUser?.role || 'business_owner'}
            onChange={(e) => switchRole(e.target.value)}
            style={{
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {ROLES.map(r => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* User Account / Sign In */}
        <button
          onClick={() => onOpenAuth && onOpenAuth('login')}
          className="btn btn-outline"
          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          title="Sign in or register a new user"
        >
          <User size={14} />
          <span>{currentUser?.full_name?.split(' ')[0] || 'Account'}</span>
        </button>

        {syncingSourceId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#818cf8' }}>
            <RefreshCw size={14} className="spin" style={{ animation: 'spin 1.2s linear infinite' }} />
            <span>Syncing...</span>
          </div>
        )}
      </div>
    </header>
  );
}
