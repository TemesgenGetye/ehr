from __future__ import annotations

from typing import Any, Dict, List
from pydantic import BaseModel, Field
from fhir.resources.bundle import Bundle


class ValidationIssue(BaseModel):
    severity: str  # error, warning, information
    location: str
    message: str


class BundleValidationReport(BaseModel):
    patient_id: str
    is_valid: bool
    total_resources: int
    resource_counts: Dict[str, int] = Field(default_factory=dict)
    issues: List[ValidationIssue] = Field(default_factory=list)

    @property
    def has_errors(self) -> bool:
        return any(issue.severity == "error" for issue in self.issues)


class FHIRR4Validator:
    """Validates HL7 FHIR R4 Bundles and Resources against the FHIR specification."""

    @classmethod
    def validate_bundle(cls, bundle: Bundle, patient_id: str) -> BundleValidationReport:
        issues: List[ValidationIssue] = []
        counts: Dict[str, int] = {}

        # 1. Validate top-level Bundle structure
        if not bundle.entry or len(bundle.entry) == 0:
            issues.append(
                ValidationIssue(
                    severity="error",
                    location="Bundle.entry",
                    message="Bundle does not contain any entries.",
                )
            )

        patient_found = False

        for idx, entry in enumerate(bundle.entry or []):
            loc = f"Bundle.entry[{idx}]"
            res = entry.resource
            if not res:
                issues.append(
                    ValidationIssue(
                        severity="error",
                        location=loc,
                        message="Bundle entry contains no resource payload.",
                    )
                )
                continue

            r_type = res.get_resource_type() if hasattr(res, "get_resource_type") else getattr(res, "resourceType", "Unknown")
            counts[r_type] = counts.get(r_type, 0) + 1

            if r_type == "Patient":
                patient_found = True
                if not getattr(res, "name", None):
                    issues.append(
                        ValidationIssue(
                            severity="warning",
                            location=f"{loc}.Patient.name",
                            message="Patient has no recorded names.",
                        )
                    )
                if not getattr(res, "gender", None):
                    issues.append(
                        ValidationIssue(
                            severity="error",
                            location=f"{loc}.Patient.gender",
                            message="Patient is missing required administrative gender.",
                        )
                    )

            elif r_type == "DocumentReference":
                subject = getattr(res, "subject", None)
                if not subject or not getattr(subject, "reference", None):
                    issues.append(
                        ValidationIssue(
                            severity="error",
                            location=f"{loc}.DocumentReference.subject",
                            message="DocumentReference missing subject reference.",
                        )
                    )
                content = getattr(res, "content", None)
                if not content or len(content) == 0:
                    issues.append(
                        ValidationIssue(
                            severity="error",
                            location=f"{loc}.DocumentReference.content",
                            message="DocumentReference must contain at least one content attachment.",
                        )
                    )

            elif r_type == "DiagnosticReport":
                subject = getattr(res, "subject", None)
                if not subject or not getattr(subject, "reference", None):
                    issues.append(
                        ValidationIssue(
                            severity="error",
                            location=f"{loc}.DiagnosticReport.subject",
                            message="DiagnosticReport missing subject reference.",
                        )
                    )
                code = getattr(res, "code", None)
                if not code:
                    issues.append(
                        ValidationIssue(
                            severity="error",
                            location=f"{loc}.DiagnosticReport.code",
                            message="DiagnosticReport missing required clinical code.",
                        )
                    )

        if not patient_found:
            issues.append(
                ValidationIssue(
                    severity="error",
                    location="Bundle",
                    message="Bundle does not contain a primary Patient resource.",
                )
            )

        is_valid = not any(issue.severity == "error" for issue in issues)

        return BundleValidationReport(
            patient_id=patient_id,
            is_valid=is_valid,
            total_resources=len(bundle.entry or []),
            resource_counts=counts,
            issues=issues,
        )
