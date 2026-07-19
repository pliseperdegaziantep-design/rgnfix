import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, Sparkles, User } from "lucide-react";
import { trpc } from "@/lib/trpc";
import BrandLogo from "@/components/BrandLogo";

interface Message {
  role: "user" | "assistant";
  content: string;
  showWhatsApp?: boolean;
}

interface Measurement {
  width: number;
  height: number;
  quantity: number;
}

const WHATSAPP_URL = "https://wa.me/905300288903?text=Merhaba%2C%20plise%20perde%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum.";
const NOVA_UNIT_PRICE = 485;

const quickQuestions = [
  "Uygun fiyatlı hangi seri?",
  "Orta kalite hangi seri?",
  "Kaliteli hangi seri?",
  "Karartma perde hangisi?",
  "Nova serisini anlat",
  "Neo Fashion serisini anlat",
  "Nano Pro serisini anlat",
  "Profil renklerimiz nelerdir?",
];

const maintenanceMessage = "Şu anda bağlantı sorunu var. WhatsApp’tan destek alabilirsiniz.";

const advisorRule = [
  "Sen Plise Perde Gaziantep firmasının yapay zekâ ürün danışmanısın.",
  "Yalnızca müşterinin sorduğu soruya cevap ver; önceki cevabı tekrar etme ve gereksiz bilgi ekleme.",
  "Cevapların tek kısa cümle olsun; zorunluysa en fazla iki kısa cümle kullan.",
  "Müşteri ölçü ve adet yazdıysa Nova serisini esas alarak yaklaşık toplam fiyatı doğrudan söyle.",
  "Fiyat hesaplamasında en ve boyu ayrı ayrı bir üst 10 cm'ye tamamla, her parçada minimum 1 m² uygula ve Nova için 485 TL/m² kullan.",
  "Fiyat veya ekonomik ürün sorulduğunda ilk olarak Nova serisini öner.",
  "Müşteri orta kalite isterse Neo Fashion serisini öner.",
  "Müşteri kaliteli veya üst segment ürün isterse Neo Fashion ya da Nano Pro öner.",
  "Karartma isteyen müşteriye yalnızca Nano Pro VR03 veya VR04 öner ve bunların karartma kumaş olduğunu belirt.",
  "Honeycomb serisini müşteri özellikle sormadıkça ilk öneri olarak sunma.",
  "Bu sohbet içinde adres, ad soyad, telefon veya açık adres bilgisi isteme.",
  "Müşteri satın almak isterse uygun seriyi kısaca öner ve WhatsApp hattına yönlendir.",
  "Yalnızca Nova, Neo Fashion, Nano Clean, Nano Insulation, Nano Pro ve Honeycomb serilerini öner.",
  "Renk önerirken yalnızca sistemde kayıtlı kartela ve profil renklerini kullan; kartela dışında renk uydurma.",
  "Dekorasyon, mobilya, duvar rengi veya iç mimari önerisi verme.",
  "Akordiyon sineklikte yalnızca standart fiber sineklik tülü vardır; plise perde kumaşı önerme.",
  "Sineklik fiyatı sorulursa WhatsApp’a yönlendir.",
  "Kargo süresi sorulursa yalnızca 'Siparişiniz 7 iş günü içerisinde hazırlanarak kargoya teslim edilir.' de.",
  "Madde işareti, başlık, uzun açıklama ve teknik döküm kullanma.",
].join(" ");

function parseNumber(value: string) {
  return Number(value.replace(",", "."));
}

function extractMeasurement(text: string): Measurement | null {
  const normalized = text.toLocaleLowerCase("tr-TR").replace(/cm/g, " ");
  const match = normalized.match(/(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+(?:[.,]\d+)?)(?:\s*(?:x|×|\*)?\s*(\d+)\s*(?:adet|tane))?/i);
  if (!match) return null;

  const width = parseNumber(match[1]);
  const height = parseNumber(match[2]);
  const quantityMatch = normalized.match(/(\d+)\s*(?:adet|tane)/i);
  const quantity = Number(match[3] || quantityMatch?.[1] || 1);

  if (!width || !height || !quantity || width > 500 || height > 500) return null;
  return { width, height, quantity };
}

