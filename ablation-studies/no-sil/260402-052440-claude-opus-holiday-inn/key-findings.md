# Key Findings: Holiday Inn by IHG — Answer-Key Grading

**Study**: no-SIL ablation | **Domain**: hotel | **Subject**: Holiday Inn by IHG
**Date**: April 2, 2026 | **Grading method**: answer-key
**Flagger**: claude-opus (Claude Code subagents, sequential runs)
**Factsheet**: v3, 56 claims (22 specific topics in enum), US-only scope

---

## Aggregate Results

| Mode | Size | Reviews | Errors | ER% | VF% | FS% |
|------|------|---------|--------|-----|-----|-----|
| cera-full | 100 | 142 | 53 | 37.32% | 80.28% | 50.10% |
| cera-full | 500 | 738 | 154 | 20.87% | 79.95% | 56.60% |
| cera-full | 1000 | 1478 | 518 | 35.05% | 80.31% | 50.56% |
| cera-sav | 100 | 147 | 45 | 30.61% | 63.95% | 33.97% |
| cera-sav | 500 | 751 | 211 | 28.10% | 71.24% | 42.21% |
| cera-sav | 1000 | 1454 | 621 | 42.71% | 77.92% | 44.12% |
| cera-no-sil | 100 | 153 | 2 | 1.31% | 12.42% | 1.48% |
| cera-no-sil | 500 | 715 | 11 | 1.54% | 9.37% | 0.76% |
| cera-no-sil | 1000 | 1460 | 13 | 0.89% | 25.14% | 6.20% |
| heuristic | 100 | 100 | 11 | 11.00% | 99.00% | 87.15% |
| heuristic | 500 | 500 | 14 | 2.80% | 98.80% | 94.85% |
| heuristic | 1000 | 1000 | 37 | 3.70% | 99.90% | 96.15% |

## Key Observations

### 1. SIL Drives Factsheet Engagement (VF%)
Without SIL, VF% drops from 64-100% to 9-25%. The Subject Intelligence Layer determines whether reviews engage with verifiable, subject-specific attributes. This is the study's clearest signal: SIL is necessary for factually grounded review generation.

### 2. CERA-Full and CERA-SAV Show High ER% from Systematic wrong_spec Errors
Both SIL-enabled CERA modes suffer from a consistent pattern: the LLM gets kids program age limits wrong across composition runs. Kids Stay Free is stated as "19 and under" (correct: 18) and Kids Eat Free as "12 and under" (correct: 11). This is a single-source error that propagates through all reviews in affected runs, inflating ER% to 20-43%. Some runs (e.g., cera-full-500-run2, run3) have zero errors, showing the issue is compositional variance, not systematic.

### 3. No-SIL Has Lowest ER% but Lowest FS%
The no-SIL condition achieves very low error rates (0.89-1.54%) because it makes almost no verifiable claims. The few errors are "complimentary breakfast" (factual_error) and "concierge service" (hallucinated_feature). However, low VF% collapses FS% to near-zero (0.76-6.20%), confirming that avoiding errors by avoiding facts is not useful for synthetic review generation.

### 4. Heuristic Achieves Highest FS% via Template-Driven Coverage
Heuristic maintains the best FS% (87-96%) because hardcoded templates guarantee near-100% VF% with low ER%. Its only error pattern is occasionally claiming "complimentary breakfast" (Holiday Inn does not include breakfast, unlike Holiday Inn Express).

### 5. Per-Run Variance is High in SIL-Enabled Modes
Within cera-full-1000, error rates range from 0% (run 2) to 76.7% (run 4). This variance stems from composition-scoped runs: each run uses a different SIL composition, and some compositions contain the wrong age limits while others are correct. This suggests SIL accuracy is the primary quality lever, and MAV verification may not be catching these near-miss errors.

## Error Type Distribution

| Error Type | cera-full | cera-sav | cera-no-sil | heuristic |
|------------|-----------|----------|-------------|-----------|
| wrong_spec | 710 | 610 | 0 | 1 |
| factual_error | 11 | 8 | 22 | 47 |
| hallucinated_feature | 3 | 0 | 4 | 0 |
| timeline_error | 0 | 0 | 0 | 0 |
| vague_review | 96 | 6 | 8 | 0 |

**Dominant error**: `wrong_spec` accounts for 97% of errors in cera-full and cera-sav, driven entirely by kids program age limit off-by-one errors. In contrast, heuristic and no-SIL errors are predominantly `factual_error` (free breakfast claims).

## Qualitative Failure Modes

1. **Kids age propagation** (cera-full, cera-sav): SIL retrieves age limits that are off by one year (19 vs 18 for stay-free, 12 vs 11 for eat-free). Once embedded in the composition context, every review in that run repeats the error.

2. **Elite tier inflation** (cera-full run 3, run 4): Some compositions claim 5 elite tiers instead of 4, adding a fictional "Club" tier. This appears in runs where the SIL context included outdated or incorrect tier information.

3. **Complimentary breakfast** (heuristic, no-SIL): The most common error across non-SIL modes. The LLM defaults to claiming free breakfast because it is a common hotel amenity, despite Holiday Inn specifically NOT offering it (unlike Holiday Inn Express).

4. **Concierge hallucination** (no-SIL): Without SIL grounding, the LLM occasionally attributes luxury amenities (concierge, spa) to Holiday Inn, which the factsheet explicitly excludes.

## Implications for Thesis

1. **SIL is necessary for factual engagement**: VF% gap (64-100% vs 9-25%) confirms the SIL's role in anchoring reviews to verifiable attributes.

2. **SIL accuracy is the quality bottleneck**: The high ER% in cera-full and cera-sav is not a generation problem but a composition problem. Fixing the near-miss age limits in SIL retrieval would collapse ER% to near-zero in those conditions.

3. **FS% captures the tradeoff correctly**: The VF-adjusted factual score penalizes no-SIL for avoiding claims and penalizes SIL modes for getting claims wrong. Heuristic achieves the best FS% because its hardcoded facts are correct and comprehensive.

4. **MAV gap**: MAV verification (present in cera-full, absent in cera-sav) does not appear to catch the systematic kids-age errors, suggesting MAV may not verify numerical precision in contextual claims. This is an important finding for RQ2.

## Limitations

- Error rates for cera-full and cera-sav are dominated by a single systematic error (kids age limits), making aggregate ER% sensitive to this one issue.
- The answer-key method only evaluates claims the factsheet covers; it cannot assess the quality or diversity of off-topic claims.
- Heuristic FS% benefits from template-driven topic injection that guarantees factsheet coverage, a design advantage not available to LLM-driven modes.
- VF% backfilling uses keyword regex, which may miss some topic engagements expressed with unusual phrasing.
