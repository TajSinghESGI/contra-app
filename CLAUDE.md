# CLAUDE.md — Contra · Source de vérité pour Claude Code

> Ce fichier est lu automatiquement par Claude Code à chaque session.
> Ne pas modifier sans mettre à jour les sections concernées.
> Dernière mise à jour : 2026-03-29

---

## 1. Projet — Vue d'ensemble

**Nom de l'app :** Contra (affiché `CONTRA` en uppercase dans l'UI)
**Concept :** L'utilisateur choisit un sujet, l'IA prend automatiquement le camp opposé et argumente pour gagner. L'utilisateur doit convaincre l'IA de changer d'avis. Score final sur la qualité des arguments (logique, rhétorique, preuves, originalité).
**Plateforme :** iOS + Android via Expo (React Native)
**Stack frontend :** Expo SDK 54 · Expo Router (app/) · React Native 0.81 · Reanimated v4 · expo-haptics · expo-linear-gradient · expo-blur
**Stack backend :** Django REST Framework + Django Channels (SSE) · PostgreSQL · Celery + Redis · Railway
**IA :** Claude API (claude-sonnet-4-20250514) — deux appels : (1) débat en streaming SSE, (2) scoring post-débat
**Monétisation :** RevenueCat · IAP iOS & Android
**CI/CD :** GitLab CI · EAS Build · Fastlane

---

## 2. Architecture du repo

