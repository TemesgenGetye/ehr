import React from 'react';
import { Activity, RefreshCw } from 'lucide-react';

export default function Navbar({ onReseed, isReseeding }) {
  return (
    <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            ❖
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="font-bold text-slate-900 tracking-tight text-lg">onye</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-medium">EHR Intelligence</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-semibold">React</span>
            </div>
            <p class="text-xs text-slate-500">HL7 FHIR R4 & AI Media Pipeline</p>
          </div>
        </div>

        <div class="flex items-center space-x-4">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
            FHIR R4 Connected
          </span>
          <button
            onClick={onReseed}
            disabled={isReseeding}
            class="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
            title="Re-ingest simulated EHR records"
          >
            <RefreshCw class={`h-3.5 w-3.5 ${isReseeding ? 'animate-spin text-teal-600' : ''}`} />
            <span>{isReseeding ? 'Ingesting...' : 'Re-seed Data'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
