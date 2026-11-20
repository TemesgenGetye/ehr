from datetime import date
from backend.app.ingestion.cleaner import DataCleaningEngine
from backend.app.ingestion.parsers import IngestionPipeline, JSONIngestionParser, CSVIngestionParser
from backend.app.models.canonical import AuditAction, CanonicalGender, CanonicalPatient


def test_clean_date_formats():
    """Edge Case 1: Handle heterogeneous, inconsistent date formats and epochs."""
    audit = []
    # US format MM/DD/YYYY
    d1 = DataCleaningEngine.clean_date("05/14/1980", "dob", audit)
    assert d1 == date(1980, 5, 14)

    # European format DD/MM/YYYY with day > 12
    d2 = DataCleaningEngine.clean_date("25/12/1990", "dob", audit)
    assert d2 == date(1990, 12, 25)

    # Dot delimited YYYY.MM.DD
    d3 = DataCleaningEngine.clean_date("1992.07.21", "dob", audit)
    assert d3 == date(1992, 7, 21)

    # Unix epoch
    d4 = DataCleaningEngine.clean_date("1698240000", "dob", audit)
    assert d4 is not None

    # Missing date imputation
    d5 = DataCleaningEngine.clean_date(None, "dob", audit)
    assert d5 is None

    assert any(a.action == AuditAction.DATE_NORMALIZED for a in audit)
    assert any(a.action == AuditAction.MISSING_FIELD_IMPUTED for a in audit)


def test_clean_gender_normalization():
    """Edge Case 2: Standardize diverse gender encodings to canonical HL7 FHIR codes."""
    audit = []
    assert DataCleaningEngine.clean_gender("M", audit) == CanonicalGender.MALE
    assert DataCleaningEngine.clean_gender("male", audit) == CanonicalGender.MALE
    assert DataCleaningEngine.clean_gender("Female", audit) == CanonicalGender.FEMALE
    assert DataCleaningEngine.clean_gender("Woman", audit) == CanonicalGender.FEMALE
    assert DataCleaningEngine.clean_gender("non-binary", audit) == CanonicalGender.OTHER
    assert DataCleaningEngine.clean_gender("UNKNOWN", audit) == CanonicalGender.UNKNOWN
    assert DataCleaningEngine.clean_gender(None, audit) == CanonicalGender.UNKNOWN
    assert len(audit) > 0


def test_clean_mrn_formatting():
    """Edge Case 3: Normalize dirty MRN strings (prefixes, whitespace, casing)."""
    audit = []
    assert DataCleaningEngine.clean_mrn(" mrn-1001-a ", audit) == "MRN-1001-A"
    assert DataCleaningEngine.clean_mrn("MRN:2002-F", audit) == "MRN-2002-F"
    assert DataCleaningEngine.clean_mrn("MRN1002B", audit) == "MRN-1002B"
    assert DataCleaningEngine.clean_mrn("   ", audit) == "MRN-UNKNOWN"
    assert any(a.action == AuditAction.MRN_FORMATTED for a in audit)


def test_deduplication_and_conflicts():
    """Edge Case 4: Detect duplicates and resolve conflicting patient identifiers."""
    audit = []
    raw_json = [
        {
            "patient_id": "P-1",
            "mrn": "MRN-999",
            "full_name": "Jane Doe",
            "birth_date": "1990-01-01",
            "gender": "F",
        },
        # Exact duplicate
        {
            "patient_id": "P-1",
            "mrn": "MRN-999",
            "full_name": "Jane Doe",
            "birth_date": "1990-01-01",
            "gender": "F",
        },
        # Conflicting identifier under same MRN
        {
            "patient_id": "P-1-CONFLICT",
            "mrn": "MRN-999",
            "full_name": "Janet Doe",
            "birth_date": "1990-01-01",
            "gender": "female",
            "phone": "555-000-1111",
        },
    ]
    res = JSONIngestionParser.parse(raw_json, audit)
    # Deduplication removed the exact duplicate
    assert res.duplicates_removed == 1
    # Only 1 unique patient retained
    assert len(res.patients) == 1
    # Conflict was registered and merged phone into existing record
    assert len(res.conflicts_detected) == 1
    assert res.patients[0].phone == "555-000-1111"
    # Audit log tracks the transformation
    assert any(a.action == AuditAction.CONFLICT_RESOLVED for a in res.patients[0].audit_log)


def test_end_to_end_file_ingestion():
    """Verify multi-format ingestion of both JSON and CSV files."""
    json_file = "backend/data/raw/simulated_ehr_export.json"
    csv_file = "backend/data/raw/scanned_notes_and_labs.csv"

    res = IngestionPipeline.ingest_files(json_file, csv_file)

    assert len(res.patients) > 0
    assert len(res.documents) > 0
    assert len(res.diagnostic_reports) > 0
    assert res.duplicates_removed >= 2
    assert res.total_transformations > 0

    # Ensure all patients have valid normalized MRN and gender
    for patient in res.patients:
        assert patient.mrn.startswith("MRN-")
        assert isinstance(patient.gender, CanonicalGender)

