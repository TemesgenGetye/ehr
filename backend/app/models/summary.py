from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field


class ClinicalSummary(BaseModel):
    patient_id: str
    patient_mrn: str
    patient_name: str
    chief_concern: str
    key_diagnoses: List[str] = Field(default_factory=list)
    recent_media_records: List[str] = Field(
        default_factory=list,
        description="List of recent imaging and lab media records",
    )
    flagged_anomalies: List[str] = Field(
        default_factory=list,
        description="Clinically relevant anomalies, critical lab flags, or alerts",
    )
    narrative_summary: str = Field(
        description="Concise clinical summary strictly under 200 words",
    )
    word_count: int
    confidence_score: float = Field(
        default=0.92,
        ge=0.0,
        le=1.0,
        description="Confidence estimation of summary extraction accuracy",
    )
    disclaimer: str = (
        "CONFIDENTIAL MEDICAL SUMMARY: AI-generated clinical synopsis. "
        "Not a substitute for professional clinical judgment or direct patient assessment."
    )
    record_hash: str
    cache_hit: bool = False
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
