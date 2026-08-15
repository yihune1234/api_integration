import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  CreditCard,
  KeyRound,
  Play,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { getSession, type Session } from "@/lib/api/authApi";
import { getUsage, type UsageResponse } from "@/lib/api/usageApi";
import { listApiKeys, type ApiKeyMetadata } from "@/lib/api/apiKeysApi";
import { Badge, Card } from "@/components/app/basic";
import { PageHeader, StatCard } from "@/components/app/headers";
import { Shell } from "@/components/app/shell";
import { formatDate } from "@/lib/utils";

export function DashboardPage() {
  const session = getSession<Session>();
  const [usage, setUsage] = useState<UsageResponse["usage"] | null>(null);
  const [keys, setKeys] = useState<ApiKeyMetadata[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [u, k] = await Promise.all([getUsage(), listApiKeys()]);
        if (!cancelled) {
          setUsage(u.usage);
          setKeys(k.apiKeys);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? "Failed to load dashboard data.");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const activeKeys = keys.filter((key) => key.status === "active").length;
  const total = usage?.total ?? 0;
  const successRate = usage && usage.total > 0
    ? Math.round((usage.successful / usage.total) * 1000) / 10
    : 100;

  return (
    <Shell role="user">
      <PageHeader
        eyebrow="WORKSPACE OVERVIEW"
        title={`Good morning, ${session?.organizationName?.split(" ")[0] ?? "there"}.`}
        description="A clear view of your extraction workspace, usage, and access."
        action={
          <Link
            href="/app/playground"
            className="eb-button eb-button-primary eb-button-md"
            data-testid="link-run-extraction"
          >
            <Play size={16} /> Run an extraction
          </Link>
        }
      />
      {error && <div className="field-error" data-testid="status-dashboard-error">{error}</div>}
      <div className="stats-grid">
        <StatCard
          label="Requests this month"
          value={(usage?.monthly ?? 0).toLocaleString()}
          detail={<span>{total.toLocaleString()} all-time requests</span>}
          icon={Activity}
        />
        <StatCard
          label="Success rate"
          value={`${successRate}%`}
          detail={<span>{usage?.failed ?? 0} failed requests</span>}
          icon={CheckCircle2}
          accent="gold"
        />
        <StatCard
          label="Active API keys"
          value={String(activeKeys)}
          detail={<span>Across {keys.length} total keys</span>}
          icon={KeyRound}
          accent="blue"
        />
        <StatCard
          label="Requests left today"
          value={(usage?.quota.remaining ?? 0).toLocaleString()}
          detail={<span>{(usage?.quota.used ?? 0).toLocaleString()} of {(usage?.quota.limit ?? 0).toLocaleString()} used</span>}
          icon={CreditCard}
          accent="green"
        />
      </div>
      <div className="dashboard-grid">
        <Card className="chart-card">
          <div className="card-heading">
            <div>
              <div className="section-kicker">REQUEST VOLUME</div>
              <h2>Extraction activity</h2>
            </div>
            <Link
              href="/app/usage"
              className="text-link"
              data-testid="link-view-usage"
            >
              View usage <ArrowRight size={14} />
            </Link>
          </div>
          <div className="chart-summary">
            <strong>{usage?.daily ?? 0}</strong>
            <span>requests today</span>
          </div>
          <div className="mini-chart" aria-label="Daily request volume" data-testid="chart-daily-requests">
            <div className="chart-column">
              <div className="chart-bar-wrap">
                <div className="chart-bar" style={{ height: "100%" }} title={`${usage?.daily ?? 0} requests today`} />
              </div>
              <span>Today</span>
            </div>
          </div>
        </Card>
        <Card className="status-card">
          <div className="card-heading">
            <div>
              <div className="section-kicker">PLATFORM STATUS</div>
              <h2>Built for dependable work</h2>
            </div>
            <ShieldCheck size={20} className="teal-icon" />
          </div>
          <div className="status-big">
            <span className="status-orb" />
            Operational
          </div>
          <p>EthioBridge is processing requests normally across all regions.</p>
          <div className="status-row">
            <span>API gateway</span>
            <Badge tone="success">Healthy</Badge>
          </div>
          <div className="status-row">
            <span>Extraction engine</span>
            <Badge tone="success">Healthy</Badge>
          </div>
          <div className="status-row">
            <span>Average latency</span>
            <strong>~180 ms</strong>
          </div>
        </Card>
      </div>
      <div className="dashboard-grid bottom-grid">
        <Card className="recent-card">
          <div className="card-heading">
            <div>
              <div className="section-kicker">RECENT REQUESTS</div>
              <h2>Usage summary</h2>
            </div>
            <Link
              href="/app/usage"
              className="icon-link"
              aria-label="View all requests"
              data-testid="link-all-requests"
            >
              <ArrowRight size={17} />
            </Link>
          </div>
          <div className="table-scroll">
            <table className="eb-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="strong">Total requests</td>
                  <td className="mono">{(usage?.total ?? 0).toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="strong">Today</td>
                  <td className="mono">{(usage?.daily ?? 0).toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="strong">This month</td>
                  <td className="mono">{(usage?.monthly ?? 0).toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="strong">Failed</td>
                  <td className="mono">{(usage?.failed ?? 0).toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="strong">Successful</td>
                  <td className="mono">{(usage?.successful ?? 0).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="quick-card">
          <div className="section-kicker">QUICK ACCESS</div>
          <h2>Make something useful</h2>
          <div className="quick-links">
            <Link href="/app/api-keys" data-testid="link-quick-keys">
              <span className="quick-link-icon"><KeyRound size={16} /></span>
              <span><strong>Manage API keys</strong><small>Rotate or create a credential</small></span>
              <ArrowRight size={15} />
            </Link>
            <Link href="/app/docs" data-testid="link-quick-docs">
              <span className="quick-link-icon"><BookOpen size={16} /></span>
              <span><strong>Read the docs</strong><small>Connect your first endpoint</small></span>
              <ArrowRight size={15} />
            </Link>
            <Link href="/app/playground" data-testid="link-quick-playground">
              <span className="quick-link-icon"><Terminal size={16} /></span>
              <span><strong>Open playground</strong><small>Try a document extraction</small></span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </Card>
      </div>
    </Shell>
  );
}


