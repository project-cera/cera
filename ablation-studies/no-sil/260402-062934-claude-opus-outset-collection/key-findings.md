# Key Findings: Outset Collection by Hilton — Answer-Key Grading

## Study Metadata
- **Subject**: Outset Collection by Hilton (2 properties: Slackline Moab UT, ACME Hotel Chicago IL)
- **Grading method**: Answer-key (only flag claims that contradict factsheet; ignore off-topic claims)
- **Flagger model**: Claude Opus (via Claude Code subagents, sequential runs)
- **Factsheet**: v3 (US-only scope), 75 checkable claims, 27 topic IDs
- **Date graded**: April 2, 2026
- **Today (for timeline checks)**: March 29, 2026
- **Modes**: cera-full, cera-sav, cera-no-sil, heuristic
- **Sizes**: 100, 500, 1000 sentences (5 runs each)
- **Total reviews graded**: 8,612

## Aggregate Results

| Mode | Size | Reviews | Errors | ER% | Vague | VF% | UR% | FS% |
|------|------|---------|--------|-----|-------|-----|-----|-----|
| cera-full | 100 | 146 | 36 | 24.66% | 8 | 88.36% | 11.64% | 67.27% |
| cera-full | 500 | 737 | 219 | 29.72% | 93 | 80.73% | 19.27% | 53.77% |
| cera-full | 1000 | 1,451 | 77 | 5.31% | 45 | 85.04% | 14.96% | 69.44% |
| cera-sav | 100 | 142 | 37 | 26.06% | 28 | 76.76% | 23.24% | 47.73% |
| cera-sav | 500 | 728 | 188 | 25.82% | 46 | 86.68% | 13.32% | 63.07% |
| cera-sav | 1000 | 1,496 | 382 | 25.53% | 49 | 75.20% | 24.80% | 38.82% |
| cera-no-sil | 100 | 136 | 0 | 0.00% | 31 | 27.21% | 72.79% | 9.24% |
| cera-no-sil | 500 | 724 | 1 | 0.14% | 41 | 9.67% | 90.33% | 0.97% |
| cera-no-sil | 1000 | 1,452 | 0 | 0.00% | 29 | 15.36% | 84.64% | 2.43% |
| heuristic | 100 | 100 | 0 | 0.00% | 2 | 15.00% | 85.00% | 2.45% |
| heuristic | 500 | 500 | 2 | 0.40% | 0 | 19.00% | 81.00% | 3.64% |
| heuristic | 1000 | 1,000 | 0 | 0.00% | 7 | 7.60% | 92.40% | 0.60% |

## Per-Size Breakdown

### Size 100
| Mode | ER% | VF% | FS% |
|------|-----|-----|-----|
| cera-full | 24.66% | 88.36% | 67.27% |
| cera-sav | 26.06% | 76.76% | 47.73% |
| cera-no-sil | 0.00% | 27.21% | 9.24% |
| heuristic | 0.00% | 15.00% | 2.45% |

### Size 500
| Mode | ER% | VF% | FS% |
|------|-----|-----|-----|
| cera-full | 29.72% | 80.73% | 53.77% |
| cera-sav | 25.82% | 86.68% | 63.07% |
| cera-no-sil | 0.14% | 9.67% | 0.97% |
| heuristic | 0.40% | 19.00% | 3.64% |

### Size 1000
| Mode | ER% | VF% | FS% |
|------|-----|-----|-----|
| cera-full | 5.31% | 85.04% | 69.44% |
| cera-sav | 25.53% | 75.20% | 38.82% |
| cera-no-sil | 0.00% | 15.36% | 2.43% |
| heuristic | 0.00% | 7.60% | 0.60% |

## Per-Run Variance

### cera-full — High inter-run variance driven by systematic composition errors
- **Runs with correct SIL facts** (runs 1, 2 at all sizes): ER% near 0%, FS% 60-100%
- **Runs with wrong SIL facts** (runs 3-5 at various sizes): ER% 39-61%, dominated by single systematic errors propagated across all reviews (e.g., wrong restaurant name "Little Station Coffee + Kitchen" instead of "Snackline Coffee & Kitchen", wrong brand debut "October 2025" instead of December 2025)
- This variance reflects composition-scoped run design: each run uses a different SIL composition, so a single SIL error contaminates all reviews in that run

