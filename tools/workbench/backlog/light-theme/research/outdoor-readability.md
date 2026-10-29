# Outdoor readability: research for a light theme

Scope: what makes a phone UI readable in direct sunlight, how comparable products theme and switch, and which light-theme variants are worth a mockup. Numbers marked _(model)_ come from the contrast model in § 1.3; everything else carries a source in § 6. Claims I could not confirm are marked **unverified**.

## 1. Readability findings

### 1.1 What the research says

- **Light mode (dark text on light ground, "positive polarity") reads better for people with normal vision.** Piepenbrock et al. (2013) found it better on acuity and proofreading for young and older adults, and the advantage grows as the text gets smaller [S1, S2]. Participants did not notice the difference, even though they performed better [S1].
- **Ambient light changes the effect.** In Dobres et al. (2017), dark mode in dark surroundings did worst. In simulated daylight, polarity made no significant difference [S1, S3]. The authors explain the light-mode advantage by the pupil narrowing under bright light, which cuts optical aberration [S3]. So in a lab, bright ambient light alone does not make dark mode fail. What fails outdoors is the screen itself: reflections and mid-grey text (§ 1.2).
- **Display vendors measure sunlight readability as brightness against reflectance.** DisplayMate rates phones by "contrast rating for high ambient light". Good phones reflect about 4.4–4.8 % of ambient light [S4, S5]. Readability needs both high brightness and low reflectance [S5].
- **Bike computers default to dark but offer light, or switch by time of day.** Garmin Edge has *Color Mode*: day, night or Auto, which switches "based on the time of day" [S6]. Wahoo BOLT v2 and ROAM v2 added a light/dark Display Mode switch on the device [S7] (exact page content **unverified**: the page returned 403; this comes from the search snippet). Wahoo users report daytime readability is better in light mode (forum, anecdotal) [S8].
- **NN/g's verdict** is that light mode is better for most users by default, and users should be able to switch to dark [S1].

### 1.2 Why the current dark UI fails outdoors

