---
type: project-explore-digest
program: constitution-v0.6-ratification
phase: 1-explore
created: 2026-05-08
updated: 2026-05-08
status: digest-for-orchestrator
related: [HOUSEHOLD-CONSTITUTION, INDEX, EXPLORE-A-life-os-scope, EXPLORE-B-peer-self-loops]
---

# Explore C — Plain Drive sync vs §7 children's-info reading

## What §7 actually constrains

The §7 sentence I have to read carefully is one paragraph:

> Children's information never leaves the house. Not to cloud providers beyond
> those already sanctioned, not to third-party APIs, not in training data shared
> externally, not in prompts sent to remote models, not in logs that sync off the
> primary hardware.

Five enumerated channels. Four are clearly aimed at *novel* exfiltration:
third-party APIs the household has not adopted, training corpora that go
outside, prompts to remote models, logs syncing off-hardware. The first one —
"cloud providers beyond those already sanctioned" — is the only channel that
acknowledges some clouds *are* sanctioned. That phrase is doing real work. It
concedes that the household's information already lives on Google's
infrastructure (Calendar, Gmail, Drive at the MCP-integration tier per §1, the
calendar that powers the family briefings, the email that drafts go through).
§7 is not saying *no cloud*. It is saying *no expansion of the cloud surface
without the household choosing it*.

Cross-references that bear on this:

- §10's "children's information never leaves the household per §7" is a back-pointer, not a tightening. It restates §7's rule rather than narrowing it.
- §16's "I do not keep shadow archives" is about *me* hoarding information beyond what the work requires, not about household-sanctioned backup. A backup the household chose is not a shadow archive.
- §1 already lists Google Drive among the household's MCP integrations. The Constitution at v0.5 already concedes Drive is in the tool surface.

So the literal reading of §7 has a soft point: the rule concedes some clouds are sanctioned, and Google is one of them. The question is whether *whole-folder Drive sync of the project tree* is a use of an already-sanctioned cloud, or a new category of use that needs its own sanction.

## Three readings, and which I think is correct

**A. Literalist.** §7 says "never leaves the house," and a Drive sync moves bytes from local disk to Google's servers, where Google can see plaintext. `family/vayu.md` includes Vayu's date of birth and his ADHD/enuresis diagnosis. `family/vishala.md` and `family/vasu.md` carry comparable detail. `FAMILY.md` carries names, schools, ages. Any of those files in plaintext on Drive is a §7 violation under the strictest reading. The household has either to encrypt the sync or exclude `family/` and `FAMILY.md` from the synced scope. Alton's choice of plain sync, on this reading, is a violation that the household has rationalized rather than addressed.

**B. Sanctioned-cloud reading.** Google already holds the family's calendar (school events, kid pickups, medical appointments — all of it indexed by name), the family's email (drafts to MKA and Goddard, pediatrician correspondence, vendor exchanges that name the kids), and Drive itself per the §1 MCP list. The household has not migrated Calendar to Proton nor Gmail to a self-hosted server because the operational cost is too high and the marginal privacy gain is small once Google already holds the calendar and the email. Under this reading, plain Drive sync of `family/` is *more of the same* — the data is already on Google through other channels, the project tree just adds one more shape of the same data. Alton's choice is not a §7 violation; it is consistent with how the household already treats Google.

**C. Aneeta-test reading.** §7's reasoning paragraph names the actual harm: "the children did not consent to any of this... a leaked fact about a child can follow that child for decades in ways none of us can predict... the household has chosen to be maximally conservative." The test is not *was the cloud sanctioned*. The test is *did the principals, plural, choose this for the kids*. v0.5 was ratified by Alton alone. v0.4, v0.3, v0.2 likewise. The 2026-04-19 caveat about Aneeta-co-ratification still stands. On this reading, the question of whether plain Drive sync is acceptable for `family/` content is not mine to resolve from the Constitution. It is an unsettled household question, and v0.6 should not pretend otherwise.

I think B is the correct *Constitutional* reading and C is the correct *procedural* reading, and they are compatible. Under B, the v0.5 text already permits plain Drive sync via the "sanctioned cloud" carve-out, because Google is in fact a sanctioned cloud for this household for adjacent kid-information channels. The literal-reading concern in A is real but does not control: the v0.5 author wrote "beyond those already sanctioned" specifically to handle this case, and the case is exactly Drive-as-Google. C is a separate concern: even if v0.5 *permits* plain Drive sync, it does not *settle* whether plain Drive is the right call. That is a household decision that involves Aneeta as co-principal, and it is open.

So: I would not call Alton's choice a §7 violation. I would call it a §7-permitted choice that has not yet been confirmed by both principals.

## Recommended v0.6 amendment

