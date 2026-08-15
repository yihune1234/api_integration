import { useEffect, useState } from "react";
import { Check, RefreshCw, X } from "lucide-react";
import { Badge, Button, Card } from "@/components/app/basic";
import { PageHeader } from "@/components/app/headers";
import { Shell } from "@/components/app/shell";
import { approvePremiumRequest, listPremiumRequests, rejectPremiumRequest, type PremiumRequest } from "@/lib/api/premiumApi";
import { formatDate } from "@/lib/utils";

export function AdminPremiumRequestsPage() {
  const [requests, setRequests] = useState<PremiumRequest[]>([]);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(true);
  const load = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      setError("");
      setRequests((await listPremiumRequests()).requests);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load premium requests.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load(true);
    const interval = window.setInterval(() => void load(), 10_000);
    return () => window.clearInterval(interval);
  }, []);
  const review = async (request: PremiumRequest, approved: boolean) => {
    setError(""); setWorkingId(request.id);
    try {
      if (approved) await approvePremiumRequest(request.id);
      else {
        const reason = rejectionReason.trim();
        if (!reason) {
          setError("A rejection reason is required.");
          return;
        }
        await rejectPremiumRequest(request.id, reason);
        setRejectingId(null);
        setRejectionReason("");
      }
      await load();
    } catch (err: any) { setError(err?.message ?? "Could not update this request."); }
    finally { setWorkingId(null); }
  };
  return <Shell role="admin">
    <PageHeader eyebrow="BILLING OPERATIONS" title="Premium requests" description="Review verified upgrade requests. Approval updates every active key for the organization immediately." action={<Button variant="secondary" onClick={() => void load(true)} disabled={loading}><RefreshCw size={15} /> Refresh</Button>} />
    {error && <div className="field-error">{error}</div>}
    <Card className="table-card"><div className="table-card-header"><div><div className="section-kicker">UPGRADE QUEUE</div><h2>All requests <span className="count-pill">{requests.length}</span></h2></div></div><div className="table-scroll"><table className="eb-table eb-table-wide"><thead><tr><th>Organization</th><th>Plan</th><th>Payment</th><th>Status</th><th>Submitted</th><th className="text-right">Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan={6} className="muted">Loading requests…</td></tr> : requests.length === 0 ? <tr><td colSpan={6} className="muted">No premium requests found. New requests appear automatically.</td></tr> : requests.map((request) => <tr key={request.id}><td><strong>{request.user_organization || "Unknown organization"}</strong><br /><span className="muted">{request.user_email}</span></td><td className="plan-name">{request.requested_plan}</td><td>{request.payment_status}</td><td><Badge tone={request.approval_status === "approved" ? "success" : request.approval_status === "rejected" ? "danger" : "warning"}>{request.approval_status}</Badge></td><td>{formatDate(request.created_at)}</td><td><div className="row-actions">{request.approval_status === "pending" && (rejectingId === request.id ? <div className="premium-reject-form"><input className="eb-input" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Reason for rejection" aria-label="Reason for rejection" /><Button size="sm" variant="danger" onClick={() => void review(request, false)} disabled={workingId === request.id}><X size={14} /> Confirm</Button><Button size="sm" variant="secondary" onClick={() => { setRejectingId(null); setRejectionReason(""); }}>Cancel</Button></div> : <><Button size="sm" onClick={() => void review(request, true)} disabled={workingId === request.id}><Check size={14} /> Approve</Button><Button size="sm" variant="danger" onClick={() => { setRejectingId(request.id); setRejectionReason(""); }} disabled={workingId === request.id}><X size={14} /> Reject</Button></>)}{request.approval_status !== "pending" && <span className="muted">{request.rejection_reason || "Reviewed"}</span>}</div></td></tr>)}</tbody></table></div></Card>
  </Shell>;
}
