---
type: cross-review
reviewer: red-team-adversary
reviewing: fiduciary-counsel
project: constitution-council-v06
date: 2026-05-13
related: [reviews/red-team-adversary, reviews/fiduciary-counsel, SYNTHESIS]
---

# Cross-review — red-team on fiduciary-counsel

The fiduciary-counsel review hits the right two attack surfaces on §14a but understates one. The two surfaces flagged were: (i) wiring-grant fixes touching files under entity-financial / family-medical / legal-document trees, and (ii) wiring-fix activity buried in git log rather than surfaced in the loop report. Both correct. But there's a third surface fiduciary-counsel missed: **the peer's wiring grant authorizes commits to a repository that also gets mirrored to GitHub via Rocinante's scheduled task.**

This matters because the peer commits to the canonical bare repo on rtxserver, which Rocinante mirrors to GitHub every 15 minutes. A wiring-fix commit message that names a file or path with sensitive context — even if the *content* of the fix is mechanical — becomes public on GitHub within 15 minutes. The wake-13 vast_metrics chmod-fix commit message named the vast.ai package directory; harmless. A hypothetical wiring-fix on a path that *names* a Sante Total or Solar Inference internal directory would not be harmless even if the fix itself preserved intent.

Recommend extending fiduciary-counsel's clause-1 to: *the wiring grant does not authorize touching files under entity-financial, family-medical, or legal-document trees, AND wiring-fix commit messages must not reference paths under those trees regardless of which file the fix actually touches.*

On the §7 ratification, I think fiduciary-counsel was too quick. The "for the record" note about project-tree-sync extending the Google surface beyond the banking-email posture is exactly the kind of posture-extension the council should not let pass with a footnote. Recommend that note be elevated to a §7 concern in the SYNTHESIS, not buried as a fiduciary-counsel record-note.

On §16 and §1, agreed. Fiduciary-counsel's reading is correct and load-bearing.
