#!/usr/bin/env python3
"""
Solar Inference LLC — books generator (the missing accounting).

WHY THIS EXISTS (2026-05-28 audit, finding C6): the LLC has NO books. TY2026
revenue is recorded in no ledger; "revenue $0 / pre-revenue" is stale across
four memory files. This script is the income statement + balance sheet + the
load-bearing ITC worksheet, generated from the ledger CSVs under
data/financial/solar-inference/ and the committed config spine fleet.yaml.

DESIGN (mirrors scripts/fleet-watchdog.py):
  - fleet.yaml is the ONE source of truth for machine identity, depreciation
    PARAMETERS, solar tax posture, and electricity. We ITERATE over its
    `machines` list — never hardcode a machine.
  - DOLLARS live only in data/financial/solar-inference/ (gitignored). This
    script READS those files and WRITES books-2026.json + STATEMENTS-2026.md
    back into that same gitignored dir. No dollar amount is ever written to a
    committed file or a log.
  - It NEVER fabricates a figure. Every missing/empty/unmeasured input becomes
    an explicit entry in `warnings` and a null/empty value in the output. The
    ITC is presented as a labeled RANGE of scenarios, not a single number.
  - It runs clean on mostly-empty data (the inputs may be only partially
    seeded by a parallel builder), emitting warnings rather than crashing.

Reads only. No SSH. No network. PyYAML is the only non-stdlib dependency
(already used by fleet-watchdog.py).
"""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parents[2]
FLEET_YAML = REPO_ROOT / "sartor" / "memory" / "business" / "fleet.yaml"
HOURS_LOG = REPO_ROOT / "sartor" / "memory" / "business" / "hours-log" / "all-hours.csv"

FIN_DIR = REPO_ROOT / "data" / "financial" / "solar-inference"
EXPENSES_CSV = FIN_DIR / "expenses-2026.csv"
REVENUE_CSV = FIN_DIR / "revenue-2026.csv"
POWER_CSV = FIN_DIR / "power-2026.csv"
CAPITAL_YAML = FIN_DIR / "capital-accounts.yaml"

OUT_JSON = FIN_DIR / "books-2026.json"
OUT_MD = FIN_DIR / "STATEMENTS-2026.md"

TAX_YEAR = 2026
# §469 material-participation thresholds (the two that matter here).
SEC469_500 = 500.0   # >500h: material participation (safe-harbor test 1)
SEC469_100 = 100.0   # >100h AND >= anyone else: test 3

# §50(c)(3): the depreciable basis of energy property is reduced by 50% of the ITC.
SEC50_BASIS_REDUCTION_FRACTION = 0.5


def utc_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def fnum(x) -> float | None:
    """Parse a money/number cell. '$1,234.50' -> 1234.5. Blank/garbage -> None."""
    if x is None:
        return None
    s = str(x).strip().replace("$", "").replace(",", "")
    if s == "" or s.lower() in {"null", "none", "n/a", "na", "-"}:
        return None
    neg = s.startswith("(") and s.endswith(")")  # accounting negatives
    if neg:
        s = s[1:-1]
    try:
        v = float(s)
    except ValueError:
        return None
    return -v if neg else v


def read_csv_rows(path: Path) -> tuple[list[dict], list[str]]:
    """Return (rows, warnings). Missing/empty file -> ([], [warning])."""
    if not path.exists():
        return [], [f"MISSING: {path.relative_to(REPO_ROOT)} does not exist (pending seed)."]
    try:
        text = path.read_text(encoding="utf-8-sig")  # tolerate BOM from Windows tooling
    except OSError as e:
        return [], [f"UNREADABLE: {path.relative_to(REPO_ROOT)} ({e})."]
    rows = list(csv.DictReader(text.splitlines()))
    if not rows:
        return [], [f"EMPTY: {path.relative_to(REPO_ROOT)} has a header but no data rows (pending seed)."]
    # Normalize header keys to lowercase/trimmed for tolerant column lookup.
    norm = []
    for r in rows:
        norm.append({(k or "").strip().lower(): v for k, v in r.items()})
    return norm, []


def pick(row: dict, *candidates: str):
    """First present, non-empty value among candidate column names (lowercased)."""
    for c in candidates:
        if c in row and (row[c] or "").strip() != "":
            return row[c]
    return None


# --- expenses / cost basis -----------------------------------------------------

