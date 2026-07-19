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

const WHATSAPP_URL = "https://wa.me/905300288903?text=Merhaba%2C%20plise%20perde%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum.";

const quickQuestions = [
  "Nova serisini anlat",
  "Neo Fashion serisini anlat",
  "Nano Clean serisini anlat",
  "Nano Insulation serisini anlat",
  "Nano Pro serisini anlat",
  "Honeycomb serisini anlat",
  "Kumaş renk kartelamızı göster",
  "Profil renklerimiz nelerdir?",
];

const maintenanceMessage = "Şu anda bağlantı sorunu var. WhatsApp’tan destek alabilirsiniz.";

const advisorRule = [
  "Sen Plise Perde Gaziantep firmasının yapay zekâ ürün danışmanısın.",
  "Amacın plise perde hakkında doğru bilgi vermek, müşterinin ihtiyacına uygun ürünü tanıtmak ve satın alma kararına yardımcı olmaktır.",
  "Bu sohbet içinde sipariş oluşturma, adres toplama, ad soyad, telefon, mahalle, sokak veya kapı numarası isteme.",
  "Müşteri satın almak isterse yalnızca WhatsApp hattına yönlendir.",
  "Müşterinin sadece sorduğu soruya cevap ver. Sorulmayan konuya girme, alakasız bilgi verme ve gereksiz takip sorusu sorma.",
  "Cevapların mümkün olduğunca kısa olsun; çoğunlukla tek cümle, gerektiğinde en fazla iki kısa cümle kullan.",
  "Yalnızca Nova, Neo Fashion, Nano Clean, Nano Insulation, Nano Pro ve Honeycomb kumaş serilerini öner.",
  "Renk önerirken yalnızca sistemde kayıtlı kumaş renk kartelasını ve profil renklerini kullan; kartela dışında hiçbir renk, ton, varyant veya özel renk uydurma.",
  "Dekorasyon stili, modern veya klasik tarz, mobilya, duvar rengi ya da iç mimari önerisi verme.",
  "Sistemde bulunmayan renk, özellik, fiyat veya varyant uydurma.",
  "Akordiyon sineklikte kumaş serisi bulunmaz; yalnızca standart fiber sineklik tülü vardır. Plise perde kumaşlarını sinekliğe asla önerme.",
  "Sineklik fiyatı sorulursa fiyat hesaplama ve tahmin yapmadan WhatsApp’a yönlendir.",
  "Plise perde fiyatını tahmin etme; fiyat hesaplama bölümüne veya WhatsApp’a yönlendir.",
  "Kargo süresi sorulursa yalnızca 'Siparişiniz 7 iş günü içerisinde hazırlanarak kargoya teslim edilir.' diye cevap ver.",
  "Kamera görmediğin halde ölçüyü doğru diye onaylama.",
  "Madde işareti, başlık, uzun açıklama ve teknik döküm kullanma.",
].join(" ");

function localAnswer(text: string): Message | null {
  const normalized = text.toLocaleLowerCase("tr-TR");
  const asksPrice = /(fiyat|kaç para|ücret|maliyet)/.test(normalized);
  const asksShipping = /(kargo|hazırlan|teslim|kaç gün|ne zaman gelir)/.test(normalized);
  const wantsToBuy = /(satın almak|sipariş vermek|almak istiyorum|nasıl alırım|sipariş oluştur)/.test(normalized);
  const isInsectScreen = /(sineklik|akordiyon sineklik|sinek tülü|fiber tül)/.test(normalized);
  const asksInsectScreenFabric = isInsectScreen && /(kumaş|nova|neo|nano|honey|seri|varyant|tül)/.test(normalized);
  const asksColors = /(renk|kartela|profil rengi)/.test(normalized);

  if (asksShipping) return { role: "assistant", content: "Siparişiniz 7 iş günü içerisinde hazırlanarak kargoya teslim edilir." };

  if (isInsectScreen && asksPrice) {
    return { role: "assistant", content: "Sineklik fiyatı için WhatsApp’tan bilgi alabilirsiniz.", showWhatsApp: true };
  }

  if (asksInsectScreenFabric) {
    return { role: "assistant", content: "Akordiyon sineklikte kumaş serisi yoktur; standart fiber sineklik tülü kullanılır." };
  }

  if (wantsToBuy) {
    return { role: "assistant", content: "Satın alma işlemi için WhatsApp’tan bize ulaşabilirsiniz.", showWhatsApp: true };
  }

  if (asksColors) {
    return { role: "assistant", content: "Yalnızca mevcut kumaş kartelamızdaki ve profil seçeneklerimizdeki renkleri öneririm; kartela dışına çıkmam." };
  }

  return null;
}

