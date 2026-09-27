import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import FreshnessBanner from '../components/FreshnessBanner';
import MetricCard from '../components/MetricCard';
import { LineChart, BarChart } from '../components/InteractiveCharts';
import {
  DollarSign, ShoppingCart, Users, TrendingUp, Monitor, Megaphone,
  RefreshCw, Activity, ArrowUpRight, Package, Globe, ChevronRight
} from 'lucide-react';

function Section({ title, badge, badgeType = 'scheduled', children, action }) {
  return (
    <div className="glass-panel" style={{ padding: '22px', marginBottom: '0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>
          {badge && <span className={`badge badge-${badgeType}`}>{badge}</span>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function DashboardView() {
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'business_owner';

  const [days, setDays] = useState(30);
  const [salesSummary, setSalesSummary] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState(null);
  const [campaigns, setCampaigns] = useState(null);
  const [campaignComparison, setCampaignComparison] = useState([]);
  const [traffic, setTraffic] = useState([]);
  const [realtime, setRealtime] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sum, trend, prods, custs, camp, campComp, traff, rt, fn] = await Promise.allSettled([
        api.getSalesSummary(days),
        api.getSalesTrend(days),
        api.getProductPerformance(8),
        api.getCustomerOverview(),
        api.getCampaignSummary(),
        api.getCampaignComparison(),
        api.getTrafficSources(),
        api.getRealtimeMetrics(),
        api.getFunnel()
      ]);

      if (sum.status === 'fulfilled') setSalesSummary(sum.value);
      if (trend.status === 'fulfilled') setSalesTrend(trend.value.trend || []);
      if (prods.status === 'fulfilled') setProducts(prods.value.products || []);
      if (custs.status === 'fulfilled') setCustomers(custs.value);
      if (camp.status === 'fulfilled') setCampaigns(camp.value);
      if (campComp.status === 'fulfilled') setCampaignComparison(campComp.value.campaigns || []);
      if (traff.status === 'fulfilled') setTraffic(traff.value.traffic_sources || []);
      if (rt.status === 'fulfilled') setRealtime(rt.value);
      if (fn.status === 'fulfilled') setFunnel(fn.value);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { loadData(); }, [loadData]);

  const isOwner = ['business_owner'].includes(role);
  const isMarketer = ['marketing_manager', 'business_owner'].includes(role);
  const isAnalyst = ['business_analyst', 'business_owner'].includes(role);

  const salesTrendForChart = salesTrend.map(d => ({ date: d.date, revenue: d.revenue }));
  const productChartData = products.slice(0, 8).map(p => ({ category: p.title.split(' ').slice(0, 2).join(' '), value: p.total_revenue }));
  const trafficChartData = traffic.slice(0, 6).map(t => ({ category: t.source.split(' ')[0], value: t.sessions }));
  const campaignChartData = campaignComparison.slice(0, 6).map(c => ({ category: c.name.split(' ').slice(0, 2).join(' '), value: c.conversions }));

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px', flex: 1 }}>
      <FreshnessBanner />

      {/* Period Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Period:</span>
        {[7, 14, 30, 60, 90].map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className="btn"
            style={{
              padding: '6px 14px',
              background: days === d ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255,255,255,0.04)',
              color: days === d ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${days === d ? '#6366f1' : 'var(--border-subtle)'}`,
              fontSize: '0.8rem'
            }}
          >
            {d}d
          </button>
        ))}
        <button className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '0.8rem', marginLeft: 'auto' }} onClick={loadData}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* SECTION 1 & 2: Revenue, Orders, AOV */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <MetricCard title="Total Revenue" value={salesSummary?.total_revenue ?? 0} prefix="$" change={salesSummary?.growth_pct} changeLabel="vs prior period" icon={DollarSign} badgeType="scheduled" badgeText="Shopify" />
        <MetricCard title="Total Orders" value={salesSummary?.order_count ?? 0} change={null} icon={ShoppingCart} badgeType="scheduled" badgeText="Shopify" />
        <MetricCard title="Avg Order Value" value={salesSummary?.aov ?? 0} prefix="$" icon={TrendingUp} badgeType="scheduled" badgeText="Shopify" />
        <MetricCard title="Active Users (Realtime)" value={realtime?.realtime_active_users ?? '--'} icon={Activity} badgeType="realtime" badgeText="GA4 Live" />
      </div>

      {/* SECTION 3: Customer Overview */}
      {(isOwner || isAnalyst) && customers && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <MetricCard title="Total Customers" value={customers.total_customers ?? 0} icon={Users} badgeType="scheduled" badgeText="Shopify" />
          <MetricCard title="New Customers" value={customers.new_customers ?? 0} icon={Users} badgeType="scheduled" badgeText="Shopify" />
          <MetricCard title="Returning Customers" value={customers.returning_customers ?? 0} icon={Users} badgeType="scheduled" badgeText="Shopify" />
          <MetricCard title="Repeat Purchase Rate" value={customers.repeat_purchase_rate ?? 0} suffix="%" icon={ArrowUpRight} badgeType="scheduled" badgeText="Shopify" />
        </div>
      )}

      {/* SECTION 4: Sales Trend */}
      <Section title="Sales Trend" badge="Last 30 Days · Shopify" badgeType="scheduled"
        action={<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Daily Revenue (USD)</span>}>
        {salesTrend.length > 0
          ? <LineChart data={salesTrendForChart} xKey="date" yKey="revenue" height={240} strokeColor="#6366f1" />
          : <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading trend data...</div>
        }
      </Section>

      {/* SECTION 5 & 6: Products + Campaigns side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px' }}>
        {/* Section 5: Product Performance */}
        <Section title="Top Product Performance" badge="Shopify" badgeType="scheduled">
          {products.length > 0 ? (
            <>
              <BarChart data={productChartData} xKey="category" yKey="value" height={180} barColor="#10b981" />
              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {products.slice(0, 6).map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={14} color="#34d399" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.title}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.category} · {p.total_units_sold} sold</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>${p.total_revenue?.toLocaleString()}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.inventory_quantity} in stock</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No product data</div>}
        </Section>

        {/* Section 6: Campaign Performance */}
        {isMarketer && (
          <Section title="Campaign Performance" badge="Google Ads" badgeType="scheduled">
            {campaigns && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                {[
                  { label: 'Impressions', val: campaigns.impressions?.toLocaleString() },
                  { label: 'Clicks', val: campaigns.clicks?.toLocaleString() },
                  { label: 'Total Cost', val: `$${campaigns.cost?.toLocaleString()}` },
                  { label: 'Conversions', val: campaigns.conversions?.toLocaleString() },
                  { label: 'CTR', val: `${campaigns.ctr}%` },
                  { label: 'ROAS', val: `${campaigns.roas}x` }
                ].map((kpi, i) => (
                  <div key={i} style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{kpi.label}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '3px' }}>{kpi.val}</div>
                  </div>
                ))}
              </div>
            )}
            {campaignComparison.length > 0 && (
              <BarChart data={campaignChartData} xKey="category" yKey="value" height={150} barColor="#818cf8" />
            )}
          </Section>
        )}
      </div>

      {/* SECTION 8: Traffic Sources & Website Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px' }}>
        <Section title="Website Traffic Sources" badge="Google Analytics 4" badgeType="realtime">
          {traffic.length > 0 ? (
            <>
              <BarChart data={trafficChartData} xKey="category" yKey="value" height={160} barColor="#06b6d4" />
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {traffic.slice(0, 5).map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Globe size={13} color="#38bdf8" />
                      <span style={{ color: 'var(--text-secondary)' }}>{t.source}</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>{t.sessions?.toLocaleString()} sessions</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No traffic data</div>}
        </Section>

        {/* Marketing Funnel */}
        <Section title="Marketing Business Funnel" badge="Multi-Source" badgeType="scheduled">
          {funnel?.stages ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {funnel.stages.map((stage, i) => {
                const maxCount = Math.max(...funnel.stages.map(s => Number(s.count) || 0), 1);
                const pct = Math.min(100, Math.round((Number(stage.count) / maxCount) * 100));
                const colors = ['#6366f1', '#818cf8', '#10b981', '#34d399', '#f59e0b', '#fbbf24'];
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{stage.stage}</span>
                      <span style={{ fontWeight: 700 }}>{typeof stage.count === 'number' ? stage.count.toLocaleString() : stage.count} {stage.unit}</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: colors[i % colors.length], borderRadius: '4px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Click-Through Rate</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399' }}>{funnel.ctr}%</div>
                </div>
                <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Visit → Order Rate</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#818cf8' }}>{funnel.visit_to_order_rate}%</div>
                </div>
              </div>
            </div>
          ) : <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>Loading funnel data...</div>}
        </Section>
      </div>

      {/* SECTION 11: Last Synchronization Status */}
      <Section title="Last Synchronization Status" badge="System" badgeType="historical">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[
            { name: 'Shopify', icon: '🛍️', color: '#96bf48' },
            { name: 'Google Analytics 4', icon: '📊', color: '#4285f4' },
            { name: 'Google Ads', icon: '📢', color: '#fbbc04' },
            { name: 'CSV Fallback', icon: '📄', color: '#64748b' }
          ].map((src) => (
            <div key={src.name} style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ fontSize: '1.2rem' }}>{src.icon}</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{src.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Connector ready. Awaiting live credentials.</div>
              <span className="badge badge-sample" style={{ alignSelf: 'flex-start', fontSize: '0.62rem' }}>SAMPLE DATA ACTIVE</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