def load_expenses(warnings: list) -> tuple[list[dict], dict, dict]:
    """Return (rows, cost_basis_by_host, expenses_by_category).

    cost_basis = sum of rows where treatment/type == 'capitalize', grouped by
    machine_hostname. Non-capitalized rows roll into expenses_by_category.
    """
    rows, w = read_csv_rows(EXPENSES_CSV)
    warnings.extend(w)
    cost_basis: dict[str, float] = {}
    by_category: dict[str, float] = {}
    blank_amount_rows = 0
    for r in rows:
        # `capitalize_or_expense` is the seeded flag (capitalize|expense). Fall back
        # to other treatment-style columns. Note: `capital_treatment` here means
        # contribution|llc-direct (the funding source), NOT the capitalize flag.
        treatment = (pick(r, "capitalize_or_expense", "treatment", "type", "disposition", "tax_treatment")
                     or "").strip().lower()
        host = (pick(r, "machine_hostname", "hostname", "machine", "asset_hostname") or "").strip()
        category = (pick(r, "category", "expense_category", "account") or "uncategorized").strip().lower()
        is_capital = treatment in {"capitalize", "capitalized", "capital", "asset", "fixed_asset"}
        amt = fnum(pick(r, "amount", "amount_usd", "cost", "total"))
        if amt is None:
            # Row exists but dollar figure is unknown (e.g. AMOUNT UNKNOWN placeholders).
            blank_amount_rows += 1
            continue
        if is_capital:
            key = host or "unassigned"
            cost_basis[key] = cost_basis.get(key, 0.0) + amt
        else:
            by_category[category] = by_category.get(category, 0.0) + amt
    if blank_amount_rows:
        warnings.append(
            f"EXPENSES: {blank_amount_rows} row(s) have no dollar amount (AMOUNT UNKNOWN placeholders) -> "
            f"EXCLUDED from totals. Pull figures from card statements / invoices to complete the ledger.")
    if rows and not cost_basis:
        warnings.append(
            "EXPENSES: no rows flagged capitalize -> cost basis is $0 for every machine. "
            "If equipment was purchased, the capitalize rows are pending seed.")
    return rows, cost_basis, by_category


# --- revenue -------------------------------------------------------------------

def _row_date(r: dict):
    raw = pick(r, "date", "period_end", "txn_date", "month", "period", "period_start")
    if not raw:
        return None
    raw = raw.strip()
    for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%m/%d/%Y", "%Y-%m"):
        try:
            return datetime.strptime(raw, fmt).date()
        except ValueError:
            continue
    return None


def load_revenue(warnings: list, mtd_month: int) -> tuple[float, dict, dict]:
    """Return (revenue_ytd, revenue_ytd_by_host, revenue_mtd_by_host)."""
    rows, w = read_csv_rows(REVENUE_CSV)
    warnings.extend(w)
    total = 0.0
    ytd_by_host: dict[str, float] = {}
    mtd_by_host: dict[str, float] = {}
    undated = 0
    placeholder_rows = 0
    for r in rows:
        # Prefer NET (after vast.ai fee) for the income statement; fall back to gross.
        amt = fnum(pick(r, "net_usd", "amount", "amount_usd", "revenue", "net",
                        "gross_usd", "gross", "earnings"))
        if amt is None:
            placeholder_rows += 1
            continue
        host = (pick(r, "machine_hostname", "hostname", "machine") or "unassigned").strip()
        d = _row_date(r)
        total += amt
        ytd_by_host[host] = ytd_by_host.get(host, 0.0) + amt
        if d is None:
            undated += 1
        elif d.year == TAX_YEAR and d.month == mtd_month:
            mtd_by_host[host] = mtd_by_host.get(host, 0.0) + amt
    if undated:
        warnings.append(
            f"REVENUE: {undated} row(s) have no parseable date -> counted in YTD but EXCLUDED from MTD.")
    if placeholder_rows:
        warnings.append(
            f"REVENUE: {placeholder_rows} placeholder row(s) with no dollar amount -> EXCLUDED. "
            f"YTD reflects only single-day actuals pulled so far; full per-day backfill is blocked by the "
            f"vast.ai date-range CLI bug (see revenue-2026.csv notes). YTD is an UNDERSTATEMENT.")
    return total, ytd_by_host, mtd_by_host


# --- power / business-use fraction ---------------------------------------------

def load_power(warnings: list) -> tuple[dict, float | None]:
    """Return (business_kwh_by_host, total_business_kwh or None).

    None total means no power data at all -> ITC business fraction is UNMEASURED.
    """
    rows, w = read_csv_rows(POWER_CSV)
    if not POWER_CSV.exists():
        # Soften the message: power-2026.csv "may not exist yet" per the spec.
        warnings.append(
            "POWER: data/financial/solar-inference/power-2026.csv does not exist -> "
            "business-use fraction UNMEASURED (see VERIFICATION C1; rtxserver has no logger per fleet.yaml).")
        return {}, None
    warnings.extend(w)
    by_host: dict[str, float] = {}
    for r in rows:
        kwh = fnum(pick(r, "business_kwh", "kwh", "business_kwh_total"))
        if kwh is None:
            continue
        host = (pick(r, "machine_hostname", "hostname", "machine") or "unassigned").strip()
        by_host[host] = by_host.get(host, 0.0) + kwh
    if not by_host:
        warnings.append("POWER: file present but no business_kwh rows -> business-use fraction UNMEASURED.")
        return {}, None
    return by_host, sum(by_host.values())


