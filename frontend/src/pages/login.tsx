import { useState, type FormEvent } from "react";
import { AlertTriangle, ArrowRight, Settings2, Users, Zap } from "lucide-react";
import { Button, Logo } from "@/components/app/basic";
import { login as userLogin, adminLogin, ApiError, type Session } from "@/lib/api/authApi";

export function LoginPage({
  onLogin,
}: {
  onLogin: (session: Session) => void;
}) {
  const [role, setRole] = useState<"user" | "admin">("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!email.includes("@") || password.length < 8) {
      setError("Enter a valid email and password (min 8 characters) to continue.");
      return;
    }
    setSubmitting(true);
    try {
      if (role === "admin") {
        const result = await adminLogin({ email, password });
        onLogin({
          role: "admin",
          id: result.admin.id,
          adminEmail: result.admin.email,
          adminRole: result.admin.role,
        });
      } else {
        const result = await userLogin({ contactEmail: email, password });
        onLogin({
          role: "user",
          id: result.user.id,
          organizationName: result.user.organizationName,
          contactEmail: result.user.contactEmail,
          status: result.user.status,
        });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to sign in. Check that the backend is running.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-decoration">
        <div className="login-grid" />
        <div className="login-orbit orbit-one" />
        <div className="login-orbit orbit-two" />
        <div className="login-brand">
          <Logo />
          <div className="login-quote">
            Documents carry the work.
            <br />
            <em>We make them usable.</em>
          </div>
          <div className="login-footer-note">
            <span>ETHIOBRIDGE / 01</span>
            <span>BUILT FOR AFRICA&apos;S OPERATORS</span>
          </div>
        </div>
      </div>
      <div className="login-panel">
        <div className="login-panel-inner">
          <div className="login-mobile-brand">
            <Logo compact />
          </div>
          <div className="login-eyebrow">WELCOME BACK</div>
          <h1>
            Sign in to your
            <br />
            <span>workspace.</span>
          </h1>
          <p className="login-description">
            Your dependable home for document extraction infrastructure.
          </p>
          <div className="role-switcher" role="tablist" aria-label="Demo role">
            <button
              className={role === "user" ? "role-active" : ""}
              onClick={() => {
                setRole("user");
                setEmail("");
                setPassword("");
              }}
              role="tab"
              aria-selected={role === "user"}
              data-testid="button-demo-user-role"
            >
              <Users size={15} /> Organization
            </button>
            <button
              className={role === "admin" ? "role-active" : ""}
              onClick={() => {
                setRole("admin");
                setEmail("");
                setPassword("");
              }}
              role="tab"
              aria-selected={role === "admin"}
              data-testid="button-demo-admin-role"
            >
              <Settings2 size={15} /> Admin
            </button>
          </div>
          <form onSubmit={submit} className="login-form">
            <div>
              <label className="field-label" htmlFor="login-email">
                Work email
              </label>
              <input
                id="login-email"
                type="email"
                className="eb-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                data-testid="input-login-email"
              />
            </div>
            <div>
              <div className="password-label">
                <label className="field-label" htmlFor="login-password">
                  Password
                </label>
                <button
                  type="button"
                  className="text-button"
                  data-testid="button-forgot-password"
                  onClick={() => { window.location.href = "/forgot-password"; }}
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="login-password"
                type="password"
                className="eb-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                data-testid="input-login-password"
              />
            </div>
            {error && (
              <div className="field-error" data-testid="status-login-error">
                <AlertTriangle size={14} />
                {error}
              </div>
            )}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting}
              data-testid="button-sign-in"
            >
              {submitting
                ? "Signing in…"
                : (
                  <>
                    Sign in to {role === "admin" ? "operations" : "workspace"}{" "}
                    <ArrowRight size={16} />
                  </>
                )}
            </Button>
          </form>
          {role === "user" && (
            <p className="login-legal">
              New to EthioBridge? <a href="/register">Create your organization workspace</a>
            </p>
          )}
          <div className="demo-hint">
            <Zap size={15} />
            <span>
              Connected to the live backend. Use the Admin role with an admin account.
            </span>
          </div>
          <div className="login-legal">
            By continuing, you agree to EthioBridge&apos;s{" "}
            <a href="#terms" data-testid="link-terms">
              terms
            </a>{" "}
            and{" "}
            <a href="#privacy" data-testid="link-privacy">
              privacy policy
            </a>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
