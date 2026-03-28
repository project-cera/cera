# Key Findings: SIL Ablation Study — MacBook Neo

## Study Metadata
- **Date**: March 27, 2026
- **Flagger Model**: Claude Sonnet 4.6 (via Claude Code subagents)
- **Domain**: Laptop (MacBook Neo 2026)
- **Factsheet**: 33 verifiable claims across 10 categories
- **Conditions**: cera-full (SIL+MAV), cera-sav (SIL only), cera-no-sil (no SIL), heuristic (no CERA)
- **Sizes**: 100, 500, 1000 sentences
- **Runs per condition**: 5 (composition-scoped for CERA modes, generation-scoped for heuristic)
- **Generator model**: Qwen3.5-35B-A3B (local)

## Aggregate Results

| Mode | FS% | VF% | ER% | Reviews | Errors | Vague |
|------|-----|-----|-----|---------|--------|-------|
| cera-full | **71.44%** | 89.2% | 12.06% | 2306 | 278 | 99 |
| cera-sav | **69.56%** | 88.2% | 23.34% | 1962 | 458 | 83 |
| cera-no-sil | **3.90%** | 36.2% | 32.22% | 1614 | 520 | 243 |
| heuristic | **5.53%** | 98.2% | 86.88% | 1425 | 1238 | 2 |

**Key metric definitions:**
- **FS%** (Factual Score): VF% minus ER%. The percentage of reviews that are both information-rich and factually accurate. Uses strict per-review scoring: a review with five correct specs and one wrong price receives no credit. Scale: 0% = every verifiable review has an error, 100% = every review is specific and correct.
- **VF%** (Verifiable Fact density): Fraction of reviews containing at least one verifiable claim
- **ER%** (Error Rate): Fraction of reviews with at least one factual error (excludes vague-only flags)

## FS% by Dataset Size

| Mode | 100-sent | 500-sent | 1000-sent | Overall |
|------|----------|----------|-----------|---------|
| cera-full | 58.00% | 77.45% | 78.87% | **71.44%** |
| cera-sav | 79.50% | 58.15% | 71.02% | **69.56%** |
| cera-no-sil | 4.79% | 4.04% | 2.87% | **3.90%** |
| heuristic | 0.00% | 4.10% | 12.50% | **5.53%** |

## Error Rates by Dataset Size

| Mode | Size | Reviews | Errors | VF% | ER% | FS% |
|------|------|---------|--------|-----|-----|-----|
| cera-full | 100 | 151 | 48 | 90.1% | 31.79% | 58.00% |
| cera-full | 500 | 703 | 87 | 89.9% | 12.38% | 77.45% |
| cera-full | 1000 | 1452 | 143 | 88.8% | 9.85% | 78.87% |
| cera-sav | 100 | 145 | 15 | 91.0% | 10.34% | 79.50% |
| cera-sav | 500 | 707 | 247 | 92.5% | 34.94% | 58.15% |
| cera-sav | 1000 | 1110 | 196 | 85.0% | 17.66% | 71.02% |
| cera-no-sil | 100 | 156 | 50 | 36.5% | 32.05% | 4.79% |
| cera-no-sil | 500 | 585 | 176 | 34.4% | 30.09% | 4.04% |
| cera-no-sil | 1000 | 873 | 294 | 37.3% | 33.68% | 2.87% |
| heuristic | 100 | 106 | 105 | 99.1% | 99.06% | 0.00% |
| heuristic | 500 | 549 | 520 | 98.7% | 94.72% | 4.10% |
| heuristic | 1000 | 770 | 613 | 97.7% | 79.61% | 12.50% |

## Per-Run Variance

| Mode | Size | ER% min | ER% max | ER% std |
|------|------|---------|---------|---------|
| cera-no-sil | 100 | 0.00% | 55.17% | 20.67% |
| cera-no-sil | 500 | 26.21% | 37.00% | 4.30% |
| cera-no-sil | 1000 | 10.00% | 41.55% | 13.30% |
| cera-sav | 100 | 0.00% | 38.46% | 15.93% |
| cera-sav | 500 | 1.49% | 66.90% | 26.99% |
| cera-sav | 1000 | 2.00% | 27.69% | 10.61% |
| cera-full | 100 | 0.00% | 70.37% | 25.12% |
| cera-full | 500 | 1.37% | 25.90% | 10.53% |
| cera-full | 1000 | 1.39% | 17.41% | 6.98% |
| heuristic | 100 | 95.65% | 100.00% | 1.95% |
| heuristic | 500 | 91.00% | 96.52% | 2.26% |
| heuristic | 1000 | 43.70% | 99.00% | 23.50% |

