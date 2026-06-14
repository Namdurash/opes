# app-theming Specification

## Purpose
Define the app's light/dark theming: themes are built from theme tokens and switchable at runtime without changing feature code. The user's choice is persisted locally and applied app-wide via the theme provider; with no saved choice the app follows the system color scheme.

## Requirements
### Requirement: Light and dark themes
The app SHALL support light and dark themes built from theme tokens, switchable at runtime without changing feature code.

#### Scenario: Toggle theme
- **WHEN** the user toggles Dark mode in Settings
- **THEN** the whole app re-renders in the selected theme

### Requirement: Theme choice persists
The selected theme SHALL persist across app restarts; with no saved choice the app SHALL follow the system color scheme.

#### Scenario: Persisted choice restored
- **WHEN** the app starts after the user has chosen a theme
- **THEN** that theme is applied

#### Scenario: Default to system scheme
- **WHEN** the user has not chosen a theme
- **THEN** the app uses the current system (light or dark) color scheme

