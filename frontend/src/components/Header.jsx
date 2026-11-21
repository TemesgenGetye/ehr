import React from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  RefreshCw 
} from 'lucide-react';

export default function Header({ 
  totalRecords = 18, 
  inReviewCount = 2, 
  completedCount = 7, 
  flaggedCount = 3,
  onReseed,
  isReseeding
}) {
  const cards = [
    { label: 'Total Records', value: totalRecords, icon: FileText, iconColor: 'text-purple-400', bg: 'bg-purple-500/15' },
    { label: 'In Progress', value: inReviewCount, icon: Clock, iconColor: 'text-amber-400', bg: 'bg-amber-500/15' },
    { label: 'Verified FHIR', value: completedCount, icon: CheckCircle2, iconColor: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    { label: 'Critical Alerts', value: flaggedCount, icon: AlertCircle, iconColor: 'text-rose-400', bg: 'bg-rose-500/15' },
  ];

  return (
    <header className="bg-[#11131c] text-white pt-4 pb-7 px-6 sm:px-8 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between pb-5 border-b border-slate-800/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
              ❖
            </div>
            <span className="font-semibold text-sm tracking-tight text-white">onye</span>
            <span className="text-[11px] text-slate-400 font-normal ml-1">EHR Intelligence</span>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={onReseed}
              disabled={isReseeding}
              className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
              title="Re-seed pipeline"
            >
              <RefreshCw className={`w-3 h-3 ${isReseeding ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="text-[11px] font-medium">{isReseeding ? 'Syncing...' : 'Sync Data'}</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-800/90 border border-slate-700/60 flex items-center justify-center text-slate-300">
              <User className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        <div className="pt-5">
          <h1 className="text-xl font-bold tracking-tight text-white mb-4">Clinical Media</h1>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {cards.map((c, i) => {
              const Icon = c.icon;
              return (
                <div
                  key={i}
                  className="bg-[#181b26] border border-slate-800/90 rounded-xl p-4 flex items-center justify-between shadow-xs hover:border-slate-700/80 transition-all"
                >
                  <div>
                    <span className="text-[11px] font-medium text-slate-400 block tracking-normal">{c.label}</span>
                    <span className="text-2xl font-bold text-white tracking-tight mt-0.5 block">{c.value}</span>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${c.bg}`}>
                    <Icon className={`w-4 h-4 ${c.iconColor}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
