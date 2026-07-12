interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string; // tailwind border color class
}

export default function KpiCard({ label, value, sub, accent = 'border-accent' }: KpiCardProps) {
  return (
    <div className={`bg-panel border border-border border-t-2 ${accent} rounded-lg p-4 flex flex-col gap-1 hover:border-opacity-80 transition-colors`}>
      <p className="text-text-muted text-xs font-medium uppercase tracking-wider leading-none">{label}</p>
      <p className="text-text-primary text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-text-muted text-xs">{sub}</p>}
    </div>
  );
}
