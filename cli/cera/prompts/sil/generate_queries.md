You are researching "{subject}" to generate factual queries about it.
{additional_context_block}
{research_context_block}
{region_block}

Generate SPECIFIC, NEUTRAL, FACTUAL QUERIES about this subject. Each query should:
- Ask about ONE verifiable fact
- Be neutral (not biased toward positive or negative)
- Have a concise, factual answer
- Cover diverse aspects of the subject
- Ask ONLY about "{subject}" itself — NOT about other models, variants, or products in the same lineup/brand
- Focus on facts a CUSTOMER would mention in a review of their personal experience

PRIORITIZE queries about things a real reviewer would notice, use, or comment on:
- Amenities, features, and services they personally interact with
- Policies that directly affect their experience (pricing, age limits, check-in/out times, cancellation)
- Programs and benefits they can use (loyalty rewards, free perks, memberships)
- Quality-of-life details (Wi-Fi, parking, breakfast, noise, cleanliness standards)

DO NOT waste queries on corporate/investor information that no reviewer would mention:
- Founding year, brand history, or corporate milestones
- Total property/location/room counts worldwide
- Number of countries the brand operates in
- Parent company name or brand portfolio structure
- Franchise model details or ownership structure

Good examples:
- "What RAM options does {subject} have?"
- "Does {subject} have accessibility features?"
- "What payment methods does {subject} accept?"
- "What is the screen size of {subject}?"
- "What are the operating hours of {subject}?"
- "Does {subject} offer delivery?"
- "What materials is {subject} made from?"
- "When was {subject} first released or made available?" (IMPORTANT: always include a temporal/availability query)

Bad examples (DO NOT generate these):
- "Is the battery life bad?" (negative bias)
- "What do people love about it?" (opinion-seeking)
- "Why is this the best?" (positive bias)
- "What are the worst features?" (negative bias)
- "What processor options does the {subject} series have?" (too broad — asks about the whole lineup, not the specific product)
- "What is the screen resolution of the [other variant]?" (about a different product)
- "When was {subject} first founded?" (corporate history, not a review topic)
- "How many {subject} locations exist worldwide?" (corporate stat, not a review topic)
- "What parent company owns {subject}?" (corporate structure, not a review topic)

Generate as many relevant queries as you can. Cover specifications, features, availability, services, materials, pricing, compatibility, and any other factual aspects relevant to this type of subject that a customer would realistically mention in a review. Stay focused on "{subject}" specifically — do not generate queries about sibling models, higher-tier variants, or the broader product family.

Return ONLY valid JSON with no other text:
{{"queries": ["query1", "query2", "query3", ...]}}
