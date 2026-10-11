export function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32)) {
    throw new Error("AUTH_SECRET must contain at least 32 characters in production.");
  }
  return secret ?? "development-only-secret-do-not-deploy";
}