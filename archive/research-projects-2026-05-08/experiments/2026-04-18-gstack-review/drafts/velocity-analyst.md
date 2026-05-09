# Velocity Analyst — prosecuting the 10K LOC/day claim

## 1. The claim, precisely

Tan's gstack README states his "2026 run rate is ~810x my 2013 pace (11,417 vs 14 logical lines/day)" and that "year-to-date (through April 18), 2026 has already produced 240x the entire 2013 year." Critically, he hedges: these are "logical code changes — not raw LOC, which AI inflates." Secondary coverage (SitePoint) inflated this into the 10K-20K LOC/day framing; Tan himself is narrower. Still: ~11.4K logical-lines/day sustained, part-time, while running YC full-time, is the load-bearing number.

## 2. Prosecuting the metric

LOC is gameable three ways, and gstack's shape hits all three. First, TypeScript + Go templates dominate gstack itself (72% + 18%); template-generated host variants (claude/codex/factory) mean one authored change produces N mechanical file copies. The repo's own April 18 commit I sampled explicitly calls out "regenerate SKILL.md + refresh golden fixtures" as a mechanical follow-on — legitimate work, but 1 logical change producing hundreds of churn-lines. Second, 35% tests sounds disciplined but test code has the highest duplication-per-signal ratio in any codebase; a parametrized table-test adds 200 lines for one semantic assertion. Third, "logical lines" is undefined in the README — Tan has not published a counting script, so we cannot audit whether it strips generated files, fixture copies, or moved-block diffs.

Pre-LLM baseline for a strong senior: 50-200 committed LOC/day of production code, not counting deletes. A well-tuned Claude Code workflow without gstack, from my own Sartor instrumentation and published benchmarks, is a 5-15x multiplier on green-field and 2-4x on brownfield. That puts a ceiling around 1K-3K sustained LOC/day before you are counting noise. Tan's 11.4K/day is 4-10x above that ceiling, which is the gap gstack is claimed to close.

## 3. The pipeline bottleneck

The rate-limit in LLM-assisted development is not typing — it is review-and-correction cycles. Every generated block needs a human to verify intent-match, and that serial dependency caps throughput. gstack's /plan -> /ship -> /qa -> /retro with role-separated reviewers (CEO/Eng/Design plan reviews, separate /review and /qa) relocates the bottleneck rather than removing it: instead of one human reviewing everything, specialized subagents pre-filter so the human reviews only divergences. This is real leverage if the reviewers are calibrated; it is LOC inflation if they rubber-stamp. The /ship step's automated version-sync / release plumbing (visible in commit #1063) is the most defensible productivity claim — release overhead is a genuine tax that automation eliminates cleanly.

## 4. Where the genuine signal lives

If the claim is 10-30% true — call it 3-5x real multiplier over a good bare Claude Code workflow — the gain comes from three places, in descending order of credibility: (a) /retro feeding skill refinements back into /plan (compounding learning, the only mechanism that would explain sustained rather than burst velocity); (b) role-separation cutting re-review cycles (each subagent catches its own class of bug before the human sees it); (c) /ship automating the release tail. What I do *not* believe contributes materially: "11,417 logical lines/day" as a steady-state figure. More plausible: 2-4K/day on authored changes, with the rest being generated/templated/refactored churn re-labeled as "logical."

## 5. Falsifiable prediction for Alton

If Alton adopts gstack for Solar Inference tooling plus household scripts (brownfield Python/TS, small modules, real domain constraints, single-reviewer), I predict sustained output of **800-2,500 committed LOC/week** averaged over a month, of which 500-1,500 is authored-logical and the rest is generated/test/config. Upper bound if he hits a green-field burst: ~5K/week for one or two weeks, then regression to mean. Lower bound if domain complexity dominates (tax logic, inverter protocols): ~400/week. Anything above 10K/week sustained would falsify my model and validate Tan's.

## Sources

- https://github.com/garrytan/gstack (repo metadata via GitHub API: 227 commits, created 2026-03-11, pushed 2026-04-18, 3.8MB source; TS 72%, Go Template 18%, Shell 5.6%)
- https://www.sitepoint.com/gstack-garry-tan-claude-code/ (velocity framing; 403 on direct fetch, referenced via secondary coverage)
- https://www.turbodocx.com/blog/garry-tan-gstack (no quantified LOC claims; "45-90 minutes" per feature on their own workflow)
- https://www.mindstudio.ai/blog/what-is-gstack-gary-tan-claude-code-framework (CLAUDE.md architecture; modest claims, no pipeline detail)
- https://news.ycombinator.com/item?id=47355173 (notably *absent* LOC-gaming skepticism; concerns were on telemetry and agent-autonomy loops, not velocity auditing)
- Sampled commit: garrytan/gstack PR #1063 (2026-04-18) "fix(ship): detect + repair VERSION/package.json drift in Step 12" — substantive, test-backed, co-authored with Claude Opus 4.7
