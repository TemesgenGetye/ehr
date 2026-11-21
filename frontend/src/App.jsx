import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar.jsx';
import SearchBar from './components/SearchBar.jsx';
import ResultCard from './components/ResultCard.jsx';
import PatientDrawer from './components/PatientDrawer.jsx';
import { Search, Zap } from 'lucide-react';

export default function App() {
  const [query, setQuery] = useState('acute abdominal pain and lab results');
  const [resourceType, setResourceType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [results, setResults] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [latencyMs, setLatencyMs] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReseeding, setIsReseeding] = useState(false);

  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [dossier, setDossier] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const executeSearch = useCallback(async (customQuery) => {
    const q = (customQuery !== undefined ? customQuery : query).trim();
    if (!q) {
      setResults([]);
      setTotalMatches(0);
      setLatencyMs(null);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          resource_type: resourceType || null,
          date_from: dateFrom || null,
          date_to: dateTo || null,
          limit: 10,
        }),
      });

      if (!res.ok) throw new Error('Search failed');

      const data = await res.json();
      setResults(data.results);
      setTotalMatches(data.total_results);
      setLatencyMs(data.latency_ms);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, resourceType, dateFrom, dateTo]);

  // Initial search on component mount
  useEffect(() => {
    executeSearch('acute abdominal pain and lab results');
  }, []);

  const handleResetFilters = () => {
    setResourceType('');
    setDateFrom('');
    setDateTo('');
    setTimeout(() => executeSearch(), 10);
  };

  const handleOpenDossier = async (patientId) => {
    try {
      const res = await fetch(`/patients/${patientId}`);
      if (!res.ok) throw new Error('Failed to load patient dossier');
      const data = await res.json();
      setDossier(data);
      setIsDrawerOpen(true);
    } catch (err) {
      console.error(err);
      alert('Failed to load patient dossier.');
    }
  };

  const handleReseed = async () => {
    setIsReseeding(true);
    try {
      const res = await fetch('/pipeline/seed', { method: 'POST' });
      if (res.ok) {
        alert('EHR ingestion & FHIR normalization pipeline re-executed successfully!');
        executeSearch();
      }
    } catch (err) {
      console.error(err);
      alert('Pipeline execution failed.');
    } finally {
      setIsReseeding(false);
    }
  };

  return (
    <div class="min-h-full flex flex-col bg-slate-50">
      <Navbar onReseed={handleReseed} isReseeding={isReseeding} />

      <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        <SearchBar
          query={query}
          setQuery={setQuery}
          resourceType={resourceType}
          setResourceType={setResourceType}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          onSearch={executeSearch}
          onReset={handleResetFilters}
        />

        {/* Results Header */}
        <section class="flex-1 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-2">
              <h2 class="text-lg font-semibold text-slate-900">Ranked Search Results</h2>
              {totalMatches > 0 && (
                <span class="text-xs bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                  {totalMatches} matches
                </span>
              )}
            </div>
            {latencyMs !== null && (
              <div class="flex items-center space-x-1 text-xs text-slate-500 font-mono">
                <Zap class="w-3.5 h-3.5 text-emerald-500" />
                <span>Latency:</span>
                <span class="text-emerald-600 font-bold">{latencyMs}ms</span>
              </div>
            )}
          </div>

          {/* Loading Skeleton */}
          {isLoading && (
            <div class="space-y-3 py-4">
              <div class="p-5 bg-white rounded-xl border border-slate-200 animate-pulse space-y-3">
                <div class="h-4 bg-slate-200 rounded w-1/3"></div>
                <div class="h-3 bg-slate-200 rounded w-2/3"></div>
                <div class="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
              <div class="p-5 bg-white rounded-xl border border-slate-200 animate-pulse space-y-3">
                <div class="h-4 bg-slate-200 rounded w-1/4"></div>
                <div class="h-3 bg-slate-200 rounded w-3/4"></div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && results.length === 0 && (
            <div class="p-12 text-center bg-white rounded-xl border border-slate-200 border-dashed">
              <div class="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Search class="w-6 h-6" />
              </div>
              <h3 class="text-sm font-semibold text-slate-900">No matching patient records</h3>
              <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try entering natural language clinical symptoms, diagnostic codes, or patient observations.
              </p>
            </div>
          )}

          {/* Result Cards */}
          {!isLoading && results.length > 0 && (
            <div class="space-y-4">
              {results.map((item) => (
                <ResultCard
                  key={item.record_id}
                  item={item}
                  onOpenDossier={handleOpenDossier}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Patient Detail Drawer */}
      <PatientDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        dossier={dossier}
      />
    </div>
  );
}
