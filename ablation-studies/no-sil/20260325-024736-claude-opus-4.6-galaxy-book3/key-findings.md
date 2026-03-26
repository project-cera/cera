# SIL Ablation Study: Key Findings — Galaxy Book3

**Date**: March 25, 2026
**Flagger Model**: Claude Opus 4.6 (via 60 parallel Claude Code subagents)
**Domain**: Laptop (Samsung Galaxy Book3, 2023)
**Factsheet**: 44 verifiable claims across 12 categories
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
| cera-full | 2,347 | 23 | **0.98** | 83.89 | 1.17 |
| cera-sav | 2,291 | 560 | 24.44 | 81.84 | 29.86 |
| cera-no-sil | 2,322 | 334 | 14.38 | 22.61 | 63.60 |
| heuristic | 1,740 | 974 | **55.98** | 97.18 | 57.60 |

**ER%** = Error Rate (flagged reviews with actual errors / total reviews). Excludes vague reviews.
**VF%** = Verifiable Fact density (reviews containing ≥1 verifiable claim, via pattern matching + error-implies-VF rule).
**NER%** = Normalized Error Rate (ER% ÷ VF% × 100). Always ≤ 100% since ER ⊆ VF.

---

## Error Rates by Dataset Size

| Condition | 100-sent | 500-sent | 1000-sent |
|-----------|----------|----------|-----------|
| cera-full | 4.43% | 0.96% | 0.62% |
| cera-sav | 27.52% | 30.18% | 21.16% |
| cera-no-sil | 14.84% | 11.85% | 15.61% |
| heuristic | 56.73% | 60.53% | 53.71% |

Error rates are stable across sizes for all conditions. The cera-full condition shows a slight improvement at larger sizes (4.43% → 0.62%), which may reflect noise from the small sample at 100-sent (only 158 reviews across 5 runs).

---

## VF% (Verifiable Fact Density) by Size

| Condition | 100-sent | 500-sent | 1000-sent | Overall |
|-----------|----------|----------|-----------|---------|
| cera-full | 84.81% | 83.10% | 84.19% | 83.89% |
| cera-sav | 85.23% | 85.05% | 79.83% | 81.84% |
| cera-no-sil | 26.45% | 19.28% | 23.87% | 22.61% |
| heuristic | 97.12% | 97.93% | 96.83% | 97.18% |

The cera-no-sil condition has dramatically lower VF% (~23%) compared to all other conditions (82–97%). Without the SIL providing factual grounding, the generator produces reviews dominated by subjective opinions and vague language rather than specific technical claims. This means fewer reviews contain checkable facts, but those that do are wrong at a much higher rate (NER = 64%).

The heuristic condition has the highest VF% (97%), reflecting its template-driven approach that consistently injects product specifications into every review — but many of those specs are fabricated.

---

## NER (Normalized Error Rate) by Size

| Condition | 100-sent | 500-sent | 1000-sent | Overall |
|-----------|----------|----------|-----------|---------|
| cera-full | 5.22% | 1.16% | 0.74% | 1.17% |
| cera-sav | 32.29% | 35.49% | 26.51% | 29.86% |
| cera-no-sil | 56.11% | 61.46% | 65.40% | 63.60% |
| heuristic | 58.41% | 61.81% | 55.47% | 57.60% |

NER reveals the true accuracy picture. While cera-no-sil has a lower raw ER (14.38%) than heuristic (55.98%), its NER (63.60%) is comparable to heuristic (57.60%). This means that when cera-no-sil reviews do make verifiable claims, those claims are wrong at a similar rate to heuristic reviews. The low raw ER is an artifact of cera-no-sil's tendency to avoid specific claims altogether.

---

## Error Type Distribution

| Error Type | cera-full | cera-sav | cera-no-sil | heuristic |
|------------|-----------|----------|-------------|-----------|
| hallucinated_feature | 3 (13.0%) | 432 (77.1%) | 72 (21.6%) | 601 (61.6%) |
| wrong_spec | 16 (69.6%) | 124 (22.1%) | 247 (74.0%) | 250 (25.6%) |
| factual_error | 4 (17.4%) | 4 (0.7%) | 15 (4.5%) | 124 (12.7%) |
| **Total errors** | **23** | **560** | **334** | **975** |
| vague_review (info only) | 97 | 111 | 75 | 2 |

### Dominant Failure Patterns

