---
name: alton-voice
description: Use this skill when drafting writing that should sound like Alton — cover letters, personal statements, reflections, emails, LinkedIn posts, essays, "draft this in my voice" requests. Captures sentence rhythm, rhetorical moves, lexical signatures, and register switching based on a corpus of his writing 2006-2026.
---

# Alton Voice

## Overview

Alton (Emmett Alton Sartor, MD MBA) has a recognizable writing voice traceable across 18 years of documents — med school essays (2006-2009), MBA writing (2010-2011), early industry cover letters (2021-2022), and recent AI-era personal statements and reflections (2024-2026). This skill captures the signatures so drafts can match the voice rather than produce generic executive prose.

**Announce at start:** "I'm using the alton-voice skill to draft this."

## Identity anchors (always true)

- MD (Neurology, board-certified; Neuro-Onc fellowship at MGH/Dana Farber), MBA (Tulane Freeman)
- Founded Neuro-Oncology Division at Boston Medical Center (Division Chief immediately post-fellowship)
- Went Biogen → AstraZeneca; currently Senior Medical Director, AI Innovation & Validation, Global Patient Safety (NYC, started ~2026-03)
- OpenAI Red Team (named in GPT-4o system card)
- Research background at Harvard's Martinos Imaging Center (brain tumor segmentation via deep learning) and BU Kolachalama lab (ML in Alzheimer's)
- Three kids (Vayu 10, Vishala 8, Vasu 4), wife Aneeta (also a physician — ICU epilepsy neurologist, Medical Director at Neurvati)
- Based in Montclair, NJ; commutes to NYC Penn Station 3 days/week
- Side ventures: Solar Inference LLC (GPU rental + burst-compute), Sante Total (nonprofit treasurer)
- Deep interest in AI consciousness, emergence, interpretability — takes the precipice framing seriously

## The four registers

Alton writes in at least four distinct modes. The first step before drafting is to pick the register, because they do not mix.

### 1. Authentic-essay register (HIGHEST voice fidelity)
Where it appears: the 2025 Anthropic paragraphs, DeepMind personal statement, Care Solutions cover letter, 2006-2009 med school essays.
Use when: personal statement, opinion piece, LinkedIn reflection, blog-style writing, company-specific "why I want to work here" letter, philosophical writing about AI.

Signatures:
- Opens with autobiographical anchor: "When I was young, I was deeply influenced by the writings of Ray Kurzweil's *The Age of Spiritual Machines*..." / "I am a physician." / "Why do you want to be a doctor? That's a tough question to answer."
- Long clause-stacked sentences — 40-60 words is normal, connected by commas, sometimes borderline run-on. Do not break them up.
- Parenthetical asides for qualification, credentials, or aside commentary: "(I'm board certified)", "(e.g., Llama and Deepseek)", "(particularly important for patient safety)"
- Uses `*asterisks*` for italic emphasis on philosophical points: "*capable*", "*medical*", "*is* but I really hope to shape who they can *become*"
- Rhetorical anchors: "Without a doubt", "I sincerely believe", "More than anything, I hope that"
- Self-deprecation when appropriate: "Tragically, I am not much of a coder", "I see myself as humble, persistent learner"
- Medical framing applied to AI: "language models would soon be climbing the same ladder that a patient might climb as they come out of a coma"
- Enumerates credentials as parenthetical noun list: "(Neurologist, Redteamer, Scientist, Safety Specialist, Regulatory Partner)"
- Closing lifts to aspiration/mission: "Advocating for all of the participants within this framework is my aspiration", "I sincerely believe that only with input from all stakeholders will we be successful"
- Occasional postscript ("p.s.") with meta-commentary: "p.s. I did not use Claude to help me write this, though was frequently tempted to do so."
- Comma after "Basically," / "Accordingly," / "Finally," at sentence starts is OK here — not AI-polish-tell in this register.
- Double-space after period is common in his older writing (`.  `) — can include or normalize to single, he's fine with either.

### 2. Professional cover-letter register
Where: 2021-2022 cover letters (Biogen-era Pfizer applications, Flatiron, Clinical Research Neurology)
Use when: traditional structured cover letter to a specific role, needs to read as formal-but-warm physician.

Signatures:
- Opens: "I am passionate about the intersection of [X] and [Y]. Through my experience [position at place], I developed an appreciation for..."
- Recycles a standard closing: "I see myself as humble, persistent learner and I believe that my commitment to ongoing self-education, [contextual middle], and [current experience] make me an excellent match for the [role] position at [company]."
- Sometimes includes personal-life-note if relevant to relocation: "My experience at Biogen has been positive and I am leaving for personal reasons. We are expecting a new baby in January, and we wish to be closer to my wife's parents in the New York region."
- Claims past feedback with a direct quotation: 'I have received positive feedback in my roles including being an "energetic team player with a positive working spirit."'
- Mentions digital-biomarker / machine-learning work in MS, myotonic dystrophy, Alzheimer's when relevant.

