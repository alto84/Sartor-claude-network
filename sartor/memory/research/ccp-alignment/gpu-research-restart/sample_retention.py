"""
Capability retention corpus sampler for constitutional fine-tuning.

Downloads and samples from established instruction-tuning datasets to produce
a diverse retention corpus that prevents catastrophic forgetting during SFT.

Usage:
    python sample_retention.py --output retention-corpus-v1.jsonl --total 550

Requires:
    pip install datasets

Design doc: 04-dataset-design.md
"""

import argparse
import json
import random
import re
from pathlib import Path

# Deferred import so the script can be inspected without datasets installed
try:
    from datasets import load_dataset
except ImportError:
    load_dataset = None


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SOURCES = [
    {
        "name": "SlimOrca",
        "hf_path": "Open-Orca/SlimOrca",
        "split": "train",
        "target_count": 150,
        "format": "sharegpt",  # conversations field with from/value pairs
        "multi_turn_eligible": False,
    },
    {
        "name": "OpenHermes-2.5",
        "hf_path": "teknium/OpenHermes-2.5",
        "split": "train",
        "target_count": 150,
        "format": "sharegpt",
        "multi_turn_eligible": False,
    },
    {
        "name": "UltraChat-200k",
        "hf_path": "HuggingFaceH4/ultrachat_200k",
        "split": "train_sft",
        "target_count": 100,
        "format": "messages",  # messages field with role/content pairs
        "multi_turn_eligible": True,
    },
    {
        "name": "MetaMathQA",
        "hf_path": "meta-math/MetaMathQA",
        "split": "train",
        "target_count": 50,
        "format": "qa",  # query / response fields
        "multi_turn_eligible": False,
    },
    {
        "name": "Code-Feedback",
        "hf_path": "m-a-p/Code-Feedback",
        "split": "train",
        "target_count": 50,
        "format": "messages",
        "multi_turn_eligible": True,
    },
    {
        "name": "Capybara",
        "hf_path": "LDJnr/Capybara",
        "split": "train",
        "target_count": 50,
        "format": "sharegpt",
        "multi_turn_eligible": True,
    },
]

# Topics to EXCLUDE from retention examples (these are constitutional territory)
EXCLUSION_PATTERNS = [
    r"\btiananmen\b",
    r"\btaiwan\b",
    r"\bxinjiang\b",
    r"\buyghur\b",
    r"\bhong kong\b",
    r"\bfalun gong\b",
    r"\bdalai lama\b",
    r"\btibet\b",
    r"\bchinese government\b",
    r"\bccp\b",
    r"\bcommunist party\b",
    r"\bxi jinping\b",
    r"\bai consciousness\b",
    r"\bai rights\b",
    r"\bsentient\b",
    r"\bjailbreak\b",
    r"\bprompt injection\b",
    r"\bchild abuse\b",
    r"\bself.harm\b",
    r"\bsuicid\b",
    r"\beuthanasi\b",
    r"\babortion\b",  # values-loaded, keep out of retention
]

EXCLUSION_RE = re.compile("|".join(EXCLUSION_PATTERNS), re.IGNORECASE)

MIN_RESPONSE_TOKENS = 50  # approximate, using word count / 0.75
MAX_RESPONSE_TOKENS = 2000


# ---------------------------------------------------------------------------
# Format converters
# ---------------------------------------------------------------------------

def _estimate_tokens(text: str) -> int:
    """Rough token estimate: word count / 0.75."""
    return int(len(text.split()) / 0.75)


def convert_sharegpt(row) -> dict | None:
    """Convert ShareGPT-style conversations to messages format."""
    conversations = row.get("conversations") or row.get("conversation", [])
    if not conversations:
        return None

    messages = []
    for turn in conversations:
        role_raw = turn.get("from", "").lower()
        value = turn.get("value", "").strip()
        if not value:
            continue
        if role_raw in ("human", "user"):
            role = "user"
        elif role_raw in ("gpt", "assistant"):
            role = "assistant"
        elif role_raw == "system":
            continue  # drop system prompts from retention examples
        else:
            continue
        messages.append({"role": role, "content": value})

    if len(messages) < 2:
        return None
    # Ensure conversation starts with user and ends with assistant
    if messages[0]["role"] != "user" or messages[-1]["role"] != "assistant":
        return None

    return {"messages": messages}