```
/
├── app/                          # Expo Router — toutes les routes ici
│   ├── _layout.tsx               # Root layout (fonts, SafeAreaProvider, navigation)
│   ├── index.tsx                 # Redirect → /(tabs) ou /auth/login selon auth
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab bar (MorphicTabBar custom)
│   │   ├── index.tsx             # Home / Feed (Topic du jour + Trending)
│   │   ├── arenas.tsx            # Liste des arènes / sujets actifs + filtre + recherche
│   │   ├── friends.tsx           # Onglet amis
│   │   ├── analytics.tsx         # Stats personnelles
│   │   └── profile.tsx           # Profil utilisateur + settings + logout
│   ├── auth/
│   │   ├── _layout.tsx           # Stack auth (animation fade)
│   │   ├── login.tsx             # Connexion email/password
│   │   ├── forgot-password.tsx   # Reset mot de passe
│   │   └── register/
│   │       ├── _layout.tsx       # Stack register (animation slide_from_right)
│   │       ├── index.tsx         # Étape 1 : compte (nom, email, password)
│   │       │                     #   ↳ exporte StepDots + sharedStyles
│   │       ├── topics.tsx        # Étape 2 : thématiques (min 3)
│   │       └── level.tsx         # Étape 3 : difficulté par défaut
│   ├── debate/
│   │   ├── [id].tsx              # Écran de débat actif (chat SSE + score bar)
│   │   ├── new.tsx               # Création d'un nouveau débat
│   │   ├── history.tsx           # Historique des débats
│   │   ├── result/[id].tsx       # Résultats & analyse post-débat
│   │   ├── analysis/[id].tsx     # Analyse détaillée
│   │   ├── coach/[id].tsx        # Coaching IA post-débat
│   │   └── replay/[id].tsx       # Replay d'un débat
│   ├── challenge/                # Défis 1v1 entre amis
│   │   ├── [id].tsx              # Détail d'un challenge
│   │   ├── coaching/[id].tsx     # Coaching IA post-challenge
│   │   ├── debate/[id].tsx       # Chat du challenge en cours
│   │   └── result/[id].tsx       # Résultats du challenge
│   ├── rankings/
│   │   └── index.tsx             # Classements global / amis
│   ├── friends/
│   │   └── index.tsx             # Liste d'amis + recherche + challenge
│   ├── user/
│   │   └── [id].tsx              # Profil public d'un autre utilisateur
│   ├── arena/
│   │   └── [id].tsx              # Détail d'une arène
│   ├── activity/
│   │   └── index.tsx             # Feed d'activité des amis
│   ├── settings/
│   │   ├── _layout.tsx
│   │   ├── about.tsx             # À propos
│   │   ├── faq.tsx               # FAQ
│   │   ├── notifications.tsx     # Préférences de notifications
│   │   ├── difficulty.tsx        # Difficulté par défaut
│   │   ├── edit-profile.tsx      # Modifier le profil
│   │   └── report-bug.tsx        # Signaler un bug
│   ├── paywall/
│   │   └── index.tsx             # Paywall IAP (RevenueCat)
│   ├── first-launch/
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Onboarding première ouverture
│   │   ├── demo.tsx              # Démo interactive
│   │   └── font-size.tsx         # Choix taille de police
│   └── onboarding/
│       └── index.tsx             # Sélection sujet + difficulté avant débat
├── components/
│   ├── ui/                       # Primitives du design system
│   │   ├── Button.tsx            # Bouton animé (primary / secondary / ghost) + Skia shadow
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Typography.tsx
│   │   ├── Icon.tsx              # Icônes fontello via createIconSet (46 glyphs)
│   │   ├── UserAvatar.tsx        # Avatar utilisateur (image ou initiale)
│   │   ├── MarqueeText.tsx       # Texte défilant
│   │   ├── MorphingChips.tsx     # Chips animés
│   │   ├── AnimatedAvatarPicker.tsx
│   │   ├── Accordion/            # Accordéon animé
│   │   ├── AnimatedHeaderScrollView/ # Header scroll animé (large → small title)
│   │   ├── AnimatedInputBar/     # Barre d'input animée
│   │   ├── AnimatedScrollProgress/ # Indicateur de progression scroll
│   │   ├── AnimatedThemeToggle/  # Toggle thème clair/sombre
│   │   ├── AppleIntelligence/    # Composants style Apple Intelligence
│   │   ├── BottomSheet/          # Bottom sheet modal
│   │   ├── BottomSheetStack/     # Stack de bottom sheets
│   │   ├── Dropdown/             # Menu déroulant
│   │   ├── Progress/             # Barres de progression
│   │   ├── Shimmer/              # Placeholder loading
│   │   └── Toast/                # Notifications toast
│   ├── debate/                   # Composants spécifiques au débat
│   │   ├── AIMessage.tsx
│   │   ├── UserMessage.tsx
│   │   ├── DebateInput.tsx
│   │   ├── TypingDots.tsx
│   │   ├── LiveScoreBar.tsx
│   │   ├── DifficultyBadge.tsx
│   │   └── ScoreModal.tsx
│   ├── auth/
│   │   └── TopicsBottomSheet.tsx  # Sélection thématiques (register)
│   └── shared/
│       ├── MorphicTabBar/        # Tab bar custom (Skia morphing + Reanimated v4)
│       ├── SpectralWave/         # Animation vague spectrale
│       ├── BottomNav.tsx
│       ├── TopBar.tsx
│       ├── LiveDot.tsx
│       └── ErrorBoundary.tsx
├── constants/
│   ├── tokens.ts                 # ★ Design tokens — source de vérité absolue
│   │                             #   exports: colors, fonts, typography, spacing,
│   │                             #            radius, shadows, DIFFICULTY_LEVELS,
│   │                             #            SCORE_CRITERIA, PLANS, CONVERSION_TRIGGER
│   ├── theme.ts                  # Thème clair/sombre (couleurs dynamiques)
│   └── topics.ts                 # Catégories & topics i18n (labels via i18next)
├── store/
│   ├── authStore.ts              # Zustand — isAuthenticated, token, login(), logout()
│   │                             #   + hydrate() syncs i18n language from profile
│   ├── registerStore.ts          # Zustand — état multi-step register
│   ├── debateStore.ts            # Zustand — état global du débat en cours
│   ├── topicStore.ts             # Zustand — catégories, topics, langue active
│   ├── friendStore.ts            # Zustand — liste d'amis
│   ├── streakStore.ts            # Zustand — streak courante + hydratation
│   ├── badgeStore.ts             # Zustand — badges débloqués
│   ├── progressionStore.ts       # Zustand — progression / niveaux
│   ├── bannerStore.ts            # Zustand — bannières promotionnelles
│   ├── themeStore.ts             # Zustand — thème clair/sombre
│   ├── fontSizeStore.ts          # Zustand — taille de police utilisateur
│   └── onboardingStore.ts        # Zustand — état du first-launch
├── hooks/
│   ├── useDebate.ts              # Logique SSE + état du débat
│   ├── useScore.ts               # Calcul et animation du score
│   ├── useSubscription.ts        # RevenueCat
│   ├── useTheme.ts               # Hook thème (couleurs, typographie, font size)
│   ├── useNotifications.ts       # Gestion push notifications (Expo)
│   ├── use-theme-color.ts        # Couleur selon thème actif
│   ├── use-color-scheme.ts       # Détection scheme système
│   └── queries/                  # React Query hooks (cache + revalidation)
│       ├── index.ts
│       ├── useChallenges.ts
│       ├── useFriends.ts
│       ├── useProfile.ts
│       ├── useRankings.ts
│       └── useTopics.ts
├── services/
│   ├── api.ts                    # Calls REST vers Django
│   ├── sse.ts                    # EventSource wrapper pour le streaming
│   ├── revenuecat.ts             # IAP
│   ├── analytics.ts              # Tracking analytics
│   ├── analyticsEvents.ts        # Définition des événements
│   ├── notifications.ts          # Service push notifications
│   └── queryClient.ts            # Config React Query
├── i18n/
│   ├── index.ts                  # Config i18next (détection locale + fallback FR)
│   └── locales/
│       ├── fr.ts                 # Français (langue principale)
│       └── en.ts                 # Anglais
│       #   ↳ inclut topicCategories, topicLabels, topicQuestions
├── assets/
│   ├── images/
│   │   └── logo-contra.png       # Logo Contra (double-bulle, fond transparent)
│   └── fonts/
│       ├── icons.ttf             # Fontello — 46 icônes custom
│       ├── SF-Pro-Rounded-Thin.otf
│       ├── SF-Pro-Rounded-Light.otf
│       ├── SF-Pro-Rounded-Regular.otf
│       ├── SF-Pro-Rounded-Medium.otf
│       ├── SF-Pro-Rounded-Semibold.otf
│       └── SF-Pro-Rounded-Bold.otf
├── metro.config.js               # Alias @/ + sourceExts json
├── eas.json                      # Profils EAS (development / preview / production)
└── CLAUDE.md                     # CE FICHIER
```

