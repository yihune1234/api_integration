import { Clock3, HeartHandshake, Users } from "lucide-react";
import { AboutSection } from "./sections/about";
import { StatsBand } from "./sections/stats-band";
import { SectionHead } from "./shared";
import { CtaBand } from "./sections/cta-band";
import { MarketingLayout } from "./layout";

export function MarketingAbout() {
  return (
    <MarketingLayout>
      <section className="mark-page mark-page-head">
        <div className="mark-page-grid" />
        <div className="mark-page-inner">
          <div className="mark-hero-badge">
            <Users size={13} />
            <span>ABOUT</span>
          </div>
          <h1>We make ordinary documents useful.</h1>
          <p className="mark-hero-sub">
            A small team obsessed with the reliability operators actually depend
            on.
          </p>
        </div>
      </section>
      <AboutSection />
      <StatsBand />
      <section className="mark-section">
        <div className="mark-story-grid">
          <div className="mark-story-copy">
            <SectionHead
              kicker="THE STORY"
              title="Born from a spreadsheet problem."
              sub="Every operator we met was hand-parsing the same invoices, ledgers, and manifests. The formats were ordinary — the cost in people-hours was not. EthioBridge started as one endpoint to remove that work, and stayed focused enough to do it well."
            />
            <div className="mark-story-points">
              <div>
                <span className="mark-story-n">2019</span>
                <p>
                  Founded in Addis Ababa to build tooling for local operators.
                </p>
              </div>
              <div>
                <span className="mark-story-n">2021</span>
                <p>First extraction endpoint went live with three formats.</p>
              </div>
              <div>
                <span className="mark-story-n">2026</span>
                <p>
                  Serving 340+ organizations across five sectors and two
                  continents.
                </p>
              </div>
            </div>
          </div>
          <div className="mark-story-card">
            <div className="mark-feature-icon">
              <HeartHandshake size={19} />
            </div>
            <h3>Our mission</h3>
            <p>
              Remove the work of document handling from every operator building
              on the continent, so their focus stays on the work that matters.
            </p>
            <div className="mark-story-meta">
              <Clock3 size={14} />
              <span>Always on. Always dependable.</span>
            </div>
          </div>
        </div>
      </section>
      <CtaBand />
    </MarketingLayout>
  );
}
