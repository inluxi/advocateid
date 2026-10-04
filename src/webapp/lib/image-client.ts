"use client";

/**
 * Browser-side image handling: resize to three sizes (200, 800, 1600 px wide, WebP or JPEG) before upload,
 * upload in the background with progress, and keep failed uploads in IndexedDB so they continue when the
 * connection comes back (PWA). The original is never uploaded or kept.
 */

export const SIZES = { s: 200, m: 800, l: 1600 } as const;
export type SizeKey = keyof typeof SIZES;
export const MAX_ORIGINAL_BYTES = 25 * 1024 * 1024;

async function toBlob(canvas: HTMLCanvasElement | OffscreenCanvas, type: string, quality: number): Promise<Blob> {
  if ("convertToBlob" in canvas) return canvas.convertToBlob({ type, quality });
  return new Promise((resolve, reject) => (canvas as HTMLCanvasElement).toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), type, quality));
}

export async function resizeToSizes(file: File): Promise<Record<SizeKey, Blob>> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
  const out = {} as Record<SizeKey, Blob>;
  for (const key of Object.keys(SIZES) as SizeKey[]) {
    const w = Math.min(SIZES[key], bitmap.width); // never upscale
    const h = Math.round((bitmap.height * w) / bitmap.width);
    const canvas: HTMLCanvasElement | OffscreenCanvas = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(w, h) : Object.assign(document.createElement("canvas"), { width: w, height: h });
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.drawImage(bitmap, 0, 0, w, h);
    let blob = await toBlob(canvas, "image/webp", 0.82);
    if (blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", 0.85); // browsers without WebP encoding
    out[key] = blob;
  }
  bitmap.close();
  return out;
}

/* -------------------------------------------------------- persistent queue */

interface Pending {
  id?: number;
  pageId: number;
  kind: string;
  blobs: Record<SizeKey, Blob>;
  csrf: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("aid-uploads", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("pending", { keyPath: "id", autoIncrement: true });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idb<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending", mode);
    const req = fn(tx.objectStore("pending"));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export type UploadStatus = { state: "idle" } | { state: "resizing" } | { state: "uploading"; pct: number } | { state: "queued" } | { state: "done"; key: string } | { state: "error"; message: string };

function xhrUpload(p: Pending, onProgress?: (pct: number) => void): Promise<{ ok: boolean; status: number; key?: string; message?: string; network?: boolean }> {
  return new Promise((resolve) => {
    const fd = new FormData();
    fd.set("kind", p.kind);
    for (const k of Object.keys(SIZES) as SizeKey[]) fd.set(k, p.blobs[k], `${k}.webp`);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/pages/${p.pageId}/images`);
    xhr.setRequestHeader("x-csrf-token", p.csrf);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onerror = () => resolve({ ok: false, status: 0, network: true });
    xhr.ontimeout = () => resolve({ ok: false, status: 0, network: true });
    xhr.onload = () => {
      let data: { key?: string; message?: string } = {};
      try { data = JSON.parse(xhr.responseText); } catch { /* ignore */ }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, key: data.key, message: data.message });
    };
    xhr.send(fd);
  });
}

/** Resize, upload with progress; on a network failure keep the pictures and retry when back online. */
export async function uploadImage(args: { pageId: number; kind: string; file: File; csrf: string; onStatus: (s: UploadStatus) => void }): Promise<void> {
  const { pageId, kind, file, csrf, onStatus } = args;
  if (file.size > MAX_ORIGINAL_BYTES) return onStatus({ state: "error", message: "too_large" });
  onStatus({ state: "resizing" });
  let blobs: Record<SizeKey, Blob>;
  try {
    blobs = await resizeToSizes(file);
  } catch {
    return onStatus({ state: "error", message: "not_an_image" });
  }
  const item: Pending = { pageId, kind, blobs, csrf };
  onStatus({ state: "uploading", pct: 0 });
  const r = await xhrUpload(item, (pct) => onStatus({ state: "uploading", pct }));
  if (r.ok && r.key) return onStatus({ state: "done", key: r.key });
  if (r.network) {
    try {
      await idb("readwrite", (s) => s.add(item));
      onStatus({ state: "queued" });
      window.addEventListener("online", () => void flushPending(onStatus), { once: true });
    } catch {
      onStatus({ state: "error", message: "network" });
    }
    return;
  }
  onStatus({ state: "error", message: r.message ?? String(r.status) });
}

/** Retry uploads that were interrupted (called when the editor opens and when the browser goes online). */
export async function flushPending(onStatus?: (s: UploadStatus) => void): Promise<void> {
  let items: (Pending & { id: number })[] = [];
  try {
    items = (await idb("readonly", (s) => s.getAll())) as (Pending & { id: number })[];
  } catch {
    return;
  }
  for (const it of items) {
    const r = await xhrUpload(it);
    if (r.ok || !r.network) {
      await idb("readwrite", (s) => s.delete(it.id));
      if (r.ok && r.key) onStatus?.({ state: "done", key: r.key });
    }
  }
}
