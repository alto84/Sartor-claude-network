#!/usr/bin/env python3
"""Battle test script for Predictive Safety Platform API."""
import requests
import json
import time
import concurrent.futures
from datetime import datetime

BASE = "http://localhost:5003/api/v1"
RESULTS = []

def record(test_id, category, description, method, endpoint, payload, response, passed, notes=""):
    try:
        body = response.json()
    except:
        body = response.text[:500]
    RESULTS.append({
        "id": test_id,
        "category": category,
        "description": description,
        "method": method,
        "endpoint": endpoint,
        "status_code": response.status_code,
        "passed": passed,
        "notes": notes,
        "response_snippet": str(body)[:300]
    })

def valid_predict_payload(patient_id="TEST-001"):
    return {
        "patient_id": patient_id,
        "labs": {
            "ldh": 450, "creatinine": 1.2, "platelets": 150,
            "crp": 85, "ferritin": 2500, "anc": 0.8,
            "hemoglobin": 9.5, "ast": 120, "fibrinogen": 180,
            "triglycerides": 280, "ifn_gamma": 50, "il13": 10,
            "mip1_alpha": 30, "mcp1": 200, "il6": 100, "tnf_alpha": 25
        },
        "vitals": {"temperature": 39.2, "max_temperature_day1": 39.5},
        "clinical": {
            "organomegaly": 1, "cytopenias": 2,
            "hemophagocytosis": True, "immunosuppression": False
        }
    }

test_num = [0]
def next_id():
    test_num[0] += 1
    return test_num[0]

# ===================== CATEGORY 1: Health & Basic Connectivity =====================
print("=== Category 1: Health & Basic Connectivity ===")

# Test 1: Health endpoint
tid = next_id()
r = requests.get(f"{BASE}/health")
record(tid, "Basic", "GET /health returns 200", "GET", "/health", None, r,
       r.status_code == 200)

# Test 2: Models status
tid = next_id()
r = requests.get(f"{BASE}/models/status")
record(tid, "Basic", "GET /models/status returns 200", "GET", "/models/status", None, r,
       r.status_code == 200)

# Test 3: Valid predict
tid = next_id()
payload = valid_predict_payload()
r = requests.post(f"{BASE}/predict", json=payload)
record(tid, "Basic", "Valid predict request returns 200", "POST", "/predict", payload, r,
       r.status_code == 200)

# ===================== CATEGORY 2: Missing/Null Fields =====================
print("=== Category 2: Missing/Null Fields ===")

# Test 4: Missing patient_id
tid = next_id()
p = valid_predict_payload()
del p["patient_id"]
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Missing Fields", "Predict without patient_id", "POST", "/predict", p, r,
       r.status_code in [400, 422], f"Got {r.status_code}")

# Test 5: Null patient_id
tid = next_id()
p = valid_predict_payload()
p["patient_id"] = None
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Missing Fields", "Predict with null patient_id", "POST", "/predict", p, r,
       r.status_code in [400, 422], f"Got {r.status_code}")

# Test 6: Missing labs entirely
tid = next_id()
p = valid_predict_payload()
del p["labs"]
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Missing Fields", "Predict without labs object", "POST", "/predict", p, r,
       r.status_code in [400, 422, 200], f"Got {r.status_code}")

# Test 7: Missing vitals entirely
tid = next_id()
p = valid_predict_payload()
del p["vitals"]
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Missing Fields", "Predict without vitals object", "POST", "/predict", p, r,
       r.status_code in [400, 422, 200], f"Got {r.status_code}")

# Test 8: Missing clinical entirely
tid = next_id()
p = valid_predict_payload()
del p["clinical"]
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Missing Fields", "Predict without clinical object", "POST", "/predict", p, r,
       r.status_code in [400, 422, 200], f"Got {r.status_code}")

# Test 9: Missing individual lab field (ldh)
tid = next_id()
p = valid_predict_payload()
del p["labs"]["ldh"]
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Missing Fields", "Predict without labs.ldh", "POST", "/predict", p, r,
       r.status_code in [400, 422, 200], f"Got {r.status_code}")