---

## 3. Design System — "The Ethereal Professional"

### Direction créative
**"The Digital Curator"** — minimalisme éditorial, calme, premium. Chaque écran est une galerie curatée, pas un container de data. Asymétrie intentionnelle, lisibilité extrême, tonal layering.

### Règles absolues (JAMAIS violer)
- **No-Line Rule :** Zéro bordure 1px pour séparer du contenu. La hiérarchie se crée par tonal shift et spacing.
- **No hard shadows :** Uniquement ambient shadows (blur 24–48px, opacity 4–8%).
- **Ghost Border :** Si une bordure est vraiment nécessaire (accessibilité), utiliser `outline-variant` à 10–15% d'opacité. Elle doit se sentir, pas se voir.
- **Glassmorphism** pour tous les éléments flottants (modals, nav bar, AI bar) : opacity 70–80% + backdrop-blur 20–40px.
- **Rounded corners** : toujours `lg` ou `xl` (jamais sharp). `full` pour les pills/buttons CTA.

### Tokens de couleur (light mode)

```typescript
// constants/tokens.ts — importer ainsi :
import { colors } from '@/constants/tokens';

export const colors = {
  // Surfaces (hiérarchie de papier frosted)
  background:                '#f9f9fa',
  'surface-container-lowest':'#ffffff',   // cards premium
  'surface-container-low':   '#f2f4f5',   // input fields
  'surface-container':       '#ebeef0',
  'surface-container-high':  '#e4e9ec',   // avatars, zones récursives
  'surface-container-highest':'#dde3e7',
  'surface-dim':             '#d3dbdf',

  // Primary (gris graphite métallique)
  primary:                   '#5f5e5e',
  'primary-dim':             '#535252',   // gradient CTA dark end
  'on-primary':              '#faf7f6',

  // On-surfaces (texte)
  'on-surface':              '#2d3336',   // body text
  'on-surface-variant':      '#5a6063',   // texte secondaire
  'outline':                 '#757c7f',
  'outline-variant':         '#adb3b6',   // placeholders, ghost borders

  // Autres : secondary, tertiary, error, inverse — voir tokens.ts complet
} as const;
```

