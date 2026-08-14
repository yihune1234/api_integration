import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "soft";
  size?: "sm" | "md" | "lg";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "eb-button",
        `eb-button-${variant}`,
        `eb-button-${size}`,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "success" | "warning" | "danger" | "neutral" | "info";
}) {
  return <span className={`eb-badge eb-badge-${tone}`}>{children}</span>;
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn("eb-card", className)}>{children}</section>;
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3" data-testid="brand-logo">
      <div className="brand-mark">
        <span>EB</span>
      </div>
      {!compact && (
        <div>
          <div className="brand-name">EthioBridge</div>
          <div className="brand-subtitle">API PLATFORM</div>
        </div>
      )}
    </div>
  );
}
