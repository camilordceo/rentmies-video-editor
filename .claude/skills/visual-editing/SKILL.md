# Visual Editing — Style Guide & Rules

## Purpose
Maintain consistent, professional visual quality across all video content. These rules apply to every composition and render.

---

## COLOR GRADES

### When to Use Each Grade

| Grade | Use Case | Mood |
|-------|----------|------|
| `iphone` | Default for all talking head content. Makes Samsung footage look premium. | Clean, modern, trustworthy |
| `cinematic` | Dramatic moments, story hooks, transformation reveals. | Serious, professional, cinematic |
| `warm` | Friendly tutorials, community content, casual tips. | Approachable, warm, personal |
| `raw` | Screen recordings, code demos, technical content. | Authentic, unfiltered, technical |

### Grade CSS Values
```
iphone:    brightness(1.08) contrast(1.12) saturate(1.18) hue-rotate(-3deg)
cinematic: brightness(0.95) contrast(1.25) saturate(0.85) sepia(0.15)
warm:      brightness(1.05) contrast(1.08) saturate(1.22) hue-rotate(8deg)
raw:       none
```

---

## TYPOGRAPHY

### Font Stack
- **Primary:** Inter (all UI text, captions, lower thirds)
- **Monospace:** JetBrains Mono or SF Mono (code, terminal panels, commands)
- **Fallback:** system-ui, -apple-system, sans-serif

### Size Rules (at 1080p)
| Element | Min Size | Recommended | Max Size |
|---------|----------|-------------|----------|
| Main Title / Hook | 64px | 72-84px | 96px |
| Subtitle | 36px | 42px | 54px |
| Captions | 42px | 48px | 56px |
| Lower Third Line 1 | 32px | 36px | 42px |
| Lower Third Line 2 | 24px | 28px | 32px |
| Terminal/Code Text | 20px | 24px | 28px |
| Badge/Chip Text | 18px | 22px | 26px |

### Weight Rules
- **Titles:** 700-800 (bold to extra-bold)
- **Body/Captions:** 600-700 (semi-bold to bold)
- **Secondary text:** 400-500 (regular to medium)
- **Code/Terminal:** 500 (medium, monospace)

---

## COLOR PALETTE

### Primary Colors
| Name | Hex | Usage |
|------|-----|-------|
| Accent Teal | `#40d99d` | Primary accent, highlighted words, active states |
| Dark Background | `#0d1117` | Terminal panels, code backgrounds |
| Card Background | `#1a1a2e` | Cards, lower thirds background |
| Surface | `#161625` | Editor panels, secondary backgrounds |
| Pure White | `#ffffff` | Primary text on dark backgrounds |
| Muted Text | `#8b8ba3` | Secondary text, timestamps |

### Accent Variations (per content type)
- **Tech/Code content:** Teal `#40d99d`
- **Business/Growth content:** Gold `#fbbf24`
- **Warning/Important:** Red `#ef4444`
- **Creative/Design:** Purple `#a78bfa`
- **Success/Results:** Green `#22c55e`

---

## LAYOUT RULES

### Rule of Thirds
- Lower thirds: bottom 1/3 of frame, left-aligned with 8% left margin
- Captions: bottom 15% of frame, centered
- Terminal panel (Skill Breakdown): top 45% of frame
- Video footage: fills remaining space

### Margins & Padding
- Safe zone: 5% from all edges (nothing important in outer 5%)
- Caption padding: 12px vertical, 24px horizontal
- Lower third padding: 16px vertical, 24px horizontal
- Terminal panel padding: 20px all sides

### Z-Order (front to back)
1. Captions (z: 100)
2. Lower thirds (z: 90)
3. Overlays/Screenshots (z: 80)
4. Text overlays (z: 70)
5. Grade filter layer (z: 10)
6. Video footage (z: 0)

---

## B-ROLL RULES

### When to Use B-Roll
- Screen recordings when mentioning a tool or feature
- Screenshots when showing results or data
- Background footage for hook cards

### Screenshot Overlay Rules
- Max 60% of frame width
- Rounded corners: 12px
- Drop shadow: `0 8px 32px rgba(0,0,0,0.4)`
- Border: 1px solid rgba(255,255,255,0.1)
- Entry: slide + fade from right (20 frames)
- Exit: fade out (10 frames)
- Label underneath: small text with tool/feature name

### When NOT to Use B-Roll
- Emotional moments (keep the face)
- The first 3 seconds (hook should be face + text)
- When the talking is the value (don't distract)

---

## ANIMATION TIMING

### Standard Durations
| Animation | Frames (30fps) | Seconds |
|-----------|----------------|---------|
| Fade in | 10-15 | 0.33-0.5s |
| Slide in | 15-20 | 0.5-0.67s |
| Spring pop | 12-18 | 0.4-0.6s |
| Stagger delay | 4-8 | 0.13-0.27s |
| Hold (caption) | 45-90 | 1.5-3s |
| Exit fade | 8-12 | 0.27-0.4s |

### Easing
- Entrances: `Easing.out(Easing.cubic)` — fast start, gentle settle
- Springs: damping 10-14, stiffness 100-200 — snappy but not jittery
- Exits: linear or gentle ease-in — don't draw attention to exits

---

## BACKGROUND GUIDELINES

### Dark Gradients (for Hook Cards)
```css
/* Default gradient */
background: linear-gradient(135deg, #0d1117 0%, #1a1a2e 50%, #0d1117 100%);

/* Accent gradient */  
background: linear-gradient(135deg, #0d1117 0%, #1a3a2e 50%, #0d1117 100%);

/* Warm gradient */
background: linear-gradient(135deg, #1a1510 0%, #2e1a1a 50%, #1a1510 100%);
```

### Image Backgrounds
- Always apply: `filter: blur(20px) brightness(0.3)`
- This creates ambient texture without distraction
- Never use sharp backgrounds with text overlay
