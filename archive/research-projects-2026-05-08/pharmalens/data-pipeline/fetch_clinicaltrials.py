#!/usr/bin/env python3
"""
PharmaLens - ClinicalTrials.gov Data Fetcher
Fetches active clinical trial data from ClinicalTrials.gov API v2.
"""

import json
import logging
import os
import sys
import time
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from urllib.parse import quote

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# Paths
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
DATA_DIR = PROJECT_DIR / "data"
CT_RAW_DIR = DATA_DIR / "clinicaltrials_raw"
COMPANIES_FILE = SCRIPT_DIR / "companies.json"

# ClinicalTrials.gov API v2 config
CT_BASE_URL = "https://clinicaltrials.gov/api/v2/studies"
RATE_LIMIT_DELAY = 0.5  # Be conservative with rate limiting
PAGE_SIZE = 100

# Sponsor name overrides (some companies need different search terms)
SPONSOR_OVERRIDES = {
    "Merck & Co.": "Merck Sharp & Dohme",
    "Johnson & Johnson": "Janssen",
    "GSK": "GlaxoSmithKline",
    "Eli Lilly": "Eli Lilly and Company",
    "Bristol-Myers Squibb": "Bristol-Myers Squibb",
    "Novo Nordisk": "Novo Nordisk",
}


def load_companies():
    """Load company list from companies.json."""
    with open(COMPANIES_FILE, "r") as f:
        return json.load(f)


def fetch_trials(sponsor_name, page_token=None):
    """Fetch clinical trials from ClinicalTrials.gov API v2."""
    params = {
        "query.spons": sponsor_name,
        "filter.overallStatus": "RECRUITING,ACTIVE_NOT_RECRUITING",
        "format": "json",
        "pageSize": str(PAGE_SIZE),
        "fields": "NCTId,BriefTitle,Phase,OverallStatus,Condition,InterventionName,"
                  "EnrollmentCount,CompletionDate,StartDate,LeadSponsorName",
    }

    if page_token:
        params["pageToken"] = page_token

    query_string = "&".join(f"{k}={quote(str(v))}" for k, v in params.items())
    url = f"{CT_BASE_URL}?{query_string}"

    req = Request(url)
    req.add_header("Accept", "application/json")

    try:
        with urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data
    except HTTPError as e:
        logger.error(f"HTTP {e.code} fetching trials for {sponsor_name}: {e.reason}")
        return None
    except URLError as e:
        logger.error(f"URL error fetching trials for {sponsor_name}: {e.reason}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error fetching trials for {sponsor_name}: {e}")
        return None


def extract_trial_data(study):
    """Extract relevant fields from a study record."""
    protocol = study.get("protocolSection", {})
    id_module = protocol.get("identificationModule", {})
    status_module = protocol.get("statusModule", {})
    design_module = protocol.get("designModule", {})
    conditions_module = protocol.get("conditionsModule", {})
    interventions_module = protocol.get("armsInterventionsModule", {})
    sponsor_module = protocol.get("sponsorCollaboratorsModule", {})

    # Extract intervention/drug names
    interventions = interventions_module.get("interventions", [])
    drug_names = []
    for intervention in interventions:
        if intervention.get("type") in ("DRUG", "BIOLOGICAL", "COMBINATION_PRODUCT"):
            drug_names.append(intervention.get("name", "Unknown"))

    # Extract phases
    phases = design_module.get("phases", [])
    phase_str = ", ".join(phases) if phases else "Not Applicable"

    # Extract conditions (therapeutic area proxy)
    conditions = conditions_module.get("conditions", [])

    # Extract completion date
    completion_info = status_module.get("completionDateStruct", {})
    completion_date = completion_info.get("date")

    # Enrollment
    enrollment_info = design_module.get("enrollmentInfo", {})
    enrollment = enrollment_info.get("count")

    return {
        "nct_id": id_module.get("nctId", ""),
        "title": id_module.get("briefTitle", ""),
        "phase": phase_str,
        "status": status_module.get("overallStatus", ""),
        "conditions": conditions,
        "drug_names": drug_names if drug_names else ["Not specified"],
        "enrollment": enrollment,
        "expected_completion": completion_date,
        "start_date": status_module.get("startDateStruct", {}).get("date"),
        "sponsor": sponsor_module.get("leadSponsor", {}).get("name", ""),
    }


def fetch_all_trials_for_company(company):
    """Fetch all active trials for a company, handling pagination."""
    name = company["name"]
    sponsor_name = SPONSOR_OVERRIDES.get(name, name)

    logger.info(f"Fetching trials for {name} (searching: '{sponsor_name}')...")

    all_studies = []
    page_token = None
    page_num = 0

    while True:
        page_num += 1
        logger.info(f"  Page {page_num}...")

        result = fetch_trials(sponsor_name, page_token)
        if not result:
            break

        studies = result.get("studies", [])
        if not studies:
            break

        for study in studies:
            extracted = extract_trial_data(study)
            all_studies.append(extracted)

        # Check for next page
        page_token = result.get("nextPageToken")
        if not page_token:
            break

        time.sleep(RATE_LIMIT_DELAY)

    logger.info(f"  Found {len(all_studies)} active trials for {name}")
    return all_studies


def save_trials(company, trials):
    """Save fetched trial data to JSON file."""
    CT_RAW_DIR.mkdir(parents=True, exist_ok=True)

    # Use sanitized company name for filename
    safe_name = company["name"].replace(" ", "_").replace("&", "and").replace(".", "")
    output_file = CT_RAW_DIR / f"{safe_name}.json"

    output = {
        "company_id": company["id"],
        "company_name": company["name"],
        "ticker": company["ticker"],
        "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total_trials": len(trials),
        "trials": trials,
    }

    with open(output_file, "w") as f:
        json.dump(output, f, indent=2)

    logger.info(f"  Saved to {output_file}")


def main():
    """Fetch clinical trials data for all companies."""
    logger.info("=" * 60)
    logger.info("PharmaLens ClinicalTrials.gov Data Fetcher")
    logger.info("=" * 60)

    companies = load_companies()
    logger.info(f"Loaded {len(companies)} companies from {COMPANIES_FILE}")

    CT_RAW_DIR.mkdir(parents=True, exist_ok=True)

    total_trials = 0

    for i, company in enumerate(companies):
        if i > 0:
            time.sleep(RATE_LIMIT_DELAY)

        trials = fetch_all_trials_for_company(company)
        total_trials += len(trials)
        save_trials(company, trials)

    logger.info("=" * 60)
    logger.info(f"Complete: {total_trials} total trials fetched across {len(companies)} companies")
    logger.info(f"Raw data saved to: {CT_RAW_DIR}")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
