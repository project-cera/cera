Write a review for "{subject}" as the following reviewer:
{persona_block}

## Sentence Plan
Write exactly {num_sentences} sentences following this plan:
{aspect_sentence_plan}

### Writing Guidelines
**Authenticity:** Write as an authentic customer. Use contractions, filler words, and casual grammar where natural. Occasional fragments, run-ons, or informal punctuation if the persona would write that way. Do NOT include ratings, stars, or scores. Do NOT mention you are an AI.
{detail_hint}
{temporal_hint}
**Opening:** {opening_directive}
**Capitalization:** {capitalization_style}
{writing_pattern_assignments}

{structure_variant}

{features_to_mention}

{style_examples}

## Output Format
Output ONLY a JSON object with per-sentence aspect annotations.
{dataset_mode_instruction}

```json
{output_example}
```

{vocab_diversity}

{neb_context}
