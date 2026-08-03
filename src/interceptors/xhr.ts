import type { BinarCore } from '../core/BinarCore';
import { parseRawHeaders } from '../utils/format';

/**
 * Internal marker header added by the fetch interceptor so requests that
 * ride on XHR underneath (React Native's fetch polyfill) are not recorded twice.
 * The XHR patch strips it before the request leaves the device.
 */
export const TRACE_HEADER = 'x-binar-trace';

interface XhrMeta {
  method: string;
  url: string;
  headers: Record<string, string>;
  /** Set when the request originates from the fetch interceptor. */
  tracedByFetch?: boolean;
  id?: string | null;
}

type AnyXhr = XMLHttpRequest & { __binar?: XhrMeta };

/**
 * Patch XMLHttpRequest.prototype so every XHR-based request is captured.
 * In React Native this covers axios (xhr adapter), the built-in fetch
 * polyfill, and raw XHR usage — one patch, three client paths.
 *
 * Returns an uninstaller that restores the original methods.
 */
export function installXHRInterceptor(core: BinarCore): () => void {
  const XHR: typeof XMLHttpRequest | undefined = (globalThis as any).XMLHttpRequest;
  if (!XHR) return () => {};

  const proto = XHR.prototype;
  const origOpen = proto.open;
  const origSend = proto.send;
  const origSetRequestHeader = proto.setRequestHeader;

  proto.open = function (this: AnyXhr, method: string, url: string | URL, ...rest: any[]) {
    try {
      this.__binar = { method, url: String(url), headers: {} };
    } catch {
      // capture must never break networking
    }
    return (origOpen as any).apply(this, [method, url, ...rest]);
  } as typeof proto.open;

  proto.setRequestHeader = function (this: AnyXhr, name: string, value: string) {
    try {
      const meta = this.__binar;
      if (meta) {
        if (name.toLowerCase() === TRACE_HEADER) {
          // Marker from the fetch interceptor: remember it and DROP the header
          // so it never reaches the server.
          meta.tracedByFetch = true;
          return;
        }
        // Repeated headers are comma-joined, mirroring XHR semantics.
        meta.headers[name] =
          meta.headers[name] !== undefined ? `${meta.headers[name]}, ${value}` : value;
      }
    } catch {
      // ignore
    }
    return (origSetRequestHeader as any).apply(this, [name, value]);
  } as typeof proto.setRequestHeader;

  proto.send = function (this: AnyXhr, body?: unknown) {
    try {
      const meta = this.__binar;
      // Requests already recorded by the fetch interceptor are skipped here.
      if (meta && !meta.tracedByFetch) {
        meta.id = core.recordStart({
          client: 'xhr',
          method: meta.method,
          url: meta.url,
          headers: meta.headers,
          body,
        });
        if (meta.id) {
          const onLoadEnd = () => {
            try {
              const id = meta.id!;
              // "timeout" fires before "loadend"; do not overwrite a final state.
              if (core.store.get(id)?.state !== 'pending') return;
              if (this.status === 0) {
                core.recordError(id, 'Network error / request aborted');
                return;
              }
              core.recordSuccess(id, {
                status: this.status,
                headers: parseRawHeaders(this.getAllResponseHeaders()),
                body: readXhrBody(this),
              });
            } catch {
              // ignore
            }
          };
          const onTimeout = () => {
            try {
              core.recordError(meta.id!, 'Request timed out');
            } catch {
              // ignore
            }
          };
          this.addEventListener('loadend', onLoadEnd);
          this.addEventListener('timeout', onTimeout);
        }
      }
    } catch {
      // ignore
    }
    return (origSend as any).apply(this, [body]);
  } as typeof proto.send;

  return () => {
    proto.open = origOpen;
    proto.send = origSend;
    proto.setRequestHeader = origSetRequestHeader;
  };
}

function readXhrBody(xhr: XMLHttpRequest): unknown {
  try {
    const type = (xhr as any).responseType as string | undefined;
    if (!type || type === '' || type === 'text') return xhr.responseText;
    if (type === 'json') return xhr.response;
    if (type === 'arraybuffer' || type === 'blob') return xhr.response;
    return `[${type} response]`;
  } catch {
    return undefined;
  }
}
