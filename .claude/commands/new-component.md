# /new-component

Crée un nouveau composant UI pour Contra en suivant le design system "The Ethereal Professional".

**Usage :** `/new-component <chemin> [description]`
Exemple : `/new-component components/ui/Badge.tsx "Badge pill avec variants"`
Exemple : `/new-component components/debate/ScoreBar.tsx "Barre de score animée"`

---

## Instructions

Crée le composant à l'emplacement indiqué. Respecte **toutes** les règles suivantes :

### 1. Structure du fichier
```typescript
import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
// Autres imports dans l'ordre : RN → Expo → libs → @/ → ./
import { fonts, radius, shadows, spacing, typography, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';

export interface NomComponentProps {
  // Props typées
  style?: StyleProp<ViewStyle>;
}

export const NomComponent = memo(function NomComponent({ ... }: NomComponentProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    // JSX
  );
});

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  // Styles using colors.* tokens
});

export default NomComponent;
```

### 2. Tokens — Règles absolues (JAMAIS violer)
- **Zéro hex hardcodé** dans les styles. Toujours `colors.*` (obtenu via `const { colors } = useTheme()`)
  - Exceptions documentées : `#34C759` (iOS live/green), `#4285F4` (Google), `#AF52DE` (PRO badge), couleurs de difficulté easy/medium
- **Zéro `fontWeight`** seul. Toujours via `fontFamily: fonts.*` :
  - bold/extrabold → `fonts.bold`
  - semibold/600 → `fonts.semibold`
  - medium/500 → `fonts.medium`
  - regular/normal/400 → `fonts.regular`
  - light/300 → `fonts.light`
  - thin/200 → `fonts.thin`
- `...typography['variant']` pour les combos présets (headline-md, label-sm, etc.)
- `spacing[n]` pour tous les paddings/margins/gaps
- `radius.*` pour tous les borderRadius (jamais de valeur numérique libre > 4)
- `...shadows.ambient` ou `...shadows.float` (jamais de shadow custom)

### 3. Design system
- **No-Line Rule :** Zéro bordure 1px solide pour séparer du contenu
- **No hard shadows :** Uniquement ambient (blur 24–48px, opacity 4–8%)
- **Ghost Border :** Si nécessaire : `borderWidth: 1, borderColor: 'rgba(173,179,182,0.12)'`
- Cards : `backgroundColor: colors['surface-container-lowest']`, `borderRadius: radius['2xl']` ou `radius['3xl']`
- Inputs : `backgroundColor: colors['surface-container-low']`, `borderRadius: radius.md`
- Pills/badges : `borderRadius: radius.full`

### 4. Patterns selon le type de composant

**Card :**
```typescript
// Inside createStyles(colors)
card: {
  backgroundColor: colors['surface-container-lowest'],
  borderRadius: radius['2xl'],
  padding: spacing[5],
  ...shadows.ambient,
}
```

**Badge/Pill :**
```typescript
// Inside createStyles(colors)
badge: {
  borderRadius: radius.full,
  paddingHorizontal: spacing[3],
  paddingVertical: spacing[1],
  backgroundColor: colors['surface-container-low'],
}
badgeText: {
  fontFamily: fonts.semibold,
  fontSize: 11,
  letterSpacing: 0.5,
  color: colors['on-surface-variant'],
}
```

**Label uppercase (Editorial Hook) :**
```typescript
// Inside createStyles(colors) — pairer avec un headline en contraste
sectionLabel: {
  ...typography['label-md'],
  color: colors.outline,
  marginBottom: spacing[3],
}
```

**Bouton primaire :**
```typescript
// LinearGradient obligatoire pour primary
// const { colors } = useTheme();
import { LinearGradient } from 'expo-linear-gradient';
// colors={[colors.primary, colors['primary-dim']]}
// borderRadius: radius.full
// ctaText: fontFamily: fonts.semibold, color: colors['on-primary'], letterSpacing: 0.5
```

**Input :**
```typescript
// Inside createStyles(colors)
input: {
  backgroundColor: colors['surface-container-low'],
  borderRadius: radius.md,
  // Focus state via state local : borderWidth: 1, borderColor: 'rgba(95,94,94,0.20)'
}
```

**Glassmorphism (modals, barres flottantes) :**
```typescript
import { BlurView } from 'expo-blur';
// <BlurView intensity={80} tint="light">
glass: {
  backgroundColor: 'rgba(249,249,250,0.75)',
  borderWidth: 1,
  borderColor: 'rgba(173,179,182,0.12)',
  borderRadius: radius.full, // ou radius['3xl'] pour modals
}
```

### 5. Animations (Reanimated v4)
```typescript
import Animated, { useSharedValue, withSpring, withTiming, useAnimatedStyle, FadeInDown } from 'react-native-reanimated';
// Entrée : entering={FadeInDown.duration(300).springify()}
// Press : scaleValue = withSpring(0.97, { damping: 18, stiffness: 300 })
// Pas de useNativeDriver à spécifier
```

### 6. `memo` et performance
- Toujours wrapper avec `memo()` les composants de liste ou fréquemment re-rendus
- Props stables : éviter les objets/tableaux inline dans JSX

### 7. Export
- Default export pour le composant principal
- Named exports pour les sous-composants ou variantes réutilisables
- Exporter l'interface Props

Après création, vérifie l'absence de hex avec : `grep -n '#[0-9a-fA-F]' <fichier>`