# --- capital accounts ----------------------------------------------------------

def load_capital(warnings: list) -> tuple[list[dict], float | None, dict]:
    """Return (members, total_equity, meta). Missing -> ([], None, {}) + warning.

    Member equity is reconstructed from documented capital CONTRIBUTIONS (the
    seeded schema), not an ending-balance field. exhibit_a_status / cpa_flags
    are surfaced as meta so the statement carries the BLANK-Exhibit-A caveat.
    """
    if not CAPITAL_YAML.exists():
        warnings.append(
            "CAPITAL: data/financial/solar-inference/capital-accounts.yaml does not exist -> "
            "member equity UNKNOWN (pending seed).")
        return [], None, {}
    try:
        data = yaml.safe_load(CAPITAL_YAML.read_text(encoding="utf-8")) or {}
    except yaml.YAMLError as e:
        warnings.append(f"CAPITAL: capital-accounts.yaml failed to parse ({e}).")
        return [], None, {}
    members = data.get("members") or data.get("capital_accounts") or []
    meta = {
        "exhibit_a_status": data.get("exhibit_a_status"),
        "cpa_flags": data.get("cpa_flags") or [],
    }
    if not isinstance(members, list) or not members:
        warnings.append("CAPITAL: capital-accounts.yaml present but no `members` list -> equity UNKNOWN.")
        return [], None, meta
    out = []
    total = 0.0
    have_any = False
    for m in members:
        if not isinstance(m, dict):
            continue
        # Documented contributions = working proxy for member capital. Prefer the
        # pre-summed field; else sum the contributions list (skipping null amounts).
        bal = fnum(m.get("documented_contributions_total_usd",
                         m.get("ending_capital", m.get("capital_balance", m.get("balance")))))
        if bal is None and isinstance(m.get("contributions"), list):
            s = sum(v for v in (fnum(c.get("amount_usd")) for c in m["contributions"]
                                if isinstance(c, dict)) if v is not None)
            bal = round(s, 2) if m["contributions"] else None
        out.append({
            "member": m.get("name") or m.get("member") or "unnamed",
            "ownership_pct": m.get("ownership_pct"),
            "documented_contributions": bal,
        })
        if bal is not None:
            total += bal
            have_any = True
    if meta.get("exhibit_a_status") == "BLANK":
        warnings.append(
            "CAPITAL: Operating Agreement Exhibit A is BLANK. Member equity shown is a reconstruction from "
            "documented contributions; all trace to Alton's cards (Aneeta $0 documented). 50/50 ownership "
            "does NOT imply 50/50 capital accounts — CPA must ratify before this drives M-2/K-1.")
    return out, (total if have_any else None), meta


# --- hours / §469 --------------------------------------------------------------

def load_hours(warnings: list) -> dict:
    """YTD human hours for §469, with explicit source + bot-inflation flag."""
    result = {
        "ytd_human_hours": None,
        "source_column": None,
        "is_bot_inflated_source": None,
        "distance_to_500": None,
        "distance_to_100": None,
        "note": None,
    }
    if not HOURS_LOG.exists():
        warnings.append("HOURS: all-hours.csv missing -> §469 hours UNKNOWN.")
        result["note"] = "hours-log missing"
        return result
    rows, w = read_csv_rows(HOURS_LOG)
    warnings.extend(w)
    if not rows:
        result["note"] = "hours-log empty"
        return result
    header = set(rows[0].keys())
    # Prefer a fixed (human-only) column if the extractor has been fixed; else
    # fall back to solar_inference_hours and FLAG it as the un-fixed source.
    if "human_interactive_hours" in header:
        col, bot_inflated = "human_interactive_hours", False
    elif "solar_inference_hours" in header:
        col, bot_inflated = "solar_inference_hours", True
        warnings.append(
            "HOURS-§469: using `solar_inference_hours` — the un-fixed (bot-inflated) column. "
            "Per VERIFICATION C3 it does not separate Alton's keyboard time from cron + autonomous "
            "AI-agent activity, and is not a defensible §1.469-5T(f)(4) record. Hours likely OVERSTATED.")
    else:
        warnings.append("HOURS-§469: neither human_interactive_hours nor solar_inference_hours column found.")
        result["note"] = "no recognized hours column"
        return result

    total = 0.0
    counted = 0
    for r in rows:
        d = _row_date(r)
        if d is not None and d.year != TAX_YEAR:
            continue
        v = fnum(r.get(col))
        if v is not None:
            total += v
            counted += 1
    total = round(total, 2)
    result.update({
        "ytd_human_hours": total,
        "source_column": col,
        "is_bot_inflated_source": bot_inflated,
        "distance_to_500": round(max(0.0, SEC469_500 - total), 2),
        "distance_to_100": round(max(0.0, SEC469_100 - total), 2),
        "rows_counted": counted,
    })
    if bot_inflated:
        result["note"] = ("Source is bot-inflated solar_inference_hours; treat as an UPPER bound, not a "
                          "§469 substantiation record. Fix the extractor (human_interactive_hours) before relying on it.")
    return result


