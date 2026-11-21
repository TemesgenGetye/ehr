import React from 'react';
import { FileText, Activity, Sparkles, ArrowUpRight } from 'lucide-react';

export default function PatientCard({ item, onOpenDossier, compactView }) {
  const scorePct = Math.round(item.relevance_score * 100);

  // Patient initials
  const initials = (item.patient_name || 'Patient')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Avatar pastel background colors based on name hash
  const avatarColors = [
    'bg-rose-100 text-rose-700',
    'bg-amber-100 text-amber-700',
    'bg-teal-100 text-teal-700',
    'bg-indigo-100 text-indigo-700',
    'bg-sky-100 text-sky-700',
  ];
  const charSum = (item.patient_name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const avatarClass = avatarColors[charSum % avatarColors.length];

  // Status badge matching template colors (lilac, amber, soft teal, soft rose)
  const isAlert =
    item.snippet.toLowerCase().includes('elevated') ||
    item.snippet.toLowerCase().includes('acute') ||
    item.snippet.toLowerCase().includes('critical') ||
    item.snippet.toLowerCase().includes('infarction');

  const statusConfig = isAlert
    ? { text: 'Critical', bg: 'bg-rose-50 text-rose-700 border-rose-200/50' }
    : item.resource_type === 'DiagnosticReport'
    ? { text: 'In review', bg: 'bg-amber-50 text-amber-700 border-amber-200/50' }
    : item.resource_type === 'ClinicalSummary'
    ? { text: 'Ready', bg: 'bg-teal-50 text-teal-700 border-teal-200/50' }
    : { text: 'Verified', bg: 'bg-purple-50 text-purple-700 border-purple-200/50' };

  // Secondary items display
  const isLab = item.resource_type === 'DiagnosticReport';
  const icon1 = isLab ? '🧪' : '📄';
  const icon2 = isLab ? '🔬' : '🫀';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 hover:border-slate-300 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between group">
      <div>
        {/* Top Header: Avatar, Name, MRN & Status Badge */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${avatarClass}`}
            >
              {initials}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight group-hover:text-indigo-600 transition-colors">
                {item.patient_name}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {item.patient_mrn}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusConfig.bg}`}
          >
            {statusConfig.text}
          </span>
        </div>

        {/* 2-Column Stats Row (matching template table number & total payment) */}
        <div className="grid grid-cols-2 gap-4 my-4 py-2.5 border-y border-slate-100">
          <div>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
              Record date
            </span>
            <span className="text-xs font-semibold text-slate-800 mt-0.5 block">
              {item.record_date}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
              Relevance
            </span>
            <span className="text-xs font-bold text-slate-900 mt-0.5 block">
              {scorePct}% match
            </span>
          </div>
        </div>

        {/* Clinical Items List (matching template item list) */}
        {!compactView && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 truncate pr-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] shrink-0">
                  {icon1}
                </span>
                <span className="font-medium text-slate-800 truncate">{item.title}</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono shrink-0">1x</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 truncate pr-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] shrink-0">
                  {icon2}
                </span>
                <span className="font-medium text-slate-500 truncate">
                  {item.resource_type === 'DiagnosticReport' ? 'Diagnostic Panel & Findings' : 'HL7 FHIR Clinical Dossier'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono shrink-0">1x</span>
            </div>

            <p className="text-[10px] text-slate-400 font-medium pl-7">
              + 2 more clinical records
            </p>
          </div>
        )}

        {/* Short Clinical Note / Order Notes */}
        <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100/80 mb-2">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
            Clinical note:
          </span>
          <p className="text-xs text-slate-700 leading-relaxed mt-1 line-clamp-2">
            {item.snippet}
          </p>
        </div>
      </div>

      {/* Action Button: Dark Pill Button matching template */}
      <button
        onClick={() => onOpenDossier(item.patient_id)}
        className="w-full mt-3 bg-[#11131c] hover:bg-slate-800 text-white text-xs font-semibold py-2.5 px-4 rounded-full flex items-center justify-center space-x-1 transition-all shadow-xs group-hover:shadow"
      >
        <span>Dossier details</span>
        <span className="text-xs ml-0.5">↗</span>
      </button>
    </div>
  );
}

