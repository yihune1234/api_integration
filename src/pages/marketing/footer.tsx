import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { Check, Send, ShieldCheck } from "lucide-react";
import { BrandLogo } from "./brand";

export function MarketingFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const subscribe = (event: FormEvent) => {
    event.preventDefault();
    if (email.includes("@")) setSubscribed(true);
  };
  const columns = [
    {
      title: "Product",
      links: [
        ["/features", "Features"],
        ["/pricing", "Pricing"],
        ["/login", "Sign in"],
        ["/login", "Get started"],
      ],
    },
    {
      title: "Company",
      links: [
        ["/about", "About us"],
        ["/contact", "Contact"],
        ["/login", "Careers"],
        ["/about", "Values"],
      ],
    },
    {
      title: "Resources",
      links: [
        ["/features", "Documentation"],
        ["/contact", "Support"],
        ["/login", "API status"],
        ["/pricing", "Plans"],
      ],
    },
  ];
  return (
    <footer className="mark-footer">
      <div className="mark-footer-inner">
        <div className="mark-footer-grid">
          <div className="mark-footer-brand">
            <Link href="/">
              <BrandLogo />
            </Link>
            <p>
              The dependable extraction layer for Africa's operators. Turn
              ordinary documents into structured data.
            </p>
            <div className="mark-hero-badge">
              <ShieldCheck size={13} />
              <span>All systems operational</span>
            </div>
          </div>
          {columns.map((column) => (
            <div className="mark-footer-col" key={column.title}>
              <h4>{column.title}</h4>
              {column.links.map(([href, label]) => (
                <Link
                  key={label}
                  href={href}
                  className="mark-footer-link"
                  data-testid={`mark-foot-${column.title.toLowerCase()}-${label.replaceAll(" ", "-").toLowerCase()}`}
                >
                  {label}
                </Link>
              ))}
            </div>
          ))}
          <div className="mark-footer-col mark-footer-news">
            <h4>Stay in the loop</h4>
            <p>Product updates and platform notes. No noise.</p>
            {subscribed ? (
              <div className="mark-news-ok">
                <Check size={14} /> You are subscribed.
              </div>
            ) : (
              <form onSubmit={subscribe} className="mark-news-form">
                <input
                  className="mark-news-input"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="work@company.et"
                  aria-label="Work email"
                  data-testid="mark-input-newsletter"
                />
                <button
                  className="eb-button eb-button-primary"
                  aria-label="Subscribe"
                  data-testid="mark-button-newsletter"
                >
                  <Send size={14} />
                </button>
              </form>
            )}
          </div>
        </div>
        <div className="mark-footer-bottom">
          <span>© 2026 EthioBridge. Built for Africa's operators.</span>
          <div className="mark-footer-meta">
            <span>PRIVACY</span>
            <span>TERMS</span>
            <span>STATUS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
