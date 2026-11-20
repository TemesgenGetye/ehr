from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from fhir.resources.bundle import Bundle

from backend.app.fhir.validator import BundleValidationReport
from backend.app.models.canonical import AuditEntry


class FHIRSQLiteStore:
    """Local SQLite repository for storing, retrieving, and querying FHIR Bundles and Audit Logs."""

    def __init__(self, db_path: str = "backend/data/processed/fhir_store.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS fhir_bundles (
                    patient_id TEXT PRIMARY KEY,
                    mrn TEXT,
                    patient_name TEXT,
                    bundle_json TEXT NOT NULL,
                    resource_count INTEGER NOT NULL,
                    is_valid INTEGER NOT NULL,
                    validation_report TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    record_id TEXT,
                    field TEXT,
                    original_value TEXT,
                    cleaned_value TEXT,
                    action TEXT,
                    reason TEXT,
                    timestamp TEXT NOT NULL
                )
                """
            )
            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_bundles_mrn ON fhir_bundles(mrn);
                """
            )
            conn.commit()

    def save_bundle(
        self,
        patient_id: str,
        mrn: str,
        patient_name: str,
        bundle: Bundle,
        report: BundleValidationReport,
    ) -> None:
        """Store or update a validated FHIR Bundle."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            bundle_json = bundle.model_dump_json()
            report_json = report.model_dump_json()

            cursor.execute(
                """
                INSERT OR REPLACE INTO fhir_bundles 
                (patient_id, mrn, patient_name, bundle_json, resource_count, is_valid, validation_report, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    patient_id,
                    mrn,
                    patient_name,
                    bundle_json,
                    report.total_resources,
                    1 if report.is_valid else 0,
                    report_json,
                    datetime.now(timezone.utc).isoformat(),
                ),
            )
            conn.commit()

    def save_audit_logs(self, record_id: str, entries: List[AuditEntry]) -> None:
        """Persist data quality transformations for traceability."""
        if not entries:
            return
        with self._get_connection() as conn:
            cursor = conn.cursor()
            for entry in entries:
                cursor.execute(
                    """
                    INSERT INTO audit_logs 
                    (record_id, field, original_value, cleaned_value, action, reason, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        record_id,
                        entry.field,
                        str(entry.original_value) if entry.original_value is not None else None,
                        str(entry.cleaned_value) if entry.cleaned_value is not None else None,
                        entry.action.value if hasattr(entry.action, "value") else str(entry.action),
                        entry.reason,
                        entry.timestamp.isoformat(),
                    ),
                )
            conn.commit()

    def get_bundle(self, patient_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a stored FHIR Bundle by patient ID."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM fhir_bundles WHERE patient_id = ?", (patient_id,)
            )
            row = cursor.fetchone()
            if not row:
                return None
            return {
                "patient_id": row["patient_id"],
                "mrn": row["mrn"],
                "patient_name": row["patient_name"],
                "bundle": json.loads(row["bundle_json"]),
                "resource_count": row["resource_count"],
                "is_valid": bool(row["is_valid"]),
                "validation_report": json.loads(row["validation_report"]),
                "updated_at": row["updated_at"],
            }

    def list_bundles(self) -> List[Dict[str, Any]]:
        """List all stored FHIR bundles."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT patient_id, mrn, patient_name, resource_count, is_valid, updated_at FROM fhir_bundles ORDER BY patient_name ASC"
            )
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
