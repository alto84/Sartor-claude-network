#!/usr/bin/env python3
"""
PharmaLens - SQLite Database Builder
Creates and populates the pharma_data.db database from raw data files.
"""

import json
import logging
import os
import sqlite3
import sys
import time
from pathlib import Path

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
CT_RAW_DIR = DATA_DIR / "clinicaltrials_raw"
DB_PATH = DATA_DIR / "pharma_data.db"
COMPANIES_FILE = SCRIPT_DIR / "companies.json"

# Schema SQL
SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    ticker TEXT NOT NULL,
    cik TEXT,
    filing_type TEXT,
    hq_country TEXT,
    fiscal_year_end TEXT
);

CREATE TABLE IF NOT EXISTS financials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    period_type TEXT NOT NULL,  -- 'annual' or 'quarterly'
    period_label TEXT NOT NULL, -- 'FY2024' or 'Q1 2024'
    fiscal_year INTEGER NOT NULL,
    fiscal_quarter INTEGER,    -- NULL for annual, 1-4 for quarterly
    start_date TEXT,
    end_date TEXT,
    currency TEXT DEFAULT 'USD',
    revenue REAL,
    cogs REAL,
    gross_profit REAL,
    rd_expense REAL,
    sga_expense REAL,
    operating_income REAL,
    net_income REAL,
    diluted_eps REAL,
    total_assets REAL,
    total_liabilities REAL,
    shareholders_equity REAL,
    cash_and_equivalents REAL,
    operating_cash_flow REAL,
    capex REAL,
    free_cash_flow REAL,
    gross_margin REAL,
    operating_margin REAL,
    net_margin REAL,
    rd_intensity REAL,
    roe REAL,
    debt_to_equity REAL,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS pipeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    drug_name TEXT NOT NULL,
    generic_name TEXT,
    therapeutic_area TEXT,
    indication TEXT,
    phase TEXT,
    nct_id TEXT,
    status TEXT,
    enrollment INTEGER,
    expected_completion TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS variances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    metric TEXT NOT NULL,
    period TEXT NOT NULL,
    actual REAL,
    comparator REAL,
    comparator_type TEXT DEFAULT 'prior_year',
    variance_pct REAL,
    variance_abs REAL,
    direction TEXT,  -- 'up' or 'down'
    ai_explanation TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS market_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    therapeutic_area TEXT NOT NULL,
    market_size_b REAL,
    growth_rate REAL,
    key_players TEXT
);

CREATE TABLE IF NOT EXISTS insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER,
    insight_type TEXT NOT NULL,
    content TEXT NOT NULL,
    label TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX IF NOT EXISTS idx_financials_company ON financials(company_id);
