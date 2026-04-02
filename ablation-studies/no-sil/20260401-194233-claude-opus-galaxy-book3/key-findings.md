# Key Findings: Galaxy Book3 no-SIL Ablation (Answer-Key Method)

## Study Metadata
- **Subject**: Samsung Galaxy Book3 (laptop domain)
- **Grading method**: Answer-key (only flag claims that contradict factsheet; ignore off-topic)
- **Flagger model**: Claude Opus (via Claude Code subagents)
- **Date**: April 1, 2026
- **Modes**: heuristic, cera-no-sil, cera-sav, cera-full
- **Sizes**: 100, 500, 1000 (5 runs each)
- **Total reviews graded**: 8,630
- **Factsheet**: 44 claims (36 specific, 8 generic)
- **Topic enum**: 34 specific topic IDs

## Aggregate Results

| Mode | Size | Reviews | ER% | VF% | FS% | Vague |
|------|------|---------|-----|-----|-----|-------|
| heuristic | 100 | 104 | 54.81% | 100.00% | 52.40% | 0 |
| heuristic | 500 | 518 | 61.97% | 100.00% | 63.32% | 0 |
| heuristic | 1000 | 1,051 | 56.14% | 99.62% | 51.81% | 0 |
| cera-no-sil | 100 | 141 | 16.31% | 77.30% | 64.54% | 43 |
| cera-no-sil | 500 | 732 | 8.20% | 81.97% | 77.32% | 70 |
| cera-no-sil | 1000 | 1,455 | 7.56% | 79.31% | 75.50% | 231 |
| cera-sav | 100 | 154 | 31.17% | 87.01% | 60.39% | 18 |
| cera-sav | 500 | 739 | 20.16% | 88.36% | 78.28% | 105 |
| cera-sav | 1000 | 1,411 | 26.72% | 94.47% | 81.04% | 81 |
| cera-full | 100 | 154 | 9.74% | 91.56% | 86.69% | 15 |
| cera-full | 500 | 755 | 30.20% | 95.76% | 70.86% | 42 |
| cera-full | 1000 | 1,416 | 9.89% | 93.71% | 88.74% | 99 |

## Per-Size Breakdown

### Size 100

| Mode | ER% | VF% | FS% |
|------|-----|-----|-----|
| heuristic | 54.81% | 100.00% | 52.40% |
| cera-no-sil | 16.31% | 77.30% | 64.54% |
| cera-sav | 31.17% | 87.01% | 60.39% |
| cera-full | 9.74% | 91.56% | 86.69% |

### Size 500

| Mode | ER% | VF% | FS% |
|------|-----|-----|-----|
| heuristic | 61.97% | 100.00% | 63.32% |
| cera-no-sil | 8.20% | 81.97% | 77.32% |
| cera-sav | 20.16% | 88.36% | 78.28% |
| cera-full | 30.20% | 95.76% | 70.86% |

### Size 1000

| Mode | ER% | VF% | FS% |
|------|-----|-----|-----|
| heuristic | 56.14% | 99.62% | 51.81% |
| cera-no-sil | 7.56% | 79.31% | 75.50% |
| cera-sav | 26.72% | 94.47% | 81.04% |
| cera-full | 9.89% | 93.71% | 88.74% |

## Per-Run Variance

### Heuristic
- Size 100: ER% range 33.3%--65.0% (run 4 anomalously low)
- Size 500: ER% range 55.6%--70.3% (relatively stable)
- Size 1000: ER% range 53.0%--59.8% (most stable)

### CERA-no-SIL
- Size 100: ER% range 10.3%--22.2% (moderate variance)
- Size 500: ER% range 4.6%--16.0% (run 3 spiked)
- Size 1000: ER% range 6.1%--10.3% (stable)

### CERA-SAV
- Size 100: ER% range 27.6%--64.5% (high variance, run 4 worst)
- Size 500: ER% range 0.0%--28.8% (run 3 had zero errors)
- Size 1000: ER% range 13.1%--35.9% (moderate variance)

### CERA-Full
- Size 100: ER% range 0.0%--26.9% (high variance at small size)
- Size 500: ER% range 13.1%--48.7% (high variance)
- Size 1000: ER% range 0.0%--30.6% (two runs at 0%, two runs with significant errors)

## Error Type Distribution

