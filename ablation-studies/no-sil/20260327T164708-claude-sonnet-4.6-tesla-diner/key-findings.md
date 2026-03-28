# SIL Ablation Study: Key Findings — Tesla Diner (Restaurant Domain)

## Study Metadata

| Field | Value |
|-------|-------|
| Date | March 27, 2026 |
| Flagger Model | Claude Sonnet 4.6 (via Claude Code subagents) |
| Domain | Restaurant |
| Subject | Tesla Diner, West Hollywood, CA |
| Factsheet | 42 verifiable claims across 12 categories |
| Sizes | 100, 500, 1000 sentences |
| Runs per dataset | 5 (composition-scoped for CERA modes, generation-scoped for heuristic) |
| Total reviews flagged | 8,893 across 60 datasets |
| Generation model | Qwen 3.5 35B-A3B (local) |

## Conditions

| Mode | SIL | MAV | Description |
|------|-----|-----|-------------|
| cera-full | Yes | Yes | Full CERA pipeline with SIL web-search grounding + MAV verification |
| cera-sav | Yes | No | SIL grounding only, no MAV cross-model verification |
| cera-no-sil | No | No | No SIL, no MAV — LLM generates from query alone |
| heuristic | N/A | N/A | Template-based generation without LLM composition |

## Aggregate Results

| Mode | FS% | ER% | VF% | Total Reviews | Errors | Vague |
|------|-----|-----|-----|---------------|--------|-------|
| cera-full | **56.92%** | 35.76% | 92.68% | 2332 | 746 | 40 |
| cera-no-sil | **48.36%** | 19.15% | 67.51% | 2392 | 341 | 573 |
| cera-sav | **26.58%** | 67.31% | 93.89% | 2397 | 1531 | 54 |
| heuristic | **8.96%** | 90.89% | 99.85% | 1645 | 1449 | 53 |

**Key metric definitions:**
- **FS%** (Factual Score): VF% minus ER%. Measures the percentage of reviews that are both information-rich and factually accurate. Uses strict per-review scoring: a review with five correct specs and one wrong price receives no credit. Scale: 0% = every verifiable review has an error, 100% = every review is specific and correct.
- **ER%** (Error Rate): Fraction of reviews with at least one factual error (excludes vague-only flags)
- **VF%** (Verifiable Fact density): Fraction of reviews containing at least one verifiable claim

## FS% by Dataset Size

| Mode | 100-sent | 500-sent | 1000-sent | Overall |
|------|----------|----------|-----------|---------|
| cera-full | 45.97% | 58.37% | 66.42% | **56.92%** |
| cera-no-sil | 44.45% | 53.22% | 47.41% | **48.36%** |
| cera-sav | 19.76% | 22.20% | 37.77% | **26.58%** |
| heuristic | 4.82% | 9.02% | 13.05% | **8.96%** |

## Error Rates by Dataset Size

| Mode | 100-sent ER% | 500-sent ER% | 1000-sent ER% | Trend |
|------|-------------|-------------|--------------|-------|
| cera-full | 41.71% | 36.57% | 28.99% | decreasing |
| cera-no-sil | 30.48% | 14.54% | 12.44% | decreasing |
| cera-sav | 70.16% | 73.50% | 58.27% | decreasing |
| heuristic | 95.18% | 90.81% | 86.69% | decreasing |

## VF% (Verifiable Fact Density) by Mode and Size

| Mode | 100-sent | 500-sent | 1000-sent | Overall |
|------|----------|----------|-----------|---------|
| cera-full | 87.7% | 95.0% | 95.4% | 92.7% |
| cera-no-sil | 74.9% | 67.8% | 59.9% | 67.5% |
| cera-sav | 89.9% | 95.7% | 96.0% | 93.9% |
| heuristic | 100.0% | 99.8% | 99.7% | 99.9% |

## Error Type Distribution

| Mode | factual_error | hallucinated_feature | wrong_spec | timeline_error | vague_review |
|------|--------------|---------------------|-----------|---------------|-------------|
| cera-full | 15 (1.8%) | 233 (28.0%) | 531 (63.7%) | 2 (0.2%) | 43 (5.2%) |
| cera-no-sil | 94 (12.8%) | 223 (30.3%) | 14 (1.9%) | 0 (0.0%) | 400 (54.4%) |
| cera-sav | 552 (32.0%) | 108 (6.3%) | 321 (18.6%) | 1 (0.1%) | 53 (3.1%) |
| heuristic | 33 (1.9%) | 503 (29.2%) | 657 (38.1%) | 0 (0.0%) | 54 (3.1%) |

