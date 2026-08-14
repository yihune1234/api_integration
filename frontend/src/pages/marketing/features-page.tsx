import { Workflow } from "lucide-react";
import { FeatureGrid } from "./sections/features";
import { SectionHead } from "./shared";
import { CtaBand } from "./sections/cta-band";
import { MarketingLayout } from "./layout";

export function MarketingFeatures() {
  return (
    <MarketingLayout>
      <section className="mark-page mark-page-head">
        <div className="mark-page-grid" />
        <div className="mark-page-inner">
          <div className="mark-hero-badge">
            <Workflow size={13} />
            <span>PLATFORM</span>
          </div>
          <h1>A focused toolset for dependable extraction.</h1>
          <p className="mark-hero-sub">
            Everything EthioBridge does, and why each part earns its place.
          </p>
        </div>
      </section>
      <FeatureGrid />
      <section className="mark-section">
        <SectionHead
          kicker="UNDER THE HOOD"
          title="Detail matters when documents do."
          sub="Small decisions compound into an API your team can trust at volume."
        />
        <div className="mark-detail-grid">
          {[
            [
              "File validation",
              "Unsupported files are rejected with a clear error before any work runs.",
            ],
            [
              "Size limits",
              "Configurable per plan, with a hard 10 MB ceiling to keep latency predictable.",
            ],
            [
              "Audit trail",
              "Every key event — create, rotate, revoke, request — lands in the activity log.",
            ],
            [
              "Rate limiting",
              "Daily ceilings enforce predictable use across organizations without surprises.",
            ],
            [
              "Response envelope",
              "A stable status-first shape means your parsers never chase drifting fields.",
            ],
            [
              "Error codes",
              "INVALID_API_KEY, RATE_LIMIT_EXCEEDED, UNSUPPORTED_FORMAT — readable and stable.",
            ],
          ].map(([title, text]) => (
            <article className="mark-feature-card mark-detail-item" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <CtaBand />
    </MarketingLayout>
  );
}
