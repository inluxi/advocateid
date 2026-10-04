"use client";

/** Small fetch wrapper for client components: JSON in/out, CSRF token from /api/auth/me, uniform errors. */

export interface ApiFailure {
  ok: false;
  status: number;
  error: string;
  message?: string;
  flags?: Record<string, { phrase: string; suggestion: string }[]>;
  fields?: { path: string; message: string }[];
}
export type ApiResult<T = Record<string, unknown>> = ({ ok: true } & T) | ApiFailure;

let csrf: string | null = null;

export async function csrfToken(force = false): Promise<string | null> {
  if (csrf && !force) return csrf;
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    const data = await res.json();
    csrf = data.csrfToken ?? null;
  } catch {
    csrf = null;
  }
  return csrf;
}

export async function api<T = Record<string, unknown>>(method: string, url: string, body?: unknown): Promise<ApiResult<T>> {
  const send = async () => {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["content-type"] = "application/json";
    if (method !== "GET") headers["x-csrf-token"] = (await csrfToken()) ?? "";
    return fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  };
  let res = await send();
  if (res.status === 403) {
    // token may be stale after re-login
    await csrfToken(true);
    res = await send();
  }
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (res.ok) return { ok: true, ...(data ?? {}) } as ApiResult<T>;
  return { ok: false, status: res.status, error: data?.error ?? "error", message: data?.message, flags: data?.flags, fields: data?.fields };
}

export const get = <T,>(url: string) => api<T>("GET", url);
export const post = <T,>(url: string, body?: unknown) => api<T>("POST", url, body ?? {});
export const put = <T,>(url: string, body: unknown) => api<T>("PUT", url, body);
export const del = <T,>(url: string) => api<T>("DELETE", url);