# Test 10: Null value for lab field
tid = next_id()
p = valid_predict_payload()
p["labs"]["ferritin"] = None
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Missing Fields", "Predict with labs.ferritin=null", "POST", "/predict", p, r,
       r.status_code in [400, 422, 200], f"Got {r.status_code}")

# Test 11: All labs null
tid = next_id()
p = valid_predict_payload()
for k in p["labs"]:
    p["labs"][k] = None
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Missing Fields", "Predict with all labs null", "POST", "/predict", p, r,
       r.status_code in [400, 422, 500, 200], f"Got {r.status_code}")

# Test 12: Empty labs object
tid = next_id()
p = valid_predict_payload()
p["labs"] = {}
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Missing Fields", "Predict with empty labs object", "POST", "/predict", p, r,
       r.status_code in [400, 422, 200], f"Got {r.status_code}")

# ===================== CATEGORY 3: Extreme Values =====================
print("=== Category 3: Extreme Values ===")

# Test 13: Extreme ferritin
tid = next_id()
p = valid_predict_payload()
p["labs"]["ferritin"] = 999999
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Extreme Values", "ferritin=999999", "POST", "/predict", p, r,
       r.status_code == 200 and "error" not in str(r.json()).lower(),
       f"Got {r.status_code}")

# Test 14: platelets=0
tid = next_id()
p = valid_predict_payload()
p["labs"]["platelets"] = 0
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Extreme Values", "platelets=0 (division risk)", "POST", "/predict", p, r,
       r.status_code in [200, 400], f"Got {r.status_code}")

# Test 15: ldh=0
tid = next_id()
p = valid_predict_payload()
p["labs"]["ldh"] = 0
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Extreme Values", "ldh=0", "POST", "/predict", p, r,
       r.status_code in [200, 400], f"Got {r.status_code}")

# Test 16: creatinine=100
tid = next_id()
p = valid_predict_payload()
p["labs"]["creatinine"] = 100
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Extreme Values", "creatinine=100", "POST", "/predict", p, r,
       r.status_code == 200, f"Got {r.status_code}")

# Test 17: temperature=45 (extreme fever)
tid = next_id()
p = valid_predict_payload()
p["vitals"]["temperature"] = 45.0
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Extreme Values", "temperature=45.0", "POST", "/predict", p, r,
       r.status_code in [200, 400], f"Got {r.status_code}")

# Test 18: Very large numbers (overflow test)
tid = next_id()
p = valid_predict_payload()
p["labs"]["ldh"] = 1e18
p["labs"]["creatinine"] = 1e18
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Extreme Values", "ldh and creatinine=1e18 (overflow)", "POST", "/predict", p, r,
       r.status_code in [200, 400, 422, 500], f"Got {r.status_code}")

# Test 19: All zero labs
tid = next_id()
p = valid_predict_payload()
for k in p["labs"]:
    p["labs"][k] = 0
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Extreme Values", "All labs=0", "POST", "/predict", p, r,
       r.status_code in [200, 400, 500], f"Got {r.status_code}")

# ===================== CATEGORY 4: Invalid Types =====================
print("=== Category 4: Invalid Types ===")

# Test 20: String where number expected
tid = next_id()
p = valid_predict_payload()
p["labs"]["ldh"] = "not_a_number"
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Invalid Types", "labs.ldh='not_a_number'", "POST", "/predict", p, r,
       r.status_code in [400, 422], f"Got {r.status_code}")

# Test 21: Array where number expected
tid = next_id()
p = valid_predict_payload()
p["labs"]["ferritin"] = [1, 2, 3]
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Invalid Types", "labs.ferritin=[1,2,3]", "POST", "/predict", p, r,
       r.status_code in [400, 422], f"Got {r.status_code}")

# Test 22: Object where number expected
tid = next_id()
p = valid_predict_payload()
p["labs"]["crp"] = {"value": 85}
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Invalid Types", "labs.crp={'value':85}", "POST", "/predict", p, r,
       r.status_code in [400, 422], f"Got {r.status_code}")

