# KaytiPic — Project Guide for Claude

## What This App Is
KaytiPic is a **photography learning & social platform** (React Native / Expo). Users take photos, get AI analysis with scores and tips, complete quests to level up, discover events and spots, follow other photographers, and share stories. Think Instagram + Duolingo for photography.

---

## Tech Stack
- **Frontend**: Expo SDK, Expo Router (file-based), React Query, Zustand, TypeScript
- **Backend**: NestJS + Prisma + PostgreSQL (Railway), AWS S3, Google Gemini AI
- **Navigation**: Custom `BottomTabBar` component — NOT Expo Router's `<Tabs>`. Each tab screen renders `<BottomTabBar activeRoute="/(tabs)/screen" />` manually.

---

## Design Language — ALWAYS Follow This

### Colors (from `src/theme/colors.ts`)
```ts
bgDeep: "#0A0A14"        // main screen background
bgDark: "#0F0F1E"
bgCard: "#1A1A2E"        // cards, modals
cardBorder: "rgba(255,255,255,0.06)"
accentPurple: "#9B59B6"  // primary brand color
accentPink: "#E91E8C"
accentBlue: "#4A90E2"
accentGreen: "#00C851"
textPrimary: "#FFFFFF"
textSecondary: "#A0A0C0"
textMuted: "#606080"
```

### Gradients (from `src/theme/colors.ts`)
- `Gradients.brand` — main CTA buttons (purple → blue)
- `Gradients.purpleBlue` — active tabs, highlights
- `Gradients.paywall` — premium/pro cards

### Typography (from `src/theme/typography.ts`)
- Font: **Montserrat** via `@expo-google-fonts`
- Import as: `import { Fonts } from "../../theme/typography"`
- Use: `fontFamily: Fonts.bold`, `Fonts.semibold`, `Fonts.regular`, etc.

### Icons
- Custom system: `import { Icon, IconName } from "../../components/ui/Icon"`
- Wraps UntitledUI SVG paths via react-native-svg
- **Never use @expo/vector-icons**
- Common names: `camera`, `sparkles`, `marker-pin`, `calendar`, `check`, `x`, `plus`, `trash`, `share`, `heart`, `search`, `pen`, `settings`, `user`, `users`, `image`, `chevron-right`

### Visual Style
- **Always dark background** — never white/light screens
- Rounded corners: `borderRadius: 12–20` on cards, `borderRadius: 50` on pills
- Cards have `borderWidth: 1, borderColor: Colors.cardBorder`
- Gradient buttons (not flat colored)
- Subtle `backgroundColor: "rgba(255,255,255,0.06)"` for icon backgrounds
- Haptic feedback on every tap: `hapticLight()` for nav, `hapticMedium()` for actions, `hapticHeavy()` for destructive

---

## All Screens

### Tab Screens (`src/app/(tabs)/`)
| Screen | Purpose |
|--------|---------|
| `home.tsx` | Dashboard: greeting, plans section (Premium/Pro), menu cards, quest bar |
| `camera.tsx` | Photo capture. Normal mode → analyse/result. Profile mode (`source=profile`) → caption modal → upload as public → back to profile |
| `gallery.tsx` | 2-col photo grid, batch delete, selection mode |
| `discover.tsx` | Map + Events/Spots tabs. **Events is default tab and first in order.** GPS centers map on user location |
| `quests.tsx` | XP, level, badges, quest paths |
| `assistant.tsx` | AI coaching chatbot |
| `profile.tsx` | Own profile. Shows only `isPublic=true` photos. `+` button → camera in profile mode |
| `settings.tsx` | App settings |

### Detail/Stack Screens
| Screen | Purpose |
|--------|---------|
| `gallery/[photoId].tsx` | Full photo view. Fetches full `Photo` object via `usePhoto(photoId)` to show caption. Action buttons: Analyser, Retoucher, Partager, Supprimer |
| `edit/[photoId].tsx` | Photo editing with presets. Share button shows caption modal |
| `analyse/result.tsx` | Upload → AI analysis pipeline. Shows score breakdown |
| `analyse/import.tsx` | Pick photo from library |
| `profile/[userId].tsx` | Public profile view. Photos are tappable → navigate to `gallery/[photoId]` |
| `chat/[userId].tsx` | DM conversation |
| `messages.tsx` | Conversation list with action popup (Voir profil / Mute / Bloquer) |
| `notifications.tsx` | Notification feed |
| `event/[eventId].tsx` | Event detail |
| `paywall/plans.tsx` | Subscription plans |
| `edit-profile.tsx` | Edit username, bio, avatar |

### Auth Screens (`src/app/(auth)/`)
Login, Register, Forgot Password, Onboarding (multi-step)

---

## Key Flows — Understand These Before Changing Anything

### Profile Photo Flow
1. User taps `+` or "Prendre une photo" on profile
2. → Camera opens with `params: { source: "profile" }`
3. → Take photo → **caption modal** appears (preview + text input + "Publier" button)
4. → On publish: `uploadPhoto({ photoUri, caption })` + `updatePhoto({ isPublic: true })`
5. → Navigate back to profile → `useFocusEffect` refetches → photo appears

