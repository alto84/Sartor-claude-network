#!/usr/bin/env python3
"""Categorize discovered source documents by filename + path patterns.

Reads enumeration-filtered.csv, writes categorized.csv with category + subcategory + vendor + date_guess.
"""
from __future__ import annotations
import csv
import re
from pathlib import Path

IN = Path(r"C:\Users\alto8\Sartor-claude-network\sartor\memory\projects\memory-system-uplift-2026-05-06-WORK\audits\_raw\enumeration-filtered.csv")
OUT = Path(r"C:\Users\alto8\Sartor-claude-network\sartor\memory\projects\memory-system-uplift-2026-05-06-WORK\audits\_raw\categorized.csv")

# (regex, category, subcategory, vendor) tuples — first match wins
RULES: list[tuple[str, str, str, str]] = [
    # === TAX ===
    (r"(?i)\b(form\s*1040|1040[-_]es|schedule\s*[a-k]|client\s*copy[_ ]individual|government\s*copy[_ ]individual)\b", "tax", "1040-package", ""),
    (r"(?i)\b(W[-_]?2|W2[ _])\b", "tax", "w2", ""),
    (r"(?i)\b(1099[-_]?(misc|nec|int|div|b|r|composite)?|consolidated[-_]form[-_]1099)\b", "tax", "1099", ""),
    (r"(?i)\b(K[-_]?1|schedule[-_ ]?k[-_]?1)\b", "tax", "k1", ""),
    (r"(?i)\b1098(\b|[-_])", "tax", "1098-mortgage-interest", ""),
    (r"(?i)\bForm[-_ ]?5498\b", "tax", "5498-ira", ""),
    (r"(?i)\bForm[-_ ]?5500\b", "tax", "5500-erisa", ""),
    (r"(?i)\b(990|e[- ]?Postcard)\b", "tax", "form-990-nonprofit", "Sante Total"),
    (r"(?i)\b(EPD)\b.*Tax\s*Package", "tax", "epd-tax-package", "EPD"),
    (r"(?i)tax\s*(package|return|prep|engagement|estimate|payment|filing|extension|2018|2019|2020|2021|2022|2023|2024|2025)", "tax", "general", ""),
    (r"(?i)EfileChecklist", "tax", "engagement-letter", "Jonathan Francis CPA"),
    (r"(?i)TaxPrep.*Engage", "tax", "engagement-letter", "Jonathan Francis CPA"),
    (r"(?i)Solar[-_ ]Inference[-_ ]LLC[-_ ]Tax[-_ ]Package", "tax", "solar-inference-package", "Solar Inference LLC"),
    (r"(?i)\bForm[-_ ]?(8606|8949|7203|2106|4562)\b", "tax", "form-misc", ""),
    (r"(?i)IRS|Internal Revenue", "tax", "irs-correspondence", "IRS"),
    (r"(?i)NJ[-_ ]?(state|tax|1040|division)", "tax", "nj-state-tax", "NJ Division of Taxation"),
    (r"(?i)MA[-_ ]?(state|tax|dor)", "tax", "ma-state-tax", "MA DOR"),
    (r"(?i)Estimated[ _-]?(tax|payment)", "tax", "estimated-payments", ""),

    # === BROKERAGE / INVESTMENT ===
    (r"(?i)EquityZen", "brokerage", "anthropic-equityzen", "EquityZen"),
    (r"(?i)Hiive|HII[-_ ]Anthropic", "brokerage", "anthropic-hiive", "Hiive"),
    (r"(?i)Anthropic.*shares|shares.*Anthropic", "brokerage", "anthropic-other", "Anthropic"),
    (r"(?i)Schwab", "brokerage", "schwab-statement", "Charles Schwab"),
    (r"(?i)Fidelity.*(1099|statement|brokerage)", "brokerage", "fidelity-statement", "Fidelity"),
    (r"(?i)(TD ?Ameritrade|TDA[-_ ])", "brokerage", "ameritrade-statement", "TD Ameritrade"),
    (r"(?i)Brokerage[-_ ]Statement", "brokerage", "brokerage-statement", ""),
    (r"(?i)Subscription Agreement|Term Sheet|Suitability Questionnaire|Operating Agreement", "brokerage", "private-investment-docs", ""),
    (r"(?i)Roth[-_ ]?IRA|Rollover[-_ ]?IRA|UTMA|Uniform[-_ ]Transfers[-_ ]to[-_ ]Minors", "brokerage", "retirement-account", ""),
    (r"(?i)Positions[_ ]?(altonsartor|aneetasaxena)", "brokerage", "positions-export", ""),

    # === BANKING / STATEMENTS ===
    (r"^statements?[-_].*\.(pdf|PDF)$|^\d{8}-statements", "banking", "bank-statement", ""),
    (r"^\d{4}_\d+_Statement", "banking", "bank-statement", ""),
    (r"(?i)Chase|JPMorgan", "banking", "chase", "Chase"),
    (r"(?i)Bank[-_ ]?(statement|of[-_ ]america)", "banking", "bank-statement", ""),
    (r"(?i)RCN[-_ ]?Statement", "banking", "rcn-account-statement", "RCN"),
    (r"(?i)Capital[-_ ]?One", "banking", "capital-one", "Capital One"),
    (r"(?i)Wells[-_ ]?Fargo", "banking", "wells-fargo", "Wells Fargo"),
    (r"(?i)Citi(bank)?", "banking", "citi", "Citibank"),
    (r"(?i)Payslip|Payroll|Pay[-_ ]?Stub", "banking", "payslip", ""),
    (r"(?i)Direct[-_ ]?Deposit|Deposit\s*Slip", "banking", "deposit-slip", ""),

    # === MEDICAL (family) ===
    (r"(?i)Vayu.*(covid|vaccin|test|negative|lead|MMR|physical|pediatric|appointment|growth)", "medical-family", "vayu", "Vayu"),
    (r"(?i)Vishala.*(covid|vaccin|test|negative|lead|MMR|physical|pediatric|appointment|growth|statement)", "medical-family", "vishala", "Vishala"),
    (r"(?i)Vasu.*(covid|vaccin|test|negative|lead|MMR|physical|pediatric|appointment)", "medical-family", "vasu", "Vasu"),
    (r"(?i)Aneeta.*(physical|MRI|labs|prescription)", "medical-family", "aneeta", "Aneeta Saxena"),
    (r"(?i)\b(Camp|Timanous|CampMeds|Wohelo)[-_ ]?(meds|medication|physical|form)?", "medical-family", "camp-medical", "Camp"),
    (r"(?i)Pediatric|MMR|covid[-_ ]?test|vaccination|immunization", "medical-family", "general-pediatric", ""),
    (r"(?i)Physician|Dr\.[-_ ]|prescription|Rx\b", "medical-family", "general-medical", ""),

    # === PROFESSIONAL — ASTRAZENECA ===
    (r"(?i)\bAZ\b|AstraZeneca|AZD|ALXN", "professional-az", "az-work-doc", "AstraZeneca"),
    (r"(?i)\bPV\b|Pharmacovigilance|GVP|MEDWATCH|adverse[-_ ]event|safety[-_ ]signal|signal[-_ ]detection", "professional-az", "pharmacovigilance", "AstraZeneca"),
    (r"(?i)Risk[-_ ]Management[-_ ]Report|hazard[-_ ]?(analysis|assessment)|FMEA|uFMEA", "professional-az", "risk-management", ""),
    (r"(?i)CIOMS", "professional-az", "cioms-regulatory", ""),
    (r"(?i)\bEMA\b|MDCG|European Medicines Agency|EU MDR", "professional-az", "eu-regulatory", ""),
    (r"(?i)FDA[-_ ]?(guidance|draft|submission)", "professional-az", "fda-regulatory", ""),
    (r"(?i)Project[-_ ]PATH", "professional-az", "project-path", "AstraZeneca"),
    (r"(?i)Locus[-_ ]LTFU|LTFU", "professional-az", "locus-ltfu", "AstraZeneca"),
    (r"(?i)BARB|EvoPAR|MEDI[0-9]", "professional-az", "az-trial-doc", "AstraZeneca"),
    (r"(?i)pneumonitis|ILD\b|interstitial.*lung", "professional-az", "az-clinical-doc", "AstraZeneca"),

    # === PROFESSIONAL — BIOGEN ===
    (r"(?i)Biogen", "professional-biogen", "biogen-doc", "Biogen"),

    # === PROFESSIONAL — BMC / BU / MGH (early career) ===
    (r"(?i)\bBMC\b|Boston Medical|BUMC", "professional-early", "bmc", "BMC"),
    (r"(?i)\bMGH\b|Mass General", "professional-early", "mgh", "MGH"),
    (r"(?i)\bBU\b[ _].*W2|Boston University", "professional-early", "bu", "Boston University"),
    (r"(?i)Disclosure.*Annual|Annual.*Disclosure", "professional-early", "annual-disclosure", ""),
    (r"(?i)BLS[-_ ]Cert", "professional-early", "bls-certification", ""),
    (r"(?i)DEA[-_ ]?(Federal|Receipt|certificate|number)", "professional-early", "dea-license", ""),
    (r"(?i)Medical[-_ ]license", "professional-early", "medical-license", ""),
    (r"(?i)CME\b", "professional-early", "cme", ""),
    (r"(?i)NPI[-_ ]?(number|certificate|profile)", "professional-early", "npi", ""),

    # === RESEARCH PAPERS ===
    (r"^1-s2\.0-S", "research-paper", "sciencedirect", ""),
    (r"(?i)^10\.1\d{3}", "research-paper", "doi-prefix", ""),
    (r"(?i)nejmoa", "research-paper", "nejm", "NEJM"),
    (r"(?i)nature\.com|s4225[0-9]-", "research-paper", "nature", "Nature"),
    (r"(?i)\barXiv\b|14077_|2[0-9]{4}\.[0-9]{5}\.pdf", "research-paper", "arxiv", "arXiv"),
    (r"(?i)preprint|biorxiv|medrxiv", "research-paper", "preprint", ""),

    # === SOLAR / GPU / SOLAR INFERENCE ===
    (r"(?i)Solar[-_ ]Inference|Solar[-_ ]Roof|Tesla[-_ ]Solar|SolarRoof", "business-solar", "solar-inference", "Solar Inference LLC"),
    (r"(?i)vast\.?ai|RTX[-_ ]?5090|RTX[-_ ]?PRO[-_ ]?6000", "business-solar", "vast-ai-gpu", "vast.ai"),
    (r"(?i)Solar[-_ ]Inference[-_ ]LLC|EIN[-_ ]?(39-)?4199284", "business-solar", "si-llc-formation", "Solar Inference LLC"),

    # === NONPROFIT (SANTE TOTAL) ===
    (r"(?i)Sante[-_ ]?Total|Sante Total", "nonprofit", "sante-total", "Sante Total Inc."),
    (r"(?i)990[-_]?N|e[-_ ]?Postcard", "nonprofit", "990-n", "Sante Total"),
    (r"(?i)Articles[-_ ]of[-_ ]Incorporation", "nonprofit", "articles-of-incorporation", ""),

    # === PROPERTY (185 Davis, Montclair, etc.) ===
    (r"(?i)185[-_ ]?[Dd]avis", "property", "185-davis-condo", "185 Davis Ave Unit 8"),
    (r"(?i)mortgage[-_ ]?statement|Shellpoint|Guaranteed[-_ ]?Rate", "property", "mortgage-statement", ""),
    (r"(?i)appraisal|Inspection[-_ ]Report|Inspection[-_ ]May", "property", "real-estate-inspection", ""),
    (r"(?i)closing[-_ ]disclosure|HUD[-_ ]?1|settlement[-_ ]statement", "property", "closing-docs", ""),
    (r"(?i)Stonebridge|Stone[-_ ]Bridge", "property", "85-stonebridge", "85 Stonebridge"),
    (r"(?i)CondoDoc|condominium[-_ ]docs?", "property", "condo-docs", ""),
    (r"(?i)Renter.s[-_ ]?insurance|homeowner.s[-_ ]?insurance", "property", "insurance", ""),
    (r"(?i)HOA[-_ ]?fee|condo[-_ ]?fee|condominium[-_ ]?association", "property", "hoa", ""),
    (r"(?i)Selective[-_ ]?(insurance|payment)", "property", "selective-insurance", "Selective"),
    (r"(?i)Tesla[-_ ]?(Solar|Powerwall|Wall)", "property", "tesla-solar-property", "Tesla"),

    # === LEGAL / CONTRACTS ===
    (r"(?i)Consultancy[-_ ]Services[-_ ]Agreement|Consulting[-_ ]Agreement", "legal-contracts", "consulting-agreement", ""),
    (r"(?i)NDA\b|Non[-_ ]?Disclosure", "legal-contracts", "nda", ""),
    (r"(?i)MOU\b|Memorandum of Understanding", "legal-contracts", "mou", ""),
    (r"(?i)Operating[-_ ]Agreement", "legal-contracts", "operating-agreement", ""),
    (r"(?i)Power of Attorney|POA\b", "legal-contracts", "poa", ""),
    (r"(?i)\bWill\b|Last[-_ ]Will|Trust[-_ ]Agreement|Estate[-_ ]Plan", "legal-contracts", "estate", ""),
    (r"(?i)Lease[-_ ]?(agreement|extension)", "legal-contracts", "lease", ""),
    (r"(?i)engagement[-_ ]letter|Letter[-_ ]of[-_ ]Engagement", "legal-contracts", "engagement-letter", ""),

    # === SCHOOL ===
    (r"(?i)MKA\b|Montclair[-_ ]Kimberley", "school", "mka", "Montclair Kimberley Academy"),
    (r"(?i)Goddard", "school", "goddard", "Goddard School"),
    (r"(?i)Tuition[-_ ]?(payment|invoice|statement)", "school", "tuition", ""),
    (r"(?i)Report[-_ ]?Card", "school", "report-card", ""),
    (r"(?i)School[-_ ]?Protocols|Class[-_ ]?Schedule", "school", "school-policy", ""),

    # === UTILITIES ===
    (r"(?i)PSE&G|PSEG|electricity[-_ ]?bill", "utilities", "pseg-electricity", "PSE&G"),
    (r"(?i)Verizon|Fios", "utilities", "verizon-fios", "Verizon"),
    (r"(?i)water[-_ ]?bill|Sewer", "utilities", "water-sewer", ""),

    # === RECEIPTS ===
    (r"(?i)Receipt|Invoice|Inv_\d", "receipts", "receipt-invoice", ""),
    (r"(?i)Hotel[-_ ]?(invoice|receipt)", "receipts", "hotel", ""),

    # === IDENTITY / GOVERNMENT ===
    (r"(?i)Passport", "identity", "passport", ""),
    (r"(?i)Driver.s[-_ ]?License|DL\b", "identity", "driver-license", ""),
    (r"(?i)SSN|Social[-_ ]Security", "identity", "ssn-card", ""),
    (r"(?i)Marriage[-_ ]?(Certificate|License)", "identity", "marriage-cert", ""),
    (r"(?i)Birth[-_ ]?Certificate", "identity", "birth-cert", ""),

    # === VEHICLE ===
    (r"(?i)Vehicle[-_ ]?(registration|title)|Subaru|registration[-_ ]?renewal|Vin\b|car[-_ ]?(insurance|registration)", "vehicle", "vehicle-doc", ""),

    # === STUDENT LOAN ===
    (r"(?i)Earnest|Student[-_ ]?Loan|1098[-_ ]?E", "loans", "student-loan", ""),

    # === IDS LICENSES PERSONAL CV ===
    (r"(?i)Cover[-_ ]?Letter|CV\b|Resume[-_ ]?(Sartor|Saxena|Emmett|Alton|Aneeta)", "personal-career", "cv-cover-letter", ""),
    (r"(?i)Personal[-_ ]Statement", "personal-career", "personal-statement", ""),

    # === MORE PROFESSIONAL AZ (case reports, CTCAE, MEDI, GVP) ===
    (r"(?i)CASE_\d+_case_report|CTCAE|guideline.*data.*monitoring|GxP|TMG|Toxicity Management|adboard|ad[-_ ]?board|Argus|EQV|Alexion|trastuzumab|Enhertu|Reference Safety Information|Risk Minimisation|Combination Products|Risk Management Plan|Patient Safety AI|Safety Strategy|Safety Knowledge|Patient Safety Innovation|R&D Tx|R&D Transformation|AI Sprint|AI Programme|Innovation Accelerator|Predictive Safety|Patient Safety|GenAI|MS PATHS|MSPATHS|CKD Screening|GPS strategy|ODSAI|Alex.*Innovation|BIKG|Alexion Innovation|EAIA|Predictive Safety", "professional-az", "az-clinical-doc", "AstraZeneca"),
    (r"(?i)Climate Fir|EMMETT_A_SARTOR_ANEETA_SAXENA", "tax", "general", ""),  # Climate First refund
    (r"(?i)Quality[-_ ]Management|Quality[-_ ]Vault|Vault[-_ ]Quality", "professional-az", "az-quality-system", "AstraZeneca"),
    (r"(?i)BARB|MGFA|Locus|EvoPAR", "professional-az", "az-trial-doc", "AstraZeneca"),

    # === MORE BIOGEN ===
    (r"(?i)(\bBIIB|tysabri|tecfidera|MS[-_ ]?Subtyping|TYSED)", "professional-biogen", "biogen-doc", "Biogen"),

    # === NEUROLOGY EARLY CAREER ===
    (r"(?i)(Neuro[-_ ]?Oncology|NEO[-_ ]Holiday|Neuro-Onc|Neurological|Glioblastoma|MS\b|ALS\b)", "professional-early", "neurology-doc", ""),
    (r"(?i)Reasonable accomodation|accommodation", "professional-early", "ada-accommodation", ""),

    # === REGULATORY / DEVICE ===
    (r"(?i)(FDA|MDR|MDCG|guideline|Investigational|IND|NDA|BLA|premarket|510k|510-k)", "professional-az", "regulatory-guidance", ""),
    (r"(?i)Hazard.*Analysis|Risk[-_ ]?(Assessment|Review)", "professional-az", "risk-management", ""),

    # === MORE RESEARCH PAPERS ===
    (r"(?i)journal|paper|article|Beers|Buckner|Shitara|Ochi|Thornton|Camgoz|Qiu|main\.pdf$", "research-paper", "literature", ""),
    (r"(?i)cancers-|jcrm-|nature-|cell-|brain-|jneuro-", "research-paper", "literature", ""),
    (r"(?i)\bDOI\b|10\.\d{4}", "research-paper", "literature", ""),
    (r"(?i)Springer|Elsevier|Wiley|SAGE", "research-paper", "literature", ""),
    (r"(?i)SSRN|preprint|biorxiv|medrxiv|arxiv", "research-paper", "preprint", ""),

    # === PERSONAL FINANCIAL EXTRA ===
    (r"(?i)transactions?\.(csv|xlsx)|TOTAL[-_ ]?CHECKING|Berteau", "banking", "transaction-export", ""),

    # === MORE BANKING / STATEMENTS (catch monthly/quarterly stmts not yet matched) ===
    (r"(?i)Monthly[-_ ]?Statement|Sept[ _-]\d+[ _-]?Statement|Statement\d{6,}", "banking", "monthly-statement", ""),
    (r"(?i)Account[-_ ]?\d+|Brokerage|TOA[-_ ]?transfer|TD[-_ ]?Ameritrade|Wire\b", "banking", "account-doc", ""),

    # === MEDICAL (verification, ADA, MetLife) ===
    (r"(?i)ADA[-_ ]?medical|MetLife|disability|FMLA|leave[-_ ]?(of[-_ ]?absence)?|short[-_ ]?term[-_ ]?disability", "medical-family", "ada-disability", ""),
    (r"(?i)Health[-_ ]?(Insurance|Summary|Card)", "medical-family", "health-insurance", ""),

    # === PROPERTY EXTRA ===
    (r"(?i)Longwood|Gabby|Berteau|Marie Thelus|jcrew print", "property", "real-estate-misc", ""),

    # === FAMILY (general) ===
    (r"(?i)\b(Aneeta|Emmett|Sartor|Saxena|Alton)\b", "family-misc", "family-named-doc", ""),
]

