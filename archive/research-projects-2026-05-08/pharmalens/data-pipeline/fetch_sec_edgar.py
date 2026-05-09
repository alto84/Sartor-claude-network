#!/usr/bin/env python3
"""
PharmaLens - SEC EDGAR XBRL Data Fetcher
Fetches financial data from SEC EDGAR companyfacts API for pharma companies.
"""

import json
import logging
import os
import sys
import time
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

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
EDGAR_RAW_DIR = DATA_DIR / "edgar_raw"
COMPANIES_FILE = SCRIPT_DIR / "companies.json"

# SEC EDGAR API config
EDGAR_BASE_URL = "https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json"
USER_AGENT = "PharmaLens alton@example.com"
RATE_LIMIT_DELAY = 0.1  # 10 req/sec max

# XBRL tags to extract, grouped by concept
XBRL_TAGS = {
    "revenue": [
        ("us-gaap", "RevenueFromContractWithCustomerExcludingAssessedTax"),
        ("us-gaap", "Revenues"),
        ("us-gaap", "SalesRevenueNet"),
        ("ifrs-full", "Revenue"),
    ],
    "gross_profit": [
        ("us-gaap", "GrossProfit"),
        ("ifrs-full", "GrossProfit"),
    ],
    "operating_income": [
        ("us-gaap", "OperatingIncomeLoss"),
        ("ifrs-full", "ProfitLossFromOperatingActivities"),
    ],
    "net_income": [
        ("us-gaap", "NetIncomeLoss"),
        ("ifrs-full", "ProfitLoss"),
    ],
    "rd_expense": [
        ("us-gaap", "ResearchAndDevelopmentExpense"),
        ("ifrs-full", "ResearchAndDevelopmentExpense"),
    ],
    "sga_expense": [
        ("us-gaap", "SellingGeneralAndAdministrativeExpense"),
    ],
    "cogs": [
        ("us-gaap", "CostOfGoodsAndServicesSold"),
        ("us-gaap", "CostOfGoodsSold"),
        ("us-gaap", "CostOfRevenue"),
        ("ifrs-full", "CostOfSales"),
    ],
    "total_assets": [
        ("us-gaap", "Assets"),
        ("ifrs-full", "Assets"),
    ],
    "total_liabilities": [
        ("us-gaap", "Liabilities"),
        ("ifrs-full", "Liabilities"),
    ],
    "shareholders_equity": [
        ("us-gaap", "StockholdersEquity"),
        ("us-gaap", "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"),
        ("ifrs-full", "Equity"),
    ],
    "operating_cash_flow": [
        ("us-gaap", "NetCashProvidedByOperatingActivities"),
        ("ifrs-full", "CashFlowsFromUsedInOperatingActivities"),
    ],
    "diluted_eps": [
        ("us-gaap", "EarningsPerShareDiluted"),
        ("ifrs-full", "DilutedEarningsLossPerShare"),
    ],
}

# Filing types to include
VALID_FORMS = {"10-K", "10-Q", "20-F", "10-K/A", "10-Q/A", "20-F/A"}


def load_companies():
    """Load company list from companies.json."""
    with open(COMPANIES_FILE, "r") as f:
        return json.load(f)


def fetch_company_facts(cik):
    """Fetch companyfacts JSON from SEC EDGAR for a given CIK."""
    url = EDGAR_BASE_URL.format(cik=cik)
    req = Request(url)
    req.add_header("User-Agent", USER_AGENT)
    req.add_header("Accept", "application/json")

    try:
        with urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data
    except HTTPError as e:
        logger.error(f"HTTP {e.code} fetching CIK {cik}: {e.reason}")
        return None
    except URLError as e:
        logger.error(f"URL error fetching CIK {cik}: {e.reason}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error fetching CIK {cik}: {e}")
        return None


