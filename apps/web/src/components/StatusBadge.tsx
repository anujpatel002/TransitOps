const STATUS_MAP: Record<string, { cls: string; dot: string; label: string }> = {
  AVAILABLE:  { cls: 'text-green-400 bg-green-400/10 border-green-400/20',  dot: 'bg-green-400',  label: 'Available'  },
  COMPLETED:  { cls: 'text-green-400 bg-green-400/10 border-green-400/20',  dot: 'bg-green-400',  label: 'Completed'  },
  ON_TRIP:    { cls: 'text-blue-400 bg-blue-400/10 border-blue-400/20',     dot: 'bg-blue-400',   label: 'On Trip'    },
  DISPATCHED: { cls: 'text-blue-400 bg-blue-400/10 border-blue-400/20',     dot: 'bg-blue-400',   label: 'Dispatched' },
  IN_SHOP:    { cls: 'text-amber-400 bg-amber-400/10 border-amber-400/20',  dot: 'bg-amber-400',  label: 'In Shop'    },
  SUSPENDED:  { cls: 'text-amber-400 bg-amber-400/10 border-amber-400/20',  dot: 'bg-amber-400',  label: 'Suspended'  },
  RETIRED:    { cls: 'text-rose-400 bg-rose-400/10 border-rose-400/20',     dot: 'bg-rose-400',   label: 'Retired'    },
  CANCELLED:  { cls: 'text-rose-400 bg-rose-400/10 border-rose-400/20',     dot: 'bg-rose-400',   label: 'Cancelled'  },
  OFF_DUTY:   { cls: 'text-text-muted bg-white/5 border-white/10',          dot: 'bg-text-muted', label: 'Off Duty'   },
  DRAFT:      { cls: 'text-text-muted bg-white/5 border-white/10',          dot: 'bg-text-muted', label: 'Draft'      },
};

export default function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { cls: 'text-text-muted bg-white/5 border-white/10', dot: 'bg-text-muted', label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium border ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} shrink-0`} />
      {s.label}
    </span>
  );
}
