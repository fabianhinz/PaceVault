# One colour family for "best" (Q79)

The best pass shows up in six places on the segment page: the scatter dot and its small crown, the explorer's best line and legend swatch, the rail note (crown + value), the best card (crown, border at 20 %, tint at 3 %) and the best marker on the map. The mockup's "Best colour" extra (`mockup/hifi/BestPaletteProvider.tsx`) switches all of them together.

## Candidates

| # | Family | Line / dot / map / crown | Rail text | Token |
|---|---|---|---|---|
| 1 | Amber (today's crown) | amber-400 `oklch(82.8% 0.189 84.429)` ≈ #ffb900 | amber-200 ≈ #fee685 | existing (`--color-amber-400`, `--color-amber-200`) |
| 2 | Pale gold | amber-200 ≈ #fee685 | amber-200 | existing (`--color-amber-200`) |
| 3 | White, amber crown only | text-primary #e5e7eb (crown amber-400) | #e5e7eb | existing |
| 4 | Fuchsia | route-fuchsia #e879f9 | fuchsia-200 #f5d0fe | text needs a new token (#f5d0fe) |
| 5 | Yellow | yellow-400 #facc15 (status-warning) | yellow-200 #fef08a | text needs a new token (#fef08a) |

## Distances

ΔE as OKLab distance × 100 / CIEDE2000, line colour against each reference. The colours come from `packages/ui/src/theme.css:107-128`. Running rows: HR, speed, pace, GAP, elevation, grade, cadence. Cycling rows: HR, power, speed, elevation, grade, cadence.

| Reference | 1 Amber | 2 Pale gold | 3 White | 4 Fuchsia | 5 Yellow |
|---|---|---|---|---|---|
| running #4ade80 | 21 / 40 | 20 / 29 | 22 / 30 | 39 / 54 | 19 / 35 |
| cycling #f97316 | **16 / 24** | 26 / 35 | 29 / 37 | 27 / 48 | 21 / 31 |
| HR #ef4444 | 26 / 43 | 35 / 50 | 36 / 40 | 24 / 35 | 31 / 49 |
| power #3b82f6 | 41 / 63 | 43 / 64 | 35 / 36 | 24 / 31 | 43 / 67 |
| speed #22c55e | 23 / 41 | 25 / 31 | 28 / 33 | 40 / 54 | 22 / 35 |
| pace #06b6d4 | 30 / 50 | 30 / 46 | 25 / 27 | 27 / 45 | 30 / 50 |
| GAP #ec4899 | 32 / 60 | 38 / 62 | 34 / 37 | **15 / 18** | 36 / 66 |
| elevation #8b5cf6 | 44 / 70 | 46 / 72 | 39 / 39 | **18 / 18** | 46 / 76 |
| grade #a78bfa | 34 / 62 | 35 / 63 | 27 / 29 | **11 / 13** | 36 / 67 |
| cadence #f59e0b | **7 / 9** | 17 / 21 | 23 / 33 | 30 / 59 | **11 / 16** |
| card background #111318 | 67 / 75 | 75 / 89 | 74 / 85 | 60 / 58 | 70 / 81 |
| map #0e0e0e | 69 / 74 | 77 / 89 | 76 / 86 | 62 / 60 | 72 / 80 |
| Rail text contrast on #111318 (WCAG) | 14.9:1 | 14.9:1 | 15.0:1 | 13.6:1 | 16.0:1 |
| Line contrast on #111318 | 10.8:1 | 14.9:1 | 15.0:1 | 7.6:1 | 12.1:1 |

## Reading

- **Amber** is almost the cadence colour (7 / 9). It is also the closest of all to cycling orange (16 / 24). On a cycling segment the best line and the selected line are both warm, and they separate only by lightness.
- **Pale gold** keeps the gold/crown meaning. Its nearest neighbour is cadence (17 / 21). Its lightness (L ≈ 92 %) sits above every sport and metric colour, so it separates from cycling orange and HR red even where the hues are close.
  - Weak spot: on the map the pale marker sits on the segment's white casing; the dark marker ring keeps it visible.
- **White** is far from everything in the explorer. But on the map it is the grey/white that `apps/web/CLAUDE.md` §3 rules out, it disappears on the white casing, and it splits the family again (white line, amber crown).
- **Fuchsia** is the strongest against both sport colours and on the map. But it collides with the purple and pink metric rows (grade 11 / 13, elevation 18 / 18, GAP 15 / 18), which share the running explorer.
- **Yellow** sits between amber and pale gold. It is too close to cadence (11 / 16) and needs a new text token.

## Recommendation

**(2) Pale gold, amber-200 for line, dot, crown, rail text and map marker.**

- It is the only candidate with no distance under 17 (OKLab) / 21 (ΔE2000) to any colour it meets.
- It needs no new colour value. A semantic `--color-best: var(--color-amber-200)` (plus `tokens.best`) would name it.
- The card's border and tint follow at 20 % / 3 %.

The mini charts' best line stays white in the mockup (not part of Q79).