### Typographie

**Police unique : SF Pro Rounded** (6 variantes chargées via `useFonts` dans `app/_layout.tsx`)

```typescript
// constants/tokens.ts — importer ainsi :
import { fonts, typography } from '@/constants/tokens';

export const fonts = {
  thin:     'SFProRounded-Thin',
  light:    'SFProRounded-Light',
  regular:  'SFProRounded-Regular',
  medium:   'SFProRounded-Medium',
  semibold: 'SFProRounded-Semibold',
  bold:     'SFProRounded-Bold',
} as const;

// Variantes typographiques prêtes à l'emploi (spread dans StyleSheet) :
export const typography = {
  'display-lg':  { fontFamily: fonts.light,    fontSize: 64, letterSpacing: -1.5 },
  'display-md':  { fontFamily: fonts.light,    fontSize: 48, letterSpacing: -1 },
  'display-sm':  { fontFamily: fonts.light,    fontSize: 36, letterSpacing: -0.5 },
  'headline-lg': { fontFamily: fonts.bold,     fontSize: 32, letterSpacing: -0.5 },
  'headline-md': { fontFamily: fonts.bold,     fontSize: 28, letterSpacing: -0.3 },
  'headline-sm': { fontFamily: fonts.bold,     fontSize: 24, letterSpacing: -0.2 },
  'body-lg':     { fontFamily: fonts.regular,  fontSize: 18, lineHeight: 28 },
  'body-md':     { fontFamily: fonts.regular,  fontSize: 16, lineHeight: 26 },
  'body-sm':     { fontFamily: fonts.regular,  fontSize: 14, lineHeight: 22 },
  'label-lg':    { fontFamily: fonts.bold,     fontSize: 12, letterSpacing: 2,   textTransform: 'uppercase' },
  'label-md':    { fontFamily: fonts.bold,     fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' },
  'label-sm':    { fontFamily: fonts.semibold, fontSize: 9,  letterSpacing: 1.2, textTransform: 'uppercase' },
} as const;

// Usage dans StyleSheet :
// title: { ...typography['headline-md'], color: colors['on-surface'] }
// label: { fontFamily: fonts.semibold, fontSize: 13, color: colors['on-surface'] }
```

### Gradient CTA principal
```typescript
// Toujours utiliser ce gradient pour les boutons primaires
<LinearGradient
  colors={[colors.primary, colors['primary-dim']]}
  start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
  style={{ borderRadius: radius.full, height: 52 }}
>
  <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: colors['on-primary'] }}>
    Label
  </Text>
</LinearGradient>
// Shadow : shadowColor: colors.primary, opacity 0.10, blur 24px
```

### Spacing Scale
```typescript
import { spacing } from '@/constants/tokens';
// 1:4  2:8  3:12  4:16  5:20  6:24  7:28  8:32  9:36  10:40  12:48  16:64  20:80
```

### Border Radius
```typescript
import { radius } from '@/constants/tokens';
// sm:4  md:8  lg:12  xl:16  2xl:20  3xl:24  full:9999
// Règle : lg/xl pour les cards, full pour pills/badges/CTA
```

### Shadows (ambient only)
```typescript
import { shadows } from '@/constants/tokens';
// shadows.ambient : opacity 0.06, blur 24, offset y:4
// shadows.float   : opacity 0.08, blur 48, offset y:8
// Usage : ...shadows.ambient dans StyleSheet
```

