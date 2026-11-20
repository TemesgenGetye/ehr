from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from backend.app.models.summary import ClinicalSummary


class SummaryCache:
    """SQLite-backed deterministic cache for AI-generated clinical summaries."""

    def __init__(self, db_path: str = "backend/data/processed/summary_cache.db"):
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
                CREATE TABLE IF NOT EXISTS summary_cache (
                    patient_id TEXT NOT NULL,
                    record_hash TEXT NOT NULL,
                    summary_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    PRIMARY KEY (patient_id, record_hash)
                )
                """
            )
            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_cache_patient ON summary_cache(patient_id);
                """
            )
            conn.commit()

    def get(self, patient_id: str, record_hash: str) -> Optional[ClinicalSummary]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT summary_json FROM summary_cache WHERE patient_id = ? AND record_hash = ?",
                (patient_id, record_hash),
            )
            row = cursor.fetchone()
            if not row:
                return None
            data = json.loads(row["summary_json"])
            summary = ClinicalSummary.model_validate(data)
            summary.cache_hit = True
            return summary

    def set(self, summary: ClinicalSummary) -> None:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT OR REPLACE INTO summary_cache 
                (patient_id, record_hash, summary_json, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (
                    summary.patient_id,
                    summary.record_hash,
                    summary.model_dump_json(),
                    datetime.now(timezone.utc).isoformat(),
                ),
            )
            conn.commit()
