import { useEffect, useState, type FormEvent } from "react";
import { Check, CheckCircle2, LockKeyhole } from "lucide-react";
import { getSession, type Session } from "@/lib/api/authApi";
import { getProfile } from "@/lib/api/usageApi";
import { changePassword } from "@/lib/api/authApi";
import { Button, Card } from "@/components/app/basic";
import { PageHeader } from "@/components/app/headers";
import { Shell } from "@/components/app/shell";
import { initials } from "@/lib/utils";

export function ProfilePage() {
  const session = getSession<Session>();
  const [org, setOrg] = useState(session?.organizationName || "");
  const [email, setEmail] = useState(session?.contactEmail || "");
  const [saved, setSaved] = useState(false);
  const [passwordState, setPasswordState] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getProfile();
        if (!cancelled) {
          setOrg(data.user.organizationName);
          setEmail(data.user.contactEmail);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? "Failed to load profile.");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const saveProfile = (event: FormEvent) => {
    event.preventDefault();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2400);
  };

  const changePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordState("");
    const form = new FormData(event.currentTarget);
    const current = String(form.get("currentPassword"));
    const next = String(form.get("newPassword"));
    const confirm = String(form.get("confirmPassword"));
    if (current.length < 8) {
      setPasswordState("error");
      setPasswordMessage("Enter your current password to continue.");
      return;
    }
    if (next.length < 8 || next !== confirm) {
      setPasswordState("error");
      setPasswordMessage("New passwords must match and be at least 8 characters.");
      return;
    }
    try {
      await changePassword({ currentPassword: current, newPassword: next });
      setPasswordState("success");
      setPasswordMessage("Password changed successfully.");
      event.currentTarget.reset();
    } catch (err: any) {
      setPasswordState("error");
      setPasswordMessage(err?.message ?? "Failed to change password.");
    }
  };

  return (
    <Shell role="user">
      <PageHeader
        eyebrow="WORKSPACE SETTINGS"
        title="Organization profile"
        description="Keep your workspace details current and your account secure."
      />
      {error && <div className="field-error" data-testid="status-profile-error">{error}</div>}
      <div className="profile-layout">
        <Card>
          <div className="profile-cover">
            <div className="profile-avatar-large">{initials(org || "AD")}</div>
            <div>
              <div className="section-kicker">ORGANIZATION</div>
              <h2>{org}</h2>
              <span className="profile-id">Workspace ID Â· {session?.id}</span>
            </div>
          </div>
          <form onSubmit={saveProfile} className="profile-form">
            <div className="form-grid">
              <div>
                <label className="field-label" htmlFor="organization-name">Organization name</label>
                <input id="organization-name" className="eb-input" value={org} onChange={(event) => setOrg(event.target.value)} data-testid="input-organization-name" />
              </div>
              <div>
                <label className="field-label" htmlFor="contact-email">Contact email</label>
                <input id="contact-email" type="email" className="eb-input" value={email} onChange={(event) => setEmail(event.target.value)} data-testid="input-contact-email" />
              </div>
            </div>
            <div className="form-actions">
              <Button type="submit" data-testid="button-save-profile"><Check size={16} /> Save changes</Button>
              {saved && <span className="save-feedback"><CheckCircle2 size={15} /> Profile saved</span>}
            </div>
          </form>
        </Card>
        <Card>
          <div className="section-kicker">ACCOUNT SECURITY</div>
          <h2>Change password</h2>
          <p className="card-description">Use a unique password that is at least 8 characters long.</p>
          <form onSubmit={changePasswordSubmit} className="password-form">
            <div>
              <label className="field-label" htmlFor="current-password">Current password</label>
              <input id="current-password" name="currentPassword" type="password" className="eb-input" placeholder="Enter current password" data-testid="input-current-password" />
            </div>
            <div>
              <label className="field-label" htmlFor="new-password">New password</label>
              <input id="new-password" name="newPassword" type="password" className="eb-input" placeholder="At least 8 characters" data-testid="input-new-password" />
            </div>
            <div>
              <label className="field-label" htmlFor="confirm-password">Confirm new password</label>
              <input id="confirm-password" name="confirmPassword" type="password" className="eb-input" placeholder="Repeat new password" data-testid="input-confirm-password" />
            </div>
            {passwordMessage && (
              <div className={passwordState === "success" ? "form-success" : "field-error"}>
                <CheckCircle2 size={15} />
                {passwordMessage}
              </div>
            )}
            <Button variant="secondary" type="submit" data-testid="button-change-password">
              <LockKeyhole size={16} /> Update password
            </Button>
          </form>
        </Card>
      </div>
    </Shell>
  );
}


