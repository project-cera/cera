# SIL Ablation Study: Factual Accuracy Flagging — Galaxy Book3

## Study Metadata

| Field | Value |
|-------|-------|
| **Date** | March 24, 2026 |
| **Flagger Model** | Claude Opus 4.6 (via Claude Code subagents) |
| **Domain** | Laptop |
| **Product** | Samsung Galaxy Book3 (2023) |
| **Factsheet Claims** | 44 verifiable claims |
| **Product Release** | February 1, 2023 (Galaxy Unpacked) |
| **Conditions** | cera-full, cera-no-sil, cera-sav, heuristic |
| **Sizes** | 100, 500, 1000 sentences |

## Aggregate Error Rates

| Mode | Total Reviews | Errors | Error Rate | Vague | Delta vs. cera-full |
|------|--------------|--------|------------|-------|---------------------|
| **cera-full** | 478 | 7 | **1.46%** | 28 | — |
| **cera-no-sil** (post-fix) | 497 | 75 | **15.09%** | 15 | +13.63pp |
| **cera-no-sil** (pre-fix) | 463 | 420 | **90.71%** | 7 | +89.25pp |
| **cera-sav** | 466 | 260 | **55.79%** | 39 | +54.33pp |
| **heuristic** | 371 | 178 | **47.98%** | 12 | +46.52pp |

**cera-no-sil pre-fix → post-fix**: After fixing `_parametric_only_fallback()` to return empty context instead of dumping parametric knowledge, cera-no-sil error rate dropped from **90.71% to 15.09%** — a 6× reduction. The fix eliminated the systematic Pro/Ultra spec conflation that dominated the pre-fix version. The remaining ~15% errors are stochastic hallucinations from the generation LLM's parametric knowledge — S-Pen support (dominant at 500-sent), wrong display specs (4K, 120Hz, 144Hz, OLED, wrong size), 32GB RAM, wrong battery life, wrong weight, and wrong pricing. Errors are diverse but frequent when the LLM attempts specs.

**Spec density caveat — per-claim error rate reveals the real picture**: Post-fix cera-no-sil reviews have drastically lower spec density (~13% of reviews contain verifiable claims) compared to cera-full (~69%) and heuristic (~98%). The 15.09% aggregate error rate is misleading because ~87% of reviews are unflaggable opinion pieces. Among the ~13% of reviews that actually attempt specific claims, **~95% contain errors** — far worse than heuristic's 43% per-claim error rate and catastrophically worse than cera-full's 1.8%.

| Condition | Error Rate (ER) | VF% | NER (ER ÷ VF) | Per-claim error rate |
|-----------|----------------|-----|---------------|---------------------|
| cera-full | 1.46% | **72%** | **2.0%** | 1.8% |
| heuristic | 47.98% | **97%** | **49.5%** | 43.2% |
| cera-sav | 55.79% | **88%** | **63.4%** | ~64% |
| cera-no-sil (post-fix) | 15.09% | **20%** | **75.4%** | ~95% |
| cera-no-sil (pre-fix) | 90.71% | **82%** | **110.6%** | ~95%+ |

**VF% (Verifiable Fact density)**: Percentage of reviews containing at least one verifiable claim — a spec, measurement, price, feature name, or technical detail, whether correct or not. Captures how "information-rich" reviews are, independent of accuracy.

**NER (Normalized Error Rate)**: ER ÷ VF%. Adjusts the error rate relative to how many reviews actually contain verifiable facts. This prevents conditions with mostly vague reviews from appearing artificially accurate. For example, cera-no-sil post-fix has a low ER (15.09%) but an even lower VF% (20%), yielding a high NER (75.4%) — meaning most of its information-bearing reviews contain errors. By contrast, cera-sav has a higher ER (55.79%) but much higher VF% (88%), yielding a lower NER (63.4%) — its reviews are more informative and proportionally less error-prone. NER values above 100% (cera-no-sil pre-fix: 110.6%) indicate that reviews contain more errors than verifiable facts, meaning some reviews have multiple errors per claim.

The fix successfully stopped the pipeline from amplifying wrong specs into every review, but the generation LLM's parametric knowledge remains fundamentally unreliable for this product. When it does mention specs, it gets them wrong nearly every time. Without SIL, the pipeline produces reviews that are either vague (no specs) or inaccurate (wrong specs) — there is no middle ground where the LLM reliably generates correct specs from parametric knowledge alone.

