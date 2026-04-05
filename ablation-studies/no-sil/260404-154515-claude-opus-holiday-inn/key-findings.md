# Key Findings: Holiday Inn no-SIL Ablation (Answer-Key Method)

## Study Metadata

- **Subject**: Holiday Inn by IHG (hotel domain)
- **Grading method**: Answer-key (only flag claims contradicting factsheet; ignore off-topic claims)
- **Flagger model**: Claude Opus (via Claude Code subagents)
- **Date**: April 4, 2026
- **Factsheet**: v3, 54 claims (US-only scope)
- **Sizes**: 100, 500, 1000 sentences
- **Runs per size**: 5
- **Condition**: cera-no-sil (SIL disabled, MAV disabled)

## Aggregate Results

| Mode | Size | Reviews | Errors | Vague | ER% | VF% | FS% |
|------|------|---------|--------|-------|-----|-----|-----|
| cera-no-sil | 100 | 140 | 6 | 2 | 4.29% | 37.14% | 12.35% |
| cera-no-sil | 500 | 727 | 9 | 4 | 1.24% | 37.28% | 13.55% |
| cera-no-sil | 1000 | 1,405 | 13 | 16 | 0.93% | 37.86% | 14.15% |

## Per-Run Variance

### Size 100 (22-33 reviews/run)
| Run | Reviews | Errors | ER% | VF% | FS% |
|-----|---------|--------|-----|-----|-----|
| 1 | 33 | 1 | 3.03% | 30.30% | 8.26% |
| 2 | 31 | 1 | 3.23% | 35.48% | 11.45% |
| 3 | 26 | 1 | 3.85% | 38.46% | 13.31% |
| 4 | 22 | 1 | 4.55% | 40.91% | 14.88% |
| 5 | 28 | 2 | 7.14% | 42.86% | 15.31% |

### Size 500 (137-154 reviews/run)
| Run | Reviews | Errors | ER% | VF% | FS% |
|-----|---------|--------|-----|-----|-----|
| 1 | 145 | 2 | 1.38% | 39.31% | 14.91% |
| 2 | 154 | 1 | 0.65% | 40.26% | 15.95% |
| 3 | 147 | 3 | 2.04% | 31.97% | 9.57% |
| 4 | 137 | 2 | 1.46% | 35.04% | 11.77% |
| 5 | 144 | 1 | 0.69% | 39.58% | 15.39% |

### Size 1000 (272-289 reviews/run)
| Run | Reviews | Errors | ER% | VF% | FS% |
|-----|---------|--------|-----|-----|-----|
| 1 | 288 | 2 | 0.69% | 30.21% | 8.92% |
| 2 | 289 | 7 | 2.42% | 42.91% | 17.37% |
| 3 | 282 | 1 | 0.35% | 38.65% | 14.80% |
| 4 | 272 | 3 | 1.10% | 38.97% | 14.76% |
| 5 | 274 | 0 | 0.00% | 38.69% | 14.97% |

## Error Type Distribution

All errors are **hallucinated_feature** type. Zero wrong_spec or timeline_error instances.

| Error Pattern | Count | % of Total Errors |
|--------------|-------|-------------------|
| Complimentary/free breakfast | ~25 | ~89% |
| Spa/concierge service | ~3 | ~11% |

The dominant hallucination is claiming Holiday Inn offers complimentary breakfast, which the factsheet explicitly says it does NOT (unlike Holiday Inn Express). This is the most predictable error for a no-SIL condition: without factual grounding from web search, the LLM conflates Holiday Inn and Holiday Inn Express breakfast policies.

## Qualitative Failure Modes

1. **Breakfast conflation**: The model frequently claims breakfast is included or complimentary. This is a brand-level confusion between Holiday Inn (full-service, breakfast for purchase) and Holiday Inn Express (complimentary hot breakfast). SIL would have caught this distinction via web search.

2. **Luxury amenity hallucination**: A small number of reviews mention spa or concierge services, which the factsheet explicitly lists under "Does NOT Have." Without SIL grounding, the model occasionally attributes upscale amenities to a midscale brand.

3. **Low VF%**: Only ~37% of reviews engage with factsheet-verifiable topics. The remaining ~63% make only generic claims (clean room, friendly staff, good location) that the factsheet neither confirms nor denies. This is expected for no-SIL: without specific subject intelligence, the model generates mostly generic hotel reviews.

## Implications for Thesis

- **ER% decreases with scale** (4.29% at 100 → 0.93% at 1000), likely due to the larger review pool diluting the fixed set of hallucination patterns
- **VF% is stable across sizes** (~37%), confirming that factsheet engagement rate is independent of dataset size
- **FS% is low** (12-14%), driven by the VF-adjustment penalty on low engagement. Even though most engaged reviews are correct, the ~63% disengagement rate heavily penalizes the aggregate score
- The no-SIL condition produces reviews that are mostly **safe but uninformative** — few factual errors, but also few verifiable facts

## Limitations

- Holiday Inn age limits for Kids Stay Free and Kids Eat Free programs were removed from the factsheet due to source ambiguity, which may undercount potential wrong_spec errors
- Topic backfill via keyword matching may miss subtle topic engagement or over-match generic vocabulary
- Single-model generation (Qwen3.5-35B-A3B) — results may not generalize to other LLMs
