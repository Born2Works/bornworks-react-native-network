// Shared types for Binar (Bornworks network interceptor plugin).

export type CallState = 'pending' | 'success' | 'error';

export interface HttpCallRequest {
  headers: Record<string, string>;
  body?: string;
  bodyTruncated?: boolean;
  size?: number;
}

export interface HttpCallResponse {
  status: number;
  headers: Record<string, string>;
  body?: string;
  bodyTruncated?: boolean;
  size?: number;
}

export interface HttpCall {
  id: string;
  /** Which capture source produced this record. */
  client: 'xhr' | 'fetch';
  method: string;
  url: string;
  startedAt: number;
  durationMs?: number;
  request: HttpCallRequest;
  response?: HttpCallResponse;
  error?: { message: string };
  state: CallState;
}

export interface BinarConfig {
  /** When false, nothing is patched and every API is a no-op. Default: __DEV__ if available, else true. */
  enabled?: boolean;
  /** Show the in-app floating bubble when new calls arrive. Default: true. */
  showNotification?: boolean;
  /** Ring buffer size. Default: 1000. */
  maxCallsCount?: number;
  /** Max stored body size in characters; longer bodies are truncated. Default: 1_000_000. */
  maxBodySize?: number;
  /** Header names (case-insensitive) whose values are replaced with "***". */
  redactedHeaders?: string[];
  /** Requests whose URL matches any entry are not captured. */
  ignoredUrls?: (string | RegExp)[];
}

export type ResolvedBinarConfig = Required<BinarConfig>;

export const DEFAULT_REDACTED_HEADERS = ['authorization', 'cookie', 'set-cookie'];

export function resolveConfig(config: BinarConfig = {}): ResolvedBinarConfig {
  // __DEV__ is defined by React Native / Metro; guard for plain Node (tests).
  const dev =
    typeof (globalThis as any).__DEV__ === 'boolean'
      ? (globalThis as any).__DEV__
      : true;
  return {
    enabled: config.enabled ?? dev,
    showNotification: config.showNotification ?? true,
    maxCallsCount: config.maxCallsCount ?? 1000,
    maxBodySize: config.maxBodySize ?? 1_000_000,
    redactedHeaders: config.redactedHeaders ?? DEFAULT_REDACTED_HEADERS,
    ignoredUrls: config.ignoredUrls ?? [],
  };
}