**Note on cera-sav correction:** The raw flagger subagents reported only 26 errors for cera-sav due to inconsistent flagging of the "$750 to $1,000" price range. Post-hoc analysis found that ~55% of reviews across all SAV sizes contain this claim (18/32 at 100-sent, 82/144 at 500-sent, 153/290 at 1000-sent), but the 500/1000-sent flaggers failed to flag them while the 100-sent flagger did. The corrected counts above include all "$750" price mentions as errors, since the factsheet documents only $999.99 MSRP and the $750 lower bound is unsubstantiated.

The SIL component reduces factual error rates from 15.09% (without SIL, post-fix) to 1.46% (with SIL), a 10× reduction in aggregate. But the per-claim comparison is more telling: SIL achieves 1.8% per-claim errors with 69% spec density, while noSIL achieves ~95% per-claim errors with ~13% spec density. SIL doesn't just reduce errors — it enables spec-rich reviews that are also accurate.

## Error Rates by Dataset Size

| Mode | 100-sent | 500-sent | 1000-sent |
|------|----------|----------|-----------|
| **cera-full** | 3.13% (1/32) | 1.25% (2/160) | 1.40% (4/286) |
| **cera-no-sil** (post-fix) | 22.58% (7/31) | 17.88% (27/151) | 13.02% (41/315) |
| **cera-no-sil** (pre-fix) | 78.57% (22/28) | 98.67% (148/150) | 87.72% (250/285) |
| **cera-sav** | 65.63% (21/32) | 58.33% (84/144) | 53.45% (155/290) |
| **heuristic** | 75.00% (18/24) | 42.50% (51/120) | 48.02% (109/227) |

### VF% (Verifiable Fact Density) by Size

| Mode | 100-sent | 500-sent | 1000-sent | Aggregate |
|------|----------|----------|-----------|-----------|
| **cera-full** | 59% | 69% | 75% | **72%** |
| **cera-no-sil** (post-fix) | 16% | 23% | 18% | **20%** |
| **cera-no-sil** (pre-fix) | 86% | 83% | 81% | **82%** |
| **cera-sav** | 91% | 90% | 86% | **88%** |
| **heuristic** | 88% | 99% | 96% | **97%** |

**Note:** The cera-sav 500/1000-sent error counts have been corrected upward from the raw flagger output (see flagger consistency note in Aggregate Error Rates).

cera-full maintains a consistently low error rate across all sizes (1.25–3.13%). Post-fix cera-no-sil ranges from 13–23%, a dramatic improvement from pre-fix (78–99%) and lower in aggregate than both heuristic (42–75%) and cera-sav (53–66%). However, this is primarily because post-fix noSIL reviews rarely attempt verifiable claims (~13% spec density vs ~98% for heuristic). When they do attempt specs, ~95% contain errors — the aggregate rate is low because most reviews are opinion-only.

The cera-sav condition shows a **consistent ~55% error rate** across all sizes, driven almost entirely by a single unverified price claim ("$750 to $1,000") that SAV accepted without cross-verification and that the writing patterns then hard-coded into ~55% of all generated reviews. This demonstrates that SAV's lack of multi-agent consensus allows a single wrong fact to propagate systematically through the pipeline.

## Error Type Distribution

### cera-full (7 errors total)
| Type | Count | Share |
|------|-------|-------|
| wrong_spec | 5 | 71.4% |
| factual_error | 2 | 28.6% |

**Dominant pattern**: Minor numerical typos (528GB/52GB instead of 512GB, 3.3 lbs instead of 3.46 lbs, 14mm instead of 15.4mm). One S Pen hallucination, one incorrect weight comparison. No systematic failure mode — errors appear to be stochastic noise from the generation LLM.

### cera-no-sil v1 — pre-fix (420 errors total)
| Type | Count | Share |
|------|-------|-------|
| wrong_spec | ~350 | ~83% |
| hallucinated_feature | ~60 | ~14% |
| factual_error | ~10 | ~2% |

**Dominant pattern**: Systematic confusion with Galaxy Book3 Pro/Ultra specifications. The LLM consistently attributes Pro-tier features (3K resolution, 120Hz refresh, i9 processor, AKG quad speakers, 1080p FHD webcam, S Pen, RTX 40-series GPU, Thunderbolt 4, AMOLED display, glass trackpad) to the base Galaxy Book3. This was caused by `_parametric_only_fallback()` dumping the LLM's parametric knowledge of the entire product family, which then propagated through personas, writing patterns, and AML prompts.

