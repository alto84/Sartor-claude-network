"""Pull singleton survivors + peer_phone_home + peer_inbox_other for memory-engineer's keep-list.

Re-uses classification logic from _inbox_analysis.py.
Writes:
  inbox-keep-list-2026-05-02.md (singletons + peer files, one line each + verdict)
  inbox-bodyhash-table-2026-05-02.tsv (full per-file body-hash table for future audits)
"""
import os
import hashlib
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(r"C:\Users\alto8\.claude\projects\C--Users-alto8\memory")
INBOX = ROOT / "inbox"
HERE = Path(__file__).parent


def first_heading(text: str) -> str:
    for line in text.splitlines()[:30]:
        s = line.strip()
        if s.startswith("# "):
            return s[2:].strip()
    return ""


def first_body_para(text: str, max_chars: int = 280) -> str:
    """Skip frontmatter + first heading, grab first non-empty para."""
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end >= 0:
            text = text[end + 4:]
    lines = text.splitlines()
    out = []
    seen_heading = False
    for line in lines:
        s = line.strip()
        if not s:
            if out:
                break
            continue
        if s.startswith("#") and not seen_heading:
            seen_heading = True
            continue
        if s.startswith(">"):
            s = s.lstrip("> ")
        out.append(s)
        if sum(len(x) for x in out) > max_chars:
            break
    blob = " ".join(out)
    blob = re.sub(r"\s+", " ", blob)
    return blob[:max_chars]


