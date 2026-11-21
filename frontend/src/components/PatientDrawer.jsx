import React, { useState, useEffect } from 'react';
import { 
  X, 
  AlertOctagon, 
  CheckCircle2, 
  Copy, 
  Check, 
  Sparkles, 
  FileText, 
  Activity, 
  ShieldAlert, 
  Calendar, 
  User, 
  Clock 
} from 'lucide-react';

export default function PatientDrawer({ isOpen, onClose, dossier }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [copied, setCopied] = useState(false);

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
    summary.flagged_anomalies &&
    summary.flagged_anomalies.length > 0 &&
    !summary.flagged_anomalies.includes('No critical alerts flagged');

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      class="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-expanded={isOpen}
    >
      {/* Backdrop */}
      <div
        class="absolute inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div class="fixed inset-y-0 right-0 pl-10 max-w-full flex">
        <div class="w-screen max-w-2xl bg-white shadow-2xl flex flex-col border-l border-slate-200">
          
          {/* Top Dossier Header */}
          <div class="px-6 py-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div class="flex items-center space-x-3.5">
              <div class="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-500 to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-md">
                {patient.name.split(' ').map(p => p[0]).slice(0, 2).join('')}
              </div>
              <div>
                <div class="flex items-center space-x-2">
                  <h2 class="text-base font-black tracking-tight">{patient.name}</h2>
                  <span class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-teal-300 border border-slate-700">
                    {patient.mrn}
                  </span>
                  {summary.cache_hit && (
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/30 flex items-center">
                      <Clock class="w-2.5 h-2.5 mr-1" />
                      Cached (0ms)
                    </span>
                  )}
                </div>
                <p class="text-xs text-slate-400 mt-0.5">
                  ID: {patient.id} • {patient.resource_count} Clinical Resources • Verified HL7 FHIR R4
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              class="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div class="border-b border-slate-200 px-6 flex space-x-6 text-xs font-bold uppercase tracking-wider bg-slate-50">
            <button
              onClick={() => setActiveTab('summary')}
              class={`py-3.5 border-b-2 transition-colors flex items-center space-x-1.5 ${
                activeTab === 'summary'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles class="w-3.5 h-3.5" />
              <span>AI Clinical Summary</span>
            </button>
            <button
              onClick={() => setActiveTab('fhir')}
              class={`py-3.5 border-b-2 transition-colors flex items-center space-x-1.5 ${
                activeTab === 'fhir'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText class="w-3.5 h-3.5" />
              <span>FHIR R4 Bundle</span>
            </button>
          </div>

          {/* Tab Panels */}
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'summary' ? (
              <div class="space-y-5">
                {/* Critical Anomalies Card */}
                {hasAnomalies && (
                  <div class="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl shadow-xs">
                    <h4 class="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center">
                      <AlertOctagon class="w-4 h-4 mr-1.5 text-rose-600" />
                      Critical Clinical Anomalies Flagged
                    </h4>
                    <ul class="mt-2 text-xs text-rose-900 font-medium space-y-1.5 list-disc list-inside">
                      {summary.flagged_anomalies.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Chief Concern & Key Diagnoses */}
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span class="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                      Chief Concern
                    </span>
                    <p class="text-xs font-bold text-slate-900 mt-1.5 leading-snug">
                      {summary.chief_concern}
                    </p>
                  </div>

                  <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span class="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                      Key Diagnoses
                    </span>
                    <div class="flex flex-wrap gap-1.5 mt-2">
                      {summary.key_diagnoses.map((d, i) => (
                        <span
                          key={i}
                          class="px-2.5 py-0.5 bg-slate-200/90 text-slate-800 text-[11px] font-semibold rounded-full"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Clinical Narrative (<200 words) */}
                <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <div class="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                    <span class="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center">
                      <FileText class="w-3.5 h-3.5 mr-1.5 text-teal-600" />
                      Clinical Synopsis
                    </span>
                    <span class="text-[10.5px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-bold border border-teal-200/60">
                      {summary.word_count} / 200 words
                    </span>
                  </div>
                  <p class="text-xs text-slate-700 leading-relaxed font-sans mt-2">
                    {summary.narrative_summary}
                  </p>
                </div>

                {/* Recent Media Records */}
                <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span class="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                    Recent Tests & Diagnostic Media
                  </span>
                  <div class="space-y-2">
                    {summary.recent_media_records.map((m, i) => (
                      <div key={i} class="flex items-center space-x-2 text-xs font-semibold text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-2xs">
                        <Activity class="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clinical Safety Disclaimer */}
                <div class="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-500 border border-slate-200 italic flex items-start space-x-2">
                  <ShieldAlert class="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{summary.disclaimer}</span>
                </div>
              </div>
            ) : (
              <div class="space-y-4">
                <div class="flex items-center justify-between bg-slate-100 p-3 rounded-xl border border-slate-200 text-xs font-mono">
                  <span class="font-bold text-slate-700">Resources: {bundle.entry ? bundle.entry.length : 0}</span>
                  <button
                    onClick={handleCopy}
                    class="flex items-center space-x-1.5 text-xs text-teal-700 hover:text-teal-900 bg-white border border-slate-300 px-3 py-1.5 rounded-lg font-bold shadow-2xs hover:bg-teal-50 transition-colors"
                  >
                    {copied ? <Check class="w-3.5 h-3.5 text-emerald-600" /> : <Copy class="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy FHIR JSON'}</span>
                  </button>
                </div>
                <pre class="p-4 bg-slate-950 text-teal-300 font-mono text-[11px] leading-tight rounded-xl overflow-x-auto max-h-[520px] border border-slate-800">
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
