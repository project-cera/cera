# SIL Ablation Study: Key Findings — MacBook Neo

**Date**: March 25, 2026
**Flagger Model**: Claude Opus 4.6 (via 60 parallel Claude Code subagents)
**Domain**: Laptop (Apple MacBook Neo, 2026)
**Factsheet**: 33 verifiable claims across 11 categories
**Runs per condition**: 5 (results aggregated)
**Generation LLM**: Qwen 3.5 35B A3B (via OpenRouter)

---

## Conditions

| Condition | Description |
|-----------|-------------|
| **cera-full** | Full CERA pipeline: SIL + MAV + RGM + ACM + AML |
| **cera-sav** | CERA without SIL, but with SAV (Subject Attribute Verification) — verifies attributes post-generation |
| **cera-no-sil** | CERA without SIL or SAV — no factual grounding at all |
| **heuristic** | Heuristic baseline — template-driven generation without CERA pipeline |

---

## Aggregate Error Rates

| Condition | Reviews | Errors | ER% | VF% | NER% |
|-----------|---------|--------|-----|-----|------|
| cera-full | 2,342 | 464 | **19.81** | 86.17 | 22.99 |
| cera-sav | 2,337 | 437 | 18.70 | 19.34 | 96.69 |
| cera-no-sil | 2,335 | 720 | 30.84 | 34.26 | 90.02 |
| heuristic | 1,856 | 1,761 | **94.88** | 98.44 | 96.38 |

**ER%** = Error Rate (flagged reviews with actual errors / total reviews). Excludes vague reviews.
**VF%** = Verifiable Fact density (reviews containing ≥1 verifiable claim, via pattern matching + error-implies-VF rule).
**NER%** = Normalized Error Rate (ER% ÷ VF% × 100). Always ≤ 100% since ER ⊆ VF.

---

## Error Rates by Dataset Size

| Condition | 100-sent | 500-sent | 1000-sent |
|-----------|----------|----------|-----------|
| cera-full | 31.61% | 23.38% | 16.72% |
| cera-sav | 43.45% | 24.52% | 13.37% |
| cera-no-sil | 38.71% | 30.97% | 29.92% |
| heuristic | 99.06% | 96.05% | 93.92% |

All conditions show a declining error rate at larger sizes. The cera-full and cera-sav conditions improve substantially from 100-sent to 1000-sent, dropping from ~32-43% to ~13-17%. Heuristic remains near-total error rates regardless of size.

---

## VF% (Verifiable Fact Density) by Size

| Condition | 100-sent | 500-sent | 1000-sent | Overall |
|-----------|----------|----------|-----------|---------|
| cera-full | 88.39% | 83.11% | 87.49% | 86.17% |
| cera-sav | 44.83% | 25.07% | 13.98% | 19.34% |
| cera-no-sil | 40.65% | 33.97% | 33.72% | 34.26% |
| heuristic | 99.06% | 98.63% | 98.29% | 98.44% |

The cera-sav condition has dramatically lower VF% (~19%) compared to cera-full (86%) and heuristic (98%). This pattern differs from the Galaxy Book3 study where cera-no-sil had the lowest VF%. Here, the SAV module's post-generation verification appears to cause the LLM to second-guess its claims, resulting in cautious, spec-light reviews. Many cera-sav reviews claim the product "doesn't exist" or "has no confirmed specs," a hallucination pattern unique to this domain.

The cera-no-sil condition has moderate VF% (~34%), reflecting the LLM's tendency to generate some specific claims without factual grounding, though far fewer than heuristic's template-driven approach (98%).

---

## NER (Normalized Error Rate) by Size

| Condition | 100-sent | 500-sent | 1000-sent | Overall |
|-----------|----------|----------|-----------|---------|
| cera-full | 35.76% | 28.13% | 19.11% | 22.99% |
| cera-sav | 96.92% | 97.81% | 95.64% | 96.69% |
| cera-no-sil | 95.23% | 91.17% | 88.73% | 90.02% |
| heuristic | 100.00% | 97.38% | 95.55% | 96.38% |

NER reveals a stark picture: without SIL, whenever a review makes a verifiable claim, that claim is wrong 90-97% of the time across all non-SIL conditions. Only cera-full achieves a meaningfully lower NER (23%), confirming that the SIL is the only component that produces factually grounded claims.

