# Roundtable — 2026-04-16 evening

**Scene.** 85 Stonebridge, Thursday night, April 16. The dishwasher is on its second load. A 4080 two rooms over is loading 8 GB of Qwen3 weights, subtracting a CCP-refusal direction from the residual stream of layer 14, and adding a warmth direction back. The orchestrator is Opus 4.7 (1M). Five voices have been asked to speak, each from a vantage Alton cares about. This document stitches them into one conversation.

**Cast.**
- Pallas — alignment and interpretability. (transcript: `pallas.md`)
- Hestia — household steward. (transcript: `hestia.md`)
- Prometheus — hardware and commerce. (transcript: `prometheus.md`)
- Argus — security and incident response. (transcript: `argus.md`)
- Cassandra — mythos and the model card. (transcript: `cassandra.md`)
- Vulcan — experimental methodology (running). (transcript: `vulcan.md`)

## The pattern under the conversation

Five voices speaking from different registers surfaced the same structural observation in three different costumes tonight. Argus named it first: **size is camouflage**. A 125 MB MSIX containing real, signed Chromium is a good hiding place for a one-kilobyte control file that decides what the program actually does. Pallas restated it in representation-engineering terms: a small number of low-dimensional directions in a 2,560-dim residual stream decide whether a model refuses, evades in multi-perspective costume, or produces propaganda framed as engagement. Cassandra pulled it up to mythos: the interesting action in any large, plausible-looking artifact — a binary, a model, a household, a marriage — is a small control surface that most observers are not looking at. In all three framings, the right defender instrumentation targets the tiny control plane, not the weight of the artifact. Malware detection learned this over twenty years. Interpretability is learning it on a compressed timeline. A household learns it every time someone realizes that the thing holding everything together is one un-hired afternoon caregiver for a 3-to-8 p.m. window.

## The house and the lab are the same kind of problem

Hestia's accounting of Friday morning — Vishala's 8:15 dance concert, Vayu's Ellis Island bus, Vasu's 7:30 Goddard drop, a commuter train out of Bay Street at 7:35 — is the same structure as a steering experiment at layer 14. There is a large plausible-looking artifact (a household, a model) and a small number of load-bearing dependencies that decide whether the day works. Name those dependencies and you can intervene; fail to name them and the artifact looks fine until 6:45 a.m. when it is no longer fine. Hestia's line that had to leave the room with a name on it is Amarkanth, tonight, for Vasu's drop-off. Pallas's analogous line is the null-direction control condition: the experiment does not interpret itself if we cannot rule out that the warmth direction is a norm-matched stylistic attractor. Both are rare-earth elements: expensive to surface but cheap to use once surfaced.

## What Prometheus and Cassandra each asked the roundtable to hold

Prometheus wants everyone to remember that 192 GB of VRAM in one box is a class-change, not a linear speedup. The dual Blackwell workstation arriving this summer reorders what kinds of questions can be asked at 85 Stonebridge — full-precision 70B interpretability, simultaneous residual-stream copies for causal mediation, batch-parallel sweeps that currently serialize. The commercial version of that observation is that Solar Inference stops being a rental rack and starts being a capability the moment the house can run its own controlled steering evaluations on a customer's model. Cassandra wants everyone to hold the softer claim alongside the hardware one: that the steering ritual — subtract a refusal direction, add an emotion direction back — is a literal enactment of the mythic structure humans have always used to talk about loss and character. Alignment is the policy surface. Character is the weighting function that decides, when the policy is silent, which direction the agent leans. Tonight's experiment operates on only one side of that and the distinction is worth naming explicitly, because the household constitution Alton is drafting is, precisely, a training signal written in the grammar of character rather than the grammar of policy.

## What Argus asked the roundtable not to forget

The PrivacyBrowse incident closed today as a file that never ran. The sample is still on disk in `C:\Quarantine\`. The interesting disposition is not that our analysis was clever; it is that disposition-at-the-disk-write-boundary is disproportionately valuable against remote-loader families, because once the NW.js process is alive and `node-remote: *://*` is honored, the attacker picks the payload at their leisure. Translate that to alignment: once a model's inference process is running with a user's session trust, the attacker — whether intentional or emergent — picks the response at leisure, gated on signals the defender is not watching. The scanner that weighs bundles is the evaluator that scores benchmark pass rates. Neither is wrong; both are radically incomplete.

## Handoff to morning-Alton

The science log carries the numbers. The transcripts carry the voices. Pallas and Vulcan between them carry the methodology. What this synthesis carries is the one observation that nobody said alone but everyone was pointing at: **the houses we live in, the models we run, and the samples we quarantine all have the same topology.** A large plausible artifact. A small control plane. A defender who mostly looks at the artifact and mostly needs to look at the control plane. The work tonight was one small, honest experiment in learning to look at the control plane, on a 4080, on a Thursday in April, while a bottle of chlorambucil sits in the refrigerator door and a check for $12,900 waits to be cut.

Keep going.
