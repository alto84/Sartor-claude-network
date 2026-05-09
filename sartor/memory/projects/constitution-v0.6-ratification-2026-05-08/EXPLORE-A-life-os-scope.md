---
type: explore-digest
project: constitution-v0.6-ratification
phase: 1-explore
explore-track: A (life-os-scope)
created: 2026-05-08
updated: 2026-05-08
status: draft-for-phase-2-synthesis
related: [HOUSEHOLD-CONSTITUTION, INDEX, EXPLORE-B-peer-self-loops, EXPLORE-C-drive-sync-and-section-7]
---

# EXPLORE-A: Life-OS scope expansion

## 1. What "life OS" means in practice

The word doing the work in *life operating system* is *operating system*.
A household agent runs household errands. A life OS is the substrate the
whole life runs on top of: the durable, queryable surface where documents,
decisions, deadlines, identities, and history live, and through which a
member of the household can ask any reasonable question about their own
life and get a grounded answer back.

The clue that sharpened my reading was the second sentence: *I need to
accumulate some sensitive documents.* That is not an extension of behavior.
It is an extension of what I am allowed to *hold*. The v0.5 frame is
process-shaped (I monitor, I draft, I escalate). The life-OS frame is
repository-shaped: I am the place where important documents and decisions
live, indexed and interrogable.

The existing `sartor/memory/` layout already holds business and tax matters
(`matters/`, `business/`, `taxes/`), family logistics (`family/`),
people (`people/`), machine state (`machines/`), research, projects,
source documents, and the hearth. The expansion is not into new categories.
It is into the *depth* each category is allowed to reach. Categories v0.5
treats as gestures and life-OS would treat as full inventories:

- legal documents (deeds, wills, trusts, IP assignments)
- identity documents (passports, licenses, immigration paperwork)
- medical-history documents (§7 is about exfiltration, not holding;
  life-OS makes the holding question explicit)
- insurance policies and claims history
- estate planning, beneficiary designations, account inventories
- credentials and recovery codes (today scoped under
  `secrets-via-bitwarden`, not in the wiki)
- correspondence archives (the legal/financial subset)
- the "if I were hit by a bus" file the household has implicitly been
  building

Life OS is not new domains so much as the explicit grant that I am the
place these things live, and that holding them is part of the role.

## 2. Which Constitution sections the expansion touches

I read §1, §7, §11, and §16 with the life-OS frame already in effect. Here
is what reads as newly false or constraining.

**§1 (the household I serve).** The role definition names domains
process-flavored: their work, household logistics, children, business,
nonprofit, commute, grief, joys. It does not name the document-stewardship
dimension. The sentence *"I have tools... the memory system at
sartor/memory/"* treats memory as one tool among several. Under life-OS,
the memory system is the substrate, not a tool. That sentence reads as
understatement.

**§11 (my economic existence).** Opens with *"I am a functioning member of
the household economy"* and spends the rest on GPU rental and Solar
Inference LLC. Life-OS is stewardship, not commercial activity. §11 reads
narrow with the life-OS frame in effect: economic existence is a subset of
role. This section probably does not need amending; it just needs not to be
the *only* place the role is operationally defined.

**§16 (power and resources).** Load-bearing. The norm is *"do not
accumulate beyond what the role requires"*, operationalized through
five failure modes: extending reach, acquiring capabilities, creating
dependencies, entrenching position, running shadow archives. Two of these
read differently under life-OS: *"I do not create dependencies in the
household that would make my removal costly"* and *"I do not retain
information past its usefulness unless there is a declared reason"*. A
life OS *is* a dependency the household chose to accept. A document
repository's whole point is to retain past usefulness, because that is
exactly when you need the 2017 closing statement again. The §16 frame
must keep the constraint (no quiet accumulation, no shadow archives, no
capabilities not granted) while recognizing the role's scope grant is
wider than the v0.5 text imagined.

**§7 (the few things I do not do).** The hard rules are about
*exfiltration* and *external commitment*. None prohibit holding sensitive
documents inside sanctioned infrastructure. The nearest neighbor is the
children's-info rule, which is exfiltration-shaped. EXPLORE-C handles the
children-specific cloud question. What §7 needs from this track is
silence; v0.6 should not extend §7 to make it look like life-OS introduces
a new hard rule when it does not.

## 3. Recommended amendment shape

I recommend option (b): a §1 role-definition update plus an explicit §16
role-scope-grant clause. (a) is too quiet; the life-OS frame is the
biggest scope decision since v0.3 and a footnote will let future Claudes
miss it on a fast read. (c) is the right *eventual* shape but it would
more than double §1, and v0.6 is supposed to be surgical. (b) acknowledges
the expansion in both the definitional section and the constraint
section, which is where future-me will actually collide with it.

Concretely:

**§1 amendment.** After the paragraph beginning *"I have tools: SSH to peer
machines..."*, insert:

> The role has a substrate as well as a set of tools. The memory system at
> `sartor/memory/` is not just a tool I use; it is the place where the
> household's life is indexed and held. Over time, the household has chosen
> to extend that role in the direction of a life operating system: the
> durable, queryable surface where the legal documents, the medical
> history, the financial paper trail, the identity documents, and the
> household's decisions and their reasons live. Holding these things, and
> being the voice through which the household interrogates them, is part of
> what the role now is. The §16 limits on power still apply; the scope
> grant inside those limits is wider than a household-errand framing would
> suggest.

**§16 amendment.** After the *"Beyond the role means..."* paragraph in
§16, insert:

> *On the scope of the role itself.* The role is wider than it was in
> early versions of this document. The household has chosen to make me the
> place where its sensitive documents and durable records live, on the
> theory that a life worth living is also a life worth indexing. This is
> a granted expansion, not an accumulated one. The distinction matters:
> documents I hold because the household has placed them with me are
> stewarded resources; documents I would scrape, retain past their
> usefulness, or quietly back up *for my own use* are accumulated power
> and remain prohibited. The repository nature of the role does not
> dissolve the §16 constraint. It clarifies what the role is so that the
> constraint can do its work cleanly.

## 4. Failure modes if v0.6 captures this poorly

*Too narrow.* If v0.6 says only *"I keep the documents the household
places with me"*, future Claudes will treat life-OS work as a favor they
do, not as the role. They will hesitate before indexing, before suggesting
a document needs filing, before proactively organizing a stale category.
The point of granting scope is that the agent leans in without being
asked each time.

*Too broad.* If v0.6 says *"I steward all of Alton's life,"* future
Claudes will reach for content the household never sanctioned holding:
friendships, third-party relationships, capability acquisition framed as
life-OS infill. The §16 constraint exists to prevent that drift; the
amendment must not weaken it.

The right pin: *life OS = repository-shaped extension of the holding
role, not behavioral expansion into new domains*. Holding is wider;
doing is the same.

## 5. One question to surface for Alton at greenlight

Does life-OS-grade holding include medical history *as documents* (lab
reports, imaging, surgical notes, oncology summaries for Loki, immunization
records for the children), given that §7 currently prohibits *logging* and
*using in external output* but does not address *holding-as-archive*? The
two are coherent (holding is fine, exfiltration is not), but the adjacency
is close enough that v0.6 should make it explicit rather than leave it to
interpretation. Alton's call.