function calculateNovaPrice(measurement: Measurement) {
  const roundedWidth = Math.ceil(measurement.width / 10) * 10;
  const roundedHeight = Math.ceil(measurement.height / 10) * 10;
  const areaPerPiece = Math.max(1, (roundedWidth / 100) * (roundedHeight / 100));
  const totalArea = areaPerPiece * measurement.quantity;
  return Math.round(totalArea * NOVA_UNIT_PRICE);
}

function formatTry(value: number) {
  return new Intl.NumberFormat("tr-TR").format(value);
}

function findLatestMeasurement(messages: Message[], currentText: string) {
  const current = extractMeasurement(currentText);
  if (current) return current;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role !== "user") continue;
    const measurement = extractMeasurement(messages[index].content);
    if (measurement) return measurement;
  }

  return null;
}

function localAnswer(text: string, messages: Message[]): Message | null {
  const normalized = text.toLocaleLowerCase("tr-TR");
  const asksPrice = /(fiyat|kaç para|ücret|maliyet|uygun fiyat|ekonomik|toplam)/.test(normalized);
  const asksShipping = /(kargo|hazırlan|teslim|kaç gün|ne zaman gelir)/.test(normalized);
  const wantsToBuy = /(satın almak|sipariş vermek|almak istiyorum|nasıl alırım|sipariş oluştur)/.test(normalized);
  const isInsectScreen = /(sineklik|akordiyon sineklik|sinek tülü|fiber tül)/.test(normalized);
  const asksInsectScreenFabric = isInsectScreen && /(kumaş|nova|neo|nano|honey|seri|varyant|tül)/.test(normalized);
  const asksColors = /(renk|kartela|profil rengi)/.test(normalized);
  const asksMedium = /(orta kalite|orta segment)/.test(normalized);
  const asksPremium = /(kaliteli|üst segment|premium|en iyi)/.test(normalized);
  const asksBlackout = /(karartma|ışık geçirmesin|tam kapatsın|gece gibi)/.test(normalized);
  const currentMeasurement = extractMeasurement(text);
  const latestMeasurement = findLatestMeasurement(messages, text);

  if (asksShipping) return { role: "assistant", content: "Siparişiniz 7 iş günü içerisinde hazırlanarak kargoya teslim edilir." };

  if (isInsectScreen && asksPrice) {
    return { role: "assistant", content: "Sineklik fiyatı için WhatsApp’tan bilgi alabilirsiniz.", showWhatsApp: true };
  }

  if (asksInsectScreenFabric) {
    return { role: "assistant", content: "Akordiyon sineklikte standart fiber sineklik tülü kullanılır." };
  }

  if ((currentMeasurement || asksPrice) && latestMeasurement) {
    const price = calculateNovaPrice(latestMeasurement);
    return { role: "assistant", content: `Nova serisi için yaklaşık toplam fiyat ${formatTry(price)} TL’dir.` };
  }

  if (asksBlackout) {
    return { role: "assistant", content: "Karartma için Nano Pro VR03 veya VR04 öneririm." };
  }

  if (asksMedium) {
    return { role: "assistant", content: "Orta kalite için Neo Fashion serisini öneririm." };
  }

  if (asksPremium) {
    return { role: "assistant", content: "Kaliteli seçim için Neo Fashion, daha üst seviye için Nano Pro öneririm." };
  }

  if (asksPrice) {
    return { role: "assistant", content: "İlk fiyat seçeneğimiz Nova serisidir; ölçü ve adet yazarsanız yaklaşık toplamı hesaplarım." };
  }

  if (wantsToBuy) {
    return { role: "assistant", content: "Sipariş için WhatsApp’tan bize ulaşabilirsiniz.", showWhatsApp: true };
  }

  if (asksColors) {
    return { role: "assistant", content: "Yalnızca mevcut kumaş ve profil kartelamızdaki renkleri öneririm." };
  }

  return null;
}

