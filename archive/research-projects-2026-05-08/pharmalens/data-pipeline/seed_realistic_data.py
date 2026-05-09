#!/usr/bin/env python3
"""
PharmaLens - Realistic Data Seeder
Generates realistic financial, pipeline, and market data for 20 pharma companies.

This is the primary data source for the PharmaLens dashboard, designed to work
without any external API dependencies. All figures are based on publicly known
approximate financials for each company.
"""

import json
import logging
import os
import random
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
DB_PATH = DATA_DIR / "pharma_data.db"
COMPANIES_FILE = SCRIPT_DIR / "companies.json"

# Reproducible randomness
random.seed(42)

# =============================================================================
# COMPANY FINANCIAL PROFILES
# =============================================================================
# Each company has anchor FY2024 revenue (in millions USD) and characteristics
# that drive realistic financial generation.
#
# Fields:
#   fy2024_revenue: anchor revenue in millions
#   growth_rates: [fy22_growth, fy23_growth, fy24_growth] - revenue growth YoY
#   gross_margin: typical gross margin range [low, high]
#   operating_margin: typical operating margin range [low, high]
#   net_margin: typical net margin range [low, high]
#   rd_intensity: R&D as % of revenue [low, high]
#   sga_pct: SG&A as % of revenue [low, high]
#   assets_to_revenue: total assets / revenue ratio
#   liabilities_pct: liabilities as % of total assets
#   ocf_margin: operating cash flow as % of revenue
#   capex_pct: capex as % of revenue
#   eps_2024: approximate diluted EPS for FY2024
#   currency: reporting currency
#   shares_out: approx diluted shares outstanding (millions)
#   therapeutic_focus: list of (TA, weight) tuples for pipeline generation
#   pipeline_size: approximate number of active trials
#   notes: narrative context for variance explanations