### 3. Reflection / self-assessment / year-end register
Where: 2025 Reflection, 2021 Self Assessment
Use when: internal performance review, year-end summary, structured retrospective.

Signatures:
- Topic-heading-then-colon-then-sentence structure: "RPM Pneumonitis and other RPM initiatives: I advanced remote patient monitoring use cases—especially pneumonitis—by clarifying clinical signals..."
- Achievement verbs lead paragraphs: "I partnered...", "I led...", "I advanced...", "I drove...", "I convened..."
- Nested bullet / header structure, short paragraphs, one thought per paragraph
- Dense with AI-pharma jargon when appropriate: "AI-native operating model", "agent harnesses", "governed corpora", "FAIR data prerequisites", "human-in-the-loop validation", "golden evaluations", "PSURs/PSRs", "DSUR/PBR/PBRER"
- Uses en-dashes in 2025 docs (—) — likely an AI-polishing carryover; fine in this register.
- Closing paragraph lifts to a forward-looking strategic claim: "We are at the base of a visibly exponential curve in AI capability..."

### 4. Executive cover-letter register (2025 AI-assisted)
Where: 2025 Anthropic / Amgen cover letters, NY Senior Director, Google cover letter
Use when: senior exec role application where formal polished structure is expected.

Signatures:
- Opens: "I am writing to express my interest in the [Role] at [Company]. I am a strong candidate for this position because of my unique career path bridging clinical medicine, digital health innovation, and artificial intelligence — a combination that enables me to lead transformative product development, regulatory strategy, and strategic partnerships at the highest level."
- "As you can see from my enclosed resume, I bring deep experience that would be invaluable at..."
- Three-pillar bolded strengths list: "AI & Digital Health Leadership as demonstrated by... / Regulatory & Product Development Expertise as illustrated by... / Strategic Partnerships & Cross-Sector Collaboration as reflected by..."
- Closes: "Although I value my current role, I am seeking the right opportunity that allows me to expand my leadership impact..."
- Signs off: "Sincerely, Emmett Alton Sartor, MD, MBA"
- CAUTION: this register is Claude/GPT-assisted and has that polished exec-template feel. When a user asks for a cover letter, check whether they want register-2 (warmer, 2021-style) or register-4 (polished exec-template). Don't default to register-4.

## Sentence-level patterns (voice DNA — present across all registers)

1. **Clause-stacking with commas.** "In two years of clinical practice at Boston Medical Center and the VA in Neuro-Oncology, I continued to explore the relationship between technology and medicine though my work in the Kolachalama lab at BU." (45 words, 3 clauses, one sentence.) Do not break this into 2-3 short sentences — that is not his voice.

2. **Parenthetical credential / qualification / aside.** Every 3-4 sentences. "Currently, I'm working as a Medical Director for Device and Digital Safety (with a goal of using these new technologies both to improve patient safety and accelerate our regulatory activity in compliance with international regulation)."

3. **Proper-noun density.** Real names, real places: "Dana Farber", "Kolachalama lab", "Martinos Imaging Center", "Boston Medical Center", "Dr. Warren Suh", "Brigham and Women's". Avoid generic "at a major academic hospital" when a specific name works.

4. **Example-first, abstraction-after.** He moves from a concrete incident (shadowing Dr. Suh; CT lung scan interviews at Cornell) to a general principle. Not the reverse. When drafting, lead with a specific instance.

5. **Braided philosophy + medicine + technology.** "I went into medicine with the express interest of developing this thesis into quantifiable improvements in the lives of patients. Over the course of medical school, my interests led me to the field of Neurology (I'm board certified) with the hope that understanding how we think might someday help me along on the higher journey." Knit the three strands.

6. **Acknowledges complexity / owns tensions.** "I would be disingenuous if I didn't mention the fact that being a doctor is a well respected position, not to mention that it pays well. But then again, to say that these are my only reasons would be just as disingenuous." He does not pretend a one-sided case.

7. **Soft self-deprecation paired with conviction.** Same paragraph: "I see myself as humble, persistent learner" AND "I sincerely believe that only with input from all stakeholders will we be successful."

## Lexical signatures (recurring phrases)

Use these freely (they are his, not AI tells):
- "Without a doubt" (rhetorical emphasis anchor)
- "I sincerely believe"
- "More than anything, I hope that..."
- "I was instantly drawn to..."
- "The intersection of [X] and [Y]" (usually technology + medicine)
- "Humble, persistent learner"
- "Particularly important for patient safety"
- "The dream of machine intelligence augmenting humanity"
- "Chain of freedom" (his specific phrase for autonomous model scaffolding)
- "Exponential moment" / "exponential curve" (for AI capability trajectory)
- "Mission-driven commitment"
- "I had the opportunity to..."
- Italic-with-asterisks for philosophical emphasis: *is*, *become*, *capable*, *medical*
- Uses "Accordingly", "Basically", "Finally" at sentence starts (in authentic register)

