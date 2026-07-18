type CapacitorBridge = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
};

declare global {
  interface Window {
    Capacitor?: CapacitorBridge;
  }
}

const dynamicImport = new Function("moduleName", "return import(moduleName)") as (
  moduleName: string
) => Promise<any>;

export function isNativeApp() {
  return Boolean(window.Capacitor?.isNativePlatform?.());
}

export async function registerNativePush() {
  if (!isNativeApp()) {
    if (typeof Notification === "undefined") {
      throw new Error("Bu tarayıcı bildirimleri desteklemiyor.");
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("Bildirim izni verilmedi.");
    return { native: false, registered: false, message: "Tarayıcı bildirimleri açıldı." };
  }

  const [{ PushNotifications }, deviceModule] = await Promise.all([
    dynamicImport("@capacitor/push-notifications"),
    dynamicImport("@capacitor/device").catch(() => null),
  ]);

  let permission = await PushNotifications.checkPermissions();
  if (permission.receive === "prompt") permission = await PushNotifications.requestPermissions();
  if (permission.receive !== "granted") throw new Error("Bildirim izni verilmedi.");

  const token = await new Promise<string>((resolve, reject) => {
    let settled = false;
    const timeout = window.setTimeout(() => {
      if (!settled) reject(new Error("Cihaz bildirim belirteci alınamadı."));
    }, 15_000);

    PushNotifications.addListener("registration", (result: { value: string }) => {
      settled = true;
      window.clearTimeout(timeout);
      resolve(result.value);
    });
    PushNotifications.addListener("registrationError", (error: unknown) => {
      settled = true;
      window.clearTimeout(timeout);
      reject(error instanceof Error ? error : new Error("Bildirim kaydı başarısız oldu."));
    });
    void PushNotifications.register();
  });

  const platform = window.Capacitor?.getPlatform?.() === "ios" ? "ios" : "android";
  let deviceName = `${platform} cihaz`;
  try {
    const info = await deviceModule?.Device?.getInfo?.();
    deviceName = [info?.manufacturer, info?.model].filter(Boolean).join(" ") || deviceName;
  } catch {
    // Device name is optional.
  }

  const response = await fetch("/api/push/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ token, platform, deviceName }),
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(data.error || "Cihaz bildirime kaydedilemedi.");

  await PushNotifications.addListener(
    "pushNotificationActionPerformed",
    (event: { notification?: { data?: Record<string, unknown> } }) => {
      const deepLink = event.notification?.data?.deepLink;
      if (typeof deepLink === "string" && deepLink.startsWith("/")) {
        window.location.href = deepLink;
      }
    }
  );

  return { native: true, registered: true, message: "Sipariş bildirimleri bu cihazda açıldı." };
}
