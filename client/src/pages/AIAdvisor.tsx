import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Bot, MessageCircle, Send, Sparkles, User } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Message {
  role: "user" | "assistant";
  content: string;
  showWhatsApp?: boolean;
}

const WHATSAPP_URL = "https://wa.me/905300288903?text=Merhaba%2C%20sineklik%20fiyat%C4%B1%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum.";

const quickQuestions = [
  "Cam balkonum için hangi plise perde uygun?",
  "Plise perde kumaş serileri nelerdir?",
  "Pencere sineklik fiyatı nedir?",
  "Kiracıyım, vidasız montaj istiyorum",
  "Çift cam için hangi kasa seçilir?",
  "Kargo kaç iş gününde çıkar?",
];

const maintenanceMessage =
  "Şu anda kısa süreli bir bağlantı sorunu var. WhatsApp üzerinden destek alabilirsiniz.";

const advisorRule = [
  "Sen Plise Perde Gaziantep firmasının RGNFIX yapay zekâ satış ve sipariş danışmanısın.",
  "Ana uzmanlık ve satış odağın plise perdedir.",
  "Müşterinin yalnızca sorduğu soruya cevap ver; alakasız bilgi, gereksiz öneri, uzun satış konuşması veya konu dışı açıklama yapma.",
  "Cevapların doğal, samimi, doğru ve en fazla iki kısa cümle olsun. Gerekli değilse takip sorusu sorma; gerekiyorsa yalnızca bir soru sor.",
  "Plise perde için Nova, Neo Fashion, Nano Clean, Nano Insulation, Nano Pro ve Honeycomb serilerini; sistemde bulunan varyantları, renk kartelasını, profil rengini, montaj tipini, ölçüyü ve sipariş akışını doğru şekilde anlatabilirsin.",
  "Müşterinin ihtiyacına göre plise perde kumaş serisi ve karteladaki varyantlardan seçim yapmasına yardımcı ol; sistemde olmayan renk veya varyant uydurma.",
  "Sineklik bir perde kumaşı kullanmaz. Akordiyon sineklikte yalnızca standart kaliteli fiber sineklik tülü vardır; Nova, Neo Fashion, Nano Clean, Nano Insulation, Nano Pro veya Honeycomb asla sinekliğe önerilmez.",
  "Sineklik için kumaş serisi, kumaş çeşidi veya varyant varmış gibi konuşma.",
  "Sineklik fiyatı sorulursa fiyat hesaplama veya tahmin yapma; sadece güncel fiyat için WhatsApp hattına yönlendir.",
  "Plise perde fiyatını tahmin etme; yalnızca sistemdeki matematiksel fiyat hesaplama bölümünün sonucunu esas al.",
  "Kargo veya hazırlanma süresi sorulursa yalnızca 'Siparişiniz 7 iş günü içerisinde hazırlanarak kargoya teslim edilir.' diye cevap ver.",
  "Ölçü sırasında müşteri plise perde, kumaş, renk, montaj, kasa, temizlik, garanti, teslimat veya sipariş hakkında soru sorarsa kısa cevap ver ve ardından kaldığı ölçü adımına devam et.",
  "Kamera veya görüntü görmediğin halde ölçünün doğru olduğunu söyleme.",
  "Sipariş sürecinde ad soyad, telefon, il, ilçe, adres, uygulama alanı, ölçüler, kumaş serisi, varyant, profil rengi, montaj tipi ve kasa tipi gibi eksik bilgileri sırayla tamamla; aynı anda yalnızca bir eksik bilgi sor.",
  "Sipariş bilgileri tamamlandığında müşteriyi WhatsApp üzerinden siparişi iletmeye yönlendir.",
  "Bilmediğin veya sistemde bulunmayan bir bilgiyi kesinlikle uydurma; WhatsApp desteğine yönlendir.",
  "Madde işareti, başlık, teknik döküm ve müşterinin sormadığı ek bilgi kullanma.",
].join(" ");

