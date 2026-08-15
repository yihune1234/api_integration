import { useEffect, useMemo, useState } from "react";
import { Filter, RotateCcw, Search, Users } from "lucide-react";
import { listAdminUsers, type AdminUser } from "@/lib/api/adminApi";
import { Button, Badge, Card } from "@/components/app/basic";
import { PageHeader, EmptyState } from "@/components/app/headers";
import { Shell } from "@/components/app/shell";
import { formatDate, initials } from "@/lib/utils";

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listAdminUsers();
        if (!cancelled) setUsers(data.users);
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? "Failed to load organizations.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(
    () =>
      users.filter(
        (user) =>
          (status === "all" || user.status === status) &&
          user.organization_name.toLowerCase().includes(query.toLowerCase()),
      ),
    [users, query, status],
  );

  return (
    <Shell role="admin">
      <PageHeader
        eyebrow="ORGANIZATION DIRECTORY"
        title="Organizations"
        description="Manage account access across the EthioBridge network."
        action={
          <Button variant="secondary" onClick={() => setQuery("")} data-testid="button-reset-user-filters">
            <RotateCcw size={15} /> Reset filters
          </Button>
        }
      />
      {error && <div className="field-error" data-testid="status-admin-users-error">{error}</div>}
      <Card className="table-card">
        <div className="table-card-header">
          <div>
            <div className="section-kicker">ALL ORGANIZATIONS</div>
            <h2>Accounts <span className="count-pill">{filtered.length}</span></h2>
          </div>
          <div className="toolbar">
            <div className="search-field">
              <Search size={15} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search organizations" aria-label="Search organizations" data-testid="input-search-organizations" />
            </div>
            <select className="compact-select" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter organization status" data-testid="select-organization-status">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
        {loading ? (
          <div className="empty-state"><h3>Loading…</h3></div>
        ) : filtered.length ? (
          <div className="table-scroll">
            <table className="eb-table eb-table-wide">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Workspace ID</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} data-testid={`row-admin-user-${user.id}`}>
                    <td>
                      <div className="org-cell">
                        <div className="avatar avatar-small">{initials(user.organization_name)}</div>
                        <strong>{user.organization_name}</strong>
                      </div>
                    </td>
                    <td className="mono muted">{user.id}</td>
                    <td><Badge tone={user.plan === "free" ? "neutral" : "success"}>{user.plan}</Badge></td>
                    <td><Badge tone={user.status === "active" ? "success" : "warning"}>{user.status}</Badge></td>
                    <td className="muted">{formatDate(user.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No organizations found"
            description="Try a different search or status filter."
            action={
              <Button variant="secondary" onClick={() => { setQuery(""); setStatus("all"); }} data-testid="button-clear-user-search">
                Clear filters
              </Button>
            }
          />
        )}
      </Card>
    </Shell>
  );
}