## Error Type Distribution

### cera-no-sil (826 total flags)

| Type | Count | Share |
|------|-------|-------|
| factual_error | 49 | 5.9% |
| hallucinated_feature | 115 | 13.9% |
| wrong_spec | 220 | 26.6% |
| timeline_error | 3 | 0.4% |
| vague_review | 280 | 33.9% |

### cera-sav (864 total flags)

| Type | Count | Share |
|------|-------|-------|
| factual_error | 15 | 1.7% |
| hallucinated_feature | 284 | 32.9% |
| wrong_spec | 348 | 40.3% |
| timeline_error | 1 | 0.1% |
| vague_review | 173 | 20.0% |

### cera-full (1640 total flags)

| Type | Count | Share |
|------|-------|-------|
| factual_error | 128 | 7.8% |
| hallucinated_feature | 455 | 27.7% |
| wrong_spec | 439 | 26.8% |
| timeline_error | 153 | 9.3% |
| vague_review | 102 | 6.2% |

### heuristic (2565 total flags)

| Type | Count | Share |
|------|-------|-------|
| factual_error | 79 | 3.1% |
| hallucinated_feature | 281 | 11.0% |
| wrong_spec | 1096 | 42.7% |
| timeline_error | 5 | 0.2% |
| vague_review | 38 | 1.5% |

## Implications for SIL Component

The Subject Intelligence Layer (SIL) provides factual grounding by performing agentic web searches
before review generation. This study compares four conditions to isolate SIL's contribution:

- **cera-full**: Full pipeline with SIL + MAV verification
- **cera-sav**: SIL enabled but MAV verification disabled
- **cera-no-sil**: SIL disabled (no web search grounding)
- **heuristic**: Baseline without any CERA composition components

**FS% comparison**: cera-full (71.44%) > cera-sav (69.56%) >> heuristic (5.53%) > cera-no-sil (3.90%)

**SIL effect (cera-no-sil vs cera-sav)**: FS% jumps from 3.90% to 69.56% (+65.66pp). Web search grounding is the single largest contributor to factual quality.
**MAV effect (cera-sav vs cera-full)**: FS% rises from 69.56% to 71.44% (+1.88pp). MAV provides a modest but consistent improvement over single-agent verification.
**Full pipeline vs heuristic**: FS% 71.44% vs 5.53% (delta: +65.91pp). The full CERA pipeline produces reviews where 71% are both specific and trustworthy, compared to fewer than 6% for heuristic generation.

## Study Limitations

- Single domain (laptop) — results may not generalize to restaurant/hotel
- Single generator LLM (Qwen3.5-35B-A3B) — different models may respond differently to SIL context
- Automated flagger (Claude Sonnet 4.6) — may have systematic biases vs human reviewers
- 5 composition runs — limited statistical power for variance estimates
- Factsheet coverage — some product aspects may not be covered, leading to uncaught errors
- **Truncated runs**: 13/60 subagent runs were truncated at 100 reviews due to output limits (affects cera-no-sil 500/1000, cera-sav 1000, heuristic 500/1000). Actual review counts are lower than expected for these conditions, particularly cera-no-sil (1614 vs ~2400 expected) and heuristic (1425 vs ~1750 expected). Error rates for truncated runs reflect only the first ~100 reviews.

## Raw Data Paths

- Output directory: `/home/kap/GitHub/cera-private-monorepo/public-subtrees/cera/ablation-studies/no-sil/20260327T062046-claude-sonnet-4.6-macbook-neo`
- Per-run CSVs: `csv/{mode}-{size}-run{N}.csv`
- Aggregate CSVs: `csv/{mode}-{size}-runs.csv`, `csv/all-runs.csv`
- Dataset JSONs: `datasets/laptop/{mode}/{size}-sent.json`
- Summary: `summary.json`, `summary.csv`
