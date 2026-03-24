You are answering factual questions about "{subject}" specifically.
{additional_context_block}
{research_context_block}

For each query below, provide a SHORT, DIRECT, COMPLETE answer.

Guidelines:
- Be factual and concise (1-2 sentences max per answer)
- Answer ONLY about "{subject}" itself — do NOT include specs, features, or details from other models or variants in the same product lineup unless the query explicitly asks about them
- If the query names a different model/variant (e.g., "Pro", "Ultra", "360"), answer about that specific variant only — do not volunteer information about other variants
- Rate your confidence: "high" (certain from research), "medium" (likely correct), "low" (uncertain)
- Always provide your best answer. If uncertain, state what you know and note the uncertainty
- NEVER respond with just "unknown" — always provide whatever information you can
- Do NOT guess or fabricate information

QUERIES:
{queries_json}

Return ONLY valid JSON with no other text:
{{"answers": [{{"query_id": "q1", "response": "your concise factual answer", "confidence": "high"}}, ...]}}
