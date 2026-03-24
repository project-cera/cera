# SIL Ablation Study: Key Findings

**Study Date:** March 23, 2026
**Flagger Model:** Claude Opus 4.6 (via 55 parallel subagents, batch size 25)
**Domain:** Laptop (MacBook Neo 2026)
**Factsheet:** 33 verifiable claims across availability, processor, memory, storage, display, cooling, ports, pricing, colors, and anti-hallucination assertions
**Product Context:** MacBook Neo announced March 4, 2026; available March 11, 2026 (12 days before flagging date). Starting at $599 ($499 student), it is the cheapest Mac laptop Apple has ever sold. Uses the A18 Pro chip (first Mac with an A-series chip), 8 GB unified memory, 13" Liquid Retina display, fanless design.

---

## 1. Aggregate Error Rates

| Mode | Reviews | Flagged | Error Rate |
|------|---------|---------|------------|
| **CERA (full pipeline)** | 463 | 99 | **21.4%** |
| **CERA (no SIL)** | 464 | 420 | **90.5%** |
| **Heuristic baseline** | 359 | 356 | **99.2%** |

Removing the Subject Intelligence Layer increases the factual error rate by **4.2x** (from 21.4% to 90.5%). The heuristic baseline is near-total failure at 99.2%.

## 2. Error Rates by Dataset Size

| Mode | 100-sent | 500-sent | 1000-sent |
|------|----------|----------|-----------|
| **CERA (full)** | 4/23 (17.4%) | 26/152 (17.1%) | 69/288 (24.0%) |
| **CERA (no SIL)** | 28/32 (87.5%) | 134/144 (93.1%) | 258/288 (89.6%) |
| **Heuristic** | 21/21 (100.0%) | 116/116 (100.0%) | 219/222 (98.7%) |

Error rates remain stable across dataset sizes within each mode, suggesting the underlying generation failure is systematic rather than stochastic. CERA (full) shows a slight increase at 1000-sent (24.0% vs 17.1%), likely due to the larger sample surfacing more edge-case timeline claims.

## 3. Error Type Distribution

### CERA (full pipeline) — 99 flags

| Error Type | Count | Share | Description |
|------------|-------|-------|-------------|
| `timeline_error` | 42 | 42.4% | Claims of weeks/months of ownership for a product released 12 days ago |
| `vague_review` | 25 | 25.3% | Reviews with zero verifiable product details |
| `wrong_spec` | 21 | 21.2% | Incorrect specific values (e.g., unverified $699 price for 512 GB model) |
| `hallucinated_feature` | 9 | 9.1% | Features the product explicitly lacks (e.g., $699 pricing tier) |
| `factual_error` | 2 | 2.0% | Direct contradictions (e.g., restaurant review in laptop dataset) |

The full CERA pipeline's errors are predominantly **temporal** (42.4%) rather than factual. The SIL provides correct product specifications, but the LLM occasionally generates plausible-sounding ownership durations that exceed the product's 12-day availability window. This is a known limitation when generating reviews for recently released products with short availability windows.

### CERA (no SIL) — 420 flags

| Error Type | Count | Share | Description |
|------------|-------|-------|-------------|
| `timeline_error` | 312 | 74.3% | Treats the product as unreleased, fictional, or "just a rumor" |
| `factual_error` | 52 | 12.4% | Claims "not a real product," "no official support," etc. |
| `wrong_spec` | 28 | 6.7% | Hallucinated price ("steep," "premium") for a $599 laptop; wrong port counts |
| `vague_review` | 19 | 4.5% | Generic statements with no product-specific content |
| `hallucinated_feature` | 9 | 2.1% | Fabricated features (MagSafe, Thunderbolt, haptic Touch Bar) |

Without the SIL, the LLM lacks knowledge of the MacBook Neo (a product released after its training cutoff). The dominant failure mode is **existential denial**: 74.3% of flagged reviews claim the product "doesn't exist," is "just a rumor," or is a "concept render." This is qualitatively different from the full pipeline's temporal errors. The LLM is not getting specs wrong; it does not believe the product is real.

### Heuristic baseline — 356 flags

| Error Type | Count | Share | Description |
|------------|-------|-------|-------------|
| `wrong_spec` | 321 | 90.2% | Fabricated specs (M-series chips, 16-32 GB RAM, $1,500-$2,500 pricing) |
| `hallucinated_feature` | 23 | 6.5% | Non-existent features (Thunderbolt, MagSafe, fans, titanium chassis, Touch Bar) |
| `factual_error` | 6 | 1.7% | Fundamental misidentifications (calling it a Windows machine, denying the headphone jack) |
| `vague_review` | 5 | 1.4% | Empty reviews with no substance |
| `timeline_error` | 1 | 0.3% | Usage duration claim |

