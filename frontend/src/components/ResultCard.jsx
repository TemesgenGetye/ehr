import React from 'react';
import { ArrowRight, FileText, Activity, Sparkles } from 'lucide-react';

export default function ResultCard({ item, onOpenDossier }) {
  const scorePct = Math.round(item.relevance_score * 100);

  const getBadge = (type) => {
    switch (type) {
      case 'DocumentReference':
        return {
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <FileText class="w-3 h-3 mr-1 inline" />
        };
      case 'DiagnosticReport':
        return {
          bg: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: <Activity class="w-3 h-3 mr-1 inline" />
        };
      case 'ClinicalSummary':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: <Sparkles class="w-3 h-3 mr-1 inline" />
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-200',
          icon: null
        };
    }
  };

  const badge = getBadge(item.resource_type);

  return (
    <div class="result-card bg-white p-5 rounded-xl border border-slate-200 hover:border-teal-500 hover:shadow-md transition-all">
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2">
            <span class="font-bold text-slate-900 text-base">{item.patient_name}</span>
            <span class="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200">
              {item.patient_mrn}
            </span>
            <span class={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badge.bg}`}>
              {badge.icon}
              {item.resource_type}
            </span>
          </div>
          <h4 class="text-sm font-semibold text-slate-800 mt-1">{item.title}</h4>
        </div>

        <div class="text-right shrink-0">
          <div class={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${
            scorePct >= 80 ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-slate-100 text-slate-700'
          }`}>
            <span>{scorePct}% Match</span>
          </div>
          <span class="block text-xs text-slate-400 mt-1">{item.record_date}</span>
        </div>
      </div>

      <p class="text-sm text-slate-600 mt-2.5 leading-relaxed bg-slate-50/70 p-3 rounded-lg border border-slate-100 font-sans">
        {item.snippet}
      </p>

      <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span class="text-xs text-slate-400 font-mono">Record ID: {item.record_id}</span>
        <button
          onClick={() => onOpenDossier(item.patient_id)}
          class="inline-flex items-center space-x-1 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-md transition-colors"
        >
          <span>Open Full Dossier & Summary</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
