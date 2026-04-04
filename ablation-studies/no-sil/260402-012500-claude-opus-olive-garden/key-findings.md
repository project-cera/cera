# Key Findings: Olive Garden — Answer-Key Grading

**Study**: no-SIL ablation (answer-key method)
**Subject**: Olive Garden (Italian-American casual dining chain)
**Date**: 2026-04-02
**Flagger**: Claude Opus (via Claude Code subagents, sequential runs per mode+size)
**Grading method**: Answer-key — only flags claims that contradict factsheet entries; ignores claims about topics the factsheet doesn't cover.
**Factsheet**: 62 checkable claims across 17 topic areas (all [specific] in topic enum, 52 topics)

## Aggregate Results

| Mode | Size | Reviews | Errors | ER% | Vague | VF% | UR% | FS% |
|------|------|---------|--------|-----|-------|-----|-----|-----|
| cera-full | 100 | 143 | 35 | 24.48% | 6 | 94.41% | 5.59% | 77.24% |
| cera-full | 500 | 725 | 135 | 18.62% | 12 | 95.17% | 4.83% | 81.72% |
| cera-full | 1000 | 1406 | 24 | 1.71% | 25 | 94.88% | 5.12% | 89.18% |
| cera-sav | 100 | 157 | 24 | 15.29% | 8 | 81.53% | 18.47% | 59.72% |
| cera-sav | 500 | 762 | 12 | 1.57% | 33 | 85.30% | 14.70% | 71.87% |
| cera-sav | 1000 | 1524 | 46 | 3.02% | 166 | 79.33% | 20.67% | 61.66% |
| cera-no-sil | 100 | 145 | 8 | 5.52% | 10 | 55.86% | 44.14% | 29.28% |
| cera-no-sil | 500 | 716 | 22 | 3.07% | 54 | 55.59% | 44.41% | 29.97% |
| cera-no-sil | 1000 | 1445 | 45 | 3.11% | 102 | 78.89% | 21.11% | 60.66% |
| heuristic | 100 | 105 | 8 | 7.62% | 2 | 98.10% | 1.90% | 90.62% |
| heuristic | 500 | 524 | 45 | 8.59% | 0 | 98.47% | 1.53% | 89.92% |
| heuristic | 1000 | 1029 | 148 | 14.38% | 1 | 98.54% | 1.46% | 86.48% |

## Per-Size Breakdown

### 100-sent
- **cera-full** has the highest ER% (24.48%) but also the highest VF% (94.41%) among CERA modes, yielding FS% 77.24%.
- **cera-no-sil** has the lowest ER% (5.52%) among CERA modes but extremely low VF% (55.86%) — reviews avoid factsheet topics, resulting in FS% 29.28%.
- **heuristic** achieves the best balance: moderate ER% (7.62%) with near-perfect VF% (98.10%) for FS% 90.62%.
- **cera-sav** sits in between with ER% 15.29% and VF% 81.53%.

### 500-sent
- **cera-full** still leads CERA modes in FS% (81.72%) despite high ER% (18.62%).
- **cera-sav** achieves very low ER% (1.57%) but VF% drops to 85.30%, yielding FS% 71.87%.
- **cera-no-sil** remains stuck at low VF% (55.59%) with FS% 29.97%.
- **heuristic** leads overall with FS% 89.92%.

### 1000-sent
- **cera-full** achieves its best ER% (1.71%) with stable VF% (94.88%), producing FS% 89.18% — nearly matching heuristic.
- **cera-no-sil** improves VF% to 78.89% at scale but FS% (60.66%) still lags significantly.
- **heuristic** ER% increases to 14.38% (worst at this size), dragging FS% down to 86.48%.

## Per-Run Variance

Notable variance observed:
- **cera-full 100**: ER% ranges from 0.00% (run 3) to 58.33% (run 2) — extreme instability at small sizes.
- **cera-full 500**: ER% ranges from 0.00% (runs 3, 5) to 61.49% (run 2) — run 2 had systematic price hallucinations.
- **cera-sav 100**: ER% ranges from 0.00% (runs 2-4) to 62.86% (run 5) — run 5 had a cluster of "$7.99 lunch combo" price hallucinations.
- **heuristic 1000**: ER% relatively stable (12.25%–17.16%) across runs.

## Error Type Distribution

