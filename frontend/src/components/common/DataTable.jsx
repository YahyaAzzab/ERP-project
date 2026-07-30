import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

const DataTable = ({ columns, data, loading, onEdit, onDelete }) => {
  const renderCellValue = (row, column) => {
    if (column.Cell) {
      return column.Cell({ value: row[column.accessor] });
    }

    return row[column.accessor];
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="mb-2 h-8 w-full rounded bg-gray-200"></div>
        <div className="mb-2 h-8 w-full rounded bg-gray-200"></div>
        <div className="h-8 w-full rounded bg-gray-200"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div className="py-8 text-center text-gray-500">Aucune donnee</div>;
  }

  return (
    <div className="space-y-3">
      <div className="hidden overflow-x-auto rounded-lg bg-white shadow md:block">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th key={col.accessor} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
                  {col.Header}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className={`${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-gray-50`}>
                {columns.map((col) => (
                  <td key={col.accessor} className="px-4 py-4 text-sm text-gray-700 sm:px-6">
                    {renderCellValue(row, col)}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-4 py-4 text-right text-sm font-medium sm:px-6">
                    {onEdit && (
                      <button onClick={() => onEdit(row)} className="mr-4 text-blue-600 hover:text-blue-900">
                        <Edit size={18} />
                      </button>
                    )}
                    {onDelete && (
                      <button onClick={() => onDelete(row)} className="text-red-600 hover:text-red-900">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {data.map((row, rowIndex) => (
          <div key={rowIndex} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                {columns.map((col) => (
                  <div key={col.accessor} className="rounded-md bg-gray-50 px-2 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{col.Header}</p>
                    <div className="mt-1 text-sm text-gray-700">{renderCellValue(row, col)}</div>
                  </div>
                ))}
              </div>
              {(onEdit || onDelete) && (
                <div className="flex shrink-0 items-center gap-2">
                  {onEdit && (
                    <button onClick={() => onEdit(row)} className="rounded-full p-2 text-blue-600 hover:bg-blue-50">
                      <Edit size={16} />
                    </button>
                  )}
                  {onDelete && (
                    <button onClick={() => onDelete(row)} className="rounded-full p-2 text-red-600 hover:bg-red-50">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataTable;