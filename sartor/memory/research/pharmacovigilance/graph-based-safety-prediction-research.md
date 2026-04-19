# Graph-Based Approaches for Pharmaceutical Safety Prediction (PSP Platform)

> Research compiled: 2026-02-06
> Focus: Knowledge Graphs, Graph Neural Networks, and LLM Integration for Drug Safety

---

## Table of Contents

1. [Knowledge Graphs in Pharma Safety](#1-knowledge-graphs-in-pharma-safety)
2. [Graph Neural Networks for Adverse Event Prediction](#2-graph-neural-networks-for-adverse-event-prediction)
3. [Mechanistic Reasoning via Graph Structures](#3-mechanistic-reasoning-via-graph-structures)
4. [Cell Therapy Specific: CRS/ICANS Mechanism Graphs](#4-cell-therapy-specific-crsicans-mechanism-graphs)
5. [Graph Databases: Neo4j and Amazon Neptune](#5-graph-databases-neo4j-and-amazon-neptune)
6. [Integration with LLMs](#6-integration-with-llms)
7. [Notable Implementations](#7-notable-implementations)
8. [Graph Network Memory Architecture for PSP](#8-graph-network-memory-architecture-for-psp)
9. [Recommended Architecture for PSP Platform](#9-recommended-architecture-for-psp-platform)

---

## 1. Knowledge Graphs in Pharma Safety

### 1.1 Core Concept: Drug-Target-AE Relationship Modeling

Knowledge graphs (KGs) in pharmaceutical safety represent entities (drugs, targets, adverse events, pathways, genes, diseases) as nodes and their relationships as typed edges. This creates a traversable network where complex multi-hop reasoning can uncover hidden safety signals.

**Typical Entity Types in a Pharma Safety KG:**

| Entity Type | Examples | Key Databases |
|-------------|----------|---------------|
| Drugs/Compounds | Small molecules, biologics, CAR-T | DrugBank, ChEMBL |
| Protein Targets | Receptors, enzymes, transporters | UniProt, STRING |
| Adverse Events | MedDRA-coded AEs, side effects | FAERS, SIDER |
| Diseases/Indications | ICD-coded conditions | OMIM, DisGeNET |
| Biological Pathways | Signaling cascades, metabolic paths | KEGG, Reactome |
| Genes | Coding genes, regulatory elements | Ensembl, GNBR |
| Symptoms | Clinical manifestations | MeSH, SNOMED-CT |

**Relationship Types:**

- Drug --[targets]--> Protein
- Drug --[causes]--> Adverse Event
- Drug --[treats]--> Disease
- Protein --[participates_in]--> Pathway
- Gene --[encodes]--> Protein
- Pathway --[associated_with]--> Disease
- Drug --[interacts_with]--> Drug (DDIs)

### 1.2 KG Embedding for ADR Prediction

Knowledge graph embedding (KGE) methods map entities and relations into continuous vector spaces, enabling link prediction (i.e., predicting unknown drug-AE associations). Key approaches from the literature:

**Node2Vec-Based Approach** (Bean et al., Scientific Reports 2017): Constructed a KG with 6 entity types -- drugs, ADRs, target proteins, indications, pathways, and genes. Each node was embedded using Node2Vec, and high-confidence predictions of unknown ADRs were validated in electronic health records at rates significantly higher than random baselines. This demonstrated KGs can predict ADRs not observed during clinical trials.

**TransE/DistMult/ComplEx Embeddings** (Celebi et al., BMC Medical Informatics 2021): Built integrated knowledge bases combining DrugBank, UMLS, DailyMed, UniProt, and CTD as RDF networks. KGE methods were trained to predict drug-ADR links, achieving strong performance on held-out test sets.

**Deep Neural Network on KG Embeddings** (Jarada et al., Journal of Biomedical Informatics 2022): Designed custom deep neural networks operating on KG embeddings to predict ADRs, combining structural graph information with pharmacological features.

### 1.3 Causal Knowledge Graphs

A significant 2025 advance is the development of causal KGs for drug safety. Work published in Bioinformatics (Oxford Academic, 2025) uses causal reasoning to identify post-marketing adverse effects while controlling for confounding factors. This moves beyond correlational association mining toward mechanistic causal inference -- directly relevant to PSP's goal of explaining *why* an AE occurs, not just *that* it occurs.

### 1.4 Scoping Review Findings

A 2024 scoping review in Clinical Therapeutics surveyed KGs in pharmacovigilance and found:
- KGs are used for detecting both single-drug ADRs and drug-drug interaction (DDI) adverse effects
- Performance is variable, with sparse comparisons to legacy disproportionality methods
- The field needs more reliable reference sets and benchmarking against traditional pharmacovigilance methods
- KGs have clear potential to augment predictive signal detection

**PSP Relevance:** The KG layer should serve as the backbone of the Graph Network Memory, encoding all known drug-target-AE-pathway relationships and enabling multi-hop reasoning for safety signal explanation.

---

## 2. Graph Neural Networks for Adverse Event Prediction

### 2.1 GNN Architectures for Pharmacovigilance

Multiple GNN architectures have been applied to ADE prediction, each with distinct strengths:

**GraphSAGE for ADE Occurrence Prediction:**
A 2024 study in Computers in Biology and Medicine modeled patients as subgraphs composed of ICD-code nodes with directed edges representing disease progression. GraphSAGE achieved the highest accuracy for predicting ADE occurrence (0.8863 and 0.9367 across datasets), demonstrating strong inductive learning capability -- critical for generalizing to new patients.

**Graph Attention Networks (GAT) for Timing Prediction:**
The same study found GAT performed best for predicting *when* an ADE would occur (accuracy 0.8769), suggesting attention mechanisms capture temporal dynamics of adverse event cascades.

**PreciseADR (Gao et al., Advanced Science 2025):**
A heterogeneous GNN framework for patient-level ADR prediction. Key architecture details:
- **Nodes:** Patients, diseases, drugs, ADRs (heterogeneous types)
- **Edges:** Patient-disease associations, patient-drug exposures, drug-ADR links
- **Data Source:** FDA Adverse Event Reporting System (FAERS)
- **Architecture:** Heterogeneous Graph Aggregation Layers + Patient Node Augmentation Layers + Contrastive Learning
- **Results:** 3.2% AUC improvement and 4.9% increase in Hit@10 over baselines
- **Dataset:** Curated "PLEASE" dataset from FAERS for patient-level ADR prediction
- Captures both local neighborhood and global graph dependencies

**Heterogeneous GNN for Immune-Related AEs (Scientific Reports 2025):**
Specifically predicts immune-related adverse events -- directly relevant to cell therapy safety. Uses heterogeneous graph structures to model the complex interplay between immune activation and toxicity.

### 2.2 Multi-Modal Graph Machine Learning

**MultiGML** (Gogleva et al., published in PLOS Computational Biology / PMC 2023): Fuses knowledge graphs with multiple additional data modalities to predict drug-related adverse events and general drug-target-phenotype associations. This multi-modal approach is directly relevant to PSP, which must integrate molecular, clinical, and real-world evidence data.

### 2.3 GNN-Based Molecular Toxicity Prediction

For predicting safety from molecular structure (pre-clinical safety assessment):

**MolFPG Framework:** Combines molecular fingerprints with molecular graph representations using a Graph Transformer architecture. Achieves state-of-the-art results across Tox21, AMES, Skin Reaction, Carcinogens, DILI, ToxCast, LD50, and hERG datasets.

**Enhanced GNN for Drug Toxicity** (Computers in Biology and Medicine 2024): A novel GNN architecture specifically designed for toxicity prediction with improved interpretability, helping scientists identify potential toxicity mechanisms.

**Small-Scale Data GNN** (Computational Biology and Chemistry 2025): Addresses the critical challenge of limited toxicity data through transfer learning and joint learning strategies across multiple toxicity types.

### 2.4 Drug-Drug Interaction Prediction

**Metapath-based Heterogeneous GNN:** Uses metapaths in heterogeneous information networks to predict drug combination side effects, modeling the propagation of signals across drug-protein-pathway-AE subgraphs.

**Attention-Based GNN on Molecular Graphs:** Predicts DDIs directly from molecular graph representations, enabling early-stage safety flagging before clinical data is available.

**PSP Relevance:** The GNN layer should operate on top of the KG, learning embeddings that capture patient-level, molecular-level, and population-level safety signals. GraphSAGE for ADE occurrence, GAT for temporal dynamics, and heterogeneous GNNs for multi-entity reasoning are all candidates for the PSP prediction engine.

---

## 3. Mechanistic Reasoning via Graph Structures

### 3.1 Encoding Pathophysiology and MOA in Graphs

The key challenge for PSP is not just *predicting* AEs but *explaining* them through mechanism of action (MOA) reasoning. Several approaches address this:

**Interpretable Pharmacodynamic Mechanism KG (IPM-KG):**
A 2024 framework (Computers in Biology and Medicine) that:
- Integrates multiple databases (DrugBank, KEGG, Reactome, etc.)
- Automatically fills missing data through inference
- Predicts drug effects AND derives mechanistic pathways
- Provides interpretable chains: Drug -> Target -> Pathway -> Downstream Effect -> AE

**Causal Reasoning over KGs:**
Published in Bioinformatics (PMC 2022), this approach maps omics experiment signatures onto a KG to:
- Verify which causal interactions are observed in specific contexts
- Prioritize and identify MOA of a drug for a given disease
- Achieve high precision through pathway-level causal chain analysis

**Graph Theory for Hidden MOA Discovery:**
A PLOS ONE study demonstrated that by linking biochemical entities along paths that mimic chains of reasoning, graphs can lead to inferences about the MOA of substances in disease pathophysiology -- even when the mechanism was previously unknown.

**eXplainable Graph-based Drug Response Prediction (XGDP):**
Represents drugs with molecular graphs preserving structural information, applies GNN modules to learn latent features, and reveals comprehensive MOA between drugs and targets through explainability layers.

### 3.2 Pathway-Level Reasoning

KG embeddings can reveal systemic pathway-level information. For example, they can identify drugs targeting proteins in the same hormone system even when those drugs do not directly share targets. This is critical for:

- **Off-target effect prediction:** Drug binds unintended target in same pathway family
- **Pathway amplification effects:** Multiple drugs activating the same downstream cascade
- **Mechanistic class effects:** All drugs in a class sharing a common pathway-mediated AE

### 3.3 Neuro-Symbolic Hybrid Approaches

Emerging architectures embed physical, biological, and mechanistic principles directly into learning architectures:

- **Mechanistic-integrated neural models:** Embed known biological constraints (e.g., pathway topology) into the GNN architecture
- **Hybrid neuro-symbolic systems:** Combine symbolic reasoning (ontology traversal, pathway logic) with neural pattern recognition

**PSP Relevance:** The "mechanistic reasoning" component of Graph Network Memory should encode known biological pathways (KEGG, Reactome) as subgraph templates, then use GNN-based reasoning to traverse from drug -> target -> pathway -> downstream biology -> clinical AE. This creates explainable, auditable safety predictions.

---

## 4. Cell Therapy Specific: CRS/ICANS Mechanism Graphs

### 4.1 CRS Cytokine Cascade Modeling

CRS involves pathologic over-activation of T cells leading to hypersecretion of cytokines. The key mechanistic insight: **myeloid cells (macrophages and monocytes), not CAR-T cells themselves, are the primary mediators of CRS**, releasing IL-1 and IL-6 among other cytokines.

**Core CRS Signaling Pathways (Graph-Encodable):**

```
CAR-T Cell --[recognizes]--> Tumor Antigen
    |
    v
T Cell Activation --[releases]--> DAMPs, CD40L
    |
    v
Macrophage Activation --[via DAMPs, antigen-binding, CD40-CD40L]-->
    |
    +--[TNF/NF-kB pathway]--> TNF-alpha, IL-1
    +--[IL-1/NF-kB pathway]--> IL-1beta
    +--[IL-6/JAK-STAT pathway]--> IL-6 (CRITICAL)
    +--[IFN-gamma/JAK-STAT pathway]--> IFN-gamma
    |
    v
Endothelial Activation --[IL-6/sIL-6R complex]-->
    +--[Ras/MEK/MAPK]--> More IL-6 (positive feedback)
    +--[PI3K/AKT]--> Vascular permeability
    +--[JAK/STAT3]--> Amplification cascade
    |
    v
Systemic CRS (Grade 1-4)
```

**Key Cytokines for CRS Prediction:**
IL-2, IL-6, IL-10, TNF-alpha, IFN-gamma, and IL-17A all contribute to predicting CRS severity. IL-2 levels rise earliest and may serve as the most effective early detection marker.

### 4.2 Meta-GNN for CRS-Associated Cytokine Prediction

A landmark study (BMC Bioinformatics 2022) used meta-learning GNNs to systematically investigate CRS-associated cytokines:

**Architecture:** Meta-GNN (semi-supervised classification on protein interaction networks)
**Input:** Known CRS-associated cytokines as labeled nodes in a protein-protein interaction (PPI) network
**Process:**
1. Constructed PPI network from human protein interaction databases
2. Used meta-learning to learn from a small number of known CRS cytokines
3. Predicted 128 additional cytokines/molecules closely related to CRS
4. Validated through functional enrichment analysis and pathway crosstalk analysis

**Key Findings:**
- Identified IL-6, IFN-gamma, TNF-alpha, ICAM-1, VCAM-1, and VEGFA as critical CRS factors
- Network divided into 4 functional modules (chemokines, inflammatory mediators, endothelial markers, growth factors)
- Clinically validated with data from 119 patients (cytokine expression, coagulation, biochemical, blood routine)

**Meta-DHGNN** (Briefings in Bioinformatics 2024): An advanced follow-up using meta-learning directed heterogeneous GNNs for deeper CRS cytokine analysis, incorporating directional signaling information.

### 4.3 ICANS Mechanism Graphs

ICANS (Immune Effector Cell-Associated Neurotoxicity Syndrome) involves:

**Mechanism Chain:**
1. **Peripheral immune over-activation** (same triggers as CRS)
2. **Endothelial activation** leading to blood-brain barrier (BBB) dysfunction
3. **CNS inflammation** and neurotoxicity

**Key Pathway Details:**
- IL-1 elevation precedes IL-6 by up to 24 hours in both serum and CSF, suggesting IL-1 as an initiative factor
- Excessive circulating IL-6/sIL-6R complex acts on endothelial cells through Ras/MEK/MAPK, PI3K/AKT, and JAK/STAT3 pathways
- Complement pathway activation plays a role in ICANS pathogenesis
- BBB disruption allows cytokine infiltration into CNS

**Computational Modeling:**
- Mathematical models using ODEs can predict variability in adverse event onset
- Models incorporating CAR-T cell expansion, antigen-negative resistance, and macrophage-associated cytokine release achieve ~75% accuracy for treatment response and ~77% for severe ICANS prediction (using CyTOF and scRNA-seq data from B-ALL patients)
- Multi-layer mathematical models consider three key mechanisms of macrophage activation: DAMPs release, antigen-binding mediated activation, and CD40-CD40L contact

### 4.4 Graph-Encodable CRS/ICANS Risk Factors

For the PSP platform, the following should be encoded as graph features:

| Risk Factor | Graph Representation |
|-------------|---------------------|
| Tumor burden | Node attribute (patient node) |
| CAR-T dose | Edge weight (treatment edge) |
| Baseline cytokine levels | Node attributes (cytokine nodes) |
| Prior therapies | Edge history (patient-drug edges) |
| Genetic variants | Gene nodes with variant attributes |
| Comorbidities | Disease nodes connected to patient |
| Concurrent medications | Drug-drug interaction edges |

**PSP Relevance:** The CRS/ICANS mechanism graphs should be first-class subgraph templates in the Graph Network Memory. They encode the known biology that the system uses for mechanistic reasoning. When a safety signal is detected, the system traverses these mechanism subgraphs to generate an explanation.

---

## 5. Graph Databases: Neo4j and Amazon Neptune

### 5.1 Neo4j in Pharma

**AstraZeneca's Use of Neo4j:**
AstraZeneca uses a Neo4j-based Reaction Knowledge Graph that integrates data from multiple sources and feeds into ML-driven processes for prediction. Their Biological Insights Knowledge Graph (BIKG) is one of the largest pharma KGs in production.

**Neo4j Strengths for PSP:**
- Native property graph model (nodes and edges have properties)
- Cypher query language -- intuitive for traversal-based mechanistic queries
- Strong community and ecosystem (Graph Data Science Library)
- Built-in graph algorithms (PageRank, community detection, pathfinding)
- APOC procedures for advanced data integration
- GraphSAGE and Node2Vec available in the GDS library

**Example Cypher Query for Mechanistic Reasoning:**
```cypher
// Find all mechanistic paths from a drug to an adverse event
MATCH path = (drug:Drug {name: 'DrugX'})-[:TARGETS]->(target:Protein)
             -[:PARTICIPATES_IN]->(pathway:Pathway)
             -[:ASSOCIATED_WITH]->(ae:AdverseEvent {name: 'CRS'})
RETURN path, length(path) as hops
ORDER BY hops ASC
```

### 5.2 Amazon Neptune

**Neptune Strengths for PSP:**
- Fully managed service on AWS
- Supports both property graphs (openCypher, Gremlin) and RDF graphs (SPARQL)
- Strong AWS ecosystem integration (SageMaker, S3, Lambda)
- Knowledge graph capabilities optimized for life sciences
- Built-in compliance features (HIPAA, SOC)
- Auto-scaling for variable workloads

**Use in Drug Discovery:**
Neptune powers graph use cases including drug discovery knowledge graphs, tracking experiments, trial characteristics, and drug properties.

### 5.3 Comparison for PSP

| Feature | Neo4j | Amazon Neptune |
|---------|-------|---------------|
| Graph Model | Property Graph | Property + RDF |
| Query Languages | Cypher | Gremlin, openCypher, SPARQL |
| ML Integration | GDS Library (native) | SageMaker (external) |
| Managed Service | Neo4j Aura | Fully managed AWS |
| GNN Support | GraphSAGE, Node2Vec in GDS | Via DGL/SageMaker |
| Pharma Adoption | AstraZeneca, many others | AWS life sciences customers |
| Compliance | Enterprise security | HIPAA, SOC, FedRAMP |
| Cost Model | License/Aura subscription | Pay-per-use |

**Recommendation for PSP:** Neo4j is likely the better choice for initial development due to its native graph algorithms, GDS library with built-in GNN support, and proven pharma adoption (AstraZeneca BIKG). Neptune is the better choice if the platform must operate within an AWS-native infrastructure with strict compliance requirements.

---

## 6. Integration with LLMs

### 6.1 Knowledge Graph-Enhanced LLMs

The integration of KGs with LLMs addresses three critical limitations of LLMs alone:

1. **Hallucination Reduction:** KGs provide grounded, factual knowledge that constrains LLM outputs
2. **Currency:** KGs can be updated with new safety signals in real-time, unlike static LLM training data
3. **Transparency:** Graph traversal paths provide auditable reasoning traces

**Architecture Patterns:**

**Pattern 1: KG-Augmented Retrieval (Graph RAG)**
- Query the KG for relevant subgraphs based on the safety question
- Feed subgraph context into the LLM prompt
- LLM generates natural language explanation grounded in graph evidence
- Example: MedRAG framework (ACM Web Conference 2025) uses KG-elicited reasoning for healthcare

**Pattern 2: Multi-Stage Agent Architecture**
- Rx Strategist (2025): Decomposes safety reasoning into stages (indication screening, dosage verification, interaction checking)
- Each stage is bound to structured domain knowledge and embedding retrieval
- Achieves F0.5 = 82.67% with high precision, reducing harmful false positives

**Pattern 3: Hybrid KG-LLM with Dynamic Routing**
- Low-confidence cases dynamically routed to fine-tuned LLMs
- High-confidence cases handled by KG traversal alone
- Achieves 91% accuracy while limiting LLM calls to ~30% of cases (cost efficiency)

### 6.2 Critical Findings on LLM Limitations

A real-world NHS study deploying a 120B-parameter LLM on primary care EHRs found:
- **Perfect sensitivity (100%)** for issue detection
- **High specificity (83.1%)** for issue detection
- But only **46.9% full correctness** in issue identification and intervention recommendation
- **86% of errors were contextual reasoning failures**, not factual knowledge gaps

This strongly supports the PSP approach of using graph-based mechanistic reasoning to supplement LLM capabilities. The LLM provides language understanding and generation; the graph provides mechanistic accuracy.

### 6.3 Biomedical Graph RAG

**Medical Graph RAG** (ACL 2025): Evidence-based biomedical question answering using graph-structured retrieval with explicit reasoning over mechanistic associations (pathogen-host interactions, drug-disease relationships). This goes beyond text-based retrieval by leveraging graph topology for reasoning.

**IP-RAR Framework** (Integrated and Progressive Retrieval-Augmented Reasoning): Combines integrated reasoning-based retrieval with progressive reasoning-based generation, enhanced by self-reflection mechanisms. Particularly relevant for complex multi-step safety reasoning.

### 6.4 Drug Mechanism Reasoning Evaluation

A 2025 benchmark (arxiv) evaluated how well LLMs understand drug mechanisms, finding significant gaps in mechanistic reasoning. This validates the need for explicit graph-based mechanism encoding rather than relying on LLM parametric knowledge alone.

**PSP Relevance:** The LLM layer of PSP should be a consumer of graph-derived context, not the primary reasoning engine. The Graph Network Memory provides mechanistic subgraphs; the LLM translates these into natural language explanations and recommendations. Graph RAG is the integration pattern.

---

## 7. Notable Implementations

### 7.1 AstraZeneca: Biological Insights Knowledge Graph (BIKG)

**Scale:** 10.9 million nodes (22 types), 118+ million unique edges (59 types, forming 398 different triple patterns)

**Data Sources:** ChEMBL, Ensembl, dedicated NLP pipelines for mining full-text publications, plus internal proprietary data

**Applications:**
- Integrates genomic, disease, drug, clinical, and safety information
- Overcomes confirmation bias by surfacing unexpected connections
- GNN-based mining for novel target predictions
- Published use cases include drug resistance identification (EGFR mutant NSCLC) and drug repurposing

**Safety Relevance:** The BIKG integrates safety information alongside efficacy data, enabling holistic risk-benefit analysis.

### 7.2 AWS/DRKG: Drug Repurposing Knowledge Graph

**Scale:** 97,238 entities (13 types), 5,874,261 triplets (107 relation types)

**Data Sources:** DrugBank, Hetionet, STRING, IntAct, DGIdb, GNBR

**Tools:** Uses DGL-KE (Deep Graph Library - Knowledge Embedding) for training embeddings and predicting drug-disease and drug-protein associations

**Open Source:** Publicly available on GitHub (gnn4dr/DRKG)

### 7.3 BenevolentAI

**Approach:** Decade-long investment in proprietary KGs and ontologies. Uses NLP to extract knowledge graphs from scientific literature and identify previously unknown correlations.

**Notable Achievement:** Identified baricitinib as a repurposed COVID-19 treatment using KG-based reasoning -- subsequently validated in clinical trials and approved.

### 7.4 WiseCube AI (now part of John Snow Labs)

**Platform:** AI-powered biomedical KG with hallucination detection for medical AI compliance and safety. Acquired by John Snow Labs in November 2025, integrating KG technology with their medical NLP platform.

**Pythia Service:** Monitors AI-generated responses for alignment with verified medical knowledge -- relevant to PSP's need for validated safety outputs.

### 7.5 IQVIA

Provides commercial KG-based data visualization and analytics platforms used by pharma companies for pharmacovigilance and safety data analysis.

### 7.6 ArisGlobal LifeSphere

Safety platform implemented by Roche, Novartis, AstraZeneca, and Johnson & Johnson for automated regulatory workflows. While not KG-native, represents the incumbent platform that graph-based approaches aim to augment.

---

## 8. Graph Network Memory Architecture for PSP

### 8.1 The "Graph Network Memory" Concept

Based on the research, the Graph Network Memory for PSP should combine three architectural patterns:

**Memory-Based Graph Networks (MemGNN):**
An efficient memory layer for GNNs that jointly learns node representations and coarsens graphs, enabling hierarchical graph representations. Two variants: MemGNN (memory-based) and GMN (graph memory network).

**Neural Graph Memory (NGM):**
A fully differentiable architecture for graph data retrieval using attention-based content addressing. Fuses nodes and edges into (Node, Edge, Node) triples that enable retrieval based on known properties of nodes, edges, or both. This enables neural networks to access and traverse knowledge graphs.

**Temporal Knowledge Graphs for Long-Term Memory:**
Temporal graph structures serve as persistent long-term memory for AI agents, maintaining evolving knowledge over time. Critical for tracking how safety signals develop across reporting periods.

### 8.2 Proposed Three-Layer Architecture

```
Layer 3: LLM Reasoning Layer
    |  (Graph RAG interface)
    v
Layer 2: GNN Prediction Layer
    |  (GraphSAGE, GAT, Heterogeneous GNN)
    v
Layer 1: Knowledge Graph Storage Layer
    |  (Neo4j / Neptune)
    v
[Data Sources: FAERS, Clinical Trials, EHR, Literature, Pathway DBs]
```

**Layer 1 -- Knowledge Graph Storage:**
- Persistent graph database (Neo4j recommended)
- Entity types: Drugs, Targets, AEs, Pathways, Genes, Diseases, Patients, Cytokines
- Relationship types: targets, causes, treats, participates_in, encodes, interacts_with
- Temporal annotations on all edges (when was this relationship observed?)
- Mechanism subgraph templates (CRS cascade, ICANS pathway, hERG toxicity, etc.)

**Layer 2 -- GNN Prediction Engine:**
- GraphSAGE for inductive ADE occurrence prediction (new drugs/patients)
- GAT for temporal ADE timing prediction
- Heterogeneous GNN (PreciseADR-style) for patient-level ADR prediction
- GNN molecular toxicity models for pre-clinical safety
- Meta-GNN for cytokine network analysis (CRS/ICANS specific)

**Layer 3 -- LLM Reasoning Interface:**
- Graph RAG: Retrieve relevant subgraphs, feed as context to LLM
- Multi-stage agents: Decompose safety queries into graph traversal steps
- Natural language generation: Translate graph paths into clinical narratives
- Hallucination detection: Validate LLM outputs against KG facts (WiseCube/Pythia pattern)

---

## 9. Recommended Architecture for PSP Platform

### 9.1 Data Integration Pipeline

```
[FAERS] --> ETL --> |
[DrugBank] --------> |
[ChEMBL] ----------> |
[KEGG/Reactome] ---> | --> Knowledge Graph (Neo4j)
[STRING/IntAct] ---> |          |
[DisGeNET] --------> |          v
[Clinical Trials] -> |    GNN Training Pipeline
[Literature NLP] --> |          |
                                v
                         Embedding Store
                                |
                                v
                         Graph RAG API
                                |
                                v
                         LLM Safety Reasoning
```

### 9.2 Key Design Decisions

1. **Neo4j over Neptune** for development: Better GNN integration via GDS library, proven pharma adoption, Cypher for intuitive mechanistic queries. Migrate to Neptune if AWS-native deployment required.

2. **GraphSAGE as primary GNN**: Inductive learning capability means the model generalizes to new drugs and patients without retraining. Essential for a production safety platform.

3. **Mechanism subgraph templates**: Pre-encode known pathophysiology (CRS cascade, ICANS BBB disruption, hERG cardiotoxicity, hepatotoxicity pathways) as queryable subgraph patterns.

4. **Graph RAG over fine-tuning**: Keep the LLM general-purpose; inject safety knowledge at inference time via graph retrieval. This maintains currency (graph updates immediately reflected) and auditability (every assertion traceable to graph evidence).

5. **Temporal knowledge graph**: All edges carry temporal metadata. Safety signals evolve; the graph must capture when relationships were established, strengthened, or invalidated.

6. **Multi-modal integration**: Follow the MultiGML pattern -- fuse graph-derived features with molecular fingerprints, clinical features, and genomic data for maximum predictive power.

### 9.3 CRS/ICANS-Specific Module

For cell therapy safety prediction, a dedicated module should:

1. **Encode the CRS cytokine cascade** as a directed mechanism subgraph (per Section 4.1)
2. **Train a Meta-GNN** on PPI networks to identify novel CRS-associated cytokines
3. **Integrate patient baseline data** (tumor burden, prior therapies, cytokine levels) as node/edge attributes
4. **Predict CRS grade** using heterogeneous GNN on patient-treatment-cytokine graphs
5. **Predict ICANS risk** using BBB-permeability pathway subgraph traversal
6. **Generate mechanistic explanations** via Graph RAG: "CRS Grade 3 predicted because [drug] targets [antigen] causing [T cell activation] leading to [macrophage IL-6 release] with [positive feedback via endothelial JAK/STAT3]"

### 9.4 Evaluation Strategy

| Metric | Method | Target |
|--------|--------|--------|
| ADE Prediction AUC | FAERS held-out test set | >0.85 |
| Mechanism Path Accuracy | Expert clinical review | >70% paths clinically valid |
| CRS Grade Prediction | Retrospective clinical data | >75% accuracy |
| Explanation Quality | Clinician rating (1-5) | >3.5 average |
| Signal Detection Speed | Time to detect known signals | <30 days vs. historical |
| LLM Hallucination Rate | KG fact-checking pipeline | <5% unsupported claims |

---

## Key References

### Knowledge Graphs in Pharma Safety
- [KG prediction of unknown ADRs validated in EHRs](https://www.nature.com/articles/s41598-017-16674-x) - Bean et al., Scientific Reports 2017
- [KG embedding for ADR prediction](https://link.springer.com/article/10.1186/s12911-021-01402-3) - Celebi et al., BMC Medical Informatics 2021
- [KG embedding with deep neural networks for ADR](https://pubmed.ncbi.nlm.nih.gov/35753606/) - Jarada et al., J Biomedical Informatics 2022
- [KGs in Pharmacovigilance: Scoping Review](https://www.sciencedirect.com/science/article/pii/S0149291824001449) - Clinical Therapeutics 2024
- [Causal KG analysis identifies adverse drug effects](https://academic.oup.com/bioinformatics/article/42/1/btaf661/8378293) - Bioinformatics 2025

### Graph Neural Networks for Safety
- [GNN subgraph analysis for ADE prediction](https://www.sciencedirect.com/science/article/pii/S0010482524013672) - Computers in Biology and Medicine 2024
- [PreciseADR: Heterogeneous GNN for ADR](https://advanced.onlinelibrary.wiley.com/doi/10.1002/advs.202404671) - Advanced Science 2025
- [Heterogeneous GNN for immune-related AEs](https://www.nature.com/articles/s41598-025-30266-0) - Scientific Reports 2025
- [MultiGML: Multimodal graph ML for ADE](https://pmc.ncbi.nlm.nih.gov/articles/PMC10481305/) - PMC 2023
- [GNN toxicity prediction with molecular fingerprints and KG](https://www.mdpi.com/2305-6304/13/11/953) - Toxics 2025

### CRS/ICANS Mechanism Modeling
- [Meta-GNN and pathway crosstalk for CRS cytokines](https://pmc.ncbi.nlm.nih.gov/articles/PMC9469618/) - BMC Bioinformatics 2022
- [Meta-DHGNN for CRS cytokine analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC10976917/) - Briefings in Bioinformatics 2024
- [Mathematical modeling of CAR-T CRS timeline](https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1012908) - PLOS Computational Biology 2025
- [CRS signaling pathways](https://www.nature.com/articles/s41392-021-00764-4) - Signal Transduction and Targeted Therapy 2021
- [ICANS pathophysiology insights](https://www.frontiersin.org/journals/neurology/articles/10.3389/fneur.2023.1108297/full) - Frontiers in Neurology 2023
- [Computational modeling of ICANS](https://biocomplexity.virginia.edu/our-research/institute-publications/computational-modeling-immune-effector-cell-associated) - UVA Biocomplexity Institute

### Mechanistic Reasoning
- [IPM-KG: Interpretable pharmacodynamic mechanism KG](https://www.sciencedirect.com/science/article/pii/S001048252401504X) - Computers in Biology and Medicine 2024
- [Causal reasoning over KGs for drug discovery](https://pmc.ncbi.nlm.nih.gov/articles/PMC8906585/) - PMC 2022
- [Graph theory for hidden MOA discovery](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0084912) - PLOS ONE 2014
- [Explainable GNN for drug discovery and MOA](https://www.nature.com/articles/s41598-024-83090-3) - Scientific Reports 2024

### LLM + KG Integration
- [MedRAG: KG-elicited reasoning for healthcare](https://dl.acm.org/doi/10.1145/3696410.3714782) - ACM Web Conference 2025
- [KGs in drug discovery: how they link to LLMs](https://www.drugtargetreview.com/article/159734/using-knowledge-graphs-in-drug-discovery-part-1-how-they-link-to-large-language-models/) - Drug Target Review
- [LLM as clinical decision support for medication safety](https://pmc.ncbi.nlm.nih.gov/articles/PMC12629785/) - PMC 2025
- [Collaborative LLM for drug analysis](https://www.nature.com/articles/s41551-025-01471-z) - Nature Biomedical Engineering 2025
- [Automating biomedical KG construction](https://www.biorxiv.org/content/10.64898/2026.01.14.699420v1.full.pdf) - bioRxiv 2026

### Graph Databases and Platforms
- [AstraZeneca BIKG](https://www.biorxiv.org/content/10.1101/2021.10.28.466262v1) - bioRxiv 2021
- [AZ Drug Discovery KGs repository](https://github.com/AstraZeneca/awesome-drug-discovery-knowledge-graphs) - GitHub
- [DRKG: Drug Repurposing KG](https://github.com/gnn4dr/DRKG) - GitHub / Amazon Science
- [KGs shape pharma future](https://www.wisecube.ai/blog/how-knowledge-graphs-are-shaping-the-future-for-the-pharmaceutical-industry/) - WiseCube AI
- [KG applications in drug discovery](https://altair.com/blog/articles/applications-of-knowledge-graphs-drug-discovery) - Altair

### Graph Network Memory
- [Memory-Based Graph Networks (ICLR 2020)](https://arxiv.org/abs/2002.09518) - arxiv
- [Neural Graph Memory](https://medium.com/octavian-ai/neural-graph-memory-82ccc6db3c02) - Octavian AI
- [Temporal KGs as long-term memory](https://medium.com/@bijit211987/agents-that-remember-temporal-knowledge-graphs-as-long-term-memory-2405377f4d51) - Medium
