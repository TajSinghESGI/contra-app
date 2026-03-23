# /new-screen

Crée un nouvel écran Expo Router pour l'app Contra en suivant toutes les conventions du projet.

**Usage :** `/new-screen <chemin> [description]`
Exemple : `/new-screen app/(tabs)/leaderboard.tsx "Classement hebdomadaire"`

---

## Instructions

Crée le fichier de l'écran à l'emplacement indiqué. Respecte **absolument** toutes les règles suivantes :

### 1. Imports (ordre obligatoire)
```typescript
import React, { useMemo, ... } from 'react';
import { View, Text, StyleSheet, ... } from 'react-native';
// Expo libs
import { ... } from 'expo-...';
// Libs tierces (Reanimated, etc.)
import Animated, { ... } from 'react-native-reanimated';
// Internes @/
import { fonts, radius, shadows, spacing, typography, type ColorTokens } from '@/constants/tokens';
import { useTheme } from '@/hooks/useTheme';
import { ... } from '@/components/ui/...';
// Relatifs
import { ... } from './...';
```

### 2. Tokens — Règles absolues
- **Zéro hex hardcodé** dans les styles. Toujours `colors.*`
- **Zéro `fontWeight`** sans `fontFamily`. Mapping obligatoire :
  - `'800'`/`'700'` → `fonts.bold`
  - `'600'` → `fonts.semibold`
  - `'500'` → `fonts.medium`
  - `'400'` → `fonts.regular`
  - `'300'` → `fonts.light`
  - `'200'`/`'100'` → `fonts.thin`
- Utiliser `...typography['<variant>']` pour les combos fontSize+fontWeight+letterSpacing
- Utiliser `spacing[n]` pour tous les paddings/margins/gaps
- Utiliser `radius.*` pour tous les borderRadius
- Utiliser `...shadows.ambient` ou `...shadows.float` (jamais d'ombres custom)

### 3. Design system — No-Line Rule
- **Zéro bordure 1px solide** pour séparer du contenu
- **Zéro fond blanc pur** (`#ffffff` interdit comme background global — utiliser `colors.background`)
- **Zéro noir pur** pour le texte (utiliser `colors['on-surface']`)
- Cards : `backgroundColor: colors['surface-container-lowest']`, `borderRadius: radius['3xl']` ou `radius['2xl']`
- Fond global : `backgroundColor: colors.background`

### 4. Structure type d'un écran
```typescript
export default function NomScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.root}>
      {/* Header */}
      {/* Contenu principal (ScrollView si nécessaire) */}
    </View>
  );
}

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // ...
});
```

### 5. Boutons CTA primaires
Toujours `LinearGradient` avec `[colors.primary, colors['primary-dim']]`, `borderRadius: radius.full`.
`colors` vient de `const { colors } = useTheme()`.
```typescript
import { LinearGradient } from 'expo-linear-gradient';
// const { colors } = useTheme();
// ...
<LinearGradient colors={[colors.primary, colors['primary-dim']]} style={styles.cta}>
  <Text style={styles.ctaText}>{label}</Text>
</LinearGradient>
// Inside createStyles(colors):
// ctaText: { fontFamily: fonts.semibold, fontSize: 15, color: colors['on-primary'], letterSpacing: 0.5 }
```

### 6. Éléments flottants (glassmorphism)
```typescript
import { BlurView } from 'expo-blur';
// intensity={80}, tint="light"
// + backgroundColor: 'rgba(249,249,250,0.75)'
// + borderWidth: 1, borderColor: 'rgba(173,179,182,0.12)'
```

### 7. Animations
- Utiliser Reanimated v4 : `useSharedValue`, `withSpring`, `withTiming`, `withDelay`
- `FadeInDown`, `FadeIn` pour les entrées d'écran
- `useNativeDriver` implicite dans Reanimated (pas à spécifier)

### 8. Bottom nav
- L'écran `debate/[id].tsx` n'a **PAS** de bottom nav — c'est un focused task view
- Tous les autres écrans principaux ont la nav via `(tabs)/_layout.tsx`

### 9. Accessibilité
- `accessibilityRole` sur les boutons interactifs
- `hitSlop={8}` sur les petits boutons icon

Après avoir créé le fichier, vérifie qu'il n'y a aucun hex hardcodé avec : `grep -n '#[0-9a-fA-F]' <fichier>`
