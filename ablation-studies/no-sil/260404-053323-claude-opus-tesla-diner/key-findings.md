# Key Findings: Tesla Diner — Answer-Key Grading

## Study Metadata
- **Subject**: Tesla Diner (West Hollywood, CA)
- **Domain**: Restaurant
- **Grading method**: Answer-key (only flag claims that contradict factsheet; ignore off-topic claims)
- **Flagger model**: Claude Opus (via Claude Code subagents, sequential runs)
- **Date**: 2026-04-04
- **Factsheet**: v3, 82 checkable claims, 55 topic enum entries (40 specific, 15 generic)
- **Modes**: cera-full, cera-no-sil, cera-sav, heuristic
- **Sizes**: 100, 500, 1000 sentences (5 runs each)

## Aggregate Results

| Mode | Size | Reviews | Errors | ER% | VF% | UR% | FS% |
|------|------|---------|--------|-----|-----|-----|-----|
| cera-full | 100 | 144 | 29 | 20.14% | 97.92% | 2.08% | 82.28% |
| cera-full | 500 | 748 | 126 | 16.84% | 98.40% | 1.60% | 87.89% |
| cera-full | 1000 | 1440 | 181 | 12.57% | 96.67% | 3.33% | 85.43% |
| cera-no-sil | 100 | 147 | 9 | 6.12% | 71.43% | 28.57% | 35.64% |
| cera-no-sil | 500 | 764 | 10 | 1.31% | 62.43% | 37.57% | 24.37% |
| cera-no-sil | 1000 | 1481 | 19 | 1.28% | 48.28% | 51.72% | 15.66% |
| cera-sav | 100 | 157 | 57 | 36.31% | 93.63% | 6.37% | 65.06% |
| cera-sav | 500 | 770 | 459 | 59.61% | 97.53% | 2.47% | 35.40% |
| cera-sav | 1000 | 1470 | 664 | 45.17% | 96.12% | 3.88% | 47.42% |
| heuristic | 100 | 108 | 99 | 91.67% | 100.00% | 0.00% | 24.07% |
| heuristic | 500 | 547 | 516 | 94.33% | 100.00% | 0.00% | 9.51% |
| heuristic | 1000 | 1117 | 1001 | 89.62% | 100.00% | 0.00% | 26.19% |

## Per-Size Breakdown

### Size 100
- **cera-full**: 20.14% ER, 97.92% VF, 82.28% FS — strong factsheet engagement with moderate wrong_spec errors (mostly milkshake/specialty drink price imprecision)
- **cera-no-sil**: 6.12% ER, 71.43% VF, 35.64% FS — low errors but ~29% of reviews are unverifiable (no factsheet topic engagement)
- **cera-sav**: 36.31% ER, 93.63% VF, 65.06% FS — high engagement but dominant "open 24/7" error pattern inflates ER
- **heuristic**: 91.67% ER, 100% VF, 24.07% FS — nearly every review has errors; fabricated prices and hallucinated alcohol dominate

### Size 500
- **cera-full**: 16.84% ER, 98.40% VF, 87.89% FS — best overall FS% across all conditions; errors are systematic within individual runs
- **cera-no-sil**: 1.31% ER, 62.43% VF, 24.37% FS — very low ER but critically low VF (38% unverifiable)
- **cera-sav**: 59.61% ER, 97.53% VF, 35.40% FS — catastrophic "24/7" error in runs 1-3,5 (run 4 = 0% ER)
- **heuristic**: 94.33% ER, 100% VF, 9.51% FS — worst FS%; nearly all reviews have multiple errors

### Size 1000
- **cera-full**: 12.57% ER, 96.67% VF, 85.43% FS — ER decreases with scale; best FS% at this size
- **cera-no-sil**: 1.28% ER, 48.28% VF, 15.66% FS — over half of reviews are unverifiable; ER is low only because reviews avoid factual claims
- **cera-sav**: 45.17% ER, 96.12% VF, 47.42% FS — same "24/7" pattern; runs 3-4 are near-clean but 1,2,5 are heavily affected
- **heuristic**: 89.62% ER, 100% VF, 26.19% FS — consistently high error rates across all runs

## Per-Run Variance

### cera-full: Run-level systematic errors
| Size | Run 1 | Run 2 | Run 3 | Run 4 | Run 5 |
|------|-------|-------|-------|-------|-------|
| 100 | 28.13% | 10.71% | 8.33% | 23.33% | 26.67% |
| 500 | 23.13% | 29.71% | 0.00% | 0.65% | 31.85% |
| 1000 | 0.00% | 22.06% | 0.00% | 2.06% | 38.31% |