### Normal Camera Flow
1. User taps shutter button (no `source` param)
2. → Navigate to `/analyse/result` with `{ photoUri }`
3. → Upload + AI analysis pipeline runs

### Story Creation Flow
1. Tap `+` story bubble on profile → `StoryCreationModal` opens
2. Title input → location chip (opens `LocationPicker` sheet with GPS + search)
3. Select photos from grid → preview shows with sticker toolbar
4. `Aa` button → text sticker draggable on image
5. `Lieu` button → location sticker draggable on image
6. Both stickers are draggable via PanResponder
7. → `createStory({ title, location, photoIds })`

### Gallery Batch Delete
- Uses `DELETE /photos/batch` (single API call) with optimistic updates
- Photos disappear instantly, reverted on error

---

## Components Reference

### `KaytiHeader`
```tsx
<KaytiHeader showBack title="Title" rightIcon={<TouchableOpacity>...</TouchableOpacity>} />
```

### `BottomTabBar`
```tsx
<BottomTabBar activeRoute="/(tabs)/gallery" />
// Must be in every tab screen at the bottom
```

### `GradientButton`
```tsx
<GradientButton label="Action" onPress={fn} />
```

### `Icon`
```tsx
<Icon name="camera" size={20} color={Colors.accentPurple} />
```

### `StoryCreationModal`
```tsx
<StoryCreationModal visible={bool} onClose={fn} />
```
Contains: title input, location chip (search + GPS picker), photo grid, draggable text + location stickers on image preview.

---

## API & Data Layer

### API Client (`src/services/api/client.ts`)
- Base URL includes `/api` prefix — controllers do NOT add it
- JWT auto-injected from auth store
- Transforms snake_case → camelCase automatically

### Key Hooks
```ts
usePhotos()          // List user photos (paginated)
usePhoto(id)         // Single photo — includes caption, analyses
useUploadPhoto()     // Upload local URI → S3/local → create DB record
useUpdatePhoto()     // PATCH photo (isPublic, caption)
useBatchDeletePhotos() // Optimistic batch delete
usePhotoAnalysis(id) // Get AI analysis for a photo
useQuestStats()      // XP, level, days active
useMyStories()       // User's stories
useCreateStory()     // Create story with { title, location?, photoIds }
useUnreadNotifications() // Polling every 30s
```

### Photo Object Shape
```ts
interface Photo {
  id: string
  url: string
  thumbnailUrl?: string
  isPublic: boolean        // true = shown on profile
  isFavorite: boolean
  caption?: string         // User-written description
  analyses?: PhotoAnalysis[] // AI scores
  createdAt: string
}
```

---

## Backend Modules (`smart-photo-api/src/modules/`)

| Module | Notes |
|--------|-------|
| `photo` | CRUD + batch delete + S3 upload URLs + local file upload |
| `ai` | Gemini AI: analyze photo, daily tip, camera tip, chat sessions. tipCache uses TTL Map (no external dep) |
| `auth` | JWT + Google/Apple OAuth. Rate limited: 5 req/60s on login/register |
| `quest` | Paths, XP, badges. `initUserProgress` uses `createMany` (not N+1 upsert) |
| `stories` | StoryCollection with optional `location` field |
| `message` | DM with block check before sending |
| `spot` | Photography spots with geo search |
| `event` | Events with join/leave/request |

### DB
- PostgreSQL on Railway
- Prisma ORM
- UUID v7 for all PKs
- Run migrations: `DATABASE_URL=... npx prisma migrate dev --name <name>`

---

## What "Good UI" Looks Like in This App

- **Dark, immersive** — never light backgrounds
- **Gradient CTAs** — primary buttons always use `Gradients.brand`
- **Cards with subtle borders** — `borderColor: Colors.cardBorder`
- **Rounded everything** — minimum `borderRadius: 12`
- **Haptics on every interaction**
- **Loading states** — always show `ActivityIndicator` while fetching
- **Empty states** — always have icon + text + CTA (not just blank screen)
- **Instagram-like flows** — stickers on images, location search sheets, drag-to-position

## Common Mistakes to Avoid

- Don't use `@expo/vector-icons` — use the custom `Icon` component
- Don't add `BottomTabBar` to non-tab screens (detail/modal screens don't have it)
- Don't show ALL user photos on profile — only `isPublic === true`
- Don't navigate to analysis after profile-mode photo — go back to profile
- `DELETE /photos/batch` must be registered BEFORE `DELETE /photos/:id` in NestJS
- When taking photos on profile: upload with `caption` + mark `isPublic: true` in one flow
- Always call `refetch` via `useFocusEffect` on screens that show data that can change on other screens

---

## Dev Commands
```bash
# Frontend
cd smart-photo-app
npx tsc --noEmit          # type check
npx expo start            # start dev server

# Backend
cd smart-photo-api
npx tsc --noEmit          # type check
DATABASE_URL=... npx prisma migrate dev --name <name>
DATABASE_URL=... npx prisma generate
npm run start:dev         # start NestJS dev server
```
