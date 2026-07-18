import { trpc } from "@/lib/trpc";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { startLogin } from "./const";
import "./index.css";

const analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
const analyticsWebsiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;
const RECORDING_KEY = "rgnfix:measurement-recording";

if (analyticsEndpoint && analyticsWebsiteId) {
  const analyticsScript = document.createElement("script");
  analyticsScript.defer = true;
  analyticsScript.src = `${analyticsEndpoint.replace(/\/$/, "")}/umami`;
  analyticsScript.dataset.websiteId = analyticsWebsiteId;
  document.head.appendChild(analyticsScript);
}

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;
  if (!isUnauthorized) return;
  startLogin();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

function attachMeasurementRecording(input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  if (!url.includes("/api/trpc/orders.create") || typeof init?.body !== "string") return init;

  try {
    const recordingUrl = sessionStorage.getItem(RECORDING_KEY);
    if (!recordingUrl) return init;
    const body = JSON.parse(init.body) as Record<string, { json?: Record<string, unknown> }>;
    let attached = false;
    Object.values(body).forEach(entry => {
      if (!entry?.json || attached) return;
      const existing = typeof entry.json.customerNote === "string" ? entry.json.customerNote.trim() : "";
      entry.json.customerNote = [
        existing,
        "Müşteri izinli ölçüm kaydı:",
        recordingUrl,
      ].filter(Boolean).join("\n");
      attached = true;
    });
    return { ...init, body: JSON.stringify(body) };
  } catch (error) {
    console.warn("[Order] Measurement recording could not be attached:", error);
    return init;
  }
}

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        try {
          const raw = sessionStorage.getItem("manus-cookie");
          if (raw) {
            const prefix = `${COOKIE_NAME}=`;
            const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
            const token = pair?.trim().slice(prefix.length);
            if (token) return { Authorization: `Bearer ${token}` };
          }
        } catch {
          // sessionStorage unavailable
        }
        return {};
      },
      async fetch(input, init) {
        const nextInit = attachMeasurementRecording(input, init);
        const response = await globalThis.fetch(input, {
          ...(nextInit ?? {}),
          credentials: "include",
        });
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        if (response.ok && url.includes("/api/trpc/orders.create")) {
          sessionStorage.removeItem(RECORDING_KEY);
        }
        return response;
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