1. **Reflections add the same luminance to every pixel.** On a black background that added light is often larger than the text luminance itself, so mid-grey text sinks into it. On a white background, the reflection is small next to the background.
2. **A dark screen works as a mirror.** Your face, the sky and your hand show clearly on a near-black surface (#030712) and are hidden by a bright one. This is a physical effect; there is no numeric source here.
3. **The secondary text ramp collapses first.** Primary text survives in both polarities. Tertiary and quaternary text, units, axis labels and `white/5`–`white/10` dividers do not (table below).
4. **Hue disappears first.** Reflected light has no colour, so it washes out saturation. Light 400 shades (sport green #4ade80) and colours of similar lightness become hard to tell apart. Meaning carried only by hue, such as sport colour or zone colour, is lost before text is.
5. **Small and thin text suffers most** [S2]. Weight 300 and 11–12 px labels are the first to go.

Caveat on OLED: phones limit full-screen white brightness more than they limit a mostly dark screen. A white UI therefore may not reach the advertised peak nits, while a dark UI can drive small bright text hotter. The model below assumes the same white level for both, which slightly favours the light theme. Measure on the owner's real phone.

### 1.3 Contrast model: current tokens vs light candidates

_(model)_ The effective contrast is `(Y_text·W + R) / (Y_bg·W + R)`. W is the screen white level, 1000 cd/m² (a conservative sustained outdoor level). R is the reflected luminance: ambient illuminance × 1 % diffuse reflectance ÷ π. That gives R ≈ 64 cd/m² for bright shade or overcast (20 klx) and R ≈ 318 cd/m² for direct sun (100 klx). The reflectance and white level are assumptions; the ranking holds over plausible values. Script: WCAG 2 relative luminance plus APCA 0.0.98G-4g.

| Token / role   | Dark today (on #030712)     | WCAG | APCA Lc | 20 klx | 100 klx  | Light candidate (on #ffffff) | WCAG | APCA Lc | 20 klx | 100 klx |
| -------------- | --------------------------- | ---- | ------- | ------ | -------- | ---------------------------- | ---- | ------- | ------ | ------- |
| primary        | #e5e7eb                     | 16.3 | −92     | 13.1   | 3.5      | #111318 (gray-900)           | 18.6 | 105     | 15.2   | 4.1     |
| secondary      | #b0b4be                     | 9.7  | −62     | 7.9    | 2.4      | #3a3e48 (gray-600)           | 10.7 | 95      | 9.5    | 3.6     |
| tertiary       | #8b8f9a                     | 6.2  | −42     | 5.1    | **1.85** | #5c616e (gray-500)           | 6.2  | 81      | 5.8    | 3.0     |
| quaternary     | #5c616e                     | 3.3  | −21     | 2.8    | **1.37** | #8b8f9a (gray-400)           | 3.2  | 60      | 3.1    | 2.2     |
| accent         | #3b82f6                     | 5.5  | −38     | 4.5    | 1.7      | #1d4ed8 (blue-700)           | 6.7  | 82      | 6.2    | 3.1     |
| sport running  | #4ade80                     | 11.6 | −71     | 9.4    | 2.7      | #15803d (green-700)          | 5.0  | 74      | 4.8    | 2.8     |
| sport cycling  | #f97316                     | 7.2  | −49     | 5.9    | 2.0      | #c2410c (orange-700)         | 5.2  | 75      | 4.9    | 2.8     |

What the table shows:

- The same WCAG ratio, 6.2 for tertiary in both columns, gives **1.85 : 1 in direct sun on dark and 3.0 : 1 on light**. This is the core argument for a light theme. WCAG 2 ratios do not predict it; APCA does better (Lc 42 against Lc 81).
- Today's sport and accent colours cannot be reused on white. On white, green-400 reaches only 1.7 : 1 and orange-500 2.8 : 1, so a light theme needs its own 700/800 shades for text and lines.
- An off-white page (#f3f4f6) costs about 9 % contrast across the ramp. Warm paper (#f7f4ee, warm greys) costs about 10–15 %.

### 1.4 Numeric targets for a sunlight-readable light theme

| Role                                                   | Minimum                         | Target               | Why                                                          |
| ------------------------------------------------------ | ------------------------------- | -------------------- | ------------------------------------------------------------ |
| Primary text, numbers                                  | WCAG 12 : 1, APCA Lc 90         | ≥ 16 : 1, Lc ≥ 100   | Lc 90 is APCA's preferred body level [S9]                    |
| Secondary text (labels, units)                         | WCAG 7 : 1, Lc 75               | ≥ 9 : 1, Lc ≥ 85     | stays ≥ 3.3 : 1 at 100 klx _(model)_; Lc 75 is the body minimum [S9] |
| Tertiary text (hints, axis ticks)                      | WCAG 5.5 : 1, Lc 75             | ≥ 6 : 1, Lc ≥ 80     | ≥ 3 : 1 at 100 klx _(model)_                                 |
| Disabled or decorative only                            | Lc 30                           | none                 | Lc 30 is "spot readable" only [S9]                           |
| Icons, chart lines, route on map                       | WCAG 3 : 1, Lc 45               | ≥ 4.5 : 1            | Lc 45 for fine icons [S9]; hue washes out                    |
| Dividers, card edges                                   | Lc 15                           | Lc ≥ 20, ≥ 1 px solid | below Lc 15 counts as invisible [S9]                         |
| Accent and sport colours as text                       | WCAG 4.5 : 1                    | ≥ 5 : 1 (700 shades) | see the table in § 1.3                                       |
| Page surface                                           | #ffffff or ≥ 0.9 relative luminance | #ffffff          | every step below white lowers all text contrast              |
| Font                                                   | ≥ 14 px at 400, ≥ 12 px at 600  | numbers 600, labels 500, no 300 | the light advantage grows as size shrinks [S2]; APCA size and weight table [S9] |

Common indoor references: WCAG AA is 4.5 : 1 for text and 3 : 1 for large text and UI; AAA is 7 : 1. Apple's HIG is commonly summarised as 4.5 : 1 minimum and 7 : 1 for small text (the exact HIG wording is **unverified**; the page renders only with JS) [S10]. Indoor AA alone is not enough outdoors (§ 1.3).

## 2. Comparable products

| Product                          | Theming                                                                                | How users switch                                                              | Source                                 |
| -------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------- |
| Strava (app)                     | Light by default; dark added in mid-2024                                               | You › Settings › Appearance: Default (follows phone) / Light / Dark           | [S11, S12]                             |
| Garmin Connect (app)             | Dark by default; light added in Sep 2023                                               | More › Settings › Theme: Light / Dark / System                                | [S13, S14]                             |
| Komoot                           | Light; release notes mention dark-mode fixes                                           | Probably follows the system; no in-app toggle found (**unverified**)          | [S15]                                  |
| intervals.icu (web)              | Light by default; dark "V1" shipped and still has contrast bugs in dialogs             | A setting exists; its location is **unverified**                              | [S16, S17]                             |
| TrainingPeaks                    | Light; users ask for dark                                                              | No toggle confirmed (**unverified**)                                          | [S18]                                  |
| Apple Fitness (iPhone) / Workout (Watch) | iPhone follows the system; Watch is always black (OLED)                        | iOS system setting only (**unverified**, observation)                         | none                                   |
| Apple Maps (iOS)                 | Light or dark map following the system appearance and time of day                     | No per-app override on iOS; Mac has "always light map"                        | [S19, S20]                             |
| Google Maps (navigation)         | Day and night colour scheme                                                            | Navigation settings › Colour scheme: Automatic (by time of day, default) / Day / Night | [S21, S22] (older sources)    |
| Garmin Edge (head unit)          | Day and night colours                                                                  | System › Display › Color Mode: Day / Night / Auto (time of day)               | [S6]                                   |
| Garmin handhelds (Oregon, Rino)  | Light and dark appearance                                                              | Appearance setting with automatic by sunrise and sunset                       | [S14, Garmin manual results]           |
| Wahoo BOLT v2 / ROAM v2          | Light and dark, dark by default                                                        | On-device Display Mode toggle; no auto mode found                             | [S7, S8]                               |

Patterns across them: phone apps use a 3-way switch (System / Light / Dark) in their settings. Navigation products add **automatic by time of day**. None found uses an ambient light sensor. None ships a separate "sunlight" mode; high contrast is left to the OS (iOS Increase Contrast, Android contrast levels; Material 3 defines standard, medium and high contrast [S23]).

## 3. Patterns

### 3.1 Light palette character

| Pattern | Description | Outdoor readability | Fit at 390 px | Effort | Risks |
| ------- | ----------- | ------------------- | ------------- | ------ | ----- |
| **P1 Paper (pure white, flat)** | Page and cards #ffffff; cards separated by 1 px gray-200 borders or a hairline shadow; gray-900/600/500 text ramp; 700 accents | Best of the soft options: full white ground, ramp ≥ 6 : 1 | Good; borders cost no width | Medium: a new token set plus replacing the ~98 `*-white/N` overlays (51 files) with semantic tokens | Glare indoors and at night (handled by switching); cards blur together without borders |
| **P2 Off-white page, white cards** | Page #f3f4f6, cards #ffffff, same ramp | ~9 % less contrast on the page, full contrast inside cards | Good; cards read as blocks without borders | Same as P1 | Text placed straight on the page (headers, empty states) loses contrast; low-contrast card edges vanish in sun |
| **P3 Sunlight high contrast** | White, black #000 text, secondary #1a1d24, tertiary #3a3e48, 800 accents, weight +100, 1.5 px borders, no greys below Lc 75 | Highest: ramp ≥ 10 : 1 | Good; heavier weight may wrap long German labels | Low extra on top of P1 (a second token set) | Looks harsh, hierarchy flattens (everything is dark), a 4th theme to test |
| **P4 Tinted or warm paper** | Page #f7f4ee, warm greys | 10–15 % below P1 | Good | Same as P1 | Lower contrast, clashes with map and sport colours, looks like a reading app |

Applies to all four: a light basemap (the vendored CARTO voyager, `apps/web/src/features/map/mapStyle.ts:8-12`; positron, CARTO's light grey style, is not vendored), darker route, sport and chart tokens, and `color-scheme: light` so native controls and scrollbars follow.

### 3.2 Switching model

| Model | Description | Outdoor fit | Effort | Risks |
| ----- | ----------- | ----------- | ------ | ----- |
| **S1 System follow only** | `prefers-color-scheme` | Weak: many people keep the phone dark all day, so the light theme never appears outdoors | Low | No in-app escape when the system choice is wrong for the moment |
| **S2 Manual 3-way: System / Light / Dark** | What Strava and Garmin Connect do [S11, S13] | Good if the user plans ahead | Low–medium: a persisted preference and a select in Settings › Display (`apps/web/src/pages/SettingsPage.tsx:59-91`, beside Language) | Two taps deep in Settings is slow when standing in the sun |
| **S3 Auto by time / sun** | Light between sunrise and sunset, computed locally from the last known position or the latest activity's GPS (no external service) | Good daytime default; matches Garmin Edge, Google Maps and Garmin handhelds [S6, S21] | Medium: sun-position maths and a re-check while the app is open | Shade, tunnels, indoor training at noon; needs a location |
| **S4 Ambient light sensor** | `AmbientLightSensor` | Would be ideal | n/a | Not usable: not supported in iOS Safari, behind a flag in Chrome; only Firefox Android lists it [S24, S25] |
| **S5 Follow `prefers-contrast: more`** | Switch to the P3 tokens when the OS asks for more contrast | Helps users who already enable Increase Contrast | Low | Supported in iOS Safari 14.5+, Chrome and Firefox [S26]; few users turn it on |
| **S6 One-tap quick toggle** | A sun/moon button in a persistent bar, same place at every width, next to the Settings entry | Best for "I'm in the sun right now" | Low–medium; needs a fixed slot in the dock or header | Uses chrome space at 390 px; overlaps with S2 |

PWA chrome risks for every model:

- `theme-color` is fixed at `apps/web/index.html:11` and the body background at `apps/web/index.html:18`. Both need per-theme values: a `media` attribute for System, or JS for a manual choice.
- `<html class="dark">` is hard-coded at `apps/web/index.html:2`.
- `apple-mobile-web-app-status-bar-style` is `black-translucent` (`apps/web/index.html:12`). That shows white status-bar text, which disappears on a white header, and iOS reads it only at launch (**unverified** on the current iOS; check on a device).
- The preference stores persist to IndexedDB asynchronously (`apps/web/src/store/layout.ts:33-34`, `idbStorage` + `skipHydration`). A theme read from there arrives after first paint, so the app would flash dark. The theme needs a synchronous first-paint source, such as an inline script reading `localStorage`.

## 4. Shortlist (390 px sketches)

Every sketch shows the session list header and two cards. `▒` marks surfaces, `░` the page.

**V1: Paper + System / Light / Dark (P1 × S2)**: maximum white ground with border-separated cards, switched like Strava and Garmin Connect. ← **test first**

```
┌──────────────────────────────────────┐
│ PaceVault                 ⚙          │  #ffffff, text #111318
├──────────────────────────────────────┤
│ ┌──────────────────────────────────┐ │  card #ffffff, 1px #d1d5db
│ │ ● Run · Sat 24 Oct               │ │  ● green-700
│ │ 10.42 km   5:12 /km   142 bpm    │ │  numbers 600
│ │ distance   pace       avg HR     │ │  labels #5c616e 500
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ ● Ride · Thu 22 Oct              │ │  ● orange-700
│ └──────────────────────────────────┘ │
│ Settings › Display                   │
│ Appearance   [ System ▾ ]            │  System · Light · Dark
│              Darstellung: System · Hell · Dunkel │
└──────────────────────────────────────┘
```

**V2: Off-white page, white cards + 3-way (P2 × S2)**: softer indoors; cards separated without borders.

```
┌──────────────────────────────────────┐
│░PaceVault░░░░░░░░░░░░░░░░░░░⚙░░░░░░░░│  page #f3f4f6
│░┌────────────────────────────────┐░░│
│░│▒● Run · Sat 24 Oct▒▒▒▒▒▒▒▒▒▒▒▒▒▒│░░│  card #ffffff, no border
│░│▒10.42 km  5:12 /km  142 bpm▒▒▒▒│░░│
│░└────────────────────────────────┘░░│
│░┌────────────────────────────────┐░░│
│░│▒● Ride · Thu 22 Oct▒▒▒▒▒▒▒▒▒▒▒▒▒│░░│
│░└────────────────────────────────┘░░│
│░Appearance░[ System ▾ ]░░░░░░░░░░░░░│
└──────────────────────────────────────┘
```

**V3: Paper + a "High contrast" option (P1 + P3 × S2 + S5)**: a 4-way select (System / Light / Dark / High contrast); High contrast is also picked when the OS reports `prefers-contrast: more`.

```
┌──────────────────────────────────────┐
│ PaceVault                 ⚙          │  #ffffff, text #000000
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │  1.5px #3a3e48 border
│ ┃ ■ Run · Sat 24 Oct               ┃ │  ■ green-800 + "Run" label
│ ┃ 10.42 km   5:12 /km   142 bpm    ┃ │  numbers 700
│ ┃ distance   pace       avg HR     ┃ │  labels #1a1d24 600
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│ Appearance  [ High contrast ▾ ]      │  DE: Hoher Kontrast
└──────────────────────────────────────┘
```

**V4: Paper + Auto by sun (P1 × S2 + S3)**: the select gains "Auto (sun)", light between sunrise and sunset at the last known position, computed on the device.

```
┌──────────────────────────────────────┐
│ Settings › Display                   │
│ Appearance        [ Auto (sun) ▾ ]   │  System · Light · Dark · Auto (sun)
│ Light 07:41–17:02 at last position   │  DE: Automatisch (Sonne)
│                                      │      Hell 07:41–17:02 am letzten Ort
│ ┌──────────────────────────────────┐ │
│ │ ● Run · Sat 24 Oct   (light now) │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

**V5: Paper + one-tap toggle (P1 × S2 + S6)**: the V1 select, plus a sun/moon button that flips between Light and Dark in the same header slot at every width. A long press or the Settings entry still sets System.

```
┌──────────────────────────────────────┐
│ PaceVault              ☀  ⚙          │  ☀ = switch to light, ☾ in light
├──────────────────────────────────────┤  aria-label "Light theme" /
│ ┌──────────────────────────────────┐ │             "Helles Design"
│ │ ● Run · Sat 24 Oct               │ │
│ │ 10.42 km   5:12 /km   142 bpm    │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

Excluded: P4 warm paper (lowest contrast of the light options, clashes with map and sport colours) and S4 ambient sensor (no iOS support).

**Why V1 first:** V2–V5 all reuse V1's light token set, so V1 is the base any variant needs. It is also the plainest test of the real question: does a white ground with this text ramp fix the problem on the owner's phone in the sun? V3's harsher palette and V4/V5's switching only matter once that answer is yes.

## 5. Open questions

1. **Default for a fresh install**: (a) System, (b) Light, (c) Dark as today. Strava and Garmin Connect ship a fixed default and offer System as an option.
2. **Map in the light theme**: (a) follow the theme with CARTO voyager (vendored), (b) vendor CARTO positron (lighter, calmer under routes), (c) keep the dark map in both themes.
3. **High contrast**: (a) no separate mode; make the light theme itself meet the § 1.4 targets, (b) a 4th option (V3), (c) only through `prefers-contrast: more`.
4. **Switch location**: (a) Settings › Display only, (b) plus a one-tap header toggle (V5), (c) plus Auto by sun (V4).
5. **Should the dark theme also be lifted to the outdoor targets?** Tertiary #8b8f9a and quaternary #5c616e fall to 1.85 : 1 and 1.37 : 1 in sun _(model)_, and quaternary misses AA even indoors (3.3 : 1). Options: (a) yes, in this item, (b) a separate item, (c) no.
6. **Sport colour on white**: (a) darker 700 shades only, (b) 700 shades plus a text label or icon, so meaning does not rely on hue alone.

## 6. Sources

- [S1] NN/g, "Dark Mode vs. Light Mode: Which Is Better?": https://www.nngroup.com/articles/dark-mode/
- [S2] Piepenbrock, Mayr, Buchner (2013), positive polarity and font size, *Human Factors*, via [S1]
- [S3] Dobres, Chahine, Reimer (2017), *Applied Ergonomics* 60, 68–73, doi 10.1016/j.apergo.2016.11.001: https://rosap.ntl.bts.gov/view/dot/43887/dot_43887_DS1.pdf
- [S4] DisplayMate Mobile Brightness Shoot-Out: https://displaymate.com/Mobile_Brightness_ShootOut_2.htm
- [S5] Cult of Mac on DisplayMate's iPhone 12 Pro Max test (4.8 % reflectance): https://www.cultofmac.com/728140/iphone-12-pro-max-screen-displaymate-analysis/
- [S6] Garmin Edge 1030 manual, Display Settings: https://www8.garmin.com/manuals/webhelp/edge1030/EN-US/GUID-0222B83B-39C2-4537-9A4D-AD8688F2CD26.html
- [S7] Wahoo support, "Dark mode [ELEMNT]" (403 on fetch; content from the search snippet): https://support.wahoofitness.com/hc/en-us/articles/17016261629586
- [S8] Wahoo forum, dark mode with backlight: https://wahoox.forum.wahoofitness.com/t/wahoo-elmnt-use-dark-mode-when-the-backlight-is-on-and-light-mode-when-the-back-light-is-off/27110 ; the5krunner on ELEMNT backlights: https://the5krunner.com/2025/04/19/wahoo-backlight-vs-no-backlight-on-every-elemnt-ever/
- [S9] APCA in a Nutshell: https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html
- [S10] Apple HIG Accessibility (JS-rendered, wording unverified): https://developer.apple.com/design/human-interface-guidelines/accessibility ; WCAG 2.2 contrast minimum: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- [S11] Strava support, Dark Mode on Strava: https://support.strava.com/hc/articles/27117698066317-Dark-Mode-on-Strava
- [S12] 9to5Google, Strava dark mode: https://9to5google.com/2024/06/26/strava-dark-mode-android-ios/
- [S13] Wareable, Garmin Connect light/dark mode: https://www.wareable.com/garmin/garmin-connect-how-to-change-light-dark-mode
- [S14] Gadgets & Wearables, Garmin Connect light mode (Sep 2023): https://gadgetsandwearables.com/2023/09/14/garmin-connect-light-mode/ ; Garmin Oregon 7xx Appearance settings: https://www8.garmin.com/manuals/webhelp/oregon7xx/EN-US/GUID-D0847B65-EBCE-46C1-82CA-424168F84901.html
- [S15] Komoot App Store listing: https://apps.apple.com/app/id447374873
- [S16] intervals.icu forum, Dark Mode implemented: https://forum.intervals.icu/t/implemented-dark-mode-for-intervals-icu/402
- [S17] intervals.icu News 2026-06-03: https://forum.intervals.icu/t/intervals-icu-news-2026-06-03/130271
- [S18] TrainingPeaks App Store listing: https://apps.apple.com/us/app/-/id408047715
- [S19] MacRumors, Maps dark mode: https://spy.macrumors.com/threads/maps-dark-mode-always-on.2344347
- [S20] Apple Maps on Mac, general settings: https://support.apple.com/en-mk/guide/maps/change-general-settings-mpsb76d658a5/3.0/mac/15.0
- [S21] Android Authority, Google Maps dark navigation theme: https://androidauthority.com/google-maps-dark-theme-navigation-920204
- [S22] 9to5Google, Google Maps night navigation (2018): https://9to5google.com/2018/10/30/google-maps-dark-mode-navigation-android/
- [S23] Flutter material_color_utilities ContrastCurve (contrast levels): https://api.flutter.dev/flutter/package-material_color_utilities_dynamiccolor_src_contrast_curve/ContrastCurve-class.html
- [S24] MDN AmbientLightSensor: https://developer.mozilla.org/en-US/docs/Web/API/AmbientLightSensor
- [S25] caniuse Ambient Light Sensor: https://caniuse.com/ambient-light
- [S26] caniuse prefers-contrast: https://caniuse.com/mdn-css_at-rules_media_prefers-contrast
