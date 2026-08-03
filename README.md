# Davina — Bornworks Network Interceptor Plugin

In-app HTTP inspector for React Native — inspired by [Alice](https://pub.dev/packages/alice) from Flutter. Captures **fetch**, **axios**, and raw **XMLHttpRequest** traffic and shows it in an in-app screen: list of calls, tap in for headers, bodies, status and timing. Optional floating notification bubble when requests fire.

JS-only (TypeScript). No native code → works in Expo Go, bare RN, and dev clients.

## Why one patch covers three clients

In React Native, `fetch` is a polyfill implemented on top of `XMLHttpRequest`, and axios uses its XHR adapter. Davina patches XHR once and wraps `fetch` (for full body access), with an internal dedupe marker so nothing is recorded twice. **No per-client setup needed** — axios works with zero configuration.

## Install

```bash
npm install @bornworks/davina
# or from your git repo:
npm install git+https://github.com/<you>/davina.git
```

## Wire it in (2 steps)

```tsx
// index.js — as early as possible, before any request fires
import { Davina } from '@bornworks/davina';
Davina.init({ showNotification: true });
```

```tsx
// App root — wrap once; the inspector renders as a Modal, no navigator needed
import { DavinaProvider } from '@bornworks/davina';

export default function App() {
  return (
    <DavinaProvider>
      <YourApp />
    </DavinaProvider>
  );
}
```

That's it. Fire requests with fetch/axios/XHR and tap the bubble, or call `Davina.open()` from anywhere (e.g. a debug menu button).

## API

```ts
Davina.init(config?)            // install interceptors (no-op when enabled: false)
Davina.open() / Davina.close()   // show/hide the inspector programmatically
Davina.setNotification(bool)    // toggle the floating bubble at runtime
Davina.clear()                  // wipe captured calls
Davina.uninstall()              // restore original XHR/fetch
```

### Config

| Option | Default | Description |
|---|---|---|
| `enabled` | `__DEV__` | When `false`, nothing is patched and all APIs are no-ops — safe for release builds |
| `showNotification` | `true` | Floating bubble with unseen-call count; tap opens the inspector |
| `maxCallsCount` | `1000` | Ring buffer size; oldest calls evicted |
| `maxBodySize` | `1_000_000` | Bodies longer than this (chars) are truncated with a marker |
| `redactedHeaders` | `authorization, cookie, set-cookie` | Values shown as `***` (case-insensitive) |
| `ignoredUrls` | `[]` | Strings/RegExps of URLs to skip (Metro `/symbolicate` noise is skipped by default) |

### Using with react-navigation (optional)

`DavinaProvider`'s Modal needs no navigator. If you prefer a route:

```tsx
import { DavinaScreen } from '@bornworks/davina';
<Stack.Screen name="DavinaInspector" component={DavinaScreen} />
// then: navigation.navigate('DavinaInspector')
```

## Example app

See [`example/`](./example) for a runnable app wiring fetch, axios, and raw XHR.

## Caveats

- **JS-layer only.** Traffic from native SDKs (Firebase, native networking libs) does not pass through JS and is not captured.
- **Dev tool, not a production feature.** `enabled` defaults to `__DEV__`; keep it that way.
- The dedupe marker header `x-davina-trace` is added to fetch requests and stripped at the XHR layer before sending — it never reaches your server under RN's default fetch. If you replace the fetch polyfill with a non-XHR implementation, capture still works via the fetch wrapper (the marker may then be sent; strip it in your custom transport or ignore it server-side in dev).
- No persistence: captured calls live in memory and are lost on reload.

## Development

```bash
npm install
npm test          # 23 unit tests (store, redaction, XHR + fetch interceptors)
npm run typecheck
```

## License

MIT
