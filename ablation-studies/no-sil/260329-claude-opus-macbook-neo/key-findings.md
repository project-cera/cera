# Key Findings: MacBook Neo no-SIL Ablation Study

**Date:** March 29, 2026
**Method:** Answer-key grading (only flag contradictions with factsheet; ignore off-topic claims)
**Flagger model:** Claude Opus (via Claude Code subagents)
**Domain:** Laptop
**Factsheet:** 33 checkable claims, 21 topic IDs (all specific)
**Sizes:** 100, 500, 1000 (5 runs each)

---

## Aggregate Results

| Mode | Reviews | Errors | Vague | ER% | VF% | FS% |
|------|---------|--------|-------|-----|-----|-----|
| cera-full | 2,306 | 179 | 68 | 7.76% | 91.33% | 87.36% |
| cera-sav | 2,325 | 103 | 85 | 4.43% | 89.42% | 87.18% |
| cera-no-sil | 2,312 | 635 | 184 | 27.47% | 30.62% | 7.67% |
| heuristic | 1,856 | 1,760 | 33 | 94.83% | 97.95% | 8.19% |

## Per-Size Breakdown

### Size 100

| Mode | Reviews | Errors | ER% | VF% | FS% |
|------|---------|--------|-----|-----|-----|
| cera-full | 151 | 10 | 6.62% | 90.07% | 86.43% |
| cera-sav | 145 | 6 | 4.14% | 93.10% | 91.03% |
| cera-no-sil | 156 | 45 | 28.85% | 32.05% | 8.33% |
| heuristic | 106 | 105 | 99.06% | 99.06% | 5.66% |

### Size 500

| Mode | Reviews | Errors | ER% | VF% | FS% |
|------|---------|--------|-----|-----|-----|
| cera-full | 703 | 60 | 8.53% | 92.32% | 87.84% |
| cera-sav | 707 | 36 | 5.09% | 91.94% | 89.32% |
| cera-no-sil | 732 | 198 | 27.05% | 29.92% | 8.68% |
| heuristic | 582 | 551 | 94.67% | 98.45% | 9.27% |

### Size 1000

| Mode | Reviews | Errors | ER% | VF% | FS% |
|------|---------|--------|-----|-----|-----|
| cera-full | 1,452 | 109 | 7.51% | 90.98% | 87.23% |
| cera-sav | 1,473 | 61 | 4.14% | 87.85% | 85.78% |
| cera-no-sil | 1,424 | 392 | 27.53% | 30.83% | 7.09% |
| heuristic | 1,168 | 1,104 | 94.52% | 97.60% | 7.87% |

## Per-Run Variance

**cera-full:** Error rates range from 0.00% (cleanest runs) to ~20% (runs with systematic 218 PPI wrong_spec). High variance across runs driven by whether the SIL retrieves the exact PPI value (219 vs 218).

**cera-sav:** Error rates range from 0.00% to ~13%. The dominant error is Wi-Fi 7 (should be Wi-Fi 6E) appearing systematically in some runs but not others.

**cera-no-sil:** Consistently high error rates (21-38%) across all runs. Run 1 at size 100 is an outlier with generation failures (empty SIL context causing broken output). Otherwise steady.

**heuristic:** Near-100% error rate across all runs with minimal variance. The most stable (and worst) performer.

## Error Type Distribution

### cera-full
- **wrong_spec (218 PPI):** Dominant error. The SIL retrieved 218 instead of 219 PPI in certain composition runs, causing systematic propagation across all reviews in those runs.
- **wrong_spec (USB-C count):** Rare. A few reviews claimed a single USB-C port instead of two.
- **hallucinated_feature (fan noise):** Very rare. 2-3 reviews described fan behavior on a fanless device.

### cera-sav
- **wrong_spec (Wi-Fi 7):** Dominant error in runs 1-2. Reviews consistently said Wi-Fi 7 instead of Wi-Fi 6E, suggesting the SAV context contained a wrong wireless standard.
- **wrong_spec (Bluetooth 5.3):** Occasional companion to Wi-Fi 7 errors.
- **wrong_spec (price):** Rare. One review cited $999 instead of $599.
- **timeline_error:** One instance of "after a month" when only 18 days had passed.

