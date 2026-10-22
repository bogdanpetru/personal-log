const MIN_PARTIAL_OVERLAP = 12;

/** Longest prefix of `next` that already ends `base`, comparing exact text. */
function overlapLength(base: string, next: string): number {
  const max = Math.min(base.length, next.length);
  for (let k = max; k > 0; k -= 1) {
    if (base.endsWith(next.slice(0, k))) {
      return k;
    }
  }
  return 0;
}

/**
 * Joins committed transcript text with newly recognized text, trimming the
 * overlap when the recognition engine repeats what was already committed —
 * it re-delivers the tail of the utterance when speech goes quiet or after
 * an internal restart. A full repeat always counts as a re-delivery; a
 * partial overlap only does once it is at least `minPartialOverlap`
 * characters — long enough that speech could not legitimately be repeating a
 * short phrase. Callers that know a re-delivery just happened (a recognition
 * restart) pass 1: any restatement of the committed tail is then trimmed. A
 * base ending in a line break (an inserted paragraph) joins directly, without
 * a separating space.
 */
export function appendTranscript(
  base: string,
  next: string,
  minPartialOverlap = MIN_PARTIAL_OVERLAP,
): string {
  if (next === "") {
    return base;
  }
  if (base === "") {
    return next;
  }
  const separator = base.endsWith("\n") ? "" : " ";
  const overlap = overlapLength(base, next);
  if (overlap === next.length) {
    return base;
  }
  if (overlap >= minPartialOverlap) {
    // The trimmed tail resumes where the overlap ended, so its own leading
    // whitespace would double the separator.
    const remainder = next.slice(overlap).replace(/^\s+/, "");
    if (remainder === "") {
      return base;
    }
    return base + separator + remainder;
  }
  return base + separator + next;
}