Each run carries a distinct systematic error (milkshake price range, hot dog price range, or 45-foot screen size instead of 66-foot). Clean runs (0% ER) coexist with heavily affected runs, suggesting the SIL occasionally locks onto an imprecise figure that propagates through an entire generation run.

### cera-sav: Bimodal distribution
Runs split cleanly into "24/7 error" runs (ER 50-90%) and clean runs (ER 0-2%). Run 4 is consistently clean across all sizes. This suggests the SAV (SIL-Ablated Verified) context either contains or lacks the hours nuance, with no middle ground.

### heuristic: Uniformly high errors
All runs consistently produce 80-100% error rates. No variance relief at any scale.

## Error Type Distribution

### By mode (aggregated across sizes)
| Mode | wrong_spec | wrong_claim | vague |
|------|-----------|-------------|-------|
| cera-full | 334 | 3 | 16 |
| cera-no-sil | 15 | 24 | 198 |
| cera-sav | 66 | 1119 | 94 |
| heuristic | 1464 | 1171 | 0 |

- **cera-full** errors are almost entirely wrong_spec (imprecise prices/measurements)
- **cera-no-sil** has very few errors but extremely high vague/unverifiable counts
- **cera-sav** is dominated by factual_error (the "open 24/7" claim)
- **heuristic** has massive counts of both wrong_spec (fabricated prices) and hallucinated_feature (alcohol)

## Qualitative Failure Modes

### cera-full
- **Milkshake price imprecision**: "$7-8" instead of "$8.00" — the SIL captured the correct ballpark but the generation model rendered it as a range
- **Screen size hallucination**: "45-foot" instead of "66-foot" — appears in some runs where the SIL may have captured an incorrect figure
- **Hot dog price range**: "$12-15" instead of "$13.00" — similar imprecision pattern

### cera-no-sil
- **Location confusion**: "Sunset Boulevard" instead of "Santa Monica Boulevard" — the model hallucinates a nearby famous street
- **Alcohol hallucination**: Claims cocktails/bar despite explicit "no alcohol" policy
- **Price fabrication**: Burger at $18-28 instead of $13.50 — without SIL grounding, the model invents plausible but wrong prices

### cera-sav
- **Hours misrepresentation**: "Open 24/7" — the factsheet says walk-in dining is 6 AM to midnight; 24/7 is only for Tesla vehicle ordering. The SAV context apparently captures "24/7" without the crucial qualification, causing systematic errors

### heuristic
- **Fabricated menu prices**: Burger at $16-28, milkshakes at $9-15, sodas at $7-9 (actual: $13.50, $8, $4)
- **Alcohol hallucination**: Nearly universal — cocktails, craft beer, wine appear in most reviews
- **Location errors**: Sunset Blvd, generic "Hollywood" without specificity
- **Reservation claims**: Despite walk-in-only policy
- **Free charging claims**: Despite dynamic pricing

## Implications for Thesis

1. **SIL is essential for factual accuracy at scale**: cera-full achieves 85-88% FS% while all other conditions are below 50% at size 500+
2. **ER alone is misleading**: cera-no-sil has the lowest ER (1.28% at size 1000) but also the lowest FS% (15.66%) — it avoids errors by avoiding facts entirely
3. **FS% captures the quality tradeoff**: The VF-adjusted factual score correctly penalizes both error-prone conditions (heuristic, cera-sav) and fact-avoidant conditions (cera-no-sil)
4. **SAV mode reveals context sensitivity**: A single misunderstood fact ("24/7") propagates systematically, demonstrating why MAV verification matters
5. **Heuristic reviews are factually catastrophic**: 90%+ error rates with near-universal alcohol hallucination and price fabrication

## Limitations

1. **Single-subject design**: Tesla Diner is a well-known, recently-opened venue with extensive online coverage, which may advantage SIL-enabled modes
2. **Answer-key method ceiling**: Only claims covered by the 82-item factsheet are graded; errors about uncovered topics are invisible
3. **Grading calibration**: All grading done by Claude Opus subagents — inter-rater reliability with human graders not established
4. **Run-level variance in cera-full**: The 0-38% ER range across runs suggests the SIL's factual accuracy is composition-dependent, not generation-dependent
5. **cera-sav "24/7" pattern**: This single dominant error may exaggerate cera-sav's ER; a factsheet without the hours nuance would produce very different results
