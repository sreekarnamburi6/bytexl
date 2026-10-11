import { promises as fs } from "node:fs";
import path from "node:path";

const UPLOAD_ROOT = path.join(process.cwd(), "data", "uploads");

export function getDocumentStoragePath(userId: string, storedPath: string): string {
  const normalizedPath = storedPath.replaceAll("\\", "/");
  const legacyPrefix = `/uploads/${userId}/`;
  const isLegacyPath = normalizedPath.startsWith(legacyPrefix);
  const fileName = path.posix.basename(normalizedPath);
  const relativePath = isLegacyPath ? normalizedPath.slice(legacyPrefix.length) : normalizedPath;
  if (!fileName || fileName === "." || fileName === ".." || relativePath !== fileName || normalizedPath.includes("..")) {
    throw new Error("Invalid document storage path.");
  }

  const root = isLegacyPath
    ? path.join(process.cwd(), "public", "uploads", userId)
    : path.join(UPLOAD_ROOT, userId);
  const resolvedRoot = path.resolve(root);
  const resolvedFile = path.resolve(resolvedRoot, fileName);
  if (!resolvedFile.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error("Invalid document storage path.");
  }
  return resolvedFile;
}

export async function removeDocumentFile(userId: string, storedPath: string) {
  try {
    await fs.unlink(getDocumentStoragePath(userId, storedPath));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}