## Qualitative Failure Mode Comparison

| Mode | Dominant Failure Pattern | Severity |
|------|------------------------|----------|
| cera-full | Wrong price ceiling ($15 vs $14 max), hallucinated menu items (chicken & waffles, carbonara), Optimus robot depicted as active server | Moderate — errors are narrow spec deviations |
| cera-no-sil | Hallucinated off-menu items (pancakes, steak, avocado toast, carbonara), high vague rate (24% of reviews), wrong address (Sunset Blvd) | Moderate-High — missing subject grounding |
| cera-sav | Systematic 24/7 hours error, fabricated 66-ft screen dimensions, fabricated no-name-brand soda restriction, roller-skating carhops | High — SIL without MAV propagates unverified facts |
| heuristic | Wrong prices ($18+ burgers), hallucinated alcohol/cocktails, fabricated chef names, wrong capacity, wrong address | Very High — near-total factual failure |

## Implications for the SIL Component

### 1. SIL + MAV (cera-full) achieves the highest factual score

With FS% of 56.92%, cera-full has the highest proportion of reviews that are both information-dense and factually accurate. The remaining 43% are split between vague reviews (~7%) and reviews with at least one error (~36%). Importantly, the errors in cera-full are narrow spec deviations (rounding $14 to $15, or attributing agency to a static robot display) rather than wholesale fabrication.

### 2. Removing SIL increases vagueness, masking lower raw error rates

The cera-no-sil condition scores FS% 48.36% despite a lower raw ER% (19.15%). The gap is explained by the high vague rate: 573 vague reviews (24%) provide no verifiable content, pulling down VF% to 67.51%. Without SIL-provided facts, the generation model produces generic restaurant text with no identifying details, or invents plausible but incorrect items (pancakes, steak, carbonara) drawn from generic diner associations.

### 3. SIL without MAV (cera-sav) is the worst CERA condition

At FS% 26.58%, cera-sav scores lower than cera-no-sil despite having higher VF% (93.89%). SIL alone, without MAV verification, injects unverified facts that propagate systematically: the "open 24/7" error (confusing vehicle ordering hours with public dining hours), fabricated "66-foot LED screens," and fabricated no-name-brand soda restrictions appeared across hundreds of reviews. This demonstrates that MAV's 2/3 majority voting is essential for filtering SIL retrieval errors.

### 4. Heuristic generation scores near zero

FS% of 8.96% means fewer than 1 in 10 heuristic reviews are both specific and correct. Nearly every review contains fabricated prices ($18+ burgers vs. actual $13.50), hallucinated alcohol service, and invented chef names. This establishes a clear lower bound for factual quality.

### 5. FS% improves with dataset size for full-pipeline CERA

cera-full FS% rises from 45.97% at 100 sentences to 66.42% at 1000 sentences, driven by decreasing error rates at larger sizes. cera-no-sil shows a mixed pattern: ER% decreases but VF% also drops, so FS% remains relatively flat. cera-sav improves at 1000 sentences (37.77%) as the systematic propagation errors dilute across more reviews.

## Study Limitations

1. **Single domain**: Results are for the restaurant domain only. Laptop and hotel domains may show different SIL/MAV dynamics.
2. **Single generation LLM**: All reviews were generated by Qwen 3.5 35B-A3B. Results may vary with different generation models.
3. **Flagger model bias**: Claude Sonnet 4.6 serves as both the standard and the measure. Systematic blind spots in the flagger would affect all conditions equally.
4. **Factsheet scope**: Claims not covered by the factsheet (e.g., screen dimensions, charging speeds) create ambiguous flagging decisions.
5. **Run variance**: Some mode x size combinations show high inter-run variance (e.g., cera-full 1000 ranges from 3% to 71% ER across runs), suggesting results are sensitive to composition randomness.
6. **Per-review scoring**: FS% uses strict binary scoring per review. A review with many correct claims and one minor error (e.g., $15 instead of $14) scores the same as a review with entirely fabricated content. This conservative approach reflects trustworthiness from a reader's perspective but may understate the overall factual quality of the generated text.

## Raw Data

- Per-run CSVs: `csv/{mode}-{size}-run{N}.csv`
- Run comparison CSVs: `csv/{mode}-{size}-runs.csv`
- Master flat table: `csv/all-runs.csv`
- Dataset JSONs: `datasets/restaurant/{mode}/{size}-sent.json`
- Summary: `summary.json`, `summary.csv`