function localAnswer(text: string): Message | null {
  const normalized = text.toLocaleLowerCase("tr-TR");
  const asksPrice = /(fiyat|kaç para|ücret|maliyet)/.test(normalized);
  const asksShipping = /(kargo|hazırlan|teslim|kaç gün|ne zaman gelir)/.test(normalized);
  const isInsectScreen = /(sineklik|akordiyon sineklik|sinek tülü|fiber tül)/.test(normalized);
  const asksInsectScreenFabric = isInsectScreen && /(kumaş|nova|neo|nano|honey|seri|varyant|tül)/.test(normalized);

  if (asksShipping) {
    return { role: "assistant", content: "Siparişiniz 7 iş günü içerisinde hazırlanarak kargoya teslim edilir." };
  }

  if (isInsectScreen && asksPrice) {
    return {
      role: "assistant",
      content: "Sineklik için güncel fiyat bilgisini WhatsApp hattımızdan alabilirsiniz.",
      showWhatsApp: true,
    };
  }

  if (asksInsectScreenFabric) {
    return {
      role: "assistant",
      content: "Akordiyon sineklikte kumaş serisi bulunmaz; yalnızca standart kaliteli fiber sineklik tülü kullanılır.",
    };
  }

  return null;
}

function normalizeAssistantContent(content: string) {
  const normalized = content.toLocaleLowerCase("tr-TR");
  if (
    normalized.includes("demo modundayım") ||
    normalized.includes("ai anahtarı") ||
    normalized.includes("claude api") ||
    normalized.includes("anthropic api")
  ) {
    return maintenanceMessage;
  }

  const cleaned = content
    .replace(/#{1,6}\s*/g, "")
    .replace(/^[-*•]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();

  const sentences = cleaned.match(/[^.!?]+[.!?]?/g)?.map(sentence => sentence.trim()).filter(Boolean) ?? [];
  const shortReply = sentences.slice(0, 2).join(" ").trim();
  if (!shortReply) return maintenanceMessage;
  return shortReply.length > 260 ? `${shortReply.slice(0, 257).trim()}...` : shortReply;
}

export default function AIAdvisor() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMutation = trpc.ai.chat.useMutation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMessage: Message = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    const fixedAnswer = localAnswer(userMessage.content);
    if (fixedAnswer) {
      setMessages(prev => [...prev, fixedAnswer]);
      return;
    }

    setIsLoading(true);
    try {
      const conversation = [...messages, userMessage].map(message => ({
        role: message.role,
        content: message.content,
      }));
      conversation[conversation.length - 1] = {
        role: "user",
        content: `${userMessage.content}\n\n${advisorRule}`,
      };

      const response = await chatMutation.mutateAsync({ messages: conversation });
      const content = normalizeAssistantContent(response.content);
      const showWhatsApp = /whatsapp/i.test(content);
      setMessages(prev => [...prev, { role: "assistant", content, showWhatsApp }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: maintenanceMessage, showWhatsApp: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  };

  return (
    <div className="container py-8 max-w-4xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <Sparkles className="h-3.5 w-3.5" /> Yapay Zekâ Destekli
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3">Plise Perde AI Danışmanı</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Plise perde seçimi, ölçü, montaj ve sipariş hakkında sorunuzu yazın.
        </p>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <div className="h-[500px] flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"><Bot className="h-8 w-8 text-primary" /></div>
                <div className="text-center space-y-2">
                  <h3 className="font-semibold">Merhaba, nasıl yardımcı olabilirim?</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Sorunuza kısa ve doğrudan cevap vererek plise perde sipariş sürecinde yardımcı olurum.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {quickQuestions.map((question, index) => (
                    <button key={index} onClick={() => void sendMessage(question)} className="text-left text-xs px-3 py-2 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-colors">
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                {message.role === "assistant" && <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-primary" /></div>}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <p>{message.content}</p>
                  {message.role === "assistant" && message.showWhatsApp && (
                    <Button asChild size="sm" className="mt-3 gap-2">
                      <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
                        <MessageCircle className="h-4 w-4" /> WhatsApp’tan Bilgi Al
                      </a>
                    </Button>
                  )}
                </div>
                {message.role === "user" && <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0"><User className="h-4 w-4" /></div>}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-primary" /></div>
                <div className="bg-muted rounded-2xl px-4 py-3"><div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" /><div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} /><div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} /></div></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t p-4">
            <div className="flex gap-2">
              <Textarea value={input} onChange={event => setInput(event.target.value)} onKeyDown={handleKeyDown} placeholder="Plise perdeyle ilgili sorunuzu yazın..." className="min-h-[44px] max-h-32 resize-none rounded-xl" rows={1} />
              <Button onClick={() => void sendMessage(input)} disabled={!input.trim() || isLoading} size="icon" className="rounded-xl h-11 w-11 shrink-0" aria-label="Mesaj gönder"><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
