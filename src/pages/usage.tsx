import { useEffect, useState } from "react";
import { AlertTriangle, ArrowUpRight, BarChart3, Clock3, Database, Download } from "lucide-react";
import { getUsage, type UsageResponse } from "@/lib/api/usageApi";
import { Button, Badge, Card } from "@/components/app/basic";
import { PageHeader, StatCard } from "@/components/app/headers";
import { Shell } from "@/components/app/shell";

export function UsagePage() {
  const [usage, setUsage] = useState<UsageResponse["usage"] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getUsage();
        if (!cancelled) setUsage(data.usage);
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? "Failed to load usage.");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const total = usage?.total ?? 0;
  const failed = usage?.failed ?? 0;
  const successful = usage?.successful ?? 0;
  const successRate = total > 0 ? Math.round((successful / total) * 1000) / 10 : 100;

  return (
    <Shell role="user">
      <PageHeader
        eyebrow="OBSERVABILITY"
        title="Usage & requests"
        description="Understand how your extraction workload is moving through EthioBridge."
        action={
          <Button variant="secondary" onClick={() => window.print()} data-testid="button-export-usage">
            <Download size={16} /> Export summary
          </Button>
        }
      />
      {error && <div className="field-error" data-testid="status-usage-error">{error}</div>}
      <div className="stats-grid">
        <StatCard label="All-time requests" value={total.toLocaleString()} detail={<span>Since your workspace began</span>} icon={Database} />
        <StatCard label="Requests used today" value={(usage?.quota.used ?? 0).toLocaleString()} detail={<span>of {(usage?.quota.limit ?? 0).toLocaleString()} available</span>} icon={BarChart3} accent="gold" />
        <StatCard label="Requests left today" value={(usage?.quota.remaining ?? 0).toLocaleString()} detail={<span>Resets daily</span>} icon={Clock3} accent="blue" />
        <StatCard label="Failed requests" value={failed.toLocaleString()} detail={<span>{successRate}% success rate</span>} icon={AlertTriangle} accent="red" />
      </div>
      <Card className="usage-chart-card">
        <div className="card-heading">
          <div>
            <div className="section-kicker">REQUEST SUMMARY</div>
            <h2>Successful vs failed extraction calls</h2>
          </div>
          <div className="chart-legend">
            <span><i className="legend-dot teal" /> Successful</span>
            <span><i className="legend-dot sand" /> Failed</span>
          </div>
        </div>
        <div className="large-chart">
          <div className="y-labels">
            <span>{total}</span>
            <span>{Math.round(total * 0.66)}</span>
            <span>{Math.round(total * 0.33)}</span>
            <span>0</span>
          </div>
          <div className="large-chart-area">
            <div className="grid-lines"><i /><i /><i /><i /></div>
            <div className="large-columns">
              <div className="large-column">
                <div className="stacked-bar" style={{ height: "100%" }}>
                  <span className="bar-success" style={{ height: `${successRate}%` }} />
                  <span className="bar-failed" style={{ height: `${100 - successRate}%` }} />
                </div>
                <span>All time</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
      <div className="two-column">
        <Card className="table-card">
          <div className="table-card-header">
            <div>
              <div className="section-kicker">DETAIL</div>
              <h2>Usage breakdown</h2>
            </div>
            <Badge tone="info">Live</Badge>
          </div>
          <div className="table-scroll">
            <table className="eb-table">
              <thead>
                <tr><th>Metric</th><th>Value</th></tr>
              </thead>
              <tbody>
                <tr><td className="strong">Total requests</td><td className="mono">{total.toLocaleString()}</td></tr>
                <tr><td className="strong">Today</td><td className="mono">{(usage?.daily ?? 0).toLocaleString()}</td></tr>
                <tr><td className="strong">This month</td><td className="mono">{(usage?.monthly ?? 0).toLocaleString()}</td></tr>
                <tr><td className="strong">Daily limit</td><td className="mono">{(usage?.quota.limit ?? 0).toLocaleString()}</td></tr>
                <tr><td className="strong">Used today</td><td className="mono">{(usage?.quota.used ?? 0).toLocaleString()}</td></tr>
                <tr><td className="strong">Remaining today</td><td className="mono table-good">{(usage?.quota.remaining ?? 0).toLocaleString()}</td></tr>
                <tr><td className="strong">Successful</td><td className="mono table-good">{successful.toLocaleString()}</td></tr>
                <tr><td className="strong">Failed</td><td className="mono table-bad">{failed.toLocaleString()}</td></tr>
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="table-card">
          <div className="table-card-header">
            <div>
              <div className="section-kicker">MONTHLY TOTALS</div>
              <h2>Longer view</h2>
            </div>
            <Clock3 size={18} className="muted-icon" />
          </div>
          <div className="monthly-list">
            <div className="monthly-row">
              <span>This month</span>
              <div className="monthly-track"><i style={{ width: `${Math.min(100, ((usage?.monthly ?? 0) / 4500) * 100)}%` }} /></div>
              <strong>{(usage?.monthly ?? 0).toLocaleString()}</strong>
              <Badge tone="info">Current</Badge>
            </div>
          </div>
        </Card>
      </div>
    </Shell>
  );
}
