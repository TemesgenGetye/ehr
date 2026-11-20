from datetime import date, datetime, timezone
from backend.app.models.canonical import (
    CanonicalDiagnosticReport,
    CanonicalDocumentReference,
    CanonicalGender,
    CanonicalPatient,
)
from backend.app.fhir.mapper import FHIRR4Mapper
from backend.app.summarizer.cache import SummaryCache
from backend.app.summarizer.engine import ClinicalSummarizer


def test_clinical_summarizer_and_caching(tmp_path):
    # Setup test patient
    patient = CanonicalPatient(
        id="PAT-SUMM-1",
        mrn="MRN-88776",
        first_name="Arthur",
        last_name="Pendelton",
        birth_date=date(1958, 6, 12),
        gender=CanonicalGender.MALE,
    )
    doc = CanonicalDocumentReference(
        id="DOC-SUMM-1",
        patient_id="PAT-SUMM-1",
        patient_mrn="MRN-88776",
        title="Cardiology Consult",
        category="clinical-note",
        date=datetime(2023, 12, 5, 14, 0, tzinfo=timezone.utc),
        content_text="Patient presents with substernal pressure and diaphoresis.",
        encounter_id="ENC-701",
    )
    rpt = CanonicalDiagnosticReport(
        id="RPT-SUMM-1",
        patient_id="PAT-SUMM-1",
        patient_mrn="MRN-88776",
        code="10839-9",
        code_display="Cardiac Biomarker Troponin Panel",
        category="LAB",
        effective_date=datetime(2023, 12, 5, 15, 0, tzinfo=timezone.utc),
        status="final",
        conclusion="High-sensitivity Cardiac Troponin T is elevated at 48 ng/L.",
        encounter_id="ENC-701",
    )

    bundle = FHIRR4Mapper.create_patient_bundle(patient, [doc], [rpt])

    # Isolated test cache
    db_file = tmp_path / "test_summary_cache.db"
    cache = SummaryCache(db_path=str(db_file))
    summarizer = ClinicalSummarizer(cache=cache)

    # 1. First run: cache miss
    summary_1 = summarizer.summarize_bundle(bundle)
    assert summary_1.patient_id == "PAT-SUMM-1"
    assert summary_1.patient_mrn == "MRN-88776"
    assert summary_1.cache_hit is False
    assert len(summary_1.chief_concern) > 0
    assert len(summary_1.key_diagnoses) > 0
    assert len(summary_1.recent_media_records) > 0
    assert len(summary_1.flagged_anomalies) > 0
    assert summary_1.word_count <= 200
    assert "DISCLAIMER" in summary_1.disclaimer or "clinical judgment" in summary_1.disclaimer.lower()
    assert summary_1.confidence_score > 0.0

    # 2. Second run: cache hit
    summary_2 = summarizer.summarize_bundle(bundle)
    assert summary_2.cache_hit is True
    assert summary_2.record_hash == summary_1.record_hash
    assert summary_2.narrative_summary == summary_1.narrative_summary
