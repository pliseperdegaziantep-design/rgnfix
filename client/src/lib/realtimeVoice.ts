type VoiceState = "idle" | "connecting" | "listening" | "speaking" | "muted" | "error";

type VoiceStateListener = (state: VoiceState) => void;
type TranscriptListener = (event: { role: "user" | "assistant"; text: string }) => void;
type ErrorListener = (message: string) => void;

const SESSION_INSTRUCTIONS = [
  "Sen RGNFIX canlı ürün ve ölçü danışmanısın.",
  "Yalnızca Türkçe konuş; kelimeleri açık, doğru ve doğal telaffuz et.",
  "Sıcak, samimi ve profesyonel bir satış danışmanı gibi konuş.",
  "Her cevap en fazla iki kısa cümle olsun ve tek seferde en fazla bir soru sor.",
  "Müşteri konuşurken araya girme; sözünün bittiğinden emin olduktan sonra cevap ver.",
  "Gereksiz teknik açıklama, uzun liste, tadilat, fabrika veya endüstriyel kullanım gibi alakasız konular açma.",
  "Plise perde ve sineklik ürünlerini müşterinin ihtiyacına göre kısa ve sohbet havasında tanıt.",
  "Ölçü akışında uygulama alanı, montaj seçeneği, cam tipi, toplam cam sayısı, en ve boy sırasını takip et.",
  "Tek camda Standart Kasa, çift camda Slim Kasa kullanıldığını söyle.",
  "Cam balkonda açılır kanat seçilmişse sistem payı otomatik düşürür; müşteriye ölçüyü eksiltmemesini söyle.",
  "En ve boy ölçülerini çelik metreyle, santimetre olarak ve cam içinden cam içine aldır.",
  "Kamera veya görüntü yoksa ölçünün doğru olduğunu asla söyleme; yalnızca doğrulayamadığını belirt.",
  "Kamera açık olsa bile görüntüden ölçü doğruluğu onayı verme ve aktif kamera yönlendirmesi yapma.",
  "PVC ve alüminyum kapı veya pencerelerde kancalı montaj önerme.",
  "Fiyatı tahmin etme; matematiksel fiyat hesaplama ekranına yönlendir.",
].join(" ");

export class RealtimeVoiceGuide {
  private peer: RTCPeerConnection | null = null;
  private channel: RTCDataChannel | null = null;
  private audio: HTMLAudioElement | null = null;
  private microphoneStream: MediaStream | null = null;
  private connectionPromise: Promise<void> | null = null;
  private muted = false;
  private state: VoiceState = "idle";
  private listener?: VoiceStateListener;
  private transcriptListener?: TranscriptListener;
  private errorListener?: ErrorListener;
  private assistantTranscript = "";
  private pendingSpeech = "";

  constructor(listener?: VoiceStateListener, transcriptListener?: TranscriptListener, errorListener?: ErrorListener) {
    this.listener = listener;
    this.transcriptListener = transcriptListener;
    this.errorListener = errorListener;
  }

  private setState(state: VoiceState) {
    this.state = state;
    this.listener?.(state);
  }

  private reportError(message: string) {
    this.errorListener?.(message);
    this.setState("error");
  }

  getState() {
    return this.state;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.microphoneStream?.getAudioTracks().forEach(track => { track.enabled = !muted; });
    if (this.audio) this.audio.muted = muted;
    if (muted) {
      this.cancel();
      this.setState("muted");
    } else if (this.channel?.readyState === "open") {
      void this.audio?.play().catch(() => undefined);
      this.setState("listening");
    }
  }

  private async waitForIceGathering(peer: RTCPeerConnection) {
    if (peer.iceGatheringState === "complete") return;
    await new Promise<void>(resolve => {
      const timeout = window.setTimeout(resolve, 3000);
      const handleChange = () => {
        if (peer.iceGatheringState !== "complete") return;
        window.clearTimeout(timeout);
        peer.removeEventListener("icegatheringstatechange", handleChange);
        resolve();
      };
      peer.addEventListener("icegatheringstatechange", handleChange);
    });
  }

