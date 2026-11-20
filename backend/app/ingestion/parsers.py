from __future__ import annotations

import csv
import io
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from backend.app.ingestion.cleaner import DataCleaningEngine
from backend.app.models.canonical import (
    AuditAction,
    AuditEntry,
    CanonicalDiagnosticReport,
    CanonicalDocumentReference,
    CanonicalPatient,
    IngestionResult,
)


class JSONIngestionParser:
    """Parses simulated EHR JSON export records into clean canonical models."""

    @staticmethod
    def parse(
        raw_data: Union[str, bytes, List[Dict[str, Any]]],
        pipeline_audit: List[AuditEntry],
    ) -> IngestionResult:
        if isinstance(raw_data, (str, bytes)):
            records = json.loads(raw_data)
        else:
            records = raw_data

        patients: List[CanonicalPatient] = []
        documents: List[CanonicalDocumentReference] = []
        reports: List[CanonicalDiagnosticReport] = []
        seen_patients_by_mrn: Dict[str, CanonicalPatient] = {}
        seen_record_hashes: set = set()
        duplicates_removed = 0
        conflicts_detected: List[Dict[str, Any]] = []

        for item in records:
            # Deterministic hash check for duplicate patient payloads
            serialized = json.dumps(item, sort_keys=True)
            item_hash = hash(serialized)
            if item_hash in seen_record_hashes:
                duplicates_removed += 1
                pipeline_audit.append(
                    AuditEntry(
                        field="record",
                        original_value=item.get("mrn"),
                        cleaned_value=None,
                        action=AuditAction.DEDUPLICATED,
                        reason="Dropped exact duplicate JSON patient payload",
                    )
                )
                continue
            seen_record_hashes.add(item_hash)

            record_audit: List[AuditEntry] = []
            mrn = DataCleaningEngine.clean_mrn(item.get("mrn"), record_audit)
            first_name, last_name = DataCleaningEngine.clean_name(
                item.get("full_name"), record_audit
            )
            gender = DataCleaningEngine.clean_gender(item.get("gender"), record_audit)
            dob = DataCleaningEngine.clean_date(
                item.get("birth_date"), "birth_date", record_audit
            )

            phone = str(item.get("phone")).strip() if item.get("phone") else None
            email = str(item.get("email")).strip().lower() if item.get("email") else None
            patient_id = item.get("patient_id") or f"PAT-{mrn.replace('MRN-', '')}"

            new_patient = CanonicalPatient(
                id=patient_id,
                mrn=mrn,
                first_name=first_name,
                last_name=last_name,
                birth_date=dob,
                gender=gender,
                phone=phone,
                email=email,
                audit_log=record_audit,
            )

            if mrn in seen_patients_by_mrn:
                existing = seen_patients_by_mrn[mrn]
                conflicts_detected.append(
                    {
                        "mrn": mrn,
                        "existing_patient_id": existing.id,
                        "incoming_patient_id": new_patient.id,
                        "existing_name": existing.full_name,
                        "incoming_name": new_patient.full_name,
                    }
                )
                merged = DataCleaningEngine.resolve_conflicting_patient(
                    existing, new_patient, pipeline_audit
                )
                current_patient = merged
            else:
                seen_patients_by_mrn[mrn] = new_patient
                patients.append(new_patient)
                current_patient = new_patient

            # Parse embedded documents
            for doc in item.get("documents", []):
                doc_audit: List[AuditEntry] = []
                doc_date = DataCleaningEngine.clean_datetime(
                    doc.get("date"), "date", doc_audit
                )
                clean_doc = CanonicalDocumentReference(
                    id=doc.get("id") or f"DOC-{len(documents) + 1}",
                    patient_id=current_patient.id,
                    patient_mrn=current_patient.mrn,
                    title=doc.get("title") or "Clinical Document",
                    category=doc.get("category") or "clinical-note",
                    date=doc_date,
                    content_text=str(doc.get("content_text", "")).strip(),
                    clinician=doc.get("clinician"),
                    encounter_id=doc.get("encounter_id"),
                    audit_log=doc_audit,
                )
                documents.append(clean_doc)

            # Parse embedded diagnostic reports
            for rpt in item.get("diagnostic_reports", []):
                rpt_audit: List[AuditEntry] = []
                eff_date = DataCleaningEngine.clean_datetime(
                    rpt.get("effective_date"), "effective_date", rpt_audit
                )
                clean_rpt = CanonicalDiagnosticReport(
                    id=rpt.get("id") or f"RPT-{len(reports) + 1}",
                    patient_id=current_patient.id,
                    patient_mrn=current_patient.mrn,
                    code=rpt.get("code") or "UNKNOWN-CODE",
                    code_display=rpt.get("code_display") or "Diagnostic Panel",
                    category=rpt.get("category") or "LAB",
                    effective_date=eff_date,
                    status=(rpt.get("status") or "final").lower(),
                    conclusion=rpt.get("conclusion") or "No conclusion recorded.",
                    results=rpt.get("results") or {},
                    encounter_id=rpt.get("encounter_id"),
                    audit_log=rpt_audit,
                )
                reports.append(clean_rpt)

        return IngestionResult(
            patients=patients,
            documents=documents,
            diagnostic_reports=reports,
            total_records_processed=len(records),
            duplicates_removed=duplicates_removed,
            conflicts_detected=conflicts_detected,
            total_transformations=sum(len(p.audit_log) for p in patients)
            + sum(len(d.audit_log) for d in documents)
            + sum(len(r.audit_log) for r in reports)
            + len(pipeline_audit),
        )


