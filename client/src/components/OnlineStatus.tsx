import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export default function OnlineStatus() {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-black shadow-lg" role="status" aria-live="polite">
      <WifiOff className="h-4 w-4" />
      İnternet bağlantısı yok. Bağlantı geldiğinde işlemlerinize devam edebilirsiniz.
    </div>
  );
}