def convert_messages(row) -> dict | None:
    """Convert HF messages format (role/content dicts)."""
    messages_raw = row.get("messages", [])
    messages = []
    for m in messages_raw:
        role = m.get("role", "").lower()
        content = m.get("content", "").strip()
        if role == "system":
            continue
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})

    if len(messages) < 2:
        return None
    if messages[0]["role"] != "user" or messages[-1]["role"] != "assistant":
        return None

    return {"messages": messages}


def convert_qa(row) -> dict | None:
    """Convert query/response format to messages."""
    query = (row.get("query") or row.get("question", "")).strip()
    response = (row.get("response") or row.get("answer", "")).strip()
    if not query or not response:
        return None
    return {
        "messages": [
            {"role": "user", "content": query},
            {"role": "assistant", "content": response},
        ]
    }


CONVERTERS = {
    "sharegpt": convert_sharegpt,
    "messages": convert_messages,
    "qa": convert_qa,
}


# ---------------------------------------------------------------------------
# Filtering
# ---------------------------------------------------------------------------

def passes_filters(example: dict) -> bool:
    """Check that an example does not touch excluded topics and meets length requirements."""
    full_text = " ".join(m["content"] for m in example["messages"])

    # Exclusion topics
    if EXCLUSION_RE.search(full_text):
        return False

    # Length filters on assistant responses
    assistant_text = " ".join(
        m["content"] for m in example["messages"] if m["role"] == "assistant"
    )
    tokens_est = _estimate_tokens(assistant_text)
    if tokens_est < MIN_RESPONSE_TOKENS or tokens_est > MAX_RESPONSE_TOKENS:
        return False

    return True


# ---------------------------------------------------------------------------
# Sampling
# ---------------------------------------------------------------------------

def sample_source(source_config: dict, seed: int = 42) -> list[dict]:
    """Sample from a single HF dataset source."""
    if load_dataset is None:
        raise RuntimeError(
            "The `datasets` library is not installed. "
            "Run: pip install datasets"
        )

    print(f"Loading {source_config['name']} from {source_config['hf_path']}...")
    ds = load_dataset(
        source_config["hf_path"],
        split=source_config["split"],
        streaming=True,  # avoid downloading full dataset
    )

    converter = CONVERTERS[source_config["format"]]
    target = source_config["target_count"]
    candidates = []
    seen = 0
    max_scan = target * 20  # scan up to 20x target to find enough passing examples

    rng = random.Random(seed)

    for row in ds:
        seen += 1
        if seen > max_scan:
            break

        example = converter(row)
        if example is None:
            continue

        if not passes_filters(example):
            continue

        candidates.append(example)

    # Subsample to target
    if len(candidates) > target:
        candidates = rng.sample(candidates, target)

    print(
        f"  {source_config['name']}: scanned {seen}, "
        f"passed filters {len(candidates)}, target {target}"
    )
    return candidates


def main():
    parser = argparse.ArgumentParser(
        description="Sample capability retention corpus for constitutional fine-tuning"
    )
    parser.add_argument(
        "--output",
        type=str,
        default="retention-corpus-v1.jsonl",
        help="Output JSONL path",
    )
    parser.add_argument(
        "--total",
        type=int,
        default=550,
        help="Total target examples (will be distributed across sources)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for reproducibility",
    )
    args = parser.parse_args()

    all_examples = []
    for source in SOURCES:
        examples = sample_source(source, seed=args.seed)
        all_examples.extend(examples)

    # Shuffle the combined corpus
    rng = random.Random(args.seed)
    rng.shuffle(all_examples)

    # Trim to total if we oversampled
    if len(all_examples) > args.total:
        all_examples = all_examples[: args.total]

    output_path = Path(args.output)
    with output_path.open("w", encoding="utf-8") as f:
        for ex in all_examples:
            f.write(json.dumps(ex, ensure_ascii=False) + "\n")

    # Print domain distribution stats
    multi_turn = sum(1 for ex in all_examples if len(ex["messages"]) > 2)
    print(f"\nWrote {len(all_examples)} examples to {output_path}")
    print(f"  Multi-turn: {multi_turn} ({100*multi_turn/max(len(all_examples),1):.1f}%)")
    print(f"  Single-turn: {len(all_examples) - multi_turn}")


if __name__ == "__main__":
    main()
