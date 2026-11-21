import React from 'react';
import { FileText, Activity, Sparkles, ArrowUpRight, Calendar, User, Hash } from 'lucide-react';

export default function ResultCard({ item, onOpenDossier }) {
  const scorePct = Math.round(item.relevance_score * 100);

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getBadgeConfig = (type) => {
    switch (type) {
      case 'DocumentReference':
        return {
          label: 'Clinical Note',
          bg: 'bg-blue-50 text-blue-700 border-blue-200/70',
          dot: 'bg-blue-500',
          icon: FileText,
        };
      case 'DiagnosticReport':
        return {
          label: 'Diagnostic / Lab',
          bg: 'bg-purple-50 text-purple-700 border-purple-200/70',
          dot: 'bg-purple-500',
          icon: Activity,
        };
      case 'ClinicalSummary':
        return {
          label: 'AI Clinical Summary',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
          dot: 'bg-emerald-500',
          icon: Sparkles,
        };
      default:
        return {
          label: type,
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          icon: FileText,
        };
    }
  };

  const badge = getBadgeConfig(item.resource_type);
  const BadgeIcon = badge.icon;

  return (
    <div class="result-card bg-white rounded-xl border border-slate-200/90 hover:border-teal-400 p-5 shadow-xs hover:shadow-md transition-all group">
      {/* Top Header Row */}
      <div class="flex items-start justify-between gap-4">
        {/* Patient Info */}
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 text-teal-300 font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
            {getInitials(item.patient_name)}
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition-colors">
                {item.patient_name}
              </span>
              <span class="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
                {item.patient_mrn}
              </span>
            </div>
            <div class="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
              <span class="flex items-center">
                <Calendar class="w-3 h-3 mr-1" />
                {item.record_date}
              </span>
              <span>•</span>
              <span class="font-mono text-slate-400">ID: {item.record_id}</span>
            </div>
          </div>
        </div>

        {/* Relevance Meter & Type */}
        <div class="flex flex-col items-end space-y-1.5 shrink-0">
          <span
            class={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg}`}
          >
            <span class={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
            <span>{badge.label}</span>
          </span>

          <div class="flex items-center space-x-1.5 text-xs">
            <div class="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full"
                style={{ width: `${scorePct}%` }}
              />
            </div>
            <span class="font-mono text-[11px] font-bold text-slate-700">{scorePct}% Match</span>
          </div>
        </div>
      </div>

      {/* Record Title */}
      <h3 class="text-sm font-bold text-slate-900 mt-3.5 flex items-center">
        <BadgeIcon class="w-4 h-4 mr-1.5 text-slate-400 shrink-0" />
        <span>{item.title}</span>
      </h3>

      {/* Excerpt Body */}
      <p class="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 font-sans">
        {item.snippet}
      </p>

      {/* Footer Actions */}
      <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div class="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
          <span>Patient ID: {item.patient_id}</span>
        </div>
        <button
          onClick={() => onOpenDossier(item.patient_id)}
          class="inline-flex items-center space-x-1 bg-slate-100 hover:bg-teal-600 text-slate-700 hover:text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-all shadow-2xs"
        >
          <span>View Patient Dossier</span>
          <ArrowUpRight class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
