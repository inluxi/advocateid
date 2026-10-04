import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { ZodError, type ZodType } from "zod";
import { createHmac } from "node:crypto";
import { config } from "./config";
import { safeEqual, lookupHash } from "./crypto";
import { log } from "./logger";
import { SESSION_COOKIE } from "./session";
import { loadSession, type SessionInfo } from "@/repo/auth";
import { hit } from "./rate-limit";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message?: string,
    public extra?: Record<string, unknown>,
  ) {
    super(message ?? code);
  }
}

export const csrfTokenFor = (session: SessionInfo) =>
  createHmac("sha256", config.appSecret).update(`csrf:${session.tokenHash}`).digest("hex");

/** Client IP from the ingress; only ever used as a one-way hash for rate limiting. */
export function clientKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return lookupHash(`ip:${fwd || req.headers.get("x-real-ip") || "unknown"}`);
}

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") !== "cross-site";
  try {
    const o = new URL(origin).host.toLowerCase();
    const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").toLowerCase();
    return o === host;
  } catch {
    return false;
  }
}

export interface RouteOptions {
  /** "user" = needs a session, "admin" = needs an admin session. Default: public. */
  auth?: "user" | "admin";
  /** Rate limit: [bucket, limit, windowSeconds] keyed by hashed client IP. */
  limit?: [string, number, number];
}

export interface Ctx<P = Record<string, string>> {
  req: NextRequest;
  params: P;
  session: SessionInfo | null;
}

type Handler<P> = (ctx: Ctx<P>) => Promise<Response | object | void>;

/** Wraps an API handler: origin/CSRF checks, auth, rate limit, error mapping. No personal data in logs. */
export function route<P = Record<string, string>>(handler: Handler<P>, opts: RouteOptions = {}) {
  return async (req: NextRequest, rc: { params: Promise<P> }): Promise<Response> => {
    try {
      const mutating = !["GET", "HEAD", "OPTIONS"].includes(req.method);
      if (mutating && !sameOrigin(req)) throw new ApiError(403, "bad_origin");

      if (opts.limit) {
        const r = await hit(opts.limit[0], clientKey(req), opts.limit[1], opts.limit[2]);
        if (!r.ok) throw new ApiError(429, "rate_limited", "Too many requests. Try again later.");
      }

      let session: SessionInfo | null = null;
      const token = (await cookies()).get(SESSION_COOKIE)?.value;
      if (token) session = await loadSession(token);
      if (opts.auth && !session) throw new ApiError(401, "unauthenticated");
      if (opts.auth === "admin" && session?.role !== "admin") throw new ApiError(403, "forbidden");

      if (mutating && session) {
        const sent = req.headers.get("x-csrf-token") ?? "";
        if (!sent || !safeEqual(sent, csrfTokenFor(session))) throw new ApiError(403, "bad_csrf");
      }

      const out = await handler({ req, params: await rc.params, session });
      if (out instanceof Response) return out;
      return NextResponse.json(out ?? { ok: true });
    } catch (e) {
      if (e instanceof ApiError) {
        return NextResponse.json({ error: e.code, message: e.message, ...e.extra }, { status: e.status });
      }
      if (e instanceof ZodError) {
        return NextResponse.json(
          { error: "invalid_input", fields: e.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
          { status: 400 },
        );
      }
      log.error("api_error", e, { path: req.nextUrl.pathname });
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
  };
}

export async function readJson<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "invalid_json");
  }
  return schema.parse(body);
}

export const notFound = () => new ApiError(404, "not_found");
export const forbidden = () => new ApiError(403, "forbidden");