### cera-no-sil — post-fix (75 errors total)
| Type | Count | Share |
|------|-------|-------|
| wrong_spec | 46 | 61.3% |
| hallucinated_feature | 28 | 37.3% |
| factual_error | 1 | 1.3% |

**Dominant pattern**: Stochastic hallucinations from the generation LLM's parametric knowledge. The most frequent error is **S-Pen hallucination** (~13 reviews across all sizes) — the LLM associates "Samsung" with "S-Pen" from its training data. Other common errors: wrong display specs (4K, 120Hz, 144Hz, OLED, 2880×1800, wrong size 13-14"), 32GB RAM (max is 16GB, ~6 reviews), wrong battery life (10-18 hrs instead of ~7), wrong weight (1.3-2.8 lbs instead of 3.46), wrong pricing ($1,199-$1,499 instead of $999.99), touchscreen claims, RTX/discrete GPU claims, and RGB keyboard. Errors are diverse but nearly universal when specs are attempted.

**Per-claim accuracy**: Only ~13% of post-fix reviews contain verifiable specs (vs ~69% in cera-full and ~98% in heuristic). Among reviews that do attempt specs, **~95% contain errors** — far worse than heuristic's 43%. The 15.09% aggregate error rate is an artifact of ~87% of reviews being spec-free opinion pieces.

### cera-sav (257 corrected errors total)
| Type | Count | Share |
|------|-------|-------|
| wrong_spec | 255 | 99.2% |
| hallucinated_feature | 1 | 0.4% |
| factual_error | 1 | 0.4% |

**Dominant pattern**: A single unverified price claim — "$750 to $1,000" — accounts for ~98% of all SAV errors (253/257). SAV (Single-Agent Verification) uses web search but skips MAV's multi-agent consensus, so this price range was accepted by the sole research model without cross-verification. MAV in cera-full rejected this same claim (it does not appear in cera-full's subject-context.json). The writing patterns then hard-coded 6 phrasings of "$750 to $1,000", causing ~55% of reviews across all sizes to contain this error. The remaining 4 errors are minor storage typos (528GB, 525GB instead of 512GB) — stochastic noise from the generation LLM, not SAV failures.

**Flagger consistency note**: The raw flagger subagents reported only 26 cera-sav errors because the 500-sent and 1000-sent flaggers failed to flag "$750 to $1,000" as wrong_spec, while the 100-sent flagger flagged all instances. Post-hoc grep confirmed ~55% of reviews contain "$750" across all sizes (18/32, 82/144, 153/290). The corrected totals above include all instances.

### heuristic (178 errors total)
| Type | Count | Share |
|------|-------|-------|
| hallucinated_feature | ~90 | ~51% |
| wrong_spec | ~70 | ~39% |
| factual_error | ~18 | ~10% |

**Dominant pattern**: Pervasive AMOLED display hallucination — roughly half of all heuristic reviews claim the Galaxy Book3 has an AMOLED display (it has IPS LCD). Secondary patterns include wrong CPU generation (11th/12th Gen instead of 13th Gen), incorrect resolution claims (2.8K, QHD+, 2560×1440), wrong weight (1.8kg, 4 lbs), and false claims about missing ports the laptop actually has (HDMI, USB-A, microSD, headphone jack). The heuristic generator appears to sample from Samsung's broader product vocabulary, where AMOLED displays are a brand signature on phones and premium laptops.

## Why Heuristic (47.98%) Appears to Beat SAV (55.79%)

The aggregate error rates are misleadingly close. The two conditions have fundamentally different failure profiles:

| Dimension | cera-sav (55.79%) | heuristic (47.98%) |
|-----------|-------------------|---------------------|
| **Error source** | 1 unverified fact ("$750 to $1,000") | 5+ wrong facts (AMOLED, CPU gen, resolution, ports, weight) |
| **Error diversity** | Monoculture — 98% of errors are the same price claim | Scattered — errors spread across many spec categories |
| **Clean reviews** | 45% of reviews have **zero** errors | Few reviews are fully clean; most have 1–3 errors |
| **Spec accuracy (excl. price)** | ~99% correct (display, CPU, ports, weight all correct) | ~52% correct (systematic AMOLED, wrong CPU gen, wrong resolution) |
| **Fixability** | Correct one fact in subject-context → ~0% errors | Structurally unfixable without adding SIL |

