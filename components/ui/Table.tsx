import { ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  getKey?: (row: T) => string;
  onRowClick?: (row: T) => void;
}

export default function Table<T extends Record<string, unknown>>({
  columns, data, emptyMessage = 'No data found.', getKey, onRowClick
}: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[#1e2130]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2130] bg-[#0f1117]">
            {columns.map(col => (
              <th
                key={col.key}
                className="text-left text-[#6b7280] font-medium text-xs uppercase tracking-wider px-4 py-3"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center text-[#4b5563] py-12">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={getKey ? getKey(row) : i}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-[#1e2130] last:border-0 hover:bg-[#1a1f30] transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-[#d1d5db]">
                    {col.render ? col.render(row, i) : (row[col.key] as ReactNode)}
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