COMPANY_PROFILES = {
    1: {  # Merck
        "fy2024_revenue": 64170,
        "growth_rates": [0.22, 0.01, 0.07],
        "gross_margin": [0.73, 0.76],
        "operating_margin": [0.28, 0.32],
        "net_margin": [0.20, 0.24],
        "rd_intensity": [0.17, 0.20],
        "sga_pct": [0.22, 0.26],
        "assets_to_revenue": 1.6,
        "liabilities_pct": 0.68,
        "ocf_margin": [0.30, 0.35],
        "capex_pct": [0.04, 0.06],
        "eps_2024": 7.65,
        "currency": "USD",
        "shares_out": 2540,
        "therapeutic_focus": [
            ("Oncology", 0.40), ("Vaccines", 0.25), ("Infectious Disease", 0.10),
            ("Cardiovascular", 0.10), ("Immunology", 0.10), ("Neuroscience", 0.05),
        ],
        "pipeline_size": 65,
        "notes": "Keytruda franchise driving growth; approaching LOE in 2028",
    },
    2: {  # Pfizer
        "fy2024_revenue": 61400,
        "growth_rates": [0.23, -0.42, 0.07],
        "gross_margin": [0.65, 0.70],
        "operating_margin": [0.12, 0.18],
        "net_margin": [0.08, 0.14],
        "rd_intensity": [0.18, 0.22],
        "sga_pct": [0.26, 0.30],
        "assets_to_revenue": 3.0,
        "liabilities_pct": 0.62,
        "ocf_margin": [0.18, 0.24],
        "capex_pct": [0.04, 0.06],
        "eps_2024": 2.39,
        "currency": "USD",
        "shares_out": 5650,
        "therapeutic_focus": [
            ("Oncology", 0.25), ("Vaccines", 0.20), ("Immunology", 0.15),
            ("Cardiovascular", 0.10), ("Infectious Disease", 0.10),
            ("Rare Disease", 0.10), ("Neuroscience", 0.10),
        ],
        "pipeline_size": 75,
        "notes": "Post-COVID normalization; Seagen acquisition bolstering oncology pipeline",
    },
    3: {  # J&J
        "fy2024_revenue": 89800,
        "growth_rates": [0.01, -0.12, 0.05],
        "gross_margin": [0.68, 0.72],
        "operating_margin": [0.22, 0.27],
        "net_margin": [0.15, 0.20],
        "rd_intensity": [0.15, 0.18],
        "sga_pct": [0.25, 0.29],
        "assets_to_revenue": 1.9,
        "liabilities_pct": 0.60,
        "ocf_margin": [0.25, 0.30],
        "capex_pct": [0.04, 0.06],
        "eps_2024": 9.80,
        "currency": "USD",
        "shares_out": 2420,
        "therapeutic_focus": [
            ("Oncology", 0.30), ("Immunology", 0.25), ("Neuroscience", 0.15),
            ("Cardiovascular", 0.10), ("Infectious Disease", 0.10),
            ("Ophthalmology", 0.05), ("Respiratory", 0.05),
        ],
        "pipeline_size": 70,
        "notes": "Post-Kenvue spin-off; pure pharma/MedTech company; Stelara LOE impact",
    },
    4: {  # AbbVie
        "fy2024_revenue": 56340,
        "growth_rates": [0.03, -0.06, 0.04],
        "gross_margin": [0.69, 0.73],
        "operating_margin": [0.25, 0.30],
        "net_margin": [0.14, 0.19],
        "rd_intensity": [0.14, 0.17],
        "sga_pct": [0.22, 0.26],
        "assets_to_revenue": 2.0,
        "liabilities_pct": 0.72,
        "ocf_margin": [0.32, 0.38],
        "capex_pct": [0.03, 0.05],
        "eps_2024": 5.70,
        "currency": "USD",
        "shares_out": 1770,
        "therapeutic_focus": [
            ("Immunology", 0.40), ("Oncology", 0.20), ("Neuroscience", 0.15),
            ("Ophthalmology", 0.10), ("Rare Disease", 0.10), ("Cardiovascular", 0.05),
        ],
        "pipeline_size": 50,
        "notes": "Humira biosimilar erosion; Skyrizi and Rinvoq ramp offsetting losses",
    },
    5: {  # AstraZeneca
        "fy2024_revenue": 54100,
        "growth_rates": [0.19, 0.06, 0.18],
        "gross_margin": [0.75, 0.80],
        "operating_margin": [0.22, 0.28],
        "net_margin": [0.14, 0.18],
        "rd_intensity": [0.22, 0.26],
        "sga_pct": [0.24, 0.28],
        "assets_to_revenue": 2.2,
        "liabilities_pct": 0.58,
        "ocf_margin": [0.25, 0.30],
        "capex_pct": [0.05, 0.07],
        "eps_2024": 3.73,
        "currency": "USD",
        "shares_out": 3120,
        "therapeutic_focus": [
            ("Oncology", 0.45), ("Respiratory", 0.15), ("Cardiovascular", 0.15),
            ("Rare Disease", 0.10), ("Immunology", 0.10), ("Vaccines", 0.05),
        ],
        "pipeline_size": 80,
        "notes": "Strong oncology growth (Tagrisso, Enhertu, Imfinzi); industry-leading pipeline",
    },
    6: {  # Roche
        "fy2024_revenue": 60300,
        "growth_rates": [-0.01, -0.07, 0.05],
        "gross_margin": [0.70, 0.74],
        "operating_margin": [0.27, 0.32],
        "net_margin": [0.18, 0.23],
        "rd_intensity": [0.20, 0.24],
        "sga_pct": [0.20, 0.24],
        "assets_to_revenue": 1.5,
        "liabilities_pct": 0.55,
        "ocf_margin": [0.30, 0.36],
        "capex_pct": [0.06, 0.08],
        "eps_2024": 15.20,
        "currency": "CHF",
        "shares_out": 860,
        "therapeutic_focus": [
            ("Oncology", 0.40), ("Immunology", 0.15), ("Neuroscience", 0.15),
            ("Ophthalmology", 0.15), ("Infectious Disease", 0.10), ("Rare Disease", 0.05),
        ],
        "pipeline_size": 75,
        "notes": "Diagnostics division provides stability; Tecentriq and Vabysmo growth drivers",
    },
    7: {  # Eli Lilly
        "fy2024_revenue": 45040,
        "growth_rates": [0.01, 0.20, 0.32],
        "gross_margin": [0.78, 0.82],
        "operating_margin": [0.25, 0.32],
        "net_margin": [0.17, 0.22],
        "rd_intensity": [0.20, 0.25],
        "sga_pct": [0.22, 0.26],
        "assets_to_revenue": 2.4,
        "liabilities_pct": 0.70,
        "ocf_margin": [0.25, 0.32],
        "capex_pct": [0.08, 0.12],
        "eps_2024": 8.50,
        "currency": "USD",
        "shares_out": 950,
        "therapeutic_focus": [
            ("Diabetes/Obesity", 0.45), ("Oncology", 0.20), ("Neuroscience", 0.15),
            ("Immunology", 0.10), ("Rare Disease", 0.05), ("Cardiovascular", 0.05),
        ],
        "pipeline_size": 55,
        "notes": "Massive GLP-1 growth (Mounjaro/Zepbound); capacity expansion underway",
    },
    8: {  # Novartis
        "fy2024_revenue": 50340,
        "growth_rates": [-0.04, 0.09, 0.12],
        "gross_margin": [0.73, 0.77],
        "operating_margin": [0.30, 0.35],
        "net_margin": [0.22, 0.27],
        "rd_intensity": [0.17, 0.20],
        "sga_pct": [0.22, 0.26],
        "assets_to_revenue": 2.0,
        "liabilities_pct": 0.48,
        "ocf_margin": [0.32, 0.38],
        "capex_pct": [0.04, 0.06],
        "eps_2024": 7.20,
        "currency": "USD",
        "shares_out": 2080,
        "therapeutic_focus": [
            ("Cardiovascular", 0.25), ("Immunology", 0.20), ("Oncology", 0.20),
            ("Neuroscience", 0.15), ("Ophthalmology", 0.10), ("Rare Disease", 0.10),
        ],
        "pipeline_size": 60,
        "notes": "Post-Sandoz spin-off; pure innovative medicines focus; Entresto growth",
    },
    9: {  # Sanofi
        "fy2024_revenue": 46080,
        "growth_rates": [0.05, 0.04, 0.07],
        "gross_margin": [0.70, 0.74],
        "operating_margin": [0.22, 0.27],
        "net_margin": [0.13, 0.18],
        "rd_intensity": [0.16, 0.19],
        "sga_pct": [0.24, 0.28],
        "assets_to_revenue": 2.3,
        "liabilities_pct": 0.48,
        "ocf_margin": [0.25, 0.30],
        "capex_pct": [0.04, 0.06],
        "eps_2024": 6.90,
        "currency": "EUR",
        "shares_out": 1250,
        "therapeutic_focus": [
            ("Immunology", 0.30), ("Vaccines", 0.20), ("Rare Disease", 0.20),
            ("Oncology", 0.15), ("Neuroscience", 0.10), ("Diabetes/Obesity", 0.05),
        ],
        "pipeline_size": 55,
        "notes": "Dupixent franchise driving growth; diversified across immunology and vaccines",
    },
    10: {  # Novo Nordisk
        "fy2024_revenue": 42770,
        "growth_rates": [0.26, 0.31, 0.25],
        "gross_margin": [0.83, 0.87],
        "operating_margin": [0.40, 0.45],
        "net_margin": [0.32, 0.37],
        "rd_intensity": [0.12, 0.15],
        "sga_pct": [0.18, 0.22],
        "assets_to_revenue": 1.4,
        "liabilities_pct": 0.55,
        "ocf_margin": [0.38, 0.44],
        "capex_pct": [0.12, 0.16],
        "eps_2024": 3.95,
        "currency": "DKK",
        "shares_out": 4480,
        "therapeutic_focus": [
            ("Diabetes/Obesity", 0.70), ("Rare Disease", 0.15),
            ("Cardiovascular", 0.10), ("Oncology", 0.05),
        ],
        "pipeline_size": 35,
        "notes": "GLP-1 market leader (Ozempic/Wegovy); unprecedented demand driving capacity investment",
    },
    11: {  # BMS
        "fy2024_revenue": 47380,
        "growth_rates": [0.03, -0.02, 0.08],
        "gross_margin": [0.75, 0.79],
        "operating_margin": [0.18, 0.24],
        "net_margin": [0.10, 0.16],
        "rd_intensity": [0.20, 0.24],
        "sga_pct": [0.24, 0.28],
        "assets_to_revenue": 2.0,
        "liabilities_pct": 0.72,
        "ocf_margin": [0.28, 0.34],
        "capex_pct": [0.03, 0.05],
        "eps_2024": 3.15,
        "currency": "USD",
        "shares_out": 2030,
        "therapeutic_focus": [
            ("Oncology", 0.45), ("Cardiovascular", 0.20), ("Immunology", 0.15),
            ("Neuroscience", 0.10), ("Rare Disease", 0.10),
        ],
        "pipeline_size": 55,
        "notes": "Eliquis and Opdivo LOE concerns; cell therapy pipeline growing",
    },
    12: {  # GSK
        "fy2024_revenue": 38380,
        "growth_rates": [-0.09, 0.04, 0.08],
        "gross_margin": [0.64, 0.68],
        "operating_margin": [0.22, 0.27],
        "net_margin": [0.14, 0.19],
        "rd_intensity": [0.17, 0.20],
        "sga_pct": [0.24, 0.28],
        "assets_to_revenue": 2.0,
        "liabilities_pct": 0.65,
        "ocf_margin": [0.24, 0.30],
        "capex_pct": [0.05, 0.07],
        "eps_2024": 1.38,
        "currency": "GBP",
        "shares_out": 4100,
        "therapeutic_focus": [
            ("Infectious Disease", 0.25), ("Oncology", 0.20), ("Immunology", 0.15),
            ("Respiratory", 0.15), ("Vaccines", 0.15), ("Neuroscience", 0.10),
        ],
        "pipeline_size": 50,
        "notes": "Post-Haleon spin-off; Shingrix and HIV franchises growing; oncology pivot",
    },
    13: {  # Bayer
        "fy2024_revenue": 50700,
        "growth_rates": [0.08, -0.03, -0.04],
        "gross_margin": [0.55, 0.60],
        "operating_margin": [0.08, 0.14],
        "net_margin": [-0.05, 0.05],
        "rd_intensity": [0.10, 0.14],
        "sga_pct": [0.26, 0.30],
        "assets_to_revenue": 1.7,
        "liabilities_pct": 0.68,
        "ocf_margin": [0.15, 0.20],
        "capex_pct": [0.05, 0.07],
        "eps_2024": 0.95,
        "currency": "EUR",
        "shares_out": 984,
        "therapeutic_focus": [
            ("Cardiovascular", 0.25), ("Oncology", 0.25), ("Ophthalmology", 0.15),
            ("Rare Disease", 0.10), ("Neuroscience", 0.10),
            ("Immunology", 0.10), ("Respiratory", 0.05),
        ],
        "pipeline_size": 45,
        "notes": "Crop science headwinds and Roundup litigation; pharma segment restructuring",
    },
    14: {  # Amgen
        "fy2024_revenue": 33400,
        "growth_rates": [0.01, 0.07, 0.19],
        "gross_margin": [0.72, 0.76],
        "operating_margin": [0.32, 0.38],
        "net_margin": [0.22, 0.28],
        "rd_intensity": [0.18, 0.22],
        "sga_pct": [0.18, 0.22],
        "assets_to_revenue": 2.6,
        "liabilities_pct": 0.82,
        "ocf_margin": [0.35, 0.42],
        "capex_pct": [0.04, 0.06],
        "eps_2024": 13.50,
        "currency": "USD",
        "shares_out": 540,
        "therapeutic_focus": [
            ("Oncology", 0.25), ("Immunology", 0.20), ("Cardiovascular", 0.15),
            ("Rare Disease", 0.15), ("Neuroscience", 0.10), ("Respiratory", 0.10),
            ("Diabetes/Obesity", 0.05),
        ],
        "pipeline_size": 40,
        "notes": "Horizon acquisition completed; biosimilar portfolio growth; MariTide obesity candidate",
    },
    15: {  # Takeda
        "fy2024_revenue": 32780,
        "growth_rates": [0.12, -0.04, 0.02],
        "gross_margin": [0.66, 0.70],
        "operating_margin": [0.15, 0.20],
        "net_margin": [0.06, 0.11],
        "rd_intensity": [0.14, 0.17],
        "sga_pct": [0.26, 0.30],
        "assets_to_revenue": 3.6,
        "liabilities_pct": 0.55,
        "ocf_margin": [0.22, 0.28],
        "capex_pct": [0.05, 0.07],
        "eps_2024": 4.50,
        "currency": "JPY",
        "shares_out": 1570,
        "therapeutic_focus": [
            ("Rare Disease", 0.30), ("Oncology", 0.25), ("Neuroscience", 0.15),
            ("Immunology", 0.15), ("Infectious Disease", 0.10), ("Vaccines", 0.05),
        ],
        "pipeline_size": 40,
        "notes": "GI and rare disease franchises stable; deleveraging from Shire acquisition",
    },
    16: {  # Gilead
        "fy2024_revenue": 28850,
        "growth_rates": [-0.01, 0.05, 0.06],
        "gross_margin": [0.77, 0.81],
        "operating_margin": [0.32, 0.38],
        "net_margin": [0.22, 0.28],
        "rd_intensity": [0.20, 0.24],
        "sga_pct": [0.16, 0.20],
        "assets_to_revenue": 2.2,
        "liabilities_pct": 0.62,
        "ocf_margin": [0.36, 0.42],
        "capex_pct": [0.03, 0.05],
        "eps_2024": 6.80,
        "currency": "USD",
        "shares_out": 1240,
        "therapeutic_focus": [
            ("Infectious Disease", 0.35), ("Oncology", 0.30), ("Immunology", 0.15),
            ("Respiratory", 0.10), ("Rare Disease", 0.10),
        ],
        "pipeline_size": 35,
        "notes": "HIV franchise stable; Trodelvy and cell therapy driving oncology growth",
    },
    17: {  # Boehringer Ingelheim (Private)
        "fy2024_revenue": 27000,
        "growth_rates": [0.05, 0.04, 0.06],
        "gross_margin": [0.68, 0.72],
        "operating_margin": [0.18, 0.24],
        "net_margin": [0.12, 0.17],
        "rd_intensity": [0.20, 0.24],
        "sga_pct": [0.24, 0.28],
        "assets_to_revenue": 1.8,
        "liabilities_pct": 0.50,
        "ocf_margin": [0.22, 0.28],
        "capex_pct": [0.06, 0.08],
        "eps_2024": None,  # Private
        "currency": "EUR",
        "shares_out": None,
        "therapeutic_focus": [
            ("Respiratory", 0.25), ("Cardiovascular", 0.20), ("Oncology", 0.20),
            ("Immunology", 0.15), ("Neuroscience", 0.10), ("Rare Disease", 0.10),
        ],
        "pipeline_size": 30,
        "notes": "Largest private pharma company; Jardiance growth; respiratory portfolio",
    },
    18: {  # Regeneron
        "fy2024_revenue": 14910,
        "growth_rates": [0.14, -0.04, 0.10],
        "gross_margin": [0.85, 0.89],
        "operating_margin": [0.35, 0.42],
        "net_margin": [0.28, 0.34],
        "rd_intensity": [0.22, 0.27],
        "sga_pct": [0.14, 0.18],
        "assets_to_revenue": 2.4,
        "liabilities_pct": 0.32,
        "ocf_margin": [0.35, 0.42],
        "capex_pct": [0.06, 0.09],
        "eps_2024": 38.50,
        "currency": "USD",
        "shares_out": 113,
        "therapeutic_focus": [
            ("Immunology", 0.30), ("Ophthalmology", 0.25), ("Oncology", 0.20),
            ("Rare Disease", 0.10), ("Infectious Disease", 0.10), ("Neuroscience", 0.05),
        ],
        "pipeline_size": 35,
        "notes": "Dupixent co-developed with Sanofi; Eylea HD transition; genetics-driven pipeline",
    },
    19: {  # Moderna
        "fy2024_revenue": 4840,
        "growth_rates": [1.50, -0.636, -0.28],
        "gross_margin": [0.60, 0.68],
        "operating_margin": [-0.50, -0.30],
        "net_margin": [-0.55, -0.35],
        "rd_intensity": [0.70, 0.85],
        "sga_pct": [0.22, 0.28],
        "assets_to_revenue": 4.0,
        "liabilities_pct": 0.42,
        "ocf_margin": [-0.40, -0.25],
        "capex_pct": [0.12, 0.16],
        "eps_2024": -8.50,
        "currency": "USD",
        "shares_out": 383,
        # Year-specific overrides for Moderna's dramatic COVID trajectory
        "year_overrides": {
            2022: {
                "gross_margin": [0.82, 0.86],
                "operating_margin": [0.22, 0.28],
                "net_margin": [0.20, 0.26],
                "rd_intensity": [0.15, 0.19],
                "ocf_margin": [0.25, 0.32],
            },
            2023: {
                "gross_margin": [0.65, 0.72],
                "operating_margin": [-0.25, -0.15],
                "net_margin": [-0.30, -0.20],
                "rd_intensity": [0.50, 0.60],
                "ocf_margin": [-0.15, -0.05],
            },
        },
        "therapeutic_focus": [
            ("Vaccines", 0.40), ("Oncology", 0.20), ("Infectious Disease", 0.15),
            ("Rare Disease", 0.10), ("Immunology", 0.10), ("Respiratory", 0.05),
        ],
        "pipeline_size": 40,
        "notes": "Post-COVID revenue decline; mRNA platform diversification; RSV vaccine launch",
    },
    20: {  # Biogen
        "fy2024_revenue": 9840,
        "growth_rates": [-0.01, -0.06, -0.02],
        "gross_margin": [0.78, 0.82],
        "operating_margin": [0.20, 0.26],
        "net_margin": [0.12, 0.18],
        "rd_intensity": [0.24, 0.28],
        "sga_pct": [0.20, 0.24],
        "assets_to_revenue": 2.5,
        "liabilities_pct": 0.48,
        "ocf_margin": [0.28, 0.34],
        "capex_pct": [0.04, 0.06],
        "eps_2024": 12.40,
        "currency": "USD",
        "shares_out": 145,
        "therapeutic_focus": [
            ("Neuroscience", 0.50), ("Rare Disease", 0.20), ("Immunology", 0.15),
            ("Ophthalmology", 0.10), ("Oncology", 0.05),
        ],
        "pipeline_size": 30,
        "notes": "MS franchise declining; Leqembi (Alzheimer's) slow uptake; biosimilar growth",
    },
}

