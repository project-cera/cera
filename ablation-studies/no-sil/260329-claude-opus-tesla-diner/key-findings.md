# Key Findings: Tesla Diner — no-SIL Ablation (Answer-Key Method)

## Study Metadata
- **Subject**: Tesla Diner (West Hollywood, CA)
- **Domain**: Restaurant
- **Grading method**: Answer-key (only flag contradictions to factsheet; ignore off-topic claims)
- **Flagger model**: Claude Opus (via Claude Code subagents)
- **Factsheet**: v3 (82 claims, 40 topic IDs)
- **Sizes**: 100, 500, 1000 sentences
- **Runs per cell**: 5
- **Date**: March 29, 2026

## Aggregate Results

| Mode | Size | Reviews | ER% | VF% | FS% | Vague |
|------|------|---------|-----|-----|-----|-------|
| cera-full | 100 | 144 | 9.72 | 97.92 | 90.97 | 1 |
| cera-full | 500 | 748 | 11.50 | 98.40 | 90.91 | 0 |
| cera-full | 1000 | 1440 | 31.11 | 97.29 | 79.27 | 0 |
| cera-no-sil | 100 | 147 | 6.12 | 71.43 | 67.35 | 35 |
| cera-no-sil | 500 | 764 | 0.79 | 56.15 | 55.50 | 68 |
| cera-no-sil | 1000 | 1481 | 1.35 | 48.41 | 47.16 | 157 |
| cera-sav | 100 | 157 | 37.58 | 90.45 | 53.18 | 7 |
| cera-sav | 500 | 770 | 59.48 | 97.40 | 37.92 | 21 |
| cera-sav | 1000 | 1470 | 44.56 | 94.69 | 50.17 | 24 |
| heuristic | 100 | 108 | 91.67 | 100.00 | 24.54 | 0 |
| heuristic | 500 | 547 | 88.30 | 100.00 | 22.58 | 24 |
| heuristic | 1000 | 1117 | 87.20 | 99.64 | 27.75 | 0 |

## Key Observations

### 1. CERA-Full achieves the highest FS% but has non-trivial ER% at scale
- FS% ranges 79-91%, the best of any mode. SIL + MAV provides strong factual grounding.
- ER% climbs sharply at size 1000 (31.11%), driven by systematic wrong_spec errors in specific runs where the SIL context contained a single incorrect fact (e.g., "45-foot screens" instead of 66-foot, wrong hot dog price) that propagated across many reviews in the same composition run.
- This is a composition-scoped amplification effect: one bad SIL fact in a run contaminates all reviews generated from that composition context.

### 2. CERA-no-SIL has extremely low ER% but also low VF%
- ER% is remarkably low (0.79-6.12%) — without SIL facts, there are fewer specific claims to get wrong.
- However, VF% plummets (48-71%) as reviews lack factsheet-relevant detail. Many reviews are vague or discuss only subjective impressions.
- FS% (47-67%) reflects this tradeoff: few errors, but also few verifiable facts.
- Vague reviews are dramatically higher (35-157 per cell) compared to other modes.
- At size 1000, runs 3-4 show severe generation artifacts ("The verification step returned no facts..."), producing 50+ vague reviews per run.

### 3. CERA-SAV has the most volatile error rates
- ER% ranges 37-59%, driven almost entirely by a single systematic error: claiming the diner is "open 24/7" without qualifying that walk-in hours are 6 AM to midnight (24/7 is only for EV vehicle ordering).
- This error varies dramatically between runs: some runs (e.g., run 4 across all sizes) have near-zero ER% when the SAV context doesn't include the misleading 24/7 claim, while others (run 1 at size 1000) hit 82% ER%.
- VF% is high (90-97%) since reviews do engage with factsheet topics, but the high ER% drags FS% down to 38-53%.

### 4. Heuristic mode has catastrophic error rates
- ER% is 87-92% across all sizes — the vast majority of reviews contain factual errors.
- The dominant errors are: hallucinated alcohol/cocktails (Tesla Diner does not serve alcohol), wrong burger prices ($16-$28 vs $13.50), and fabricated features (valet parking, reservations).
- Despite 99-100% VF% (reviews are highly specific), FS% collapses to 23-28% due to the massive error count.
- Zero vague reviews at sizes 100 and 1000 — heuristic reviews are confidently specific, just confidently wrong.

### 5. Per-run variance analysis
- **CERA-Full**: High variance at size 1000 (ER% ranges 0.68% to 58.98% across runs) due to composition-scoped error amplification.
- **CERA-no-SIL**: Low variance in ER% (0-11%) but high variance in VF% (18-65%) and vague counts.
- **CERA-SAV**: Extreme variance driven by whether the SAV context includes the misleading "24/7" hours claim.
- **Heuristic**: Remarkably stable error rates (85-100%) across runs — consistently poor factual accuracy.

## Error Type Distribution

| Error Type | cera-full | cera-no-sil | cera-sav | heuristic |
|------------|-----------|-------------|----------|-----------|
| wrong_spec | Dominant (screen size, prices) | Rare | Rare | Dominant (prices) |
| factual_error | Moderate (valet parking) | Some (wrong street) | Dominant (24/7 hours) | Common (free charging, location) |
| hallucinated_feature | Rare | Moderate (alcohol/bar) | None | Very common (alcohol, reservations) |
| timeline_error | None | None | None | None |
| vague_review | 1 total | 260 total | 52 total | 24 total |

## Qualitative Failure Modes

1. **Composition-scoped amplification** (cera-full, cera-sav): When the SIL or SAV context contains one incorrect fact, it propagates to every review in that run, creating runs with 80%+ ER% alongside runs with near-zero ER%. This is an architectural vulnerability of composition-scoped generation.

2. **Alcohol hallucination** (heuristic, cera-no-sil): Without SIL's factual grounding, models default to restaurant priors that include alcohol service. Tesla Diner's no-alcohol policy is highly atypical for a restaurant, making it a strong test of factual grounding.

3. **Price confabulation** (heuristic): Without real price data, the model generates plausible-sounding but incorrect prices ($18 burgers, $12 milkshakes) that are systematically higher than actual menu prices.

4. **24/7 hours conflation** (cera-sav): The SAV context apparently includes the nuanced "24/7 ordering from vehicles" fact but the model flattens it to "open 24/7," losing the critical walk-in hours qualification.

## Implications for Thesis

- **SIL is critical for factual accuracy**: cera-no-sil has the lowest ER% but at the cost of vague, uninformative reviews. The SIL component provides the specific factual details that make reviews useful for aspect-based sentiment analysis.
- **MAV validation matters**: The cera-sav mode's systematic 24/7 error suggests that without MAV cross-validation, single-source facts can introduce systematic biases.
- **Heuristic generation is unsuitable for factually grounded review generation**: 87-92% error rates make heuristic reviews unreliable as training data for any task requiring factual accuracy.
- **FS% is the most informative single metric**: It captures both factual engagement (VF%) and correctness (1-ER%), revealing that cera-full (79-91%) dramatically outperforms all ablations (23-67%).

## Limitations

- Answer-key grading only evaluates claims the factsheet covers; errors about topics outside the factsheet go undetected.
- The factsheet has 82 claims, providing rich coverage of Tesla Diner's factual surface area, but some niche claims may still be missed.
- Minor price discrepancies (within $1) are not flagged per the grading instructions, which may slightly undercount pricing errors.
- Composition-scoped runs mean that a single SIL error can inflate ER% for an entire run — the per-run variance should be considered alongside aggregate ER%.
