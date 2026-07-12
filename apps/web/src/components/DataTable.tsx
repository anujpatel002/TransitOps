interface Column<T> { key: keyof T; header: string; render?: (val: T[keyof T], row: T) => React.ReactNode; }

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
}

export default function DataTable<T extends { id: string }>({ columns, data }: DataTableProps<T>) {
  return (
    <div className="bg-panel border border-border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((c) => (
              <th key={String(c.key)} className="text-left px-4 py-3 text-text-muted font-medium">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-text-muted">
                No data
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                {columns.map((c) => (
                  <td key={String(c.key)} className="px-4 py-3 text-text-primary">
                    {c.render ? c.render(row[c.key], row) : String(row[c.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