| Condition | Primary Error Pattern | Secondary Pattern |
|-----------|----------------------|-------------------|
| **cera-full** | Minor spec rounding (weight ~3 lbs vs 3.46 lbs, display "15-inch" vs 15.6") | Occasional vague reviews (carbonara noise artifacts) |
| **cera-sav** | **Thunderbolt 4 hallucination** (77% of errors) — USB-C ports misattributed as TB4 | Wi-Fi 6E wrong spec (22% of errors) — Wi-Fi 6 upgraded to 6E |
| **cera-no-sil** | Diverse wrong specs: inflated RAM (32GB), wrong display (13.3", AMOLED, 120Hz), wrong battery (12+ hrs) | Galaxy Book3 Pro specs bleeding into base model reviews |
| **heuristic** | **AMOLED display hallucination** (appears in ~50% of all flagged reviews) | Wrong CPU generation (12th/11th Gen instead of 13th Gen), false port denial |

---

## Qualitative Failure Mode Comparison

| Dimension | cera-full | cera-sav | cera-no-sil | heuristic |
|-----------|-----------|----------|-------------|-----------|
| **Error diversity** | Low — mostly rounding | Low — 2 recurring errors (TB4 + Wi-Fi 6E) | High — many different spec categories wrong | Medium — AMOLED dominant, but varied secondary errors |
| **Error severity** | Minor (rounding, vague text) | Moderate (claiming absent connectivity) | Severe (fabricated specs: 32GB RAM, 120Hz OLED, RTX 4050) | Severe (wrong display tech, wrong CPU gen, denied existing ports) |
| **Error consistency** | Sporadic across runs | Highly consistent (same TB4/Wi-Fi6E pattern across all runs) | Variable per review (each review hallucinates different specs) | Highly consistent (AMOLED appears in every run) |
| **Hallucination source** | N/A (near-zero errors) | Plausible upgrade path (USB-C → TB4, Wi-Fi 6 → 6E) | Cross-model confusion (Book3 Pro specs) + fabrication | Template bias (AMOLED is Samsung's flagship display tech) |

---

## Implications for the SIL Component

### SIL is the critical factual grounding mechanism

The data conclusively demonstrates that the SIL (Subject Intelligence Layer) is the single most impactful component for factual accuracy in CERA-generated reviews:

1. **57× error reduction**: cera-full (0.98% ER) vs. heuristic (55.98% ER) represents a 57× improvement in raw error rate.

2. **SIL alone accounts for most accuracy**: Comparing cera-full (0.98% ER) to cera-no-sil (14.38% ER) shows the SIL reduces errors by ~15×, while comparing cera-no-sil to heuristic shows the remaining CERA pipeline components (RGM, ACM, AML) contribute a ~4× reduction.

3. **SAV is not a substitute for SIL**: The cera-sav condition (24.44% ER) performs worse than cera-no-sil (14.38% ER) in raw terms, though better in NER (29.86% vs 63.60%). SAV's post-generation verification catches some errors but introduces its own systematic hallucination pattern (Thunderbolt 4 + Wi-Fi 6E). This suggests SAV may be amplifying certain LLM biases rather than correcting them.

4. **Without SIL, error types shift from rounding to fabrication**: cera-full errors are minor rounding issues (3 lbs vs 3.46 lbs). Without SIL, errors become wholesale fabrications (32GB RAM, OLED display, RTX 4050 GPU) that would immediately undermine credibility with real consumers.

5. **VF% reveals a defensive strategy**: The cera-no-sil condition's low VF% (~23%) suggests that without factual grounding, the LLM defaults to generating opinion-heavy, vague reviews as a "safe" strategy. This is a rational response from the model — by avoiding specific claims, it avoids being wrong — but produces reviews that fail the realism test (real reviews contain specific specs).

### The heuristic baseline's VF%/ER paradox

The heuristic condition has the highest VF% (97%) and the highest ER (56%). This combination reveals the template-driven approach's fundamental weakness: it reliably injects specific claims into every review, but without factual grounding, those claims are wrong over half the time. The result is a dataset that is information-dense but factually unreliable — the worst possible outcome for downstream applications like aspect-based sentiment analysis.

---

## Study Limitations

1. **Single domain**: Only the laptop domain (Galaxy Book3) was tested. Error patterns may differ for restaurants, hotels, or other product categories where specs are less precisely defined.

2. **Single generation LLM**: All reviews were generated by Qwen 3.5 35B A3B. Different LLMs may have different baseline hallucination rates and error patterns.

3. **Flagger bias**: Claude Opus 4.6 was used as the flagger model. Its interpretation of borderline cases (e.g., "$999" vs. "$999.99", "15-inch" vs. "15.6-inch") may differ from human annotators.

4. **VF% methodology**: Pattern matching for verifiable facts may undercount reviews with natural-language spec descriptions (e.g., "reasonably fast processor" references a spec without triggering pattern matches). The low VF% for cera-no-sil may partially reflect this limitation.

5. **Spec ambiguity**: Some claims fall in gray areas — the Galaxy Book3 comes in multiple configurations (i5/8GB/256GB vs. i7/16GB/512GB), and the factsheet does not always distinguish which configuration a spec belongs to.

6. **Run variance**: While 5 runs provide some stability, per-run error rates vary (e.g., cera-full s100 ranges from 0% to 18.75% across runs due to small sample sizes).

---

## Raw Data Paths

- **Report directory**: `public-subtrees/cera/ablation-studies/no-sil/20260325-024736-claude-opus-4.6-galaxy-book3/`
- **Per-dataset flags**: `datasets/laptop/{mode}/{size}-sent.json`
- **Source JSONL files**:
  - cera-full: `public-subtrees/cera/jobs/260325-000243012-r5silab-galaxybook3-cera-full/`
  - cera-sav: `public-subtrees/cera/jobs/260325-000148961-r5silab-galaxybook3-cera-sav/`
  - cera-no-sil: `public-subtrees/cera/jobs/260325-000037124-r5silab-galaxybook3-cera-nosil/`
  - heuristic: `public-subtrees/cera/jobs/260324-223328196-r5silab-galaxybook3-heuristic/`