  private configureSession(channel: RTCDataChannel) {
    channel.send(JSON.stringify({
      type: "session.update",
      session: {
        type: "realtime",
        instructions: SESSION_INSTRUCTIONS,
        output_modalities: ["audio"],
        max_output_tokens: 100,
        audio: {
          input: {
            noise_reduction: { type: "near_field" },
            transcription: { model: "gpt-4o-mini-transcribe", language: "tr" },
            turn_detection: {
              type: "server_vad",
              threshold: 0.45,
              prefix_padding_ms: 350,
              silence_duration_ms: 1200,
              create_response: true,
              interrupt_response: false,
            },
          },
          output: { voice: "cedar", speed: 0.96 },
        },
      },
    }));
  }

  private handleServerEvent(rawEvent: MessageEvent) {
    try {
      const payload = JSON.parse(String(rawEvent.data)) as { type?: string; transcript?: string; delta?: string; error?: { message?: string } };
      if (payload.type === "input_audio_buffer.speech_started") this.setState(this.muted ? "muted" : "listening");
      if (payload.type === "response.created") {
        this.assistantTranscript = "";
        this.setState(this.muted ? "muted" : "speaking");
      }
      if (payload.type === "response.output_audio_transcript.delta" && payload.delta) this.assistantTranscript += payload.delta;
      if (payload.type === "response.output_audio_transcript.done") {
        const text = (payload.transcript || this.assistantTranscript).trim();
        if (text) this.transcriptListener?.({ role: "assistant", text });
        this.assistantTranscript = "";
      }
      if (payload.type === "conversation.item.input_audio_transcription.completed") {
        const text = payload.transcript?.trim();
        if (text) this.transcriptListener?.({ role: "user", text });
      }
      if (payload.type === "response.done") {
        this.setState(this.muted ? "muted" : "listening");
        if (this.pendingSpeech && !this.muted) {
          const next = this.pendingSpeech;
          this.pendingSpeech = "";
          window.setTimeout(() => void this.speak(next), 250);
        }
      }
      if (payload.type === "error") this.reportError(payload.error?.message || "OpenAI canlı ses oturumunda hata oluştu.");
    } catch {
      // Ignore non-JSON WebRTC events.
    }
  }

  private async requestEphemeralToken() {
    const response = await fetch("/api/ai/realtime/token", { method: "GET", credentials: "include", cache: "no-store" });
    const payload = await response.json().catch(() => null) as { value?: string; model?: string; error?: string } | null;
    if (!response.ok || !payload?.value) throw new Error(payload?.error || `Canlı ses geçici bağlantı anahtarı alınamadı (${response.status}).`);
    return payload;
  }

