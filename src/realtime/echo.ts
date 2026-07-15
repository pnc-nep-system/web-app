import Echo from "laravel-echo";
import Pusher from "pusher-js";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const apiRootUrl = apiBaseUrl.replace(/\/api\/?$/, "");

let echo: Echo<"reverb"> | null = null;

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo?: Echo<"reverb">;
  }
}

export function getEcho() {
  if (echo) return echo;

  window.Pusher = Pusher;

  echo = new Echo({
    broadcaster: "reverb",
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT || 80),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT || 443),
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME || "https") === "https",
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${apiRootUrl}/broadcasting/auth`,
    channelAuthorization: {
      endpoint: `${apiRootUrl}/broadcasting/auth`,
      transport: "ajax",
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      withCredentials: true,
    },
  });

  window.Echo = echo;

  return echo;
}

export function disconnectEcho() {
  if (!echo) return;

  echo.disconnect();
  echo = null;
  delete window.Echo;
}
