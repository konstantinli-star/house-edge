// Filler-word detection on a transcript.
// "um/uh" style sounds always count. Words like "like" and "so" count only
// in filler positions, so normal usage ("looks like", "so that") is not penalised.

export type Token = { text: string; filler: boolean };

export type FillerResult = {
  tokens: Token[];
  hesitations: number; // um, uh, er, ah...
  lexical: number; // like, you know, basically...
  total: number;
  byWord: Record<string, number>;
};

const HESITATIONS = new Set(["um", "umm", "uh", "uhh", "er", "erm", "ah", "hmm", "mm"]);
const ALWAYS_FILLERS = new Set(["basically", "actually", "literally"]);
const PHRASES: string[][] = [["you", "know"], ["i", "mean"]];
// "you know how/what...", "I mean it/that" carry meaning; otherwise the phrase is a filler.
const PHRASE_OK_BEFORE = new Set(["how", "what", "why", "where", "when", "who", "that", "it", "the", "him", "her", "them", "about", "to"]);

// Words after which "like" is a real verb/preposition, not a filler.
const LIKE_OK_BEFORE = new Set([
  "would", "i'd", "we'd", "you'd", "i", "you", "we", "they", "don't", "didn't", "not",
  "look", "looks", "looked", "feel", "feels", "felt", "sound", "sounds", "seem", "seems",
  "something", "anything", "nothing", "things", "more", "much", "just", "is", "was",
]);
// Words after which "so" is not a filler ("so that", "so much").
const SO_OK_AFTER = new Set(["that", "much", "many", "far", "good", "bad", "long", "well", "i", "do", "it"]);

const normalize = (w: string) => w.toLowerCase().replace(/[^a-z']/g, "");

export function detectFillers(transcript: string): FillerResult {
  const raw = transcript.split(/\s+/).filter(Boolean);
  const words = raw.map(normalize);
  const filler = new Array<boolean>(raw.length).fill(false);
  const byWord: Record<string, number> = {};
  let hesitations = 0;
  let lexical = 0;

  // A word starts a clause if it is first or the previous token ends with punctuation.
  const clauseStart = (i: number) => i === 0 || /[.,!?;:—-]$/.test(raw[i - 1]);
  const mark = (i: number, len: number, key: string, hesitation: boolean) => {
    for (let k = 0; k < len; k++) filler[i + k] = true;
    byWord[key] = (byWord[key] ?? 0) + 1;
    if (hesitation) hesitations++;
    else lexical++;
  };

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (filler[i] || !w) continue;

    if (HESITATIONS.has(w)) {
      mark(i, 1, w.startsWith("u") ? "um/uh" : w, true);
      continue;
    }
    const phrase = PHRASES.find((p) => p.every((part, k) => words[i + k] === part));
    if (phrase && !PHRASE_OK_BEFORE.has(words[i + 2] ?? "")) {
      mark(i, 2, phrase.join(" "), false);
      i++;
      continue;
    }
    if (ALWAYS_FILLERS.has(w)) {
      mark(i, 1, w, false);
      continue;
    }
    if (w === "like" && i > 0 && !LIKE_OK_BEFORE.has(words[i - 1])) {
      mark(i, 1, "like", false);
      continue;
    }
    if (w === "so" && clauseStart(i) && !SO_OK_AFTER.has(words[i + 1] ?? "")) {
      mark(i, 1, "so", false);
    }
  }

  return {
    tokens: raw.map((text, i) => ({ text, filler: filler[i] })),
    hesitations,
    lexical,
    total: hesitations + lexical,
    byWord,
  };
}

export function countWords(transcript: string): number {
  return transcript.split(/\s+/).map(normalize).filter(Boolean).length;
}
