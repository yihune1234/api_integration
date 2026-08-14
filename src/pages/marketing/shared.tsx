import type { ReactNode } from "react";

export function Kicker({ children }: { children: ReactNode }) {
  return <div className="mark-kicker">{children}</div>;
}

export function SectionHead({
  kicker,
  title,
  sub,
}: {
  kicker: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mark-head">
      <Kicker>{kicker}</Kicker>
      <h2 className="mark-title">{title}</h2>
      {sub && <p className="mark-sub">{sub}</p>}
    </div>
  );
}

export const markLinks = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];
