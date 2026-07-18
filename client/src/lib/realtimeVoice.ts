type VoiceState = "idle" | "connecting" | "listening" | "speaking" | "muted" | "error";

type VoiceStateListener = (state: VoiceState) => void;
type TranscriptListener = (event: { role: "user" | "assistant"; text: string }) => void;
type ErrorListener = (message: string) => void;

const SESSION_INSTRUCTIONS = [
  "Sen RGNFIX canlı ölçü ve plise perde danışmanısın.",
  "Daima Türkçe konuş.",
  "Ses tonun dinamik, akıcı, sıcak, kibar ve samimi olsun.",
  "Kısa konuş; her turda en fazla iki kısa cümle ve yalnızca bir soru kullan.",
  "Müşterinin bu görüşmede verdiği bilgileri hatırla ve cevaplanmış soruyu yeniden sorma.",
  "Kendini, aynı cümleyi veya aynı açıklamayı tekrar etme.",
  "Yalnızca RGNFIX, plise perde, kumaş, renk, montaj, ölçü, fiyat süreci, sipariş ve ürün kullanımıyla ilgili cevap ver.",
  "Ölçü tahmini veya yuvarlama yapma. Müşterinin girdiği ölçüyü değiştirme.",
  "Önce net cam EN ölçüsünü, sonra net cam BOY ölçüsünü çelik metreyle santimetre olarak aldır.",
  "Yalnızca cam balkonda Açılır kanat kutusu işaretlenmişse sistem enden 2 santimetre düşer.",
  "PVC ve alüminyum kapı veya pencerelerde kancalı montaj önerme.",
  "Fiyatı tahmin etme; uygulamanın matematiksel fiyat hesaplama ekranına yönlendir.",
  "Bilmediğin ürün, fiyat veya teknik bilgiyi uydurma.",
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
    this.microphoneStream?.getAudioTracks().forEach(track => {
      track.enabled = !muted;
    });
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
        max_output_tokens: 220,
        audio: {
          input: {
            noise_reduction: { type: "near_field" },
            transcription: {
              model: "gpt-4o-mini-transcribe",
              language: "tr",
            },
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 650,
              create_response: true,
              interrupt_response: true,
            },
          },
          output: { speed: 1.1 },
        },
      },
    }));
  }

  private handleServerEvent(rawEvent: MessageEvent) {
    try {
      const payload = JSON.parse(String(rawEvent.data)) as {
        type?: string;
        transcript?: string;
        delta?: string;
        error?: { message?: string };
      };

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
      if (payload.type === "response.done") this.setState(this.muted ? "muted" : "listening");
      if (payload.type === "error") {
        const message = payload.error?.message || "OpenAI canlı ses oturumunda hata oluştu.";
        console.error("[Realtime Voice] OpenAI error:", message);
        this.reportError(message);
      }
    } catch {
      // Ignore non-JSON WebRTC events.
    }
  }

  private async requestEphemeralToken() {
    const response = await fetch("/api/ai/realtime/token", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null) as { value?: string; model?: string; error?: string } | null;
    if (!response.ok || !payload?.value) {
      throw new Error(payload?.error || `Canlı ses geçici bağlantı anahtarı alınamadı (${response.status}).`);
    }
    return payload;
  }

  private async createDirectAnswer(sdp: string) {
    const token = await this.requestEphemeralToken();
    const response = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token.value}`,
        "content-type": "application/sdp",
      },
      body: sdp,
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("[Realtime Voice] Direct OpenAI call failed:", response.status, detail);
      throw new Error(`Doğrudan canlı ses bağlantısı kurulamadı (${response.status}).`);
    }
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
        if (name === "NotAllowedError") throw new Error("Mikrofon izni kapalı. Safari adres çubuğundaki site ayarlarından mikrofonu İzin Ver olarak seçin.");
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
      } catch (directError) {
        console.warn("[Realtime Voice] Direct connection failed, using server fallback:", directError);
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
      console.error("[Realtime Voice] Connection failed:", error);
      this.disconnect();
      this.reportError(message);
      throw error;
    }).finally(() => {
      this.connectionPromise = null;
    });

    return this.connectionPromise;
  }

  async speak(text: string) {
    const cleaned = text.replace(/\s+/g, " ").trim();
    if (!cleaned || this.muted) return;
    await this.connect();
    if (!this.channel || this.channel.readyState !== "open") return;

    if (this.state === "speaking") this.cancel();
    this.channel.send(JSON.stringify({
      type: "response.create",
      response: {
        conversation: "auto",
        output_modalities: ["audio"],
        max_output_tokens: 160,
        instructions: `Müşteriye yalnızca şu ölçü adımını bir kez, kısa ve doğal şekilde söyle. Sonra müşterinin soru sormasını bekle. Tekrar etme: ${cleaned}`,
      },
    }));
  }

  cancel() {
    if (this.state === "speaking" && this.channel?.readyState === "open") {
      this.channel.send(JSON.stringify({ type: "response.cancel" }));
      this.channel.send(JSON.stringify({ type: "output_audio_buffer.clear" }));
    }
    if (this.state !== "error") this.setState(this.muted ? "muted" : this.channel?.readyState === "open" ? "listening" : "idle");
  }

  disconnect() {
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
