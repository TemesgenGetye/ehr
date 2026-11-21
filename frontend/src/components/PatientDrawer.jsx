import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, ShieldCheck, FileCode, CheckCircle2, Info } from 'lucide-react';

export default function PatientDrawer({ isOpen, onClose, dossier }) {
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !dossier) return null;

  const { patient, summary, bundle } = dossier;
  const hasAnomalies =
    summary.flagged_anomalies &&
    summary.flagged_anomalies.length > 0 &&
    !summary.flagged_anomalies.includes('No critical alerts flagged');

  return (
    <div
      class="fixed inset-0 z-50 overflow-hidden"
      aria-labelledby="slide-over-title"
      role="dialog"
      aria-modal="true"
      aria-expanded={isOpen}
    >
      <div
        class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div class="fixed inset-y-0 right-0 pl-10 max-w-full flex">
        <div class="w-screen max-w-2xl bg-white shadow-2xl flex flex-col border-l border-slate-200">
          
          {/* Header */}
          <div class="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
            <div>
              <div class="flex items-center space-x-2">
                <h2 class="text-xl font-bold tracking-tight">{patient.name}</h2>
                <span class="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-teal-300 border border-slate-700">
                  {patient.mrn}
                </span>
                {summary.cache_hit && (
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                    ⚡ Cached (0ms)
                  </span>
                )}
              </div>
              <p class="text-xs text-slate-400 mt-0.5">
                Patient ID: {patient.id} • {patient.resource_count} Clinical Resources • Verified HL7 FHIR R4
              </p>
            </div>
            <button
              onClick={onClose}
              class="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close dossier"
            >
              <X class="h-6 w-6" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div class="border-b border-slate-200 px-6 flex space-x-6 text-sm font-medium bg-slate-50">
            <button
              onClick={() => setActiveTab('summary')}
              class={`py-3 border-b-2 font-semibold transition-colors ${
                activeTab === 'summary'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              AI Clinical Summary
            </button>
            <button
              onClick={() => setActiveTab('fhir')}
              class={`py-3 border-b-2 font-semibold transition-colors ${
                activeTab === 'fhir'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              FHIR R4 Bundle
            </button>
          </div>

          {/* Drawer Body */}
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'summary' ? (
              <div class="space-y-5">
                {/* Anomaly Alerts */}
                {hasAnomalies && (
                  <div class="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                    <h4 class="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center">
                      <AlertTriangle class="w-4 h-4 mr-1.5 text-amber-600" />
                      Flagged Clinical Anomalies
                    </h4>
                    <ul class="mt-2 text-xs text-amber-900 space-y-1 list-disc list-inside">
                      {summary.flagged_anomalies.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Chief Concern & Diagnoses */}
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Chief Concern
                    </span>
                    <p class="text-sm font-semibold text-slate-900 mt-1">
                      {summary.chief_concern}
                    </p>
                  </div>
                  <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Key Diagnoses
                    </span>
                    <div class="flex flex-wrap gap-1.5 mt-1.5">
                      {summary.key_diagnoses.map((d, i) => (
                        <span
                          key={i}
                          class="px-2.5 py-1 bg-slate-200/80 text-slate-800 text-xs font-medium rounded-full"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Narrative Summary */}
                <div class="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Clinical Narrative (Under 200 Words)
                    </span>
                    <span class="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {summary.word_count} words
                    </span>
                  </div>
                  <p class="text-sm text-slate-800 leading-relaxed">
                    {summary.narrative_summary}
                  </p>
                </div>

                {/* Recent Media Records */}
                <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Recent Clinical Media & Tests
                  </span>
                  <ul class="text-xs text-slate-700 space-y-1.5">
                    {summary.recent_media_records.map((m, i) => (
                      <li key={i} class="flex items-center space-x-2">
                        <span class="text-teal-600 font-bold">•</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Disclaimer */}
                <div class="p-3 bg-slate-100 rounded-lg text-xs text-slate-500 border border-slate-200 italic flex items-start space-x-2">
                  <Info class="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{summary.disclaimer}</span>
                </div>
              </div>
            ) : (
              <div class="space-y-4">
                <div class="flex items-center justify-between text-xs bg-slate-100 p-2.5 rounded border border-slate-200 font-mono">
                  <span>Resources in Bundle: {bundle.entry ? bundle.entry.length : 0}</span>
                  <span class="text-emerald-700 font-semibold flex items-center">
                    <CheckCircle2 class="w-3.5 h-3.5 mr-1" />
                    Valid HL7 FHIR R4 Bundle
                  </span>
                </div>
                <pre class="p-4 bg-slate-900 text-teal-300 font-mono text-xs rounded-lg overflow-x-auto max-h-[500px] border border-slate-800">
                  {JSON.stringify(bundle, null, 2)}
                </pre>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
