import type { HttpCall } from '../types';

type Listener = () => void;

/**
 * In-memory ring buffer of HttpCall records.
 * Newest calls first. Oldest evicted past maxCallsCount.
 */
export class CallStore {
  private calls: HttpCall[] = [];
  private listeners = new Set<Listener>();
  private maxCallsCount: number;

  constructor(maxCallsCount: number) {
    this.maxCallsCount = maxCallsCount;
  }

  setMaxCallsCount(n: number): void {
    this.maxCallsCount = n;
    this.trim();
  }

  add(call: HttpCall): void {
    this.calls = [call, ...this.calls];
    this.trim();
    this.emit();
  }

  /** Merge a partial update into an existing call by id. No-op when the id is unknown (already evicted). */
  update(id: string, patch: Partial<HttpCall>): void {
    let changed = false;
    this.calls = this.calls.map((c) => {
      if (c.id !== id) return c;
      changed = true;
      return { ...c, ...patch };
    });
    if (changed) this.emit();
  }

  get(id: string): HttpCall | undefined {
    return this.calls.find((c) => c.id === id);
  }

  /** Snapshot array — stable reference between mutations (for useSyncExternalStore). */
  getAll(): HttpCall[] {
    return this.calls;
  }

  clear(): void {
    if (this.calls.length === 0) return;
    this.calls = [];
    this.emit();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private trim(): void {
    if (this.calls.length > this.maxCallsCount) {
      this.calls = this.calls.slice(0, this.maxCallsCount);
    }
  }

  private emit(): void {
    // Capture failures in listeners must never break app networking code paths.
    this.listeners.forEach((l) => {
      try {
        l();
      } catch {
        // ignore
      }
    });
  }
}
