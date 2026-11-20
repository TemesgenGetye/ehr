from fastapi.testclient import TestClient
from backend.app.api.main import app, run_seed_pipeline

client = TestClient(app)


def test_api_pipeline_and_search():
    # Ensure database is seeded
    run_seed_pipeline()

    # 1. Test GET /patients
    resp_patients = client.get("/patients")
    assert resp_patients.status_code == 200
    patients = resp_patients.json()
    assert len(patients) > 0

    first_patient_id = patients[0]["patient_id"]

    # 2. Test GET /patients/{id}
    resp_detail = client.get(f"/patients/{first_patient_id}")
    assert resp_detail.status_code == 200
    detail = resp_detail.json()
    assert "patient" in detail
    assert "summary" in detail
    assert "bundle" in detail
    assert detail["summary"]["word_count"] <= 200
    assert len(detail["summary"]["chief_concern"]) > 0

    # 3. Test POST /search
    search_payload = {
        "query": "acute appendicitis and abdominal pain",
        "limit": 5
    }
    resp_search = client.post("/search", json=search_payload)
    assert resp_search.status_code == 200
    search_res = resp_search.json()
    assert search_res["total_results"] > 0
    assert search_res["latency_ms"] < 2000.0
    assert len(search_res["results"]) > 0
    assert "relevance_score" in search_res["results"][0]

    # 4. Test Frontend HTML serving
    resp_ui = client.get("/")
    assert resp_ui.status_code == 200
    assert "Onye | EHR Media Intelligence Platform" in resp_ui.text
