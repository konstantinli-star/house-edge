// Live captions via the browser's Web Speech API (Chrome, Edge, Safari).
// Chrome ends recognition after silences, so we restart it while active.

export const hasWebSpeech = () =>
  typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

export type Captions = {
  stop: () => Promise<string>; // resolves with the final transcript
};

export function startCaptions(onUpdate: (finalText: string, interim: string) => void): Captions | null {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = true;

  let finalText = "";
  let interim = "";
  let active = true;
  let onEnded: (() => void) | null = null;

  recognition.onresult = (e) => {
    interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const text = e.results[i][0].transcript.trim();
      if (e.results[i].isFinal) finalText = `${finalText} ${text}`.trim();
      else interim = `${interim} ${text}`.trim();
    }
    onUpdate(finalText, interim);
  };
  recognition.onerror = (e) => {
    if (e.error === "not-allowed" || e.error === "service-not-allowed") active = false;
  };
  recognition.onend = () => {
    if (active) {
      try {
        recognition.start();
        return;
      } catch {
        active = false;
      }
    }
    onEnded?.();
  };
  recognition.start();

  return {
    stop: () =>
      new Promise((resolve) => {
        active = false;
        // Keep words that were still being recognised when the user stopped.
        const finish = () => resolve(`${finalText} ${interim}`.trim());
        onEnded = finish;
        recognition.stop();
        setTimeout(finish, 1500); // safety net if "end" never fires
      }),
  };
}