# Test 23: Boolean where number expected
tid = next_id()
p = valid_predict_payload()
p["labs"]["platelets"] = True
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Invalid Types", "labs.platelets=True (bool)", "POST", "/predict", p, r,
       r.status_code in [400, 422, 200], f"Got {r.status_code} - booleans may coerce to int")

# Test 24: Number for patient_id
tid = next_id()
p = valid_predict_payload()
p["patient_id"] = 12345
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Invalid Types", "patient_id=12345 (int)", "POST", "/predict", p, r,
       r.status_code in [200, 400, 422], f"Got {r.status_code}")

# Test 25: String for boolean
tid = next_id()
p = valid_predict_payload()
p["clinical"]["hemophagocytosis"] = "yes"
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Invalid Types", "hemophagocytosis='yes' (string)", "POST", "/predict", p, r,
       r.status_code in [400, 422, 200], f"Got {r.status_code}")

# Test 26: String for organomegaly
tid = next_id()
p = valid_predict_payload()
p["clinical"]["organomegaly"] = "severe"
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Invalid Types", "organomegaly='severe' (string)", "POST", "/predict", p, r,
       r.status_code in [400, 422], f"Got {r.status_code}")

# ===================== CATEGORY 5: Boundary Conditions =====================
print("=== Category 5: Boundary Conditions ===")

# Test 27: organomegaly at boundary (0,1,2)
for val in [0, 1, 2]:
    tid = next_id()
    p = valid_predict_payload()
    p["clinical"]["organomegaly"] = val
    r = requests.post(f"{BASE}/predict", json=p)
    record(tid, "Boundary", f"organomegaly={val} (valid range)", "POST", "/predict", p, r,
           r.status_code == 200, f"Got {r.status_code}")

# Test 30: organomegaly out of range
tid = next_id()
p = valid_predict_payload()
p["clinical"]["organomegaly"] = 5
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Boundary", "organomegaly=5 (out of 0-2 range)", "POST", "/predict", p, r,
       r.status_code in [400, 422], f"Got {r.status_code}")

# Test 31: cytopenias at boundary (0,1,2,3)
tid = next_id()
p = valid_predict_payload()
p["clinical"]["cytopenias"] = 3
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Boundary", "cytopenias=3 (max valid)", "POST", "/predict", p, r,
       r.status_code == 200, f"Got {r.status_code}")

# Test 32: cytopenias out of range
tid = next_id()
p = valid_predict_payload()
p["clinical"]["cytopenias"] = 10
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Boundary", "cytopenias=10 (out of 0-3 range)", "POST", "/predict", p, r,
       r.status_code in [400, 422], f"Got {r.status_code}")

# ===================== CATEGORY 6: Division by Zero (EASIX) =====================
print("=== Category 6: Division by Zero (EASIX) ===")

# Test 33: EASIX with platelets=0
tid = next_id()
r = requests.get(f"{BASE}/scores/easix", params={"ldh": 450, "creatinine": 1.2, "platelets": 0})
record(tid, "Division by Zero", "EASIX with platelets=0", "GET", "/scores/easix", None, r,
       r.status_code in [200, 400] and "error" not in str(r.text).lower() or r.status_code == 400,
       f"Got {r.status_code}: {r.text[:200]}")

# Test 34: EASIX with all zeros
tid = next_id()
r = requests.get(f"{BASE}/scores/easix", params={"ldh": 0, "creatinine": 0, "platelets": 0})
record(tid, "Division by Zero", "EASIX with all zeros", "GET", "/scores/easix", None, r,
       r.status_code in [200, 400], f"Got {r.status_code}: {r.text[:200]}")

# ===================== CATEGORY 7: Negative Values =====================
print("=== Category 7: Negative Values ===")

# Test 35: Negative lab value
tid = next_id()
p = valid_predict_payload()
p["labs"]["ldh"] = -100
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Negative Values", "ldh=-100", "POST", "/predict", p, r,
       r.status_code in [400, 422], f"Got {r.status_code}")

# Test 36: Negative temperature
tid = next_id()
p = valid_predict_payload()
p["vitals"]["temperature"] = -5.0
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Negative Values", "temperature=-5.0", "POST", "/predict", p, r,
       r.status_code in [400, 422], f"Got {r.status_code}")