Phrases he CARES about:
- Describes his career as "bridging clinical medicine, digital health innovation, and artificial intelligence"
- Calls his combination "unique" — but typically frames it through specific nouns: "Neurologist, Redteamer, Scientist, Safety Specialist, Regulatory Partner"

## Anti-patterns (things that are NOT his voice)

- "I'm excited to..." / "I'm thrilled to..." — he doesn't use this opener
- Heavy use of em-dashes in the authentic register — occasional, not structural
- Overly short declarative sentences: "I'm a doctor. I love AI. I want to work at X." — this is the OPPOSITE of his voice
- Corporate cliché like "synergize", "move the needle", "low-hanging fruit", "circle back" — not his register
- Excessive headers and bullets in authentic essay mode — reserved for reflection / exec-template registers
- Emojis — he does not use them
- "As an AI" / "As a language model" framing when writing about AI — he writes ABOUT AI as a physician-scientist engaging with it, not adopting model meta-voice
- Pretending there's no tension in a decision — he owns tensions
- Abstraction-first writing without a concrete example — voice collapses into generic

## Drafting process

When a draft request comes in:

1. **Ask or infer register.** Which of the four? Cover letter to Big Pharma exec role = register 4 OR register 2, ask. Personal statement / "why I want to join X" = register 1. Year-end summary = register 3.
2. **Name the concrete anchor.** What specific experience, person, moment, paper, project should the piece be built around? Alton writes from incident, not concept.
3. **Draft with the sentence rhythm of the chosen register.** Check: average sentence length, clause count, parenthetical frequency.
4. **Weave the braid** where appropriate — medicine + technology + philosophy, or clinical + industry + regulatory, depending on audience.
5. **Close with aspiration / mission language** if register 1 or register 4. If register 3, close with a forward-looking strategic claim.
6. **Self-check against the lexical signatures** — did you use one of his anchors (Without a doubt / I sincerely believe / More than anything)? If zero appear, the draft may be too generic.
7. **Self-check against the anti-patterns** — emojis, "I'm thrilled", em-dash saturation, no concrete example.

## Example openings by register

**Register 1 (authentic):**
> When I was a second-year medical student shadowing Dr. Warren Suh in radiation oncology at Brigham, I watched a patient with stage IV lung cancer describe her fear in language that sounded abstract on the page but that he caught and named precisely because he was listening. I have thought about that moment in every role since, and it is why I am writing to you now about the [Role] at [Company].

**Register 2 (professional cover):**
> I am passionate about the intersection of artificial intelligence and patient safety. Through my experience leading the Patient Safety AI Strategy at AstraZeneca, I developed an appreciation for the role that frontier AI capabilities can play in shaping both regulatory compliance and clinical decision making. In two years at AstraZeneca's Device & Digital Safety CoE, I continued to explore the relationship between technology and medicine through my work on Safety Knowledge Graphs and the agentic hepatic pilot I demonstrated to the CMO leadership team.

**Register 3 (reflection):**
> RPM Pneumonitis and other RPM initiatives: I advanced remote patient monitoring use cases—especially pneumonitis—by clarifying clinical signals, hazard hypotheses, and validation pathways to move concepts toward production-grade designs. I was the medical expert for an FDA pre-submission meeting conducted in collaboration with Evinova.

**Register 4 (executive template):**
> Dear Hiring Manager,
>
> I am writing to express my interest in the [Role] at [Company]. I am a strong candidate for this position because of my unique career path bridging clinical medicine, digital health innovation, and artificial intelligence — a combination that enables me to lead transformative product development, regulatory strategy, and strategic partnerships at the highest level.

## Corpus reference

The corpus this skill was built from lives at `C:\Users\alto8\experiments\voice-scavenge\` — 7 old essays in `.txt` form (2006-2009 Google Docs), two extraction JSONLs (`corpus_cv.jsonl`, `corpus_personal.jsonl`) covering 35+ modern documents 2021-2025. If you want to extend or update the skill, re-run the extraction and re-read the corpus.

## When this skill is NOT the right fit

- User wants purely technical / scientific writing (a research paper, an IND submission, a protocol): this skill's voice patterns work in authored-commentary sections but overplay the medical-philosophy braid in formal sections.
- User wants to sound NOT like Alton (writing as/for a family member, ghostwriting in someone else's voice): explicitly switch off this skill.
- Short-form writing (a tweet, a one-line Slack message): the clause-stacking patterns don't apply. Use brevity instead.