def extract_financial_data(company_facts, filing_type):
    """Extract structured financial data from SEC EDGAR companyfacts response."""
    if not company_facts or "facts" not in company_facts:
        return {}

    facts = company_facts["facts"]
    extracted = {}

    for metric_name, tag_list in XBRL_TAGS.items():
        for namespace, tag in tag_list:
            if namespace not in facts:
                continue
            if tag not in facts[namespace]:
                continue

            tag_data = facts[namespace][tag]
            units_data = tag_data.get("units", {})

            # Try USD first, then other currencies
            for currency in ["USD", "EUR", "GBP", "CHF", "DKK", "JPY"]:
                if currency not in units_data:
                    continue

                entries = units_data[currency]
                filtered = []

                for entry in entries:
                    form = entry.get("form", "")
                    # Accept valid form types
                    if form not in VALID_FORMS:
                        continue

                    # Determine period type
                    fy = entry.get("fy")
                    fp = entry.get("fp", "")
                    start = entry.get("start")
                    end = entry.get("end")
                    val = entry.get("val")

                    if val is None or fy is None:
                        continue

                    filtered.append({
                        "value": val,
                        "fiscal_year": fy,
                        "fiscal_period": fp,
                        "form": form,
                        "start_date": start,
                        "end_date": end,
                        "currency": currency,
                        "filed": entry.get("filed"),
                        "accn": entry.get("accn"),
                    })

                if filtered:
                    extracted[metric_name] = {
                        "namespace": namespace,
                        "tag": tag,
                        "entries": filtered,
                    }
                    break  # Found data for this metric, move on

            if metric_name in extracted:
                break  # Found data for this metric from one tag variant

    return extracted


def fetch_and_save_company(company):
    """Fetch and save EDGAR data for a single company."""
    cik = company.get("cik")
    name = company["name"]
    filing_type = company["filing_type"]

    if not cik or filing_type == "PRIVATE":
        logger.info(f"Skipping {name} (private/no CIK)")
        return False

    logger.info(f"Fetching EDGAR data for {name} (CIK: {cik})...")
    raw_data = fetch_company_facts(cik)

    if not raw_data:
        logger.warning(f"No data returned for {name}")
        return False

    # Extract structured data
    financials = extract_financial_data(raw_data, filing_type)

    # Save raw response
    output = {
        "company_id": company["id"],
        "company_name": name,
        "ticker": company["ticker"],
        "cik": cik,
        "filing_type": filing_type,
        "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "entity_name": raw_data.get("entityName", ""),
        "financials": financials,
        "raw_facts_summary": {
            ns: list(tags.keys())
            for ns, tags in raw_data.get("facts", {}).items()
        },
    }

    EDGAR_RAW_DIR.mkdir(parents=True, exist_ok=True)
    output_file = EDGAR_RAW_DIR / f"{cik}.json"
    with open(output_file, "w") as f:
        json.dump(output, f, indent=2)

    metric_count = len(financials)
    entry_count = sum(len(v["entries"]) for v in financials.values())
    logger.info(f"  Saved {metric_count} metrics, {entry_count} data points -> {output_file}")
    return True


def main():
    """Fetch EDGAR data for all companies in companies.json."""
    logger.info("=" * 60)
    logger.info("PharmaLens SEC EDGAR Data Fetcher")
    logger.info("=" * 60)

    companies = load_companies()
    logger.info(f"Loaded {len(companies)} companies from {COMPANIES_FILE}")

    EDGAR_RAW_DIR.mkdir(parents=True, exist_ok=True)

    success_count = 0
    skip_count = 0
    fail_count = 0
    last_request_time = 0

    for company in companies:
        # Rate limiting
        elapsed = time.time() - last_request_time
        if elapsed < RATE_LIMIT_DELAY:
            time.sleep(RATE_LIMIT_DELAY - elapsed)

        last_request_time = time.time()

        if not company.get("cik") or company["filing_type"] == "PRIVATE":
            skip_count += 1
            logger.info(f"Skipping {company['name']} (private/no CIK)")
            continue

        result = fetch_and_save_company(company)
        if result:
            success_count += 1
        else:
            fail_count += 1

    logger.info("=" * 60)
    logger.info(f"Complete: {success_count} fetched, {skip_count} skipped, {fail_count} failed")
    logger.info(f"Raw data saved to: {EDGAR_RAW_DIR}")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
