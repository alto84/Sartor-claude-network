---
type: review-memo
phase: 4-adversarial-review
project: pihole-deployment-2026-05-17
reviewer: auditor (fresh-context retry)
review-date: 2026-05-17
verdict: REVISE — deploy is directionally correct but has three gaps severe enough to bite in production; none are architectural blockers; all are fixable before Phase 7 greenlight
---

# Review memo — pihole deploy v1

## Summary

The plan and deploy script are well-structured. The secrets handling is correct, the dual-DNS fallback architecture is sound, and the pre-registered acceptance criteria are a meaningful gate. But the adversarial sweep found three issues that need resolution before the Phase 7 greenlight fires. In severity order: (1) `OISD big` is a substantially heavier blocklist than `OISD light` — the deploy script pulls `big.oisd.nl` while the plan says "OISD light", creating a meaningful false-positive risk the team never pressure-tested; (2) the whitelist is missing several Sartor-critical domains (Chase, Fidelity, Stripe, Veracross/Blackbaud subdomain CDN, AstraZeneca, codeload.github.com, npmjs.com) that have documented Pi-hole false-positive histories; (3) `docker inspect pihole` exposes WEBPASSWORD to any LAN user with Docker socket access, and that threat model is unacknowledged. Four additional moderate charges address Rocinante IP instability, the UniFi API endpoint assertion, the Phase 1 skip rationale, and the daily-health severity floor for the new UniFi probe. No fundamental design problem — the verdict is revise, not halt.

## Charges

---

### Charge 1 — Blocklist mismatch: deploy script installs OISD *big*, plan says OISD *light*
**Severity:** High
**Surface:** `scripts/deploy-pihole-docker.sh` line 185 vs. `PLAN.md` Step 8

**Claim:** The plan text in PLAN.md step 8 says "StevenBlack hosts, OISD light." The deploy script installs `https://big.oisd.nl/` which is OISD Full (colloquially "big") — a substantially more aggressive list than OISD Light (`https://small.oisd.nl/`). OISD Full contains ~257 000 domains vs. ~37 000 for OISD Light. The difference is meaningful: OISD Full is known to block Cloudflare Workers endpoints, several AWS subdomains, and CDN prefixes used by financial services. The deployment proceeds from a plan-document false promise: "we reviewed OISD light" but we ship OISD big.

**Evidence:** `scripts/deploy-pihole-docker.sh` L185: `"https://big.oisd.nl/"`. `PLAN.md` step 8: `"StevenBlack hosts, OISD light."` The `big.oisd.nl` URL is the self-identified Full list (see oisd.nl documentation). `small.oisd.nl` is OISD Light. This is a real discrepancy, not naming ambiguity.

**Recommended fix:** Decide which list you mean and make the documents agree. If OISD Light is the intended v1 choice (lower false-positive risk, easier to audit), change the deploy script URL to `https://small.oisd.nl/`. If you intentionally want OISD Full (more blocking, more false-positive surface), update the plan to say so and extend the whitelist review accordingly before greenlight. Do not ship with a plan that says one thing and a script that does another — post-incident the discrepancy will make the audit trail unreliable.

---

### Charge 2 — Whitelist gaps: Sartor-critical domains with documented Pi-hole false-positive histories are absent
**Severity:** High
**Surface:** `scripts/deploy-pihole-docker.sh` L156-175 (whitelist array), `PLAN.md` Step 7