OTHER = ("other", "uncategorized", "")


def detect_date(name: str) -> str:
    """Try to extract YYYY-MM-DD-ish date from filename."""
    # YYYY-MM-DD or YYYY_MM_DD
    m = re.search(r"\b(20\d{2})[-_ /](\d{1,2})[-_ /](\d{1,2})\b", name)
    if m:
        return f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    # YYYY only
    m = re.search(r"\b(20\d{2})\b", name)
    if m:
        return f"{m.group(1)}"
    return ""


JUNK_PATTERNS = [
    r"(?i)\[TGx\]Downloaded",
    r"(?i)^license\.txt$",
    r"(?i)^README.*Open for Instructions",
    r"(?i)^readme[a-z]{0,4}\.rtf$",
    r"(?i)^README\.txt$",
    r"(?i)^Readme\.txt$",
    r"(?i)^source\.txt$",
    r"(?i)^interface\.txt$",
    r"(?i)^(eng|fra|deu|ger|por|rom|slv|spa|ita|swe|jap|nor|cht|chs|kor|hun|tur|ell|dan|fin|dut|nld|cze|pol|rus|bra|jpn|chi|cze|hrv|ron|slo|ukr|ara|tha|vie|ind|iva|gre|pho|ovr|spc|srl)\.txt$",
    r"(?i)Battlefield|Clone Armor|Clone Helmet|Phase_I_Clone",
    r"(?i)^EnabledMods\.txt|BodyParts\.txt|cht\.txt|D2230413\.txt|D2230412\.txt|space[- ]invd",
    r"(?i)Downloaded from torrentgalaxy",
    r"(?i)\\Default\\.*\.json$",  # browser cache
    r"(?i)\\AppData\\.*",  # AppData crud
    r"(?i)~\$",  # Office lock files
    r"(?i)ErP_Lot4VA_",  # appliance ErP regulatory cruft
    r"(?i)Tutorial\.rivet",
    r"(?i)space-exploration_",  # Factorio mod
    r"(?i)SDCardFormatter",  # software installer
    r"(?i)\.DS_Store$",
    r"(?i)Wed-SS-\d-\d",  # ZF conference proceedings junk?
]


