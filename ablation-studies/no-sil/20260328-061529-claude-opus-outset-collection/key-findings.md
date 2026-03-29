# Key Findings: Outset Collection by Hilton — no-SIL Ablation
## v2 Factsheet + Answer-Key + Generic Filtering + Error-Implies-VF

| Field | Value |
|-------|-------|
| Date | March 28, 2026 |
| Grading | Answer-key, generic filtering, error-implies-VF guarantee |
| Factsheet | v2 (75 claims: 56 specific, 19 generic) |
| Flagger | Claude Opus 4.6 (12 parallel subagents) |
| Domain | Hotel (Slackline Moab + ACME Chicago) |
| Sizes | 100, 500, 1000 sentences x 5 runs |

## Aggregate Results

| Mode | Reviews | Errors | ER% | VF% | FS% |
|------|---------|--------|-----|-----|-----|
| cera-full | 2334 | 702 | 30.08% | 74.25% | 44.17% |
| cera-sav | 2366 | 628 | 26.54% | 65.17% | 38.63% |
| cera-no-sil | 2257 | 48 | 2.13% | 9.61% | 7.48% |
| heuristic | 1600 | 90 | 5.63% | 8.25% | 2.62% |

## FS% Ranking

| Rank | Mode | FS% | Interpretation |
|------|------|-----|---------------|
| 1 | cera-full | 44.17% | Highest factual density; errors from SIL context variance |
| 2 | cera-sav | 38.63% | High engagement, moderate errors from single-agent SIL |
| 3 | cera-no-sil | 7.48% | Near-zero subject knowledge; few errors, few facts |
| 4 | heuristic | 2.62% | Generic hotel prose; almost no subject-specific content |

## Per-Size ER% / VF% / FS%

| Size | Mode | ER% | VF% | FS% |
|------|------|-----|-----|-----|
| 100 | cera-full | 17.12% | 76.71% | 59.59% |
| 100 | cera-sav | 26.06% | 63.38% | 37.32% |
| 100 | cera-no-sil | 0.00% | 0.00% | 0.00% |
| 100 | heuristic | 1.00% | 4.00% | 3.00% |
| 500 | cera-full | 32.97% | 58.48% | 25.51% |
| 500 | cera-sav | 26.92% | 65.38% | 38.46% |
| 500 | cera-no-sil | 2.76% | 3.73% | 0.97% |
| 500 | heuristic | 7.20% | 15.00% | 7.80% |
| 1000 | cera-full | 29.91% | 82.01% | 52.10% |
| 1000 | cera-sav | 26.40% | 65.24% | 38.84% |
| 1000 | cera-no-sil | 2.00% | 13.60% | 11.60% |
| 1000 | heuristic | 5.30% | 5.30% | 0.00% |

## Key Takeaways

1. **SIL is essential**: cera-full (74% VF) and cera-sav (65% VF) vs cera-no-sil (10% VF) and heuristic (8% VF). Without SIL, the LLM produces no subject-specific content.
2. **cera-full leads FS%** at 44% — the MAV component in cera-full produces higher factsheet engagement than cera-sav, outweighing its slightly higher ER%.
3. **Per-run variance is extreme**: cera-sav ranges from 0% to 82% ER depending on SIL context quality. SIL retrieval reliability is the bottleneck.
4. **v2 factsheet catches more**: With 75 claims (rates, room configs, menus, pet fees), we detect errors v1 missed — wrong mattress types, parking prices, speaker brands.
5. **Heuristic is empty, not accurate**: 5.6% ER sounds low, but 8.3% VF means 92% of reviews say nothing subject-specific. FS% of 2.6% correctly penalizes this.
6. **ER ≤ VF guaranteed**: Error-implies-VF rule ensures FS% ≥ 0 for all conditions.

## Raw Data: `/home/kap/GitHub/cera-private-monorepo/public-subtrees/cera/ablation-studies/no-sil/20260328-061529-claude-opus-outset-collection/`