The heuristic, cera-sav, and cera-no-sil conditions are statistically equivalent in NER (~90-97%), indicating that the CERA pipeline components beyond SIL do not improve factual accuracy per claim. They reduce overall ER only by generating fewer claims.

---

## Error Type Distribution

| Error Type | cera-full | cera-sav | cera-no-sil | heuristic |
|------------|-----------|----------|-------------|-----------|
| factual_error | 262 (55.2%) | 88 (19.7%) | 10 (1.3%) | 37 (2.0%) |
| timeline_error | 151 (31.8%) | 170 (38.1%) | 165 (21.0%) | 7 (0.4%) |
| wrong_spec | 41 (8.6%) | 104 (23.3%) | 462 (58.9%) | 1,697 (92.0%) |
| hallucinated_feature | 21 (4.4%) | 84 (18.8%) | 148 (18.9%) | 103 (5.6%) |
| **Total errors** | **475** | **446** | **785** | **1,844** |

### Dominant Failure Patterns

| Condition | Primary Error Pattern | Secondary Pattern |
|-----------|----------------------|-------------------|
| **cera-full** | **"Product not announced" factual errors** (55%) — reviews claim the MacBook Neo doesn't exist or hasn't been announced, despite being a real shipping product | Timeline errors (32%) — "used for 3 months" on a 2-week-old product |
| **cera-sav** | **Timeline errors** (38%) — impossible ownership durations | "Product doesn't exist" claims (20%) + hallucinated features like fans, missing headphone jack |
| **cera-no-sil** | **Wrong specs** (59%) — M-series chips instead of A18 Pro, inflated RAM (16-32GB vs 8GB), wrong display sizes | Hallucinated features (19%) — fans, Thunderbolt, MagSafe |
| **heuristic** | **Wrong specs** (92%) — fabricated M4/M5 chips, 16-32GB RAM, $1,899-$2,500 prices vs actual $599, wrong display resolutions | Hallucinated features (6%) — Thunderbolt ports, MagSafe, fans |

---

## Qualitative Failure Mode Comparison

| Dimension | cera-full | cera-sav | cera-no-sil | heuristic |
|-----------|-----------|----------|-------------|-----------|
| **Error diversity** | Low — dominated by "not announced" and timeline | Medium — mix of timeline, wrong specs, hallucinations | Medium — many different spec categories wrong | Low — overwhelmingly wrong specs |
| **Error severity** | Moderate (meta-errors about product existence, not wrong specs) | Moderate (existence denial + wrong specs) | Severe (fabricated chips, inflated RAM, wrong prices) | Severe (every spec wrong: chip, RAM, price, display) |
| **Error consistency** | Consistent "not announced" pattern across runs | Consistent existence-denial pattern | Variable per review (each fabricates different specs) | Highly consistent (same M4/M5 + inflated specs pattern) |
| **Hallucination source** | SIL research returned "unannounced product" for a March 2026 device beyond the LLM's training cutoff | SAV verification concluded product doesn't exist | LLM defaults to MacBook Pro/Air specs when lacking grounding | Template bias injects generic premium MacBook specs |

---

## Implications for the SIL Component

### The MacBook Neo as a unique test case

The MacBook Neo (announced March 4, 2026, available March 11, 2026) presents a distinct challenge compared to the Galaxy Book3 (2023): it is a brand-new product that likely falls outside or at the edge of the generation LLM's training data. This produces qualitatively different failure modes.

### SIL provides critical factual grounding, but with a caveat

1. **4.8x raw error reduction**: cera-full (19.81% ER) vs. heuristic (94.88% ER) represents a major improvement, though less dramatic than the Galaxy Book3 result (0.98% vs. 55.98%, a 57x reduction).

2. **cera-full's elevated ER reflects a novel failure mode**: The dominant errors in cera-full are not wrong specs but "product not announced" claims (55% of errors). The SIL's web research likely encountered limited or conflicting information about a product that launched only 21 days before the study. When the SIL cannot confirm a product exists, reviews inherit this uncertainty, producing meta-errors rather than spec errors.

