import React from 'react';
import { 
  Search, 
  Users, 
  AlertTriangle, 
  Database, 
  RefreshCw, 
  ShieldCheck, 
  HeartPulse,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ 
  activeNav, 
  setActiveNav, 
  onReseed, 
  isReseeding, 
  patientCount = 0,
  anomalyCount = 0 
}) {
  const navItems = [
    { id: 'search', label: 'Clinical Search', icon: Search },
    { id: 'alerts', label: 'Flagged Alerts', icon: AlertTriangle, badge: anomalyCount > 0 ? anomalyCount : null, badgeColor: 'bg-amber-500 text-white' },
    { id: 'patients', label: 'Patient Directory', icon: Users, badge: patientCount > 0 ? patientCount : null, badgeColor: 'bg-slate-700 text-slate-200' },
    { id: 'fhir', label: 'FHIR R4 Store', icon: Database },
  ];

  return (
    <aside class="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div class="h-16 px-5 flex items-center justify-between border-b border-slate-800">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-slate-950 font-black text-base shadow-lg shadow-teal-500/20">
            ❖
          </div>
          <div>
            <div class="flex items-center space-x-1.5">
              <span class="font-extrabold text-white tracking-tight text-base">onye</span>
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                EHR
              </span>
            </div>
            <p class="text-[10.5px] text-slate-400 leading-none">Media Intelligence</p>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav class="flex-1 px-3 py-4 space-y-1">
        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-300 px-3 mb-2">
          Clinical Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              class={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-teal-600/15 text-teal-400 border border-teal-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div class="flex items-center space-x-2.5">
                <Icon class={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span class={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Action: Re-seed */}
      <div class="p-3 border-t border-slate-800">
        <button
          onClick={onReseed}
          disabled={isReseeding}
          class="w-full flex items-center justify-center space-x-2 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 px-3 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
        >
          <RefreshCw class={`w-3.5 h-3.5 ${isReseeding ? 'animate-spin text-teal-400' : 'text-slate-400'}`} />
          <span>{isReseeding ? 'Re-ingesting...' : 'Re-seed Pipeline'}</span>
        </button>
      </div>

      {/* System Status Badges */}
      <div class="p-4 bg-slate-950/60 border-t border-slate-800 text-[11px] space-y-2">
        <div class="flex items-center justify-between text-slate-400">
          <span class="flex items-center space-x-1.5">
            <ShieldCheck class="w-3.5 h-3.5 text-emerald-400" />
            <span>HL7 FHIR R4</span>
          </span>
          <span class="text-emerald-400 font-bold">100% Valid</span>
        </div>
        <div class="flex items-center justify-between text-slate-400">
          <span class="flex items-center space-x-1.5">
            <Sparkles class="w-3.5 h-3.5 text-teal-400" />
            <span>AI Cache</span>
          </span>
          <span class="text-teal-400 font-mono font-bold">SHA-256</span>
        </div>
        <div class="flex items-center justify-between text-slate-400">
          <span class="flex items-center space-x-1.5">
            <HeartPulse class="w-3.5 h-3.5 text-indigo-400" />
            <span>Vector Engine</span>
          </span>
          <span class="text-indigo-400 font-bold">HNSW Cosine</span>
        </div>
      </div>
    </aside>
  );
}