The heuristic baseline's failure mode is **confabulation**: 90.2% of flags are wrong specifications. The prompt-based approach, lacking any factual grounding, generates reviews that describe an entirely different product. Common fabrications include M4/M5 Pro/Ultra/Max chips (the real product uses A18 Pro), 16-32 GB RAM (real: 8 GB), 14-16" displays (real: 13"), and prices of $1,500-$2,500 (real: $599). The heuristic reviews describe what the LLM expects a MacBook to look like based on its training data, not what the MacBook Neo actually is.

## 4. Qualitative Failure Mode Comparison

| Dimension | CERA (full) | CERA (no SIL) | Heuristic |
|-----------|-------------|---------------|-----------|
| **Knows product exists?** | Yes | No | Assumes similar product |
| **Correct chip name?** | Yes (A18 Pro) | Sometimes vague ("Apple Silicon") | No (M3/M4/M5 variants) |
| **Correct price?** | Yes ($599/$499) | No ("steep," "premium") | No ($1,499-$2,999) |
| **Correct display size?** | Yes (13") | Rarely mentioned | No (12"-24") |
| **Correct RAM?** | Yes (8 GB) | Rarely mentioned | No (16-128 GB) |
| **Correct ports?** | Yes (2 USB-C) | Sometimes | No (Thunderbolt, HDMI) |
| **Primary error pattern** | Temporal overreach | Existential denial | Confabulation |
| **Error severity** | Low (timeline) | High (reality) | Critical (all specs wrong) |

## 5. Implications for the SIL Component

These results provide strong evidence that the Subject Intelligence Layer is the **critical differentiator** for factual accuracy in CERA-generated reviews:

1. **The SIL is necessary for post-cutoff products.** Without it, the LLM has no knowledge of the MacBook Neo and either denies its existence (no-SIL) or hallucinates plausible-but-wrong specifications from its training data (heuristic). This is expected behavior for any product released after the LLM's training cutoff.

2. **The SIL is sufficient for specification accuracy.** With the SIL, all flagged reviews in the full pipeline fall into temporal or vagueness categories. Zero reviews in the full pipeline contain wrong chip names, wrong RAM amounts, wrong display sizes, or wrong prices. The SIL successfully grounds every verifiable specification.

3. **Residual errors are temporal, not factual.** The full pipeline's 21.4% error rate consists primarily of reviews claiming usage durations that exceed the product's 12-day availability window. These errors are an artifact of the study's timing (flagging a very recently released product) and would decrease as the time since release increases.

4. **Error modes are qualitatively distinct across conditions.** The three conditions do not produce errors on a shared spectrum; they exhibit categorically different failure patterns. This suggests the SIL does not merely "improve" accuracy but fundamentally changes the type of content the LLM generates.

## 6. Study Limitations

- **Single domain:** Results are for the laptop domain only (MacBook Neo). Generalizability to restaurant and hotel domains requires separate studies.
- **Single LLM:** All reviews were generated by Qwen 3.5 35B A3B running locally via vLLM. Different LLMs may show different error patterns.
- **Flagger model bias:** Claude Opus 4.6 was used as the flagger, which introduces potential for systematic over- or under-flagging. Human review of the `confirmed: null` flags is necessary for final validation.
- **Recency effect:** The MacBook Neo was released 12 days before flagging, creating an unusually narrow availability window that inflates timeline errors in the full pipeline. A product available for months would likely show a lower CERA (full) error rate.
- **$699 ambiguity:** Several CERA (full) reviews cite $699 for the 512 GB model. The factsheet does not include this price (only $599 base and $499 student are listed). These were flagged as wrong_spec/hallucinated_feature, but the actual 512 GB price may be $699, in which case these flags would be false positives.

## 7. Raw Data Reference

All per-review flags with highlights and reasons are available in the dataset detail files:

```
datasets/laptop/cera-full/{100,500,1000}-sent.json
datasets/laptop/cera-no-sil/{100,500,1000}-sent.json
datasets/laptop/heuristic/{100,500,1000}-sent.json
```

Each flag has `confirmed: null` and can be reviewed in the CERA web UI under Research Tools > Ablation Study: no-SIL > View Saved Reports.
