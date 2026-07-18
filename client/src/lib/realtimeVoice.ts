type VoiceState = "idle" | "connecting" | "ready" | "speaking" | "error";

type VoiceStateListener = (state: VoiceState) => void;

export class RealtimeVoiceGuide {
  private peer: RTCPeerConnection | null = null;
  private channel: RTCDataChannel | null = null;
  private audio: HTMLAudioElement | null = null;
  private connectionPromise: Promise<void> | null = null;
  private muted = false;
  private state: VoiceState = "idle";
  private listener?: VoiceStateListener;

  constructor(listener?: VoiceStateListener) {
    this.listener = listener;
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
    if (this.audio) this.audio.muted = muted;
    if (muted) this.cancel();
  }

  private async waitForIceGathering(peer: RTCPeerConnection) {
    if (peer.iceGatheringState === "complete") return;
    await new Promise<void>(resolve => {
      const timeout = window.setTimeout(resolve, 2500);
      const handleChange = () => {
        if (peer.iceGatheringState !== "complete") return;
        window.clearTimeout(timeout);
        peer.removeEventListener("icegatheringstatechange", handleChange);
        resolve();
      };
      peer.addEventListener("icegatheringstatechange", handleChange);
    });
  }

  async connect() {
    if (this.peer && this.channel?.readyState === "open") return;
    if (this.connectionPromise) return this.connectionPromise;

    this.connectionPromise = (async () => {
      this.setState("connecting");
      const peer = new RTCPeerConnection();
      const audio = new Audio();
      audio.autoplay = true;
      audio.muted = this.muted;
      peer.ontrack = event => {
        audio.srcObject = event.streams[0] ?? new MediaStream([event.track]);
        void audio.play().catch(() => undefined);
      };
      peer.addTransceiver("audio", { direction: "recvonly" });

      const channel = peer.createDataChannel("oai-events");
      channel.addEventListener("message", event => {
        try {
          const payload = JSON.parse(String(event.data)) as { type?: string; error?: { message?: string } };
          if (payload.type === "response.created") this.setState("speaking");
          if (payload.type === "response.done" || payload.type === "response.cancelled") this.setState("ready");
          if (payload.type === "error") {
            console.error("[Realtime Voice] OpenAI error:", payload.error?.message || payload);
            this.setState("error");
          }
        } catch {
          // Ignore non-JSON WebRTC events.
        }
      });

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
        const timeout = window.setTimeout(() => reject(new Error("Canlı ses bağlantısı zaman aşımına uğradı.")), 12_000);
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
      this.setState("ready");
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
        conversation: "none",
        output_modalities: ["audio"],
        instructions: `Türkçe olarak yalnızca aşağıdaki yönlendirmeyi bir kez; dinamik, akıcı, sıcak ve kadın tınısına yakın bir sesle söyle. Ek cümle kurma ve tekrar etme: ${cleaned}`,
      },
    }));
  }

  cancel() {
    if (this.state === "speaking" && this.channel?.readyState === "open") {
      this.channel.send(JSON.stringify({ type: "response.cancel" }));
    }
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    if (this.state !== "error") this.setState(this.channel?.readyState === "open" ? "ready" : "idle");
  }

  disconnect() {
    this.channel?.close();
    this.peer?.getReceivers().forEach(receiver => receiver.track?.stop());
    this.peer?.close();
    if (this.audio) {
      this.audio.pause();
      this.audio.srcObject = null;
    }
    this.channel = null;
    this.peer = null;
    this.audio = null;
    this.connectionPromise = null;
    this.setState("idle");
  }
}

export type { VoiceState };
