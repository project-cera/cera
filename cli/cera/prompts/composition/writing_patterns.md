Generate natural writing variation patterns for the subject "{subject}" based ONLY on the verified facts below.

{reference_context}

## Verified Facts (from multi-agent verification)
{subject_facts}

## Your Task
For each verified fact that contains a specific number, measurement, brand name, or quantity, provide multiple natural ways real reviewers would write it.

## Requirements
For each pattern category:
- **context**: When this pattern applies (1 sentence)
- **options**: 4-6 natural variations real reviewers would use, ranging from formal to casual

## CRITICAL RULES
- ONLY create patterns for specs and facts listed in the "Verified Facts" section above
- Do NOT invent, assume, or fill in specs that are not in the verified facts
- If the verified facts say "15.6-inch display", do NOT generate patterns for a 14-inch or 16-inch display
- If the verified facts do not mention a spec (e.g., battery life, price, brightness), do NOT create a pattern for it
- Include both formal ("16GB RAM") and casual ("16 gigs") variants
- Include common misspellings or informal abbreviations real people use
- Consider the region ({region}) for currency, units, and terminology
- Generate patterns ONLY for facts that have concrete values (skip vague facts like "good build quality")

## Output Format
Return a JSON object. Output ONLY the JSON, no other text.

```json
{{
  "domain": "{domain}",
  "patterns": {{
    "category_name": {{
      "context": "When referring to ...",
      "options": ["formal version", "casual version", "abbreviated", "colloquial"]
    }}
  }}
}}
```