# Test 37: Negative EASIX params
tid = next_id()
r = requests.get(f"{BASE}/scores/easix", params={"ldh": -100, "creatinine": -1, "platelets": -50})
record(tid, "Negative Values", "EASIX all negative params", "GET", "/scores/easix", None, r,
       r.status_code in [400, 422], f"Got {r.status_code}: {r.text[:200]}")

# Test 38: Negative HScore params
tid = next_id()
r = requests.get(f"{BASE}/scores/hscore", params={
    "temperature": -10, "organomegaly": -1, "cytopenias": -1,
    "ferritin": -100, "triglycerides": -50, "fibrinogen": -30,
    "ast": -20, "hemophagocytosis": 0, "immunosuppression": 0
})
record(tid, "Negative Values", "HScore all negative params", "GET", "/scores/hscore", None, r,
       r.status_code in [400, 422], f"Got {r.status_code}: {r.text[:200]}")

# ===================== CATEGORY 8: NaN/Inf Strings =====================
print("=== Category 8: NaN/Inf Strings ===")

# Test 39: NaN string in lab
tid = next_id()
p = valid_predict_payload()
p["labs"]["ldh"] = "NaN"
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "NaN/Inf", "labs.ldh='NaN'", "POST", "/predict", p, r,
       r.status_code in [400, 422], f"Got {r.status_code}")

# Test 40: Infinity string in lab
tid = next_id()
p = valid_predict_payload()
p["labs"]["ferritin"] = "Infinity"
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "NaN/Inf", "labs.ferritin='Infinity'", "POST", "/predict", p, r,
       r.status_code in [400, 422], f"Got {r.status_code}")

# Test 41: -Infinity string
tid = next_id()
p = valid_predict_payload()
p["labs"]["crp"] = "-Infinity"
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "NaN/Inf", "labs.crp='-Infinity'", "POST", "/predict", p, r,
       r.status_code in [400, 422], f"Got {r.status_code}")

# Test 42: EASIX with NaN param
tid = next_id()
r = requests.get(f"{BASE}/scores/easix", params={"ldh": "NaN", "creatinine": 1.2, "platelets": 150})
record(tid, "NaN/Inf", "EASIX ldh=NaN", "GET", "/scores/easix", None, r,
       r.status_code in [400, 422], f"Got {r.status_code}: {r.text[:200]}")

# ===================== CATEGORY 9: Unicode & Special Characters =====================
print("=== Category 9: Unicode & Special Characters ===")

# Test 43: Unicode patient_id
tid = next_id()
p = valid_predict_payload("患者-001")
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Unicode", "patient_id='患者-001' (Chinese)", "POST", "/predict", p, r,
       r.status_code in [200, 400], f"Got {r.status_code}")

# Test 44: Emoji patient_id
tid = next_id()
p = valid_predict_payload("🏥-patient-💀")
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Unicode", "patient_id with emojis", "POST", "/predict", p, r,
       r.status_code in [200, 400], f"Got {r.status_code}")

# Test 45: SQL injection in patient_id
tid = next_id()
p = valid_predict_payload("'; DROP TABLE patients;--")
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Unicode", "SQL injection in patient_id", "POST", "/predict", p, r,
       r.status_code in [200, 400], f"Got {r.status_code}")

# Test 46: Very long patient_id
tid = next_id()
p = valid_predict_payload("A" * 10000)
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Unicode", "patient_id=10000 chars", "POST", "/predict", p, r,
       r.status_code in [200, 400, 422, 413], f"Got {r.status_code}")

# Test 47: Empty string patient_id
tid = next_id()
p = valid_predict_payload("")
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Unicode", "patient_id='' (empty string)", "POST", "/predict", p, r,
       r.status_code in [400, 422], f"Got {r.status_code}")

# Test 48: Null bytes in patient_id
tid = next_id()
p = valid_predict_payload("patient\x00id")
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Unicode", "patient_id with null byte", "POST", "/predict", p, r,
       r.status_code in [200, 400], f"Got {r.status_code}")

# ===================== CATEGORY 10: Empty Request Bodies =====================
print("=== Category 10: Empty Request Bodies ===")

