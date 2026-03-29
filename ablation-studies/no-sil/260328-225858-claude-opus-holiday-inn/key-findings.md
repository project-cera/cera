# Key Findings: Holiday Inn no-SIL Ablation (Answer-Key Method)

**Study**: no-SIL ablation — Holiday Inn by IHG (hotel domain)
**Grading method**: Answer-key (only flag claims that contradict the factsheet; ignore off-topic claims)
**Flagger model**: Claude Opus (via Claude Code subagents, sequential runs per mode+size)
**Date**: March 28, 2026
**Total reviews graded**: 8,638 across 4 modes, 3 sizes, 5 runs each

## Aggregate Results

| Mode | Size | Reviews | Errors | Vague | ER% | VF% | FS% |
|------|------|---------|--------|-------|-----|-----|-----|
| cera-full | 100 | 142 | 42 | 0 | 29.58% | 56.34% | 26.76% |
| cera-full | 500 | 738 | 160 | 170 | 21.68% | 80.76% | 59.08% |
| cera-full | 1000 | 1,478 | 409 | 116 | 27.67% | 83.76% | 56.09% |
| cera-sav | 100 | 147 | 10 | 3 | 6.80% | 46.94% | 40.14% |
| cera-sav | 500 | 751 | 76 | 8 | 10.12% | 69.51% | 59.39% |
| cera-sav | 1000 | 1,454 | 470 | 196 | 32.32% | 41.54% | 9.22% |
| cera-no-sil | 100 | 153 | 2 | 126 | 1.31% | 41.18% | 39.87% |
| cera-no-sil | 500 | 715 | 8 | 57 | 1.12% | 29.37% | 28.25% |
| cera-no-sil | 1000 | 1,460 | 18 | 15 | 1.23% | 28.42% | 27.19% |
| heuristic | 100 | 100 | 13 | 0 | 13.00% | 100.00% | 87.00% |
| heuristic | 500 | 500 | 22 | 0 | 4.40% | 100.00% | 95.60% |
| heuristic | 1000 | 1,000 | 38 | 0 | 3.80% | 99.90% | 96.10% |

## Per-Run Variance

### cera-full (SIL + MAV)
| Size | Run 1 | Run 2 | Run 3 | Run 4 | Run 5 | Range |
|------|-------|-------|-------|-------|-------|-------|
| 100 | 50.00% | 0.00% | 3.33% | 43.33% | 50.00% | 0-50% |
| 500 | 17.69% | 0.00% | 0.00% | 33.79% | 60.71% | 0-61% |
| 1000 | 41.58% | 0.00% | 12.50% | 33.33% | 48.57% | 0-49% |

### cera-sav (SIL, no MAV)
| Size | Run 1 | Run 2 | Run 3 | Run 4 | Run 5 | Range |
|------|-------|-------|-------|-------|-------|-------|
| 100 | 0.00% | 0.00% | 7.14% | 0.00% | 28.57% | 0-29% |
| 500 | 1.94% | 15.58% | 0.00% | 0.00% | 34.03% | 0-34% |
| 1000 | 0.67% | 18.79% | 69.61% | 0.74% | 69.86% | 1-70% |

### cera-no-sil (no SIL, no MAV)
| Size | Run 1 | Run 2 | Run 3 | Run 4 | Run 5 | Range |
|------|-------|-------|-------|-------|-------|-------|
| 100 | 3.13% | 0.00% | 0.00% | 4.00% | 0.00% | 0-4% |
| 500 | 1.94% | 0.00% | 0.69% | 1.53% | 1.34% | 0-2% |
| 1000 | 1.62% | 1.42% | 0.34% | 2.01% | 0.71% | 0-2% |

### heuristic
| Size | Run 1 | Run 2 | Run 3 | Run 4 | Run 5 | Range |
|------|-------|-------|-------|-------|-------|-------|
| 100 | 20.00% | 10.00% | 25.00% | 5.00% | 5.00% | 5-25% |
| 500 | 3.00% | 6.00% | 8.00% | 3.00% | 2.00% | 2-8% |
| 1000 | 4.00% | 5.50% | 3.00% | 2.00% | 4.50% | 2-6% |

## Error Type Distribution

### cera-full
- **wrong_spec** (dominant): Kids Stay Free age cited as "19 and under" when max is 18/under. Kids Eat Free age cited as "12 and under" in Americas context when it should be 11/under. These off-by-one errors are systematic within affected runs.
- **hallucinated_feature** (rare): Concierge claims (1-2 instances per 1000 reviews).
- **factual_error** (rare): Wi-Fi claimed as member-only when a review says "standard for all."

### cera-sav
- **wrong_spec** (dominant): Same kids age pattern as cera-full. Additionally, wrong toiletry brands (Puracy, Onyx instead of Dove) in run 4. "Comfort Hideaway" instead of "Welcome Nook" in some runs.
- **hallucinated_feature**: Complimentary breakfast claims (~1 per 300 reviews).
- **factual_error**: Wi-Fi cost claims (2 instances in run 1).

### cera-no-sil
- **hallucinated_feature** (dominant): Complimentary breakfast (10 instances) and concierge service (9 instances) across all sizes.
- **wrong_spec** (rare): Toiletries described as "tiny bottles" instead of bulk dispensers (1 instance).
- **vague_review**: Very high at size 100 (82%), declining at larger sizes.

### heuristic
- **hallucinated_feature** (exclusive): Every single error (73/73 across all sizes) is a "complimentary breakfast" claim. Zero wrong_spec, zero factual_error.

## Qualitative Failure Modes

