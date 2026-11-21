import React from 'react';
import { Search } from 'lucide-react';

const QUICK_QUERIES = [
  { label: 'Chest Pain & ST changes', query: 'chest pain non-specific ST' },
  { label: 'Appendicitis Findings', query: 'acute uncomplicated appendicitis' },
  { label: 'Elevated Troponin Alert', query: 'cardiac troponin elevated' },
  { label: 'Severe Asthma', query: 'severe persistent asthma hyperinflation' },
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

  return (
    <section class="mb-6">
      <div class="max-w-3xl">
        <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl tracking-tight">Clinician Media Search</h1>
        <p class="text-sm text-slate-600 mt-1">
          Instant semantic discovery across unstructured clinical notes, scanned PDFs, imaging reports, and AI summaries.
        </p>
      </div>

      <div class="mt-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm" role="search" aria-label="Clinical record search">
        <form onSubmit={handleSubmit} class="space-y-3">
          <div class="relative flex items-center">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search class="h-5 w-5" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              class="block w-full pl-10 pr-24 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-base transition-colors"
              placeholder="Search e.g., 'acute appendicitis', 'elevated troponin', 'chest pain non-specific ST', 'asthma exacerbation'..."
              aria-label="Clinical query"
            />
            <div class="absolute inset-y-0 right-0 pr-2 flex items-center">
              <button
                type="submit"
                class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors focus:ring-2 focus:ring-teal-500"
              >
                Search
              </button>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3 pt-2 text-xs border-t border-slate-100">
            <div class="flex items-center space-x-1.5">
              <label for="filter-type" class="font-semibold text-slate-600">Resource:</label>
              <select
                id="filter-type"
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                class="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-700 focus:ring-1 focus:ring-teal-500"
              >
                <option value="">All Resources</option>
                <option value="DocumentReference">Clinical Notes (DocumentReference)</option>
                <option value="DiagnosticReport">Labs & Radiology (DiagnosticReport)</option>
                <option value="ClinicalSummary">AI Summaries</option>
              </select>
            </div>

            <div class="flex items-center space-x-1.5">
              <label for="filter-date-from" class="font-semibold text-slate-600">From:</label>
              <input
                type="date"
                id="filter-date-from"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                class="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-700"
              />
            </div>

            <div class="flex items-center space-x-1.5">
              <label for="filter-date-to" class="font-semibold text-slate-600">To:</label>
              <input
                type="date"
                id="filter-date-to"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                class="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-700"
              />
            </div>

            <button
              type="button"
              onClick={onReset}
              class="text-slate-500 hover:text-slate-800 ml-auto font-medium"
            >
              Reset Filters
            </button>
          </div>
        </form>
      </div>

      <div class="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-500">
        <span class="font-medium">Quick Clinical Queries:</span>
        {QUICK_QUERIES.map((q, idx) => (
          <button
            key={idx}
            onClick={() => {
              setQuery(q.query);
              setTimeout(() => onSearch(q.query), 10);
            }}
            class="bg-slate-200/70 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full transition-colors"
          >
            {q.label}
          </button>
        ))}
      </div>
    </section>
  );
}
