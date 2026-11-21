import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

export default function FilterSidebar({
  resourceType,
  setResourceType,
  dateFilter,
  setDateFilter,
  compactView,
  setCompactView,
  onReset
}) {
  const categories = [
    { id: '', label: 'All records' },
    { id: 'DocumentReference', label: 'Clinical Notes' },
    { id: 'DiagnosticReport', label: 'Diagnostic Reports' },
    { id: 'ClinicalSummary', label: 'AI Summaries' },
  ];

  const dateOptions = [
    { id: 'recent', label: 'Recent records' },
    { id: '24h', label: 'Last 24 hours' },
    { id: '7d', label: 'Last 7 days' },
    { id: 'all', label: 'All time' },
  ];

  return (
    <aside className="w-56 shrink-0 space-y-6 select-none">
      {/* Title */}
      <div className="flex items-center justify-between pb-1">
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">Filters</h2>
        {(resourceType || dateFilter !== 'recent') && (
          <button
            onClick={onReset}
            className="text-[11px] text-slate-400 hover:text-slate-700 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Record Category Checkboxes */}
      <div className="space-y-3">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
          Record status
        </span>
        <div className="space-y-2">
          {categories.map((cat) => {
            const isChecked = resourceType === cat.id;
            return (
              <label
                key={cat.id}
                className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer hover:text-slate-900 group"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => setResourceType(cat.id)}
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-slate-900"
                />
                <span className={`${isChecked ? 'font-semibold text-slate-900' : 'font-normal'}`}>
                  {cat.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Date Filter List */}
      <div className="space-y-3 pt-2 border-t border-slate-200/70">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
          Filter by
        </span>
        <div className="space-y-1.5">
          {dateOptions.map((opt) => {
            const isSelected = dateFilter === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setDateFilter(opt.id)}
                className={`block text-xs text-left w-full py-1 transition-colors ${
                  isSelected
                    ? 'font-bold text-slate-900 flex items-center space-x-1.5'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Compact View Toggle */}
      <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between">
        <span className="text-xs text-slate-600 font-medium">Card view</span>
        <button
          onClick={() => setCompactView(!compactView)}
          className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
            compactView ? 'bg-indigo-600' : 'bg-slate-200'
          }`}
          title="Toggle compact card layout"
        >
          <span
            className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform ${
              compactView ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </aside>
  );
}