### Identité visuelle
**Nom affiché :** `CONTRA` — toujours uppercase, `fontFamily: fonts.bold`, letterSpacing négatif
**Logo :** `assets/images/logo-contra.png` — double-bulle / infinity stylisée, fond transparent
**Usage logo :** sur badge `backgroundColor: colors['inverse-surface']` (#0c0e0f) ou `colors.secondary`

---

## 4. Écrans & Maquettes

### Navigation principale (Bottom Tab Bar)
```
[ Feed/Home ]  [ Arenas ]  [ Friends ]  [ Analytics ]  [ Profile ]
```
Tab bar custom `MorphicTabBar` avec glassmorphism. L'écran de débat (`debate/[id]`) n'a **pas** de bottom nav.

---

### Screen 1 — Home / Feed (`app/(tabs)/index.tsx`)
- **TopAppBar** : "CONTRA" uppercase bold + avatar user
- **Hero "Topic du Jour"** : label-md + divider 30% opacity + headline bold + CTA pill gradient
- **"Arènes Tendance"** : grid bento — grande card (2/3) + 2 petites cards (1/3)
- **"Activité Récente"** : liste sans dividers, spacing vertical uniquement

---

### Screen 2 — Débat actif (`app/debate/[id].tsx`)
- **Header fixé** glassmorphism : bouton close + "CONTRA" + timer countdown
- **Topic banner** : label-sm "PROPOSITION ACTUELLE" + texte font-light
- **Score bar** : 2px height, animée
- **Chat stream** : messages IA (gauche) + user (droite, bubble frosted)
- **Typing state** : 3 dots pulsants (Reanimated)
- **Input area** glassmorphism fixée en bas : chips rapides + textarea + send button gradient
- **SSE streaming** token par token via EventSource

---

### Screen 3 — Résultats (`app/debate/result/[id].tsx`)
- **Verdict** : label + display-sm font-light + score /100 font-thin 72px
- **Bento Grid métriques** : 3 colonnes (Logic, Rhetoric, Evidence)
- **"Analyse Approfondie"** : texte éditorial
- **Floating AI Bar** : glassmorphism pill en bas

---

### Screen 4 — Rankings (`app/rankings/index.tsx`)
- **Header** : label "ARÈNE COMPÉTITIVE" + headline "Classements" + toggle pills Global/Amis
- **Liste** : rang italic light + avatar + nom + score + trend arrow
- **Sticky bottom** : glassmorphism bar + CTA "Débattre"

---

### Screen 5 — Analytics (`app/(tabs)/analytics.tsx`)
Stats personnelles : 3 overview cards + barres de progression par critère + liste débats récents.

---

### Register flow (`app/auth/register/`)
3 écrans avec `FadeInDown` staggered :
1. **index.tsx** : nom complet + email + password (6 min.) → Continuer
2. **topics.tsx** : chips thématiques (min 3) → Continuer
3. **level.tsx** : sélection difficulté → Commencer (appelle `login()` + `reset()`)

Partagé entre les 3 écrans : `StepDots` + `sharedStyles` exportés depuis `register/index.tsx`.
État partagé via `useRegisterStore` (Zustand).

---

## 5. Composants UI — Règles d'implémentation

### Button Primary
```tsx
import { colors, fonts, radius } from '@/constants/tokens';

<LinearGradient
  colors={[colors.primary, colors['primary-dim']]}
  style={{ borderRadius: radius.full, paddingVertical: 16, paddingHorizontal: 40 }}
>
  <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: colors['on-primary'], letterSpacing: 1 }}>
    {label}
  </Text>
</LinearGradient>
```

### Input Field
```tsx
{
  backgroundColor: colors['surface-container-low'],  // #f2f4f5
  borderRadius: radius.lg,
  // Focus : borderWidth: 1, borderColor: 'rgba(95,94,94,0.20)'
}
```

### Card
```tsx
{
  backgroundColor: colors['surface-container-lowest'],  // #ffffff
  borderRadius: 32,   // ou radius['3xl'] = 24 pour les plus petites
  ...shadows.ambient,
}
```

### Glassmorphism (header, input area, bottom bar)
```tsx
import { BlurView } from 'expo-blur';
<BlurView intensity={80} tint="light">
  {/* + backgroundColor: 'rgba(249,249,250,0.75)' */}
  {/* + borderColor: 'rgba(173,179,182,0.12)' */}
</BlurView>
```

### Labels uppercase (Editorial Hook)
```tsx
// Le pairing qui crée le feel "designé" :
<Text style={{ ...typography['label-md'], color: colors.outline }}>
  TOPIC DU JOUR
</Text>
// Suivi d'un headline en contraste fort
<Text style={{ ...typography['headline-md'], color: colors['on-surface'] }}>
  Titre
</Text>
```

---

## 6. Système de tokens — Règles d'utilisation

### Principe fondamental
**Zéro hex hardcodé dans le code.** Toutes les couleurs, polices, tailles et espacements passent par `@/constants/tokens`.

```typescript
// ✅ Correct
import { colors, fonts, typography, spacing, radius, shadows } from '@/constants/tokens';
StyleSheet.create({
  title: { ...typography['headline-md'], color: colors['on-surface'] },
  card:  { backgroundColor: colors['surface-container-lowest'], borderRadius: 32, ...shadows.ambient },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: colors['on-surface'] },
})

// ❌ Interdit
StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: '#2d3336' },
  card:  { backgroundColor: '#ffffff' },
})
```

### Mapping fontWeight → fonts.*
| Ancien `fontWeight` | Token `fonts.*` |
|---|---|
| `'200'` | `fonts.thin` |
| `'300'` | `fonts.light` |
| `'400'` | `fonts.regular` |
| `'500'` | `fonts.medium` |
| `'600'` | `fonts.semibold` |
| `'700'` / `'800'` | `fonts.bold` |

### Exceptions acceptées (couleurs sans token)
- `'#34C759'` — iOS system green (live indicators, trend up)
- `'#4285F4'` — Google brand blue (bouton social)
- `'#AF52DE'` — Purple PRO badge (niveau Brutal)
- `'#FF9500'` / `'#FF3B30'` — Difficulty indicators (medium/hard)
- `rgba(...)` — valeurs glassmorphism avec opacité calculée
- Couleurs bg dans les tableaux de mock data

---

## 7. Logique métier — Règles importantes

### Niveaux de difficulté
```typescript
import { DIFFICULTY_LEVELS } from '@/constants/tokens';
// easy · medium · hard · brutal (premiumOnly: true)
```

### Monétisation
```typescript
import { PLANS } from '@/constants/tokens';
// trial (14j, sans CB) · pro_monthly (4.99€) · pro_annual (39€, -35%) · eloquence (9.99€)
// Paywall déclenché sur : trial_expired, difficulty_brutal_tap, rankings_tab_tap
```

### Trigger de conversion
Score entre 60 et 85 dans les 48h précédant l'expiration → push personnalisé avec le score exact.

### Flow SSE (streaming)
```
POST /api/debates/{id}/messages/
  → EventSource reçoit tokens un par un
  → Affichage token par token dans la bulle IA
  → event "done" → score intermédiaire via REST PATCH
```

### Scoring (4 critères pondérés)
```typescript
import { SCORE_CRITERIA } from '@/constants/tokens';
// logic 30% · rhetoric 25% · evidence 25% · originality 20%
```

---

## 8. Conventions de code

### Naming
- Composants : PascalCase (`AIMessage.tsx`)
- Hooks : camelCase avec préfixe `use` (`useDebate.ts`)
- Constants : SCREAMING_SNAKE (`DIFFICULTY_LEVELS`)
- Types/interfaces : PascalCase avec suffixe (`DebateMessage`, `ScoreResult`)

### Fichiers
- Un composant par fichier
- `StyleSheet.create` uniquement (pas de styled-components, pas d'inline styles sauf dynamiques)
- Exports : default pour les composants, named pour utils/constants

### Animations
- **Reanimated v4** pour les animations complexes : `useSharedValue`, worklets, `FadeInDown`
- **`useNativeDriver: true`** sur transform/opacity (Animated RN classique)
- **`useNativeDriver: false`** pour width/height/backgroundColor (layout properties)
- Expo Haptics : `ImpactFeedbackStyle.Medium` au send, `Light` aux sélections

### État
- **Zustand** pour l'état global (`authStore`, `registerStore`, `debateStore`)
- **`useState`** local pour l'état UI pur (focus, toggle, animations locales)

### Imports (ordre)
```typescript
// React → RN → Expo → libs tierces → @/ internes → ./relatifs
import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, typography } from '@/constants/tokens';
import { useDebate } from '@/hooks/useDebate';
import { AIMessage } from './AIMessage';
```

---

## 9. Internationalisation (i18n)

### Frontend (React Native)
- **i18next** avec `react-i18next` — config dans `i18n/index.ts`
- Détection automatique de la locale device via `expo-localization`, fallback `fr`
- Fichiers de traduction : `i18n/locales/fr.ts` et `en.ts`
- Inclut `topicCategories`, `topicLabels`, `topicQuestions` pour les topics/catégories
- `constants/topics.ts` utilise des getters dynamiques → `CATEGORIES[i].label` et `TOPICS[i].label`/`.question` retournent la traduction active
- `authStore.hydrate()` synchronise i18n avec la langue du profil backend au démarrage
- Changement de langue dans profil : `i18n.changeLanguage()` + `updateProfile({ language })` + `topicStore.setLang()`

### Backend (Django)
- Module centralisé `core/i18n.py` avec `T(key, lang)`, `get_lang(request)`, `criteria_map(lang)`
- Toutes les API acceptent `?lang=fr|en` en query param, sinon utilisent `user.language`
- Contenu traduit : critères de score, niveaux utilisateur, badges, push notifications, feed d'activité, messages d'erreur, temps relatif
- Topics/catégories : champs `label` (FR) + `label_en` (EN) en base, sérialisés selon la langue

---

## 10. Backend Django — Endpoints clés

```
POST   /api/auth/register/
POST   /api/auth/login/
GET    /api/auth/profile/               # profil authentifié
PATCH  /api/auth/profile/               # update profil (pseudo, language, difficulty…)
POST   /api/auth/start-trial/           # activer essai gratuit
GET    /api/topics/                      # ?lang=fr|en &category=tech
GET    /api/topics/categories/           # ?lang=fr|en
POST   /api/debates/
GET    /api/debates/{id}/
POST   /api/debates/{id}/messages/       # déclenche SSE stream
GET    /api/debates/{id}/messages/stream/ # SSE endpoint
GET    /api/debates/{id}/score/
POST   /api/debates/{id}/abandon/
GET    /api/rankings/global/
GET    /api/rankings/friends/
GET    /api/users/{id}/profile/          # profil public (strengths, debates, rank)
GET    /api/friends/                     # liste d'amis
POST   /api/friends/request/             # demande d'ami
POST   /api/challenges/                  # créer un défi 1v1
GET    /api/challenges/{id}/             # détail challenge
POST   /api/challenges/{id}/messages/    # envoyer un argument
GET    /api/activity/                    # feed d'activité amis
POST   /api/subscriptions/webhook/       # RevenueCat
```

### SSE Format
```
data: {"type": "token",  "content": "Votre argument..."}
data: {"type": "done",   "message_id": "uuid", "score": 72}
```

---

## 11. Variables d'environnement

```bash
# .env (ne jamais commiter)
EXPO_PUBLIC_API_URL=https://api.debate.app
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxx
EXPO_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## 12. Commandes fréquentes

```bash
# Dev
npx expo start
npx expo start --ios
npx expo start --android

# Build EAS
eas build --platform ios --profile development
eas build --platform android --profile development

# TypeScript
npx tsc --noEmit

# Tests
npx jest --coverage
npx maestro test flows/debate_flow.yaml
```

### Commandes Claude Code personnalisées
```
/new-screen   → Créer un nouvel écran en suivant les conventions Contra
/new-component → Créer un composant UI en suivant le design system
/check-design  → Auditer un écran pour conformité design system + tokens
```

---

## 13. Ce qu'il NE faut PAS faire

- ❌ Couleurs hex hardcodées (`'#2d3336'`) — utiliser `colors['on-surface']`
- ❌ `fontWeight: '700'` sans `fontFamily` — utiliser `fonts.bold`
- ❌ `fontSize: 28` sans token — utiliser `...typography['headline-md']` ou `fonts.bold`
- ❌ Bordures 1px solides pour séparer des sections
- ❌ Drop shadows avec opacity > 10% ou blur < 20px
- ❌ Dividers horizontaux dans les listes
- ❌ Fond blanc pur `'#ffffff'` comme background global → `colors.background`
- ❌ Noir pur `'#000000'` pour le texte → `colors['on-surface']`
- ❌ `useNativeDriver: false` sur transform/opacity
- ❌ Appels API directs dans les composants — passer par hooks/services
- ❌ Bottom nav sur l'écran de débat actif
- ❌ `runOnJS` dans Reanimated v4 — les callbacks JS s'exécutent nativement
- ❌ Strings user-facing hardcodées en FR dans le backend — utiliser `core/i18n.T(key, lang)`
- ❌ Labels de catégories/topics hardcodés côté frontend — passer par `i18n/locales/*.ts`
