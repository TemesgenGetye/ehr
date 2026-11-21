import React from 'react';
import { Layers, FileText, Activity, Sparkles } from 'lucide-react';

export default function FilterSidebar({
  resourceType,
  setResourceType
}) {
  const categories = [
    { id: '', label: 'All Records', icon: Layers },
    { id: 'DocumentReference', label: 'Clinical Notes', icon: FileText },
    { id: 'DiagnosticReport', label: 'Diagnostic & Labs', icon: Activity },
    { id: 'ClinicalSummary', label: 'AI Summaries', icon: Sparkles },
  ];

  return (
    <aside className="w-56 shrink-0 space-y-4 select-none">
      <div className="flex items-center justify-between pb-1 border-b border-slate-200/80">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Filter Category
        </h2>
        {resourceType && (
          <button
            onClick={() => setResourceType('')}
            className="text-[11px] text-slate-400 hover:text-slate-800 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-1">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = resourceType === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setResourceType(isActive && cat.id !== '' ? '' : cat.id)}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs transition-all text-left ${
                isActive
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-normal'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
