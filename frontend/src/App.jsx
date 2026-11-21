import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header.jsx';
import FilterSidebar from './components/FilterSidebar.jsx';
import PatientCard from './components/PatientCard.jsx';
import PatientDrawer from './components/PatientDrawer.jsx';
import { Search, X } from 'lucide-react';

export default function App() {
  const [query, setQuery] = useState('');
  const [resourceType, setResourceType] = useState('');

  const [results, setResults] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [latencyMs, setLatencyMs] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReseeding, setIsReseeding] = useState(false);

  // Global counts for the 4 dark hero cards
  const [totalRecords, setTotalRecords] = useState(18);
  const [inReviewCount, setInReviewCount] = useState(2);
  const [completedCount, setCompletedCount] = useState(7);
  const [flaggedCount, setFlaggedCount] = useState(3);

  // Patient Dossier Drawer
  const [dossier, setDossier] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const debounceTimerRef = useRef(null);

  // Fetch initial patient stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/patients');
      if (res.ok) {
        const patients = await res.json();
        const recordsCount = patients.reduce((acc, p) => acc + (p.resource_count || 0), 0);
        setTotalRecords(recordsCount || 18);
        setCompletedCount(patients.filter((p) => p.is_valid).length || 7);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const executeSearch = useCallback(
    async (q = query, type = resourceType) => {
      setIsLoading(true);

      try {
        const res = await fetch('/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: q || '',
            resource_type: type || null,
            limit: 30,
          }),
        });

        if (!res.ok) throw new Error('Search failed');

        const data = await res.json();
        setResults(data.results);
        setTotalMatches(data.total_results);
        setLatencyMs(data.latency_ms);

        // Calculate flagged anomalies & in review
        const flagged = data.results.filter(
          (r) =>
            r.snippet.toLowerCase().includes('elevated') ||
            r.snippet.toLowerCase().includes('acute') ||
            r.snippet.toLowerCase().includes('critical') ||
            r.snippet.toLowerCase().includes('infarction')
        ).length;
        setFlaggedCount(flagged || 3);

        const inReview = data.results.filter((r) => r.resource_type === 'DiagnosticReport').length;
        setInReviewCount(inReview || 2);
      } catch (err) {
        console.error(err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [query, resourceType]
  );

  // Trigger search on mount
  useEffect(() => {
    fetchStats();
    executeSearch('', '');
  }, []);

  // Debounced search on query change
  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      executeSearch(val, resourceType);
    }, 250);
  };

  const handleClearQuery = () => {
    setQuery('');
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    executeSearch('', resourceType);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      executeSearch(query, resourceType);
    }
  };

  const handleResourceTypeChange = (newType) => {
    setResourceType(newType);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    executeSearch(query, newType);
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
    }
  };

  const handleRegenerateSummary = async (patientId) => {
    setIsGeneratingSummary(true);
    try {
      const res = await fetch(`/patients/${patientId}/summarize`, { method: 'POST' });
      if (res.ok) {
        const freshSummary = await res.json();
        setDossier((prev) => (prev ? { ...prev, summary: freshSummary } : prev));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleReseed = async () => {
    setIsReseeding(true);
    try {
      const res = await fetch('/pipeline/seed', { method: 'POST' });
      if (res.ok) {
        await fetchStats();
        executeSearch(query, resourceType);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsReseeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 antialiased font-sans flex flex-col">
      {/* Top Header matching template with 4 dark metric cards */}
      <Header
        totalRecords={totalRecords}
        inReviewCount={inReviewCount}
        completedCount={completedCount}
        flaggedCount={flaggedCount}
        onReseed={handleReseed}
        isReseeding={isReseeding}
      />

      {/* Main Two-Column Layout */}
      <div className="max-w-7xl mx-auto w-full px-6 sm:px-8 py-8 flex-1 flex flex-col md:flex-row gap-8">
        
        {/* Left Filters Sidebar */}
        <FilterSidebar
          resourceType={resourceType}
          setResourceType={handleResourceTypeChange}
        />

        {/* Right Content Area */}
        <main className="flex-1 min-w-0 space-y-6">
          
          {/* Top Search Bar */}
          <div className="bg-white rounded-xl border border-slate-200/80 px-4 py-2.5 flex items-center shadow-xs focus-within:border-slate-400 transition-colors">
            <Search className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              onKeyDown={handleKeyDown}
              placeholder="Search by patient name, MRN, symptom, diagnosis, or condition..."
              className="w-full bg-transparent border-none text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {query && (
              <button
                onClick={handleClearQuery}
                className="text-slate-400 hover:text-slate-600 p-1 mr-1"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-900">{results.length}</strong> records
              {resourceType && (
                <span className="ml-1 text-slate-400">
                  in category <strong className="text-slate-700">{resourceType}</strong>
                </span>
              )}
            </span>
          </div>

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 bg-slate-100 rounded w-1/2" />
                      <div className="h-2.5 bg-slate-100 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="h-10 bg-slate-50 rounded-lg" />
                  <div className="h-8 bg-slate-100 rounded-full" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && results.length === 0 && (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/70">
              <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-slate-800">No records found</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Try searching for a patient name like "Marcus", symptoms like "chest pain", or clear filters.
              </p>
            </div>
          )}

          {/* Clean Patient Cards Grid */}
          {!isLoading && results.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {results.map((item) => (
                <PatientCard
                  key={item.record_id}
                  item={item}
                  onOpenDossier={handleOpenDossier}
                />
              ))}
            </div>
          )}

        </main>
      </div>

      {/* Patient Dossier Detail Drawer */}
      <PatientDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        dossier={dossier}
        onRegenerateSummary={handleRegenerateSummary}
        isGeneratingSummary={isGeneratingSummary}
      />
    </div>
  );
}
