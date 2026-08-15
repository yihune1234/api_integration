import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  KeyRound,
  RefreshCw,
  Server,
  Users,
} from "lucide-react";
import { getAdminDashboard, type AdminDashboardStats } from "@/lib/api/adminApi";
import { Button, Badge, Card } from "@/components/app/basic";
import { PageHeader, StatCard } from "@/components/app/headers";
import { Shell } from "@/components/app/shell";

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const data = await getAdminDashboard();
      setStats(data.stats);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load dashboard.");
    }
  };

  useEffect(() => { void load(); }, []);

  const failedRate = (stats?.requests.total ?? 0) > 0
    ? Math.round(((stats?.requests.failed ?? 0) / (stats?.requests.total ?? 1)) * 1000) / 10
    : 0;

  return (
    <Shell role="admin">
      <PageHeader
        eyebrow="PLATFORM OPERATIONS"
        title="Good morning, team."
        description="The pulse of EthioBridge, across every organization and extraction request."
        action={
          <Button variant="secondary" onClick={() => void load()} data-testid="button-refresh-admin-dashboard">
            <RefreshCw size={16} /> Refresh data
          </Button>
        }
      />
      {error && <div className="field-error" data-testid="status-admin-dashboard-error">{error}</div>}
      <div className="stats-grid">
        <StatCard
          label="Total organizations"
          value={(stats?.users.total ?? 0).toLocaleString()}
          detail={<span>{stats?.users.active ?? 0} active</span>}
          icon={Users}
        />
        <StatCard
          label="Active API keys"
          value={(stats?.apiKeys.active ?? 0).toLocaleString()}
          detail={<span>{(stats?.apiKeys.total ?? 0).toLocaleString()} total</span>}
          icon={KeyRound}
          accent="gold"
        />
        <StatCard
          label="Requests this month"
          value={(stats?.requests.monthly ?? 0).toLocaleString()}
          detail={<span>{(stats?.requests.total ?? 0).toLocaleString()} all-time</span>}
          icon={Activity}
          accent="blue"
        />
        <StatCard
          label="Failed requests"
          value={(stats?.requests.failed ?? 0).toLocaleString()}
          detail={<span>of {(stats?.requests.total ?? 0).toLocaleString()} total</span>}
          icon={AlertTriangle}
          accent="red"
        />
      </div>
      <div className="dashboard-grid">
        <Card className="chart-card">
          <div className="card-heading">
            <div>
              <div className="section-kicker">PLATFORM THROUGHPUT</div>
              <h2>Requests overview</h2>
            </div>
            <Badge tone="success"><span className="status-dot" /> Live</Badge>
          </div>
          <div className="admin-big-number">
            {(stats?.requests.quota.remaining ?? 0).toLocaleString()} <span>requests left today</span>
          </div>
          <div className="admin-big-number-sub">
            {(stats?.requests.quota.used ?? 0).toLocaleString()} of {(stats?.requests.quota.limit ?? 0).toLocaleString()} used today
          </div>
        </Card>
        <Card className="status-card">
          <div className="card-heading">
            <div>
              <div className="section-kicker">SYSTEM HEALTH</div>
              <h2>Everything in order</h2>
            </div>
            <Server size={19} className="teal-icon" />
          </div>
          <div className="health-list">
            <div>
              <span className="health-label"><i className="health-check" /> API gateway</span>
              <strong>Operational</strong>
            </div>
            <div>
              <span className="health-label"><i className="health-check" /> Extraction engine</span>
              <strong>Operational</strong>
            </div>
            <div>
              <span className="health-label"><i className="health-check" /> Database</span>
              <strong>Connected</strong>
            </div>
          </div>
        </Card>
      </div>
      <Card className="activity-card">
        <div className="card-heading">
          <div>
            <div className="section-kicker">QUICK ACCESS</div>
            <h2>Manage the platform</h2>
          </div>
        </div>
        <div className="attention-grid">
          <div className="attention-item">
            <div className="attention-icon"><Users size={17} /></div>
            <div><strong>{stats?.users.total ?? 0} organizations</strong><span>View and manage accounts.</span></div>
            <Link href="/admin/users" aria-label="View organizations" data-testid="link-inspect-users"><ArrowRight size={15} /></Link>
          </div>
          <div className="attention-item">
            <div className="attention-icon"><KeyRound size={17} /></div>
            <div><strong>{stats?.apiKeys.total ?? 0} API keys</strong><span>Inspect credential health.</span></div>
            <Link href="/admin/api-keys" aria-label="View API keys" data-testid="link-inspect-keys"><ArrowRight size={15} /></Link>
          </div>
          <div className="attention-item attention-warning">
            <div className="attention-icon"><AlertTriangle size={17} /></div>
            <div><strong>{stats?.requests.failed ?? 0} failed requests</strong><span>Review the audit trail.</span></div>
            <Link href="/admin/logs" aria-label="Inspect failed requests" data-testid="link-inspect-failed"><ArrowRight size={15} /></Link>
          </div>
        </div>
      </Card>
    </Shell>
  );
}