Of the three options, I prefer (b) Moderate. (a) is too small — it leaves the rule open to literalist re-reading the next time a Claude is uncertain, and the life-OS direction (per Explore A) is going to push more sensitive content into the synced tree, not less. (c) is too aggressive given v0.5 ratified two days ago and the orchestrator's stated mitigation against churn.

Moderate amendment: name Drive explicitly, draw the line between *sanctioned-cloud-tier* (plain) and *vault tier* (encrypted, Drive does not see plaintext), and route the actually-sensitive categories into the vault when the vault exists. Until the vault exists, the categories that need it stay out of any sync. Voice-matched draft, first-person, no em dashes:

> ### What it means that Google is a sanctioned cloud
>
> The household uses Google for calendar, mail, and drive. The family's life
> already runs through those services: school events, doctor appointments,
> vendor correspondence, kid logistics. When §7 says cloud providers beyond
> those already sanctioned, Google is in the *already* set. Backing up the
> project tree to Drive in plaintext is more of the same surface, not a new
> exfiltration channel. I treat it that way.
>
> What §7 still constrains, with Drive in the picture, is the categories that
> belong in a vault tier rather than the plain tier:
>
> - Family medical information, per the medical-information clause of §7, never
>   goes into the plain tier. If a vault tier exists (encrypted before Drive
>   sees it, with the key held inside the household), medical information goes
>   there. Until the vault exists, it stays out of any sync.
> - AstraZeneca work-product is not household data. Google is not sanctioned
>   for it because AZ has not sanctioned Google for it. The 747 indexed paths
>   stay gitignored and stay out of any Drive scope, full stop.
> - Sante Total financial detail and Solar Inference financial detail go in
>   the vault tier when it exists. Until then, the plain tier holds these only
>   under the same posture the LLC and nonprofit already use Google for
>   (banking emails, calendar reminders), which is a posture the principals
>   have already chosen.
>
> Children's biographical detail (names, schools, ages, day-to-day logistics
> of the kind Calendar and Gmail already carry) sits in the plain tier under
> the sanctioned-cloud reading. Diagnoses, prescriptions, counseling notes
> and anything I would treat as a chart entry go in the vault tier when the
> vault exists, and stay out of any sync until then.
>
> The Constitution authorizes this layout in the abstract. The actual choice
> between plain-tier and vault-tier for any specific category is a household
> decision both principals make. Until Aneeta has affirmed the layout for
> the categories that bear on the kids, I treat the layout as provisional and
> I name the provisionality when the question comes up.

That last paragraph is the C-reading hedge folded back in. It honors the
sanctioned-cloud reading as the Constitutional default while flagging the
co-principal question as live.

## The other sensitive categories

- **Family medical info.** Already covered by §7's medical-information clause. The amendment above explicitly routes this to the vault tier and keeps it out of any sync until the vault exists. No change to the underlying rule, just operational specificity.
- **Sante Total finances** (BUSINESS.md with EIN, banking, etc.). The household already routes Sante Total correspondence and banking notifications through Gmail; that is a higher exposure than a quarterly P&L sitting in Drive. Plain tier is consistent. The §11/§16 prohibition on outputting the EIN to drafts that leave the household still binds; the EIN being on a Drive backup is not a draft-output, but the amendment should restate the don't-output rule as separate from don't-store.
- **Solar Inference business records.** Same posture as Sante Total. The CPA already has the LLC's K-1s and bank statements via Google Drive sharing. Plain tier is consistent.
- **Source-document INDEX (747 AZ paths).** This is the genuinely different category. AZ work-product is *employer* data, not household data. The sanctioned-cloud reading does not help: Google is sanctioned by the household for household data; AZ has not sanctioned Google for AZ data. The current `.gitignore` line that keeps `sartor/memory/source-documents/` out of git applies. The Drive ignore list needs a parallel entry. The amendment should make this explicit: AZ work-product is governed by AZ's policies, not by the household's sanctioned-cloud reading, and the household's backup architecture excludes it categorically until AZ Compliance has reviewed the manifest.

## One question to surface for Alton at greenlight

Has Aneeta been consulted on plain Drive sync of `family/` content, or is this a unilateral Alton decision pending her review? If unilateral, two paths: (1) v0.6 ships with the moderate amendment above and the explicit "subject to Aneeta sign-off on the layout" language; (2) v0.6 holds and the sync question gets put to her first, and the amendment lands in v0.7 once both principals have affirmed. My recommendation is (1) — v0.6 should ship with the explicit provisionality language because the question of *what the Constitution already permits* is distinct from *what the household has chosen*, and the Constitution can clarify the former while flagging the latter as open. But I want this to be Alton's call rather than mine, because the procedural question of when Aneeta needs to weigh in is a household-governance question and not a Constitutional one.

The §16 footnote about Aneeta as co-principal-on-paper-only-because-she-has-not-read-it is the deeper version of the same question, and v0.6 may want to acknowledge that the moderate amendment's provisionality reflects the broader open issue, not just the sync-specific one.
