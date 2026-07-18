import { describe, expect, it } from "vitest";
import { getSpeechSettings, normalizeSpeechText } from "./openAiSpeech";

describe("RGNFIX OpenAI doğal ses", () => {
  it("ses metnindeki gereksiz boşlukları temizler", () => {
    expect(normalizeSpeechText("  Merhaba   ölçüyü birlikte alalım.  ")).toBe("Merhaba ölçüyü birlikte alalım.");
  });

  it("boş ve aşırı uzun metni reddeder", () => {
    expect(() => normalizeSpeechText("   ")).toThrow();
    expect(() => normalizeSpeechText("a".repeat(1201))).toThrow();
  });

  it("varsayılan olarak güncel TTS modeli ve marin sesini kullanır", () => {
    const previousModel = process.env.OPENAI_TTS_MODEL;
    const previousVoice = process.env.OPENAI_TTS_VOICE;
    delete process.env.OPENAI_TTS_MODEL;
    delete process.env.OPENAI_TTS_VOICE;
    expect(getSpeechSettings()).toMatchObject({
      model: "gpt-4o-mini-tts-2025-12-15",
      voice: "marin",
    });
    if (previousModel === undefined) delete process.env.OPENAI_TTS_MODEL;
    else process.env.OPENAI_TTS_MODEL = previousModel;
    if (previousVoice === undefined) delete process.env.OPENAI_TTS_VOICE;
    else process.env.OPENAI_TTS_VOICE = previousVoice;
  });
});
