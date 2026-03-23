# /check-design

Audite un fichier (écran ou composant) pour conformité au design system Contra et au système de tokens.

**Usage :** `/check-design <fichier>`
Exemple : `/check-design app/(tabs)/arenas.tsx`
Exemple : `/check-design components/ui/Card.tsx`

---

## Instructions

Lis le fichier indiqué et effectue un audit complet. Produis un rapport structuré avec les sections suivantes :

---

### RAPPORT D'AUDIT DESIGN — `<fichier>`

#### ✅ Conforme
Liste ce qui est correctement implémenté (tokens utilisés, patterns corrects).

#### ❌ Violations
Pour chaque violation, indique :
- **Ligne** : numéro de ligne
- **Problème** : description concise
- **Correction** : valeur de remplacement exacte

Catégories à vérifier :

**1. Couleurs**
- Hex hardcodés → remplacer par `colors.*`
- Exceptions tolérées (ne pas signaler comme erreurs) :
  - `#34C759` (iOS live dot / indicateur vert)
  - `#4285F4` (Google Sign-In)
  - `#AF52DE` (badge PRO purple)
  - Couleurs de difficulté easy (`#dcf8e7`, `#38a169`) et medium (`#fff9e6`, `#c07a00`)
  - `rgba(249,249,250,0.75)` et `rgba(173,179,182,0.12)` (glassmorphism — valeurs précises requises)

**2. Typographie**
- `fontWeight` sans `fontFamily` correspondant
- `fontFamily` avec string littérale au lieu de `fonts.*`
- Combos `fontSize + fontWeight + letterSpacing` qui existent déjà dans `typography.*`
  - Mapping `typography` disponible : `display-lg/md/sm`, `headline-lg/md/sm`, `body-lg/md/sm`, `label-lg/md/sm`

**3. Spacing**
- Valeurs numériques libres pour padding/margin/gap qui correspondent à un token `spacing[n]`
  - Mapping : 4→`[1]`, 8→`[2]`, 12→`[3]`, 16→`[4]`, 20→`[5]`, 24→`[6]`, 28→`[7]`, 32→`[8]`, 36→`[9]`, 40→`[10]`, 48→`[12]`, 64→`[16]`, 80→`[20]`
  - Ne pas signaler les valeurs qui n'ont pas de token équivalent (ex: 6, 10, 14, 18...)

**4. Border Radius**
- Valeurs numériques libres qui correspondent à `radius.*` :
  - 4→`sm`, 8→`md`, 12→`lg`, 16→`xl`, 20→`2xl`, 24→`3xl`, 9999→`full`

**5. Shadows**
- Shadows custom avec `shadowOpacity > 0.10` ou `shadowRadius < 20`
- Shadows qui devraient utiliser `...shadows.ambient` ou `...shadows.float`
- `elevation` sans son `shadow*` correspondant iOS

**6. No-Line Rule**
- Présence de `borderWidth: 1` avec `borderColor` opaque (non-glassmorphism)
- Séparateurs visuels qui devraient être remplacés par du spacing

**7. Fond et texte**
- Fond `#ffffff` comme background global (doit être `colors.background` = `#f9f9fa`)
- Texte `#000000` ou `black` (doit être `colors['on-surface']` = `#2d3336`)

**8. Imports manquants**
- Tokens importés mais non utilisés
- Tokens utilisés mais non importés depuis `@/constants/tokens`

---

#### ⚠️ Avertissements (non-bloquants)
- Patterns qui fonctionnent mais pourraient être simplifiés avec les tokens
- Valeurs de spacing proches d'un token mais pas exactes

#### 📊 Score de conformité
`X/10` — avec brève justification

#### 🔧 Corrections prioritaires
Si des violations existent, liste les 3 corrections les plus impactantes à faire en premier.

---

Après l'audit, demande si tu dois appliquer les corrections automatiquement.
