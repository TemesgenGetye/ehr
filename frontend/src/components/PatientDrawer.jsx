import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Sparkles, 
  FileText, 
  Activity, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export default function PatientDrawer({ isOpen, onClose, dossier, onRegenerateSummary, isGeneratingSummary }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [copied, setCopied] = useState(false);
  const [resourceFilter, setResourceFilter] = useState('ALL');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !dossier) return null;

  const { patient, summary, bundle } = dossier;
  const hasAnomalies =
    summary &&
    summary.flagged_anomalies &&
    summary.flagged_anomalies.length > 0 &&
    !summary.flagged_anomalies.includes('No critical alerts flagged');

  const entries = bundle?.entry || [];
  const filteredEntries = resourceFilter === 'ALL' 
    ? entries 
    : entries.filter((e) => e.resource?.resourceType === resourceFilter);

  const filteredBundle = {
    ...bundle,
    entry: filteredEntries,
    total: filteredEntries.length,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(filteredBundle, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const initials = (patient.name || 'Patient')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-expanded={isOpen}
    >
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
        <div className="w-screen max-w-xl bg-white shadow-xl flex flex-col border-l border-slate-200">
          
          <div className="px-6 py-4 bg-[#11131c] text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center justify-center">
                {initials}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-sm font-bold tracking-tight text-white">{patient.name}</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    {patient.mrn}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  HL7 FHIR R4 Patient Dossier
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="border-b border-slate-200 px-6 flex items-center justify-between bg-slate-50">
            <div className="flex space-x-6 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('summary')}
                className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'summary'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Summary</span>
              </button>
              <button
                onClick={() => setActiveTab('fhir')}
                className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'fhir'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>FHIR R4</span>
              </button>
            </div>

            {activeTab === 'summary' && onRegenerateSummary && (
              <button
                onClick={() => onRegenerateSummary(patient.id)}
                disabled={isGeneratingSummary}
                className="flex items-center space-x-1 text-[11px] text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-2xs hover:bg-slate-100 transition-colors disabled:opacity-50"
                title="Regenerate with Gemini API"
              >
                <RefreshCw className={`w-3 h-3 ${isGeneratingSummary ? 'animate-spin text-indigo-600' : ''}`} />
                <span>{isGeneratingSummary ? 'Generating...' : 'Refresh AI'}</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {activeTab === 'summary' ? (
              isGeneratingSummary ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-slate-900">
                    Generating summary with Gemini API...
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Analyzing clinical notes, laboratory panels, and diagnostic findings
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {hasAnomalies && (
                    <div className="bg-rose-50 border border-rose-200/80 p-3.5 rounded-xl">
                      <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider flex items-center mb-1.5">
                        <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                        Critical Flagged Anomalies
                      </span>
                      <ul className="text-xs text-rose-900 space-y-1 list-disc list-inside">
                        {summary.flagged_anomalies.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Chief Concern
                    </span>
                    <p className="text-xs font-semibold text-slate-800 mt-1 leading-snug">
                      {summary.chief_concern}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Key Diagnoses
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {summary.key_diagnoses.map((d, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-0.5 bg-white text-slate-800 text-[11px] font-medium rounded-full border border-slate-200"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200/80">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Narrative Summary
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {summary.word_count} words
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {summary.narrative_summary}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Recent Tests & Media
                    </span>
                    <div className="space-y-1.5">
                      {summary.recent_media_records.map((m, i) => (
                        <div
                          key={i}
                          className="flex items-center space-x-2 text-xs font-medium text-slate-800 bg-white p-2 rounded-lg border border-slate-200/60"
                        >
                          <Activity className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 italic pt-1">
                    {summary.disclaimer}
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-3">
                {/* Simple Resource Filter */}
                <div className="flex items-center justify-between gap-2 pb-1">
                  <div className="flex items-center space-x-1.5 overflow-x-auto text-[11px]">
                    {[
                      { id: 'ALL', label: `All (${entries.length})` },
                      { id: 'Patient', label: 'Patient' },
                      { id: 'DocumentReference', label: 'Notes' },
                      { id: 'DiagnosticReport', label: 'Labs' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setResourceFilter(f.id)}
                        className={`px-2 py-0.5 rounded-full transition-colors ${
                          resourceFilter === f.id
                            ? 'bg-slate-900 text-white font-semibold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleCopy}
                    className="flex items-center space-x-1 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md font-medium transition-colors shrink-0"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <pre className="p-3.5 bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed rounded-xl overflow-x-auto max-h-[500px] border border-slate-800">
                  {JSON.stringify(filteredBundle, null, 2)}
                </pre>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
