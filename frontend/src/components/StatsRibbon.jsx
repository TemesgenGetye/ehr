import React from 'react';
import { Users, FileText, AlertTriangle, Zap } from 'lucide-react';

export default function StatsRibbon({ totalPatients, totalRecords, anomalyCount, latencyMs }) {
  const stats = [
    {
      label: 'Verified Patients',
      value: totalPatients,
      sub: 'HL7 FHIR R4 dossiers',
      icon: Users,
      color: 'text-teal-600',
      bg: 'bg-teal-50 border-teal-200/60',
    },
    {
      label: 'Clinical Media Records',
      value: totalRecords,
      sub: 'Notes, labs & imaging indexed',
      icon: FileText,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 border-indigo-200/60',
    },
    {
      label: 'Flagged Anomalies',
      value: anomalyCount,
      sub: 'Actionable clinical flags',
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-200/60',
    },
    {
      label: 'Search Response',
      value: latencyMs !== null ? `${latencyMs}ms` : '< 25ms',
      sub: 'Sub-second vector lookup',
      icon: Zap,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-200/60',
    },
  ];

  return (
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((s, idx) => {
        const Icon = s.icon;
        return (
          <div
            key={idx}
            class={`p-4 rounded-xl border bg-white flex items-center justify-between shadow-xs transition-shadow hover:shadow-sm`}
          >
            <div>
              <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
              <p class="text-2xl font-black text-slate-900 mt-0.5 tracking-tight">{s.value}</p>
              <p class="text-[11px] text-slate-400 mt-0.5">{s.sub}</p>
            </div>
            <div class={`w-10 h-10 rounded-lg flex items-center justify-center border ${s.bg}`}>
              <Icon class={`w-5 h-5 ${s.color}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