# Test 49: Empty body to predict
tid = next_id()
r = requests.post(f"{BASE}/predict", json={})
record(tid, "Empty Body", "POST /predict with empty JSON {}", "POST", "/predict", {}, r,
       r.status_code in [400, 422], f"Got {r.status_code}")

# Test 50: No Content-Type header
tid = next_id()
r = requests.post(f"{BASE}/predict", data="not json")
record(tid, "Empty Body", "POST /predict with plain text body", "POST", "/predict", "not json", r,
       r.status_code in [400, 415, 422], f"Got {r.status_code}")

# Test 51: Empty body to batch
tid = next_id()
r = requests.post(f"{BASE}/predict/batch", json={})
record(tid, "Empty Body", "POST /predict/batch with empty JSON {}", "POST", "/predict/batch", {}, r,
       r.status_code in [400, 422], f"Got {r.status_code}")

# Test 52: Batch with empty patients array
tid = next_id()
r = requests.post(f"{BASE}/predict/batch", json={"patients": []})
record(tid, "Empty Body", "POST /predict/batch with patients=[]", "POST", "/predict/batch", {"patients": []}, r,
       r.status_code in [200, 400, 422], f"Got {r.status_code}")

# ===================== CATEGORY 11: Large Batch Requests =====================
print("=== Category 11: Large Batch Requests ===")

# Test 53: Batch with 100 patients
tid = next_id()
patients = [valid_predict_payload(f"BATCH-{i:03d}") for i in range(100)]
payload = {"patients": patients}
start = time.time()
r = requests.post(f"{BASE}/predict/batch", json=payload, timeout=60)
elapsed = time.time() - start
record(tid, "Large Batch", f"Batch 100 patients ({elapsed:.2f}s)", "POST", "/predict/batch", "100 patients", r,
       r.status_code in [200, 413, 429], f"Got {r.status_code}, {elapsed:.2f}s")

# Test 54: Batch with 10 patients (moderate)
tid = next_id()
patients = [valid_predict_payload(f"BATCH-{i:03d}") for i in range(10)]
payload = {"patients": patients}
start = time.time()
r = requests.post(f"{BASE}/predict/batch", json=payload, timeout=30)
elapsed = time.time() - start
record(tid, "Large Batch", f"Batch 10 patients ({elapsed:.2f}s)", "POST", "/predict/batch", "10 patients", r,
       r.status_code == 200, f"Got {r.status_code}, {elapsed:.2f}s")

# ===================== CATEGORY 12: Concurrent Requests =====================
print("=== Category 12: Concurrent Requests ===")

# Test 55: 20 concurrent predict requests
tid = next_id()
def make_request(i):
    p = valid_predict_payload(f"CONCURRENT-{i:03d}")
    return requests.post(f"{BASE}/predict", json=p, timeout=30)

start = time.time()
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
    futures = [executor.submit(make_request, i) for i in range(20)]
    responses = [f.result() for f in concurrent.futures.as_completed(futures)]
elapsed = time.time() - start
statuses = [r.status_code for r in responses]
all_200 = all(s == 200 for s in statuses)
record(tid, "Concurrent", f"20 concurrent predicts ({elapsed:.2f}s)", "POST", "/predict", "20 concurrent", responses[0],
       all_200 or any(s == 429 for s in statuses),
       f"Statuses: {set(statuses)}, {elapsed:.2f}s")

# ===================== CATEGORY 13: Extra Unexpected Fields =====================
print("=== Category 13: Extra Unexpected Fields ===")

# Test 56: Extra top-level field
tid = next_id()
p = valid_predict_payload()
p["extra_field"] = "should be ignored"
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Extra Fields", "Extra top-level field", "POST", "/predict", p, r,
       r.status_code == 200, f"Got {r.status_code}")

# Test 57: Extra nested field in labs
tid = next_id()
p = valid_predict_payload()
p["labs"]["unknown_biomarker"] = 42
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Extra Fields", "Extra field in labs", "POST", "/predict", p, r,
       r.status_code == 200, f"Got {r.status_code}")