### cera-no-sil
- **hallucinated_feature (M-series chips):** The most common error by far. Without SIL, the LLM defaults to familiar MacBook chips (M3, M4, M5 variants) instead of the novel A18 Pro.
- **wrong_spec (RAM):** Very frequent. Reviews claim 16-32 GB instead of 8 GB.
- **wrong_spec (display size):** Common. Reviews claim 14-16 inches instead of 13.
- **wrong_spec (price):** Common. Reviews cite $1,200-$2,500 instead of $599.
- **hallucinated_feature (fan/cooling):** Frequent. Reviews describe fan noise on a fanless device.

### heuristic
- **hallucinated_feature (M-series chips):** Nearly universal. ~95% of reviews claim M4/M5 variants.
- **wrong_spec (RAM, price, display, storage):** Pervasive across all runs with wildly inflated values.
- **hallucinated_feature (Thunderbolt/MagSafe):** Frequent. Many reviews claim ports that do not exist.

## Qualitative Failure Modes

1. **Parametric knowledge override (no-SIL + heuristic):** Without factual grounding from SIL, the LLM relies on its parametric knowledge of MacBooks. Since the MacBook Neo is a novel product (A18 Pro chip, $599, 8 GB RAM), the LLM's priors from MacBook Pro/Air training data produce systematic hallucinations. This is the most striking finding: the MacBook Neo's specifications are so atypical for a Mac that ungrounded generation fails catastrophically.

2. **SIL retrieval precision (cera-full):** The 218 vs 219 PPI error demonstrates that SIL retrieval can be precise but not perfectly accurate. A single digit off in a retrieved fact propagates across all reviews in that composition run, creating run-level variance.

3. **SAV wireless standard error (cera-sav):** The Wi-Fi 7 vs Wi-Fi 6E error in cera-sav suggests that the SAV (SIL-alternative verification) source contained an incorrect wireless standard, likely from a speculative pre-release article.

4. **Generation collapse (no-SIL run 1, size 100):** One run produced mostly broken reviews with error messages like "Verified facts section was empty" and a carbonara food review, indicating complete generation failure without SIL context.

## Implications for Thesis

1. **SIL is essential for novel products:** The MacBook Neo results provide the strongest evidence yet for SIL's value. Because the product's specifications diverge from typical MacBook patterns, ungrounded generation (no-SIL, heuristic) fails catastrophically with 27-95% error rates. SIL-grounded modes (cera-full, cera-sav) achieve 4-8% error rates.

2. **FS% tells the story:** Both cera-full (87.36%) and cera-sav (87.18%) achieve nearly identical FS%, while cera-no-sil (7.67%) and heuristic (8.19%) collapse to single digits. This ~80 percentage point gap is the largest observed across all subjects in the ablation study.

3. **Heuristic's paradox:** Heuristic mode achieves the highest VF% (97.95%) because nearly every review makes factsheet-covered claims, but nearly all of them are wrong. This validates that VF% alone is insufficient without error rate correction (FS%).

4. **Error patterns are domain-specific:** Unlike hotel reviews where errors tend to be about amenities and pricing, laptop reviews hallucinate about chips, RAM, and ports. The MacBook Neo's unique A18 Pro chip (instead of M-series) makes it a particularly effective test case for detecting parametric knowledge reliance.

## Limitations

- The 218 PPI systematic error in cera-full inflates its error rate. Without this single off-by-one SIL retrieval error, cera-full would likely show <3% error rate.
- Heuristic mode uses the same LLM (Qwen3.5-35B-A3B) but with a generic prompt template rather than CERA's structured composition. The extreme error rate difference between heuristic and no-SIL modes suggests the CERA prompt structure (RGM personas, ACM attributes) provides some grounding even without SIL facts.
- The MacBook Neo is a very recent product (March 2026) that may not be well-represented in the LLM's training data, making this a worst-case scenario for ungrounded generation.
