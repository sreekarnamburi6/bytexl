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
    const allowedHosts = new Set(["127.0.0.1", "localhost", "[::1]"]);
    if (url.protocol !== "http:" || !allowedHosts.has(url.hostname) || url.username || url.password) return null;
    return { baseUrl: url.origin, token };
  } catch {
    return null;
  }
}

export function localAiHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}