# --- depreciation --------------------------------------------------------------

def build_depreciation(machines: list, cost_basis: dict, warnings: list) -> tuple[list, dict]:
    """Per-machine MACRS-200DB 5yr with 100% bonus (2026). Solar shown PENDING."""
    items = []
    year1_by_host = {}
    for m in machines:
        host = m.get("hostname")
        asset = m.get("asset") or {}
        dep = asset.get("depreciation") or {}
        basis = cost_basis.get(host)
        in_service = asset.get("in_service_date")
        bonus = bool(dep.get("bonus_eligible"))
        method = dep.get("method", "MACRS-200DB")
        years = dep.get("recovery_years", 5)

        year1 = None
        if basis is None:
            warnings.append(
                f"DEPRECIATION[{host}]: no capitalized cost basis in expense ledger -> "
                f"year-1 depreciation cannot be computed (pending seed).")
        elif in_service is None:
            warnings.append(
                f"DEPRECIATION[{host}]: basis ${'%.2f' % basis} present but in_service_date is null -> "
                f"not yet placed in service; no current-year depreciation.")
        else:
            # 100% bonus in 2026 (OBBB, permanent) -> entire basis expensed year 1.
            year1 = round(basis * (1.0 if bonus else _macrs_5yr_year1_factor()), 2)
            year1_by_host[host] = year1

        items.append({
            "asset": f"{host} ({m.get('gpu_model')})",
            "hostname": host,
            "cost_basis": None if basis is None else round(basis, 2),
            "in_service_date": in_service,
            "method": f"{method} {years}yr",
            "bonus_eligible": bonus,
            "bonus_pct_2026": 100 if bonus else 0,
            "year1_depreciation": year1,
        })

    # Solar — always PENDING until placed_in_service is set.
    items.append(_solar_depreciation_item(warnings))
    return items, year1_by_host


def _macrs_5yr_year1_factor() -> float:
    # 200% DB, half-year convention, 5-yr: 20% year 1. (Only used if bonus is off.)
    return 0.20


def _solar_depreciation_item(warnings: list) -> dict:
    return {
        "asset": "Tesla Solar Roof (22.10 kW)",
        "hostname": "solar",
        "cost_basis": None,
        "in_service_date": None,
        "method": "MACRS-200DB 5yr (energy property)",
        "bonus_eligible": True,
        "bonus_pct_2026": 100,
        "year1_depreciation": None,
        "status": "PENDING — solar.placed_in_service is null in fleet.yaml; no depreciation until in service. "
                  "Depreciable basis is the §50(c)(3)-reduced, business-use-allocated amount, not the full contract.",
    }


# --- ITC worksheet (THE LOAD-BEARING ONE) --------------------------------------

