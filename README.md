# Receipt Splitter (Frontend)

Receipt splitting client built with Expo + React Native. The app relies on Expo Router, Zustand, TanStack Query, and Tamagui for navigation, state, data fetching, and UI.

## Prerequisites

- Node.js 18 or 20 (LTS). Install via nvm or nvm-windows or download from nodejs.org, then confirm with `node -v`.
- npm 9 or newer. Bundled with Node.js; verify with `npm -v`.
- Expo CLI v7 (optional). You can run Expo commands with `npx expo ...` instead of installing the CLI globally.
- Git for cloning and version control.
- Expo Go on your iOS or Android device or access to emulators and simulators.
- Platform tooling: Android Studio with SDKs and virtual devices; Xcode on macOS for iOS builds.

> If you maintain a custom `.npmrc`, install dependencies with `npm install --legacy-peer-deps` when peer resolution fails.

## Install Dependencies

```bash
git clone https://github.com/<your-org>/receipt-splitter-frontend.git
cd receipt-splitter-frontend
npm install
```

## Configure Environment Variables

Create a `.env` or `.env.local` file for runtime configuration such as API endpoints, feature flags, and secrets. Use the `EXPO_PUBLIC_` prefix for values that must be exposed to the Expo client.

To start with overrides for local development:

```bash
cp .env .env.local
```

## Run with Expo

```bash
npx expo start
```

This launches the Expo Dev Server and Metro bundler. From the interactive prompt you can:
- press `a` to open the Android emulator or a connected device,
- press `i` to open the iOS simulator (macOS only),
- scan the QR code with Expo Go to open the app on a physical device,
- press `w` to launch the web build (`expo start --web`).

Use `npx expo start --clear` to reset Metro and Expo caches if the bundle becomes unstable.

## Useful Scripts

- `npx expo run:android` or `npm run android` builds and runs on a connected Android device or emulator (Android Studio required).
- `npx expo run:ios` or `npm run ios` launches the iOS build on a simulator (macOS and Xcode required).
- `npx expo start --web` or `npm run web` runs the web preview.
- `npm run start` remains available as a shortcut for `expo start` if you prefer npm scripts.

## Platform and EAS Guidelines

1. Android: Install Android Studio, configure an AVD or enable USB debugging, then run `npx expo run:android`.
2. iOS: Install Xcode with the required simulators, then run `npx expo run:ios`.
3. EAS Build: Authenticate with `npx expo login` and trigger builds via `npx eas build` (configuration lives in `eas.json`).

## Project Structure

- `app/` – Expo Router entry points and routing-aware screens.
- `src/` – domain logic, state stores, API clients, and shared modules.
- `assets/` – static assets such as images and fonts.
- `app.json`, `eas.json` – Expo and EAS configuration.

## References and Troubleshooting

- https://docs.expo.dev/
- https://docs.expo.dev/router/introduction/
- https://reactnative.dev/docs/environment-setup
- https://tamagui.dev/docs/intro

If you hit dependency issues, make sure you are on the latest Node.js LTS, clear caches, reinstall with `npm install`, and restart with `npx expo start`. Architectural notes live in `ARCHITECTURE.md`, and delivery status is tracked in `STATUS.yaml`.
