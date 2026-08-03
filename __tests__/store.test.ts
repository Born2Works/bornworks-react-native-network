import { CallStore } from '../src/core/CallStore';
import type { HttpCall } from '../src/types';

function call(id: string): HttpCall {
  return {
    id,
    client: 'xhr',
    method: 'GET',
    url: `https://x.dev/${id}`,
    startedAt: Date.now(),
    state: 'pending',
    request: { headers: {} },
  };
}

describe('CallStore', () => {
  it('keeps newest first and evicts past maxCallsCount', () => {
    const store = new CallStore(3);
    ['a', 'b', 'c', 'd'].forEach((id) => store.add(call(id)));
    expect(store.getAll().map((c) => c.id)).toEqual(['d', 'c', 'b']);
  });

  it('updates a call by id and notifies subscribers', () => {
    const store = new CallStore(10);
    const seen: number[] = [];
    store.subscribe(() => seen.push(store.getAll().length));
    store.add(call('a'));
    store.update('a', { state: 'success', durationMs: 12 });
    expect(store.get('a')?.state).toBe('success');
    expect(store.get('a')?.durationMs).toBe(12);
    expect(seen.length).toBe(2);
  });

  it('update on an evicted id is a silent no-op', () => {
    const store = new CallStore(1);
    store.add(call('a'));
    store.add(call('b')); // evicts a
    expect(() => store.update('a', { state: 'success' })).not.toThrow();
    expect(store.get('a')).toBeUndefined();
  });

  it('clear empties the buffer', () => {
    const store = new CallStore(10);
    store.add(call('a'));
    store.clear();
    expect(store.getAll()).toHaveLength(0);
  });

  it('a throwing subscriber does not break other subscribers', () => {
    const store = new CallStore(10);
    let ok = false;
    store.subscribe(() => {
      throw new Error('boom');
    });
    store.subscribe(() => {
      ok = true;
    });
    store.add(call('a'));
    expect(ok).toBe(true);
  });
});