### Wrong Spec (wrong_spec)
Dominant error type across all modes. Common patterns:
- **Soup name hallucinations**: "Zuppa Oregano," "Zuppa Oregon," "Zuppa O'Kansas," "Zuppa Oscana" instead of "Zuppa Toscana" — especially prevalent in cera-full and cera-sav at 1000-sent.
- **Price errors**: Menu item prices cited well outside ±15% tolerance of factsheet values. Most common: Chicken Alfredo ($14-$26 vs ~$20.49), Lasagna Classico ($5-$15 vs ~$18.49), Never-Ending Soup/Salad/Breadsticks ($7.99-$8.99 vs ~$12.49).

### Hallucinated Feature (hallucinated_feature)
Second most common error type:
- **Reservation claims**: Reviews claiming "we had a reservation" or "despite our reservation" — Olive Garden explicitly does NOT accept traditional reservations (virtual waitlist only). This was especially prevalent in heuristic mode (74 of 148 errors at 1000-sent).
- **Drive-through claims**: Rare but present in cera-no-sil.

### Factual Error (factual_error)
Occasional:
- Classifying entrees as soups (e.g., "Five Cheese Ziti al Forno" listed as a soup variety).
- Claiming breadsticks have high prices when they're included free with entrees.
- Claiming digital waitlist "is not available" when it exists.

### Timeline Error (timeline_error)
Not observed — expected since Olive Garden is a long-established chain with no recent opening date.

## Qualitative Failure Modes

1. **SIL-deprived modes generate vague reviews**: cera-no-sil has 44% unrelated reviews at 100/500-sent, meaning reviews discuss generic restaurant topics without engaging Olive Garden-specific details. This is the primary mechanism by which SIL removal reduces FS%.

2. **Heuristic mode hallucinates reservations at scale**: At 1000-sent, 50% of heuristic errors are reservation claims — the prompt-only approach (no SIL facts to consult) defaults to the common "I made a reservation" pattern that doesn't apply to Olive Garden.

3. **Composition-scoped runs amplify errors**: When a bad composition is sampled (e.g., incorrect price points), all reviews in that run inherit the same errors, producing error clusters. This explains the high within-mode variance (0% to 60%+ ER%).

4. **Soup name corruption at scale**: The local LLM (Qwen3.5-35B-A3B) consistently mangles "Zuppa Toscana" into phonetically similar but incorrect names. This is a generation-model artifact, not a CERA pipeline issue.

## Implications for Thesis

1. **SIL is critical for factual engagement**: The VF% gap between cera-full (~95%) and cera-no-sil (~56% at small sizes) demonstrates that SIL drives reviews to engage with verifiable product details rather than generic commentary.

2. **FS% captures the VF-ER tradeoff**: cera-no-sil has lower ER% than cera-full at most sizes, but its much lower VF% results in substantially worse FS%. This validates the VF-adjusted scoring: avoiding factual claims entirely is not a successful strategy.

3. **cera-full converges with scale**: At 1000-sent, cera-full achieves FS% 89.18% — nearly matching heuristic (86.48%) and far exceeding cera-no-sil (60.66%). The full pipeline benefits most at scale.

4. **Heuristic degrades at scale**: Heuristic ER% increases from 7.62% (100) to 14.38% (1000), driven by hallucinated reservations and wrong prices. Without SIL grounding, more reviews = more opportunities for factual errors.

5. **MAV contribution (cera-full vs cera-sav)**: cera-full consistently outperforms cera-sav in VF% (~95% vs ~80-85%) and FS% (~77-89% vs ~60-72%), suggesting MAV verification helps maintain factual engagement and accuracy.

## Limitations

- **Single grading pass**: Each review graded once by a single Opus agent. No inter-rater reliability check.
- **Price tolerance is subjective**: The ±15% threshold for price claims is a judgment call; different thresholds would change ER% counts.
- **Olive Garden is well-known**: As a major US chain, the LLM has strong priors about Olive Garden. Results may differ for less-known subjects where SIL contribution is more critical.
- **Composition-scoped variance**: The 5-run design with composition-scoped runs means each run shares composition context, producing correlated errors within runs. This inflates run-level variance.
- **Answer-key method limitations**: Off-topic claims are ignored entirely, potentially missing creative hallucinations that a whitelist method would catch.
