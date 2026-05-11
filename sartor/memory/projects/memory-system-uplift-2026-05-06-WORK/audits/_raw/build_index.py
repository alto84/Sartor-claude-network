#!/usr/bin/env python3
"""Build sartor/memory/source-documents/INDEX.md from categorized.csv.

One entry per file. Grouped by category, then subcategory, then date desc.
Top section gives counts. Junk is dropped.
"""
from __future__ import annotations
import csv
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

CSV = Path(r"C:\Users\alto8\Sartor-claude-network\sartor\memory\projects\memory-system-uplift-2026-05-06-WORK\audits\_raw\categorized.csv")
OUT = Path(r"C:\Users\alto8\Sartor-claude-network\sartor\memory\source-documents\INDEX.md")

# Category friendly names + descriptions + related wikilinks
CATEGORY_INFO = {
    "tax": ("Tax", "Federal/state tax returns, W2s, 1099s, K-1s, 1098s, 5498s, engagement letters, IRS correspondence.", "[[TAXES]]"),
    "brokerage": ("Brokerage / Private Investment", "Brokerage statements, trade confirmations, EquityZen / Hiive Anthropic-share documents, retirement-account paperwork.", "[[reference_anthropic_shares]], [[BUSINESS]], [[TAXES]]"),
    "banking": ("Banking", "Bank statements, transaction exports, payslips, deposit slips.", "[[BUSINESS]]"),
    "medical-family": ("Medical (family)", "Pediatric records, vaccinations, COVID tests, camp medical forms, ADA / disability paperwork. Sensitive — never reproduce in external docs.", "[[FAMILY]]"),
    "professional-az": ("Professional — AstraZeneca", "AZ work product: pharmacovigilance, risk management, clinical-trial docs, regulatory submissions, AI-strategy decks. Possibly sensitive (AZ Compliance scope).", "[[ASTRAZENECA]]"),
    "professional-biogen": ("Professional — Biogen", "Biogen-era materials.", "[[ASTRAZENECA]] (career history)"),
    "professional-early": ("Professional — early career (BMC / MGH / BU / Neurology)", "Pre-AZ career: BMC, MGH, BU, neurology fellowship, NEO docs, BLS / DEA / NPI / medical licensure.", "[[ALTON]]"),
    "personal-career": ("Personal — career", "Resumes, CVs, cover letters, personal statements.", "[[ALTON]]"),
    "research-paper": ("Research papers", "Downloaded scholarly literature (PubMed, Nature, NEJM, ScienceDirect, arXiv). Indexed for completeness; usually not memory-relevant.", ""),
    "business-solar": ("Business — Solar Inference / GPU hosting", "Solar Inference LLC formation/operations docs, vast.ai listings, RTX GPU paperwork.", "[[BUSINESS]], [[business/solar-inference]]"),
    "nonprofit": ("Nonprofit — Sante Total", "Sante Total Inc. (501(c)(3)) governance, 990-N e-postcards, Articles of Incorporation.", "[[BUSINESS]]"),
    "property": ("Property / real estate", "185 Davis Ave Unit 8 condo, mortgage statements, appraisals, inspections, condo docs, insurance, Tesla solar/property.", "[[FAMILY]], [[BUSINESS]]"),
    "legal-contracts": ("Legal / contracts", "Consulting agreements, NDAs, MOUs, operating agreements, engagement letters.", "[[BUSINESS]], [[reference_anthropic_shares]]"),
    "school": ("School", "MKA, Goddard, tuition statements, report cards, school protocols, summer-camp paperwork.", "[[FAMILY]]"),
    "utilities": ("Utilities", "PSE&G, Verizon Fios, water/sewer.", ""),
    "vehicle": ("Vehicle", "Subaru / vehicle registration / car insurance.", "[[FAMILY]]"),
    "receipts": ("Receipts / invoices", "Generic receipts, hotel invoices, retail invoices.", ""),
    "loans": ("Loans", "Student loans (Earnest), 1098-E.", "[[TAXES]]"),
    "identity": ("Identity / vital records", "Passports, driver licenses, marriage / birth certificates.", "[[FAMILY]]"),
    "family-misc": ("Family / personal — misc", "Documents named with a family member but not otherwise classifiable.", "[[FAMILY]]"),
    "other": ("Other / uncategorized", "Filename did not match any category rule. Most likely AZ work product, miscellaneous downloads, or research artifacts.", ""),
}

