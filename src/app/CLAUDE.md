# App shell & navigation

This folder owns the app entry point and the only navigator in the project.

## Navigation rules

- **Single native-stack navigator** lives in [navigation/RootNavigator.tsx](navigation/RootNavigator.tsx). Do not create additional navigators inside `src/features/**`.
- **`headerShown: false` globally.** Headers are rendered by the `<Screen>` component (see [src/shared/ui/CLAUDE.md](../shared/ui/CLAUDE.md)), never by React Navigation's built-in `header` option — it renders outside `Screen` and breaks background inheritance.
- **Route names live only in [navigation/routes.ts](navigation/routes.ts)** as `ROOT_ROUTES` (an `as const` object). The typed `RootStackParamList` lives in [navigation/types.ts](navigation/types.ts).
- **Adding a route** requires three edits: append to `ROOT_ROUTES`, extend `RootStackParamList`, register a `<Stack.Screen>` in `RootNavigator`. Feature screens use `useNavigation`/`useRoute` (typed) — they don't own navigation structure.
- **Back buttons:** don't add a `HeaderBackButton` on a screen reached via `navigation.replace(...)` — there's nothing to go back to. Use `navigate` instead when the destination needs a back button.
