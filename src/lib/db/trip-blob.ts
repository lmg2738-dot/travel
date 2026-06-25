import { del, get, put } from "@vercel/blob";
import { isVercelRuntime } from "@/lib/runtime-config";

const BLOB_ROOT = "tripmind";
export const BLOB_INDEX_PATH = `${BLOB_ROOT}/index.json`;

export function tripBlobPath(id: string): string {
  return `${BLOB_ROOT}/trips/${id}.json`;
}

export function blobStorageEnabled(): boolean {
  if (!isVercelRuntime()) return false;
  return !!(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
    process.env.BLOB_STORE_ID?.trim()
  );
}

async function streamToText(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return new TextDecoder().decode(merged);
}

export async function readBlobJson<T>(pathname: string): Promise<T | null> {
  try {
    const result = await get(pathname, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return null;
    }

    const text = await streamToText(result.stream);
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function writeBlobJson(
  pathname: string,
  data: unknown
): Promise<void> {
  await put(pathname, JSON.stringify(data), {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

export async function deleteBlob(pathname: string): Promise<void> {
  try {
    await del(pathname);
  } catch {
    // ignore missing blobs
  }
}