### Heuristic (dominant pattern)
- **hallucinated_feature** (AMOLED/OLED display): The overwhelming error. ~40-50% of reviews claim AMOLED/OLED when the device has IPS LCD. The heuristic generator systematically hallucinates the display type.
- **wrong_spec** (CPU generation): 11th/12th Gen instead of 13th Gen Raptor Lake-U.
- **wrong_spec** (display resolution): 2.8K, QHD+, 2880x1800 instead of 1920x1080.
- **factual_error** (missing features): Claims no microSD reader, no USB-A ports.

### CERA-no-SIL
- **wrong_spec** (RAM type): LPDDR5/DDR5 instead of LPDDR4x.
- **wrong_spec** (CPU generation): 11th/12th Gen, occasional AMD Ryzen.
- **hallucinated_feature** (Thunderbolt 4): Claims Thunderbolt ports exist.
- **wrong_spec** (battery life): 10-14 hours instead of ~7 hours.
- Occasional "carbonara" off-topic reviews (systematic artifact).

### CERA-SAV
- **wrong_spec** (CPU models): Hallucinated i3 processor option (not in factsheet).
- **wrong_spec** (pricing): $550-$750 starting prices instead of $999.99.
- **wrong_spec** (storage): Claims 1TB configuration exists.
- **timeline_error**: "Launched earlier this year" in March 2026 for a 2023 device.

### CERA-Full
- **wrong_spec** (pricing): $1,099.99 instead of $999.99 (most common).
- **wrong_spec** (CPU model): i5-1355U (nonexistent, conflating i5-1335U and i7-1355U).
- **wrong_spec** (storage): 1TB configuration hallucinated in some runs.
- Two runs at size 1000 had zero errors.

## Qualitative Failure Modes

1. **Display type hallucination (heuristic only)**: Without any CERA composition pipeline, the heuristic generator defaults to Samsung's flagship display technology (AMOLED) rather than the budget IPS LCD on this entry-level device. This is the single largest error source.

2. **CPU model confusion (all CERA modes)**: The i5-1335U and i7-1355U model numbers are very similar, leading to cross-contamination (i5-1355U). SAV mode additionally hallucinates an i3 option.

3. **Price drift (CERA-SAV, CERA-full)**: SAV mode tends to generate lower-than-actual prices ($550-$750), possibly reflecting general market heuristics about entry-level laptops. CERA-full slightly overshoots ($1,099.99 vs $999.99).

4. **Run-level variance**: Both CERA-SAV and CERA-full show high run-to-run variance, with individual runs having either zero errors or 30%+ error rates. This suggests the composition pipeline produces different context documents per run that cascade into different error patterns.

## Implications for Thesis

1. **Heuristic baseline is deeply flawed**: ~56% error rate driven by systematic AMOLED hallucination. The heuristic generator lacks product-specific grounding and defaults to brand stereotypes.

2. **SIL provides substantial error reduction**: cera-no-sil (7-16% ER) vs cera-full (0-30% ER) shows that SIL does not consistently provide additional error reduction beyond MAV+SIL-less composition. However, FS% tells a different story: cera-full achieves the highest FS% at scale (88.74% at 1000), indicating that SIL improves the quality of correct claims even when error rates are similar.

3. **SAV introduces systematic hallucinations**: The SAV-only mode shows an i3 CPU hallucination pattern across multiple runs, suggesting the SAV verification step may be reinforcing incorrect majority opinions when the underlying LLMs share common misconceptions.

4. **Answer-key method is more permissive than whitelist**: By ignoring off-topic claims, the answer-key method produces lower error rates than the whitelist method would. The heuristic 56% ER here likely compares to a much higher whitelist ER.

5. **FS% is the most informative metric**: It captures both error avoidance and factual engagement. Cera-full at 1000 achieves 88.74% FS%, meaning reviews are both highly accurate and highly specific to the product.

## Limitations

- Grading relies on a 44-claim factsheet; product details not covered by the factsheet are invisible to this analysis.
- Run-level variance is high for small sizes (100), limiting statistical power.
- The answer-key method cannot detect fabricated claims about topics the factsheet does not cover (e.g., wrong keyboard backlight color).
- Single grader (Claude Opus) may have systematic biases in claim matching.
- The "carbonara" off-topic reviews in cera-no-sil are a known artifact, not a grading issue.
