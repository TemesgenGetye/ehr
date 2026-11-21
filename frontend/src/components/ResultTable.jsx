import React from 'react';
import { ArrowUpRight, Calendar, FileText, Activity, Sparkles } from 'lucide-react';

export default function ResultTable({ results, onOpenDossier }) {
  const getBadge = (type) => {
    switch (type) {
      case 'DocumentReference':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DiagnosticReport':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'ClinicalSummary':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
            <tr>
              <th class="px-4 py-3">Patient / MRN</th>
              <th class="px-4 py-3">Record Title & Snippet</th>
              <th class="px-4 py-3">Type</th>
              <th class="px-4 py-3">Date</th>
              <th class="px-4 py-3">Relevance</th>
              <th class="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {results.map((item) => {
              const scorePct = Math.round(item.relevance_score * 100);
              return (
                <tr key={item.record_id} class="hover:bg-slate-50/80 transition-colors">
                  <td class="px-4 py-3 whitespace-nowrap">
                    <div class="font-bold text-slate-900">{item.patient_name}</div>
                    <div class="text-[11px] font-mono text-slate-400">{item.patient_mrn}</div>
                  </td>
                  <td class="px-4 py-3 max-w-md">
                    <div class="font-semibold text-slate-800 line-clamp-1">{item.title}</div>
                    <div class="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.snippet}</div>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <span class={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${getBadge(item.resource_type)}`}>
                      {item.resource_type}
                    </span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                    {item.record_date}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <span class="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded text-[11px]">
                      {scorePct}%
                    </span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-right">
                    <button
                      onClick={() => onOpenDossier(item.patient_id)}
                      class="text-xs font-semibold text-teal-600 hover:text-teal-800 bg-teal-50/80 hover:bg-teal-100 px-2.5 py-1 rounded-md transition-colors"
                    >
                      Dossier →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
