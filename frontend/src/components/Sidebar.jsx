import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Database, Users, TrendingUp, FileText, Settings, ShieldAlert } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'business_owner';

  const navItems = [
    { id: 'dashboard', label: 'Main Dashboard', icon: LayoutDashboard, roles: ['business_owner', 'marketing_manager', 'business_analyst', 'company_admin'] },
    { id: 'datasources', label: 'Data Sources Manager', icon: Database, roles: ['company_admin', 'marketing_manager', 'business_owner'] },
    { id: 'segmentation', label: 'Customer Segmentation', icon: Users, roles: ['business_owner', 'business_analyst'] },
    { id: 'forecasting', label: 'Predictive Sales Forecast', icon: TrendingUp, roles: ['business_owner', 'business_analyst'] },
    { id: 'reports', label: 'Reports & Insights', icon: FileText, roles: ['business_owner', 'business_analyst', 'company_admin', 'marketing_manager'] },
    { id: 'settings', label: 'System Settings', icon: Settings, roles: ['company_admin', 'business_owner'] }
  ];

  return (
    <aside style={{
      width: '260px',
      flexShrink: 0,
      borderRight: '1px solid var(--border-subtle)',
      background: 'rgba(16, 21, 34, 0.5)',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: 'calc(100vh - 73px)'
    }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ padding: '0 12px 10px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Navigation
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isPermitted = item.roles.includes(role);

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 14px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: isActive ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(79, 70, 229, 0.08))' : 'transparent',
                color: isActive ? '#a5b4fc' : isPermitted ? 'var(--text-secondary)' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
                opacity: isPermitted ? 1 : 0.6
              }}
            >
              <Icon size={18} color={isActive ? '#818cf8' : 'currentColor'} />
              <span>{item.label}</span>
              {!isPermitted && (
                <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  (Restricted)
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{
        padding: '14px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-subtle)',
        fontSize: '0.775rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>
          <ShieldAlert size={14} color="#f59e0b" />
          <span>Active Role Access</span>
        </div>
        <p style={{ textTransform: 'capitalize' }}>
          Current: <strong style={{ color: 'var(--text-primary)' }}>{role.replace('_', ' ')}</strong>
        </p>
        <p style={{ marginTop: '4px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Permissions automatically tailor dashboard views according to FYP 2026–2027 specifications.
        </p>
      </div>
    </aside>
  );
}
