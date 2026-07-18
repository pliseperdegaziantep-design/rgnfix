type VoiceState = "idle" | "connecting" | "listening" | "speaking" | "muted" | "error";

type VoiceStateListener = (state: VoiceState) => void;
type TranscriptListener = (event: { role: "user" | "assistant"; text: string }) => void;

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
  private assistantTranscript = "";

  constructor(listener?: VoiceStateListener, transcriptListener?: TranscriptListener) {
    this.listener = listener;
    this.transcriptListener = transcriptListener;
  }

  private setState(state: VoiceState) {
    this.state = state;
    this.listener?.(state);
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

  private handleServerEvent(rawEvent: MessageEvent) {
    try {
      const payload = JSON.parse(String(rawEvent.data)) as {
        type?: string;
        transcript?: string;
        delta?: string;
        error?: { message?: string };
        response?: { status?: string };
      };

      if (payload.type === "input_audio_buffer.speech_started") {
        this.setState(this.muted ? "muted" : "listening");
      }
      if (payload.type === "response.created") {
        this.assistantTranscript = "";
        this.setState(this.muted ? "muted" : "speaking");
      }
      if (payload.type === "response.output_audio_transcript.delta" && payload.delta) {
        this.assistantTranscript += payload.delta;
      }
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
      }
      if (payload.type === "error") {
        console.error("[Realtime Voice] OpenAI error:", payload.error?.message || payload);
        this.setState("error");
      }
    } catch {
      // Ignore non-JSON WebRTC events.
    }
  }

  async connect() {
    if (this.peer && this.channel?.readyState === "open") return;
    if (this.connectionPromise) return this.connectionPromise;

    this.connectionPromise = (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Bu cihaz canlı mikrofon görüşmesini desteklemiyor.");
      }

      this.setState("connecting");
      const microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
        video: false,
      });
      microphoneStream.getAudioTracks().forEach(track => {
        track.enabled = !this.muted;
      });

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
        if (["failed", "closed", "disconnected"].includes(peer.connectionState)) this.setState("error");
      };

      const channel = peer.createDataChannel("oai-events");
      channel.addEventListener("message", event => this.handleServerEvent(event));

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      await this.waitForIceGathering(peer);
      const sdp = peer.localDescription?.sdp;
      if (!sdp) throw new Error("Canlı ses bağlantı teklifi oluşturulamadı.");

      const response = await fetch("/api/ai/realtime/call", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sdp }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error || "Canlı ses bağlantısı kurulamadı.");
      }

      const answerSdp = await response.text();
      await peer.setRemoteDescription({ type: "answer", sdp: answerSdp });
      await new Promise<void>((resolve, reject) => {
        if (channel.readyState === "open") {
          resolve();
          return;
        }
        const timeout = window.setTimeout(() => reject(new Error("Canlı ses bağlantısı zaman aşımına uğradı.")), 15_000);
        channel.addEventListener("open", () => {
          window.clearTimeout(timeout);
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
      console.error("[Realtime Voice] Connection failed:", error);
      this.disconnect();
      this.setState("error");
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
