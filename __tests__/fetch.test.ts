import { DavinaCore } from '../src/core/DavinaCore';
import { TRACE_HEADER } from '../src/interceptors/xhr';

function fakeResponse(status: number, body: string, headers: Record<string, string> = {}) {
  return {
    status,
    headers: {
      forEach: (cb: (v: string, k: string) => void) =>
        Object.entries(headers).forEach(([k, v]) => cb(v, k)),
    },
    clone() {
      return { text: async () => body };
    },
  } as unknown as Response;
}

describe('fetch interceptor', () => {
  let core: DavinaCore;
  let received: { input: unknown; init?: RequestInit } | null;

  beforeEach(() => {
    received = null;
    delete (globalThis as any).XMLHttpRequest; // isolate: no XHR interceptor here
    (globalThis as any).fetch = jest.fn(async (input: any, init?: RequestInit) => {
      received = { input, init };
      return fakeResponse(200, '{"ok":true}', { 'content-type': 'application/json' });
    });
    core = new DavinaCore();
    core.init({ enabled: true });
  });

  afterEach(() => {
    core.uninstall();
    delete (globalThis as any).fetch;
  });

  it('records fetch calls with request/response bodies and adds the trace marker', async () => {
    const res = await (globalThis as any).fetch('https://api.dev/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer x' },
      body: '{"name":"a"}',
    });
    expect(res.status).toBe(200);

    // marker forwarded to the underlying transport (XHR patch strips it there)
    const sentHeaders = received!.init!.headers as Record<string, string>;
    expect(sentHeaders[TRACE_HEADER]).toBeDefined();

    // exactly one record, from the fetch layer
    await new Promise<void>((resolve) => setTimeout(resolve, 0)); // let the async body read settle
    const calls = core.store.getAll();
    expect(calls).toHaveLength(1);
    const call = calls[0];
    expect(call.client).toBe('fetch');
    expect(call.method).toBe('POST');
    expect(call.request.body).toBe('{"name":"a"}');
    expect(call.request.headers.Authorization).toBe('***');
    expect(call.state).toBe('success');
    expect(call.response?.body).toBe('{"ok":true}');
    expect(call.response?.headers['content-type']).toBe('application/json');
  });

  it('records network failures as errors and rethrows', async () => {
    ((globalThis as any).fetch as jest.Mock).mockRestore?.();
    core.uninstall();
    (globalThis as any).fetch = jest.fn(async () => {
      throw new Error('Network request failed');
    });
    core = new DavinaCore();
    core.init({ enabled: true });

    await expect((globalThis as any).fetch('https://api.dev/fail')).rejects.toThrow(
      'Network request failed'
    );
    const call = core.store.getAll()[0];
    expect(call.state).toBe('error');
    expect(call.error?.message).toBe('Network request failed');
  });

  it('uninstall restores the original fetch', () => {
    const orig = ((): unknown => {
      core.uninstall();
      return (globalThis as any).fetch;
    })();
    expect(jest.isMockFunction(orig)).toBe(true);
  });
});