CREATE INDEX IF NOT EXISTS idx_financials_year ON financials(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_financials_period ON financials(period_type);
CREATE INDEX IF NOT EXISTS idx_pipeline_company ON pipeline(company_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_phase ON pipeline(phase);
CREATE INDEX IF NOT EXISTS idx_variances_company ON variances(company_id);
CREATE INDEX IF NOT EXISTS idx_insights_company ON insights(company_id);
"""

# Market data seed
MARKET_DATA_SEED = [
    ("Oncology", 220.0, 0.12, "Merck, Roche, AstraZeneca, BMS, Pfizer"),
    ("Immunology", 95.0, 0.08, "AbbVie, J&J, Amgen, Sanofi, Regeneron"),
    ("Cardiovascular", 65.0, 0.05, "Novartis, Bayer, Pfizer, Amgen, BMS"),
    ("Rare Disease", 45.0, 0.15, "Regeneron, Sanofi, Takeda, Biogen, Amgen"),
    ("Neuroscience", 55.0, 0.07, "Biogen, Eli Lilly, AbbVie, Roche, J&J"),
    ("Diabetes/Obesity", 80.0, 0.18, "Novo Nordisk, Eli Lilly, Sanofi, AstraZeneca, Merck"),
    ("Respiratory", 50.0, 0.04, "AstraZeneca, GSK, Boehringer Ingelheim, Sanofi, Regeneron"),
    ("Vaccines", 70.0, 0.06, "Pfizer, Moderna, Sanofi, GSK, Merck"),
    ("Infectious Disease", 40.0, 0.05, "Gilead, Pfizer, Merck, GSK, J&J"),
    ("Ophthalmology", 25.0, 0.09, "Regeneron, Roche, Bayer, AbbVie, Novartis"),
]


def load_companies():
    """Load company list from companies.json."""
    with open(COMPANIES_FILE, "r") as f:
        return json.load(f)


def create_database(db_path):
    """Create the SQLite database with schema."""
    db_path.parent.mkdir(parents=True, exist_ok=True)

    # Remove existing database to start fresh
    if db_path.exists():
        db_path.unlink()
        logger.info(f"Removed existing database at {db_path}")

    conn = sqlite3.connect(str(db_path))
    conn.executescript(SCHEMA_SQL)
    conn.commit()
    logger.info(f"Created database schema at {db_path}")
    return conn


def load_company_data(conn, companies):
    """Insert company records into database."""
    for company in companies:
        conn.execute(
            "INSERT INTO companies (id, name, ticker, cik, filing_type, hq_country, fiscal_year_end) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                company["id"],
                company["name"],
                company["ticker"],
                company.get("cik"),
                company["filing_type"],
                company["hq_country"],
                company["fiscal_year_end"],
            ),
        )
    conn.commit()
    logger.info(f"Loaded {len(companies)} companies into database")


def process_edgar_data(conn):
    """Process EDGAR raw data files into financials table."""
    if not EDGAR_RAW_DIR.exists():
        logger.warning(f"EDGAR raw data directory not found: {EDGAR_RAW_DIR}")
        return 0

    files = list(EDGAR_RAW_DIR.glob("*.json"))
    if not files:
        logger.warning("No EDGAR raw data files found")
        return 0

    total_records = 0
    for filepath in files:
        try:
            with open(filepath, "r") as f:
                data = json.load(f)

            company_id = data.get("company_id")
            financials = data.get("financials", {})

            if not company_id or not financials:
                continue

            # Group data by fiscal year/period
            periods = {}
            for metric_name, metric_data in financials.items():
                for entry in metric_data.get("entries", []):
                    fy = entry.get("fiscal_year")
                    fp = entry.get("fiscal_period", "FY")
                    if not fy:
                        continue

                    key = (fy, fp)
                    if key not in periods:
                        periods[key] = {
                            "fiscal_year": fy,
                            "fiscal_period": fp,
                            "currency": entry.get("currency", "USD"),
                            "start_date": entry.get("start_date"),
                            "end_date": entry.get("end_date"),
                        }
                    periods[key][metric_name] = entry.get("value")

            # Insert records
            for (fy, fp), period_data in periods.items():
                is_annual = fp in ("FY", "")
                period_type = "annual" if is_annual else "quarterly"

                # Determine quarter
                quarter = None
                if fp.startswith("Q"):
                    try:
                        quarter = int(fp[1])
                    except (ValueError, IndexError):
                        pass

                period_label = f"FY{fy}" if is_annual else f"{fp} {fy}"

                revenue = period_data.get("revenue")
                cogs = period_data.get("cogs")
                gross_profit = period_data.get("gross_profit")
                rd_expense = period_data.get("rd_expense")
                sga_expense = period_data.get("sga_expense")
                operating_income = period_data.get("operating_income")
                net_income = period_data.get("net_income")
                total_assets = period_data.get("total_assets")
                total_liabilities = period_data.get("total_liabilities")
                equity = period_data.get("shareholders_equity")
                operating_cf = period_data.get("operating_cash_flow")
                diluted_eps = period_data.get("diluted_eps")

                # Compute derived metrics
                if gross_profit is None and revenue and cogs:
                    gross_profit = revenue - cogs
                if cogs is None and revenue and gross_profit:
                    cogs = revenue - gross_profit

                gross_margin = (gross_profit / revenue) if (revenue and gross_profit) else None
                operating_margin = (operating_income / revenue) if (revenue and operating_income) else None
                net_margin = (net_income / revenue) if (revenue and net_income) else None
                rd_intensity = (rd_expense / revenue) if (revenue and rd_expense) else None
                roe = (net_income / equity) if (equity and net_income and equity != 0) else None
                debt_to_equity = (total_liabilities / equity) if (equity and total_liabilities and equity != 0) else None

                conn.execute(
                    """INSERT INTO financials (
                        company_id, period_type, period_label, fiscal_year, fiscal_quarter,
                        start_date, end_date, currency,
                        revenue, cogs, gross_profit, rd_expense, sga_expense,
                        operating_income, net_income, diluted_eps,
                        total_assets, total_liabilities, shareholders_equity,
                        cash_and_equivalents, operating_cash_flow, capex, free_cash_flow,
                        gross_margin, operating_margin, net_margin, rd_intensity, roe, debt_to_equity
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        company_id, period_type, period_label, fy, quarter,
                        period_data.get("start_date"), period_data.get("end_date"),
                        period_data.get("currency", "USD"),
                        revenue, cogs, gross_profit, rd_expense, sga_expense,
                        operating_income, net_income, diluted_eps,
                        total_assets, total_liabilities, equity,
                        None, operating_cf, None, None,
                        gross_margin, operating_margin, net_margin, rd_intensity, roe, debt_to_equity,
                    ),
                )
                total_records += 1

        except Exception as e:
            logger.error(f"Error processing {filepath}: {e}")
            continue

    conn.commit()
    logger.info(f"Processed {total_records} financial records from EDGAR data")
    return total_records


def compute_variances(conn):
    """Compute YoY variances for annual financial metrics."""
    metrics = ["revenue", "net_income", "operating_income", "rd_expense", "gross_profit"]
    metric_labels = {
        "revenue": "Revenue",
        "net_income": "Net Income",
        "operating_income": "Operating Income",
        "rd_expense": "R&D Expense",
        "gross_profit": "Gross Profit",
    }

    variance_count = 0
    cursor = conn.execute("SELECT DISTINCT company_id FROM financials WHERE period_type = 'annual'")
    company_ids = [row[0] for row in cursor.fetchall()]

    for company_id in company_ids:
        for metric in metrics:
            cursor = conn.execute(
                f"SELECT fiscal_year, {metric} FROM financials "
                f"WHERE company_id = ? AND period_type = 'annual' AND {metric} IS NOT NULL "
                f"ORDER BY fiscal_year",
                (company_id,),
            )
            rows = cursor.fetchall()

            for i in range(1, len(rows)):
                prev_year, prev_val = rows[i - 1]
                curr_year, curr_val = rows[i]

                if prev_val and prev_val != 0:
                    variance_pct = ((curr_val - prev_val) / abs(prev_val)) * 100
                    variance_abs = curr_val - prev_val
                    direction = "up" if variance_abs > 0 else "down"

                    conn.execute(
                        """INSERT INTO variances (
                            company_id, metric, period, actual, comparator,
                            comparator_type, variance_pct, variance_abs, direction, ai_explanation
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                        (
                            company_id,
                            metric_labels.get(metric, metric),
                            f"FY{curr_year} vs FY{prev_year}",
                            curr_val,
                            prev_val,
                            "prior_year",
                            round(variance_pct, 2),
                            round(variance_abs, 2),
                            direction,
                            None,
                        ),
                    )
                    variance_count += 1

    conn.commit()
    logger.info(f"Computed {variance_count} YoY variance records")
    return variance_count


def seed_market_data(conn):
    """Seed market data from hardcoded estimates."""
    for ta, size, growth, players in MARKET_DATA_SEED:
        conn.execute(
            "INSERT INTO market_data (therapeutic_area, market_size_b, growth_rate, key_players) "
            "VALUES (?, ?, ?, ?)",
            (ta, size, growth, players),
        )
    conn.commit()
    logger.info(f"Seeded {len(MARKET_DATA_SEED)} market data records")


def main():
    """Build the PharmaLens SQLite database."""
    logger.info("=" * 60)
    logger.info("PharmaLens Database Builder")
    logger.info("=" * 60)

    companies = load_companies()
    logger.info(f"Loaded {len(companies)} companies")

    conn = create_database(DB_PATH)

    try:
        load_company_data(conn, companies)
        edgar_count = process_edgar_data(conn)
        variance_count = compute_variances(conn)
        seed_market_data(conn)

        # Summary
        logger.info("=" * 60)
        logger.info("Database build complete!")
        logger.info(f"  Companies: {len(companies)}")
        logger.info(f"  Financial records: {edgar_count}")
        logger.info(f"  Variance records: {variance_count}")
        logger.info(f"  Market data records: {len(MARKET_DATA_SEED)}")
        logger.info(f"  Database: {DB_PATH}")
        logger.info("=" * 60)

    except Exception as e:
        logger.error(f"Error building database: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
