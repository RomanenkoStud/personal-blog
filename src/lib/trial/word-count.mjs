// Throwaway fixture for the self-heal trial PR — do not merge.
export function wordCount(text) {
  const trimmed = text.trim();
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
}
