/**
 * Parse a JSONL file and extract review texts.
 * Looks for `review_text`, `text`, or `content` fields in each JSON line.
 */
export async function parseJsonlFile(
  file: File,
): Promise<{ index: number; text: string }[]> {
  const raw = await file.text()
  const lines = raw.trim().split('\n')
  const reviews: { index: number; text: string }[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    try {
      const obj = JSON.parse(line)
      const text = obj.review_text ?? obj.text ?? obj.content
      if (typeof text === 'string' && text.length > 0) {
        reviews.push({ index: i, text })
      }
    } catch {
      // Skip malformed lines
    }
  }

  return reviews
}