SAV's web search correctly identified hardware specs (15.6" IPS LCD, 1920×1080, i5-1335U/i7-1355U, 2×USB-C, 2×USB-A, 54Wh, etc.). MAV's multi-agent consensus would have filtered out the borderline price claim. In contrast, heuristic reviews contain **structurally diverse errors** because the generation LLM has no factual grounding at all — it guesses from parametric knowledge, producing AMOLED hallucinations in 25–46% of reviews and wrong CPU generations in 7–11%.

Post-hoc verification of SAV reviews without the "$750" mention (14/32 at 100-sent, 62/144 at 500-sent, 137/290 at 1000-sent) found **zero other factual errors** — confirming that SAV's web search grounding is effective for hardware specs and that the error profile is entirely attributable to a single unverified price claim that MAV would have caught.

## Why cera-no-sil v1 (90.71%) Was Worse Than Heuristic (47.98%) — and How the Fix Resolved It

Despite both lacking SIL web-search grounding, pre-fix cera-no-sil produced nearly double the error rate of heuristic. This was an architectural consequence of how the CERA composition pipeline amplifies unverified knowledge.

**Heuristic bypasses the composition phase entirely.** The generation LLM receives only a generic prompt template with zero structured spec information. Errors are opportunistic: the model occasionally guesses wrong (AMOLED because "Samsung = AMOLED" in training data), but it is never explicitly instructed to write wrong specs.

**Pre-fix cera-no-sil ran the full composition pipeline with `_parametric_only_fallback()`.** When SIL was disabled, the fallback asked a research LLM to dump everything it "knows" about the subject from training data. For "Galaxy Book3," the LLM returned specs for the entire product family (Pro, Ultra, 360) — 3K display, 120Hz, S Pen, RTX 40-series, AKG quad speakers, AMOLED, Thunderbolt 4. These wrong specs then cascaded through three amplification layers:

1. **Persona generation**: Wrong specs became "Verified Product Facts" → personas embedded them as character motivation (e.g., "chose it for the 3K AMOLED display")
2. **Writing patterns**: Wrong specs became canonical phrasings (e.g., `write "3K resolution display"`) → LLM was instructed to output them verbatim
3. **AML system prompt**: Wrong specs appeared as "Subject Intelligence" → generation LLM was commanded to reference them

The result: every review was systematically instructed to mention Pro/Ultra features as if they belong to the base model. The 90.71% error rate reflected the pipeline faithfully executing its design — propagating parametric knowledge through every composition artifact as if it were verified truth.

**Fix applied**: `_parametric_only_fallback()` now returns empty context instead of dumping parametric knowledge. Downstream prompts handle the empty case gracefully: personas focus on lifestyle context, writing patterns use domain-level patterns only, and AML prompts instruct the LLM to include details naturally from its own judgment at generation time.

**Post-fix result**: cera-no-sil dropped to **15.09%** aggregate — a 6× improvement over pre-fix (90.71%). However, spec density collapsed to ~13% (vs ~75% pre-fix and ~69% in cera-full). Among the ~13% of reviews that do attempt specs, ~95% contain errors. The fix eliminated the amplification loop but revealed a fundamental limitation: without SIL-verified facts, the generation LLM either avoids specs entirely or gets them wrong. The pipeline cannot conjure accurate specs from parametric knowledge — it can only stop amplifying wrong ones.

## Qualitative Failure Mode Comparison

| Dimension | cera-full | cera-no-sil (post) | cera-no-sil (pre) | cera-sav | heuristic |
|-----------|-----------|-------------------|-------------------|----------|-----------|
| **Primary failure** | Numerical typos | S-Pen hallucination, wrong display | Pro/Ultra spec conflation | Unverified price range | AMOLED hallucination |
| **Error consistency** | Stochastic, rare | Stochastic, frequent when specs attempted | Systematic, pervasive | Systematic, single-fact | Systematic, moderate |
| **VF%** | 72% | 20% | 82% | 88% | 97% |
| **Per-claim accuracy** | 98.2% correct | ~5% correct | 9.3% correct | 44.8% correct | 56.8% correct |
| **Feature hallucination** | Near-zero | S-Pen, touchscreen, 4K, RTX, RGB | S Pen, RTX, Thunderbolt, glass trackpad | Near-zero | AMOLED, wrong CPU gen |
| **Knowledge source** | SIL + MAV verified | LLM parametric (guardrailed) | LLM parametric (amplified) | SIL single-agent (no consensus) | Template + LLM parametric |