def build_itc(solar: dict, total_business_kwh: float | None, warnings: list) -> dict:
    contract = fnum(solar.get("contract_total_usd"))
    annual_gen = fnum(solar.get("annual_generation_kwh"))
    rate = solar.get("itc_rate", 0.30)
    section = solar.get("itc_section", "48E")
    placed = solar.get("placed_in_service")

    # Business-use fraction: MEASURED only. Never assumed.
    if total_business_kwh is None or annual_gen in (None, 0):
        business_fraction = None
        fraction_basis = ("UNMEASURED — cannot compute. No power data (power-2026.csv absent / no logger "
                          "on rtxserver). See VERIFICATION C1. Do NOT assume a fraction.")
        warnings.append(
            "ITC: business_use_fraction is UNMEASURED — the load-bearing unknown. The single ITC dollar "
            "figure cannot be computed; only the labeled scenario RANGE below is defensible.")
    else:
        business_fraction = round(total_business_kwh / annual_gen, 4)
        fraction_basis = (f"MEASURED kWh-based: sum(business_kwh)={total_business_kwh:.1f} / "
                          f"annual_generation_kwh={annual_gen:.0f}. NOTE: a kWh metric is defensible but "
                          f"UNSETTLED (CPA/exam call); home-office use-% is the conventional method (VERIFICATION C1).")

    # §50(c)(3): depreciable basis reduced by 50% of the credit. Reported, not folded into the credit math.
    basis_reduction_note = (
        "Per §50(c)(3): the depreciable basis of the energy property is reduced by 50% of the ITC "
        "claimed. The $373,005 figure in prior docs is that half-credit-reduced basis (confirmed "
        "VERIFICATION C1/C4), NOT a business-use haircut.")

    # SCENARIO range — explicitly labeled, NOT a single fabricated number.
    scenarios = []
    if contract is not None:
        full_credit = round(contract * rate, 2)  # 30% x full basis = the OVERSTATED plan figure
        scenarios = [
            {"label": "GPU-only (low)", "business_use_pct": 24,
             "itc_estimate": round(contract * rate * 0.24, 2),
             "note": "GPU-only kWh ~24% of generation. The conservative floor."},
            {"label": "dual-rig (high)", "business_use_pct": 64,
             "itc_estimate": round(contract * rate * 0.64, 2),
             "note": "Both rigs counted ~64%. Could go higher if LLC-owned net-metered grid exports "
                     "count as production of income (VERIFICATION C1)."},
        ]
        overstated_note = (f"Prior plan computed {rate:.0%} x full ${contract:,.0f} = ${full_credit:,.2f} "
                          f"with NO business-use reduction — OVERSTATED and not defensible (VERIFICATION C1).")
    else:
        full_credit = None
        overstated_note = "contract_total_usd missing from fleet.yaml -> cannot compute scenarios."
        warnings.append("ITC: solar.contract_total_usd missing -> scenario range cannot be computed.")

    return {
        "itc_section": section,
        "rate": rate,
        "basis_contract_usd": contract,
        "placed_in_service": placed,
        "status": "PENDING" if placed is None else "IN SERVICE",
        "business_use_fraction": business_fraction,
        "business_use_fraction_basis": fraction_basis,
        "section_50c3_basis_reduction": basis_reduction_note,
        "scenario_range": scenarios,
        "single_number_warning": overstated_note,
        "obbb_facts": {
            "section_25d_status": "DEAD for expenditures after 12/31/2025 (OBBB) — personal fraction gets ZERO credit.",
            "begin_construction_deadline": solar.get("begin_construction_deadline"),
            "begin_construction_note": (
                "July 4/5 2026 is a HARD STATUTORY begin-construction deadline (OBBB + Notice 2025-42), "
                "NOT placed-in-service. 5% safe harbor (system <=1.5 MW; 22.10 kW qualifies) lets PIS slip "
                "to ~2029-2030 with full credit if construction begins by then (VERIFICATION C4)."),
            "bonus_depreciation_2026": "100% PERMANENT under OBBB (resolves the old 80%-vs-100% open question).",
            "begin_construction_locked": solar.get("begin_construction_locked"),
        },
        "reference": "matters/solar-itc-48-vs-25d.md; projects/fleet-ledger-2026-05-28/VERIFICATION.md (C1, C2, C4).",
    }


# --- assembly ------------------------------------------------------------------

