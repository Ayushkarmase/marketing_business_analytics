import React, { useState } from 'react';

export function LineChart({ data = [], xKey = 'date', yKey = 'revenue', height = 220, strokeColor = '#6366f1', fillColor = 'rgba(99, 102, 241, 0.15)' }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available</div>;
  }

  const values = data.map(d => Number(d[yKey]) || 0);
  const maxVal = Math.max(...values, 10);
  const minVal = 0;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const width = 600;

  const getX = (idx) => padding.left + (idx / Math.max(1, data.length - 1)) * (width - padding.left - padding.right);
  const getY = (val) => height - padding.bottom - ((val - minVal) / (maxVal - minVal)) * (height - padding.top - padding.bottom);

  const points = data.map((d, i) => `${getX(i)},${getY(d[yKey])}`).join(' ');
  const areaPoints = `${getX(0)},${height - padding.bottom} ${points} ${getX(data.length - 1)},${height - padding.bottom}`;

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id={`grad-${yKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = height - padding.bottom - ratio * (height - padding.top - padding.bottom);
          const val = Math.round(minVal + ratio * (maxVal - minVal));
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <text x={padding.left - 8} y={y + 3} textAnchor="end" fontSize="9" fill="var(--text-muted)">${val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}</text>
            </g>
          );
        })}

        {/* Shaded Area */}
        <polygon points={areaPoints} fill={`url(#grad-${yKey})`} />

        {/* Line */}
        <polyline fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points} />

        {/* Hover Points */}
        {data.map((d, i) => {
          const cx = getX(i);
          const cy = getY(d[yKey]);
          const isHovered = hoveredIdx === i;

          return (
            <g key={i} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
              <circle cx={cx} cy={cy} r={isHovered ? 6 : 3} fill={strokeColor} stroke="#ffffff" strokeWidth={isHovered ? 2 : 1} style={{ cursor: 'pointer', transition: 'all 0.15s ease' }} />
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredIdx !== null && data[hoveredIdx] && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '20px',
          background: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-subtle)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.75rem',
          pointerEvents: 'none',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ color: 'var(--text-muted)' }}>{data[hoveredIdx][xKey]}</div>
          <div style={{ fontWeight: 700, color: '#ffffff' }}>${Number(data[hoveredIdx][yKey]).toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}

export function BarChart({ data = [], xKey = 'category', yKey = 'value', height = 220, barColor = '#818cf8' }) {
  if (!data || data.length === 0) {
    return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available</div>;
  }

  const values = data.map(d => Number(d[yKey]) || 0);
  const maxVal = Math.max(...values, 10);
  const padding = { top: 20, right: 20, bottom: 40, left: 45 };
  const width = 600;

  const barWidth = Math.min(36, ((width - padding.left - padding.right) / data.length) * 0.65);
  const getX = (idx) => padding.left + (idx + 0.5) * ((width - padding.left - padding.right) / data.length);
  const getY = (val) => height - padding.bottom - (val / maxVal) * (height - padding.top - padding.bottom);

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {[0, 0.5, 1].map((ratio, i) => {
          const y = height - padding.bottom - ratio * (height - padding.top - padding.bottom);
          const val = Math.round(ratio * maxVal);
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <text x={padding.left - 6} y={y + 3} textAnchor="end" fontSize="9" fill="var(--text-muted)">{val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}</text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const x = getX(i) - barWidth / 2;
          const y = getY(d[yKey]);
          const barH = height - padding.bottom - y;

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(2, barH)}
                rx="4"
                fill={barColor}
                opacity="0.85"
                style={{ transition: 'all 0.2s ease', cursor: 'pointer' }}
              />
              <text
                x={getX(i)}
                y={height - padding.bottom + 16}
                textAnchor="middle"
                fontSize="9"
                fill="var(--text-secondary)"
              >
                {String(d[xKey]).length > 12 ? `${String(d[xKey]).slice(0, 10)}..` : d[xKey]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function ScatterPlot({ points = [], xKey = 'recency', yKey = 'monetary', height = 240 }) {
  if (!points || points.length === 0) {
    return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No scatter points available</div>;
  }

  const xVals = points.map(p => Number(p[xKey]) || 0);
  const yVals = points.map(p => Number(p[yKey]) || 0);
  const maxX = Math.max(...xVals, 10);
  const maxY = Math.max(...yVals, 10);

  const padding = { top: 20, right: 20, bottom: 35, left: 55 };
  const width = 600;

  const getX = (val) => padding.left + (val / maxX) * (width - padding.left - padding.right);
  const getY = (val) => height - padding.bottom - (val / maxY) * (height - padding.top - padding.bottom);

  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* Grid lines */}
        {[0, 0.5, 1].map((ratio, i) => {
          const y = height - padding.bottom - ratio * (height - padding.top - padding.bottom);
          const val = Math.round(ratio * maxY);
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <text x={padding.left - 8} y={y + 3} textAnchor="end" fontSize="9" fill="var(--text-muted)">${val}</text>
            </g>
          );
        })}

        {/* X Axis label */}
        <text x={width / 2} y={height - 8} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
          Recency (Days since last purchase)
        </text>

        {points.map((p, i) => {
          const cx = getX(p[xKey]);
          const cy = getY(p[yKey]);
          const color = colors[p.cluster % colors.length];

          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="4.5"
              fill={color}
              opacity="0.8"
              stroke="#ffffff"
              strokeWidth="0.8"
            />
          );
        })}
      </svg>
    </div>
  );
}
