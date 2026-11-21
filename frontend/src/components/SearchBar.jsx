import React from 'react';
import { Search, Sparkles, X } from 'lucide-react';

const SUGGESTIONS = [
  { label: 'Chest Pain & ST Elevation', query: 'crushing substernal chest pressure ST elevation' },
  { label: 'Appendicitis on CT', query: 'dilated appendix appendicolith acute appendicitis' },
  { label: 'Critically Elevated Troponin', query: 'high sensitivity cardiac troponin I elevated' },
  { label: 'Severe Asthma Hyperinflation', query: 'status asthmaticus pulmonary hyperinflation' },
  { label: 'Heart Failure NT-proBNP', query: 'decompensated congestive heart failure NT-proBNP' },
];

export default function SearchBar({
  query,
  setQuery,
  resourceType,
  setResourceType,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  onSearch,
  onReset,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  const resourcePills = [
    { value: '', label: 'All Records' },
    { value: 'DocumentReference', label: 'Clinical Notes' },
    { value: 'DiagnosticReport', label: 'Labs & Radiology' },
    { value: 'ClinicalSummary', label: 'AI Summaries' },
  ];

  return (
    <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 mb-6">
      <form onSubmit={handleSubmit} class="space-y-4">
        <div class="relative flex items-center">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-teal-600">
            <Search class="w-5 h-5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symptoms, diagnoses, lab markers, or MRN (e.g., 'elevated troponin', 'appendicitis', 'asthma')..."
            class="w-full pl-11 pr-28 py-3.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white text-sm font-medium transition-all"
          />
          <div class="absolute inset-y-0 right-1.5 flex items-center space-x-1.5">
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                class="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
                title="Clear input"
              >
                <X class="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-xs font-bold tracking-wide shadow-sm hover:shadow transition-all"
            >
              Search
            </button>
          </div>
        </div>

        {/* Filter Pills & Controls */}
        <div class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div class="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg">
            {resourcePills.map((pill) => (
              <button
                key={pill.value}
                type="button"
                onClick={() => {
                  setResourceType(pill.value);
                  setTimeout(() => onSearch(query, pill.value), 10);
                }}
                class={`px-3 py-1.5 rounded-md font-semibold text-xs transition-all ${
                  resourceType === pill.value
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div class="flex items-center space-x-2">
            <span class="text-slate-400 font-medium">Dates:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              class="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 text-xs focus:ring-1 focus:ring-teal-500"
            />
            <span class="text-slate-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              class="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 text-xs focus:ring-1 focus:ring-teal-500"
            />
            {(resourceType || dateFrom || dateTo) && (
              <button
                type="button"
                onClick={onReset}
                class="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded hover:bg-rose-50"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Suggested Clinical Query Chips */}
      <div class="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100">
        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
          <Sparkles class="w-3 h-3 mr-1 text-teal-500" />
          Quick Discovery:
        </span>
        {SUGGESTIONS.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setQuery(item.query);
              onSearch(item.query);
            }}
            class="text-xs font-medium text-slate-600 hover:text-teal-700 bg-slate-100 hover:bg-teal-50 hover:border-teal-200 border border-slate-200/60 px-2.5 py-1 rounded-full transition-all"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
