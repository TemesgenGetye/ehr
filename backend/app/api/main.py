from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.fhir.mapper import FHIRR4Mapper
from backend.app.fhir.storage import FHIRSQLiteStore
from backend.app.fhir.validator import FHIRR4Validator
from backend.app.ingestion.parsers import IngestionPipeline
from backend.app.search.engine import SearchQuery, SearchResponse, SemanticSearchEngine
from backend.app.summarizer.engine import ClinicalSummarizer

# Global Singletons
fhir_store = FHIRSQLiteStore()
search_engine = SemanticSearchEngine()
summarizer = ClinicalSummarizer()


def run_seed_pipeline():
    """Seed system with raw heterogeneous EHR records, FHIR normalization, AI summaries, and vector index."""
    json_path = Path("backend/data/raw/simulated_ehr_export.json")
    csv_path = Path("backend/data/raw/scanned_notes_and_labs.csv")

    if not json_path.exists() or not csv_path.exists():
        return

    # 1. Ingestion & Cleaning
    res = IngestionPipeline.ingest_files(json_path, csv_path)

    # 2. FHIR Normalization & Storage
    patient_docs_map: Dict[str, list] = {}
    patient_rpts_map: Dict[str, list] = {}

    for doc in res.documents:
        patient_docs_map.setdefault(doc.patient_id, []).append(doc)
    for rpt in res.diagnostic_reports:
        patient_rpts_map.setdefault(rpt.patient_id, []).append(rpt)

    for patient in res.patients:
        docs = patient_docs_map.get(patient.id, [])
        rpts = patient_rpts_map.get(patient.id, [])
        bundle = FHIRR4Mapper.create_patient_bundle(patient, docs, rpts)
        validation_report = FHIRR4Validator.validate_bundle(bundle, patient.id)
        fhir_store.save_bundle(patient.id, patient.mrn, patient.full_name, bundle, validation_report)
        fhir_store.save_audit_logs(patient.id, patient.audit_log)

        # 3. Summarization & Vector Indexing
        summary = summarizer.summarize_bundle(bundle)

        # Index summary in vector store
        search_engine.index_record(
            doc_id=f"SUMM-{patient.id}",
            text_content=f"Clinical Summary for {patient.full_name}: {summary.narrative_summary} Key Diagnoses: {', '.join(summary.key_diagnoses)}. Anomalies: {', '.join(summary.flagged_anomalies)}",
            patient_id=patient.id,
            patient_mrn=patient.mrn,
            patient_name=patient.full_name,
            resource_type="ClinicalSummary",
            record_date=summary.generated_at.isoformat()[:10],
            title=f"AI Clinical Summary - {patient.full_name}",
        )

        # Index documents in vector store
        for d in docs:
            search_engine.index_record(
                doc_id=d.id,
                text_content=f"{d.title}: {d.content_text}",
                patient_id=patient.id,
                patient_mrn=patient.mrn,
                patient_name=patient.full_name,
                resource_type="DocumentReference",
                record_date=d.date.isoformat()[:10],
                title=d.title,
            )

        # Index diagnostic reports in vector store
        for r in rpts:
            search_engine.index_record(
                doc_id=r.id,
                text_content=f"{r.code_display} ({r.category}): {r.conclusion}",
                patient_id=patient.id,
                patient_mrn=patient.mrn,
                patient_name=patient.full_name,
                resource_type="DiagnosticReport",
                record_date=r.effective_date.isoformat()[:10],
                title=r.code_display,
            )


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-seed on startup if needed
    run_seed_pipeline()
    yield


app = FastAPI(
    title="NYCEDC - Onye EHR Media Intelligence Platform",
    description="AI-powered clinical ingestion, HL7 FHIR R4 normalization, summarization, and semantic search.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/search", response_model=SearchResponse)
def search_records(params: SearchQuery):
    """
    Search patient records and AI clinical summaries using natural language queries.
    Supports filtering by resource type and date range.
    """
    return search_engine.search(params)


@app.get("/patients")
def list_patients():
    """List all stored patients with FHIR bundles."""
    return fhir_store.list_bundles()


@app.get("/patients/{patient_id}")
def get_patient_dossier(patient_id: str):
    """Retrieve full FHIR Bundle, validation report, and AI clinical summary for a patient."""
    bundle_data = fhir_store.get_bundle(patient_id)
    if not bundle_data:
        raise HTTPException(status_code=404, detail="Patient record not found")

    # Reconstruct bundle object to get fresh/cached summary
    from fhir.resources.bundle import Bundle
    bundle = Bundle.model_validate(bundle_data["bundle"])
    summary = summarizer.summarize_bundle(bundle)

    return {
        "patient": {
            "id": bundle_data["patient_id"],
            "mrn": bundle_data["mrn"],
            "name": bundle_data["patient_name"],
            "resource_count": bundle_data["resource_count"],
            "is_valid": bundle_data["is_valid"],
        },
        "summary": summary,
        "bundle": bundle_data["bundle"],
        "validation_report": bundle_data["validation_report"],
    }


@app.post("/pipeline/seed")
def trigger_seed():
    """Manually re-run the ingestion, normalization, and indexing pipeline."""
    run_seed_pipeline()
    return {"status": "success", "indexed_records": len(search_engine.memory_store)}


frontend_dist = Path("frontend/dist")
frontend_dir = Path("frontend")
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
elif frontend_dir.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")