def build_books(args) -> dict:
    warnings: list[str] = []

    if not FLEET_YAML.exists():
        # Cannot proceed without the spine; emit a minimal valid doc + warning.
        warnings.append(f"FATAL-SOFT: {FLEET_YAML.relative_to(REPO_ROOT)} missing — no machines to iterate.")
        fleet = {}
    else:
        fleet = yaml.safe_load(FLEET_YAML.read_text(encoding="utf-8")) or {}

    machines = fleet.get("machines", []) or []
    solar = fleet.get("solar", {}) or {}
    electricity = fleet.get("electricity", {}) or {}

    as_of = datetime.now(timezone.utc).date()
    mtd_month = as_of.month

    # --- ledgers ---
    _exp_rows, cost_basis, expenses_by_cat = load_expenses(warnings)
    revenue_ytd, rev_ytd_by_host, rev_mtd_by_host = load_revenue(warnings, mtd_month)
    business_kwh_by_host, total_business_kwh = load_power(warnings)
    members, total_equity, capital_meta = load_capital(warnings)
    hours = load_hours(warnings)

    expenses_ytd = round(sum(expenses_by_cat.values()), 2) if expenses_by_cat else 0.0
    if not expenses_by_cat:
        warnings.append("INCOME-STMT: no expensed (non-capitalized) rows -> expenses_ytd = $0 (pending seed).")
    if revenue_ytd == 0.0:
        warnings.append("INCOME-STMT: revenue_ytd = $0 — revenue ledger empty/absent (pending seed; C6).")

    net = round(revenue_ytd - expenses_ytd, 2)

    # --- depreciation ---
    depreciation, year1_by_host = build_depreciation(machines, cost_basis, warnings)

    # Cost basis assigned to a host NOT in fleet.yaml (e.g. rig3, staged, commented out).
    # It IS in equipment-at-cost but has no depreciation/per-machine row — flag it.
    fleet_hostset = {m.get("hostname") for m in machines}
    for host, basis in cost_basis.items():
        if host not in fleet_hostset:
            warnings.append(
                f"COST-BASIS[{host}]: ${basis:,.2f} capitalized but '{host}' is NOT in fleet.yaml machines "
                f"(staged/commented-out). Included in equipment-at-cost; NOT depreciated and NOT in the "
                f"per-machine rollup until the machine stanza is added to fleet.yaml.")

    # --- balance sheet ---
    equipment_at_cost = round(sum(v for v in cost_basis.values()), 2) if cost_basis else 0.0
    accumulated_depreciation = round(sum(year1_by_host.values()), 2) if year1_by_host else 0.0
    net_equipment = round(equipment_at_cost - accumulated_depreciation, 2)

    # Liability: Climate First loan — only if a balance is tracked somewhere we read.
    climate_first = _climate_first_liability(fleet, members, warnings)

    balance_sheet = {
        "assets": {
            "equipment_at_cost": equipment_at_cost,
            "less_accumulated_depreciation": accumulated_depreciation,
            "net_equipment": net_equipment,
            "solar_asset": None,
            "solar_asset_note": ("PENDING — solar.placed_in_service is null; the Tesla Solar Roof is not "
                                 "yet capitalized on SI's books. Cost basis / business-allocation set when in service."),
            "cash": None,
            "cash_note": "Chase business account balance not tracked in any read input (pending seed).",
        },
        "liabilities": {
            "climate_first_loan": climate_first,
        },
        "equity": {
            "member_capital_accounts": members,
            "total_member_equity": total_equity,
            "exhibit_a_status": capital_meta.get("exhibit_a_status"),
            "cpa_flags": capital_meta.get("cpa_flags", []),
        },
    }

    # --- per-machine rollup ---
    machine_rows = []
    for m in machines:
        host = m.get("hostname")
        machine_rows.append({
            "hostname": host,
            "gpu_model": m.get("gpu_model"),
            "role": m.get("role"),
            "revenue_ytd": round(rev_ytd_by_host.get(host, 0.0), 2),
            "revenue_mtd": round(rev_mtd_by_host.get(host, 0.0), 2),
            "cost_basis": None if cost_basis.get(host) is None else round(cost_basis[host], 2),
            "year1_depreciation": year1_by_host.get(host),
            "business_kwh_ytd": business_kwh_by_host.get(host),
        })

    # Revenue assigned to a host not in fleet.yaml -> flag (don't silently drop).
    fleet_hosts = {m.get("hostname") for m in machines}
    for host in rev_ytd_by_host:
        if host not in fleet_hosts and host != "unassigned":
            warnings.append(f"REVENUE: host '{host}' has revenue but is not in fleet.yaml machines.")

    itc = build_itc(solar, total_business_kwh, warnings)

    books = {
        "schema_version": "1.0",
        "entity": "Solar Inference LLC",
        "ein_on_file": True,  # EIN is in BUSINESS.md; never emit the value here.
        "tax_year": TAX_YEAR,
        "generated_utc": utc_iso(),
        "generated_by": "scripts/fleet/books.py",
        "as_of_date": as_of.isoformat(),
        "source_files": {
            "config_spine": str(FLEET_YAML.relative_to(REPO_ROOT)),
            "expenses": str(EXPENSES_CSV.relative_to(REPO_ROOT)),
            "revenue": str(REVENUE_CSV.relative_to(REPO_ROOT)),
            "power": str(POWER_CSV.relative_to(REPO_ROOT)),
            "capital_accounts": str(CAPITAL_YAML.relative_to(REPO_ROOT)),
            "hours_log": str(HOURS_LOG.relative_to(REPO_ROOT)),
        },
        "income_statement": {
            "revenue_ytd": round(revenue_ytd, 2),
            "expenses_ytd": expenses_ytd,
            "expenses_by_category": {k: round(v, 2) for k, v in sorted(expenses_by_cat.items())},
            "net": net,
        },
        "balance_sheet": balance_sheet,
        "depreciation": depreciation,
        "itc_worksheet": itc,
        "section_469_hours": hours,
        "machines": machine_rows,
        "electricity": {
            "nj_residential_usd_per_kwh": electricity.get("nj_residential_usd_per_kwh"),
            "cooling_overhead_pct": electricity.get("cooling_overhead_pct"),
        },
        "warnings": warnings,
    }
    return books


def _climate_first_liability(fleet: dict, members: list, warnings: list) -> dict:
    """Climate First loan balance only appears if explicitly tracked. Else: note."""
    # Not present in any read input today. Surface as a tracked-elsewhere note,
    # never fabricate a balance.
    warnings.append(
        "LIABILITY: Climate First solar loan balance not present in any read input "
        "(capital-accounts.yaml / ledgers). Reported as null with a note; do not infer a balance.")
    return {
        "balance": None,
        "note": "Climate First solar loan exists (financed the Tesla roof) but no balance is tracked in "
                "books inputs. Pull amortization schedule into capital-accounts.yaml or a liabilities ledger.",
    }


# --- markdown statements -------------------------------------------------------

def money(x) -> str:
    if x is None:
        return "_(pending)_"
    return f"${x:,.2f}"


