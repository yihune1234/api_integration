import { ArrowUpRight, LifeBuoy } from "lucide-react";

export function DocsNav() {
  return (
    <aside className="docs-nav">
      <div className="section-kicker">ON THIS PAGE</div>
      <a href="#overview" data-testid="link-docs-overview">
        Overview
      </a>
      <a href="#generate-key" data-testid="link-docs-generate-key">
        Generate a key
      </a>
      <a href="#authentication" data-testid="link-docs-authentication">
        Authentication
      </a>
      <a href="#connect" data-testid="link-docs-connect">
        Connect your system
      </a>
      <a href="#quickstart" data-testid="link-docs-quickstart">
        Quickstart request
      </a>
      <a href="#response" data-testid="link-docs-response">
        Response shape
      </a>
      <a href="#errors" data-testid="link-docs-errors">
        Errors & checks
      </a>
      <div className="docs-help">
        <LifeBuoy size={16} />
        <strong>Need implementation help?</strong>
        <span>Talk to the EthioBridge team.</span>
        <button data-testid="button-contact-support">
          Contact support <ArrowUpRight size={13} />
        </button>
      </div>
    </aside>
  );
}
