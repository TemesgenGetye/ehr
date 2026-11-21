import React from 'react';
import { Calendar, ArrowUpRight, FileText, Activity, Sparkles } from 'lucide-react';

export default function PatientCard({ item, onOpenDossier }) {
  const scorePct = Math.round((item.relevance_score || 1.0) * 100);

  const initials = (item.patient_name || 'Patient')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Subtle pastel avatar
  const avatarColors = [
    'bg-slate-100 text-slate-800',
    'bg-indigo-50 text-indigo-700',
    'bg-teal-50 text-teal-700',
    'bg-rose-50 text-rose-700',
  ];
  const charSum = (item.patient_name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const avatarClass = avatarColors[charSum % avatarColors.length];

  // Resource badge config
  const getTypeBadge = (type) => {
    switch (type) {
      case 'DocumentReference':
        return { label: 'Clinical Note', color: 'bg-blue-50 text-blue-700 border-blue-200/50', icon: FileText };
      case 'DiagnosticReport':
        return { label: 'Diagnostic / Lab', color: 'bg-purple-50 text-purple-700 border-purple-200/50', icon: Activity };
      case 'ClinicalSummary':
        return { label: 'AI Summary', color: 'bg-emerald-50 text-emerald-700 border-emerald-200/50', icon: Sparkles };
      default:
        return { label: type, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: FileText };
    }
  };

  const badge = getTypeBadge(item.resource_type);
  const BadgeIcon = badge.icon;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-sm transition-all p-5 flex flex-col justify-between group">
      <div>
        {/* Patient Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${avatarClass}`}
            >
              {initials}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                {item.patient_name}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {item.patient_mrn}
              </p>
            </div>
          </div>

          <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.color}`}>
            <BadgeIcon className="w-3 h-3" />
            <span>{badge.label}</span>
          </span>
        </div>

        {/* Record Title & Date */}
        <div className="pt-3">
          <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
            {item.title}
          </h4>
          <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-1">
            <span className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {item.record_date}
            </span>
            <span>•</span>
            <span className="font-mono text-slate-600 font-medium">{scorePct}% match</span>
          </div>
        </div>

        {/* Clinical Excerpt */}
        <p className="text-xs text-slate-600 leading-relaxed mt-2.5 line-clamp-2">
          {item.snippet}
        </p>
      </div>

      {/* Action Button: Dark Pill Button */}
      <button
        onClick={() => onOpenDossier(item.patient_id)}
        className="w-full mt-4 bg-[#11131c] hover:bg-slate-800 text-white text-xs font-semibold py-2.5 px-4 rounded-full flex items-center justify-center space-x-1 transition-all shadow-xs cursor-pointer"
      >
        <span>Dossier details</span>
        <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
      </button>
    </div>
  );
}
