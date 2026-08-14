import { FileText } from "lucide-react";
import { PricingGrid } from "./sections/pricing";
import { SectionHead } from "./shared";
import { CtaBand } from "./sections/cta-band";
import { MarketingLayout } from "./layout";

export function MarketingPricing() {
  return (
    <MarketingLayout>
      <section className="mark-page mark-page-head">
        <div className="mark-page-grid" />
        <div className="mark-page-inner">
          <div className="mark-hero-badge">
            <FileText size={13} />
            <span>PRICING</span>
          </div>
          <h1>Transparent pricing, generous limits.</h1>
          <p className="mark-hero-sub">
            Every plan includes every format. Upgrade only when your volume
            outgrows you.
          </p>
        </div>
      </section>
      <PricingGrid />
      <section className="mark-section">
        <SectionHead
          kicker="COMMON QUESTIONS"
          title="Before you ask."
          sub="The things most teams want to know before they plug in."
        />
        <div className="mark-faq">
          {[
            [
              "Can I change plans later?",
              "Yes. Keys keep working and limits update instantly from the workspace. No migration needed.",
            ],
            [
              "Is the raw key ever stored?",
              "No. EthioBridge shows the raw key once at creation and never stores or re-displays it.",
            ],
            [
              "Do you support spreadsheets?",
              "Yes — CSV, XLS, and XLSX are first-class formats alongside JSON and XML.",
            ],
            [
              "What happens at the daily limit?",
              "Further requests return RATE_LIMIT_EXCEEDED until the window resets. No surprise bill.",
            ],
          ].map(([q, a]) => (
            <details className="mark-faq-item" key={q}>
              <summary>
                {q}
                <span>+</span>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
      <CtaBand />
    </MarketingLayout>
  );
}
