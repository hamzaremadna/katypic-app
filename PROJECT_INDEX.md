# PROJECT_INDEX — smart-photo-app
Generated: 2026-04-12

## Stack
React Native + Expo Router + Zustand (state) + React Query + Expo APIs (camera, media, fonts)

## Entry Points
- `src/app/_layout.tsx`: Root layout with Sentry init, font loading, auth/settings/onboarding store hydration, Query Client setup
- `src/app/(tabs)/_layout.tsx`: Tab group layout (uses custom BottomTabBar, not expo-router Tabs)
- `src/app/index.tsx`: Initial route redirect based on auth state

## Modules / Screens
| Name | Path | Purpose |
|------|------|---------|
| Auth Stack | `src/app/(auth)/` | Login, register, forgot-password, onboarding flow |
| Onboarding | `src/app/(auth)/onboarding/` | 8-step user onboarding (profile, questionnaire, spots, trial, etc.) |
| Tab Group | `src/app/(tabs)/` | Main tabbed interface (home, camera, gallery, discover, assistant, quests, settings, profile) |
| Home | `src/app/(tabs)/home.tsx` | Feed, photo discovery, follow recommendations |
| Camera | `src/app/(tabs)/camera.tsx` | Camera capture interface |
| Gallery | `src/app/(tabs)/gallery.tsx` | User's photo gallery grid view |
| Discover | `src/app/(tabs)/discover.tsx` | Explore public photos, trends, community |
| Assistant | `src/app/(tabs)/assistant.tsx` | AI chat assistant for photography tips |
| Quests | `src/app/(tabs)/quests.tsx` | Photography challenges/learning paths |
| Settings | `src/app/(tabs)/settings.tsx` | User preferences, notifications, account |
| Profile | `src/app/(tabs)/profile.tsx` | Current user's profile view |
| Analyse | `src/app/analyse/` | Photo analysis workflow (camera/import → AI selection → result) |
| Photo Details | `src/app/gallery/[photoId].tsx` | Full-screen photo view with interactions |
| Photo Edit | `src/app/edit/[photoId].tsx` | Photo editing interface (filters, cropping) |
| Chat | `src/app/chat/[userId].tsx` | Direct messaging with user |
| Profile View | `src/app/profile/[userId].tsx` | View other user's profile |
| Quest Path | `src/app/quest/[pathId].tsx` | Quest learning path details |
| Challenge | `src/app/quest/challenge/[challengeId].tsx` | Individual photography challenge |
| Spot | `src/app/spot/[spotId].tsx` | Photography location details |
| Event | `src/app/event/` | Event creation and viewing |
| Avatar Picker | `src/app/avatar-picker.tsx` | Avatar selection/upload interface |
| Activities | `src/app/activites.tsx` | User activity feed/notifications history |
| Friends | `src/app/friends.tsx` | Friend list and friend requests |
| Messages | `src/app/messages.tsx` | List of message conversations |
| Notifications | `src/app/notifications.tsx` | Notification center/inbox |
| Edit Profile | `src/app/edit-profile.tsx` | User profile editing |
| Paywall | `src/app/paywall/` | Subscription plans (intro, plans, upsell, confirmation) |

## Key Config
- `src/app/_layout.tsx`: Sentry DSN, font loading, QueryClient defaults (staleTime: 5m, gcTime: 10m)
- `src/services/api/client.ts`: Axios client with base URL, request timeout (15s), retry logic (3x), snake_case↔camelCase transformation
- Environment variables (`EXPO_PUBLIC_*`): API_URL, GOOGLE_IOS_CLIENT_ID, SENTRY_DSN, DISABLE_APPLE_AUTH
- Zustand stores: `authStore`, `settingsStore`, `onboardingStore` with persistent hydration

## API Surface
All endpoints proxied through `src/services/api/client.ts` to backend at:
- Dev: `http://localhost:3000/api` (default)
- Prod: `https://api.kaytipic.com`

Key endpoints used by screens:
- Auth: POST /auth/login, /auth/register, /auth/google, /auth/apple
- Photos: POST /photos/upload-url, POST /photos, GET /photos, PATCH /photos/:id, DELETE /photos/:id
- AI Analysis: POST /ai/analyze, GET /ai/analyses/:photoId
- Presets: POST /presets, GET /presets, PATCH /presets/:id
- User: GET /users/me, PATCH /users/me
- Profiles: GET /profiles/:userId, PATCH /profiles/me, POST /profiles/me/avatar-upload-url
- Messages: GET /messages/conversations, POST /messages/:userId
- Quests: GET /quests, GET /quests/:pathId, POST /quests/:pathId/progress
- Notifications: GET /notifications, PATCH /notifications/read-all, GET /notifications/unread-count

## Env Variables Required
- EXPO_PUBLIC_API_URL: Backend API base URL (default: http://localhost:3000 in dev, https://api.kaytipic.com in prod)
- EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: Google OAuth client ID for iOS
- EXPO_PUBLIC_SENTRY_DSN: Sentry error tracking DSN (optional)
- EXPO_PUBLIC_DISABLE_APPLE_AUTH: Set to "true" to disable Apple Sign-In (optional)

## Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Generate Expo config (if needed)
npx expo prebuild --clean

# 3. Start dev server (Expo Go app)
npm start

# 4. Build for iOS
npm run ios

# 5. Build for Android
npm run android

# 6. Build for Web
npm run web

# 7. Lint/format
npm run lint && npm run format
```
