import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FileText, TrendingUp, Users, Megaphone, ShoppingCart, RefreshCw, AlertTriangle, ArrowUpRight, CheckCircle } from 'lucide-react';

const INSIGHT_COLORS = {
  opportunity: { bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.25)', icon: <CheckCircle size={18} color="#34d399" />, label: 'OPPORTUNITY' },
  warning: { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.25)', icon: <AlertTriangle size={18} color="#fbbf24" />, label: 'ACTION NEEDED' },
  actionable: { bg: 'rgba(99, 102, 241, 0.08)', border: 'rgba(99, 102, 241, 0.25)', icon: <ArrowUpRight size={18} color="#818cf8" />, label: 'ACTIONABLE' },
  forecast: { bg: 'rgba(139, 92, 246, 0.08)', border: 'rgba(139, 92, 246, 0.25)', icon: <TrendingUp size={18} color="#c4b5fd" />, label: 'FORECAST' }
};

export default function ReportsView() {
  const [report, setReport] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rep, ins] = await Promise.allSettled([
        api.getExecutiveReport(),
        api.getActionableInsights()
      ]);
      if (rep.status === 'fulfilled') setReport(rep.value);
      if (ins.status === 'fulfilled') setInsights(ins.value.insights || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    if (!report) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ report, insights }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `marketing_analytics_report_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '1200px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Reports & Business Insights</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Automated insights derived from processed analytics data. Covers sales, marketing, customer, and predictive dimensions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline" onClick={handleExportJSON} disabled={!report}>
            Export JSON
          </button>
          <button className="btn btn-outline" onClick={handlePrint} disabled={!report}>
            Print / PDF
          </button>
          <button className="btn btn-primary" onClick={loadReports} disabled={loading}>
            <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh Report
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', color: '#fca5a5', display: 'flex', gap: '10px' }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Executive Summary */}
      {report && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={20} color="#818cf8" />
              Executive Business Report
            </h3>
            <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Period: {report.reporting_period}</span>
              {report.data_freshness?.has_sample_data && (
                <span className="badge badge-sample">SAMPLE DATA</span>
              )}
              {report.data_freshness?.last_sync_at && (
                <span>Last Sync: {new Date(report.data_freshness.last_sync_at).toLocaleString()}</span>
              )}
            </div>
          </div>

          {/* Business Summary Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>

            {/* Sales Report */}
            <div style={{ padding: '18px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <ShoppingCart size={18} color="#34d399" />
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#34d399' }}>Sales Report</span>
              </div>
              {report.sales && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                  <tbody>
                    {[
                      ['Total Revenue', `$${report.sales.total_revenue?.toLocaleString()}`],
                      ['Total Orders', report.sales.order_count?.toLocaleString()],
                      ['Avg Order Value', `$${report.sales.aov}`],
                      ['Revenue Growth', `${report.sales.growth_pct > 0 ? '+' : ''}${report.sales.growth_pct}%`]
                    ].map(([label, val], i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '7px 0', color: 'var(--text-muted)' }}>{label}</td>
                        <td style={{ padding: '7px 0', fontWeight: 700, textAlign: 'right' }}>{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Customer Report */}
            <div style={{ padding: '18px', borderRadius: 'var(--radius-md)', background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Users size={18} color="#818cf8" />
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#818cf8' }}>Customer Report</span>
              </div>
              {report.customers && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                  <tbody>
                    {[
                      ['Total Customers', report.customers.total_customers?.toLocaleString()],
                      ['New Customers', report.customers.new_customers?.toLocaleString()],
                      ['Returning Customers', report.customers.returning_customers?.toLocaleString()],
                      ['Repeat Rate', `${report.customers.repeat_purchase_rate}%`],
                      ['Avg Customer Spend', `$${report.customers.avg_customer_spend}`]
                    ].map(([label, val], i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '7px 0', color: 'var(--text-muted)' }}>{label}</td>
                        <td style={{ padding: '7px 0', fontWeight: 700, textAlign: 'right' }}>{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Marketing Report */}
            <div style={{ padding: '18px', borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Megaphone size={18} color="#fbbf24" />
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fbbf24' }}>Marketing Report</span>
              </div>
              {report.marketing && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                  <tbody>
                    {[
                      ['Impressions', report.marketing.impressions?.toLocaleString()],
                      ['Clicks', report.marketing.clicks?.toLocaleString()],
                      ['Total Spend', `$${report.marketing.cost?.toLocaleString()}`],
                      ['Conversions', report.marketing.conversions?.toLocaleString()],
                      ['CTR', `${report.marketing.ctr}%`],
                      ['ROAS', `${report.marketing.roas}x`]
                    ].map(([label, val], i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '7px 0', color: 'var(--text-muted)' }}>{label}</td>
                        <td style={{ padding: '7px 0', fontWeight: 700, textAlign: 'right' }}>{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Top Products */}
            {report.top_products?.length > 0 && (
              <div style={{ padding: '18px', borderRadius: 'var(--radius-md)', background: 'rgba(6, 182, 212, 0.06)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <ShoppingCart size={18} color="#38bdf8" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#38bdf8' }}>Top 5 Products</span>
                </div>
                {report.top_products.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{p.title?.length > 22 ? p.title.slice(0, 22) + '..' : p.title}</span>
                    <span style={{ fontWeight: 700 }}>${p.total_revenue?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actionable Business Insights */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingUp size={20} color="#10b981" />
          Actionable Business Insights
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>Based on processed analytics data</span>
        </h3>

        {loading && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Generating insights from analytics pipeline...</div>}

        {!loading && insights.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
            No insights generated yet. Ensure data sources are connected and synced.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {insights.map((insight, i) => {
            const style = INSIGHT_COLORS[insight.type] || INSIGHT_COLORS.actionable;
            return (
              <div key={i} style={{
                padding: '18px',
                borderRadius: 'var(--radius-md)',
                background: style.bg,
                border: `1px solid ${style.border}`,
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start'
              }}>
                <div style={{ flexShrink: 0, marginTop: '2px' }}>{style.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{insight.title}</span>
                    <span className={`badge badge-${insight.type === 'forecast' ? 'estimate' : insight.type === 'warning' ? 'sample' : 'scheduled'}`} style={{ fontSize: '0.62rem' }}>
                      {style.label}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{insight.category}</span>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{insight.description}</p>
                  <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    📌 Expected Impact: <strong style={{ color: 'var(--text-primary)' }}>{insight.impact}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