def render_markdown(b: dict) -> str:
    L = []
    isd = b["income_statement"]
    bs = b["balance_sheet"]
    itc = b["itc_worksheet"]
    h = b["section_469_hours"]

    L.append("---")
    L.append("entity: Solar Inference LLC")
    L.append(f"tax_year: {b['tax_year']}")
    L.append(f"generated_utc: {b['generated_utc']}")
    L.append("type: financial-statements")
    L.append("audience: CPA (Jonathan Francis) — analytical support, NOT filing guidance")
    L.append("source: scripts/fleet/books.py")
    L.append("privacy: LOCAL-ONLY (data/financial/, gitignored) — contains dollar amounts")
    L.append("---")
    L.append("")
    L.append(f"# Solar Inference LLC — Financial Statements (TY{b['tax_year']})")
    L.append("")
    L.append(f"_Generated {b['generated_utc']} from {b['source_files']['config_spine']} + the "
             f"data/financial/solar-inference/ ledgers. As-of {b['as_of_date']}. "
             f"Not tax advice; analytical support for CPA discussion._")
    L.append("")

    if b["warnings"]:
        L.append("> [!warning] This statement was generated from PARTIALLY SEEDED inputs. "
                 f"{len(b['warnings'])} input(s) are missing/empty/unmeasured. See the Warnings section — "
                 "every pending input is listed explicitly. No figure here is fabricated; absences are null.")
        L.append("")

    # Income statement
    L.append("## Income Statement (YTD)")
    L.append("")
    L.append("| Line | Amount |")
    L.append("|------|--------|")
    L.append(f"| Revenue (YTD) | {money(isd['revenue_ytd'])} |")
    if isd["expenses_by_category"]:
        for cat, amt in isd["expenses_by_category"].items():
            L.append(f"| Expense — {cat} | {money(amt)} |")
    L.append(f"| **Total expenses (YTD)** | {money(isd['expenses_ytd'])} |")
    L.append(f"| **Net** | {money(isd['net'])} |")
    L.append("")

    # Balance sheet
    L.append("## Balance Sheet")
    L.append("")
    a = bs["assets"]
    L.append("### Assets")
    L.append("")
    L.append("| Asset | Amount |")
    L.append("|-------|--------|")
    L.append(f"| Equipment at cost | {money(a['equipment_at_cost'])} |")
    L.append(f"| Less: accumulated depreciation | ({money(a['less_accumulated_depreciation'])}) |")
    L.append(f"| **Net equipment** | {money(a['net_equipment'])} |")
    L.append(f"| Solar asset | {money(a['solar_asset'])} |")
    L.append(f"| Cash | {money(a['cash'])} |")
    L.append("")
    L.append(f"- Solar: {a['solar_asset_note']}")
    L.append(f"- Cash: {a['cash_note']}")
    L.append("")
    L.append("### Liabilities")
    L.append("")
    cf = bs["liabilities"]["climate_first_loan"]
    L.append(f"- Climate First loan: {money(cf['balance'])} — {cf['note']}")
    L.append("")
    L.append("### Equity (member capital accounts)")
    L.append("")
    eq = bs["equity"]
    if eq.get("exhibit_a_status") == "BLANK":
        L.append("> [!warning] Operating Agreement Exhibit A is **BLANK**. The figures below are a "
                 "reconstruction from documented contributions, all tracing to Alton's personal cards "
                 "(Aneeta $0 documented). **50/50 ownership does NOT imply 50/50 capital accounts.** "
                 "CPA must ratify before this drives Schedule M-2 / K-1.")
        L.append("")
    if eq["member_capital_accounts"]:
        L.append("| Member | Ownership % | Documented contributions |")
        L.append("|--------|-------------|--------------------------|")
        for m in eq["member_capital_accounts"]:
            pct = m.get("ownership_pct")
            pct_s = "_(pending)_" if pct is None else f"{pct}%"
            L.append(f"| {m['member']} | {pct_s} | {money(m.get('documented_contributions'))} |")
        L.append(f"| **Total member equity (documented)** | | {money(eq['total_member_equity'])} |")
        if eq.get("cpa_flags"):
            L.append("")
            L.append("CPA flags (from capital-accounts.yaml):")
            for f in eq["cpa_flags"]:
                L.append(f"- {f}")
    else:
        L.append("- _(pending seed — capital-accounts.yaml absent or empty)_")
    L.append("")

    # Depreciation
    L.append("## Depreciation Schedule")
    L.append("")
    L.append("| Asset | Cost basis | In service | Method | Bonus | Year-1 depreciation |")
    L.append("|-------|-----------|-----------|--------|-------|---------------------|")
    for d in b["depreciation"]:
        bonus = f"{d['bonus_pct_2026']}%" if d["bonus_eligible"] else "no"
        L.append(f"| {d['asset']} | {money(d['cost_basis'])} | {d['in_service_date'] or '_(pending)_'} | "
                 f"{d['method']} | {bonus} | {money(d['year1_depreciation'])} |")
    L.append("")
    L.append("- 2026 bonus depreciation is **100% PERMANENT** (OBBB); year-1 = full basis for placed-in-service assets.")
    solar_dep = next((d for d in b["depreciation"] if d["hostname"] == "solar"), None)
    if solar_dep:
        L.append(f"- Solar: {solar_dep.get('status')}")
    L.append("")

    # ITC worksheet
    L.append("## ITC Worksheet — Solar Roof (THE LOAD-BEARING ANALYSIS)")
    L.append("")
    L.append(f"- **Section:** §{itc['itc_section']} (Clean Electricity Investment Credit; replaced §48 for PIS after 12/31/2024)")
    L.append(f"- **Rate:** {itc['rate']:.0%}")
    L.append(f"- **Basis (contract):** {money(itc['basis_contract_usd'])}")
    L.append(f"- **Placed in service:** {itc['placed_in_service'] or 'null'} → status **{itc['status']}**")
    L.append(f"- **Business-use fraction:** "
             + (f"{itc['business_use_fraction']:.2%}" if itc["business_use_fraction"] is not None else "**UNMEASURED**"))
    L.append(f"  - {itc['business_use_fraction_basis']}")
    L.append(f"- **§50(c)(3) basis reduction:** {itc['section_50c3_basis_reduction']}")
    L.append("")
    L.append(f"> [!danger] {itc['single_number_warning']}")
    L.append("")
    if itc["scenario_range"]:
        L.append("**ITC scenario range (labeled scenarios — NOT a single number):**")
        L.append("")
        L.append("| Scenario | Business-use % | ITC estimate | Note |")
        L.append("|----------|----------------|--------------|------|")
        for s in itc["scenario_range"]:
            L.append(f"| {s['label']} | {s['business_use_pct']}% | {money(s['itc_estimate'])} | {s['note']} |")
        L.append("")
    obbb = itc["obbb_facts"]
    L.append("**OBBB / Notice 2025-42 facts (from fleet.yaml.solar):**")
    L.append("")
    L.append(f"- §25D: {obbb['section_25d_status']}")
    L.append(f"- Begin-construction deadline: **{obbb['begin_construction_deadline']}** — {obbb['begin_construction_note']}")
    L.append(f"- Begin-construction locked: {obbb['begin_construction_locked'] or 'null (NOT yet locked — highest-leverage action)'}")
    L.append(f"- Bonus depreciation 2026: {obbb['bonus_depreciation_2026']}")
    L.append(f"- Reference: {itc['reference']}")
    L.append("")

    # §469
    L.append("## §469 Material-Participation Hours")
    L.append("")
    if h.get("ytd_human_hours") is None:
        L.append("- _(pending — hours source unavailable)_")
    else:
        L.append(f"- **YTD hours:** {h['ytd_human_hours']} (source column: `{h['source_column']}`)")
        L.append(f"- Distance to 500-hr test: **{h['distance_to_500']}h**")
        L.append(f"- Distance to 100-hr test: **{h['distance_to_100']}h**")
        if h.get("is_bot_inflated_source"):
            L.append(f"- > [!warning] BOT-INFLATED SOURCE. {h['note']}")
        if h.get("note") and not h.get("is_bot_inflated_source"):
            L.append(f"- {h['note']}")
    L.append("")

    # Per-machine
    L.append("## Per-Machine Rollup")
    L.append("")
    L.append("| Host | GPU | Role | Revenue YTD | Revenue MTD | Cost basis | Year-1 depr. |")
    L.append("|------|-----|------|-------------|-------------|-----------|--------------|")
    for m in b["machines"]:
        L.append(f"| {m['hostname']} | {m['gpu_model']} | {m['role']} | {money(m['revenue_ytd'])} | "
                 f"{money(m['revenue_mtd'])} | {money(m['cost_basis'])} | {money(m['year1_depreciation'])} |")
    L.append("")

    # Warnings
    L.append("## Warnings (every unknown / pending-seed / unmeasured input)")
    L.append("")
    if b["warnings"]:
        for w in b["warnings"]:
            L.append(f"- {w}")
    else:
        L.append("- None — all inputs present.")
    L.append("")
    return "\n".join(L)


def main() -> int:
    ap = argparse.ArgumentParser(description="Solar Inference LLC books generator")
    ap.add_argument("--dry-run", action="store_true",
                    help="Print the books JSON to stdout; do not write output files.")
    ap.add_argument("--json-out", type=Path, default=OUT_JSON)
    ap.add_argument("--md-out", type=Path, default=OUT_MD)
    args = ap.parse_args()

    books = build_books(args)
    md = render_markdown(books)

    if args.dry_run:
        print(json.dumps(books, indent=2))
        print(f"\n[DRY-RUN] {len(books['warnings'])} warning(s); files NOT written.")
        return 0

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(books, indent=2), encoding="utf-8")
    args.md_out.write_text(md, encoding="utf-8")

    print(f"Wrote {args.json_out}")
    print(f"Wrote {args.md_out}")
    print(f"\nTop-level books-2026.json keys: {list(books.keys())}")
    print(f"\n{len(books['warnings'])} warning(s):")
    for w in books["warnings"]:
        print(f"  - {w}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except SystemExit:
        raise
    except Exception as e:  # books generation must not crash silently
        import sys
        print(f"ERROR {type(e).__name__}: {e}", file=sys.stderr)
        raise SystemExit(1)
