---
paths:
  - 'src/**/*.jsx'
---

# Material UI 9

- Grille : `<Grid size={{ xs: 12, md: 6 }}>` — plus de props `item`, `xs`, `md`.
- Personnalisation des sous-composants : `slotProps` (plus de `PaperProps`, `InputProps`, `InputLabelProps`…). Attributs de l'`<input>` natif : `slotProps={{ htmlInput: { min: 0 } }}`.
- Style : prop `sx` plutôt que les props système sur `Box` / `Typography` (`sx={{ mt: 2 }}`, pas `mt={2}`).
- Couleurs depuis le thème (`primary.main`, `error.main`, `theme.palette…`), pas de codes hexadécimaux en dur.
- `ThemeProvider` et `CssBaseline` sont fournis une seule fois par `src/index.jsx`.
- Accessibilité : `aria-label` sur chaque `IconButton`, upload via `<Button component="label">` + input caché, confirmations via `Dialog` MUI (pas `window.confirm`).
- Textes de l'interface en français.
