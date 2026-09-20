// Server infrastructure only; never import this module from a client component.
import { Buffer } from "node:buffer";
import { WCL_SITES, type WarcraftLogsSiteContext } from "./context.ts";

if (typeof window !== "undefined") throw new Error("Warcraft Logs transport is server-only.");

export const WCL_TOKEN_ENDPOINT = "https://www.warcraftlogs.com/oauth/token";

export type WclFailure = "configuration" | "authentication" | "rate-limit" | "upstream" | "timeout" | "invalid-response";
export class WclTransportError extends Error {
  readonly kind: WclFailure;
  readonly retryAfterSeconds?: number;
  readonly httpStatus?: number;
  operationName?: string;
  constructor(kind: WclFailure, retryAfterSeconds?: number, httpStatus?: number) {
    super("Warcraft Logs is temporarily unavailable.");
    this.name = "WclTransportError";
    this.kind = kind;
    this.retryAfterSeconds = retryAfterSeconds;
    this.httpStatus = httpStatus;
  }
}

type Options = {
  credentials: () => { clientId: string; clientSecret: string } | undefined;
  fetch?: typeof fetch;
  now?: () => number;
  timeoutMs?: number;
};
export type GraphqlResult = {
  data: Record<string, unknown> | null;
  httpStatus: number;
  operationName: string;
  errors: { path: (string | number)[]; message: string }[];
};
// Preserve useful schema diagnostics only. Arbitrary upstream prose, values,
// extensions and authentication details never cross the transport boundary.
export function safeGraphqlMessage(value: unknown, sensitive: string[] = []): string {
  if (typeof value !== "string") return "GraphQL request failed.";
  if (sensitive.some(secret => secret && value.includes(secret))) return "GraphQL request failed (sensitive details withheld).";
  const identifier = '[A-Za-z_][A-Za-z0-9_]{0,63}';
  const patterns = [
    `^Cannot query field "${identifier}" on type "${identifier}"\\.`,
    `^Unknown argument "${identifier}" on field "${identifier}(?:\\.${identifier})?"\\.`,
    `^Unknown type "${identifier}"\\.`,
    `^Field "${identifier}" of type "[A-Za-z_!\\[\\]]{1,80}" must have a selection of subfields\\.`,
    `^Field "${identifier}" must not have a selection since type "[A-Za-z_!\\[\\]]{1,80}" has no subfields\\.`,
  ];
  for (const pattern of patterns) { const match = value.match(new RegExp(pattern)); if (match) return match[0]; }
  return "GraphQL request failed (unrecognized upstream details withheld).";
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** No endpoint overrides, redirects, automatic retries, logging or persistence. */
export class WclTransport {
  #options: Options;
  #token?: { value: string; refreshAt: number };
  #pending?: Promise<string>;
  constructor(options: Options) { this.#options = options; }

  async #request(url: string, init: RequestInit): Promise<{ json: unknown; httpStatus: number }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.#options.timeoutMs ?? 8000);
    try {
      const response = await (this.#options.fetch ?? fetch)(url, {
        ...init, redirect: "error", cache: "no-store", signal: controller.signal,
      });
      if (response.status === 401 || response.status === 403) throw new WclTransportError("authentication", undefined, response.status);
      if (response.status === 429) {
        const header = response.headers.get("retry-after");
        const seconds = header && /^\d+$/.test(header) ? Number(header) : NaN;
        throw new WclTransportError("rate-limit", Number.isFinite(seconds) ? Math.min(300, Math.max(1, seconds)) : 30, response.status);
      }
      if (!response.ok) throw new WclTransportError("upstream", undefined, response.status);
      try { return { json: await response.json(), httpStatus: response.status }; }
      catch { throw new WclTransportError(controller.signal.aborted ? "timeout" : "invalid-response"); }
    } catch (error) {
      if (error instanceof WclTransportError) throw error;
      throw new WclTransportError(controller.signal.aborted ? "timeout" : "upstream");
    } finally { clearTimeout(timer); }
  }

  async #accessToken(): Promise<string> {
    const now = this.#options.now ?? Date.now;
    if (this.#token && now() < this.#token.refreshAt) return this.#token.value;
    if (this.#pending) return this.#pending;
    this.#pending = (async () => {
      const credentials = this.#options.credentials();
      if (!credentials?.clientId.trim() || !credentials.clientSecret.trim()) throw new WclTransportError("configuration");
      const startedAt = now();
      const body = new FormData();
      body.set("grant_type", "client_credentials");
      const { json: raw } = await this.#request(WCL_TOKEN_ENDPOINT, {
        method: "POST", body,
        headers: { Authorization: `Basic ${Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString("base64")}` },
      });
      if (!record(raw) || typeof raw.access_token !== "string" || !raw.access_token ||
          /[\r\n]/.test(raw.access_token) || typeof raw.expires_in !== "number" ||
          !Number.isFinite(raw.expires_in) || raw.expires_in <= 0 ||
          (raw.token_type !== undefined && String(raw.token_type).toLowerCase() !== "bearer")) {
        throw new WclTransportError("invalid-response");
      }
      const lifetime = raw.expires_in * 1000;
      const refreshAt = startedAt + lifetime - Math.min(60_000, lifetime * 0.1);
      if (!Number.isFinite(refreshAt) || refreshAt <= now()) throw new WclTransportError("invalid-response");
      this.#token = { value: raw.access_token, refreshAt };
      return raw.access_token;
    })();
    try { return await this.#pending; }
    finally { this.#pending = undefined; }
  }

  async query(site: WarcraftLogsSiteContext, query: string, variables: Record<string, unknown> = {}): Promise<GraphqlResult> {
    if (!Object.hasOwn(WCL_SITES, site)) throw new WclTransportError("configuration");
    const token = await this.#accessToken();
    let raw: unknown;
    let httpStatus: number;
    const operationName = query.match(/^\s*query\s+([A-Za-z_][A-Za-z0-9_]{0,63})\b/)?.[1] ?? "AnonymousQuery";
    try {
      const result = await this.#request(WCL_SITES[site].graphql, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
      });
      raw = result.json; httpStatus = result.httpStatus;
    } catch (error) {
      if (error instanceof WclTransportError) error.operationName = operationName;
      if (error instanceof WclTransportError && error.kind === "authentication" && this.#token?.value === token) this.#token = undefined;
      throw error;
    }
    if (!record(raw) || (raw.data !== null && raw.data !== undefined && !record(raw.data)) ||
        (raw.errors !== undefined && (!Array.isArray(raw.errors) || raw.errors.some(error => !record(error)))) ||
        (!record(raw.data) && !(Array.isArray(raw.errors) && raw.errors.length))) {
      throw new WclTransportError("invalid-response");
    }
    const credentials = this.#options.credentials();
    const sensitive = [token, credentials?.clientSecret, credentials?.clientId].filter((v): v is string => Boolean(v));
    const errors = Array.isArray(raw.errors) ? raw.errors.map(error => ({
      path: Array.isArray(error.path) && error.path.length <= 20 && error.path.every((part: unknown) => typeof part === "string" ? /^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(part) && !sensitive.some(value => part.includes(value)) : Number.isInteger(part)) ? error.path as (string | number)[] : [],
      message: safeGraphqlMessage(error.message, sensitive),
    })) : [];
    return { data: record(raw.data) ? raw.data : null, errors, httpStatus, operationName };
  }
}

// Kept at module scope to share the short-lived token and in-flight acquisition.
export const warcraftLogsTransport = new WclTransport({ credentials: () => {
  const clientId = process.env.WARCRAFT_LOGS_CLIENT_ID;
  const clientSecret = process.env.WARCRAFT_LOGS_CLIENT_SECRET;
  return clientId && clientSecret ? { clientId, clientSecret } : undefined;
} });
