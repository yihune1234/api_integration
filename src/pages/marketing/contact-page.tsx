import { useState, type FormEvent } from "react";
import {
  Check,
  ChevronDown,
  Mail,
  MapPin,
  MessageSquare,
  Send,
  ShieldCheck,
} from "lucide-react";
import { Kicker } from "./shared";
import { CtaBand } from "./sections/cta-band";
import { MarketingLayout } from "./layout";

export function MarketingContact() {
  const [sent, setSent] = useState(false);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSent(true);
  };
  const channels = [
    {
      icon: Mail,
      title: "Email us",
      value: "hello@ethiobridge.example",
      note: "Replies within one business day.",
    },
    {
      icon: MessageSquare,
      title: "Support",
      value: "support.ethiobridge.example",
      note: "For operational issues, every day.",
    },
    {
      icon: MapPin,
      title: "Visit us",
      value: "Addis Ababa, Ethiopia",
      note: "Bole district, by appointment.",
    },
  ];
  return (
    <MarketingLayout>
      <section className="mark-page mark-page-head">
        <div className="mark-page-grid" />
        <div className="mark-page-inner">
          <div className="mark-hero-badge">
            <Mail size={13} />
            <span>CONTACT</span>
          </div>
          <h1>Talk to the team behind the API.</h1>
          <p className="mark-hero-sub">
            Questions, onboarding, or a stubborn integration — we answer
            quickly.
          </p>
        </div>
      </section>
      <section className="mark-section">
        <div className="mark-contact-grid">
          <div className="mark-contact-info">
            <Kicker>Ways to reach us</Kicker>
            <p className="mark-sub">
              Pick the channel that fits. Technical questions get fastest
              answers through the contact form.
            </p>
            <div className="mark-channels">
              {channels.map((channel) => (
                <div className="mark-channel" key={channel.title}>
                  <div className="mark-channel-icon">
                    <channel.icon size={17} />
                  </div>
                  <div>
                    <strong>{channel.title}</strong>
                    <span>{channel.value}</span>
                    <small>{channel.note}</small>
                  </div>
                </div>
              ))}
            </div>
            <div className="mark-hero-badge">
              <ShieldCheck size={13} />
              <span>Average response · 4 hours</span>
            </div>
          </div>
          <div className="mark-contact-form">
            {sent ? (
              <div className="mark-sent">
                <div className="mark-sent-icon">
                  <Check size={22} />
                </div>
                <h2>Message received.</h2>
                <p>
                  Thanks for reaching out — the team will get back to you soon.
                </p>
                <button
                  className="eb-button eb-button-secondary eb-button-md"
                  onClick={() => setSent(false)}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="mark-form">
                <div className="mark-form-grid">
                  <div>
                    <label className="field-label" htmlFor="m-contact-name">
                      Name
                    </label>
                    <input
                      id="m-contact-name"
                      className="eb-input"
                      required
                      placeholder="Your name"
                      data-testid="mark-input-name"
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="m-contact-email">
                      Work email
                    </label>
                    <input
                      id="m-contact-email"
                      type="email"
                      className="eb-input"
                      required
                      placeholder="you@company.et"
                      data-testid="mark-input-email"
                    />
                  </div>
                </div>
                <div>
                  <label className="field-label" htmlFor="m-contact-company">
                    Organization
                  </label>
                  <input
                    id="m-contact-company"
                    className="eb-input"
                    placeholder="Company (optional)"
                    data-testid="mark-input-company"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="m-contact-subject">
                    What can we help with?
                  </label>
                  <div className="select-wrap">
                    <select
                      id="m-contact-subject"
                      className="eb-input"
                      data-testid="mark-select-subject"
                    >
                      <option>Integration help</option>
                      <option>Billing & plans</option>
                      <option>Enterprise / volume pricing</option>
                      <option>Something else</option>
                    </select>
                    <ChevronDown size={15} />
                  </div>
                </div>
                <div>
                  <label className="field-label" htmlFor="m-contact-message">
                    Message
                  </label>
                  <textarea
                    id="m-contact-message"
                    className="eb-input eb-textarea"
                    rows={4}
                    required
                    placeholder="Tell us about your workload…"
                    data-testid="mark-input-message"
                  />
                </div>
                <button
                  className="eb-button eb-button-primary eb-button-md"
                  type="submit"
                  data-testid="mark-button-submit"
                >
                  <Send size={14} /> Send message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
      <CtaBand />
    </MarketingLayout>
  );
}
