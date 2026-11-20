from datetime import date, datetime, timezone
from backend.app.models.canonical import (
    CanonicalDiagnosticReport,
    CanonicalDocumentReference,
    CanonicalGender,
    CanonicalPatient,
)
from backend.app.fhir.mapper import FHIRR4Mapper
from backend.app.fhir.validator import FHIRR4Validator
from backend.app.fhir.storage import FHIRSQLiteStore


def test_fhir_patient_mapping():
    patient = CanonicalPatient(
        id="PAT-001",
        mrn="MRN-12345",
        first_name="Jane",
        last_name="Doe",
        birth_date=date(1985, 3, 15),
        gender=CanonicalGender.FEMALE,
        phone="555-123-4567",
        email="jane.doe@example.com",
    )
    fhir_patient = FHIRR4Mapper.to_fhir_patient(patient)

    assert fhir_patient.get_resource_type() == "Patient"
    assert fhir_patient.id == "PAT-001"
    assert fhir_patient.gender == "female"
    assert str(fhir_patient.birthDate) == "1985-03-15"
    assert fhir_patient.name[0].family == "Doe"
    assert fhir_patient.name[0].given == ["Jane"]
    assert fhir_patient.identifier[0].value == "MRN-12345"


def test_fhir_document_reference_mapping():
    doc = CanonicalDocumentReference(
        id="DOC-001",
        patient_id="PAT-001",
        patient_mrn="MRN-12345",
        title="Emergency Discharge Summary",
        category="discharge-summary",
        date=datetime(2023, 10, 15, 14, 0, tzinfo=timezone.utc),
        content_text="Patient admitted for chest pain, cleared after normal angiogram.",
        encounter_id="ENC-500",
    )
    fhir_doc = FHIRR4Mapper.to_fhir_document_reference(doc, "Patient/PAT-001")

    assert fhir_doc.get_resource_type() == "DocumentReference"
    assert fhir_doc.status == "current"
    assert fhir_doc.subject.reference == "Patient/PAT-001"
    assert fhir_doc.content[0].attachment.contentType == "text/plain"
    assert fhir_doc.context[0].reference == "Encounter/ENC-500"


def test_fhir_diagnostic_report_mapping():
    rpt = CanonicalDiagnosticReport(
        id="RPT-001",
        patient_id="PAT-001",
        patient_mrn="MRN-12345",
        code="24606-6",
        code_display="Chest X-Ray Single View",
        category="RAD",
        effective_date=datetime(2023, 10, 15, 15, 30, tzinfo=timezone.utc),
        status="final",
        conclusion="Lungs are clear, cardiac silhouette is normal.",
        encounter_id="ENC-500",
    )
    fhir_rpt = FHIRR4Mapper.to_fhir_diagnostic_report(rpt, "Patient/PAT-001")

    assert fhir_rpt.get_resource_type() == "DiagnosticReport"
    assert fhir_rpt.status == "final"
    assert fhir_rpt.code.coding[0].code == "24606-6"
    assert fhir_rpt.subject.reference == "Patient/PAT-001"
    assert fhir_rpt.encounter.reference == "Encounter/ENC-500"


def test_patient_bundle_creation_and_validation(tmp_path):
    patient = CanonicalPatient(
        id="PAT-002",
        mrn="MRN-99887",
        first_name="John",
        last_name="Smith",
        birth_date=date(1972, 8, 20),
        gender=CanonicalGender.MALE,
    )
    doc = CanonicalDocumentReference(
        id="DOC-002",
        patient_id="PAT-002",
        patient_mrn="MRN-99887",
        title="Progress Note",
        category="clinical-note",
        date=datetime(2023, 11, 1, 10, 0, tzinfo=timezone.utc),
        content_text="Routine outpatient check-up.",
    )
    rpt = CanonicalDiagnosticReport(
        id="RPT-002",
        patient_id="PAT-002",
        patient_mrn="MRN-99887",
        code="24357-6",
        code_display="Urinalysis panel",
        category="LAB",
        effective_date=datetime(2023, 11, 1, 11, 0, tzinfo=timezone.utc),
        conclusion="Normal results.",
    )

    bundle = FHIRR4Mapper.create_patient_bundle(patient, [doc], [rpt])
    assert bundle.get_resource_type() == "Bundle"
    assert bundle.type == "collection"
    assert len(bundle.entry) == 3

    # Validate bundle
    report = FHIRR4Validator.validate_bundle(bundle, patient.id)
    assert report.is_valid is True
    assert report.total_resources == 3
    assert report.resource_counts["Patient"] == 1
    assert report.resource_counts["DocumentReference"] == 1
    assert report.resource_counts["DiagnosticReport"] == 1
    assert not report.has_errors

    # Test SQLite persistence
    db_file = tmp_path / "test_fhir.db"
    store = FHIRSQLiteStore(db_path=str(db_file))
    store.save_bundle(patient.id, patient.mrn, patient.full_name, bundle, report)

    retrieved = store.get_bundle(patient.id)
    assert retrieved is not None
    assert retrieved["patient_id"] == patient.id
    assert retrieved["mrn"] == patient.mrn
    assert retrieved["resource_count"] == 3
    assert retrieved["is_valid"] is True
