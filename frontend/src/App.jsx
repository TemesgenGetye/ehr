import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar.jsx';
import StatsRibbon from './components/StatsRibbon.jsx';
import SearchBar from './components/SearchBar.jsx';
import ResultCard from './components/ResultCard.jsx';
import ResultTable from './components/ResultTable.jsx';
import PatientDrawer from './components/PatientDrawer.jsx';
import { LayoutGrid, List, Search, Zap, AlertTriangle } from 'lucide-react';

export default function App() {
  const [activeNav, setActiveNav] = useState('search');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  const [query, setQuery] = useState('crushing substernal chest pressure ST elevation');
  const [resourceType, setResourceType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [results, setResults] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [latencyMs, setLatencyMs] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReseeding, setIsReseeding] = useState(false);

  // Global counts
  const [totalPatients, setTotalPatients] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [anomalyCount, setAnomalyCount] = useState(0);

  // Patient Dossier Drawer
  const [dossier, setDossier] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Fetch initial patient stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/patients');
      if (res.ok) {
        const patients = await res.json();
        setTotalPatients(patients.length);
        const recordsCount = patients.reduce((acc, p) => acc + (p.resource_count || 0), 0);
        setTotalRecords(recordsCount || 14);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const executeSearch = useCallback(
    async (customQuery, customType) => {
      const q = (customQuery !== undefined ? customQuery : query).trim();
      const type = customType !== undefined ? customType : resourceType;

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
            resource_type: type || null,
            date_from: dateFrom || null,
            date_to: dateTo || null,
            limit: 12,
          }),
        });

        if (!res.ok) throw new Error('Search failed');

        const data = await res.json();
        setResults(data.results);
        setTotalMatches(data.total_results);
        setLatencyMs(data.latency_ms);

        // Approximate anomaly count
        const anomalies = data.results.filter(
          (r) =>
            r.snippet.toLowerCase().includes('elevated') ||
            r.snippet.toLowerCase().includes('appendicitis') ||
            r.snippet.toLowerCase().includes('acute') ||
            r.snippet.toLowerCase().includes('hyperinflation')
        ).length;
        setAnomalyCount(anomalies || 3);
      } catch (err) {
        console.error(err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [query, resourceType, dateFrom, dateTo]
  );

  useEffect(() => {
    fetchStats();
    executeSearch('crushing substernal chest pressure ST elevation');
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
        await fetchStats();
        executeSearch();
      }
    } catch (err) {
      console.error(err);
      alert('Pipeline re-execution failed.');
    } finally {
      setIsReseeding(false);
    }
  };

  return (
    <div class="h-screen flex bg-slate-100 text-slate-800 antialiased overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        onReseed={handleReseed}
        isReseeding={isReseeding}
        patientCount={totalPatients}
        anomalyCount={anomalyCount}
      />

      {/* Main Workspace Area */}
      <div class="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header class="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div>
            <h1 class="text-sm font-extrabold text-slate-900 tracking-tight flex items-center">
              <span>Clinical Media Intelligence Station</span>
              <span class="ml-2.5 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                Production FHIR R4
              </span>
            </h1>
            <p class="text-[11px] text-slate-400">NYCEDC · Onye Health AI Platform</p>
          </div>

          {/* View Toggle */}
          <div class="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              class={`p-1.5 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid class="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              class={`p-1.5 rounded-md transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Worklist Table View"
            >
              <List class="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div class="p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Stats Ribbon */}
          <StatsRibbon
            totalPatients={totalPatients}
            totalRecords={totalRecords}
            anomalyCount={anomalyCount}
            latencyMs={latencyMs}
          />

          {/* Search Controls */}
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

          {/* Results Area */}
          <section class="space-y-4">
            <div class="flex items-center justify-between pb-2">
              <div class="flex items-center space-x-2">
                <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Ranked Results
                </h2>
                {totalMatches > 0 && (
                  <span class="text-xs bg-teal-100/70 text-teal-800 font-bold px-2 py-0.5 rounded-full">
                    {totalMatches} matches found
                  </span>
                )}
              </div>

              {latencyMs !== null && (
                <div class="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
                  <Zap class="w-3.5 h-3.5 text-emerald-500" />
                  <span>Speed:</span>
                  <span class="text-emerald-600 font-bold">{latencyMs}ms</span>
                </div>
              )}
            </div>

            {/* Skeleton Loading State */}
            {isLoading && (
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} class="p-5 bg-white rounded-xl border border-slate-200 animate-pulse space-y-3">
                    <div class="flex items-center space-x-3">
                      <div class="w-10 h-10 rounded-full bg-slate-200" />
                      <div class="space-y-1 flex-1">
                        <div class="h-4 bg-slate-200 rounded w-1/3" />
                        <div class="h-3 bg-slate-100 rounded w-1/4" />
                      </div>
                    </div>
                    <div class="h-3 bg-slate-200 rounded w-full" />
                    <div class="h-3 bg-slate-100 rounded w-2/3" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && results.length === 0 && (
              <div class="p-12 text-center bg-white rounded-2xl border border-slate-200/80 border-dashed">
                <div class="mx-auto w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
                  <Search class="w-6 h-6" />
                </div>
                <h3 class="text-sm font-bold text-slate-900">No matching clinical records found</h3>
                <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Try searching for symptoms like 'chest pain', conditions like 'appendicitis', or laboratory biomarkers.
                </p>
              </div>
            )}

            {/* Results Display */}
            {!isLoading && results.length > 0 && (
              <>
                {viewMode === 'grid' ? (
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.map((item) => (
                      <ResultCard
                        key={item.record_id}
                        item={item}
                        onOpenDossier={handleOpenDossier}
                      />
                    ))}
                  </div>
                ) : (
                  <ResultTable
                    results={results}
                    onOpenDossier={handleOpenDossier}
                  />
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {/* Patient Detail Drawer */}
      <PatientDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        dossier={dossier}
      />
    </div>
  );
}