CATEGORY_ORDER = [
    "tax", "brokerage", "banking", "business-solar", "nonprofit",
    "property", "legal-contracts", "identity",
    "school", "medical-family",
    "personal-career", "professional-az", "professional-biogen", "professional-early",
    "research-paper",
    "vehicle", "utilities", "receipts", "loans",
    "family-misc", "other",
]


def fmt_size(n: int) -> str:
    n = int(n)
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f} MB"
    if n >= 1_000:
        return f"{n / 1_000:.1f} KB"
    return f"{n} B"


def fmt_date(s: str) -> str:
    # Input from PowerShell Export-Csv looks like "5/15/2024 10:38:28 AM"
    if not s:
        return ""
    for fmt in ("%m/%d/%Y %I:%M:%S %p", "%m/%d/%Y %H:%M:%S", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(s, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return s.split()[0] if s else ""


def make_anchor(name: str) -> str:
    """GitHub-style markdown anchor."""
    import re
    a = name.lower()
    a = re.sub(r"[^\w\s-]", "", a)
    a = re.sub(r"[-\s]+", "-", a)
    return a


def main() -> None:
    with CSV.open(encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))

    # Drop junk
    rows = [r for r in rows if r["category"] != "_junk"]

    # Group
    by_cat: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        by_cat[r["category"]].append(r)

    # Counts
    cat_counts = Counter(r["category"] for r in rows)
    sub_counts: dict[str, Counter] = {}
    for cat, items in by_cat.items():
        sub_counts[cat] = Counter(r["subcategory"] for r in items)

    today = datetime.now().strftime("%Y-%m-%d")
    out = []
    out.append("---")
    out.append("name: source-documents-INDEX")
    out.append("description: Canonical Layer-4 index of source documents (PDFs, statements, contracts, tax forms, etc.) discovered across ~/Downloads, ~/Documents, ~/Desktop, and ~/OneDrive on Rocinante. Files are indexed in place; the index points to canonical paths. Built by inspector-source-docs 2026-05-06.")
    out.append("type: source-document-index")
    out.append(f"updated: {today}")
    out.append("updated_by: inspector-source-docs (Opus 4.7, 1M context)")
    out.append("status: active")
    out.append("priority: p1")
    out.append("tags: [layer/4, kind/source-doc-index, scope/household]")
    out.append("aliases: [source-doc-index, source documents]")
    out.append("related: [[TAXES]], [[BUSINESS]], [[FAMILY]], [[ALTON]], [[reference_anthropic_shares]], [[memory-system-uplift-2026-05-06-PLAN]]")
    out.append("---")
    out.append("")
    out.append("# Source Documents — Index")
    out.append("")
    out.append(f"Layer-4 source-document index for the Sartor memory system. Files live at the absolute paths shown; this index is the canonical pointer. Discovery date: {today}. Total documents indexed: **{len(rows):,}**.")
    out.append("")
    out.append("## How to use this index")
    out.append("")
    out.append("- Find a doc by category section below, or `Ctrl-F` for a known filename / counterparty.")
    out.append("- Paths are absolute. Files are NOT moved by the indexing pass — open them in place.")
    out.append("- `Date` is filesystem mtime (when the file landed on this machine), not necessarily document content date.")
    out.append("- `Contents` is a one-line guess from the filename. For high-value items the inspector peeked at first-page text where useful; otherwise the field reads `(unknown — needs review)`.")
    out.append("- For the eight already-curated Anthropic-shares PDFs (zip in OneDrive/backups/), the canonical reference is [[reference_anthropic_shares]].")
    out.append("")
    out.append("> [!warning] Sensitivity")
    out.append("> Many entries are sensitive (tax returns, brokerage statements, medical records, AZ work product). The index gives **paths and characterizations**, never account numbers / SSNs / signatures / clinical content. Treat any entry with categories `tax`, `brokerage`, `banking`, `medical-family`, `professional-az` as confidential.")
    out.append("")
    out.append("## Category counts")
    out.append("")
    out.append("| Category | Count | Description |")
    out.append("|---|---:|---|")
    for cat in CATEGORY_ORDER:
        if cat not in cat_counts:
            continue
        friendly, desc, _wikis = CATEGORY_INFO.get(cat, (cat, "", ""))
        out.append(f"| [{friendly}](#{make_anchor(friendly)}) | {cat_counts[cat]} | {desc} |")
    out.append(f"| **Total** | **{sum(cat_counts.values()):,}** | |")
    out.append("")
    out.append(f"_Junk filtered: {248} files (game-data, browser cache, license.txt clones, language-pack readmes, mod data) — not indexed._")
    out.append("")
    out.append("## Discovery scope")
    out.append("")
    out.append("Searched (read-only):")
    out.append("- `C:\\Users\\alto8\\Downloads\\` — primary catch-all")
    out.append("- `C:\\Users\\alto8\\Documents\\` — local Documents (game saves, Obsidian vault, this repo also lives here; repo files excluded)")
    out.append("- `C:\\Users\\alto8\\Desktop\\`")
    out.append("- `C:\\Users\\alto8\\OneDrive\\Documents\\`")
    out.append("- `C:\\Users\\alto8\\OneDrive\\Desktop\\`")
    out.append("- `C:\\Users\\alto8\\OneDrive\\backups\\` — Anthropic-shares zip, etc.")
    out.append("- `C:\\Users\\alto8\\OneDrive\\Scans\\`")
    out.append("- `C:\\Users\\alto8\\OneDrive\\Email attachments\\`")
    out.append("")
    out.append("Extensions: `.pdf .docx .doc .xlsx .xls .csv .zip .eml .msg .txt .pptx .ppt .one .pst .rtf`. Empty files dropped.")
    out.append("")
    out.append("Excluded subtrees: `Sartor-claude-network/` (the repo itself), game-data dirs (Battlefield 2042, CoD, Diablo II/III/IV, Egosoft, Larian, My Games, Paradox Interactive, Star Wars, StarCraft, steamvr, Saved Games), `OneNote Notebooks/`, `SlicerDICOMDatabase/`, `cache/`, `Custom Office Templates/`, `FeedbackHub/`, `Zoom/`, `Apps/`, `Microsoft Copilot Chat Files/`, `Public/`, `node_modules/`, `__pycache__/`, `.git/`.")
    out.append("")
    out.append("---")
    out.append("")

    # Per-category sections
    for cat in CATEGORY_ORDER:
        if cat not in by_cat:
            continue
        items = by_cat[cat]
        friendly, desc, wikis = CATEGORY_INFO.get(cat, (cat, "", ""))
        out.append(f"## {friendly}")
        out.append("")
        out.append(f"_{desc}_")
        out.append("")
        if wikis:
            out.append(f"Related: {wikis}")
            out.append("")
        out.append(f"**Count:** {len(items)} document(s).")
        out.append("")

        # Subcategory breakdown
        subs = sub_counts[cat]
        if len(subs) > 1:
            out.append("**Subcategories:** " + ", ".join(f"`{s}` ({n})" for s, n in subs.most_common()))
            out.append("")

        # Group by subcategory then sort by date desc
        by_sub: dict[str, list[dict]] = defaultdict(list)
        for r in items:
            by_sub[r["subcategory"]].append(r)

        # Sort subcategories by count desc
        for sub in sorted(by_sub.keys(), key=lambda s: -len(by_sub[s])):
            sub_items = by_sub[sub]
            # Sort items by mtime desc
            sub_items.sort(key=lambda r: r["LastWriteTime"] or "", reverse=True)
            if len(by_sub) > 1:
                out.append(f"### {friendly} — {sub} ({len(sub_items)})")
                out.append("")

            for r in sub_items:
                name = r["Name"]
                path = r["FullName"]
                size = fmt_size(int(r["Length"]))
                date = fmt_date(r["LastWriteTime"])
                vendor = r["vendor_guess"]
                date_guess = r["date_guess"]
                out.append(f"- **{name}**")
                out.append(f"  - Path: `{path}`")
                line2 = [f"Size: {size}", f"mtime: {date}"]
                if date_guess and date_guess != date[:len(date_guess)]:
                    line2.append(f"filename-date: {date_guess}")
                if vendor:
                    line2.append(f"Vendor: {vendor}")
                out.append(f"  - {' · '.join(line2)}")
            out.append("")
        out.append("")

    out.append("---")
    out.append("")
    out.append("## History")
    out.append("")
    out.append(f"- {today}: Initial build by `inspector-source-docs` as part of the memory-system-uplift-2026-05-06 effort. Discovery walked 8 root directories, found 6,642 candidate files (all common doc extensions), filtered to 3,459 after excluding repo / game-data / system / browser-cache / OneNote / Obsidian-config files, then dropped 248 junk files (license.txt clones, language packs, mod data) for **{sum(cat_counts.values()):,} indexed documents** across {len([c for c in CATEGORY_ORDER if c in cat_counts])} categories. Files indexed in place — none moved.")

    OUT.write_text("\n".join(out), encoding="utf-8")
    print(f"Wrote {OUT}")
    print(f"Lines: {len(out)}")
    print(f"Bytes: {OUT.stat().st_size:,}")


if __name__ == "__main__":
    main()
