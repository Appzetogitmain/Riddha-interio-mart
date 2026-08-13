import React, { useState, useEffect, useCallback } from 'react';
import PageWrapper from '../components/PageWrapper';
import {
  FiTrendingUp, FiUsers, FiCheckCircle, FiAlertTriangle, FiZap, FiActivity
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import {
  fetchJourneyDashboard,
  fetchJourneyFunnel,
  fetchFeatureImpact
} from '../../../shared/utils/journey';

const STAGE_LABELS = {
  discovery: 'Discovery',
  inspiration: 'Inspiration',
  decision: 'Decision',
  purchase: 'Purchase',
  fulfillment: 'Fulfillment',
  'post-purchase': 'Post-Purchase'
};

const StatCard = ({ label, value, sub, icon: Icon, color, bg }) => (
  <div className="bg-white p-4 rounded-2xl border border-soft-oatmeal/40 shadow-sm flex items-center gap-3">
    <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center shadow-inner flex-shrink-0`}>
      <Icon size={18} />
    </div>
    <div className="min-w-0">
      <p className="text-[8px] font-black uppercase tracking-widest text-warm-sand/60 truncate">{label}</p>
      <p className="text-lg font-display font-bold text-deep-espresso">{value}</p>
      {sub && <p className="text-[8px] text-warm-sand font-bold">{sub}</p>}
    </div>
  </div>
);

/**
 * Journey analytics for admins (Requirement #17) — funnel, feature impact,
 * guidance acceptance and the biggest stage drop-off.
 */
const JourneyAnalyticsDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [segment, setSegment] = useState('');
  const [dateRange, setDateRange] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (segment) params.segment = segment;
      if (dateRange) params.dateRange = dateRange;

      const [d, f, i] = await Promise.all([
        fetchJourneyDashboard(params),
        fetchJourneyFunnel(),
        fetchFeatureImpact()
      ]);
      setDashboard(d);
      setFunnel(f);
      setImpact(i);
    } catch (err) {
      console.error('Failed to load journey analytics:', err);
      toast.error('Failed to load journey analytics.');
    } finally {
      setLoading(false);
    }
  }, [segment, dateRange]);

  useEffect(() => { load(); }, [load]);

  const funnelRows = funnel
    ? Object.entries(funnel.funnel || {}).map(([stage, count]) => ({ stage, count }))
    : [];
  const funnelTop = funnelRows.length ? Math.max(...funnelRows.map((r) => r.count), 1) : 1;

  const impactRows = impact
    ? Object.entries(impact.featureImpact || {})
        .map(([id, v]) => ({ id, ...v }))
        .filter((r) => r.journeys > 0)
        .sort((a, b) => b.journeys - a.journeys)
    : [];

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-4 py-2">
        {/* Filters */}
        <div className="bg-white p-4 rounded-3xl border border-soft-oatmeal/40 shadow-sm flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-black uppercase tracking-widest text-warm-sand/60">Segment</span>
            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              className="bg-soft-oatmeal/5 border border-soft-oatmeal/40 rounded-lg px-3 py-2 text-[10px] font-bold outline-none capitalize"
            >
              <option value="">All</option>
              <option value="customer">Customer</option>
              <option value="enterpriser">Enterpriser</option>
              <option value="seller">Seller</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-black uppercase tracking-widest text-warm-sand/60">Range</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-soft-oatmeal/5 border border-soft-oatmeal/40 rounded-lg px-3 py-2 text-[10px] font-bold outline-none"
            >
              <option value="">All time</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
          <button
            onClick={load}
            className="ml-auto px-5 py-2.5 bg-deep-espresso text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-20 bg-white rounded-2xl border border-soft-oatmeal/40 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Journeys" value={dashboard?.totalJourneys ?? 0} icon={FiUsers} color="text-blue-500" bg="bg-blue-50" />
              <StatCard label="Completed" value={dashboard?.completed ?? 0} sub={`${dashboard?.completionRate ?? 0}% rate`} icon={FiCheckCircle} color="text-green-500" bg="bg-green-50" />
              <StatCard label="Converted" value={dashboard?.converted ?? 0} sub={`${dashboard?.conversionRate ?? 0}% rate`} icon={FiTrendingUp} color="text-purple-500" bg="bg-purple-50" />
              <StatCard label="Avg Duration" value={dashboard?.averageDuration ?? '—'} icon={FiActivity} color="text-amber-500" bg="bg-amber-50" />
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              {/* Funnel */}
              <div className="bg-white p-5 rounded-3xl border border-soft-oatmeal/40 shadow-sm">
                <h3 className="text-sm font-display font-bold text-deep-espresso mb-4">Journey Funnel</h3>
                <div className="space-y-2.5">
                  {funnelRows.map((row) => (
                    <div key={row.stage}>
                      <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                        <span className="text-deep-espresso">{STAGE_LABELS[row.stage] || row.stage}</span>
                        <span className="text-warm-sand">{row.count}</span>
                      </div>
                      <div className="w-full h-2.5 bg-soft-oatmeal/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-deep-espresso rounded-full transition-all duration-500"
                          style={{ width: `${(row.count / funnelTop) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {funnelRows.length === 0 && (
                    <p className="text-[11px] text-warm-sand italic">No journey data yet.</p>
                  )}
                </div>

                {dashboard?.bottleneck && (
                  <div className="mt-4 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <FiAlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={14} />
                    <p className="text-[10px] font-bold text-amber-700">
                      Biggest drop-off: {STAGE_LABELS[dashboard.bottleneck.from]} → {STAGE_LABELS[dashboard.bottleneck.to]}
                      <span className="font-black"> ({dashboard.bottleneck.dropOffRate}%)</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Feature impact */}
              <div className="bg-white p-5 rounded-3xl border border-soft-oatmeal/40 shadow-sm">
                <h3 className="text-sm font-display font-bold text-deep-espresso mb-1">Feature Impact</h3>
                <p className="text-[9px] text-warm-sand font-bold uppercase tracking-widest mb-4">
                  Conversion lift vs. {impact?.baselineConversionRate ?? 0}% baseline
                </p>
                <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
                  {impactRows.map((row) => (
                    <div key={row.id} className="flex items-center gap-3 bg-soft-oatmeal/5 rounded-xl px-3 py-2.5 border border-soft-oatmeal/30">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-deep-espresso truncate">{row.label}</p>
                        <p className="text-[9px] text-warm-sand">{row.journeys} journeys &bull; {row.usageRate}% usage</p>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg shrink-0 ${
                        row.conversionLift > 0 ? 'bg-green-50 text-green-600'
                          : row.conversionLift < 0 ? 'bg-red-50 text-red-500'
                          : 'bg-soft-oatmeal/20 text-warm-sand'
                      }`}>
                        {row.conversionLift > 0 ? '+' : ''}{row.conversionLift}pp
                      </span>
                    </div>
                  ))}
                  {impactRows.length === 0 && (
                    <p className="text-[11px] text-warm-sand italic">No feature usage recorded yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
              {/* Guidance */}
              <div className="bg-white p-5 rounded-3xl border border-soft-oatmeal/40 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <FiZap className="text-[#189D91]" size={15} />
                  <h3 className="text-sm font-display font-bold text-deep-espresso">AI Guidance</h3>
                </div>
                <p className="text-3xl font-display font-black text-deep-espresso">
                  {dashboard?.guidance?.acceptanceRate ?? 0}%
                </p>
                <p className="text-[9px] font-black uppercase tracking-widest text-warm-sand/60 mb-3">Acceptance rate</p>
                <div className="flex gap-4 text-[10px] font-bold text-warm-sand">
                  <span>Shown: {dashboard?.guidance?.shown ?? 0}</span>
                  <span className="text-green-600">Accepted: {dashboard?.guidance?.accepted ?? 0}</span>
                  <span className="text-red-400">Ignored: {dashboard?.guidance?.ignored ?? 0}</span>
                </div>
              </div>

              {/* Segments */}
              <div className="bg-white p-5 rounded-3xl border border-soft-oatmeal/40 shadow-sm">
                <h3 className="text-sm font-display font-bold text-deep-espresso mb-3">By Segment</h3>
                <div className="space-y-1.5">
                  {(dashboard?.byPersona || []).map((row) => (
                    <div key={row.persona} className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-deep-espresso capitalize">{row.persona}</span>
                      <span className="text-warm-sand font-bold">{row.count}</span>
                    </div>
                  ))}
                  {!dashboard?.byPersona?.length && <p className="text-[11px] text-warm-sand italic">No data.</p>}
                </div>
              </div>

              {/* Devices */}
              <div className="bg-white p-5 rounded-3xl border border-soft-oatmeal/40 shadow-sm">
                <h3 className="text-sm font-display font-bold text-deep-espresso mb-3">By Device</h3>
                <div className="space-y-1.5">
                  {(dashboard?.byDevice || []).map((row) => (
                    <div key={row.device} className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-deep-espresso capitalize">{row.device}</span>
                      <span className="text-warm-sand font-bold">{row.count}</span>
                    </div>
                  ))}
                  {!dashboard?.byDevice?.length && <p className="text-[11px] text-warm-sand italic">No data.</p>}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </PageWrapper>
  );
};

export default JourneyAnalyticsDashboard;
