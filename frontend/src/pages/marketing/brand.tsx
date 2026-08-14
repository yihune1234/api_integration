export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
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

export function cn(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}
