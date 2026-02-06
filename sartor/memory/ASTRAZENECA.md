# AstraZeneca - AI and Safety Context
> Last updated: 2026-02-06 by Claude

## Key Facts
- AZ has significant internal AI tools: MILTON, JARVIS
- Pharmacovigilance is a major AI application area
- Multiple data sources feed safety monitoring
- Explainable AI is critical for regulatory acceptance

## AZ Internal AI Tools

**MILTON:**
- Disease prediction model using 67 biomarkers
- AUC > 0.7 for 1091 diseases
- Large-scale predictive capability across therapeutic areas

**JARVIS:**
- Non-coding variant pathogenicity prediction
- Genomics-focused AI tool
- Helps identify disease-relevant genetic variants

## Pharmacovigilance AI Frameworks

**Signal Detection Algorithms:**
- Traditional: PRR (Proportional Reporting Ratio), ROR (Reporting Odds Ratio)
- Bayesian: BCPNN (Bayesian Confidence Propagation Neural Network), MGPS
- ML-enhanced: Gradient Boosted Models (sensitivity 0.92), Deep Learning (>95% accuracy)
- Ensemble approaches combining multiple methods

**NLP for Safety:**
- Adverse drug reaction extraction from medical literature
- Social media monitoring for emerging safety signals
- Clinical trial narrative analysis
- Automated case processing and triage

## Data Sources

- **FAERS:** FDA Adverse Event Reporting System (primary US source)
- **EudraVigilance:** European adverse event database
- **EHRs:** Electronic Health Records (real-world evidence)
- **Clinical Trials:** Safety data from controlled studies
- **Social Media:** Patient-reported outcomes and emerging signals
- **Literature:** PubMed, medical journals, case reports

## Trends and Challenges

**Explainable AI:**
- LIME (Local Interpretable Model-agnostic Explanations)
- SHAP (SHapley Additive exPlanations)
- Required for regulatory submissions and clinical trust
- Black-box models face adoption barriers

These explainability patterns and other practical insights are tracked in [[LEARNINGS]].

**Multi-omics Integration:**
- Combining genomics, proteomics, metabolomics for safety prediction
- Personalized safety profiles based on patient genetics
- Biomarker-driven risk stratification

**Regulatory Acceptance:**
- FDA and EMA cautiously adopting AI-assisted methods
- Validation requirements for AI in safety-critical decisions
- Need for standardized evaluation frameworks
- Human-in-the-loop requirements for high-stakes decisions

## Business and Project Context

This research forms one of the two [[BUSINESS|business tracks]] alongside SolarInference.
For project-level status and milestones, see [[PROJECTS]].

## Open Questions
- What specific AZ projects is Alton involved with?
- Access to MILTON or JARVIS APIs?
- Current regulatory submission timelines?
- Specific therapeutic areas of focus?

## Related
- [[BUSINESS]] - Business context and strategy for pharma work
- [[PROJECTS]] - Project tracking and status
- [[LEARNINGS]] - Lessons learned from AI/ML work

## History
- 2026-02-06: Initial creation based on background research
