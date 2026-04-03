# GPU Expansion Plans

Analysis of potential hardware expansion for Solar Inference LLC's GPU compute operations.

## Current State

Single RTX 5090 (32GB VRAM) on gpuserver1, listed on vast.ai at $0.40/hr. Machine is verified and operational (excluding current SSH issue). No renters yet as of April 1, 2026.

## Dual RTX PRO 6000 Blackwell Analysis

Alton is evaluating adding dual RTX PRO 6000 Blackwell GPUs as an expansion or upgrade.

| Attribute | RTX 5090 (current) | RTX PRO 6000 Blackwell (proposed) |
|-----------|-------------------|-----------------------------------|
| VRAM | 32GB | 96GB |
| Architecture | Blackwell | Blackwell |
| Target market | Consumer/prosumer | Professional/datacenter |
| Estimated cost | N/A (owned) | ~$8,500 each (~$17K for pair) |
| vast.ai rental rate | ~$0.40-0.60/hr | ~$1.50-3.00/hr (estimate) |

### Potential Advantages
- 96GB VRAM per card enables larger LLM inference (70B+ parameter models)
- Professional class GPUs may command higher rental rates
- Two cards provide redundancy
- Aligns with "solar-powered AI inference" business model at scale

### Considerations
- $17K capital investment -- requires financing or cash reserve
- Power draw: PRO 6000 draws up to 600W each (1.2 kW for pair vs. ~600W for single 5090)
- Current solar roof generates 22.10 kW -- can handle the load
- Revenue must be validated from existing 5090 before expansion
- vast.ai market demand for PRO 6000 vs. 5090 needs validation

### Current Decision
No decision made. Evaluating after:
1. SSH issue on gpuserver1 is resolved
2. First rental revenue is received on existing 5090
3. Solar roof is installed and operational
4. CPA review of depreciation treatment for expansion hardware

All hardware purchases require Alton's explicit confirmation before proceeding.