def normalize_body(text: str) -> str:
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end >= 0:
            text = text[end + 4:]
    t = re.sub(r"\d{4}-\d{2}-\d{2}T?\d{0,2}:?\d{0,2}:?\d{0,2}", "DATE", text)
    t = re.sub(r"\b[a-f0-9]{8,}\b", "HASH", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def classify(rel: str) -> str:
    rel = rel.replace("\\", "/")
    if "proposed-memories" in rel or "rocinante-extractor" in rel:
        return "extractor_proposed"
    if "/_processed/" in rel:
        return "processed_results"
    if "/_drained/" in rel or "/.drained/" in rel:
        return "drained_archive"
    if "PHONE-HOME" in rel.upper():
        return "peer_phone_home"
    if rel.startswith("inbox/gpuserver1/") or rel.startswith("inbox/rtxpro6000server/") or rel.startswith("inbox/rtxserver/"):
        return "peer_inbox_other"
    if rel.startswith("inbox/rocinante/_specs/"):
        return "rocinante_specs"
    if rel.startswith("inbox/rocinante/"):
        return "rocinante_top"
    return "other"


# Walk
records = []  # (rel, cat, heading, body_hash, size, mtime, body_preview, dedup_status, extractor_subclass)
for dirpath, dirs, files in os.walk(INBOX):
    for fn in files:
        if not fn.endswith(".md"):
            continue
        full = Path(dirpath) / fn
        rel = full.relative_to(ROOT).as_posix()
        try:
            text = full.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        h = first_heading(text)
        body_norm = normalize_body(text)
        body_hash = hashlib.md5(body_norm.encode()).hexdigest()[:10]
        size = full.stat().st_size
        mtime = full.stat().st_mtime
        preview = first_body_para(text)
        # Pull dedup_status + extractor_subclass from frontmatter if present
        dedup = ""
        subclass = ""
        if text.startswith("---"):
            fm_end = text.find("\n---", 3)
            if fm_end > 0:
                fm = text[3:fm_end]
                m = re.search(r"^dedup_status:\s*(\S+)", fm, re.M)
                if m: dedup = m.group(1).strip()
                m = re.search(r"^extractor_subclass:\s*(\S+)", fm, re.M)
                if m: subclass = m.group(1).strip()
        cat = classify(rel)
        records.append({
            "rel": rel, "cat": cat, "heading": h, "body_hash": body_hash,
            "size": size, "mtime": mtime, "preview": preview,
            "dedup": dedup, "subclass": subclass,
        })

# Write per-file body-hash table for future audits
import csv
import time
tsv_path = HERE / "inbox-bodyhash-table-2026-05-02.tsv"
with open(tsv_path, "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f, delimiter="\t")
    w.writerow(["rel", "cat", "heading", "body_hash", "size", "mtime", "dedup_status", "extractor_subclass", "body_preview"])
    for r in records:
        w.writerow([r["rel"], r["cat"], r["heading"], r["body_hash"], r["size"],
                    time.strftime("%Y-%m-%d", time.localtime(r["mtime"])),
                    r["dedup"], r["subclass"], r["preview"][:200]])

# Compute body_hash counts within extractor_proposed
ep = [r for r in records if r["cat"] == "extractor_proposed"]
body_counts = Counter(r["body_hash"] for r in ep)

# Singletons in extractor_proposed = body_hash that occurs exactly once across the whole extractor bucket
singletons = [r for r in ep if body_counts[r["body_hash"]] == 1]
singletons.sort(key=lambda r: r["mtime"])

phone_home = [r for r in records if r["cat"] == "peer_phone_home"]
phone_home.sort(key=lambda r: r["mtime"])

peer_other = [r for r in records if r["cat"] == "peer_inbox_other"]
peer_other.sort(key=lambda r: r["mtime"])

# Write keep-list markdown
out = HERE / "inbox-keep-list-2026-05-02.md"
with open(out, "w", encoding="utf-8") as f:
    f.write("""---
name: inbox-keep-list-2026-05-02
description: Keep-list / discard verdicts for inbox files NOT in the bulk-discard set. Singletons in extractor_proposed (body_hash unique == 1) plus all peer_phone_home and peer_inbox_other files. Companion to memory-engineer's Phase A2 drain script.
type: project
status: active
created: 2026-05-02
updated: 2026-05-02
related: [memory-cartography, _inbox_analysis.py]
---

# Inbox keep-list — 2026-05-02

Source: `_inbox_analysis.py` + `_singletons_and_peers.py` in this directory.
Bulk-discard set (~190 files with `dedup_status: already_landed` and stable-entity `extractor_subclass`) is handled separately.

Verdict legend: **KEEP** = real signal, leave in inbox or drain to `_processed/`; **DISCARD** = unique-body but still noise; **REVIEW** = need a human eye.

## Singletons in `extractor_proposed` (body_hash unique == 1)

Total: """ + str(len(singletons)) + """ files.

| date | path | heading | verdict | one-line summary |
|---|---|---|---|---|
""")
    for r in singletons:
        date = time.strftime("%Y-%m-%d", time.localtime(r["mtime"]))
        # Heuristic verdict
        h = r["heading"].lower()
        prev = r["preview"].lower()
        verdict = "REVIEW"
        if r["dedup"] == "already_landed":
            verdict = "DISCARD (self-attested landed)"
        elif "aneeta" in h and "neurvati" in prev:
            verdict = "KEEP (already in FAMILY.md per cart inv; safe to drain to _processed/)"
        elif "biogen" in prev or "neurvati" in prev:
            verdict = "KEEP (employer change — verify against FAMILY.md)"
        elif "az role change" in h:
            verdict = "KEEP (verify against ASTRAZENECA.md)"
        elif "rental_price" in h or "rental_price" in r["subclass"]:
            verdict = "REVIEW (likely landed in business/rental-operations.md)"
        elif "wifi" in h or "wifi_password" in r["subclass"]:
            verdict = "REVIEW (verify against reference_home_network.md — PSK rotated 2026-05-01)"
        elif "wohelo" in prev or "wohelo" in h:
            verdict = "KEEP (Vishala camp $12,900 — likely already in family/active-todos.md, drain to _processed/)"
        elif "tribeca" in prev or "pediatric" in prev:
            verdict = "KEEP (provider info — verify against FAMILY.md)"
        elif "fiscal_outlook" in h:
            verdict = "REVIEW (cross-check business/ + TAXES.md)"
        elif "dollar_amount" in h or "dollar_amount" in r["subclass"]:
            verdict = "REVIEW (numeric extraction — verify context)"
        elif "dob" in h or h.endswith(": dob"):
            verdict = "REVIEW (DOB extraction — verify against FAMILY.md)"
        elif "health" in h:
            verdict = "REVIEW (health note — verify scope before landing)"
        elif "preference" in h:
            verdict = "REVIEW (likely already in feedback/ if rule-shaped)"
        elif "cron cleanup" in h or "workstation purchase" in h:
            verdict = "KEEP (real one-shot report; drain to _processed/ if landed)"
        elif "entity_vayu" in r["subclass"]:
            verdict = "REVIEW (Vayu = nephew? — verify context)"
        elif "explicit_memorize" in r["subclass"]:
            verdict = "REVIEW (explicit user-issued memorize call; check if landed)"
        f.write(f"| {date} | `{r['rel']}` | {r['heading'][:50]} | {verdict} | {r['preview'][:120]} |\n")

    f.write(f"""

## peer_phone_home ({len(phone_home)} files)

Status reports from peer machines (gpuserver1, rtxpro6000server). All KEEP unless already drained.

| date | path | heading | verdict | one-line summary |
|---|---|---|---|---|
""")
    for r in phone_home:
        date = time.strftime("%Y-%m-%d", time.localtime(r["mtime"]))
        verdict = "KEEP-IF-OPEN (review: drain to _processed/ if outcome is landed)"
        f.write(f"| {date} | `{r['rel']}` | {r['heading'][:50]} | {verdict} | {r['preview'][:120]} |\n")

    f.write(f"""

## peer_inbox_other ({len(peer_other)} files)

Task assignments to peer machines or peer-to-peer memos.

| date | path | heading | verdict | one-line summary |
|---|---|---|---|---|
""")
    for r in peer_other:
        date = time.strftime("%Y-%m-%d", time.localtime(r["mtime"]))
        verdict = "KEEP-IF-OPEN (review: drain to _processed/ if task complete)"
        f.write(f"| {date} | `{r['rel']}` | {r['heading'][:50]} | {verdict} | {r['preview'][:120]} |\n")

print(f"wrote {out}")
print(f"  singletons: {len(singletons)}")
print(f"  phone_home: {len(phone_home)}")
print(f"  peer_other: {len(peer_other)}")
print(f"wrote {tsv_path}")
print(f"  total records: {len(records)}")