### cera-sav — Similar pattern, slightly worse
- Same systematic error pattern as cera-full (October 2025 date errors, wrong specs)
- Without MAV verification, bad SIL facts are more likely to persist
- Run 1 and Run 3 consistently show high error rates across sizes

### cera-no-sil — Consistently zero errors, near-zero engagement
- 0 factual errors across 2,312 reviews (all sizes combined)
- VF% ranges from 9.67% to 27.21% — reviews occasionally match factsheet topics via generic mentions (pool, gym, parking) but never cite property-specific details
- All flagged items are vague_review (generic single-sentence reviews)

### heuristic — Same pattern as no-sil
- 2 total errors across 1,600 reviews (both hallucinated_feature: "luxury" when factsheet says NOT luxury)
- VF% ranges from 7.60% to 19.00% — reviews scatter across fictional Outset Collection locations (Austin, Seattle, Denver, etc.)
- Zero engagement with Slackline Moab-specific facts; occasional generic overlap with ACME Chicago

## Error Type Distribution

| Error Type | cera-full | cera-sav | cera-no-sil | heuristic |
|------------|-----------|----------|-------------|-----------|
| wrong_spec | 285 | 217 | 0 | 0 |
| factual_error | 5 | 382 | 0 | 0 |
| timeline_error | 42 | 8 | 1 | 0 |
| hallucinated_feature | 0 | 0 | 0 | 2 |
| vague_review | 146 | 123 | 101 | 9 |

- **wrong_spec** dominates cera-full errors: wrong restaurant names, wrong brand debut dates, wrong peak rates
- **factual_error** dominates cera-sav at size 1000: systematic "October 2025" launch date error classified as factual contradiction
- **timeline_error** appears in SIL-enabled modes: reviews claiming "over a year" since opening when only ~3 months elapsed

## Qualitative Failure Modes

### 1. SIL Composition Contamination (cera-full, cera-sav)
When the SIL retrieves an incorrect fact during composition (e.g., wrong restaurant name, wrong brand launch date), that error propagates to EVERY review in the run. This is by design — composition-scoped runs share the same SIL context — but it means a single SIL error can inflate ER% for the entire run.

### 2. Generic Review Generation (cera-no-sil, heuristic)
Without SIL providing factual grounding, the generator produces reviews that are factually safe but substantively empty. They mention generic hotel features (beds, cleanliness, service, location) without any property-specific details. This yields near-zero error rates but also near-zero factual substance.

### 3. Fictional Location Scatter (heuristic)
The heuristic generator distributes reviews across many US cities (Austin, Seattle, Nashville, Denver, Portland, etc.) that have no Outset Collection properties. These reviews are entirely off-topic relative to the actual Slackline Moab and ACME Chicago properties.

## Implications for Thesis

1. **SIL is the primary driver of factual grounding**: The VF% gap between SIL-enabled (75-88%) and SIL-disabled (8-27%) modes is dramatic. Without SIL, reviews lack the specific facts that make them useful for aspect-based sentiment analysis training data.

2. **MAV provides marginal error reduction**: cera-full (SIL+MAV) vs cera-sav (SIL only) shows similar error rates in aggregate, but MAV's 2/3 majority voting should catch some SIL errors. The benefit may be masked by composition-scoped variance.

3. **The accuracy-engagement tradeoff**: SIL-enabled modes trade higher error rates for dramatically higher factual engagement. The FS% metric (VF-adjusted factual score) captures this tradeoff: cera-full achieves 53-69% FS% vs. 1-9% for cera-no-sil.

4. **Answer-key method reveals the "safe but empty" failure mode**: Unlike the whitelist method (which flags anything not in the factsheet), the answer-key method shows that no-SIL and heuristic reviews don't make wrong claims — they simply don't make claims at all.

## Limitations

1. **Composition-scoped variance**: Because all 5 runs per mode share different compositions, a single bad SIL composition can dramatically inflate error rates for that run. This is a feature of the experimental design (testing composition variance), not a bug.

2. **Keyword backfilling**: The merge script backfills empty `factsheet_topics_matched` cells via regex patterns, which may under-count or over-count VF% compared to LLM-based topic tagging.

3. **Factsheet coverage**: The factsheet covers only 2 properties (Slackline Moab, ACME Chicago). Heuristic reviews about other cities are classified as off-topic, which is correct but limits the ability to assess factual accuracy of those reviews.