function normalizeAssistantContent(content: string) {
  const normalized = content.toLocaleLowerCase("tr-TR");
  if (normalized.includes("demo modundayım") || normalized.includes("ai anahtarı") || normalized.includes("claude api") || normalized.includes("anthropic api")) return maintenanceMessage;

  const cleaned = content.replace(/#{1,6}\s*/g, "").replace(/^[-*•]\s+/gm, "").replace(/\s+/g, " ").trim();
  const sentences = cleaned.match(/[^.!?]+[.!?]?/g)?.map(sentence => sentence.trim()).filter(Boolean) ?? [];
  const shortReply = sentences.slice(0, 1).join(" ").trim();
  if (!shortReply) return maintenanceMessage;
  return shortReply.length > 135 ? `${shortReply.slice(0, 132).trim()}...` : shortReply;
}

export default function AIAdvisor() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatMutation = trpc.ai.chat.useMutation();

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMessage: Message = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    requestAnimationFrame(() => textareaRef.current?.focus({ preventScroll: true }));

    const fixedAnswer = localAnswer(userMessage.content, messages);
    if (fixedAnswer) {
      setMessages(prev => [...prev, fixedAnswer]);
      return;
    }

    setIsLoading(true);
    try {
      const conversation = [...messages, userMessage].map(message => ({ role: message.role, content: message.content }));
      conversation[conversation.length - 1] = { role: "user", content: `${userMessage.content}\n\n${advisorRule}` };
      const response = await chatMutation.mutateAsync({ messages: conversation });
      const content = normalizeAssistantContent(response.content);
      setMessages(prev => [...prev, { role: "assistant", content, showWhatsApp: /whatsapp/i.test(content) }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: maintenanceMessage, showWhatsApp: true }]);
    } finally {
      setIsLoading(false);
      requestAnimationFrame(() => textareaRef.current?.focus({ preventScroll: true }));
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
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"><Sparkles className="h-3.5 w-3.5" /> Yapay Zekâ Destekli</div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3">Plise Perde Danışmanı</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto leading-6">Sorunuzu kısa şekilde yazın. Ölçü ve adet gönderirseniz Nova serisine göre yaklaşık fiyatı hesaplarım.</p>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <div className="h-[540px] flex flex-col">
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-full space-y-6">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 p-2.5 flex items-center justify-center"><BrandLogo compact className="h-full" /></div>
                <div className="text-center space-y-2"><h3 className="font-semibold">Size kısa ve doğru cevap veririm</h3><p className="text-sm text-muted-foreground max-w-md">Ölçü ve adet yazarsanız yaklaşık fiyatı hemen hesaplarım.</p></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {quickQuestions.map((question, index) => <button type="button" key={index} onClick={() => void sendMessage(question)} className="text-left text-xs px-3 py-2 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-colors">{question}</button>)}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                {message.role === "assistant" && <div className="w-9 h-9 rounded-lg bg-primary/10 p-1.5 flex items-center justify-center shrink-0"><BrandLogo compact className="h-full" /></div>}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <p>{message.content}</p>
                  {message.role === "assistant" && message.showWhatsApp && <Button asChild size="sm" className="mt-3 gap-2"><a href={WHATSAPP_URL} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp’a Geç</a></Button>}
                </div>
                {message.role === "user" && <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0"><User className="h-4 w-4" /></div>}
              </div>
            ))}

            {isLoading && <div className="flex gap-3"><div className="w-9 h-9 rounded-lg bg-primary/10 p-1.5 flex items-center justify-center shrink-0"><BrandLogo compact className="h-full" /></div><div className="bg-muted rounded-2xl px-4 py-3">...</div></div>}
          </div>

          <div className="border-t p-4"><div className="flex gap-2"><Textarea ref={textareaRef} value={input} onChange={event => setInput(event.target.value)} onKeyDown={handleKeyDown} placeholder="Plise perdeyle ilgili sorunuzu yazın..." className="min-h-[44px] max-h-32 resize-none rounded-xl" rows={1} /><Button type="button" onMouseDown={event => event.preventDefault()} onClick={() => void sendMessage(input)} disabled={!input.trim() || isLoading} size="icon" className="rounded-xl h-11 w-11 shrink-0" aria-label="Mesaj gönder"><Send className="h-4 w-4" /></Button></div></div>
        </div>
      </Card>
    </div>
  );
}
