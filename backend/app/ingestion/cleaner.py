from __future__ import annotations

import re
from datetime import date, datetime, timezone
from typing import Any, List, Optional, Tuple
from dateutil import parser as date_parser

from backend.app.models.canonical import (
    AuditAction,
    AuditEntry,
    CanonicalGender,
    CanonicalPatient,
)


class DataCleaningEngine:
    """
    Robust clinical data cleaning and normalization engine.
    Handles date formats, gender codes, MRN formatting, name parsing,
    deduplication, and detailed audit logging.
    """

    @staticmethod
    def clean_mrn(raw_mrn: Optional[str], audit_log: List[AuditEntry]) -> str:
        orig = raw_mrn
        if not raw_mrn or not str(raw_mrn).strip():
            cleaned = "MRN-UNKNOWN"
            audit_log.append(
                AuditEntry(
                    field="mrn",
                    original_value=orig,
                    cleaned_value=cleaned,
                    action=AuditAction.MISSING_FIELD_IMPUTED,
                    reason="Missing or empty MRN replaced with canonical placeholder",
                )
            )
            return cleaned

        cleaned = str(raw_mrn).strip().upper()
        cleaned = re.sub(r"^MRN[\s:\-_]*", "", cleaned)
        cleaned = re.sub(r"[\s_]+", "-", cleaned)
        cleaned = f"MRN-{cleaned}"

        if cleaned != orig:
            audit_log.append(
                AuditEntry(
                    field="mrn",
                    original_value=orig,
                    cleaned_value=cleaned,
                    action=AuditAction.MRN_FORMATTED,
                    reason="Normalized MRN to uppercase standard prefix MRN-<id>",
                )
            )
        return cleaned

    @staticmethod
    def clean_gender(
        raw_gender: Optional[str], audit_log: List[AuditEntry]
    ) -> CanonicalGender:
        orig = raw_gender
        if not raw_gender or not str(raw_gender).strip():
            cleaned = CanonicalGender.UNKNOWN
            audit_log.append(
                AuditEntry(
                    field="gender",
                    original_value=orig,
                    cleaned_value=cleaned.value,
                    action=AuditAction.MISSING_FIELD_IMPUTED,
                    reason="Missing gender mapped to 'unknown'",
                )
            )
            return cleaned

        val = str(raw_gender).strip().lower()
        if val in ("m", "male", "man", "boy"):
            cleaned = CanonicalGender.MALE
        elif val in ("f", "female", "woman", "girl"):
            cleaned = CanonicalGender.FEMALE
        elif val in ("other", "non-binary", "nonbinary", "nb"):
            cleaned = CanonicalGender.OTHER
        else:
            cleaned = CanonicalGender.UNKNOWN

        if orig != cleaned.value:
            audit_log.append(
                AuditEntry(
                    field="gender",
                    original_value=orig,
                    cleaned_value=cleaned.value,
                    action=AuditAction.GENDER_STANDARDIZED,
                    reason=f"Standardized gender representation '{orig}' to HL7 administrative gender '{cleaned.value}'",
                )
            )
        return cleaned

    @staticmethod
    def clean_date(
        raw_date: Any, field_name: str, audit_log: List[AuditEntry]
    ) -> Optional[date]:
        orig = raw_date
        if raw_date is None or str(raw_date).strip() == "":
            audit_log.append(
                AuditEntry(
                    field=field_name,
                    original_value=orig,
                    cleaned_value=None,
                    action=AuditAction.MISSING_FIELD_IMPUTED,
                    reason=f"Field {field_name} was missing or empty",
                )
            )
            return None

        # Check for Unix epoch
        if isinstance(raw_date, (int, float)) or (
            isinstance(raw_date, str) and raw_date.strip().isdigit() and len(raw_date.strip()) >= 9
        ):
            try:
                ts = float(raw_date)
                dt = datetime.fromtimestamp(ts, tz=timezone.utc)
                d = dt.date()
                audit_log.append(
                    AuditEntry(
                        field=field_name,
                        original_value=orig,
                        cleaned_value=d.isoformat(),
                        action=AuditAction.DATE_NORMALIZED,
                        reason=f"Converted unix epoch timestamp {orig} to ISO date",
                    )
                )
                return d
            except Exception:
                pass

        val_str = str(raw_date).strip()

        try:
            if re.match(r"^\d{1,2}/\d{1,2}/\d{4}$", val_str):
                parts = [int(p) for p in val_str.split("/")]
                dayfirst = parts[0] > 12
                parsed_dt = date_parser.parse(val_str, dayfirst=dayfirst)
            else:
                parsed_dt = date_parser.parse(val_str)

            cleaned_d = parsed_dt.date()
            if str(orig) != cleaned_d.isoformat():
                audit_log.append(
                    AuditEntry(
                        field=field_name,
                        original_value=orig,
                        cleaned_value=cleaned_d.isoformat(),
                        action=AuditAction.DATE_NORMALIZED,
                        reason=f"Parsed date format '{orig}' to standard ISO date '{cleaned_d.isoformat()}'",
                    )
                )
            return cleaned_d
        except Exception as e:
            audit_log.append(
                AuditEntry(
                    field=field_name,
                    original_value=orig,
                    cleaned_value=None,
                    action=AuditAction.MISSING_FIELD_IMPUTED,
                    reason=f"Failed to parse date string '{orig}': {str(e)}",
                )
            )
            return None

    @staticmethod
    def clean_datetime(
        raw_datetime: Any, field_name: str, audit_log: List[AuditEntry]
    ) -> datetime:
        orig = raw_datetime
        if raw_datetime is None or str(raw_datetime).strip() == "":
            now_dt = datetime.now(timezone.utc)
            audit_log.append(
                AuditEntry(
                    field=field_name,
                    original_value=orig,
                    cleaned_value=now_dt.isoformat(),
                    action=AuditAction.MISSING_FIELD_IMPUTED,
                    reason=f"Missing datetime {field_name} imputed with current UTC timestamp",
                )
            )
            return now_dt

        # Check for epoch
        if isinstance(raw_datetime, (int, float)) or (
            isinstance(raw_datetime, str)
            and raw_datetime.strip().isdigit()
            and len(raw_datetime.strip()) >= 9
        ):
            try:
                dt = datetime.fromtimestamp(float(raw_datetime), tz=timezone.utc)
                audit_log.append(
                    AuditEntry(
                        field=field_name,
                        original_value=orig,
                        cleaned_value=dt.isoformat(),
                        action=AuditAction.DATE_NORMALIZED,
                        reason=f"Converted unix epoch {orig} to UTC datetime",
                    )
                )
                return dt
            except Exception:
                pass

        val_str = str(raw_datetime).strip()
        try:
            parsed_dt = date_parser.parse(val_str)
            if parsed_dt.tzinfo is None:
                parsed_dt = parsed_dt.replace(tzinfo=timezone.utc)

            if str(orig) != parsed_dt.isoformat():
                audit_log.append(
                    AuditEntry(
                        field=field_name,
                        original_value=orig,
                        cleaned_value=parsed_dt.isoformat(),
                        action=AuditAction.DATE_NORMALIZED,
                        reason=f"Parsed datetime format '{orig}' to standard ISO datetime",
                    )
                )
            return parsed_dt
        except Exception as e:
            now_dt = datetime.now(timezone.utc)
            audit_log.append(
                AuditEntry(
                    field=field_name,
                    original_value=orig,
                    cleaned_value=now_dt.isoformat(),
                    action=AuditAction.MISSING_FIELD_IMPUTED,
                    reason=f"Failed to parse datetime '{orig}', imputed current UTC: {str(e)}",
                )
            )
            return now_dt

    @staticmethod
    def clean_name(
        raw_name: Optional[str], audit_log: List[AuditEntry]
    ) -> Tuple[str, str]:
        orig = raw_name
        if not raw_name or not str(raw_name).strip():
            audit_log.append(
                AuditEntry(
                    field="name",
                    original_value=orig,
                    cleaned_value="Unknown Patient",
                    action=AuditAction.MISSING_FIELD_IMPUTED,
                    reason="Missing name imputed to 'Unknown Patient'",
                )
            )
            return ("Unknown", "Patient")

        name = re.sub(r"\s+", " ", str(raw_name).strip())
        parts = name.split(" ")
        if len(parts) == 1:
            first, last = parts[0], "Unknown"
        else:
            first = parts[0]
            last = " ".join(parts[1:])

        if orig != f"{first} {last}".strip():
            audit_log.append(
                AuditEntry(
                    field="name",
                    original_value=orig,
                    cleaned_value=f"{first} {last}".strip(),
                    action=AuditAction.NAME_CLEANED,
                    reason="Sanitized spacing and normalized first/last name decomposition",
                )
            )
        return (first, last)

    @classmethod
    def resolve_conflicting_patient(
        cls,
        existing: CanonicalPatient,
        incoming: CanonicalPatient,
        audit_log: List[AuditEntry],
    ) -> CanonicalPatient:
        """
        Merge and resolve conflicting patient identifiers under the same MRN.
        Prioritizes existing canonical fields unless incoming has higher completeness.
        """
        conflicts = []
        if incoming.birth_date and not existing.birth_date:
            existing.birth_date = incoming.birth_date
            conflicts.append("backfilled_birth_date")
        if (
            incoming.gender != CanonicalGender.UNKNOWN
            and existing.gender == CanonicalGender.UNKNOWN
        ):
            existing.gender = incoming.gender
            conflicts.append("backfilled_gender")
        if incoming.phone and not existing.phone:
            existing.phone = incoming.phone
            conflicts.append("backfilled_phone")
        if incoming.email and not existing.email:
            existing.email = incoming.email
            conflicts.append("backfilled_email")

        audit_entry = AuditEntry(
            field="patient_record",
            original_value=f"Conflicting incoming record for MRN {existing.mrn} (Name: {incoming.full_name})",
            cleaned_value=f"Merged into canonical patient {existing.id} ({existing.full_name})",
            action=AuditAction.CONFLICT_RESOLVED,
            reason=f"Resolved conflicting identifier for MRN {existing.mrn}. Merged attributes: {', '.join(conflicts) if conflicts else 'none'}",
        )
        existing.audit_log.append(audit_entry)
        audit_log.append(audit_entry)
        return existing
