import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function MetricCard({
  title,
  value,
  prefix = '',
  suffix = '',
  change,
  changeLabel = 'vs prior period',
  icon: Icon,
  badgeType = 'scheduled', // realtime, scheduled, historical, sample, estimate
  badgeText
}) {
  const isPositive = change > 0;
  const isNeutral = change === 0 || change === undefined || change === null;

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {title}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {badgeText && (
            <span className={`badge badge-${badgeType}`} style={{ fontSize: '0.65rem' }}>
              {badgeText}
            </span>
          )}
          {Icon && (
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Icon size={16} color="#818cf8" />
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </span>
      </div>

      {change !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px',
            fontWeight: 700,
            color: isNeutral ? 'var(--text-muted)' : isPositive ? '#34d399' : '#f87171'
          }}>
            {isPositive ? <ArrowUpRight size={14} /> : isNeutral ? <Minus size={14} /> : <ArrowDownRight size={14} />}
            {isPositive ? '+' : ''}{change}%
          </span>
          <span style={{ color: 'var(--text-muted)' }}>{changeLabel}</span>
        </div>
      )}
    </div>
  );
}