class CSVIngestionParser:
    """Parses plain-text / CSV scanned notes and lab exports into clean canonical models."""

    @staticmethod
    def parse(
        raw_csv: Union[str, bytes],
        pipeline_audit: List[AuditEntry],
        existing_patients_by_mrn: Optional[Dict[str, CanonicalPatient]] = None,
    ) -> IngestionResult:
        if isinstance(raw_csv, bytes):
            raw_csv = raw_csv.decode("utf-8")

        reader = csv.DictReader(io.StringIO(raw_csv.strip()))
        patients_by_mrn = existing_patients_by_mrn or {}
        new_patients: List[CanonicalPatient] = []
        documents: List[CanonicalDocumentReference] = []
        reports: List[CanonicalDiagnosticReport] = []
        seen_clinical_keys: set = set()
        duplicates_removed = 0
        total_rows = 0

        for row in reader:
            total_rows += 1
            # Clinical deduplication key (MRN, title, date, content)
            clin_key = (
                str(row.get("patient_mrn", "")).strip().upper(),
                str(row.get("title", "")).strip().lower(),
                str(row.get("note_date", "")).strip(),
                str(row.get("content_text", "")).strip()[:100],
            )
            if clin_key in seen_clinical_keys:
                duplicates_removed += 1
                pipeline_audit.append(
                    AuditEntry(
                        field="row",
                        original_value=row.get("record_id"),
                        cleaned_value=None,
                        action=AuditAction.DEDUPLICATED,
                        reason="Dropped duplicate clinical record with matching MRN, date, and content",
                    )
                )
                continue
            seen_clinical_keys.add(clin_key)

            record_audit: List[AuditEntry] = []
            mrn = DataCleaningEngine.clean_mrn(row.get("patient_mrn"), record_audit)
            gender = DataCleaningEngine.clean_gender(
                row.get("patient_gender"), record_audit
            )
            dob = DataCleaningEngine.clean_date(
                row.get("patient_dob"), "patient_dob", record_audit
            )
            first_name, last_name = DataCleaningEngine.clean_name(
                row.get("patient_name"), record_audit
            )

            if mrn in patients_by_mrn:
                patient = patients_by_mrn[mrn]
            else:
                patient = CanonicalPatient(
                    id=f"PAT-{mrn.replace('MRN-', '')}",
                    mrn=mrn,
                    first_name=first_name,
                    last_name=last_name,
                    birth_date=dob,
                    gender=gender,
                    audit_log=record_audit,
                )
                patients_by_mrn[mrn] = patient
                new_patients.append(patient)

            category = (row.get("category") or "clinical-note").strip()
            note_date = DataCleaningEngine.clean_datetime(
                row.get("note_date"), "note_date", record_audit
            )
            title = (row.get("title") or "Clinical Record").strip()
            content = (row.get("content_text") or "").strip()
            encounter_id = (
                row.get("encounter_id").strip() if row.get("encounter_id") else None
            )

            # Categorize into DiagnosticReport if LAB or RAD, otherwise DocumentReference
            if category.upper() in ("LAB", "RAD", "DIAGNOSTIC"):
                clean_rpt = CanonicalDiagnosticReport(
                    id=row.get("record_id") or f"RPT-CSV-{len(reports) + 1}",
                    patient_id=patient.id,
                    patient_mrn=patient.mrn,
                    code="CLINICAL-REPORT",
                    code_display=title,
                    category=category.upper(),
                    effective_date=note_date,
                    status="final",
                    conclusion=content,
                    results={},
                    encounter_id=encounter_id,
                    audit_log=record_audit,
                )
                reports.append(clean_rpt)
            else:
                clean_doc = CanonicalDocumentReference(
                    id=row.get("record_id") or f"DOC-CSV-{len(documents) + 1}",
                    patient_id=patient.id,
                    patient_mrn=patient.mrn,
                    title=title,
                    category=category,
                    date=note_date,
                    content_text=content,
                    encounter_id=encounter_id,
                    audit_log=record_audit,
                )
                documents.append(clean_doc)

        return IngestionResult(
            patients=new_patients,
            documents=documents,
            diagnostic_reports=reports,
            total_records_processed=total_rows,
            duplicates_removed=duplicates_removed,
            conflicts_detected=[],
            total_transformations=sum(len(p.audit_log) for p in new_patients)
            + sum(len(d.audit_log) for d in documents)
            + sum(len(r.audit_log) for r in reports)
            + len(pipeline_audit),
        )


class IngestionPipeline:
    """Unified pipeline orchestrating multi-source ingestion and cleaning."""

    @classmethod
    def ingest_files(
        cls, json_path: Union[str, Path], csv_path: Union[str, Path]
    ) -> IngestionResult:
        pipeline_audit: List[AuditEntry] = []

        # 1. Ingest JSON
        with open(json_path, "r", encoding="utf-8") as f:
            json_raw = f.read()
        json_res = JSONIngestionParser.parse(json_raw, pipeline_audit)

        # 2. Build patient map for cross-file linking
        patient_map = {p.mrn: p for p in json_res.patients}

        # 3. Ingest CSV
        with open(csv_path, "r", encoding="utf-8") as f:
            csv_raw = f.read()
        csv_res = CSVIngestionParser.parse(
            csv_raw, pipeline_audit, existing_patients_by_mrn=patient_map
        )

        all_patients = json_res.patients + csv_res.patients
        all_docs = json_res.documents + csv_res.documents
        all_rpts = json_res.diagnostic_reports + csv_res.diagnostic_reports

        return IngestionResult(
            patients=all_patients,
            documents=all_docs,
            diagnostic_reports=all_rpts,
            total_records_processed=json_res.total_records_processed
            + csv_res.total_records_processed,
            duplicates_removed=json_res.duplicates_removed
            + csv_res.duplicates_removed,
            conflicts_detected=json_res.conflicts_detected
            + csv_res.conflicts_detected,
            total_transformations=json_res.total_transformations
            + csv_res.total_transformations,
        )
