import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, Sparkles, User } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const quickQuestions = [
  "Cam balkonum için hangi ürün uygun?",
  "Pencere sineklik fiyatı nedir?",
  "Kapı sineklik fiyatı nedir?",
  "Kiracıyım, vidasız montaj istiyorum",
  "Çift cam için hangi kasa seçilir?",
  "Ölçüyü nasıl almalıyım?",
];

const maintenanceMessage =
  "Yapay zekâ danışmanımız geçici olarak kullanılamıyor. Ölçü, fiyat ve sipariş işlemlerinize diğer bölümlerden devam edebilirsiniz.";

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
  return content;
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
    setIsLoading(true);

    try {
      const response = await chatMutation.mutateAsync({
        messages: [...messages, userMessage].map(message => ({ role: message.role, content: message.content })),
      });
      setMessages(prev => [...prev, { role: "assistant", content: normalizeAssistantContent(response.content) }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: maintenanceMessage }]);
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
        <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3">Akıllı Ürün Danışmanı</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          İhtiyacınızı kısaca anlatın; ürün, ölçü, montaj ve sipariş sürecinde size yardımcı olalım.
        </p>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <div className="h-[500px] flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"><Bot className="h-8 w-8 text-primary" /></div>
                <div className="text-center space-y-2">
                  <h3 className="font-semibold">Merhaba! Ben RGNFIX AI Danışmanınız.</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Plise perde, sineklik ve ileride eklenecek diğer demonte ürünler için kısa ve net destek verebilirim.
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
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {message.role === "assistant" ? <Streamdown>{message.content}</Streamdown> : message.content}
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
              <Textarea value={input} onChange={event => setInput(event.target.value)} onKeyDown={handleKeyDown} placeholder="Sorunuzu kısa yazın..." className="min-h-[44px] max-h-32 resize-none rounded-xl" rows={1} />
              <Button onClick={() => void sendMessage(input)} disabled={!input.trim() || isLoading} size="icon" className="rounded-xl h-11 w-11 shrink-0" aria-label="Mesaj gönder"><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