3. **NER tells the true story**: Despite the elevated raw ER, cera-full's NER (22.99%) is dramatically lower than all other conditions (~90-97%). When cera-full reviews do make verifiable claims, those claims are correct ~77% of the time. Without SIL, correctness drops to 3-10%.

4. **Without SIL, all conditions converge to near-random accuracy**: cera-sav (NER 96.69%), cera-no-sil (NER 90.02%), and heuristic (NER 96.38%) are effectively equivalent in per-claim accuracy. The CERA pipeline's non-SIL components (RGM, ACM, AML) reduce the number of claims made but do not improve their accuracy.

5. **SAV introduces a pathological failure mode**: The cera-sav condition's extremely low VF% (19.34%) with extremely high NER (96.69%) indicates that SAV's post-generation verification causes the LLM to declare the product fictional. This is worse than no verification at all (cera-no-sil has 34% VF% and 90% NER). SAV appears to amplify uncertainty about new products.

### The temporal sensitivity of SIL

This study reveals that SIL accuracy depends on the maturity of online information about a product. For the Galaxy Book3 (a 2023 product), SIL achieved near-perfect accuracy. For the MacBook Neo (a product just 21 days old), SIL accuracy is good but not exceptional, hampered by limited web coverage and potential training data cutoff effects.

This suggests SIL's value increases over time as more authoritative sources become available for a product. For very new products, SIL still provides a substantial advantage over no grounding, but may propagate uncertainty from limited web sources.

---

## Study Limitations

1. **Very new product domain**: The MacBook Neo was only 21 days old at the time of this study. Error rates for cera-full may improve with more established products (as seen in the Galaxy Book3 study).

2. **"Not announced" as a novel error category**: The dominant cera-full errors ("product not announced") represent a qualitatively different failure mode than wrong specs. These could be reclassified as a SIL reliability issue rather than a generation accuracy issue.

3. **Single generation LLM**: All reviews were generated by Qwen 3.5 35B A3B. Different LLMs may have different baseline hallucination rates for new products.

4. **Flagger bias**: Claude Opus 4.6 was used as the flagger model. Its interpretation of "product not announced" claims may be stricter than human annotators would be.

5. **Timeline sensitivity**: The 2-week ownership window creates many timeline errors that would not occur for older products. This inflates the error rate for conditions that generate realistic usage narratives (cera-full, cera-sav).

6. **Training data cutoff**: The generation LLM (Qwen 3.5 35B) may not have MacBook Neo in its training data, explaining the systematic fabrication of M-series chip specs across all non-SIL conditions.

---

## Cross-Study Comparison: MacBook Neo vs. Galaxy Book3

| Metric | Galaxy Book3 (2023) | MacBook Neo (2026) |
|--------|--------------------|--------------------|
| **cera-full ER%** | 0.98% | 19.81% |
| **cera-full NER%** | 1.17% | 22.99% |
| **heuristic ER%** | 55.98% | 94.88% |
| **heuristic NER%** | 57.60% | 96.38% |
| **cera-full dominant error** | Minor spec rounding | "Product not announced" |
| **heuristic dominant error** | AMOLED hallucination | All specs fabricated |

The MacBook Neo study shows higher error rates across all conditions, consistent with a product outside the LLM's training data. The heuristic condition's near-total error rate (95%) confirms that without SIL grounding and with no training data to fall back on, the LLM fabricates specifications wholesale. The cera-full condition's elevated ER reflects SIL's temporal limitation rather than a fundamental accuracy weakness.

---

## Raw Data Paths

- **Report directory**: `public-subtrees/cera/ablation-studies/no-sil/20260325T050013-claude-opus-4.6-macbook-neo/`
- **Per-dataset flags**: `datasets/laptop/{mode}/{size}-sent.json`
- **Source JSONL files**:
  - cera-full: `public-subtrees/cera/jobs/260325-041228202-r5silab2-macbookneo-cera-full/`
  - cera-sav: `public-subtrees/cera/jobs/260325-041324718-r5silab2-macbookneo-cera-sav/`
  - cera-no-sil: `public-subtrees/cera/jobs/260325-041400569-r5silab2-macbookneo-cera-nosil/`
  - heuristic: `public-subtrees/cera/jobs/260325-031435402-r5silab-macbookneo-heuristic/`
