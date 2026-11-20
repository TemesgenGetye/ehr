// EHR Media Intelligence Platform - Clinician UI Driver
document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const filterType = document.getElementById('filter-type');
  const filterDateFrom = document.getElementById('filter-date-from');
  const filterDateTo = document.getElementById('filter-date-to');
  const btnReset = document.getElementById('btn-reset-filters');
  const btnSeed = document.getElementById('btn-seed');

  const resultsContainer = document.getElementById('results-container');
  const loadingState = document.getElementById('loading-state');
  const emptyState = document.getElementById('empty-state');
  const latencyIndicator = document.getElementById('latency-indicator');
  const latencyMs = document.getElementById('latency-ms');
  const resultsCountBadge = document.getElementById('results-count-badge');

  // Drawer Elements
  const drawer = document.getElementById('detail-drawer');
  const drawerBackdrop = document.getElementById('drawer-backdrop');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');
  const tabSummaryBtn = document.getElementById('tab-summary-btn');
  const tabFhirBtn = document.getElementById('tab-fhir-btn');
  const tabSummaryContent = document.getElementById('tab-summary-content');
  const tabFhirContent = document.getElementById('tab-fhir-content');

  // Drawer Data Fields
  const drawerPatientName = document.getElementById('drawer-patient-name');
  const drawerPatientMrn = document.getElementById('drawer-patient-mrn');
  const drawerPatientMeta = document.getElementById('drawer-patient-meta');
  const drawerChiefConcern = document.getElementById('drawer-chief-concern');
  const drawerDiagnosesTags = document.getElementById('drawer-diagnoses-tags');
  const drawerAnomaliesCard = document.getElementById('drawer-anomalies-card');
  const drawerAnomaliesList = document.getElementById('drawer-anomalies-list');
  const drawerNarrative = document.getElementById('drawer-narrative');
  const drawerWordCount = document.getElementById('drawer-word-count');
  const drawerMediaList = document.getElementById('drawer-media-list');
  const drawerDisclaimer = document.getElementById('drawer-disclaimer');
  const drawerFhirJson = document.getElementById('drawer-fhir-json');
  const fhirResourceCount = document.getElementById('fhir-resource-count');

  // Trigger search on form submit
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    executeSearch();
  });

  // Filter change auto-triggers search if text exists
  [filterType, filterDateFrom, filterDateTo].forEach(el => {
    el.addEventListener('change', () => {
      if (searchInput.value.trim().length > 0) {
        executeSearch();
      }
    });
  });

  // Reset filters
  btnReset.addEventListener('click', () => {
    filterType.value = '';
    filterDateFrom.value = '';
    filterDateTo.value = '';
    if (searchInput.value.trim().length > 0) {
      executeSearch();
    }
  });

  // Quick query pills
  document.querySelectorAll('.quick-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      searchInput.value = btn.dataset.query;
      executeSearch();
    });
  });

  // Re-seed Data
  btnSeed.addEventListener('click', async () => {
    btnSeed.disabled = true;
    btnSeed.textContent = 'Ingesting...';
    try {
      const res = await fetch('/pipeline/seed', { method: 'POST' });
      if (res.ok) {
        alert('EHR ingestion & FHIR normalization pipeline executed successfully!');
        executeSearch();
      }
    } catch (err) {
      console.error(err);
      alert('Pipeline execution failed.');
    } finally {
      btnSeed.disabled = false;
      btnSeed.textContent = '🔄 Re-seed Data';
    }
  });

  async function executeSearch() {
    const query = searchInput.value.trim();
    if (!query) {
      resultsContainer.innerHTML = '';
      emptyState.classList.remove('hidden');
      latencyIndicator.classList.add('hidden');
      resultsCountBadge.classList.add('hidden');
      return;
    }

    loadingState.classList.remove('hidden');
    emptyState.classList.add('hidden');
    resultsContainer.innerHTML = '';

    const payload = {
      query: query,
      resource_type: filterType.value || null,
      date_from: filterDateFrom.value || null,
      date_to: filterDateTo.value || null,
      limit: 10
    };

    try {
      const res = await fetch('/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Search failed');

      const data = await res.json();
      renderResults(data);
    } catch (err) {
      console.error(err);
      resultsContainer.innerHTML = `
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Search request failed. Please check backend connection.
        </div>
      `;
    } finally {
      loadingState.classList.add('hidden');
    }
  }

  function getBadgeClasses(resourceType) {
    switch (resourceType) {
      case 'DocumentReference':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DiagnosticReport':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ClinicalSummary':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  }

  function renderResults(data) {
    latencyIndicator.classList.remove('hidden');
    latencyMs.textContent = `${data.latency_ms}ms`;

    resultsCountBadge.classList.remove('hidden');
    resultsCountBadge.textContent = `${data.total_results} matches`;

    if (data.results.length === 0) {
      emptyState.classList.remove('hidden');
      emptyState.querySelector('h3').textContent = 'No matching patient records';
      return;
    }

    resultsContainer.innerHTML = data.results.map((item, idx) => {
      const scorePct = Math.round(item.relevance_score * 100);
      const badgeStyle = getBadgeClasses(item.resource_type);

      return `
        <div class="result-card bg-white p-5 rounded-xl border border-slate-200 hover:border-teal-500 hover:shadow-md transition-all">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="flex items-center space-x-2">
                <span class="font-bold text-slate-900 text-base">${item.patient_name}</span>
                <span class="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200">${item.patient_mrn}</span>
                <span class="px-2 py-0.5 rounded-full text-xs font-medium border ${badgeStyle}">
                  ${item.resource_type}
                </span>
              </div>
              <h4 class="text-sm font-semibold text-slate-800 mt-1">${item.title}</h4>
            </div>

            <div class="text-right shrink-0">
              <div class="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${scorePct >= 80 ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-slate-100 text-slate-700'}">
                <span>${scorePct}% Match</span>
              </div>
              <span class="block text-xs text-slate-400 mt-1">${item.record_date}</span>
            </div>
          </div>

          <p class="text-sm text-slate-600 mt-2.5 leading-relaxed bg-slate-50/70 p-3 rounded-lg border border-slate-100 font-sans">
            ${item.snippet}
          </p>

          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span class="text-xs text-slate-400 font-mono">Record ID: ${item.record_id}</span>
            <button 
              class="btn-open-dossier inline-flex items-center text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-md transition-colors"
              data-patient-id="${item.patient_id}"
            >
              Open Full Dossier & Summary →
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach click handlers to open dossier buttons
    document.querySelectorAll('.btn-open-dossier').forEach(btn => {
      btn.addEventListener('click', () => {
        openPatientDossier(btn.dataset.patientId);
      });
    });
  }

  async function openPatientDossier(patientId) {
    try {
      const res = await fetch(`/patients/${patientId}`);
      if (!res.ok) throw new Error('Could not load patient details');

      const data = await res.json();
      populateDrawer(data);
      openDrawer();
    } catch (err) {
      console.error(err);
      alert('Failed to load patient dossier.');
    }
  }

  function populateDrawer(data) {
    const p = data.patient;
    const s = data.summary;

    drawerPatientName.textContent = p.name;
    drawerPatientMrn.textContent = p.mrn;
    drawerPatientMeta.textContent = `Patient ID: ${p.id} • ${p.resource_count} Clinical Resources • Verified FHIR R4`;

    drawerChiefConcern.textContent = s.chief_concern;

    drawerDiagnosesTags.innerHTML = s.key_diagnoses.map(d => 
      `<span class="px-2.5 py-1 bg-slate-200/80 text-slate-800 text-xs font-medium rounded-full">${d}</span>`
    ).join('');

    if (s.flagged_anomalies && s.flagged_anomalies.length > 0 && !s.flagged_anomalies.includes("No critical alerts flagged")) {
      drawerAnomaliesCard.classList.remove('hidden');
      drawerAnomaliesList.innerHTML = s.flagged_anomalies.map(a => `<li>${a}</li>`).join('');
    } else {
      drawerAnomaliesCard.classList.add('hidden');
    }

    drawerNarrative.textContent = s.narrative_summary;
    drawerWordCount.textContent = `${s.word_count} words`;

    drawerMediaList.innerHTML = s.recent_media_records.map(m => 
      `<li class="flex items-center space-x-2">
        <span class="text-teal-600 font-bold">•</span>
        <span>${m}</span>
      </li>`
    ).join('');

    drawerDisclaimer.textContent = s.disclaimer;

    // FHIR Bundle tab
    fhirResourceCount.textContent = `Resources in Bundle: ${data.bundle.entry ? data.bundle.entry.length : 0}`;
    drawerFhirJson.textContent = JSON.stringify(data.bundle, null, 2);

    // Switch default to summary tab
    selectTab('summary');
  }

  function selectTab(tab) {
    if (tab === 'summary') {
      tabSummaryBtn.className = "py-3 border-b-2 border-teal-600 text-teal-700 font-semibold";
      tabFhirBtn.className = "py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700";
      tabSummaryContent.classList.remove('hidden');
      tabFhirContent.classList.add('hidden');
    } else {
      tabFhirBtn.className = "py-3 border-b-2 border-teal-600 text-teal-700 font-semibold";
      tabSummaryBtn.className = "py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700";
      tabFhirContent.classList.remove('hidden');
      tabSummaryContent.classList.add('hidden');
    }
  }

  tabSummaryBtn.addEventListener('click', () => selectTab('summary'));
  tabFhirBtn.addEventListener('click', () => selectTab('fhir'));

  function openDrawer() {
    drawer.classList.remove('hidden');
    drawer.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.add('hidden');
    drawer.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  btnCloseDrawer.addEventListener('click', closeDrawer);
  drawerBackdrop.addEventListener('click', closeDrawer);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !drawer.classList.contains('hidden')) {
      closeDrawer();
    }
  });

  // Run initial seed and search on load
  searchInput.value = "acute abdominal pain and lab results";
  executeSearch();
});

