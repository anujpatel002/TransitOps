const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'text-green-400 bg-green-400/10',
  COMPLETED: 'text-green-400 bg-green-400/10',
  ON_TRIP: 'text-blue-400 bg-blue-400/10',
  DISPATCHED: 'text-blue-400 bg-blue-400/10',
  IN_SHOP: 'text-amber-400 bg-amber-400/10',
  SUSPENDED: 'text-amber-400 bg-amber-400/10',
  RETIRED: 'text-rose-400 bg-rose-400/10',
  CANCELLED: 'text-rose-400 bg-rose-400/10',
  OFF_DUTY: 'text-text-muted bg-white/5',
  DRAFT: 'text-text-muted bg-white/5',
};

export default function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? 'text-text-muted bg-white/5';
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
