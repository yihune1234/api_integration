import { Link } from "wouter";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

export function HeroVisual() {
  return (
    <div className="mark-visual" data-testid="mark-hero-visual">
      <div className="mark-visual-window">
        <div className="mark-visual-bar">
          <span>
            <i />
            <i />
            <i />
          </span>
          <code>POST /v1/extract</code>
          <span className="mark-visual-live">
            <span />
            LIVE
          </span>
        </div>
        <div className="mark-visual-body">
          <pre className="mark-visual-code">
            <span className="mk-n">const</span> result{" "}
            <span className="mk-o">=</span> <span className="mk-k">await</span>{" "}
            ethiobridge.extract({"{"}
            file: <span className="mk-s">'invoices.csv'</span>, plan:{" "}
            <span className="mk-s">'business'</span>,{"}"});
          </pre>
          <div className="mark-visual-divider" />
          <div className="mark-visual-response">
            {"{"}
            <div className="mk-row">
              <span>status</span>
              <span className="mk-val">"success"</span>
            </div>
            <div className="mk-row">
              <span>records</span>
              <span className="mk-val">120 extracted</span>
            </div>
            <div className="mk-row">
              <span>latency</span>
              <span className="mk-val">182 ms</span>
            </div>
            {"}"}
            <div className="mk-status">
              <span /> 200 OK · all systems operational
            </div>
          </div>
        </div>
      </div>
      <div className="mark-chip mark-chip-a">
        <BarChart3 size={15} />
        <span>
          <strong>1.4M</strong> requests this month
        </span>
      </div>
      <div className="mark-chip mark-chip-b">
        <ShieldCheck size={15} />
        <span>
          <strong>99.99%</strong> uptime SLA
        </span>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="mark-hero">
      <div className="mark-hero-grid" />
      <div className="mark-orbit mark-orbit-one" />
      <div className="mark-orbit mark-orbit-two" />
      <div className="mark-hero-inner">
        <div className="mark-hero-badge">
          <Sparkles size={13} />
          <span>Africa's extraction layer</span>
          <em>NEW</em>
        </div>
        <h1>
          Documents carry the work.
          <br />
          <span>We make them usable.</span>
        </h1>
        <p className="mark-hero-sub">
          EthioBridge turns JSON, XML, CSV, XLS, and XLSX into structured
          records through one dependable endpoint — built for Africa's
          operators.
        </p>
        <div className="mark-hero-actions">
          <Link
            href="/login"
            className="eb-button eb-button-primary eb-button-lg"
            data-testid="mark-cta-primary"
          >
            <Zap size={16} /> Start in three steps
          </Link>
          <Link
            href="/features"
            className="mark-hero-secondary"
            data-testid="mark-cta-secondary"
          >
            <BookOpen size={16} /> Explore features <ArrowRight size={15} />
          </Link>
        </div>
        <div className="mark-trust">
          <span>
            <strong>340+</strong> organizations
          </span>
          <i />
          <span>
            <strong>1.4M</strong> requests / month
          </span>
          <i />
          <span>
            <strong>5</strong> formats supported
          </span>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}