# Test 58: Deeply nested extra data
tid = next_id()
p = valid_predict_payload()
p["metadata"] = {"source": "test", "nested": {"deep": {"data": True}}}
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Extra Fields", "Deep nested extra metadata", "POST", "/predict", p, r,
       r.status_code == 200, f"Got {r.status_code}")

# ===================== CATEGORY 14: Float Precision =====================
print("=== Category 14: Float Precision ===")

# Test 59: Very small float
tid = next_id()
p = valid_predict_payload()
p["labs"]["creatinine"] = 0.0000001
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Float Precision", "creatinine=0.0000001", "POST", "/predict", p, r,
       r.status_code in [200, 400], f"Got {r.status_code}")

# Test 60: Very precise float
tid = next_id()
p = valid_predict_payload()
p["labs"]["ldh"] = 450.123456789012345
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Float Precision", "ldh=450.123456789012345", "POST", "/predict", p, r,
       r.status_code == 200, f"Got {r.status_code}")

# Test 61: Scientific notation
tid = next_id()
p = valid_predict_payload()
p["labs"]["ferritin"] = 2.5e3
r = requests.post(f"{BASE}/predict", json=p)
record(tid, "Float Precision", "ferritin=2.5e3 (sci notation)", "POST", "/predict", p, r,
       r.status_code == 200, f"Got {r.status_code}")

# ===================== CATEGORY 15: Scoring Endpoints =====================
print("=== Category 15: Scoring Endpoints ===")

# Test 62: Valid EASIX
tid = next_id()
r = requests.get(f"{BASE}/scores/easix", params={"ldh": 450, "creatinine": 1.2, "platelets": 150})
record(tid, "Scoring", "Valid EASIX request", "GET", "/scores/easix", None, r,
       r.status_code == 200, f"Got {r.status_code}")

# Test 63: EASIX missing param
tid = next_id()
r = requests.get(f"{BASE}/scores/easix", params={"ldh": 450, "creatinine": 1.2})
record(tid, "Scoring", "EASIX missing platelets param", "GET", "/scores/easix", None, r,
       r.status_code in [400, 422], f"Got {r.status_code}")

# Test 64: Valid HScore
tid = next_id()
r = requests.get(f"{BASE}/scores/hscore", params={
    "temperature": 39.2, "organomegaly": 1, "cytopenias": 2,
    "ferritin": 2500, "triglycerides": 280, "fibrinogen": 180,
    "ast": 120, "hemophagocytosis": 1, "immunosuppression": 0
})
record(tid, "Scoring", "Valid HScore request", "GET", "/scores/hscore", None, r,
       r.status_code == 200, f"Got {r.status_code}")

# Test 65: HScore missing params
tid = next_id()
r = requests.get(f"{BASE}/scores/hscore", params={"temperature": 39.2})
record(tid, "Scoring", "HScore with only temperature", "GET", "/scores/hscore", None, r,
       r.status_code in [400, 422], f"Got {r.status_code}")

# Test 66: Valid CAR-HematoTox
tid = next_id()
r = requests.get(f"{BASE}/scores/car-hematotox", params={
    "anc": 0.8, "hemoglobin": 9.5, "platelets": 150, "crp": 85, "ferritin": 2500
})
record(tid, "Scoring", "Valid CAR-HematoTox request", "GET", "/scores/car-hematotox", None, r,
       r.status_code == 200, f"Got {r.status_code}")

# Test 67: CAR-HematoTox missing params
tid = next_id()
r = requests.get(f"{BASE}/scores/car-hematotox", params={"anc": 0.8})
record(tid, "Scoring", "CAR-HematoTox with only anc", "GET", "/scores/car-hematotox", None, r,
       r.status_code in [400, 422], f"Got {r.status_code}")

# Test 68: EASIX with string params
tid = next_id()
r = requests.get(f"{BASE}/scores/easix", params={"ldh": "abc", "creatinine": "def", "platelets": "ghi"})
record(tid, "Scoring", "EASIX with string params", "GET", "/scores/easix", None, r,
       r.status_code in [400, 422], f"Got {r.status_code}: {r.text[:200]}")

# ===================== CATEGORY 16: Timeline Endpoint =====================
print("=== Category 16: Timeline Endpoint ===")

