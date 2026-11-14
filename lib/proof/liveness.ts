// Liveness check: each take starts with a random phrase read aloud.
// A pre-recorded clip cannot know the phrase in advance.

const WORDS = [
  "amber", "falcon", "harbor", "violet", "copper", "meadow", "rocket", "silver", "canyon", "maple",
  "orbit", "pepper", "lantern", "glacier", "tiger", "velvet", "cedar", "comet", "marble", "willow",
  "seven", "eleven", "twenty", "ninety", "purple", "golden", "quiet", "rapid", "gentle", "bright",
];

export function randomPhrase(count = 4, rand = Math.random): string {
  const pool = [...WORDS];
  const picked: string[] = [];
  while (picked.length < count) picked.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  return picked.join(" ");
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);

// Passes if most phrase words appear near the start of the transcript.
export function checkLiveness(phrase: string, transcript: string): { passed: boolean; matched: number } {
  const expected = norm(phrase);
  const opening = new Set(norm(transcript).slice(0, expected.length + 12));
  const matched = expected.filter((w) => opening.has(w)).length;
  return { passed: matched / expected.length >= 0.6, matched };
}
