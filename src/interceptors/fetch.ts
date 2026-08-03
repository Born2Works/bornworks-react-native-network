import type { BinarCore } from '../core/BinarCore';
import { TRACE_HEADER } from './xhr';

let traceCounter = 0;

/**
 * Wrap global.fetch so fetch traffic is recorded with full request/response
 * bodies (via Response.clone()).
 *
 * Dedupe: React Native's default fetch is a polyfill on top of XMLHttpRequest,
 * so the same request would also hit the XHR patch. The wrapper adds an
 * internal TRACE_HEADER; the XHR patch sees it, skips recording, and strips
 * the header before the request is sent.
 *
 * Returns an uninstaller that restores the original fetch.
 */
export function installFetchInterceptor(core: BinarCore): () => void {
  const g = globalThis as any;
  const origFetch: typeof fetch | undefined = g.fetch;
  if (!origFetch) return () => {};

  const wrapped: typeof fetch = async (input: any, init?: RequestInit) => {
    let id: string | null = null;
    let finalInit = init;
    try {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : (input?.url ?? String(input));
      const method =
        init?.method ?? (typeof input === 'object' && input?.method) ?? 'GET';
      const headers = normalizeHeaders(init?.headers ?? (typeof input === 'object' ? input?.headers : undefined));

      id = core.recordStart({
        client: 'fetch',
        method,
        url,
        headers,
        body: init?.body,
      });

      if (id) {
        traceCounter += 1;
        // Attach the marker so the underlying XHR layer does not double-record.
        finalInit = {
          ...init,
          headers: { ...headers, [TRACE_HEADER]: `${id}:${traceCounter}` },
        };
      }
    } catch {
      // capture must never break networking
    }

    try {
      const response = await origFetch(input, finalInit);
      if (id) {
        recordResponse(core, id, response).catch(() => {});
      }
      return response;
    } catch (err: any) {
      if (id) {
        try {
          core.recordError(id, err?.message ? String(err.message) : 'Network request failed');
        } catch {
          // ignore
        }
      }
      throw err;
    }
  };

  g.fetch = wrapped;
  return () => {
    g.fetch = origFetch;
  };
}

async function recordResponse(core: BinarCore, id: string, response: Response): Promise<void> {
  let body: string | undefined;
  try {
    // Clone so the app can still consume the original stream.
    body = await response.clone().text();
  } catch {
    body = '[unreadable body]';
  }
  const headers: Record<string, string> = {};
  try {
    response.headers?.forEach?.((value: string, key: string) => {
      headers[key] = value;
    });
  } catch {
    // ignore
  }
  core.recordSuccess(id, { status: response.status, headers, body });
}

function normalizeHeaders(headers: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!headers) return out;
  try {
    const h = headers as { forEach?: (cb: (value: string, key: string) => void) => void };
    if (typeof h.forEach === 'function') {
      h.forEach((value: string, key: string) => {
        out[key] = value;
      });
    } else if (Array.isArray(headers)) {
      for (const [k, v] of headers as [string, string][]) out[k] = v;
    } else {
      for (const [k, v] of Object.entries(headers as Record<string, string>)) out[k] = String(v);
    }
  } catch {
    // ignore
  }
  return out;
}