def is_junk(full: str, name: str) -> bool:
    for p in JUNK_PATTERNS:
        if re.search(p, full) or re.search(p, name):
            return True
    return False


def categorize(row: dict) -> dict:
    name = row["Name"]
    full = row["FullName"]
    if is_junk(full, name):
        return {**row, "category": "_junk", "subcategory": "drop", "vendor_guess": "", "date_guess": detect_date(name)}
    haystack = full  # use full path for context
    for pat, cat, sub, vendor in RULES:
        if re.search(pat, haystack):
            return {**row, "category": cat, "subcategory": sub, "vendor_guess": vendor, "date_guess": detect_date(name)}
    return {**row, "category": OTHER[0], "subcategory": OTHER[1], "vendor_guess": OTHER[2], "date_guess": detect_date(name)}


def main() -> None:
    with IN.open(encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    out_rows = [categorize(r) for r in rows]
    out_rows.sort(key=lambda r: (r["category"], r["subcategory"], r["LastWriteTime"]))
    fields = ["category", "subcategory", "vendor_guess", "date_guess", "Name", "FullName", "Extension", "Length", "LastWriteTime"]
    with OUT.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(out_rows)
    # print summary
    from collections import Counter
    cats = Counter(r["category"] for r in out_rows)
    print(f"Total: {len(out_rows)}")
    print("By category:")
    for c, n in cats.most_common():
        print(f"  {c}: {n}")


if __name__ == "__main__":
    main()
