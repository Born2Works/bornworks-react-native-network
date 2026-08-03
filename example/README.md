# @bornworks/davina example

Minimal app showing how to wire @bornworks/davina with the common HTTP clients.

## Run it (Expo, fastest)

```bash
npx create-expo-app davina-demo --template blank-typescript
cd davina-demo
npm install axios
npm install @bornworks/davina          # or: npm install <git-url-of-your-repo>
# replace the generated App.tsx with example/App.tsx from this repo
npx expo start
```

Works in Expo Go — @bornworks/davina is JS-only, no native code.

## Run it (bare React Native)

```bash
npx @react-native-community/cli init DavinaDemo
cd DavinaDemo
npm install axios @bornworks/davina
# replace App.tsx with example/App.tsx from this repo
npm run android   # or: npm run ios
```

## What to try

1. Tap the request buttons — a blue bubble appears bottom-right with the call count.
2. Tap the bubble (or "Open inspector") → list of calls, newest first, color-coded status.
3. Tap a row → Overview / Request / Response tabs with headers and pretty-printed JSON bodies.
4. "Mute notifications" hides the bubble; the inspector stays reachable via `Davina.open()`.
5. Note `Authorization`/`Cookie` headers show as `***` (redaction on by default).
