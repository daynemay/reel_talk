# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm start              # start Expo dev server (scan QR or press i/a/w)
npm run ios            # open in iOS Simulator
npm run android        # open in Android emulator
npm run web            # open in browser
npx tsc --noEmit       # type-check without building
```

There are no tests in this project.

## Architecture

**saywhat** is an Expo 54 React Native app (new architecture enabled) that lets users build silly emoji sentences and have them read aloud via `expo-speech`.

### Routing

Uses Expo Router (file-based). `index.ts` is the entry point (`expo-router/entry`). The `app/` directory defines the route tree:
- `app/_layout.tsx` — root Stack navigator, no headers
- `app/index.tsx` — re-exports `src/components/HomeScreen` (keeps route files thin)

### Data flow

All sentence state lives in `src/hooks/useSentence.ts`. It manages an array of `EmojiItem[]` and exposes: `shuffle`, `spinSlot`, `replaceSlot`, `insertAfter`, `addRandom` (capped at 8), `removeSlot`. No external state library — plain `useState`.

Emoji content is static data in `src/data/emojiData.ts`: 5 categories × 12 items = 60 total `EmojiItem` objects, each with `{ emoji, label }` where `label` is a short funny phrase used both for display and as the speech input.

### Component tree

```
HomeScreen          — orchestrates speech (expo-speech), haptics, picker visibility
  SentenceStrip     — horizontal ScrollView of slots + "+" add button (max 8)
    EmojiSlot       — individual tile; implements its own 480ms long-press timer
                      (not React Native's onLongPress) to control haptic timing
  EmojiPicker       — Modal (pageSheet) with category tabs + 4-column FlatList
                      two-step flow: select item → "swap it" or "+ add after"
```

### Native gesture setup

`app/_layout.tsx` wraps the root `Stack` in `GestureHandlerRootView` — required for any RNGH `GestureDetector` usage. Read `_layout.tsx` before writing any gesture code.

`react-native-reanimated` is installed but causes a TurboModule crash on init with the new architecture. Use `Animated` from `react-native` core instead.

### Key details

- `EmojiSlot` uses `onPressIn`/`onPressOut` with a manual `setTimeout` (480ms) rather than `onLongPress` so haptics fire at the exact moment the long-press threshold is reached.
- `EmojiSlot` has a `⠿` drag handle (RNGH `Gesture.Pan`) for reordering; drag state and ghost bubble are coordinated by `SentenceStrip`. Ghost position uses `Animated.Value.setValue()` (no re-renders on move).
- Speech uses `expo-speech` at rate 0.85, pitch 1.2, with labels joined by `"... "` for natural pacing.
- All styles use inline `StyleSheet.create` — no styling library.
- TypeScript strict mode is on.
