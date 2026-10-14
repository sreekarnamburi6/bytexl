
export type LocalAiServiceConfig = {
  baseUrl: string;
  token: string;
};

export function getLocalAiServiceConfig(): LocalAiServiceConfig | null {
  const configuredUrl = process.env.AI_SERVICE_URL;
  const token = process.env.AI_SERVICE_TOKEN;

  if (!configuredUrl || !token) return null;

  try {
    const url = new URL(configuredUrl);
    const isLocal =
      url.protocol === "http:" &&
      ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);

    const isProductionService =
      url.protocol === "https:" &&
      url.hostname === "mediscope-ai-service.onrender.com";

    if (
      (!isLocal && !isProductionService) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return null;
    }

    return { baseUrl: url.origin, token };
  } catch {
    return null;
  }
}

export function localAiHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}