# Test 69: Timeline for valid patient
tid = next_id()
r = requests.get(f"{BASE}/patient/TEST-001/timeline")
record(tid, "Timeline", "GET timeline for TEST-001", "GET", "/patient/TEST-001/timeline", None, r,
       r.status_code in [200, 404], f"Got {r.status_code}")

# Test 70: Timeline for non-existent patient
tid = next_id()
r = requests.get(f"{BASE}/patient/NONEXISTENT-999/timeline")
record(tid, "Timeline", "Timeline for non-existent patient", "GET", "/patient/NONEXISTENT-999/timeline", None, r,
       r.status_code in [200, 404], f"Got {r.status_code}")

# Test 71: Timeline with SQL injection path
tid = next_id()
r = requests.get(f"{BASE}/patient/'; DROP TABLE patients;--/timeline")
record(tid, "Timeline", "Timeline with SQL injection in path", "GET", "/patient/SQLi/timeline", None, r,
       r.status_code in [200, 400, 404], f"Got {r.status_code}")

# Test 72: Timeline with unicode path
tid = next_id()
r = requests.get(f"{BASE}/patient/患者-001/timeline")
record(tid, "Timeline", "Timeline with unicode patient_id", "GET", "/patient/unicode/timeline", None, r,
       r.status_code in [200, 404], f"Got {r.status_code}")

# ===================== CATEGORY 17: Malformed JSON =====================
print("=== Category 17: Malformed JSON ===")

# Test 73: Malformed JSON
tid = next_id()
r = requests.post(f"{BASE}/predict", data='{invalid json', headers={"Content-Type": "application/json"})
record(tid, "Malformed", "Malformed JSON body", "POST", "/predict", "invalid json", r,
       r.status_code in [400, 422], f"Got {r.status_code}")

# Test 74: XML instead of JSON
tid = next_id()
r = requests.post(f"{BASE}/predict", data='<patient><id>1</id></patient>', headers={"Content-Type": "application/xml"})
record(tid, "Malformed", "XML body with XML content-type", "POST", "/predict", "xml body", r,
       r.status_code in [400, 415, 422], f"Got {r.status_code}")

# Test 75: Array instead of object
tid = next_id()
r = requests.post(f"{BASE}/predict", json=[valid_predict_payload()])
record(tid, "Malformed", "Array instead of object", "POST", "/predict", "array body", r,
       r.status_code in [400, 422], f"Got {r.status_code}")

# ===================== CATEGORY 18: HTTP Method Tests =====================
print("=== Category 18: HTTP Method Tests ===")

# Test 76: PUT to predict
tid = next_id()
r = requests.put(f"{BASE}/predict", json=valid_predict_payload())
record(tid, "HTTP Methods", "PUT to /predict", "PUT", "/predict", None, r,
       r.status_code == 405, f"Got {r.status_code}")

# Test 77: DELETE to health
tid = next_id()
r = requests.delete(f"{BASE}/health")
record(tid, "HTTP Methods", "DELETE to /health", "DELETE", "/health", None, r,
       r.status_code == 405, f"Got {r.status_code}")

# Test 78: GET to predict
tid = next_id()
r = requests.get(f"{BASE}/predict")
record(tid, "HTTP Methods", "GET to /predict (expects POST)", "GET", "/predict", None, r,
       r.status_code == 405, f"Got {r.status_code}")

# ===================== Generate Report =====================
print(f"\n=== COMPLETED: {len(RESULTS)} tests ===")
passed = sum(1 for r in RESULTS if r["passed"])
failed = sum(1 for r in RESULTS if not r["passed"])
print(f"PASSED: {passed}, FAILED: {failed}")

# Output JSON for report generation
import json
with open("/tmp/battle_test_results.json", "w") as f:
    json.dump(RESULTS, f, indent=2, default=str)

print("\nResults written to /tmp/battle_test_results.json")

# Print failures
if failed > 0:
    print("\n=== FAILURES ===")
    for r in RESULTS:
        if not r["passed"]:
            print(f"  [{r['id']}] {r['category']}: {r['description']} -> {r['status_code']} | {r['notes']}")