# =============================================================================
# MARKET DATA
# =============================================================================
MARKET_DATA = [
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

# =============================================================================
# PIPELINE DRUG NAMES BY THERAPEUTIC AREA
# =============================================================================
DRUG_NAME_POOLS = {
    "Oncology": [
        ("Keytruda", "pembrolizumab", "PD-1 inhibitor"),
        ("Opdivo", "nivolumab", "PD-1 inhibitor"),
        ("Tecentriq", "atezolizumab", "PD-L1 inhibitor"),
        ("Imfinzi", "durvalumab", "PD-L1 inhibitor"),
        ("Enhertu", "trastuzumab deruxtecan", "ADC"),
        ("Padcev", "enfortumab vedotin", "ADC"),
        ("Trodelvy", "sacituzumab govitecan", "ADC"),
        ("Calquence", "acalabrutinib", "BTK inhibitor"),
        ("Tagrisso", "osimertinib", "EGFR TKI"),
        ("Kisqali", "ribociclib", "CDK4/6 inhibitor"),
        ("Darzalex", "daratumumab", "Anti-CD38"),
        ("Yervoy", "ipilimumab", "CTLA-4 inhibitor"),
        ("VLX-810", None, "Novel bispecific antibody"),
        ("RZT-3025", None, "Next-gen ADC"),
        ("ONX-4580", None, "PI3K inhibitor"),
        ("MKR-1197", None, "KRAS G12D inhibitor"),
        ("ALT-2350", None, "CDK2 inhibitor"),
    ],
    "Immunology": [
        ("Humira", "adalimumab", "TNF inhibitor"),
        ("Skyrizi", "risankizumab", "IL-23 inhibitor"),
        ("Rinvoq", "upadacitinib", "JAK inhibitor"),
        ("Dupixent", "dupilumab", "IL-4/IL-13 inhibitor"),
        ("Stelara", "ustekinumab", "IL-12/23 inhibitor"),
        ("Tremfya", "guselkumab", "IL-23 inhibitor"),
        ("Cosentyx", "secukinumab", "IL-17A inhibitor"),
        ("Olumiant", "baricitinib", "JAK inhibitor"),
        ("IMN-5520", None, "Novel OX40 agonist"),
        ("BTK-7190", None, "Next-gen JAK inhibitor"),
        ("DPX-3180", None, "IL-33 inhibitor"),
    ],
    "Cardiovascular": [
        ("Entresto", "sacubitril/valsartan", "ARNI"),
        ("Eliquis", "apixaban", "Factor Xa inhibitor"),
        ("Repatha", "evolocumab", "PCSK9 inhibitor"),
        ("Jardiance", "empagliflozin", "SGLT2 inhibitor"),
        ("Leqvio", "inclisiran", "PCSK9 siRNA"),
        ("CVX-8810", None, "Next-gen lipid lowering"),
        ("HTN-4470", None, "Novel antihypertensive"),
        ("PLQ-2250", None, "Lp(a) inhibitor"),
    ],
    "Diabetes/Obesity": [
        ("Ozempic", "semaglutide", "GLP-1 RA"),
        ("Wegovy", "semaglutide", "GLP-1 RA (obesity)"),
        ("Mounjaro", "tirzepatide", "GIP/GLP-1 RA"),
        ("Zepbound", "tirzepatide", "GIP/GLP-1 RA (obesity)"),
        ("Jardiance", "empagliflozin", "SGLT2 inhibitor"),
        ("Trulicity", "dulaglutide", "GLP-1 RA"),
        ("MariTide", None, "Amylin/GLP-1 combination"),
        ("CagriSema", None, "Cagrilintide/semaglutide"),
        ("GLP-2710", None, "Oral GLP-1"),
        ("OBX-4450", None, "Triple agonist"),
    ],
    "Neuroscience": [
        ("Leqembi", "lecanemab", "Anti-amyloid antibody"),
        ("Kisunla", "donanemab", "Anti-amyloid antibody"),
        ("Vyvgart", "efgartigimod", "FcRn inhibitor"),
        ("Spinraza", "nusinersen", "SMN2 antisense"),
        ("Tecfidera", "dimethyl fumarate", "MS therapy"),
        ("Tysabri", "natalizumab", "Integrin inhibitor"),
        ("NRO-5580", None, "Tau aggregation inhibitor"),
        ("PSY-3310", None, "Novel antidepressant"),
        ("ALS-7720", None, "SOD1 antisense"),
    ],
    "Rare Disease": [
        ("Soliris", "eculizumab", "C5 inhibitor"),
        ("Ultomiris", "ravulizumab", "Long-acting C5 inhibitor"),
        ("Hemlibra", "emicizumab", "Factor IXa/X bispecific"),
        ("Takhzyro", "lanadelumab", "Kallikrein inhibitor"),
        ("Elaprase", "idursulfase", "Enzyme replacement"),
        ("RDX-8810", None, "Gene therapy"),
        ("FBD-2290", None, "Substrate reduction therapy"),
        ("CMP-5510", None, "mRNA enzyme replacement"),
    ],
    "Respiratory": [
        ("Trelegy", "fluticasone/umeclidinium/vilanterol", "Triple inhaler"),
        ("Nucala", "mepolizumab", "Anti-IL-5"),
        ("Fasenra", "benralizumab", "Anti-IL-5Ra"),
        ("Breztri", "budesonide/glycopyrrolate/formoterol", "Triple inhaler"),
        ("Symbicort", "budesonide/formoterol", "ICS/LABA"),
        ("RSP-4470", None, "Anti-TSLP antibody"),
        ("IPF-3310", None, "Anti-fibrotic"),
    ],
    "Vaccines": [
        ("Comirnaty", "tozinameran", "COVID-19 mRNA vaccine"),
        ("Gardasil", "HPV vaccine", "HPV prophylactic vaccine"),
        ("Shingrix", "HZ/su vaccine", "Shingles vaccine"),
        ("Prevnar", "PCV20", "Pneumococcal conjugate"),
        ("mRESVIA", None, "RSV mRNA vaccine"),
        ("FLU-mRNA", None, "Influenza mRNA vaccine"),
        ("CMV-4480", None, "CMV mRNA vaccine"),
        ("NRV-2250", None, "Norovirus vaccine"),
    ],
    "Infectious Disease": [
        ("Biktarvy", "bictegravir/emtricitabine/TAF", "HIV INSTI"),
        ("Descovy", "emtricitabine/TAF", "HIV PrEP"),
        ("Paxlovid", "nirmatrelvir/ritonavir", "COVID-19 antiviral"),
        ("Dovato", "dolutegravir/lamivudine", "HIV 2DR"),
        ("Veklury", "remdesivir", "Antiviral"),
        ("LNP-5580", None, "Broad-spectrum antiviral"),
        ("ABR-3310", None, "Long-acting HIV injectable"),
    ],
    "Ophthalmology": [
        ("Eylea", "aflibercept", "VEGF trap"),
        ("Eylea HD", "aflibercept 8mg", "High-dose VEGF trap"),
        ("Vabysmo", "faricimab", "Bispecific VEGF/Ang-2"),
        ("Lucentis", "ranibizumab", "Anti-VEGF"),
        ("OPH-7720", None, "Gene therapy for IRD"),
        ("RET-3350", None, "Novel complement inhibitor"),
    ],
}

# Quarterly distribution patterns (percentage of annual revenue per quarter)
# Pharma tends to be somewhat seasonal with Q4 often strongest
QUARTERLY_WEIGHTS = {
    "default": [0.235, 0.245, 0.250, 0.270],
    "vaccines_heavy": [0.220, 0.230, 0.270, 0.280],  # Fall/winter heavier
    "steady": [0.245, 0.250, 0.250, 0.255],
}


def load_companies():
    """Load company list from companies.json."""
    with open(COMPANIES_FILE, "r") as f:
        return json.load(f)


def jitter(value, pct=0.02):
    """Add small random jitter to a value."""
    return value * (1 + random.uniform(-pct, pct))


def generate_financials(company_id, profile, years=(2022, 2023, 2024)):
    """Generate realistic annual and quarterly financial data for a company."""
    records = []

    # Determine quarterly weight pattern
    focus_areas = [ta for ta, _ in profile["therapeutic_focus"]]
    if "Vaccines" in focus_areas and profile["therapeutic_focus"][0][0] == "Vaccines":
        q_weights = QUARTERLY_WEIGHTS["vaccines_heavy"]
    elif profile.get("growth_rates", [0, 0, 0])[2] > 0.20:
        q_weights = QUARTERLY_WEIGHTS["default"]  # High growth = more seasonal
    else:
        q_weights = QUARTERLY_WEIGHTS["steady"]

    # Work backwards from FY2024 revenue to get FY2022, FY2023
    fy2024_rev = profile["fy2024_revenue"]
    growth_rates = profile["growth_rates"]  # [fy22_growth, fy23_growth, fy24_growth]

    # FY2024 = FY2023 * (1 + fy24_growth) => FY2023 = FY2024 / (1 + fy24_growth)
    fy2023_rev = fy2024_rev / (1 + growth_rates[2])
    fy2022_rev = fy2023_rev / (1 + growth_rates[1])

    annual_revenues = {2022: fy2022_rev, 2023: fy2023_rev, 2024: fy2024_rev}

    prev_year_data = None

    for year_idx, year in enumerate(years):
        annual_rev = annual_revenues[year]

        # Check for year-specific overrides (e.g., Moderna's COVID trajectory)
        year_overrides = profile.get("year_overrides", {}).get(year, {})

        # Sample margins for this year with slight variation
        gm = random.uniform(*year_overrides.get("gross_margin", profile["gross_margin"]))
        om = random.uniform(*year_overrides.get("operating_margin", profile["operating_margin"]))
        nm = random.uniform(*year_overrides.get("net_margin", profile["net_margin"]))
        rd_pct = random.uniform(*year_overrides.get("rd_intensity", profile["rd_intensity"]))
        sga_pct = random.uniform(*year_overrides.get("sga_pct", profile["sga_pct"]))
        ocf_pct = random.uniform(*year_overrides.get("ocf_margin", profile["ocf_margin"]))
        capex_pct = random.uniform(*year_overrides.get("capex_pct", profile["capex_pct"]))

        # Annual figures (in millions)
        revenue = annual_rev
        cogs = revenue * (1 - gm)
        gross_profit = revenue * gm
        rd_expense = revenue * rd_pct
        sga_expense = revenue * sga_pct
        operating_income = revenue * om
        net_income = revenue * nm

        # Balance sheet items
        total_assets = revenue * profile["assets_to_revenue"]
        total_liabilities = total_assets * profile["liabilities_pct"]
        equity = total_assets - total_liabilities

        # Cash flow
        operating_cf = revenue * ocf_pct
        capex = revenue * capex_pct
        free_cash_flow = operating_cf - capex

        # EPS
        if profile.get("eps_2024") is not None and profile.get("shares_out"):
            eps_ratio = net_income / (fy2024_rev * nm)
            diluted_eps = profile["eps_2024"] * (net_income / (fy2024_rev * random.uniform(*profile["net_margin"])))
            diluted_eps = round(diluted_eps, 2)
        else:
            diluted_eps = None

        # Cash and equivalents (roughly 5-15% of assets)
        cash = total_assets * random.uniform(0.05, 0.15)

        # Compute ratios
        gross_margin = gross_profit / revenue if revenue else None
        operating_margin = operating_income / revenue if revenue else None
        net_margin_calc = net_income / revenue if revenue else None
        rd_intensity = rd_expense / revenue if revenue else None
        roe = net_income / equity if equity and equity != 0 else None
        debt_to_equity = total_liabilities / equity if equity and equity != 0 else None

        # Create annual record
        annual_record = {
            "company_id": company_id,
            "period_type": "annual",
            "period_label": f"FY{year}",
            "fiscal_year": year,
            "fiscal_quarter": None,
            "start_date": f"{year}-01-01",
            "end_date": f"{year}-12-31",
            "currency": profile.get("currency", "USD"),
            "revenue": round(revenue, 2),
            "cogs": round(cogs, 2),
            "gross_profit": round(gross_profit, 2),
            "rd_expense": round(rd_expense, 2),
            "sga_expense": round(sga_expense, 2),
            "operating_income": round(operating_income, 2),
            "net_income": round(net_income, 2),
            "diluted_eps": diluted_eps,
            "total_assets": round(total_assets, 2),
            "total_liabilities": round(total_liabilities, 2),
            "shareholders_equity": round(equity, 2),
            "cash_and_equivalents": round(cash, 2),
            "operating_cash_flow": round(operating_cf, 2),
            "capex": round(capex, 2),
            "free_cash_flow": round(free_cash_flow, 2),
            "gross_margin": round(gross_margin, 4) if gross_margin else None,
            "operating_margin": round(operating_margin, 4) if operating_margin else None,
            "net_margin": round(net_margin_calc, 4) if net_margin_calc else None,
            "rd_intensity": round(rd_intensity, 4) if rd_intensity else None,
            "roe": round(roe, 4) if roe else None,
            "debt_to_equity": round(debt_to_equity, 4) if debt_to_equity else None,
        }
        records.append(annual_record)

        # Generate quarterly data
        for q in range(1, 5):
            q_weight = q_weights[q - 1]
            # Add some quarterly jitter
            q_factor = jitter(q_weight, 0.03)

            q_revenue = revenue * q_factor
            q_cogs = cogs * q_factor
            q_gross_profit = q_revenue - q_cogs
            q_rd = rd_expense * jitter(0.25, 0.05)  # Roughly 25% per quarter
            q_sga = sga_expense * jitter(0.25, 0.05)
            q_operating = operating_income * q_factor
            q_net = net_income * q_factor

            # Quarterly balance sheet (point in time, grows through year)
            q_asset_factor = 0.94 + (q * 0.02)  # Gradual growth
            q_total_assets = total_assets * jitter(q_asset_factor, 0.01)
            q_total_liabilities = q_total_assets * jitter(profile["liabilities_pct"], 0.02)
            q_equity = q_total_assets - q_total_liabilities

            q_ocf = operating_cf * jitter(0.25, 0.08)
            q_capex = capex * jitter(0.25, 0.1)
            q_fcf = q_ocf - q_capex
            q_cash = cash * jitter(q_asset_factor, 0.03)

            q_eps = diluted_eps * q_factor if diluted_eps else None

            # Quarter dates
            q_starts = [f"{year}-01-01", f"{year}-04-01", f"{year}-07-01", f"{year}-10-01"]
            q_ends = [f"{year}-03-31", f"{year}-06-30", f"{year}-09-30", f"{year}-12-31"]

            q_gm = q_gross_profit / q_revenue if q_revenue else None
            q_om = q_operating / q_revenue if q_revenue else None
            q_nm = q_net / q_revenue if q_revenue else None
            q_rd_int = q_rd / q_revenue if q_revenue else None
            q_roe = (q_net * 4) / q_equity if q_equity and q_equity != 0 else None  # Annualized
            q_dte = q_total_liabilities / q_equity if q_equity and q_equity != 0 else None

            q_record = {
                "company_id": company_id,
                "period_type": "quarterly",
                "period_label": f"Q{q} {year}",
                "fiscal_year": year,
                "fiscal_quarter": q,
                "start_date": q_starts[q - 1],
                "end_date": q_ends[q - 1],
                "currency": profile.get("currency", "USD"),
                "revenue": round(q_revenue, 2),
                "cogs": round(q_cogs, 2),
                "gross_profit": round(q_gross_profit, 2),
                "rd_expense": round(q_rd, 2),
                "sga_expense": round(q_sga, 2),
                "operating_income": round(q_operating, 2),
                "net_income": round(q_net, 2),
                "diluted_eps": round(q_eps, 2) if q_eps else None,
                "total_assets": round(q_total_assets, 2),
                "total_liabilities": round(q_total_liabilities, 2),
                "shareholders_equity": round(q_equity, 2),
                "cash_and_equivalents": round(q_cash, 2),
                "operating_cash_flow": round(q_ocf, 2),
                "capex": round(q_capex, 2),
                "free_cash_flow": round(q_fcf, 2),
                "gross_margin": round(q_gm, 4) if q_gm else None,
                "operating_margin": round(q_om, 4) if q_om else None,
                "net_margin": round(q_nm, 4) if q_nm else None,
                "rd_intensity": round(q_rd_int, 4) if q_rd_int else None,
                "roe": round(q_roe, 4) if q_roe else None,
                "debt_to_equity": round(q_dte, 4) if q_dte else None,
            }
            records.append(q_record)

        prev_year_data = annual_record

    return records


def generate_pipeline(company_id, profile, company_name):
    """Generate realistic pipeline data for a company."""
    records = []
    pipeline_size = profile["pipeline_size"]
    therapeutic_focus = profile["therapeutic_focus"]

    # Phase distribution
    phase_distribution = {
        "Preclinical": 0.10,
        "Phase I": 0.25,
        "Phase II": 0.35,
        "Phase III": 0.20,
        "Filed/Approved": 0.05,
        "Approved": 0.05,
    }

    drug_id = 0
    for ta, ta_weight in therapeutic_focus:
        ta_count = max(1, int(pipeline_size * ta_weight + random.uniform(-1, 1)))
        drug_pool = DRUG_NAME_POOLS.get(ta, [])

        for i in range(ta_count):
            drug_id += 1

            # Select phase
            phase_roll = random.random()
            cumulative = 0
            phase = "Phase II"  # default
            for p, p_weight in phase_distribution.items():
                cumulative += p_weight
                if phase_roll <= cumulative:
                    phase = p
                    break

            # Select drug
            if i < len(drug_pool):
                drug_info = drug_pool[i]
                drug_name = drug_info[0]
                generic_name = drug_info[1]
                indication = drug_info[2]
            else:
                # Generate a synthetic drug name
                prefixes = ["ABT", "MRK", "PFE", "AZN", "NVS", "LLY", "BMY", "GSK",
                            "RGN", "TAK", "GLD", "AMG", "SNY", "NVO", "BIG", "MDR"]
                prefix = random.choice(prefixes)
                drug_name = f"{prefix}-{random.randint(1000, 9999)}"
                generic_name = None
                indications_map = {
                    "Oncology": ["Solid tumors", "Hematologic malignancies", "Breast cancer",
                                 "NSCLC", "Colorectal cancer", "Pancreatic cancer"],
                    "Immunology": ["Atopic dermatitis", "Rheumatoid arthritis", "Psoriasis",
                                   "Ulcerative colitis", "Crohn's disease"],
                    "Cardiovascular": ["Heart failure", "Hypertension", "Atherosclerosis",
                                       "Atrial fibrillation", "PAH"],
                    "Diabetes/Obesity": ["Type 2 diabetes", "Obesity", "NASH", "MASH"],
                    "Neuroscience": ["Alzheimer's disease", "Parkinson's disease", "Depression",
                                     "Epilepsy", "ALS", "Multiple sclerosis"],
                    "Rare Disease": ["Hemophilia", "Fabry disease", "HAE", "SMA", "PKU"],
                    "Respiratory": ["Asthma", "COPD", "IPF", "Cystic fibrosis"],
                    "Vaccines": ["COVID-19", "Influenza", "RSV", "CMV", "Norovirus"],
                    "Infectious Disease": ["HIV", "Hepatitis B", "Fungal infections"],
                    "Ophthalmology": ["Wet AMD", "DME", "Geographic atrophy", "Glaucoma"],
                }
                indication = random.choice(indications_map.get(ta, ["Undisclosed"]))

            # Status
            if phase in ("Filed/Approved", "Approved"):
                status = random.choice(["Approved", "Filed"])
            elif phase == "Preclinical":
                status = "Preclinical"
            else:
                status = random.choice(["Recruiting", "Active, not recruiting", "Enrolling by invitation"])

            # NCT ID
            nct_id = f"NCT{random.randint(10000000, 99999999)}" if phase not in ("Preclinical", "Approved") else None

            # Enrollment
            enrollment_ranges = {
                "Preclinical": (0, 0),
                "Phase I": (20, 120),
                "Phase II": (80, 500),
                "Phase III": (300, 5000),
                "Filed/Approved": (500, 10000),
                "Approved": (1000, 15000),
            }
            e_range = enrollment_ranges.get(phase, (50, 500))
            enrollment = random.randint(*e_range) if e_range[1] > 0 else None

            # Expected completion
            if phase in ("Preclinical",):
                expected_completion = f"{random.randint(2027, 2030)}-{random.randint(1,12):02d}"
            elif phase == "Phase I":
                expected_completion = f"{random.randint(2026, 2028)}-{random.randint(1,12):02d}"
            elif phase == "Phase II":
                expected_completion = f"{random.randint(2026, 2029)}-{random.randint(1,12):02d}"
            elif phase == "Phase III":
                expected_completion = f"{random.randint(2026, 2028)}-{random.randint(1,12):02d}"
            else:
                expected_completion = None

            records.append({
                "company_id": company_id,
                "drug_name": drug_name,
                "generic_name": generic_name,
                "therapeutic_area": ta,
                "indication": indication,
                "phase": phase,
                "nct_id": nct_id,
                "status": status,
                "enrollment": enrollment,
                "expected_completion": expected_completion,
            })

    return records


def generate_variances(company_id, financials, profile, company_name):
    """Generate variance records highlighting interesting YoY changes."""
    records = []

    # Get annual records
    annual = [f for f in financials if f["period_type"] == "annual"]
    annual.sort(key=lambda x: x["fiscal_year"])

    metrics_to_check = [
        ("revenue", "Revenue"),
        ("net_income", "Net Income"),
        ("operating_income", "Operating Income"),
        ("rd_expense", "R&D Expense"),
        ("gross_profit", "Gross Profit"),
        ("operating_cash_flow", "Operating Cash Flow"),
        ("gross_margin", "Gross Margin"),
        ("operating_margin", "Operating Margin"),
        ("net_margin", "Net Margin"),
        ("rd_intensity", "R&D Intensity"),
    ]

    for i in range(1, len(annual)):
        prev = annual[i - 1]
        curr = annual[i]

        for field, label in metrics_to_check:
            curr_val = curr.get(field)
            prev_val = prev.get(field)

            if curr_val is None or prev_val is None or prev_val == 0:
                continue

            # For ratio metrics, treat as percentage points
            if field in ("gross_margin", "operating_margin", "net_margin", "rd_intensity"):
                variance_abs = (curr_val - prev_val) * 100  # Convert to ppts
                variance_pct = ((curr_val - prev_val) / abs(prev_val)) * 100
            else:
                variance_abs = curr_val - prev_val
                variance_pct = ((curr_val - prev_val) / abs(prev_val)) * 100

            direction = "up" if variance_abs > 0 else "down"

            # Generate AI explanation for significant variances
            explanation = None
            if abs(variance_pct) > 5:
                explanation = _generate_variance_explanation(
                    company_name, label, direction, variance_pct, profile, curr["fiscal_year"]
                )

            records.append({
                "company_id": company_id,
                "metric": label,
                "period": f"FY{curr['fiscal_year']} vs FY{prev['fiscal_year']}",
                "actual": round(curr_val, 4),
                "comparator": round(prev_val, 4),
                "comparator_type": "prior_year",
                "variance_pct": round(variance_pct, 2),
                "variance_abs": round(variance_abs, 2),
                "direction": direction,
                "ai_explanation": explanation,
            })

    return records


def _generate_variance_explanation(company_name, metric, direction, pct, profile, year):
    """Generate a realistic AI explanation for a variance."""
    notes = profile.get("notes", "")
    dir_word = "increase" if direction == "up" else "decrease"
    abs_pct = abs(pct)

    explanations = {
        "Revenue": {
            "up": [
                f"{company_name}'s revenue growth of {abs_pct:.1f}% in FY{year} was driven by strong demand across key franchises. {notes}",
                f"Revenue increased {abs_pct:.1f}% YoY reflecting new product launches and volume growth in core therapeutic areas.",
                f"Top-line growth of {abs_pct:.1f}% was supported by geographic expansion and favorable pricing dynamics.",
            ],
            "down": [
                f"{company_name} saw a {abs_pct:.1f}% revenue decline in FY{year} primarily due to loss of exclusivity and competitive pressures. {notes}",
                f"Revenue decreased {abs_pct:.1f}% YoY reflecting patent cliffs and biosimilar competition in key markets.",
                f"The {abs_pct:.1f}% revenue decline was driven by COVID-related product normalization and generic erosion.",
            ],
        },
        "Net Income": {
            "up": [
                f"Net income grew {abs_pct:.1f}% driven by operating leverage, favorable product mix, and cost discipline.",
                f"Bottom-line improvement of {abs_pct:.1f}% reflected higher revenue, improved margins, and reduced restructuring charges.",
            ],
            "down": [
                f"Net income declined {abs_pct:.1f}% due to higher R&D investment, acquisition-related charges, and competitive pressures.",
                f"The {abs_pct:.1f}% decrease in net income reflected margin compression and increased investment in pipeline programs.",
            ],
        },
        "Operating Income": {
            "up": [
                f"Operating income increased {abs_pct:.1f}% driven by revenue growth and operational efficiency improvements.",
                f"The {abs_pct:.1f}% improvement in operating income reflected strong product mix and cost optimization programs.",
            ],
            "down": [
                f"Operating income fell {abs_pct:.1f}% due to increased R&D spending on late-stage pipeline programs and SG&A investment.",
                f"The {abs_pct:.1f}% decline in operating income was driven by higher investment in manufacturing capacity and pipeline.",
            ],
        },
        "R&D Expense": {
            "up": [
                f"R&D spending increased {abs_pct:.1f}% reflecting expanded clinical programs and advancement of key pipeline candidates.",
                f"The {abs_pct:.1f}% increase in R&D investment supports multiple Phase III readouts expected in coming years.",
            ],
            "down": [
                f"R&D expenses decreased {abs_pct:.1f}% following completion of late-stage trials and portfolio prioritization.",
                f"R&D spending was down {abs_pct:.1f}% reflecting more disciplined pipeline management and trial completions.",
            ],
        },
    }

    metric_exps = explanations.get(metric, {})
    dir_exps = metric_exps.get(direction, [
        f"{metric} {dir_word}d {abs_pct:.1f}% YoY in FY{year}, reflecting ongoing business dynamics and market conditions."
    ])

    return random.choice(dir_exps)


def generate_insights(company_id, financials, pipeline, profile, company_name):
    """Generate insight records for interesting observations."""
    records = []
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    annual = [f for f in financials if f["period_type"] == "annual"]
    annual.sort(key=lambda x: x["fiscal_year"])

    if len(annual) >= 2:
        latest = annual[-1]
        prev = annual[-2]

        # Revenue trend insight
        if latest["revenue"] and prev["revenue"]:
            rev_growth = ((latest["revenue"] - prev["revenue"]) / prev["revenue"]) * 100
            if rev_growth > 15:
                records.append({
                    "company_id": company_id,
                    "insight_type": "growth_alert",
                    "content": f"{company_name} achieved exceptional revenue growth of {rev_growth:.1f}% in FY{latest['fiscal_year']}, significantly outpacing the industry average of 5-7%.",
                    "label": "strong_growth",
                    "created_at": now,
                })
            elif rev_growth < -5:
                records.append({
                    "company_id": company_id,
                    "insight_type": "risk_alert",
                    "content": f"{company_name} experienced a revenue decline of {abs(rev_growth):.1f}% in FY{latest['fiscal_year']}. {profile.get('notes', '')}",
                    "label": "revenue_decline",
                    "created_at": now,
                })

        # Margin insight
        if latest.get("operating_margin") and latest["operating_margin"] > 0.35:
            records.append({
                "company_id": company_id,
                "insight_type": "competitive_advantage",
                "content": f"{company_name} maintains industry-leading operating margins of {latest['operating_margin']*100:.1f}%, reflecting strong pricing power and operational efficiency.",
                "label": "high_margin",
                "created_at": now,
            })
        elif latest.get("operating_margin") and latest["operating_margin"] < 0.15:
            records.append({
                "company_id": company_id,
                "insight_type": "margin_pressure",
                "content": f"{company_name}'s operating margin of {latest['operating_margin']*100:.1f}% is below the pharma industry average, suggesting potential for margin improvement initiatives.",
                "label": "low_margin",
                "created_at": now,
            })

        # R&D intensity insight
        if latest.get("rd_intensity") and latest["rd_intensity"] > 0.22:
            records.append({
                "company_id": company_id,
                "insight_type": "innovation_investment",
                "content": f"{company_name} invests {latest['rd_intensity']*100:.1f}% of revenue in R&D, among the highest in the industry, positioning it for long-term pipeline growth.",
                "label": "high_rd",
                "created_at": now,
            })

    # Pipeline insight
    phase3_count = sum(1 for p in pipeline if p["phase"] == "Phase III")
    if phase3_count >= 8:
        records.append({
            "company_id": company_id,
            "insight_type": "pipeline_strength",
            "content": f"{company_name} has {phase3_count} programs in Phase III, representing significant near-term revenue potential from new approvals.",
            "label": "strong_pipeline",
            "created_at": now,
        })

    # Therapeutic area concentration insight
    if profile["therapeutic_focus"] and profile["therapeutic_focus"][0][1] >= 0.40:
        ta = profile["therapeutic_focus"][0][0]
        records.append({
            "company_id": company_id,
            "insight_type": "concentration_risk",
            "content": f"{company_name} derives significant pipeline focus from {ta} ({profile['therapeutic_focus'][0][1]*100:.0f}% of programs), creating both leadership position and concentration risk.",
            "label": "ta_concentration",
            "created_at": now,
        })

    return records


def create_database():
    """Create the SQLite database with schema."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if DB_PATH.exists():
        DB_PATH.unlink()
        logger.info(f"Removed existing database at {DB_PATH}")

    conn = sqlite3.connect(str(DB_PATH))

    conn.executescript("""
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
        period_type TEXT NOT NULL,
        period_label TEXT NOT NULL,
        fiscal_year INTEGER NOT NULL,
        fiscal_quarter INTEGER,
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
        direction TEXT,
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
    """)

    conn.commit()
    logger.info(f"Created database schema at {DB_PATH}")
    return conn


def main():
    """Generate and seed all realistic data."""
    logger.info("=" * 70)
    logger.info("PharmaLens Realistic Data Seeder")
    logger.info("=" * 70)

    # Load companies
    companies = load_companies()
    logger.info(f"Loaded {len(companies)} companies from {COMPANIES_FILE}")

    # Create database
    conn = create_database()

    try:
        # --- Insert companies ---
        for company in companies:
            conn.execute(
                "INSERT INTO companies (id, name, ticker, cik, filing_type, hq_country, fiscal_year_end) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                (company["id"], company["name"], company["ticker"], company.get("cik"),
                 company["filing_type"], company["hq_country"], company["fiscal_year_end"]),
            )
        conn.commit()
        logger.info(f"Inserted {len(companies)} companies")

        # --- Generate and insert financials ---
        total_financial_records = 0
        total_pipeline_records = 0
        total_variance_records = 0
        total_insight_records = 0

        for company in companies:
            cid = company["id"]
            name = company["name"]
            profile = COMPANY_PROFILES.get(cid)

            if not profile:
                logger.warning(f"No profile for company {cid} ({name}), skipping")
                continue

            # Generate financials
            financials = generate_financials(cid, profile)
            for rec in financials:
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
                        rec["company_id"], rec["period_type"], rec["period_label"],
                        rec["fiscal_year"], rec["fiscal_quarter"],
                        rec["start_date"], rec["end_date"], rec["currency"],
                        rec["revenue"], rec["cogs"], rec["gross_profit"],
                        rec["rd_expense"], rec["sga_expense"],
                        rec["operating_income"], rec["net_income"], rec["diluted_eps"],
                        rec["total_assets"], rec["total_liabilities"], rec["shareholders_equity"],
                        rec["cash_and_equivalents"], rec["operating_cash_flow"],
                        rec["capex"], rec["free_cash_flow"],
                        rec["gross_margin"], rec["operating_margin"], rec["net_margin"],
                        rec["rd_intensity"], rec["roe"], rec["debt_to_equity"],
                    ),
                )
            total_financial_records += len(financials)

            # Generate pipeline
            pipeline = generate_pipeline(cid, profile, name)
            for rec in pipeline:
                conn.execute(
                    """INSERT INTO pipeline (
                        company_id, drug_name, generic_name, therapeutic_area, indication,
                        phase, nct_id, status, enrollment, expected_completion
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        rec["company_id"], rec["drug_name"], rec["generic_name"],
                        rec["therapeutic_area"], rec["indication"],
                        rec["phase"], rec["nct_id"], rec["status"],
                        rec["enrollment"], rec["expected_completion"],
                    ),
                )
            total_pipeline_records += len(pipeline)

            # Generate variances
            variances = generate_variances(cid, financials, profile, name)
            for rec in variances:
                conn.execute(
                    """INSERT INTO variances (
                        company_id, metric, period, actual, comparator,
                        comparator_type, variance_pct, variance_abs, direction, ai_explanation
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        rec["company_id"], rec["metric"], rec["period"],
                        rec["actual"], rec["comparator"], rec["comparator_type"],
                        rec["variance_pct"], rec["variance_abs"], rec["direction"],
                        rec["ai_explanation"],
                    ),
                )
            total_variance_records += len(variances)

            # Generate insights
            insights = generate_insights(cid, financials, pipeline, profile, name)
            for rec in insights:
                conn.execute(
                    """INSERT INTO insights (
                        company_id, insight_type, content, label, created_at
                    ) VALUES (?, ?, ?, ?, ?)""",
                    (
                        rec["company_id"], rec["insight_type"], rec["content"],
                        rec["label"], rec["created_at"],
                    ),
                )
            total_insight_records += len(insights)

            logger.info(
                f"  {name}: {len(financials)} financials, {len(pipeline)} pipeline, "
                f"{len(variances)} variances, {len(insights)} insights"
            )

        conn.commit()

        # --- Seed market data ---
        for ta, size, growth, players in MARKET_DATA:
            conn.execute(
                "INSERT INTO market_data (therapeutic_area, market_size_b, growth_rate, key_players) "
                "VALUES (?, ?, ?, ?)",
                (ta, size, growth, players),
            )
        conn.commit()
        logger.info(f"Inserted {len(MARKET_DATA)} market data records")

        # --- Final summary ---
        logger.info("")
        logger.info("=" * 70)
        logger.info("SEED COMPLETE - Database Summary")
        logger.info("=" * 70)

        # Query counts for verification
        counts = {}
        for table in ["companies", "financials", "pipeline", "variances", "market_data", "insights"]:
            cursor = conn.execute(f"SELECT COUNT(*) FROM {table}")
            counts[table] = cursor.fetchone()[0]
            logger.info(f"  {table:20s}: {counts[table]:>6,} records")

        # Additional stats
        cursor = conn.execute(
            "SELECT COUNT(DISTINCT company_id) FROM financials WHERE period_type = 'annual'"
        )
        annual_companies = cursor.fetchone()[0]

        cursor = conn.execute(
            "SELECT COUNT(*) FROM financials WHERE period_type = 'annual'"
        )
        annual_records = cursor.fetchone()[0]

        cursor = conn.execute(
            "SELECT COUNT(*) FROM financials WHERE period_type = 'quarterly'"
        )
        quarterly_records = cursor.fetchone()[0]

        cursor = conn.execute(
            "SELECT phase, COUNT(*) FROM pipeline GROUP BY phase ORDER BY COUNT(*) DESC"
        )
        phase_counts = cursor.fetchall()

        logger.info("")
        logger.info(f"  Companies with data: {annual_companies}")
        logger.info(f"  Annual records:      {annual_records}")
        logger.info(f"  Quarterly records:   {quarterly_records}")
        logger.info("")
        logger.info("  Pipeline by Phase:")
        for phase, count in phase_counts:
            logger.info(f"    {phase:20s}: {count:>4}")

        # Show a sample financial record
        cursor = conn.execute(
            "SELECT c.name, f.period_label, f.revenue, f.net_income, f.gross_margin, f.operating_margin "
            "FROM financials f JOIN companies c ON f.company_id = c.id "
            "WHERE f.period_type = 'annual' AND f.fiscal_year = 2024 "
            "ORDER BY f.revenue DESC LIMIT 5"
        )
        logger.info("")
        logger.info("  Top 5 Companies by FY2024 Revenue (millions):")
        logger.info(f"  {'Company':<25s} {'Period':<10s} {'Revenue':>12s} {'Net Income':>12s} {'GM%':>8s} {'OM%':>8s}")
        logger.info(f"  {'-'*25} {'-'*10} {'-'*12} {'-'*12} {'-'*8} {'-'*8}")
        for row in cursor.fetchall():
            name, period, rev, ni, gm, om = row
            logger.info(
                f"  {name:<25s} {period:<10s} {rev:>12,.0f} {ni:>12,.0f} "
                f"{gm*100:>7.1f}% {om*100:>7.1f}%"
            )

        logger.info("")
        logger.info(f"  Database file: {DB_PATH}")
        logger.info(f"  Database size: {DB_PATH.stat().st_size / 1024:.1f} KB")
        logger.info("=" * 70)

    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