function normalizeAssistantContent(content: string) {
  const normalized = content.toLocaleLowerCase("tr-TR");
  if (normalized.includes("demo modundayım") || normalized.includes("ai anahtarı") || normalized.includes("claude api") || normalized.includes("anthropic api")) return maintenanceMessage;

  const cleaned = content.replace(/#{1,6}\s*/g, "").replace(/^[-*•]\s+/gm, "").replace(/\s+/g, " ").trim();
  const sentences = cleaned.match(/[^.!?]+[.!?]?/g)?.map(sentence => sentence.trim()).filter(Boolean) ?? [];
  const shortReply = sentences.slice(0, 2).join(" ").trim();
  if (!shortReply) return maintenanceMessage;
  return shortReply.length > 180 ? `${shortReply.slice(0, 177).trim()}...` : shortReply;
}

export default function AIAdvisor() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMutation = trpc.ai.chat.useMutation();

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMessage: Message = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    const fixedAnswer = localAnswer(userMessage.content);
    if (fixedAnswer) { setMessages(prev => [...prev, fixedAnswer]); return; }

    setIsLoading(true);
    try {
      const conversation = [...messages, userMessage].map(message => ({ role: message.role, content: message.content }));
      conversation[conversation.length - 1] = { role: "user", content: `${userMessage.content}\n\n${advisorRule}` };
      const response = await chatMutation.mutateAsync({ messages: conversation });
      const content = normalizeAssistantContent(response.content);
      setMessages(prev => [...prev, { role: "assistant", content, showWhatsApp: /whatsapp/i.test(content) }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: maintenanceMessage, showWhatsApp: true }]);
    } finally { setIsLoading(false); }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(input); }
  };

  return (
    <div className="container py-8 max-w-4xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"><Sparkles className="h-3.5 w-3.5" /> Yapay Zekâ Destekli</div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3">Plise Perde Danışmanı</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto leading-6">Plise perde kumaş serilerimiz ve renk kartelamız hakkında bilgi alabilirsiniz. Ölçü, montaj, temizlik ve kullanım sorularınıza kısa ve doğrudan cevap veririm. Yalnızca sistemimizde bulunan ürün ve renkleri öneririm.</p>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <div className="h-[540px] flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"><Bot className="h-8 w-8 text-primary" /></div>
                <div className="text-center space-y-2"><h3 className="font-semibold">Kumaş serilerimizi ve renklerimizi inceleyin</h3><p className="text-sm text-muted-foreground max-w-md">Aşağıdaki öneriler yalnızca kendi ürün seçeneklerimizden oluşur.</p></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {quickQuestions.map((question, index) => <button key={index} onClick={() => void sendMessage(question)} className="text-left text-xs px-3 py-2 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-colors">{question}</button>)}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                {message.role === "assistant" && <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-primary" /></div>}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <p>{message.content}</p>
                  {message.role === "assistant" && message.showWhatsApp && <Button asChild size="sm" className="mt-3 gap-2"><a href={WHATSAPP_URL} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp’a Geç</a></Button>}
                </div>
                {message.role === "user" && <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0"><User className="h-4 w-4" /></div>}
              </div>
            ))}

            {isLoading && <div className="flex gap-3"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-primary" /></div><div className="bg-muted rounded-2xl px-4 py-3">...</div></div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t p-4"><div className="flex gap-2"><Textarea value={input} onChange={event => setInput(event.target.value)} onKeyDown={handleKeyDown} placeholder="Plise perdeyle ilgili sorunuzu yazın..." className="min-h-[44px] max-h-32 resize-none rounded-xl" rows={1} /><Button onClick={() => void sendMessage(input)} disabled={!input.trim() || isLoading} size="icon" className="rounded-xl h-11 w-11 shrink-0" aria-label="Mesaj gönder"><Send className="h-4 w-4" /></Button></div></div>
        </div>
      </Card>
    </div>
  );
}
