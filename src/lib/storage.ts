import { mkdir, rm, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { config } from "./config";

/**
 * Image storage adapter. Providers: "local" (development) and "firebase" (Google Cloud Storage bucket).
 * Images are stored in three sizes (s/m/l); the original is never kept.
 */
export interface Storage {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  remove(key: string): Promise<void>;
  get?(key: string): Promise<Buffer | null>;
}

const UPLOAD_DIR = () => path.resolve(process.env.UPLOAD_DIR ?? "uploads");

const local: Storage = {
  async put(key, data) {
    const file = path.join(UPLOAD_DIR(), key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, data);
  },
  async remove(key) {
    await rm(path.join(UPLOAD_DIR(), key), { force: true });
  },
  async get(key) {
    try {
      return await readFile(path.join(UPLOAD_DIR(), key));
    } catch {
      return null;
    }
  },
};

let gcs: Storage | null = null;
async function firebase(): Promise<Storage> {
  if (gcs) return gcs;
  const bucketName = process.env.FIREBASE_BUCKET;
  const creds = process.env.FIREBASE_SERVICE_ACCOUNT; // JSON string from a Kubernetes Secret
  if (!bucketName || !creds) throw new Error("Firebase storage is not configured");
  const { Storage: GCS } = await import("@google-cloud/storage");
  const bucket = new GCS({ credentials: JSON.parse(creds) }).bucket(bucketName);
  gcs = {
    async put(key, data, contentType) {
      await bucket.file(key).save(data, { contentType, resumable: false, metadata: { cacheControl: "public, max-age=31536000, immutable" } });
    },
    async remove(key) {
      await bucket.file(key).delete({ ignoreNotFound: true });
    },
    async get(key) {
      try {
        const [buf] = await bucket.file(key).download();
        return buf;
      } catch {
        return null;
      }
    },
  };
  return gcs;
}

export async function getStorage(): Promise<Storage> {
  return config.storageProvider === "firebase" ? firebase() : local;
}

export const IMAGE_SIZES = { s: 200, m: 800, l: 1600 } as const;
export type ImageSize = keyof typeof IMAGE_SIZES;

/** Public URL for one size of a stored image (key is the base without the size suffix). */
export function imageUrl(key: string | null | undefined, size: ImageSize = "m"): string | null {
  if (!key) return null;
  return `${config.storagePublicBase.replace(/\/$/, "")}/${key}-${size}.webp`;
}

export function detectImageType(buf: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

export const IMAGE_LIMITS = { photo: 5 * 1024 * 1024, banner: 10 * 1024 * 1024, office: 5 * 1024 * 1024, cover: 5 * 1024 * 1024 } as const;
export type ImageKind = keyof typeof IMAGE_LIMITS;
