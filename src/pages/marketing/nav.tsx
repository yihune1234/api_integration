import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Menu, X } from "lucide-react";
import { BrandLogo, cn } from "./brand";
import { markLinks } from "./shared";

export function MarketingNav() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <>
      <header
        className={cn("mark-nav", scrolled && "mark-nav-scrolled")}
        data-testid="mark-header"
      >
        <div className="mark-nav-inner">
          <Link
            href="/"
            className="mark-nav-brand"
            data-testid="mark-link-brand"
          >
            <BrandLogo />
          </Link>
          <nav className="mark-nav-links" aria-label="Marketing">
            {markLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "mark-nav-link",
                  isActive(link.href) && "mark-nav-link-active",
                )}
                data-testid={`mark-link-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mark-nav-actions">
            <Link
              href="/login"
              className="mark-nav-signin"
              data-testid="mark-link-signin"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="eb-button eb-button-primary eb-button-md"
              data-testid="mark-link-get-started"
            >
              Get started <ArrowRight size={15} />
            </Link>
            <button
              className="mark-burger"
              onClick={() => setOpen(!open)}
              aria-label="Open menu"
              aria-expanded={open}
              data-testid="mark-button-menu"
            >
              {open ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
      </header>
      {open && (
        <div className="mark-drawer">
          {markLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="mark-drawer-link"
              data-testid={`mark-drawer-${link.label.toLowerCase()}`}
            >
              {link.label}
            </Link>
          ))}
          <div className="mark-drawer-divider" />
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="eb-button eb-button-secondary eb-button-md"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="eb-button eb-button-primary eb-button-md"
          >
            Get started <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </>
  );
}