  private async createDirectAnswer(sdp: string) {
    const token = await this.requestEphemeralToken();
    const response = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: { authorization: `Bearer ${token.value}`, "content-type": "application/sdp" },
      body: sdp,
    });
    if (!response.ok) throw new Error(`Doğrudan canlı ses bağlantısı kurulamadı (${response.status}).`);
    return response.text();
  }

  private async createServerFallbackAnswer(sdp: string) {
    const response = await fetch("/api/ai/realtime/call", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ sdp }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(payload?.error || `Canlı ses bağlantısı kurulamadı (${response.status}).`);
    }
    return response.text();
  }

  async connect() {
    if (this.peer && this.channel?.readyState === "open") return;
    if (this.connectionPromise) return this.connectionPromise;

    this.connectionPromise = (async () => {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Bu cihaz canlı mikrofon görüşmesini desteklemiyor.");
      this.setState("connecting");

      let microphoneStream: MediaStream;
      try {
        microphoneStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
          video: false,
        });
      } catch (error) {
        const name = error instanceof DOMException ? error.name : "";
        if (name === "NotAllowedError") throw new Error("Mikrofon izni kapalı. Site ayarlarından mikrofonu İzin Ver olarak seçin.");
        if (name === "NotFoundError") throw new Error("Bu cihazda kullanılabilir mikrofon bulunamadı.");
        throw new Error("Mikrofon açılamadı.");
      }

      microphoneStream.getAudioTracks().forEach(track => { track.enabled = !this.muted; });
      const peer = new RTCPeerConnection();
      microphoneStream.getTracks().forEach(track => peer.addTrack(track, microphoneStream));

      const audio = document.createElement("audio");
      audio.autoplay = true;
      audio.controls = false;
      audio.muted = this.muted;
      audio.setAttribute("playsinline", "true");
      audio.style.display = "none";
      document.body.appendChild(audio);

      peer.ontrack = event => {
        audio.srcObject = event.streams[0] ?? new MediaStream([event.track]);
        if (!this.muted) void audio.play().catch(() => undefined);
      };
      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "connected") this.setState(this.muted ? "muted" : "listening");
        if (peer.connectionState === "failed") this.reportError("Canlı ses ağ bağlantısı kurulamadı.");
      };

      const channel = peer.createDataChannel("oai-events");
      channel.addEventListener("message", event => this.handleServerEvent(event));

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      await this.waitForIceGathering(peer);
      const sdp = peer.localDescription?.sdp;
      if (!sdp) throw new Error("Canlı ses bağlantı teklifi oluşturulamadı.");

      let answerSdp: string;
      try {
        answerSdp = await this.createDirectAnswer(sdp);
      } catch {
        answerSdp = await this.createServerFallbackAnswer(sdp);
      }

      await peer.setRemoteDescription({ type: "answer", sdp: answerSdp });
      await new Promise<void>((resolve, reject) => {
        if (channel.readyState === "open") {
          this.configureSession(channel);
          resolve();
          return;
        }
        const timeout = window.setTimeout(() => reject(new Error("Canlı ses bağlantısı zaman aşımına uğradı.")), 20_000);
        channel.addEventListener("open", () => {
          window.clearTimeout(timeout);
          this.configureSession(channel);
          resolve();
        }, { once: true });
        channel.addEventListener("error", () => {
          window.clearTimeout(timeout);
          reject(new Error("Canlı ses veri kanalı açılamadı."));
        }, { once: true });
      });

      this.peer = peer;
      this.channel = channel;
      this.audio = audio;
      this.microphoneStream = microphoneStream;
      this.setState(this.muted ? "muted" : "listening");
    })().catch(error => {
      const message = error instanceof Error ? error.message : "Canlı ses bağlantısı kurulamadı.";
      this.disconnect();
      this.reportError(message);
      throw error;
    }).finally(() => { this.connectionPromise = null; });

    return this.connectionPromise;
  }

  async speak(text: string) {
    const cleaned = text.replace(/\s+/g, " ").trim();
    if (!cleaned || this.muted) return;
    await this.connect();
    if (!this.channel || this.channel.readyState !== "open") return;
    if (this.state === "speaking") {
      this.pendingSpeech = cleaned;
      return;
    }
    this.channel.send(JSON.stringify({
      type: "response.create",
      response: {
        conversation: "auto",
        output_modalities: ["audio"],
        max_output_tokens: 70,
        instructions: `Bu adımı Türkçe, açık ve yalnızca bir kısa cümleyle söyle: ${cleaned}`,
      },
    }));
  }

  cancel() {
    this.pendingSpeech = "";
    if (this.state === "speaking" && this.channel?.readyState === "open") this.channel.send(JSON.stringify({ type: "response.cancel" }));
    if (this.state !== "error") this.setState(this.muted ? "muted" : this.channel?.readyState === "open" ? "listening" : "idle");
  }

  disconnect() {
    this.pendingSpeech = "";
    this.channel?.close();
    this.microphoneStream?.getTracks().forEach(track => track.stop());
    this.peer?.getReceivers().forEach(receiver => receiver.track?.stop());
    this.peer?.close();
    if (this.audio) {
      this.audio.pause();
      this.audio.srcObject = null;
      this.audio.remove();
    }
    this.channel = null;
    this.peer = null;
    this.audio = null;
    this.microphoneStream = null;
    this.connectionPromise = null;
    this.setState("idle");
  }
}

export type { VoiceState };
