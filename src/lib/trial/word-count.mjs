// Throwaway fixture for the self-heal trial PR — do not merge.
export function wordCount(text) {
  return text.split(' ').length; // bug: empty string → 1, multiple spaces/newlines overcount
}