**Claim:** The whitelist covers Anthropic, vast.ai, Docker Hub, Blackbaud/MKA, Goddard/brightwheel, and GitHub. The plan's acceptance criteria include a browser smoke-test for Chase and Fidelity (implicitly, via "brokerage"). But neither Chase (`chase.com`, `jpmorganchase.com`, `chaseonline.chase.com`, Chase CDN subdomains) nor Fidelity (`fidelity.com`, `fidelity-investments.com`, `fidelitywork.com`) appears in the whitelist array. The StevenBlack list in particular contains advertising-adjacent domains that overlap with CDN infrastructure used by financial portals. Stripe's telemetry domains (`js.stripe.com`, `stripe.network`, `m.stripe.com`) are also absent — relevant because the vast.ai billing flow touches Stripe. The Veracross subdomain CDN used by Blackbaud's school portal (`cdn.blackbaud.com`, `bbnc.netsolhost.com`) is not explicitly whitelisted; `blackbaud.com` root is there but the CDN variant is the domain actually loaded at runtime. AstraZeneca's internal portal (`azinternal.com`, `astrazeneca.com`) and associated Okta instance (`astrazeneca.okta.com`) are absent. `codeload.github.com` (GitHub's ZIP download endpoint — hit by every npm/pip install on Rocinante) and `registry.npmjs.org` are absent.

**Evidence:** StevenBlack OISD known-FP reports include financial CDNs, Stripe telemetry, and Okta. None of the above domains appear in `WHITELIST` array in the deploy script. The smoke test in PLAN.md lists Chase and GitHub as browser checks but does not back those checks with corresponding whitelist entries for all subdomains that load.

**Recommended fix:** Extend the whitelist before greenlight with at minimum: `chase.com`, `jpmorganchase.com`, `stripe.com`, `js.stripe.com`, `m.stripe.com`, `fidelity.com`, `fidelity-investments.com`, `astrazeneca.com`, `astrazeneca.okta.com`, `cdn.blackbaud.com`, `codeload.github.com`, `registry.npmjs.org`. Add TurboTax / CPA tooling domain if known. The whitelist should be an explicit policy decision, not an afterthought — consider adding a `WHITELIST_REASON` comment per domain so future operators know why each entry is there.

---

### Charge 3 — `docker inspect` leaks WEBPASSWORD to any user with Docker socket access; threat model unacknowledged
**Severity:** Medium
**Surface:** `scripts/deploy-pihole-docker.sh` L130-143 (docker run command), PLAN.md secrets section, INDEX.md constraints

**Claim:** The deploy script loads the Pi-hole admin password into `PIHOLE_WEB_PASS` (correct) and passes it to the container via `-e WEBPASSWORD` (the env-var-by-name form — correct for keeping it out of argv). However, Docker stores all environment variables passed to a container in the container's metadata, readable via `docker inspect pihole`. Any OS user with access to the Docker socket (on Rocinante: the `alto8` user, and effectively any process running in that user context including browser tabs, Electron apps, and other Docker containers with the socket mounted) can run `docker inspect pihole | grep WEBPASSWORD` and retrieve the plaintext password. The plan acknowledges credential hygiene but does not name this specific threat vector. Pi-hole admin access from the LAN is protected only by the WEBPASSWORD; if that leaks, any LAN device can reconfigure blocklists, read DNS query logs (household browsing data), or exfiltrate the admin session.

**Evidence:** Docker documentation states that env vars set at `docker run` are stored in `ContainerConfig.Env` and `Config.Env`, readable via `docker inspect`. This is not a hypothetical — it is documented Docker behavior. The deploy script comment at L19-23 addresses argv and shell history exposure but is silent on `docker inspect`.

**Recommended fix:** Two mitigations are available in combination. (a) Immediately after deploy, unset the env var from the running container via `docker container update --env-remove WEBPASSWORD pihole` if the container supports it — or note that Pi-hole reads WEBPASSWORD only at startup (confirmed in pi-hole/pi-hole docs) and rotate it: change the vault item, stop the container, clear the volume's stored hash if needed, restart. Post-startup, the password is stored as a bcrypt hash inside the pihole_etc volume, not as plaintext in env. (b) Document explicitly in the deploy script and in the project constraints that `docker inspect pihole` will expose the password during the lifetime of the initial container start, and that the mitigation is container restart after initial config. This is a known Docker pattern with a known resolution; the gap is that it's unacknowledged.

---

### Charge 4 — Rocinante's LAN IP assumed static; no enforcement, no fallback spec if it drifts
**Severity:** Medium
**Surface:** `unifi-dhcp-dns-change.md` section "Risks named" item 2, deploy script L40, PLAN.md Build artifact 2

**Claim:** The primary DNS server pushed to all household clients via UniFi DHCP will be `192.168.1.171` (Rocinante). The unifi-dhcp-dns-change doc acknowledges this dependency in a risk note but characterizes it as "currently stable (Ethernet adapter, fixed)." This is not enforcement — it's an observation. On Windows 10 Home with a DHCP-capable NIC adapter, a router firmware update, a network driver reinstall, a Windows update that resets NIC properties, or Alton manually changing network settings for an experiment can all silently reassign the LAN IP. When that happens: (a) all DHCP-leased clients point at a dead DNS server as primary; (b) they fall back to 1.1.1.1 after ~1-2 seconds per query (acceptable), but (c) the Pi-hole container, now on a different IP, is still running and listening on 53 — the DHCP config and the container's binding are just silently out of sync with no alert. There is no monitoring for this drift. The `daily-household-health` UniFi probe checks the controller, not Rocinante's IP consistency.

**Evidence:** `unifi-dhcp-dns-change.md` L109: "It's NOT a DHCP reservation — it's the OS's static-style IP." The REGISTRY.yaml is named as the reference but there is no mechanism that enforces the IP in REGISTRY.yaml matches the live assigned IP, and no probe that fires if they diverge.

**Recommended fix:** Two options. Option A (preferred): create a DHCP reservation for Rocinante's MAC in UniFi (Settings → Networks → Default → DHCP → Reservations; pin MAC `<rocinante-mac>` to `192.168.1.171`). This makes the IP stable by controller policy, not by assumption. Option B: add an acceptance test that verifies `192.168.1.171` is Rocinante's actual active IP before applying the UniFi DHCP push, and add a daily-health probe that confirms the Pi-hole host IP matches what UniFi is advertising. Document which option is taken in the project audit trail.

---

### Charge 5 — UniFi API endpoint shape for v10.3.55 explicitly marked "NOT yet verified"; Path B is dead weight that could mislead a responder
**Severity:** Low-Medium
**Surface:** `unifi-dhcp-dns-change.md` Path B section, L62-64

**Claim:** Path B (UniFi controller API) is documented as an alternative to the Web UI path, but the doc itself includes the note "API shape NOT yet verified against this controller version (v10.3.55). First-run validation needed." This is not a review finding — it is explicitly flagged in the doc — but the implication is that Path B is offered as a recovery path that may not work. During an incident where the Web UI is misbehaving (the exact scenario Path B is designed for), an operator following Path B with an unverified endpoint shape is likely to waste time and may make things worse. An unverified recovery path is potentially worse than no recovery path, because it induces false confidence.

**Evidence:** `unifi-dhcp-dns-change.md` L62-64: "API shape NOT yet verified against this controller version (v10.3.55). First-run validation needed. The MongoDB-direct fallback (per the secrets-via-bitwarden Playbook 3) updates the same fields in db.networkconf."

**Recommended fix:** Either (a) verify the API endpoint shape before Phase 7 greenlight (run a GET against `/api/s/default/rest/networkconf` and confirm the fieldnames), or (b) downgrade Path B to a footnote explicitly labeling it "unverified — do not rely during incident" and promote the Web UI path as the sole recovery option. The current framing gives Path B parity it hasn't earned.

---

### Charge 6 — Phase 1 skip rationale is incomplete: placement doc decided Pi 4; this project decided Docker-on-Rocinante; the divergence analysis belongs in a Phase 1 artifact, not a parenthetical
**Severity:** Low
**Surface:** `INDEX.md` Phase plan table (row "1 Explore: skipped"), "Decision: Docker on Rocinante" section

**Claim:** The placement doc (pihole-placement-2026-05-04.md) explicitly recommended Pi 4 as the best long-term option and characterized Docker-on-Rocinante as "OK with fallback" — a downgrade verdict. This project inverted that recommendation, selecting Docker-on-Rocinante as the deploy target. The rationale for the inversion (time-to-deploy, urgency of the TV-watching question, reversibility) is present in the INDEX.md body — but it is embedded in prose, not surfaced as a Phase 1 finding that was then resolved in Phase 2's method ladder. The complex-project skill's Phase 1 purpose is to gather context that the plan needs and produce concrete artifacts; skipping it entirely because a prior doc exists elides the step where "the prior doc recommended X, current project chose not-X" would have been a formal finding with a documented reason. If a future Claude reads this project's audit trail, the divergence is visible only to a reader who happens to cross-reference both docs.

**Evidence:** `pihole-placement-2026-05-04.md` verdict column: Pi 4 = "Best long-term", Docker-on-Rocinante = "OK with 1.1.1.1 fallback." `INDEX.md` Phase 1 row: "skipped (placement doc already covered options space)." The prior doc's recommendation is not quoted or rebutted in the Phase 1 skip note.

**Recommended fix:** Amend the INDEX.md Phase 1 row to include a one-sentence explicit statement: "Placement doc recommended Pi 4; this project inverts to Docker-on-Rocinante on grounds of [speed/urgency/reversibility]; Pi 4 path remains the v2 target if Docker-on-Rocinante reboot frequency becomes a real problem. Rationale accepted and logged here." This is a documentation fix, not an architectural change. The reasoning is already in the INDEX; it just needs to be formally attached to the Phase 1 skip entry.

---

### Charge 7 — UniFi controller probe severity floor: yellow is too low given this is the failure mode that motivated the entire project
**Severity:** Low
**Surface:** `daily-household-health/SKILL.md` Step 2b, UniFi probe row

**Claim:** The new UniFi controller probe (Step 2b) classifies a non-200 response as yellow, escalating to orange only after >24h continuous failure. This means the first detection of a UniFi outage generates a yellow ping — not wrong, but recall that the triggering event (the 2026-05-13 crash) went undetected for 4 days not because of a missing probe but because there was no probe at all. Now we have the probe. Yellow on first detection is the right first threshold. But the escalation path from yellow to orange requires cross-referencing "last successful probe stored alongside the dated report" — a mechanism that is referenced in the SKILL.md table but not actually specified. Where is the last-successful-probe timestamp stored? How is it read? If the daily-health report writer doesn't implement that cross-reference, every outage stays at yellow indefinitely regardless of duration. The escalation mechanism is a spec assertion, not an implemented path.

**Evidence:** SKILL.md Step 2b table, UniFi row: "orange if down >24h (cross-reference last successful probe stored alongside the dated report)." There is no further specification of the storage format, file path, or read mechanism for that stored timestamp. The report-writing spec in Step 4 does not mention persisting probe results for next-day cross-reference.

**Recommended fix:** Either (a) specify the last-successful-probe persistence mechanism concretely (e.g., frontmatter field `last_unifi_ok: YYYY-MM-DDTHH:MM:SSZ` in the dated health report, read by the next run), or (b) simplify: just escalate to orange immediately on failure (yellow is adequate for the daily-health Google Calendar ping; the distinction between yellow and orange matters less when the probe fires daily). If you keep the yellow→orange escalation logic, it needs a concrete implementation, not a parenthetical.

---

### Charge 8 — `pihole/pihole:latest` + silent gravity update: verified-green window between deploy and next pull is 5 minutes at best
**Severity:** Low
**Surface:** `scripts/deploy-pihole-docker.sh` L121 (`docker pull pihole/pihole:latest`), L193 (`pihole -g`), and implicit: Pi-hole's built-in gravity update cron (default: weekly)

**Claim:** The script pulls `pihole/pihole:latest`, runs a gravity update, then smoke-tests claude.ai. This establishes a "verified green" moment. Pi-hole's default gravity update schedule (configured inside the container) runs weekly (Sundays, ~01:00 UTC by default). A subsequent gravity pull could add newly-listed domains that were not in the blocklist at deploy-time, silently breaking a Sartor service between gravity runs. The deploy script's smoke test provides no ongoing protection. This is a known operational reality with Pi-hole, but it is not acknowledged in the PLAN or INDEX as an ongoing operational risk. The pre-registered acceptance criteria (bucket B: "1-3 whitelist additions discovered") implicitly assume breakage is discovered post-deploy by Alton noticing something doesn't load — a human-latency detection path that may be hours or days.

**Evidence:** Pi-hole gravity cron default: `0 1 * * 7` (weekly, Sundays 1 AM). The deploy script runs one gravity pull at deploy time but no subsequent whitelist re-verification is scheduled. No daily-health probe checks whether a specific Sartor domain is still resolving (the current Pi-hole probe only checks that `google.com` resolves — a very weak liveness signal).

**Recommended fix:** (a) Strengthen the Pi-hole daily-health probe to include at least one positive-resolution check for a known-critical domain (`dig +short claude.ai @127.0.0.1` returning a non-empty result) and one negative check (`dig +short doubleclick.net @127.0.0.1` returning 0.0.0.0 or empty). This narrows the detection window from "user notices" to 24 hours. (b) Optionally: add a post-gravity-update hook (via `pihole -g --cron` or a cron wrapper) that re-runs the whitelist application. Pi-hole gravity does not remove custom whitelist entries, but acknowledging this in the docs removes ambiguity.

---

## What was NOT prosecuted

- **Docker volume persistence of whitelist + blocklists across restarts.** `pihole allow` and the sqlite3 adlist insert both write into the `pihole_etc` volume. Named Docker volumes persist across `docker rm -f && docker run` (they are not removed unless `docker volume rm` is explicitly called). On container image upgrade (`docker pull` + `docker rm -f` + `docker run`), the volumes survive. This is correct Docker behavior and the script exploits it correctly. No charge warranted.

- **`--restart unless-stopped` behavior when Docker Desktop is closed.** `unless-stopped` respects a deliberate `docker stop` but restarts on daemon restart. On Rocinante, if Docker Desktop is closed by the user (not a daemon crash), the container's restart policy still fires when Docker Desktop is reopened. This is the correct behavior for the stated goal. The PLAN acknowledges the "soft outage" during Docker restart with 1.1.1.1 fallback. No additional charge — the design is coherent.

- **Force-renew DHCP storm impact.** The unifi-dhcp-dns-change doc names this explicitly (Risks item 3: "1-2-second DHCP storm. Acceptable for the household"). For a ~15 device household, this is genuinely a non-issue. No charge.

- **DNS query privacy.** The INDEX.md handles the Constitutional constraint adequately: Pi-hole admin bound to LAN only, no external exposure, Fios DMZ points to gpuserver1 (not Rocinante), Pi-hole admin port 8053 not in any external port-forward. The threat model for the kids' device DNS data is appropriate given the system context. No charge beyond what Charge 3 already surfaces.

- **`dig +short google.com @127.0.0.1` as the daily-health Pi-hole probe running from Rocinante.** The probe will miss failures where Pi-hole is running and answering locally on the loopback but not answering on `192.168.1.171` (e.g., a Docker network bridge issue). This is a real failure mode gap, but the daily-household-health skill itself is a monitoring layer, not a production SLA guarantee. The yellow-severity output will reach Alton within 24 hours even if the failure mode is subtler than the probe detects. The gap exists; it is not severe enough to warrant a charge given the current health-check architecture. Charge 8 already presses on strengthening the probe substance; that's sufficient.

- **Phase 1 skip vs. complex-project skill rule.** The skill says "if the work decomposes into 3-7 collaborating chunks, use TeamCreate." This was single-shot. The placement doc existed. The skip is defensible per the skill's own guidance ("single-shot, use Agent"). Charge 6 presses on documentation adequacy; the skip itself is not a process violation.

## Verdict basis

Eight charges total: two High, two Medium, four Low-Medium or Low. No charge invalidates the architecture. The dual-DNS fallback, secrets handling, volume persistence, and pre-registered acceptance criteria are sound. The two High charges (OISD big vs. light mismatch; whitelist gaps on Sartor-critical financial and Okta domains) are pre-deploy fixes — the smoke test cannot catch what the whitelist doesn't cover, and the plan-vs-script discrepancy on blocklist choice is a correctness gap. Medium charges are operational (IP drift, docker inspect credential exposure), both fixable with specific actions before greenlight. Low charges are documentation and monitoring improvements that can land in Phase 5 without delaying the architecture.

Verdict: **REVISE.** Resolve charges 1 and 2 before Phase 7. Resolve or document charges 3 and 4 before Phase 7. Charges 5-8 can be addressed in Phase 5 revisions without re-blocking greenlight.

## Reply from the team
<!-- Empty. Orchestrator fills during Phase 5. -->
