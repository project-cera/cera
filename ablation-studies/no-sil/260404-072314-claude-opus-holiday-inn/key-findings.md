# Key Findings: Holiday Inn by IHG — no-SIL Ablation Study

**Study**: no-SIL ablation (answer-key grading method)
**Subject**: Holiday Inn by IHG (hotel domain)
**Date**: 2026-04-04
**Flagger**: Claude Opus (via Claude Code subagents, sequential runs, answer-key method)
**Factsheet**: v3 (54 claims, US-only scope)
**Sizes**: 100, 500, 1000 × 5 runs per mode

## Aggregate Results

| Mode | Size | Reviews | Errors | ER% | VF% | FS% |
|------|------|---------|--------|-----|-----|-----|
| cera-full | 100 | 154 | 5 | 3.25% | 60.39% | 36.90% |
| cera-full | 500 | 756 | 69 | 9.13% | 67.46% | 41.07% |
| cera-full | 1000 | 1478 | 17 | 1.15% | 76.73% | 59.30% |
| cera-sav | 100 | 158 | 0 | 0.00% | 67.72% | 46.57% |
| cera-sav | 500 | 728 | 4 | 0.55% | 62.09% | 39.27% |
| cera-sav | 1000 | 1467 | 3 | 0.20% | 61.90% | 38.37% |
| cera-no-sil | 100 | 154 | 1 | 0.65% | 15.58% | 2.72% |
| cera-no-sil | 500 | 730 | 15 | 2.05% | 12.47% | 1.35% |
| cera-no-sil | 1000 | 1452 | 18 | 1.24% | 15.77% | 2.34% |
| heuristic | 100 | 100 | 10 | 10.00% | 98.00% | 86.25% |
| heuristic | 500 | 500 | 15 | 3.00% | 94.00% | 85.73% |
| heuristic | 1000 | 1000 | 36 | 3.60% | 98.90% | 94.26% |

## Key Observations

### 1. SIL is Critical for Factual Engagement (VF%)

The most striking finding is the dramatic VF% gap between no-SIL and SIL-enabled modes:

- **cera-no-sil**: VF% ranges from 12-16% across all sizes — reviews almost never engage with verifiable Holiday Inn facts
- **cera-sav**: VF% ranges from 62-68% — the SAV (SIL-After-Verify) provides substantial factual grounding
- **cera-full**: VF% ranges from 60-77% — full SIL pipeline shows similar or slightly better engagement than SAV
- **heuristic**: VF% ranges from 94-99% — highest engagement because heuristic reviews are templated around known facts

This confirms that without SIL, the LLM generates generic hotel reviews that lack Holiday Inn-specific details.

### 2. Error Rates Are Low Across All CERA Modes

Under the answer-key method, error rates for CERA modes are notably low:

- **cera-no-sil**: 0.65-2.05% ER — very few errors because the reviews rarely make factsheet-verifiable claims
- **cera-sav**: 0.00-0.55% ER — consistently the lowest error rate among SIL-enabled modes
- **cera-full**: 1.15-9.13% ER — generally low, with moderate variance
- **heuristic**: 3.00-10.00% ER — surprisingly, heuristic has higher error rates than no-SIL due to its aggressive fact inclusion

### 3. FS% (Factual Score) Reveals the Quality Hierarchy

FS% = accuracy × engagement, penalizing modes that avoid facts:

- **heuristic** dominates: 86-94% FS — high engagement + low-moderate errors = best raw factual score
- **cera-sav**: 38-47% FS — decent engagement with very low errors, but VF% ceiling limits FS
- **cera-full**: 37-59% FS — similar to SAV, with larger variance across runs
- **cera-no-sil**: 1-3% FS — near-zero because VF% is so low; the few facts that appear are mostly correct, but the score collapses from lack of engagement

### 4. Holiday Inn Has Fewer Specific Topics Than Other Subjects

With only 20 topic enum entries (all [specific]), Holiday Inn has a smaller factsheet surface area compared to Tesla Diner (88 claims) or Outset Collection. This means:

- Reviews must specifically mention IHG-branded details (Dove toiletries, Kids Stay Free, IHG One Rewards point rates, Open Lobby, H4 design) to register as VF
- Generic hotel amenity mentions (pool, parking, wifi) are [generic] in the factsheet and don't count toward VF

### 5. cera-full 500 Run Variance

Similarly, cera-full 500 run4 shows 26.45% ER while other runs are 0-4.18%. This suggests per-run generation variance rather than systematic issues.

## Per-Size Breakdown

### Size 100
| Mode | Reviews | ER% | VF% | FS% |
|------|---------|-----|-----|-----|
| cera-full | 154 | 3.25% | 60.39% | 36.90% |
| cera-sav | 158 | 0.00% | 67.72% | 46.57% |
| cera-no-sil | 154 | 0.65% | 15.58% | 2.72% |
| heuristic | 100 | 10.00% | 98.00% | 86.25% |

### Size 500
| Mode | Reviews | ER% | VF% | FS% |
|------|---------|-----|-----|-----|
| cera-full | 756 | 9.13% | 67.46% | 41.07% |
| cera-sav | 728 | 0.55% | 62.09% | 39.27% |
| cera-no-sil | 730 | 2.05% | 12.47% | 1.35% |
| heuristic | 500 | 3.00% | 94.00% | 85.73% |

### Size 1000
| Mode | Reviews | ER% | VF% | FS% |
|------|---------|-----|-----|-----|
| cera-full | 1478 | 1.15% | 76.73% | 59.30% |
| cera-sav | 1467 | 0.20% | 61.90% | 38.37% |
| cera-no-sil | 1452 | 1.24% | 15.77% | 2.34% |
| heuristic | 1000 | 3.60% | 98.90% | 94.26% |

## Error Type Distribution

Across all modes, the dominant error types are:
- **wrong_spec**: Specific numbers/names that the factsheet covers but the review gets wrong (e.g., wrong point rates, wrong age limits)
- **hallucinated_feature**: Claims that contradict the "Does NOT Have" section (e.g., claiming complimentary breakfast when it is NOT a brand standard)
- **factual_error**: Direct contradictions of factsheet claims

## Implications for Thesis

1. **SIL is the primary driver of factual specificity**: Without SIL, CERA-generated hotel reviews are indistinguishable from generic LLM output — they mention hotels generically but almost never engage with Holiday Inn-specific facts
2. **Low error rates without SIL are misleading**: cera-no-sil has the lowest ER% because it avoids making verifiable claims, not because it's more accurate. FS% correctly penalizes this avoidance
3. **Heuristic baseline outperforms on FS%**: Heuristic reviews achieve the highest factual scores because they're templated around known facts. However, this comes at the cost of naturalness (not measured here)
4. **SAV provides good factual grounding**: cera-sav achieves ~62-68% VF% compared to cera-full's ~60-77%, suggesting the SAV step alone provides most of the factual engagement benefit

## Limitations

- Answer-key method only checks claims the factsheet covers; off-topic hallucinations are not detected
- Holiday Inn's factsheet has fewer specific claims than restaurant/product domains, which may compress VF% ranges
- Some per-run variance (especially cera-full 500 run4) warrants investigation
- Keyword backfilling for unflagged reviews may under-count VF% for topics with complex or indirect mentions
- Age limit claims (Kids Stay Free / Kids Eat Free) were removed from the factsheet due to source ambiguity, potentially missing a common error category
