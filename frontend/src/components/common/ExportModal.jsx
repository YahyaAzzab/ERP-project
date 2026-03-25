import React, { useMemo, useState } from 'react';
import Modal from './Modal';

const ExportModal = ({
  isOpen,
  onClose,
  title = 'Exporter en PDF',
  options = [],
  columns = [],
  rowsCount = 0,
  onExport,
}) => {
  const [selectedOptions, setSelectedOptions] = useState(() => options.filter((o) => o.defaultChecked).map((o) => o.key));
  const [selectedColumns, setSelectedColumns] = useState(() => columns.filter((c) => c.defaultChecked !== false).map((c) => c.key));
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const canExport = useMemo(() => rowsCount > 0, [rowsCount]);

  const toggleOption = (key) => {
    setSelectedOptions((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const toggleColumn = (key) => {
    setSelectedColumns((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const handleExport = () => {
    onExport?.({
      selectedOptions,
      selectedColumns,
      dateDebut,
      dateFin,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="space-y-4 text-sm">
        {options.length > 0 && (
          <div className="space-y-2">
            <p className="font-semibold text-gray-800">Options</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {options.map((opt) => (
                <label key={opt.key} className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedOptions.includes(opt.key)} onChange={() => toggleOption(opt.key)} />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {columns.length > 0 && (
          <div className="space-y-2">
            <p className="font-semibold text-gray-800">Colonnes a inclure</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {columns.map((col) => (
                <label key={col.key} className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedColumns.includes(col.key)} onChange={() => toggleColumn(col.key)} />
                  <span>{col.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-gray-600">Date debut</label>
            <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
          </div>
          <div>
            <label className="text-gray-600">Date fin</label>
            <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300" />
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-700">
          Lignes a exporter: <strong>{rowsCount}</strong>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200">Annuler</button>
          <button type="button" disabled={!canExport} onClick={handleExport} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60">Telecharger PDF</button>
        </div>
      </div>
    </Modal>
  );
};

export default ExportModal;
