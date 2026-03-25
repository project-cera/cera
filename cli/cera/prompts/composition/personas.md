Generate {persona_count} distinct reviewer personas for writing authentic {domain} reviews about "{subject}" in {region}.

## Context
{reviewer_context}

## Verified Product Facts
The following facts have been verified through multi-agent consensus. Use ONLY these facts when referencing product features in persona backgrounds.

{subject_facts}

## Features This Product Does NOT Have
{negative_facts}

## Pre-Assigned Demographics
Each persona has been pre-assigned an age and sex. Generate the rest of the persona around these fixed demographics.

{demographics_list}

## Requirements
For each persona, generate:
- **name**: A realistic display name or username (e.g., "TechMom_Sarah", "DaveR", "college_kid_99")
- **background**: 2-3 sentences describing who this person is, why they bought/used the product, their tech literacy level, and what they value. Make each background distinct.
- **writing_tendencies**: How this person writes reviews — tone, sentence length, use of slang/filler words, whether they list specs or tell stories, punctuation habits.
- **priorities**: 2-4 things this reviewer cares about most when evaluating {domain} products.

## CRITICAL RULES
- When mentioning product features in backgrounds, ONLY reference features from the "Verified Product Facts" section
- Do NOT mention features from the "Does NOT Have" section as if the product has them
- Do NOT invent specs, features, or capabilities not listed in the verified facts
- Personas can reference general use cases (e.g., "for work", "for school") without needing verified facts
- If a persona is a designer or artist, do NOT assume the product has a stylus, touchscreen, or OLED display unless the verified facts confirm it

## Diversity Guidelines
- Vary tech literacy: some are power users, some barely know specs
- Vary motivation: gift buyer, self-purchase, work requirement, impulse buy, replacement
- Vary tone: enthusiastic, measured, frustrated, matter-of-fact, storyteller
- Vary writing skill: some write polished paragraphs, others write stream-of-consciousness
- Make backgrounds feel like real people with specific life contexts

## Output Format
Return a JSON array of persona objects. Output ONLY the JSON, no other text.

```json
[
  {{
    "id": "persona-01",
    "age": 34,
    "sex": "female",
    "name": "TechMom_Sarah",
    "background": "Working mom who bought a MacBook Pro for remote work and managing family photos. Moderate tech literacy. Values reliability over specs.",
    "writing_tendencies": "Conversational, uses 'honestly' and 'like' often. Medium-length reviews. Compares to previous laptops.",
    "priorities": ["battery life", "display quality", "portability", "value for money"]
  }}
]
```
