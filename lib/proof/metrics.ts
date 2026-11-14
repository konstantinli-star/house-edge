// Combines transcript + audio analysis into one metrics record per attempt.

import { countWords, detectFillers, type Token } from "./fillers";
import type { Prosody } from "./prosody";
import { initialRating, scoreSpeech, type Scores } from "./score";

export type TranscriptSource = "openai" | "web-speech";

export type SpeechMetrics = {
  words: number;
  wpm: number;
  fillers: number;
  fillersPerMin: number;
  fillersByWord: Record<string, number>;
  hesitationSource: "transcript" | "audio-estimate";
  pauses: Prosody["pauses"];
  speakingSec: number;
  pitchVariabilitySt: number | null;
  scores: Scores;
  rating: number;
  tokens: Token[];
  transcriptSource: TranscriptSource;
};

export const MIN_SPEAKING_SEC = 10;

export class NotEnoughSpeechError extends Error {
  constructor() {
    super("We could not hear enough speech. Check your mic and speak for at least 10 seconds.");
  }
}

export function computeMetrics(transcript: string, source: TranscriptSource, prosody: Prosody): SpeechMetrics {
  const words = countWords(transcript);
  const speakingSec = prosody.speakingSpanSec;
  if (speakingSec < MIN_SPEAKING_SEC || words < 10) throw new NotEnoughSpeechError();

  const minutes = speakingSec / 60;
  const found = detectFillers(transcript);

  // Browser speech recognition drops "um/uh". In that case use the audio
  // estimate when it found more hesitations than the transcript did.
  const useAudio = source === "web-speech" && prosody.hesitationSounds > found.hesitations;
  const hesitations = useAudio ? prosody.hesitationSounds : found.hesitations;
  const fillers = found.lexical + hesitations;
  const byWord = { ...found.byWord };
  if (useAudio) byWord["um/uh"] = prosody.hesitationSounds;

  const wpm = Math.round(words / minutes);
  const fillersPerMin = Math.round((fillers / minutes) * 10) / 10;
  const scores = scoreSpeech({ fillersPerMin, wpm, pitchVariabilitySt: prosody.pitchVariabilitySt });

  return {
    words,
    wpm,
    fillers,
    fillersPerMin,
    fillersByWord: byWord,
    hesitationSource: useAudio ? "audio-estimate" : "transcript",
    pauses: prosody.pauses,
    speakingSec: Math.round(speakingSec),
    pitchVariabilitySt: prosody.pitchVariabilitySt,
    scores,
    rating: initialRating(scores.composite),
    tokens: found.tokens,
    transcriptSource: source,
  };
}