### 1. Kids Age Off-by-One (cera-full, cera-sav)
The dominant error across SIL-enabled modes is systematic off-by-one errors on Kids Stay/Eat Free ages. The factsheet says:
- Stay Free: 18 and under (Americas)
- Eat Free: 11 and under (Americas)

Reviews consistently produce "19 and under" (stay) and "12 and under" (eat). This pattern appears in entire runs (e.g., cera-sav run 5: 197/282 = 70% error rate), suggesting the error originates in the composition context and propagates to all reviews in that run.

**Run-level correlation**: When one review in a run has the age error, nearly all reviews in that run repeat it. Runs without the error have near-zero error rates (cera-full run 2: 0% across all sizes). This indicates the error is in the SIL-generated factsheet, not in individual review generation.

### 2. Complimentary Breakfast Hallucination (all modes)
Holiday Inn (full-service) does NOT include complimentary breakfast -- only Holiday Inn Express does. This is the single most common error type for heuristic mode and appears across all modes. The LLM conflates the two brands' breakfast policies.

### 3. Concierge Hallucination (cera-no-sil only)
Without SIL grounding, the LLM occasionally attributes luxury amenities (concierge service) to Holiday Inn, which the factsheet explicitly excludes. This error does not appear in SIL-enabled modes, suggesting SIL prevents luxury feature hallucination.

### 4. Vagueness Without SIL (cera-no-sil)
At size 100, 82% of cera-no-sil reviews are vague -- containing no verifiable product-specific claims. Without SIL factual grounding, reviews default to generic hotel commentary (bed comfort, cleanliness, location, staff).

## Implications for Thesis

### ER% Comparison
1. **cera-no-sil has the lowest ER% (1.1-1.3%)** across all sizes. Without SIL, reviews rarely make specific enough claims to contradict the factsheet. The low error rate reflects avoidance of checkable claims rather than factual accuracy.

2. **heuristic mode has moderate ER% (3.8-13%)**, driven exclusively by breakfast hallucinations. The heuristic approach produces factually rich reviews but consistently confuses Holiday Inn's breakfast policy with Holiday Inn Express.

3. **cera-full and cera-sav have the highest ER% (6.8-32.3%)**, driven by kids age off-by-one errors. The SIL component successfully grounds reviews in real product facts, but introduces systematic errors when SIL-generated factsheets contain small inaccuracies that propagate across all reviews.

### FS% Comparison (Factual Score = VF% - ER%)
FS% captures both information density and accuracy in a single metric:
- **heuristic**: 87-96% FS — very high VF (100%) with low ER (3.8-13%). Despite breakfast hallucinations, the vast majority of reviews are both specific and correct.
- **cera-full**: 27-59% FS — high VF (56-84%) but also high ER (22-30%). Many reviews are specific and correct, but the kids age errors drag FS down.
- **cera-sav**: 9-59% FS — variable. At size 1000, FS drops to 9.2% because run-level systematic errors (kids ages) dominate.
- **cera-no-sil**: 28-40% FS — low VF (28-41%) with very low ER (1.1-1.3%). Reviews are mostly generic, but the few specific claims are usually correct.

### The SIL Accuracy Paradox
SIL-enabled modes (cera-full, cera-sav) produce more factually engaged reviews but also more errors than no-SIL. This is because:
- SIL grounds reviews in specific claims (higher VF density)
- When SIL gets a fact slightly wrong (e.g., age 19 vs 18), the error propagates to many reviews
- Without SIL, reviews avoid specific claims entirely, resulting in fewer errors but less factual content

### Holiday Inn as a Pre-Cutoff Subject
Holiday Inn is well-known and within the generation model's training data. Yet SIL-enabled modes still produce high error rates on specific numeric claims (kids ages, rewards tiers). This suggests SIL value is not limited to post-cutoff subjects: even for well-known brands, SIL can introduce errors when it retrieves slightly wrong details from web sources, while also providing correct grounding for most other claims.

### Run-Level Variance
The high per-run variance in cera-full and cera-sav (0-70% ER range) reflects composition-scoped runs: each run generates a fresh SIL factsheet, and the quality of that factsheet determines the entire run's error rate. This suggests MAV (Multi-Agent Verification) should help by catching SIL inaccuracies before generation, though cera-full (with MAV) shows similar variance to cera-sav (without MAV) in this study.

## Limitations

1. **VF% hybrid detection**: Grading agents consistently tagged `factsheet_topics_matched` for flagged reviews but left the column empty for many clean (unflagged) reviews. A post-hoc keyword backfill pass scanned empty cells against regex patterns derived from the topic enum, filling 3,393 of 5,897 untagged reviews (71% total coverage). The keyword patterns detect genuine topic engagement (e.g., "breakfast" matches `breakfast_not_included`, "10 points per dollar" matches `rewards_earn_rate`) and only fill empty cells, never overriding LLM-tagged ones. VF% should be treated as approximate, particularly for cera-no-sil where keyword patterns may overcatch incidental vocabulary.

2. **Answer-key method scope**: This method only catches claims that contradict the factsheet. It does not flag fabricated details about topics the factsheet doesn't cover (e.g., invented room numbers, fake staff names). The whitelist method (`generate-flags`) complements this by flagging any specific claim not in the factsheet.

3. **Single-subject study**: Results are for Holiday Inn only. The kids age off-by-one pattern may be specific to this factsheet's structure. Generalizability requires cross-subject comparison.

4. **Grading consistency**: Each mode+size was graded by an independent subagent. While all used identical prompts and factsheets, minor grading threshold differences (e.g., what counts as "vague") may introduce inter-agent variance.