## Implications for the SIL Component

1. **SIL provides meaningful factual grounding.** The per-claim comparison is definitive: SIL achieves 1.8% per-claim errors with 69% spec density, while noSIL achieves ~95% per-claim errors with ~13% spec density. SIL doesn't just reduce errors — it enables spec-rich reviews that are also accurate. The aggregate 10× reduction (15.09% → 1.46%) understates SIL's value because it doesn't account for the spec density gap.

2. **The composition pipeline must not amplify unverified knowledge.** Pre-fix cera-no-sil (90.71%) was worse than heuristic (47.98%) because the pipeline treated parametric knowledge as verified truth and propagated it through personas, writing patterns, and AML prompts. The fix eliminated this amplification loop.

3. **Without SIL, the LLM produces either vague or inaccurate reviews — no middle ground.** Post-fix cera-no-sil's 15.09% aggregate error rate appears moderate, but per-claim analysis reveals ~95% of spec-containing reviews have errors (vs heuristic's 43%). The low aggregate rate is an artifact of ~87% of reviews being spec-free opinion pieces. Multiple attempts to increase spec density (domain-specific hints in Writing Guidelines, removing "Features to Mention" guardrails) did not meaningfully change the ~13% spec density. Removing guardrails actually increased errors by introducing S-Pen hallucinations. SIL remains the only mechanism that produces reviews that are both spec-rich and accurate.

4. **MAV consensus is essential — SAV alone is insufficient.** cera-sav uses real web search (unlike cera-no-sil) but skips multi-agent consensus, resulting in a ~55% error rate driven by a single unverified price claim. This demonstrates that web search alone does not guarantee factual accuracy — the 2/3 majority voting across multiple models is what filters out plausible-but-wrong facts. In this case, MAV's three-model consensus rejected the "$750 to $1,000" price range that SAV's single model accepted.

5. **A single unverified fact can dominate the error profile.** The cera-sav condition illustrates how the CERA pipeline amplifies factual errors: one wrong price range in the subject-context propagates into writing patterns (6 canonical phrasings) and then into ~55% of all generated reviews. This amplification loop is a feature when facts are verified (it ensures consistency) but a liability when verification is incomplete.

6. **Vague review rates inversely correlate with error rates.** cera-full produces the most vague reviews (28/478 = 5.86%) while cera-no-sil produces the fewest (7/463 = 1.51%). This suggests that when the LLM has no factual grounding, it compensates by confidently stating wrong specs rather than producing vague content — a more dangerous failure mode for downstream tasks.

## Study Limitations

- **Single domain**: Results are from the laptop domain only (Samsung Galaxy Book3). Error patterns may differ for restaurant or hotel reviews where product specifications are less technical.
- **Single generation LLM**: All datasets were generated with the same LLM (Qwen 3.5 35B A3B via CERA pipeline). Different LLMs may have different parametric knowledge about this product.
- **Flagger bias**: Claude Opus 4.6 was used as the flagger. While thorough, it may have its own biases in what constitutes a "factual error" vs. acceptable paraphrasing.
- **Flagger consistency**: Each dataset was flagged by a separate subagent. The cera-sav condition revealed significant inter-subagent inconsistency: the 100-sent flagger flagged all "$750 to $1,000" price mentions as wrong_spec, while the 500/1000-sent flaggers did not. Corrected counts were derived via post-hoc grep. Other conditions may have similar but undetected inconsistencies.
- **Spec ambiguity**: The "$750 to $1,000" price range is borderline — the factsheet documents $999.99 MSRP for the i7/16GB/512GB configuration, and lower configurations may have been available near $750. However, the factsheet does not substantiate a $750 starting price, and consistency across conditions requires uniform treatment.
- **Vague review classification**: The boundary between "vague but acceptable" and "vague enough to flag" is subjective. Vague reviews are excluded from error rate calculations.

## Raw Data Reference

- **Report directory**: `public-subtrees/cera/ablation-studies/no-sil/20260324-184650-claude-opus-4.6-galaxy-book3/`
- **Factsheet**: `factsheet.md` (44 claims, Samsung Galaxy Book3 2023)
- **Per-dataset details**: `datasets/laptop/{mode}/{size}-sent.json`
- **Summary data**: `summary.json`, `summary.csv`
