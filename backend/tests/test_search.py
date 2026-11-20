import time
from backend.app.search.engine import SearchQuery, SemanticSearchEngine


def test_semantic_search_indexing_and_query():
    engine = SemanticSearchEngine(db_path="backend/data/test_vector_store")

    # Index sample records
    engine.index_record(
        doc_id="DOC-1",
        text_content="Emergency room note: Patient has severe acute chest pain and diaphoresis.",
        patient_id="PAT-1",
        patient_mrn="MRN-101",
        patient_name="John Smith",
        resource_type="DocumentReference",
        record_date="2023-10-12",
        title="Emergency Note",
    )
    engine.index_record(
        doc_id="RPT-1",
        text_content="CT Abdomen: Acute uncomplicated appendicitis with 9.2mm appendix.",
        patient_id="PAT-2",
        patient_mrn="MRN-102",
        patient_name="Maria Hernandez",
        resource_type="DiagnosticReport",
        record_date="2023-10-18",
        title="CT Abdomen",
    )
    engine.index_record(
        doc_id="SUMM-3",
        text_content="AI Clinical Summary: Patient presented with severe persistent asthma and bronchospasm.",
        patient_id="PAT-3",
        patient_mrn="MRN-103",
        patient_name="Emily Davis",
        resource_type="ClinicalSummary",
        record_date="2023-11-05",
        title="Clinical Summary",
    )

    # 1. Search for chest pain
    q1 = SearchQuery(query="substernal chest pain and sweating", limit=5)
    res1 = engine.search(q1)
    assert res1.total_results > 0
    assert res1.results[0].patient_id == "PAT-1"
    assert res1.results[0].resource_type == "DocumentReference"

    # 2. Search with resource_type filter
    q2 = SearchQuery(
        query="appendicitis",
        resource_type="DiagnosticReport",
        limit=5,
    )
    res2 = engine.search(q2)
    assert res2.total_results == 1
    assert res2.results[0].resource_type == "DiagnosticReport"
    assert res2.results[0].patient_id == "PAT-2"

    # 3. Search with date range filter
    q3 = SearchQuery(
        query="patient record",
        date_from="2023-11-01",
        date_to="2023-11-30",
        limit=5,
    )
    res3 = engine.search(q3)
    assert all("2023-11-01" <= r.record_date <= "2023-11-30" for r in res3.results)


def test_search_latency_benchmark_under_2_seconds():
    """Requirement: Return results in under 2 seconds for 50 records."""
    engine = SemanticSearchEngine(db_path="backend/data/test_benchmark_store")

    # Ingest 55 simulated records
    for i in range(55):
        engine.index_record(
            doc_id=f"BENCH-{i}",
            text_content=f"Clinical record {i}: Patient with condition code {i % 5} evaluated for respiratory status.",
            patient_id=f"PAT-BENCH-{i}",
            patient_mrn=f"MRN-BENCH-{i}",
            patient_name=f"Patient {i}",
            resource_type="DocumentReference" if i % 2 == 0 else "DiagnosticReport",
            record_date="2023-10-15",
            title=f"Clinical Evaluation {i}",
        )

    # Measure latency of search across the 55 records
    start = time.perf_counter()
    query = SearchQuery(query="respiratory condition and clinical evaluation", limit=5)
    response = engine.search(query)
    duration = time.perf_counter() - start

    assert duration < 2.0, f"Search took {duration:.3f}s, exceeding 2.0s limit"
    assert response.latency_ms < 2000.0
    assert len(response.results) == 5
