import { useEffect, useState } from "react";
import { Activity, Filter, RotateCcw, Search } from "lucide-react";
import { listAdminLogs, type AdminLog } from "@/lib/api/adminApi";
import { Button, Card } from "@/components/app/basic";
import { PageHeader } from "@/components/app/headers";
import { Shell } from "@/components/app/shell";

export function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setError("");
    try {
      const params: { action?: string } = {};
      if (action !== "all") params.action = action;
      const data = await listAdminLogs(params);
      setLogs(data.logs);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [action]);

  const filtered = logs.filter((log) =>
    `${log.user_id ?? ""} ${log.action} ${log.endpoint ?? ""} ${log.ip_address ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <Shell role="admin">
      <PageHeader
        eyebrow="AUDIT TRAIL"
        title="Activity logs"
        description="Trace every meaningful action across authentication, keys, profiles, and extraction."
        action={
          <Button variant="secondary" onClick={() => { setQuery(""); setAction("all"); }} data-testid="button-reset-log-filters">
            <RotateCcw size={15} /> Reset filters
          </Button>
        }
      />
      {error && <div className="field-error" data-testid="status-admin-logs-error">{error}</div>}
      <Card className="table-card">
        <div className="table-card-header">
          <div>
            <div className="section-kicker">LIVE EVENT STREAM</div>
            <h2>Audit events <span className="count-pill">{filtered.length}</span></h2>
          </div>
          <div className="toolbar">
            <div className="search-field">
              <Search size={15} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search logs" aria-label="Search activity logs" data-testid="input-search-logs" />
            </div>
            <select className="compact-select" value={action} onChange={(event) => setAction(event.target.value)} aria-label="Filter log action" data-testid="select-log-action">
              <option value="all">All actions</option>
              <option value="extract">Extraction</option>
              <option value="key">API keys</option>
              <option value="auth">Authentication</option>
              <option value="profile">Profile</option>
            </select>
          </div>
        </div>
        <div className="table-scroll">
          <table className="eb-table eb-table-wide">
            <thead>
              <tr>
                <th>Action</th>
                <th>User ID</th>
                <th>Endpoint</th>
                <th>IP address</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="muted">Loading…</td></tr>
              ) : filtered.map((log) => (
                <tr key={log.id} data-testid={`row-admin-log-${log.id}`}>
                  <td>
                    <div className="action-cell">
                      <span className={`action-icon action-${(log.action.split(".")[1] ?? "other")}`}>
                        <Activity size={14} />
                      </span>
                      <code>{log.action}</code>
                    </div>
                  </td>
                  <td className="mono muted">{log.user_id ?? "—"}</td>
                  <td className="mono">{log.endpoint ?? "—"}</td>
                  <td className="mono muted">{log.ip_address ?? "—"}</td>
                  <td className="muted">
                    {new Date(log.timestamp).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Shell>
  );
}
