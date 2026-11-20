from __future__ import annotations

from datetime import date, datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CanonicalGender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    UNKNOWN = "unknown"


class AuditAction(str, Enum):
    DATE_NORMALIZED = "date_normalized"
    GENDER_STANDARDIZED = "gender_standardized"
    MRN_FORMATTED = "mrn_formatted"
    NAME_CLEANED = "name_cleaned"
    DEDUPLICATED = "deduplicated"
    CONFLICT_RESOLVED = "conflict_resolved"
    MISSING_FIELD_IMPUTED = "missing_field_imputed"
    TEXT_SANITIZED = "text_sanitized"


class AuditEntry(BaseModel):
    field: str
    original_value: Any
    cleaned_value: Any
    action: AuditAction
    reason: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CanonicalPatient(BaseModel):
    id: str
    mrn: str
    first_name: str
    last_name: str
    birth_date: Optional[date] = None
    gender: CanonicalGender = CanonicalGender.UNKNOWN
    phone: Optional[str] = None
    email: Optional[str] = None
    audit_log: List[AuditEntry] = Field(default_factory=list)

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()


class CanonicalDocumentReference(BaseModel):
    id: str
    patient_id: str
    patient_mrn: str
    title: str
    category: str
    date: datetime
    content_text: str
    mime_type: str = "text/plain"
    clinician: Optional[str] = None
    encounter_id: Optional[str] = None
    audit_log: List[AuditEntry] = Field(default_factory=list)


class CanonicalDiagnosticReport(BaseModel):
    id: str
    patient_id: str
    patient_mrn: str
    code: str
    code_display: str
    category: str  # LAB, RAD, etc.
    effective_date: datetime
    status: str = "final"
    conclusion: str
    results: Dict[str, Any] = Field(default_factory=dict)
    encounter_id: Optional[str] = None
    audit_log: List[AuditEntry] = Field(default_factory=list)


class IngestionResult(BaseModel):
    patients: List[CanonicalPatient] = Field(default_factory=list)
    documents: List[CanonicalDocumentReference] = Field(default_factory=list)
    diagnostic_reports: List[CanonicalDiagnosticReport] = Field(default_factory=list)
    total_records_processed: int = 0
    duplicates_removed: int = 0
    conflicts_detected: List[Dict[str, Any]] = Field(default_factory=list)
    total_transformations: int = 0
