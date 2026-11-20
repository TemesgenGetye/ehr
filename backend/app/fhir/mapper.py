from __future__ import annotations

import base64
from datetime import timezone
from typing import List, Optional
from fhir.resources.bundle import Bundle, BundleEntry
from fhir.resources.codeableconcept import CodeableConcept
from fhir.resources.coding import Coding
from fhir.resources.diagnosticreport import DiagnosticReport
from fhir.resources.documentreference import (
    DocumentReference,
    DocumentReferenceContent,
)
from fhir.resources.attachment import Attachment
from fhir.resources.humanname import HumanName
from fhir.resources.identifier import Identifier
from fhir.resources.patient import Patient
from fhir.resources.reference import Reference
from fhir.resources.contactpoint import ContactPoint

from backend.app.models.canonical import (
    CanonicalDiagnosticReport,
    CanonicalDocumentReference,
    CanonicalPatient,
)


class FHIRR4Mapper:
    """Maps Canonical intermediate clinical models to valid HL7 FHIR R4 resources."""

    @classmethod
    def to_fhir_patient(cls, canonical: CanonicalPatient) -> Patient:
        """Map CanonicalPatient to HL7 FHIR R4 Patient resource."""
        identifiers = [
            Identifier(
                use="official",
                system="http://hospital.nycedc.org/mrn",
                value=canonical.mrn,
            )
        ]

        telecom = []
        if canonical.phone:
            telecom.append(ContactPoint(system="phone", value=canonical.phone, use="mobile"))
        if canonical.email:
            telecom.append(ContactPoint(system="email", value=canonical.email, use="home"))

        names = [
            HumanName(
                use="official",
                family=canonical.last_name,
                given=[canonical.first_name],
            )
        ]

        patient_kwargs = {
            "resourceType": "Patient",
            "id": canonical.id,
            "identifier": identifiers,
            "name": names,
            "gender": canonical.gender.value,
        }
        if telecom:
            patient_kwargs["telecom"] = telecom
        if canonical.birth_date:
            patient_kwargs["birthDate"] = canonical.birth_date.isoformat()

        return Patient(**patient_kwargs)

    @classmethod
    def to_fhir_document_reference(
        cls, canonical: CanonicalDocumentReference, patient_ref: str
    ) -> DocumentReference:
        """Map CanonicalDocumentReference to HL7 FHIR R4 DocumentReference resource."""
        encoded_data = base64.b64encode(canonical.content_text.encode("utf-8")).decode("utf-8")

        attachment = Attachment(
            contentType=canonical.mime_type or "text/plain",
            data=encoded_data,
            title=canonical.title,
        )
        content = [DocumentReferenceContent(attachment=attachment)]

        # Ensure datetime is timezone-aware for FHIR instant regex
        dt = canonical.date
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)

        doc_kwargs = {
            "resourceType": "DocumentReference",
            "id": canonical.id,
            "status": "current",
            "docStatus": "final",
            "type": CodeableConcept(
                coding=[
                    Coding(
                        system="http://loinc.org",
                        code="34108-1",
                        display=canonical.title,
                    )
                ],
                text=canonical.title,
            ),
            "category": [
                CodeableConcept(text=canonical.category)
            ],
            "subject": Reference(reference=patient_ref),
            "date": dt.isoformat(),
            "content": content,
        }

        if canonical.encounter_id:
            doc_kwargs["context"] = [Reference(reference=f"Encounter/{canonical.encounter_id}")]

        return DocumentReference(**doc_kwargs)

    @classmethod
    def to_fhir_diagnostic_report(
        cls, canonical: CanonicalDiagnosticReport, patient_ref: str
    ) -> DiagnosticReport:
        """Map CanonicalDiagnosticReport to HL7 FHIR R4 DiagnosticReport resource."""
        category_coding = [
            Coding(
                system="http://terminology.hl7.org/CodeSystem/v2-0074",
                code=canonical.category,
                display=canonical.category,
            )
        ]

        # Ensure datetime is timezone-aware for FHIR dateTime regex
        eff_dt = canonical.effective_date
        if eff_dt.tzinfo is None:
            eff_dt = eff_dt.replace(tzinfo=timezone.utc)

        report_kwargs = {
            "resourceType": "DiagnosticReport",
            "id": canonical.id,
            "status": canonical.status or "final",
            "category": [CodeableConcept(coding=category_coding)],
            "code": CodeableConcept(
                coding=[
                    Coding(
                        system="http://loinc.org",
                        code=canonical.code,
                        display=canonical.code_display,
                    )
                ],
                text=canonical.code_display,
            ),
            "subject": Reference(reference=patient_ref),
            "effectiveDateTime": eff_dt.isoformat(),
            "conclusion": canonical.conclusion,
        }

        if canonical.encounter_id:
            report_kwargs["encounter"] = Reference(
                reference=f"Encounter/{canonical.encounter_id}"
            )

        return DiagnosticReport(**report_kwargs)

    @classmethod
    def create_patient_bundle(
        cls,
        patient: CanonicalPatient,
        documents: List[CanonicalDocumentReference],
        reports: List[CanonicalDiagnosticReport],
    ) -> Bundle:
        """
        Assemble a patient's complete clinical dossier into a valid FHIR R4 Bundle.
        Ensures correct subject and encounter references across all resources.
        """
        patient_ref = f"Patient/{patient.id}"
        fhir_patient = cls.to_fhir_patient(patient)

        entries: List[BundleEntry] = [
            BundleEntry(
                fullUrl=f"urn:uuid:{patient.id}",
                resource=fhir_patient,
            )
        ]

        for doc in documents:
            fhir_doc = cls.to_fhir_document_reference(doc, patient_ref=patient_ref)
            entries.append(
                BundleEntry(
                    fullUrl=f"urn:uuid:{doc.id}",
                    resource=fhir_doc,
                )
            )

        for rpt in reports:
            fhir_rpt = cls.to_fhir_diagnostic_report(rpt, patient_ref=patient_ref)
            entries.append(
                BundleEntry(
                    fullUrl=f"urn:uuid:{rpt.id}",
                    resource=fhir_rpt,
                )
            )

        bundle_kwargs = {
            "resourceType": "Bundle",
            "id": f"bundle-{patient.id}",
            "type": "collection",
            "entry": entries,
        }

        return Bundle(**bundle_kwargs)
