const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
const AUDIO_CACHE_LIMIT = 36;

declare global {
  interface Window {
    __rgnfixOpenAiSpeechInstalled?: boolean;
  }
}

function speechEvent(type: string): SpeechSynthesisEvent {
  return new Event(type) as SpeechSynthesisEvent;
}

function speechErrorEvent(): SpeechSynthesisErrorEvent {
  return new Event("error") as SpeechSynthesisErrorEvent;
}

export function installOpenAiSpeechSynthesis() {
  if (typeof window === "undefined" || window.__rgnfixOpenAiSpeechInstalled) return;
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;

  const synthesis = window.speechSynthesis;
  const nativeCancel = synthesis.cancel.bind(synthesis);
  const audio = new Audio();
  const cachedUrls = new Map<string, string>();
  let controller: AbortController | null = null;
  let sequence = 0;
  let activeUtterance: SpeechSynthesisUtterance | null = null;
  let unlocked = false;

  const unlockAudio = () => {
    if (unlocked) return;
    unlocked = true;
    audio.muted = true;
    audio.src = SILENT_WAV;
    void audio.play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      })
      .catch(() => {
        audio.muted = false;
      });
  };

  window.addEventListener("pointerdown", unlockAudio, { once: true, capture: true });
  window.addEventListener("keydown", unlockAudio, { once: true, capture: true });

  const cancelOpenAiSpeech = () => {
    sequence += 1;
    controller?.abort();
    controller = null;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    activeUtterance = null;
    nativeCancel();
  };

  const rememberAudio = (text: string, url: string) => {
    if (cachedUrls.size >= AUDIO_CACHE_LIMIT) {
      const oldestKey = cachedUrls.keys().next().value as string | undefined;
      if (oldestKey) {
        const oldestUrl = cachedUrls.get(oldestKey);
        if (oldestUrl) URL.revokeObjectURL(oldestUrl);
        cachedUrls.delete(oldestKey);
      }
    }
    cachedUrls.set(text, url);
  };

  const playAudio = async (utterance: SpeechSynthesisUtterance, url: string, requestSequence: number) => {
    if (requestSequence !== sequence) return;
    activeUtterance = utterance;
    audio.pause();
    audio.src = url;
    audio.volume = Number.isFinite(utterance.volume) ? Math.min(1, Math.max(0, utterance.volume)) : 1;
    audio.currentTime = 0;
    audio.onplay = () => {
      if (requestSequence === sequence) utterance.onstart?.(speechEvent("start"));
    };
    audio.onended = () => {
      if (requestSequence !== sequence) return;
      activeUtterance = null;
      utterance.onend?.(speechEvent("end"));
    };
    audio.onerror = () => {
      if (requestSequence !== sequence) return;
      activeUtterance = null;
      utterance.onerror?.(speechErrorEvent());
    };

    try {
      await audio.play();
    } catch (error) {
      console.error("[OpenAI Voice] Audio playback failed:", error);
      utterance.onerror?.(speechErrorEvent());
    }
  };

  const speakWithOpenAi = async (utterance: SpeechSynthesisUtterance) => {
    const text = utterance.text.replace(/\s+/g, " ").trim();
    if (!text) return;

    sequence += 1;
    const requestSequence = sequence;
    controller?.abort();
    controller = new AbortController();
    audio.pause();

    const cached = cachedUrls.get(text);
    if (cached) {
      await playAudio(utterance, cached, requestSequence);
      return;
    }

    try {
      const response = await fetch("/api/ai/speech", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
        credentials: "include",
        signal: controller.signal,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error || `Seslendirme isteği başarısız: ${response.status}`);
      }

      const blob = await response.blob();
      if (requestSequence !== sequence) return;
      const url = URL.createObjectURL(blob);
      rememberAudio(text, url);
      await playAudio(utterance, url, requestSequence);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("[OpenAI Voice] Natural speech failed:", error);
      if (requestSequence === sequence) utterance.onerror?.(speechErrorEvent());
    }
  };

  try {
    Object.defineProperty(synthesis, "speak", {
      configurable: true,
      value: (utterance: SpeechSynthesisUtterance) => {
        void speakWithOpenAi(utterance);
      },
    });
    Object.defineProperty(synthesis, "cancel", {
      configurable: true,
      value: cancelOpenAiSpeech,
    });
    window.__rgnfixOpenAiSpeechInstalled = true;
  } catch (error) {
    console.error("[OpenAI Voice] Speech engine could not be installed:", error);
  }

  window.addEventListener("beforeunload", () => {
    cancelOpenAiSpeech();
    cachedUrls.forEach(url => URL.revokeObjectURL(url));
    cachedUrls.clear();
  });

  void activeUtterance;
}
