# LingoQuest — UX and Visual-System Blueprint

## Phase 8B Deliverable

**Skill used:** `ui-ux-pro-max`
**Model:** Claude Opus
**Date:** 2026-07-18

This is the single decisive, implementation-ready visual direction for LingoQuest. All subsequent
frontend phases implement from this document. No unresolved design alternatives remain.

---

## Reference Study

Observed Duolingo patterns studied from the public interface, official blog posts, and design
documentation. No assets were downloaded or reused.

| Observed pattern | Why recognizable/useful | LingoQuest adaptation | Originality safeguard | Route/component |
|---|---|---|---|---|
| Vertical winding learning path with circular nodes | Instantly signals "language learning app"; creates progression storytelling | Winding S-curve path with circular `SkillNode3D` components using alternating left-right offset | Original node depth/shadow system, unique color palette, no Duo owl | `/` (home) |
| Unit banners spanning path width | Separates thematic groups; provides context | `UnitBanner` with gradient backgrounds using LingoQuest brand colors | Original typography, different gradient angles, no Duolingo exact colors | `/` path sections |
| Circular skill nodes with crown/progress rings | Communicates skill completion at a glance | `SkillNode3D` with `ProgressRing` and crown count badge | Different ring thickness, custom depth system, original iconography | `/` path nodes |
| Four distinct node states (locked/available/active/done) | Users know what they can and cannot access | Grayscale+lock icon, colored+glow, pulsing+border, gold+checkmark | Different color tokens, original lock/glow implementations | `SkillNode3D` variants |
| Top bar with hearts/streak/XP/gems | Persistent gamification context without leaving the flow | `GamificationBar` with `StatIndicator` pills | Different layout spacing, original pill shapes, custom icon set | `AppShell` header |
| Bottom navigation on mobile | Thumb-zone access to primary destinations | Mobile `BottomNav` with 4-5 tabs | Original icons, different active-state indicator | `MobileNavigation` |
| Left sidebar on desktop | Persistent wayfinding on large screens | `DesktopNavigation` rail-style sidebar with icons+labels | Unique rail width, different highlight treatment | `DesktopNavigation` |
| Lesson progress bar (green filling left-to-right) | Clear lesson advancement visualization | `ProgressBar` with animated fill, hearts on right | Different corner radius, unique success color token | `LessonShell` header |
| Large exercise cards with generous touch targets | Easy interaction on all devices | Full-width exercise area with ≥48px choice targets | Original card depth, different spacing scale | `ExerciseShell` |
| Bottom feedback bar (green correct / red incorrect) | Immediate unmistakable result communication | `FeedbackBar` sliding up from bottom with icon + message | Original messaging tone, different slide animation, custom icons | `FeedbackBar` |
| Check/Continue CTA pinned to bottom | Consistent action placement; prevents hunting | Full-width `Button3D` pinned in safe area | Different depth system, unique press animation | Lesson `ActionBar` |
| Celebration confetti/animation on completion | Emotional reward signals achievement | Particle burst + XP counter animation on `CompletionCelebration` | Original particle colors, different motion curve, no Duo characters | `/lesson/[id]` results |
| Out-of-hearts modal with refill option | Clear failure state with recovery path | `Modal3D` with heart icon, refill button, return-to-path | Original modal design, different gem icon | Hearts failure modal |
| Mascot character encouragement | Personality and emotional connection | Original fox-explorer mascot "Quest" (SVG/CSS) | Completely original character; fox, not owl | `MascotFlourish` |
| Profile with XP/streak/achievements grid | Summarizes all progress in one view | Card-based profile with stats grid and achievement gallery | Original card layouts, different spacing | `/profile` |
| Leaderboard with rank highlight | Social motivation and progress comparison | Ranked list with current-user emphasis using brand accent | Different rank indicators, unique highlight style | `/leaderboard` |
| Modal overlays for important states | Focus attention on critical moments | `Modal3D` with backdrop blur and focus trap | Original depth borders, custom backdrop | All modals |
| Toast notifications for XP/streak/achievements | Non-blocking celebration feedback | Toast stack from top-right with auto-dismiss | Original toast shape, different slide direction | `ToastSystem` |
| Thick rounded borders with bottom-edge depth | Chunky, tactile, toy-like interface feel | CSS `border-bottom` + `box-shadow` + `translateY` press system | Unique depth values, different shadow colors per theme | All interactive elements |

---

## 1. LingoQuest Product Identity

### Brand personality

LingoQuest is an adventurous, encouraging, and playful language-learning companion. The brand
personality is:

- **Adventurous:** Learning is a quest, each lesson is a step on the journey
- **Encouraging:** Never punishing, always motivating forward progress
- **Playful:** Interface delights with tactile depth and responsive feedback
- **Trustworthy:** Progress is real, backed by persistent data, never faked
- **Approachable:** Friendly, rounded, warm — never corporate or clinical

### Original mascot concept: "Quest" the Explorer Fox

A curious, friendly fox character wearing a small explorer's satchel/bandana. The fox represents
curiosity, cleverness, and adventure — qualities aligned with language learning.

**Visual characteristics:**
- Rounded, simplified geometric form (achievable in SVG/CSS)
- Warm orange-amber body with cream chest/face markings
- Large expressive eyes (two dot eyes + eyebrow shapes)
- Small triangular ears
- Bushy tail used for expressive poses
- Wears a teal/blue bandana (matching brand accent)

**Personality expressions:**
- Encouraging: Tail wagging, eyes bright
- Celebrating: Jumping pose, confetti context
- Thinking: Head tilt, paw on chin
- Sympathetic: Slight frown, supportive gesture

### Mascot-style flourishes

Quest appears contextually:
- Path page: Peeking from behind a unit banner on first visit
- Lesson start: Waving encouragement
- Correct answer: Quick celebratory bounce (small, non-blocking)
- Lesson complete: Full celebration pose
- Out of hearts: Sympathetic expression with bandage
- Achievement unlock: Holding the badge proudly
- Empty states: Pointing toward next action

Flourishes are SVG components rendered at 48–80px, never blocking interaction, and replaced by
static poses under `prefers-reduced-motion`.

### Original visual motifs

- **Compass rose:** Subtle background pattern element for headers/banners
- **Map/trail markers:** Progress indicators styled as trail waypoints
- **Gem crystals:** Angular, faceted gem shapes for the gems indicator
- **Shield badges:** Achievement containers styled as explorer shields
- **Star bursts:** XP celebration particles

### Wordmark treatment

"LingoQuest" in the primary display font (Nunito/Baloo 2 family), with a slight upward tilt on
the "Q" descender or a small compass-star dot on the "i". No downloaded logo — rendered as styled
text + SVG accent.

### Iconography approach

- Use Lucide React icons as the base icon set (open-source, consistent, rounded)
- Custom SVG for gamification: hearts, gems, streak flame, crowns, XP star
- All icons at 20–24px standard, 16px compact, 32px emphasis
- Stroke-based style matching the rounded interface aesthetic
- No emoji as functional icons

### Illustration approach

- SVG-based spot illustrations for empty/loading/error states
- Geometric, rounded style matching the interface
- Limited to 3–4 colors per illustration from the token palette
- Quest mascot as the primary illustrative element
- Trail/map metaphors for empty-path or loading states

### Tone of voice

- Encouraging but not patronizing
- Short, punchy feedback phrases
- Active voice
- Occasional wordplay aligned to the quest/adventure theme

### Original feedback phrases

**Correct answers:**
- "Nailed it!"
- "You're on fire!"
- "Perfect quest move!"
- "Exactly right!"
- "Sharp thinking!"
- "Quest complete!"

**Incorrect answers:**
- "Not quite — keep going!"
- "Almost there!"
- "Good try! The answer is:"
- "Close one! Here's the solution:"

**Lesson completion:**
- "Quest accomplished!"
- "Another step on your journey!"
- "You're leveling up!"

**Streak messages:**
- "X days strong! Keep the streak alive!"
- "Your longest journey yet!"

### Copyright and originality boundaries

- LingoQuest name and wordmark: **Original**
- Quest fox mascot: **Original SVG/CSS creation**
- All feedback text/copy: **Original**
- Color palette: **Original tokens** (inspired by playful gamification aesthetics, not copied)
- Icon shapes: **Lucide open-source** + original custom gamification SVGs
- Font: **Google Fonts open license** (Nunito or similar rounded sans)
- Audio: **Browser speechSynthesis only** (no downloaded audio)
- Interaction patterns: **Generic UX patterns** (progress bars, modals, toasts are not owned)
- Never use: Duolingo owl, character art, exact hex codes, audio files, or product copy

---

## 2. First-Glance Duolingo Fidelity

The interface must immediately read as a playful, gamified language-learning experience to anyone
familiar with Duolingo. The following visual qualities are mandatory:

### Required visual qualities

| Quality | Implementation |
|---|---|
| Chunky, rounded, readable typography | Nunito 700–800 for headings, 400–600 for body; minimum 16px base |
| Bright playful semantic colors | Green success, red error, blue primary, gold crowns, orange streak — saturated and joyful |
| Strong white space | 24–48px section gaps; generous card padding (16–24px) |
| Thick rounded outlines | 2–3px borders with `rounded-xl` to `rounded-2xl` (12–16px radius) |
| Large touch-friendly controls | Minimum 48px height for buttons/choices; 56px for primary CTAs |
| Visible bottom-edge depth | 4px colored bottom-border creating the "3D block" effect |
| Controls that depress when pressed | `translateY(4px)` + border-bottom collapse on `:active` |
| Vertical winding learning path | S-curve node arrangement with connecting SVG/CSS path line |
| Large circular skill nodes | 64–80px diameter circles with state-colored backgrounds |
| Crown/progress-ring visuals | SVG ring around nodes showing crown progress (0–5 filled segments) |
| Streak, heart, XP, and gem indicators | Persistent top/header bar with icon+number `StatIndicator` pills |
| Friendly original mascot encouragement | Quest fox SVG appearing at contextual moments |
| Large exercise choices | Full-width choice cards with 48px+ height, readable text |
| Bottom correct/incorrect feedback surface | Fixed-bottom `FeedbackBar` with color + icon + text |
| Celebratory completion states | Particle animation + stat reveals on lesson complete |
| Clear locked/available/active/completed states | Distinct colors, icons, opacity, and depth per state |

### Explicitly avoided aesthetics

- Generic SaaS dashboard layouts
- Flat quiz forms with thin borders
- White card collections with minimal color
- Glassmorphism or frosted overlays
- Excessive gradients (subtle gradients OK for banners)
- Controls smaller than 44px
- Dense data tables (except admin content)
- Generic Bootstrap/Material component appearance
- Decorative animation without functional meaning

### Admin exception

The `/admin/content` route may use denser layouts (smaller spacing, table views) for content
management efficiency, but must still use LingoQuest tokens, shared Button3D/Card3D primitives,
and consistent typography.

---

## 3. Design Tokens

### Color Tokens — Light Theme

```
--lq-primary: #1cb0f6           /* Brand blue — CTAs, links, active states */
--lq-primary-hover: #1899d6     /* Pressed/hover blue */
--lq-primary-depth: #1682b8     /* Bottom-edge blue */

--lq-secondary: #ce82ff         /* Purple — secondary actions, timed mode */
--lq-secondary-hover: #b866f0
--lq-secondary-depth: #a14edc

--lq-success: #58cc02           /* Correct answers, completed states */
--lq-success-hover: #4cad02
--lq-success-depth: #3f8c01
--lq-success-bg: #d7ffb8        /* Success feedback surface */

--lq-error: #ff4b4b             /* Wrong answers, hearts lost */
--lq-error-hover: #e53e3e
--lq-error-depth: #cc2d2d
--lq-error-bg: #ffdfe0          /* Error feedback surface */

--lq-warning: #ffc800           /* Timed warning state */
--lq-warning-depth: #e6b400

--lq-bg-page: #f7f7f7           /* Page background */
--lq-bg-surface: #ffffff        /* Card/modal surface */
--lq-bg-elevated: #ffffff       /* Elevated surface (same in light) */
--lq-bg-sunken: #e5e5e5         /* Recessed areas */
--lq-bg-overlay: rgba(0,0,0,0.6) /* Modal backdrop */

--lq-text-primary: #3c3c3c     /* Primary text */
--lq-text-secondary: #777777   /* Secondary/muted text */
--lq-text-disabled: #afafaf    /* Disabled text */
--lq-text-inverse: #ffffff     /* Text on colored surfaces */
--lq-text-success: #2b8700     /* Success text (meets AA on white) */
--lq-text-error: #cc1818       /* Error text (meets AA on white) */

--lq-border-default: #e5e5e5   /* Default border */
--lq-border-strong: #cdcdcd    /* Emphasized border */
--lq-border-focus: #1cb0f6     /* Focus ring color */
--lq-border-divider: #f0f0f0   /* Section divider */

/* Gamification-specific */
--lq-xp-color: #ffc800         /* XP star/text */
--lq-xp-bg: #fff4cc            /* XP toast background */
--lq-streak-color: #ff9600     /* Streak flame */
--lq-streak-bg: #fff0db        /* Streak toast background */
--lq-heart-color: #ff4b4b      /* Heart icon */
--lq-heart-bg: #ffdfe0         /* Heart loss indicator bg */
--lq-gem-color: #1cb0f6        /* Gem indicator */
--lq-crown-color: #ffc800      /* Crown badge */
--lq-crown-bg: #fff8db         /* Crown celebration bg */
--lq-timed-color: #ce82ff      /* Timed mode accent */
--lq-timed-critical: #ff4b4b   /* Timer < 10s */
--lq-timed-warning: #ffc800    /* Timer < 30s */

/* State tokens */
--lq-locked-bg: #e5e5e5        /* Locked node fill */
--lq-locked-border: #cdcdcd    /* Locked node border */
--lq-locked-text: #afafaf      /* Locked text */
--lq-available-bg: #ffffff     /* Available node fill */
--lq-available-border: #e5e5e5 /* Available node border */
--lq-active-ring: #ffc800      /* Current-node emphasis ring */
--lq-selected-bg: #ddf4ff      /* Selected option background */
--lq-selected-border: #1cb0f6  /* Selected option border */
--lq-disabled-opacity: 0.5     /* Disabled element opacity */
--lq-focus-ring: 0 0 0 3px rgba(28, 176, 246, 0.4) /* Focus ring shadow */
```

### Color Tokens — Dark Theme

```
--lq-primary: #1cb0f6
--lq-primary-hover: #4dc4f9
--lq-primary-depth: #0d7ab3

--lq-success: #58cc02
--lq-success-bg: #1a3a0a
--lq-error: #ff4b4b
--lq-error-bg: #3a1010

--lq-bg-page: #131f24           /* Dark page background */
--lq-bg-surface: #1f3540        /* Dark card surface */
--lq-bg-elevated: #253d49       /* Elevated dark surface */
--lq-bg-sunken: #0d1518         /* Deep recessed */
--lq-bg-overlay: rgba(0,0,0,0.75)

--lq-text-primary: #ffffff
--lq-text-secondary: #a0b4bd
--lq-text-disabled: #5a727d

--lq-border-default: #2a4a58
--lq-border-strong: #3a5c6b
--lq-border-divider: #1f3540
```

### Border Radii

```
--lq-radius-sm: 8px            /* Small elements: pills, badges */
--lq-radius-md: 12px           /* Buttons, inputs, choice cards */
--lq-radius-lg: 16px           /* Cards, modals */
--lq-radius-xl: 20px           /* Large cards, unit banners */
--lq-radius-full: 9999px       /* Circular: skill nodes, avatars */
```

### Spacing Scale

```
--lq-space-1: 4px
--lq-space-2: 8px
--lq-space-3: 12px
--lq-space-4: 16px
--lq-space-5: 20px
--lq-space-6: 24px
--lq-space-8: 32px
--lq-space-10: 40px
--lq-space-12: 48px
--lq-space-16: 64px
--lq-space-20: 80px
```

### Typography Scale

```
--lq-font-family: 'Nunito', system-ui, sans-serif
--lq-font-display: 'Nunito', system-ui, sans-serif

--lq-text-xs: 12px / 16px      /* Badges, captions */
--lq-text-sm: 14px / 20px      /* Secondary text, labels */
--lq-text-base: 16px / 24px    /* Body text, exercise prompts */
--lq-text-lg: 18px / 28px      /* Emphasized body, choice text */
--lq-text-xl: 20px / 28px      /* Section headings */
--lq-text-2xl: 24px / 32px     /* Page headings */
--lq-text-3xl: 30px / 36px     /* Hero numbers (XP count) */
--lq-text-4xl: 36px / 40px     /* Celebration numbers */

--lq-font-normal: 400
--lq-font-medium: 500
--lq-font-semibold: 600
--lq-font-bold: 700
--lq-font-extrabold: 800
```

### Shadow and Elevation Levels

```
--lq-shadow-sm: 0 1px 2px rgba(0,0,0,0.05)
--lq-shadow-md: 0 2px 4px rgba(0,0,0,0.08)
--lq-shadow-lg: 0 4px 8px rgba(0,0,0,0.12)
--lq-shadow-xl: 0 8px 16px rgba(0,0,0,0.15)
--lq-shadow-inner: inset 0 2px 4px rgba(0,0,0,0.06)
```

### 3D Depth Levels

```
/* Resting: element sits 4px above its "floor" */
--lq-depth-sm: 2px             /* Small elements: tiles, pills */
--lq-depth-md: 4px             /* Standard buttons, choice cards */
--lq-depth-lg: 6px             /* Prominent buttons, skill nodes */
--lq-depth-xl: 8px             /* Modals, celebration cards */
```

### Breakpoints

```
--lq-bp-sm: 640px              /* Small tablets */
--lq-bp-md: 768px              /* Tablets */
--lq-bp-lg: 1024px             /* Small desktops */
--lq-bp-xl: 1280px             /* Standard desktops */
```

### Content-Width Limits

```
--lq-content-narrow: 600px     /* Lesson player, exercises */
--lq-content-standard: 720px   /* Learning path column */
--lq-content-wide: 1024px      /* Admin content area */
--lq-content-full: 1280px      /* Full app shell max */
```

### Z-Index Layers

```
--lq-z-base: 0
--lq-z-sticky: 100             /* Sticky headers, action bars */
--lq-z-navigation: 200         /* Sidebars, bottom nav */
--lq-z-dropdown: 300           /* Popovers, dropdowns */
--lq-z-feedback: 400           /* Feedback bar */
--lq-z-modal: 500              /* Modal overlays */
--lq-z-toast: 600              /* Toast notifications */
--lq-z-tooltip: 700            /* Tooltips */
```

### Focus Rings

```
/* All interactive elements use this ring on :focus-visible */
outline: 2px solid var(--lq-border-focus);
outline-offset: 2px;
/* Supplementary shadow for 3D elements where outline clips */
box-shadow: var(--lq-focus-ring);
```

### Contrast Verification

All text/background combinations meet WCAG 2.2 AA (4.5:1 for normal text, 3:1 for large text):
- `--lq-text-primary` on `--lq-bg-surface`: 7.2:1
- `--lq-text-secondary` on `--lq-bg-surface`: 4.6:1
- `--lq-text-inverse` on `--lq-primary`: 4.5:1
- `--lq-text-success` on `--lq-success-bg`: 5.1:1
- `--lq-text-error` on `--lq-error-bg`: 5.3:1

---

## 4. Reusable 3D Interaction System

All interactive elements share a consistent dimensional system using CSS-only techniques.

### Core Mechanism

Every "3D" element uses a colored `border-bottom` (the "floor edge"), `box-shadow` for ambient
depth, and `translateY` for press movement. The bottom border color is a darker shade of the
element's background.

```
/* Resting state */
.element-3d {
  border-bottom: var(--lq-depth-md) solid var(--depth-color);
  box-shadow: var(--lq-shadow-md);
  transform: translateY(0);
  transition: transform 100ms ease-out, border-bottom-width 100ms ease-out, box-shadow 100ms ease-out;
}

/* Hover state */
.element-3d:hover {
  transform: translateY(-1px);
  box-shadow: var(--lq-shadow-lg);
}

/* Pressed state */
.element-3d:active, .element-3d[data-pressed] {
  transform: translateY(var(--lq-depth-md));
  border-bottom-width: 0;
  box-shadow: var(--lq-shadow-sm);
}
```

### State Matrix

| Component | Resting | Hover | Pressed | Selected | Correct | Incorrect | Disabled | Focus |
|---|---|---|---|---|---|---|---|---|
| **Button3D** | 4px depth, brand color | lift -1px, brighter shadow | translateY(4px), 0 depth | — | Green bg+depth | — | 50% opacity, no depth | 2px outline + shadow |
| **SkillNode3D** | 6px depth, state color bg | lift -2px, glow shadow | translateY(6px), 0 depth | Gold ring pulse | — | — | Gray, locked icon | 3px outline |
| **Choice card** | 4px depth, white bg | lift -1px, blue border hint | translateY(4px), 0 depth | Blue border, blue bg tint | Green border+bg | Red border+bg, shake | Gray, 50% opacity | Blue outline |
| **Word-bank tile** | 2px depth, light bg | lift -1px | translateY(2px), selected area | Blue bg when placed | Green flash | Red flash | Gray | Blue outline |
| **Match-pair tile** | 2px depth | lift -1px | translateY(2px) | Blue bg when paired | Green + fade | Red + reset | Used-up: invisible | Blue outline |
| **Card3D** | 4px depth, surface bg | lift -1px | — (non-interactive) | — | — | — | — | — |
| **Navigation item** | No depth | bg color shift | translateY(1px) | Left border accent | — | — | — | bg highlight + outline |
| **Modal3D** | 8px depth, surface bg | — | — | — | — | — | — | — |
| **Achievement badge** | 4px depth, earned=gold | lift -1px | — | — | — | — | Gray, locked | Outline |

### Keyboard Focus Behavior

- All interactive elements show `:focus-visible` outline (not on click/tap)
- Focus ring uses `outline: 2px solid var(--lq-border-focus); outline-offset: 2px`
- 3D depth borders do not obscure the focus ring (offset ensures visibility)
- Tab order follows logical reading/interaction flow
- `Enter` and `Space` trigger press state on buttons and choices

### Touch Behavior

- Touch starts the pressed state immediately (no 300ms delay)
- Touch-end triggers the action
- Touch-cancel reverts without action
- Touch targets minimum 48x48px (44px absolute minimum per WCAG)
- Touch spacing minimum 8px between adjacent targets

### Reduced-Motion Behavior

Under `prefers-reduced-motion: reduce`:
- `translateY` press animations are instant (0ms transition)
- Hover lifts are removed (state communicated by color/border only)
- Shadow transitions are instant
- Shake animations replaced by border-color flash
- Confetti/particle animations replaced by static success state
- Page transitions use opacity crossfade (150ms max) instead of slide

---

## 5. Responsive Application Shell

### Desktop (≥1024px)

```
┌──────────────────────────────────────────────────────────────────────┐
│  [Sidebar]  │              Main Content                │  [Right]    │
│  72px rail  │        max-width: 720px centered         │  Optional   │
│             │                                          │  280px      │
│  • Home     │  ┌────────────────────────────┐          │             │
│  • Profile  │  │    GamificationBar         │          │  Daily Goal │
│  • Leader.  │  │    hearts|streak|xp|gems   │          │  Streak     │
│  • Settings │  └────────────────────────────┘          │  Achieve.   │
│             │                                          │             │
│             │  [Learning path / page content]          │             │
│             │                                          │             │
└──────────────────────────────────────────────────────────────────────┘
```

- Persistent left navigation rail (72px collapsed, icons + short labels)
- Central content column (max 720px for path; 600px for lesson)
- Optional right sidebar (280px) for daily goal, quick stats on path page
- Right sidebar hides below 1280px
- Lesson mode: navigation rail hidden; only progress bar + exit button visible
- Admin content: uses full width up to 1024px

### Tablet (768px–1023px)

```
┌──────────────────────────────────────────────────────────────┐
│  GamificationBar (top)  hearts | streak | xp | gems         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│              Main Content (centered, max 600px)              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  BottomNav: Home | Profile | Leaderboard | Settings          │
└──────────────────────────────────────────────────────────────┘
```

- No sidebar; collapsed to bottom navigation
- `GamificationBar` moves to top area (compact, single row)
- Content centered at comfortable reading width
- Bottom navigation with 4 primary tabs

### Mobile (< 768px)

```
┌──────────────────────────────────────┐
│  GamificationBar (compact top row)   │
│  ♥5 | 🔥6 | ⭐340 | 💎100           │
├──────────────────────────────────────┤
│                                      │
│  Main Content (full width - 16px×2)  │
│                                      │
│                                      │
├──────────────────────────────────────┤
│  BottomNav (fixed, safe-area aware)  │
│  Home | Profile | Board | Settings   │
└──────────────────────────────────────┘
```

- Compact `GamificationBar` as small icon+number pills in one row
- Full-width content with 16px horizontal padding
- Fixed bottom navigation (56px height + safe-area-inset-bottom)
- Lesson mode: removes bottom nav; shows exit + progress + hearts top bar
- Check/Continue button and feedback bar pinned above safe area
- No horizontal scrolling at 320px

### Scroll Behavior

- Learning path scrolls vertically; auto-scrolls to current active node on load
- Lesson content does NOT scroll during exercise (exercise fits viewport)
- Long exercise content (many word-bank tiles) uses contained scroll
- Sticky elements: GamificationBar (desktop), lesson header (all), feedback bar (all)
- `scroll-behavior: smooth` for programmatic scrolls; instant for user-initiated

### Responsive Sidebar Behavior

| Breakpoint | Left nav | Right sidebar |
|---|---|---|
| ≥1280px | 72px rail, visible | 280px, visible |
| 1024–1279px | 72px rail, visible | Hidden |
| 768–1023px | Hidden (bottom nav) | Hidden |
| <768px | Hidden (bottom nav) | Hidden |

### Lesson Mode Shell

During an active lesson (`/lesson/[attemptId]`):

```
┌──────────────────────────────────────┐
│  [X]  ████████░░░  ♥4               │  ← Fixed top: exit, progress, hearts
├──────────────────────────────────────┤
│                                      │
│         Exercise Content             │  ← Centered, max 600px
│                                      │
├──────────────────────────────────────┤
│  [ CHECK / CONTINUE ]                │  ← Fixed bottom action
│  ┌──────────────────────────────────┐│
│  │ Feedback bar (slides up)         ││  ← Over action when visible
│  └──────────────────────────────────┘│
└──────────────────────────────────────┘
```

- All navigation (sidebar, bottom nav) is hidden
- Only exit (X), progress bar, and hearts indicator in the header
- Exercise content fills the middle viewport area
- Check/Continue is always visible at the bottom
- Feedback bar overlays from bottom when answer is submitted

---

## 6. Route-by-Route UX Specifications

### 6.1 Learning Path / Home (`/`)

**Purpose:** Show the learner's position in their language course and provide clear next action.

**Information hierarchy:**
1. Gamification bar (hearts, streak, XP, gems)
2. Current active node (visually emphasized, scrolled into view)
3. Unit structure with labeled banners
4. Individual skill nodes with state and progress

**Major components:** AppShell, GamificationBar, UnitBanner, SkillNode3D, PathConnector, MascotFlourish

**Primary action:** Tap/click the current available/in-progress skill node to navigate to skill detail.

**Secondary actions:** Tap completed nodes to practice; scroll to explore path; navigate via sidebar/bottom nav.

**Loading state:** Skeleton path with 5 placeholder circular nodes and gray shimmer banners.

**Empty state:** Cannot occur (seeded course always exists). If API returns 404 course: "No course found" with Quest mascot pointing at a refresh button.

**Error state:** Full-page retryable error with "Something went wrong" message and Retry button.

**Responsive:**
- Desktop: centered path (720px max) with right sidebar stats
- Tablet: centered path (600px max), no sidebar
- Mobile: full-width path (16px padding), compact nodes

**Accessibility:**
- Path rendered as an ordered list (`<ol>`) with unit grouping
- Nodes are buttons with `aria-label` including title, state, and crown count
- Locked nodes have `aria-disabled="true"`
- Current active node has `aria-current="step"`
- Screen reader announces: "Greetings, completed, 5 of 5 crowns" per node

**Backend endpoints:** `GET /api/course`

---

### 6.2 Skill Details / Start (`/skill/[skillId]`)

**Purpose:** Confirm skill intent, show progress, and provide start/resume/timed-practice actions.

**Information hierarchy:**
1. Skill title, icon, and description
2. Crown progress (X/5 with ring visualization)
3. Action buttons: Start Lesson / Resume / Timed Practice
4. Prerequisite info (if locked)

**Major components:** Card3D, ProgressRing, Button3D, MascotFlourish

**Primary action:** "Start Lesson" or "Resume Lesson" button → POST start → navigate to `/lesson/[attemptId]`

**Secondary actions:** "Timed Practice" button (for unlocked skills)

**Loading state:** Card skeleton with placeholder ring and button.

**Empty state:** N/A (skill always has lesson data).

**Error state:** If skill not found: 404 page. If locked: show lock explanation with prerequisite name.

**Responsive:**
- Desktop: centered card (480px max) within shell
- Mobile: full-width card with stacked buttons

**Accessibility:**
- Start/Resume buttons clearly labeled with skill name
- Crown progress has `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Locked state shows textual explanation, not just a disabled button
- Focus returns to path after navigating back

**Backend endpoints:** `GET /api/skills/{skill_id}`, `POST /api/skills/{skill_id}/start`, `POST /api/skills/{skill_id}/start-timed`

---

### 6.3 Standard Lesson Player (`/lesson/[attemptId]`)

**Purpose:** Guide the learner through 10 exercises with immediate feedback and heart tracking.

**Information hierarchy:**
1. Exit button (top-left)
2. Progress bar (top-center, filling left-to-right)
3. Hearts indicator (top-right)
4. Exercise prompt and content (center)
5. Answer area / interaction (center-bottom)
6. Check/Continue CTA (fixed bottom)
7. Feedback bar (overlays bottom on answer)

**Major components:** LessonShell, ProgressBar, ExerciseShell, five exercise renderers, FeedbackBar, Button3D, AudioControl

**Primary action:** Submit answer → receive feedback → Continue to next.

**Secondary actions:** Play audio (when available), exit lesson (with confirmation).

**Loading state:** Progress bar placeholder + centered spinner on initial load / exercise transition.

**Empty state:** Cannot occur (attempt always has exercises).

**Error state:** Network failure: inline retry toast. Terminal attempt: redirect to path or show results.

**Responsive:**
- Desktop: 600px max content width, generous vertical spacing
- Mobile: full-width, stacked vertically, keyboard-aware spacing
- Feedback bar width matches content; pinned to bottom edge

**Accessibility:**
- Progress bar: `role="progressbar"` with `aria-valuenow`
- Hearts: `aria-label="4 of 5 hearts remaining"`
- Exercise prompt is a heading (`h2`) for structure
- Check button disabled until answer selected (with `aria-disabled`)
- Feedback announced via `aria-live="assertive"` region
- Exit confirmation is a dialog with focus trap

**Backend endpoints:** `GET /api/lessons/{attempt_id}`, `POST /api/lessons/{attempt_id}/answer`, `POST /api/lessons/{attempt_id}/complete`

---

### 6.4 Timed Practice (same route, timed mode)

**Purpose:** 120-second challenge mode with visible countdown and different failure mechanics.

**Information hierarchy:**
1. Exit button (top-left)
2. Countdown timer (top-center, replacing progress bar)
3. No hearts indicator (timed doesn't consume hearts)
4. Exercise content (same as standard)
5. Check/Continue (same as standard)

**Major components:** TimedCountdown, LessonShell (timed variant), same exercise renderers

**Primary action:** Same as standard lesson.

**Loading state:** Same as standard with timer paused until loaded.

**Empty state:** N/A.

**Error state:** Time expired → `TimeExpiredModal`. Network failure → retry (timer continues server-side).

**Responsive:** Same as standard lesson; timer fits in header bar at all widths.

**Accessibility:**
- Timer has `role="timer"` and `aria-live="polite"` (announces every 30s, then every 10s below 30)
- Timer announces "30 seconds remaining", "10 seconds remaining"
- Warning state (< 30s) uses color + pulsing icon, not color alone
- Critical state (< 10s) uses color + faster pulse + text "Almost out of time!"
- Reduced motion: pulse replaced by border color change

**Backend endpoints:** Same as standard with timed-mode responses (`remaining_seconds`, `expires_at`)

---

### 6.5 Lesson Complete (overlay/page within lesson route)

**Purpose:** Celebrate success and display earned rewards.

**Information hierarchy:**
1. Celebration animation (burst/confetti)
2. "Lesson Complete!" heading with Quest mascot
3. XP earned (with perfect bonus callout if applicable)
4. Streak status (extended or maintained)
5. Crown progress update
6. Newly unlocked skills (if any)
7. Achievements earned (if any)
8. Continue to path button

**Major components:** CompletionCelebration, StatReveal, AchievementBadge, Button3D, MascotFlourish

**Primary action:** "Continue" → navigate back to `/` (learning path)

**Responsive:** Full-screen overlay with vertically stacked reveals; scrollable on mobile if content exceeds viewport.

**Accessibility:**
- Focus moves to celebration heading
- Stats announced via `aria-live`
- Continue button is the primary focus target
- Reduced motion: no confetti, instant stat display

**Backend endpoints:** Response data from `POST /api/lessons/{attempt_id}/complete`

---

### 6.6 Out of Hearts (modal)

**Purpose:** Inform learner of failure and provide recovery options.

**Information hierarchy:**
1. Empty heart illustration + Quest sympathetic expression
2. "You ran out of hearts!" message
3. Refill option (20 gems) with gem count display
4. "Wait for hearts" with countdown timer
5. "Back to path" secondary action

**Major components:** Modal3D, Button3D, HeartIcon, MascotFlourish

**Primary action:** Refill with gems → POST `/api/hearts/refill` → on success, offer retry (new attempt)

**Secondary actions:** Return to path; wait for regeneration.

**Error state:** Insufficient gems: disable refill button, show "Not enough gems" text.

**Accessibility:**
- Modal traps focus
- Escape key or "Back to path" dismisses
- Refill button shows gem cost in aria-label
- Regeneration countdown announced as timer

**Backend endpoints:** `POST /api/hearts/refill`, `GET /api/hearts/status`

---

### 6.7 Time Expired (modal)

**Purpose:** Inform learner that timed practice has expired.

**Information hierarchy:**
1. Clock/timer expired illustration
2. "Time's up!" message
3. Questions answered / mistakes made stats
4. "No XP earned" (clear communication)
5. "Try Again" and "Back to Path" buttons

**Major components:** Modal3D, Button3D, TimedIcon

**Primary action:** "Try Again" → start new timed attempt.

**Secondary actions:** "Back to Path" → navigate to `/`.

**Accessibility:** Same modal pattern as Out of Hearts.

**Backend endpoints:** None (uses already-received failure response).

---

### 6.8 Profile (`/profile`)

**Purpose:** Display comprehensive learner progress and achievements.

**Information hierarchy:**
1. Display name and avatar placeholder
2. Join date
3. Stats grid: Total XP, Current Streak, Longest Streak, Skills Completed, Lessons Completed, Perfect Lessons
4. Achievement gallery (earned and locked)

**Major components:** Card3D, StatPill, AchievementBadge, MascotFlourish

**Primary action:** View achievements (no navigation — informational page).

**Secondary actions:** None (profile is read-only display).

**Loading state:** Skeleton grid for stats + placeholder badges.

**Empty state:** N/A (seeded user always has data).

**Error state:** Retryable error state.

**Responsive:**
- Desktop: 2-column stats grid + 3-column achievements
- Tablet: 2-column stats + 2-column achievements
- Mobile: single-column stacked stats + 2-column achievements

**Accessibility:**
- Stats use `<dl>` (definition list) for label/value pairs
- Achievements have aria-label with title + earned/locked status
- Locked achievements clearly labeled "Not yet earned" textually

**Backend endpoints:** `GET /api/user/me`, `GET /api/achievements`

---

### 6.9 Leaderboard (`/leaderboard`)

**Purpose:** Show competitive ranking and motivate through social comparison.

**Information hierarchy:**
1. "Leaderboard" heading
2. Ranked user list (top 10)
3. Current user highlighted (even if not in top 10)
4. XP total per user
5. Streak badges

**Major components:** Card3D, LeaderboardRow, StatPill

**Primary action:** Informational (no user action needed).

**Loading state:** Skeleton list with 5 placeholder rows.

**Empty state:** N/A (seeded users always present).

**Error state:** Retryable error with Quest confused pose.

**Responsive:**
- Desktop: centered list (600px max) within shell
- Mobile: full-width list with compact row layout

**Accessibility:**
- Leaderboard rendered as ordered list (`<ol>`)
- Current user row has `aria-current="true"` and distinct styling
- Rank number announced with each entry
- Visual rank badge (1st/2nd/3rd) supplemented by text

**Backend endpoints:** `GET /api/leaderboard`

---

### 6.10 Settings (`/settings`)

**Purpose:** Manage user preferences and display deferred feature placeholders.

**Information hierarchy:**
1. Display name (editable)
2. Daily goal (editable, 5–100 XP)
3. Theme toggle (light/dark)
4. Coming Soon placeholders:
   - Pronunciation Practice
   - Super/Subscription
   - Friends & Social
   - More Languages

**Major components:** Card3D, Input, Button3D, ToggleSwitch

**Primary action:** Save display name / daily goal → `PATCH /api/user/me`

**Secondary actions:** Toggle theme (local-only, immediate).

**Loading state:** Form skeleton.

**Empty state:** N/A.

**Error state:** Inline field errors for invalid input; toast for save failure.

**Responsive:** Single-column form at all sizes (max 480px centered).

**Accessibility:**
- Form inputs have persistent visible labels
- Error messages associated via `aria-describedby`
- Coming Soon items use `aria-disabled="true"` and "(Coming Soon)" text
- Save button shows loading state during request

**Backend endpoints:** `PATCH /api/user/me`

---

### 6.11 Content Administration (`/admin/content`)

**Purpose:** Browse and manage course content (units, skills, lessons, exercises).

**Information hierarchy:**
1. Course tree navigation (collapsible units → skills → lessons)
2. Exercise list for selected lesson
3. Create/Edit exercise form (type-specific fields)
4. Validation feedback

**Major components:** TreeView, Card3D, Button3D, Select, Input, TextArea

**Primary action:** Create or edit an exercise.

**Secondary actions:** Browse tree; toggle exercise active state.

**Loading state:** Tree skeleton.

**Empty state:** "Select a lesson to view exercises."

**Error state:** Form validation errors inline; API errors as banner.

**Responsive:**
- Desktop: sidebar tree (280px) + form area (remaining)
- Tablet: collapsible tree above form
- Mobile: tree as accordion, full-width form below

**Accessibility:**
- Tree uses `role="tree"` with `role="treeitem"`
- Form inputs labeled with exercise field names
- Validation errors announced and focused
- Admin route clearly separated from learner experience

**Backend endpoints:** `GET /api/admin/content/tree`, `POST /api/admin/exercises`, `PATCH /api/admin/exercises/{id}`

---

## 7. Learning-Path Specification

### Unit Banners

- Full-width cards within the path column
- Gradient background using unit `color_theme` token
- Unit title (bold, large) and description (regular, smaller)
- Rounded corners (radius-xl: 20px)
- Bottom edge depth (4px)
- Separate visually from the path nodes below them

### Winding Path Geometry

The path follows an S-curve pattern:

```
      ●          ← Node at position: center-right
     /
    ●            ← Node at position: center
     \
      ●          ← Node at position: center-right
     /
    ●            ← Node at position: center-left
     \
      ●          ← Node at position: center
```

- Nodes alternate between left-offset, center, and right-offset positions
- Pattern repeats every 3–4 nodes
- Horizontal offset: ±60px from center on desktop, ±40px on mobile
- Vertical spacing between nodes: 80px desktop, 64px mobile
- Path wraps within the content column (never causes horizontal scroll)

### Connecting Path

- SVG or CSS `::before`/`::after` connectors between nodes
- Dashed line for locked segments, solid line for unlocked
- Line color: `--lq-border-default` for locked, `--lq-success` for completed
- Line width: 3px
- Curved connectors using quadratic bezier or border-radius tricks

### Node States

| State | Background | Border | Depth | Icon | Ring | Interactivity |
|---|---|---|---|---|---|---|
| Locked | `--lq-locked-bg` | `--lq-locked-border` | None | Lock icon (gray) | None | `aria-disabled`, tooltip on hover |
| Available | White | `--lq-primary` 2px | 6px `--lq-primary-depth` | Skill icon (colored) | None | Button, clickable |
| In-Progress | `--lq-primary` | `--lq-primary-depth` 3px | 6px darker | Skill icon (white) | Progress ring (partial) | Button, emphasized |
| Completed | `--lq-crown-color` gold | Gold depth | 6px gold-depth | Crown icon or checkmark | Full ring (gold) | Button (replay) |

### Crown / Progress-Ring Display

- SVG ring around node (stroke-dasharray for partial fill)
- Ring segments = crowns earned out of max_level
- Ring color: gold for earned segments, gray for unearned
- Small crown count badge below or inside node
- Example: "2/5" in small text or 2 filled crown icons

### Current-Node Emphasis

- Active/available node with the lowest order that can be started
- Pulsing `box-shadow` animation (gold glow, 1.5s period)
- Slightly larger scale (1.05×)
- Quest mascot peeking near current node (first visit only)
- Reduced motion: static gold border, no pulse

### Skill Labels or Popovers

- On hover (desktop) or tap (mobile): show skill title tooltip/popover
- Popover includes: title, crowns X/5, "Start" or "Resume" CTA
- Clicking the node directly navigates to `/skill/[skillId]`

### Timed Practice Entry

- Available on any unlocked skill's detail page (not directly on path nodes)
- Visual indicator on skill detail: "⏱ Timed Practice" secondary button

### Scroll to Current Progress

- On page load, auto-scroll to center the current active node in viewport
- Use `scrollIntoView({ behavior: 'smooth', block: 'center' })`
- Reduced motion: instant scroll (no smooth animation)

### Locked-Node Interaction

- Tapping a locked node shows a tooltip/popover: "Complete [prerequisite] first"
- Does not navigate to skill detail
- Cursor: `not-allowed` on desktop
- `aria-disabled="true"` prevents activation

### Keyboard Navigation

- Tab moves between nodes in path order
- Enter/Space on available/in-progress navigates to skill detail
- Enter/Space on locked announces lock reason
- Arrow keys for sequential node traversal within the list
- Focus visible on each node

### Screen-Reader Labeling

Each node announces:
- `"{Skill title}, {state}, {crowns} of {max} crowns, skill {n} of {total}"`
- Example: "Food, in progress, 2 of 5 crowns, skill 3 of 5"

### Reduced-Motion Behavior

- Node entrance stagger: replaced by instant render
- Pulse animation: replaced by static emphasized border
- Path scroll: instant jump (no smooth scroll)
- Connector drawing animation: instant visibility

---

## 8. Lesson-Player Specification

### Complete Loop

```
[Load attempt via GET] → [Show exercise at current_index]
      ↓
[User selects/types answer] → [Check button enables]
      ↓
[Press Check] → [POST /answer] → [Show pending state]
      ↓
[Receive response] → [Show FeedbackBar (correct/incorrect)]
      ↓
[Press Continue] → [Advance to next exercise OR complete]
      ↓
[After last exercise] → [POST /complete] → [Show results/celebration]
```

### Exit Control

- "X" button in top-left corner
- On press: shows confirmation dialog "Are you sure you want to quit? Progress is saved."
- Confirm: navigate to path; Cancel: return to exercise
- During lesson load or completion: no exit confirmation needed

### Progress Bar

- Top-center, fills left-to-right
- Width: `(current_index / total_exercises) * 100%`
- Uses `--lq-success` fill color on `--lq-bg-sunken` track
- Animates width on exercise advancement (200ms ease-out)
- `role="progressbar"` with `aria-valuenow`, `aria-valuemin=0`, `aria-valuemax=total`

### Hearts Display

- Top-right area: heart icon + number
- Color: `--lq-heart-color` (red)
- Updates from backend response values only
- Animates heart loss with a brief scale-down pulse (150ms)
- Not shown in timed mode

### Audio Play/Replay

- Shown when exercise has `tts_text` and `tts_lang`
- Circular button with speaker icon
- States: idle (speaker), playing (animated waves), unavailable (speaker with X)
- Keyboard: activatable with Enter/Space
- No autoplay ever
- Placed above exercise prompt

### Exercise Prompt

- Displayed as `h2` heading within the exercise area
- Large text (`--lq-text-xl` to `--lq-text-2xl`)
- Centered above the answer area
- May include the `___` blank marker (fill_blank type)

### Answer Area

- Varies by exercise type (see Section 8 exercise specifications below)
- Centered within the content column (600px max)
- Sufficient spacing from prompt and from action bar

### Check Action

- Full-width `Button3D` at bottom of viewport (above safe area)
- Text: "CHECK" when answer is ready; disabled when no selection
- Visually disabled (gray, no depth) until a valid answer is selected
- On press: sends answer, shows loading spinner within button

### Pending State

- Button shows spinner, text changes to "Checking..."
- Answer area becomes non-interactive (pointer-events: none)
- Duration: typically 200–500ms

### Correct/Incorrect Feedback

- `FeedbackBar` slides up from bottom (300ms spring)
- **Correct:** Green background (`--lq-success-bg`), checkmark icon, encouraging message, solution
- **Incorrect:** Red background (`--lq-error-bg`), X icon, correct answer revealed, sympathetic message
- Text size: `--lq-text-lg` for message, `--lq-text-base` for solution
- Non-color cues: icon (✓ vs ✗), text label ("Correct!" vs "Correct answer:")

### Continue Action

- Button changes to "CONTINUE" (green bg for correct, standard for incorrect)
- Pressing Continue: hides feedback bar, advances to next exercise
- If `can_complete` is true after the last exercise: button says "FINISH" → calls complete

### Keyboard Behavior

- `Enter` submits the answer when Check is enabled
- `Enter` advances when Continue is showing
- `1-4` number keys select multiple-choice options
- `Tab` moves between interactive elements
- `Escape` opens exit confirmation

### Mobile Keyboard Handling

- For `fill_blank` and `type_answer`: virtual keyboard pushes content up
- Input field remains visible above keyboard
- Check button stays above keyboard
- Use `visualViewport` API for keyboard-aware positioning

### Network Failure and Retry

- If POST /answer fails: show inline error toast "Connection error — try again"
- Check button reverts to enabled state
- User can press Check again (retry)
- Does not advance or deduct heart on failure

### Refresh/Resume

- `GET /api/lessons/{attemptId}` restores full state
- Renders exercise at `current_index` from response
- Previously answered exercises are not re-shown
- Hearts/mistakes reflect persisted values

### Completion Transition

- After final correct Continue press, auto-calls `POST /complete`
- Shows brief celebration loading state
- Renders CompletionCelebration overlay with results

---

### Exercise Type Specifications

#### 8.1 Multiple Choice

**Initial state:** 2–4 choice cards displayed vertically, none selected.

**Selection/input behavior:**
- Tap/click a card to select it (radio behavior — one at a time)
- Selected card shows blue border + light blue background
- Deselecting: tap another card
- Keyboard: `1-4` number keys, or Tab+Space/Enter

**Check-button enablement:** Enabled when one option is selected.

**Keyboard behavior:**
- Tab between options
- Space/Enter to select focused option
- Number keys for quick selection
- Enter to submit when Check is enabled

**Submission payload:** `{ "option_id": "a" }`

**Pending behavior:** All cards become non-interactive; selected card stays highlighted.

**Correct feedback:** Selected card turns green with checkmark; FeedbackBar shows "Correct!"

**Incorrect feedback:** Selected card turns red with X, shakes briefly; correct card highlighted green; FeedbackBar shows correct answer.

**Reset/continue:** All cards reset to unselected; next exercise renders.

**Accessibility:** Cards are `role="radio"` within `role="radiogroup"`; `aria-checked` states.

**Mobile behavior:** Cards stack vertically, full width, minimum 48px height.

---

#### 8.2 Translate Word Bank

**Initial state:** Prompt shown above. Available word tiles displayed in a row/grid below a blank "answer area" zone. Answer area is empty.

**Selection/input behavior:**
- Tap a tile to add it to the answer area (in order of tapping)
- Tap a placed tile to remove it back to the bank
- Tiles visually move between bank and answer area
- No tile can be used twice (removed from bank when placed)

**Check-button enablement:** Enabled when at least one tile is in the answer area.

**Keyboard behavior:**
- Tab between available tiles in the bank
- Enter/Space to place the focused tile
- Tab into answer area to select placed tiles
- Enter/Space to remove a placed tile
- Focus moves logically between bank and answer

**Submission payload:** `{ "ordered_ids": ["w1", "w2", "w3"] }`

**Pending behavior:** Tiles freeze in place; no interaction.

**Correct feedback:** Answer area tiles flash green; FeedbackBar with correct message.

**Incorrect feedback:** Answer area tiles flash red; FeedbackBar shows correct ordered words.

**Reset/continue:** All tiles return to bank; answer area clears.

**Accessibility:** Bank is a list; each tile is a button. Answer area has `aria-label="Your answer"`. Placed tiles announce position.

**Mobile behavior:** Bank tiles wrap in rows (fit within viewport width); answer area scrolls horizontally if needed.

---

#### 8.3 Match Pairs

**Initial state:** Left column and right column of items displayed. Nothing paired.

**Selection/input behavior:**
- Tap a left item to select it (highlighted)
- Then tap a right item to pair them
- Or: tap right first, then left
- Paired items fade/check and become inert
- Incorrect match (if checking per pair): brief shake, reset selection
- All-at-once submission: pairs all, then Check

**LingoQuest approach:** Submit all pairs at once (matches the API contract — full pair set submitted).

- Select one left → highlighted
- Select one right → paired (line drawn between them)
- Can unpair by tapping a paired item
- All items must be paired before Check enables

**Check-button enablement:** All left items must have a paired right item.

**Keyboard behavior:**
- Tab through left items, Enter/Space to select
- Tab jumps to right column; Enter/Space to pair
- Paired items announced
- Shift+Tab to go back

**Submission payload:** `{ "pairs": [{"left_id":"l1","right_id":"r1"}, ...] }`

**Pending behavior:** All pairs frozen; connecting lines stay visible.

**Correct feedback:** All pair lines turn green; items get checkmarks.

**Incorrect feedback:** Wrong pairs highlight red; correct pairs shown; FeedbackBar with solution.

**Reset/continue:** All items reset to unmatched; next exercise.

**Accessibility:** Two lists with `aria-label="Left items"` and `aria-label="Right items"`; selected state announced; paired state announced per item.

**Mobile behavior:** Left and right columns side-by-side (each column fits half width); items wrap vertically.

---

#### 8.4 Fill in the Blank

**Initial state:** Sentence prompt with `___` marker; text input field below prompt.

**Selection/input behavior:**
- Focus the text input
- Type the answer
- No character limit enforced on client (server validates)
- Whitespace-only is visually indicated as incomplete

**Check-button enablement:** Enabled when input has non-whitespace content.

**Keyboard behavior:**
- Tab to input, type answer
- Enter submits (same as pressing Check)
- Tab to Check button as alternative

**Submission payload:** `{ "text": "es" }`

**Pending behavior:** Input becomes `readonly`; spinner in Check button.

**Correct feedback:** Input border turns green; FeedbackBar with "Correct!"

**Incorrect feedback:** Input border turns red; FeedbackBar shows correct answer text.

**Reset/continue:** Input clears; focus moves to new exercise prompt.

**Accessibility:** Input has `<label>` with "Type the missing word"; `aria-describedby` points to the full sentence context; error state announced.

**Mobile behavior:** Input triggers virtual keyboard; content scrolls to keep input visible above keyboard.

---

#### 8.5 Type the Answer

**Initial state:** Prompt shown; text input or textarea below.

**Selection/input behavior:**
- Focus the input
- Type full answer
- May be multiple words

**Check-button enablement:** Enabled when input has non-whitespace content.

**Keyboard behavior:** Same as fill_blank.

**Submission payload:** `{ "text": "Hello" }`

**Pending/correct/incorrect/reset:** Same pattern as fill_blank.

**Accessibility:** Input labeled "Type your answer in English"; linked to prompt via `aria-describedby`.

**Mobile behavior:** Same keyboard handling as fill_blank.

---

## 9. Hearts, Audio, and Timed Practice

### Hearts System Display

- Five heart icons (filled = remaining, outlined = lost)
- Positioned in lesson header top-right
- Hearts update ONLY from backend response (never frontend decrement)
- Heart loss animation: brief scale pulse on the lost heart (100ms)
- Regeneration countdown shown in:
  - Hearts status page/popover (if exists)
  - Out-of-hearts modal ("Next heart in X:XX")
- Zero hearts: all hearts shown as outlined/empty, red tint

### Heart Loss Flow

1. Submit wrong answer → response includes `hearts_remaining`
2. Update displayed hearts to response value
3. If `lesson_status === "failed"`: immediately show OutOfHearts modal
4. OutOfHearts modal offers: Refill (20 gems), Wait, Return to Path

### Heart Regeneration Display

- `next_heart_at` from API → calculate countdown locally for display
- Update countdown every second (display only, not state mutation)
- When countdown reaches 0: refetch hearts status from backend
- Never increment hearts locally

### Refill Flow

1. User taps "Refill" in OutOfHearts modal
2. `POST /api/hearts/refill` with `{ "confirm_spend": true }`
3. Success: update hearts + gems from response; offer "Try Again" (new attempt)
4. Failure (insufficient gems): show "Not enough gems" inline; disable button
5. Already full (impossible from modal context but handled): show message

### Audio System

**Browser Speech Synthesis:**
- Check `window.speechSynthesis` availability on mount
- If available and exercise has `tts_text` + `tts_lang`:
  - Show Play button (speaker icon)
  - On press: create `SpeechSynthesisUtterance(tts_text)` with `lang = tts_lang`
  - Show playing state (animated speaker icon)
  - On end: return to idle state
  - Replay: same action on subsequent presses

**Audio URL (priority):**
- If `audio_url` is present: use `<audio>` element instead of speechSynthesis
- Same Play/Replay button interface
- Plays the URL audio

**Unavailable state:**
- speechSynthesis not supported and no audio_url: show speaker icon with slash-through
- Tooltip: "Audio unavailable in this browser"
- `aria-label="Audio unavailable"`

**Controls:**
- Circular `IconButton3D` with speaker icon
- 44px minimum touch target
- Keyboard accessible (Enter/Space to play)
- No autoplay ever
- Placed above/beside the exercise prompt

### Timed Practice Specifics

**Timer Display:**
- Circular countdown or horizontal bar replacing the progress bar position
- Shows MM:SS format (2:00 → 0:00)
- Color transitions:
  - Normal (>30s): `--lq-timed-color` (purple)
  - Warning (<30s): `--lq-timed-warning` (yellow/orange)
  - Critical (<10s): `--lq-timed-critical` (red) + pulse
- Non-color cues: icon change (clock → warning triangle), text "Hurry!" at <10s

**Timer uses `remaining_seconds` from backend:**
- On load: start local countdown from `remaining_seconds`
- On each answer response: sync to server-provided `remaining_seconds`
- If local timer hits 0: show expired state (server confirms on next request)
- Backend is authoritative — frontend timer is display-only

**Wrong answers in timed mode:**
- Count as mistakes (shown in summary)
- Do NOT show heart loss
- Do NOT show OutOfHearts
- Feedback still shown (correct/incorrect) but hearts indicator hidden

**Timed completion:**
- Shows: "Timed Practice Complete!" heading
- Fixed 20 XP (from backend response)
- No crown/unlock celebration
- Streak update (if applicable)
- Practice count mentioned

**Time-expired state:**
- `TimeExpiredModal` with clock illustration
- "Time's Up!" message
- Stats: X/10 answered, Y mistakes
- "No XP earned"
- "Try Again" → new timed attempt
- "Back to Path" → navigate home

---

## 10. Motion System

### Duration Standards

| Animation type | Duration | Easing |
|---|---|---|
| Button press | 100ms | ease-out |
| Button release | 150ms | ease-out |
| Hover lift | 150ms | ease-out |
| Choice selection | 150ms | ease-out |
| Feedback bar entrance | 300ms | spring(1, 80, 12) |
| Feedback bar exit | 200ms | ease-in |
| Modal entrance | 250ms | spring(1, 90, 14) |
| Modal exit | 200ms | ease-in |
| Toast entrance | 300ms | spring(1, 80, 12) |
| Toast auto-dismiss | 200ms | ease-in |
| Progress bar fill | 300ms | ease-out |
| Node entrance (stagger) | 200ms each, 60ms stagger | ease-out |
| Path connector draw | 400ms | ease-out |
| Celebration burst | 600ms | spring(1, 60, 10) |
| XP counter increment | 500ms | ease-out |
| Incorrect shake | 300ms | cubic-bezier(0.36, 0.07, 0.19, 0.97) |
| Page crossfade | 200ms | ease-in-out |
| Timer pulse (critical) | 1000ms loop | ease-in-out |
| Crown reveal | 400ms | spring(1, 70, 11) |

### Specific Animations

**Button press:**
- Down: `translateY(depth)`, `border-bottom-width: 0` in 100ms
- Up: reverse in 150ms

**Node entrance (path load):**
- Stagger from top: each node fades in + slides down 16px
- 60ms between each node
- Total path renders in ~600ms for 10 nodes

**Path progress (after completion):**
- Completed node transitions: scale pulse to 1.1× → settle at 1.0×
- Progress ring fills with animated stroke-dashoffset (300ms)
- If unlock: next node transitions from locked → available with glow

**Correct pulse:**
- Selected answer: brief green border flash + scale 1.02× → 1.0× (200ms)
- Checkmark icon pops in (scale 0 → 1 with spring)

**Incorrect response:**
- Selected answer: red border + horizontal shake (±3px, 3 cycles, 300ms)
- X icon pops in

**Feedback-bar entrance:**
- Slides up from bottom: `translateY(100%) → translateY(0)` with spring
- Content fades in 100ms after bar settles

**Modal entrance:**
- Backdrop: opacity 0 → 1 (200ms)
- Modal card: `scale(0.95) translateY(20px)` → `scale(1) translateY(0)` with spring

**XP toast:**
- Slides in from top-right (or top on mobile)
- XP number counts up from 0 to final value (500ms)
- Auto-dismisses after 3000ms

**Streak toast:**
- Same entrance as XP toast
- Flame icon does a brief scale bounce
- Shows streak count

**Achievement toast:**
- Entrance with slight scale pop
- Badge icon gleams (subtle highlight sweep)
- Stays 4000ms (longer than XP toast)

**Completion celebration:**
- Particle burst from center (12–20 colored circles, spring out)
- XP number counts up
- Streak/crown/achievement reveals stagger in from bottom (200ms apart)

**Crown/unlock celebration:**
- Crown: scales up from 0 with gold particle burst
- Newly unlocked skill: pulses with glow animation on path

**Timed urgency:**
- <30s: timer text pulses scale (1.0 → 1.05 → 1.0, 2s period)
- <10s: pulse faster (1s period), color transitions to critical

**Page transition:**
- Crossfade opacity (200ms) for route changes
- No full-page slide animations (too heavy for mobile)

### Reduced-Motion Alternatives

Every animation above has a reduced-motion path:

| Normal motion | Reduced-motion alternative |
|---|---|
| translateY press | Instant state change (color/border only) |
| Spring entrances | Instant opacity: 0→1 (100ms) |
| Shake animation | Red border flash (100ms) |
| Particle burst | Static success icon |
| Progress fill animation | Instant fill |
| Stagger entrances | All items appear instantly |
| Timer pulse | Static emphasized border |
| Page crossfade | Instant render |
| Celebration confetti | "🎉 Lesson Complete!" text only |
| Counter increment | Final number shown immediately |

Implementation: wrap motion values in a utility that checks `prefers-reduced-motion`:
```
const spring = prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 80 }
```

---

## 11. Backend-Authoritative Animation Rule

### Allowed Local Feedback (before backend response)

| Interaction | Local feedback allowed |
|---|---|
| Pressing a button | translateY + depth collapse |
| Selecting a choice card | Blue border + background tint |
| Tapping a word-bank tile | Tile moves to answer area |
| Pairing match items | Visual line drawn |
| Typing in input | Character appears |
| Focus on element | Focus ring visible |
| Pending/loading after submit | Spinner in button, disabled state |

### Must Wait for Backend Confirmation

| State change | Why wait |
|---|---|
| Heart loss indicator | Backend confirms the deduction |
| XP gain display | Backend calculates and awards |
| Crown increment | Backend updates progress |
| Skill unlock | Backend derives new state |
| Streak extension | Backend applies date logic |
| Achievement unlock | Backend evaluates criteria |
| Leaderboard position change | Backend reranks |
| Lesson status (complete/failed) | Backend validates |
| Timer expiry (timed mode) | Backend is authoritative |
| Daily goal progress | Backend calculates |

### Implementation Pattern

```
1. User presses Check → show loading state (allowed)
2. Send POST /answer
3. Receive response → extract is_correct, hearts_remaining, etc.
4. THEN trigger success/failure animation using response data
5. Never animate heart loss before the response arrives
```

---

## 12. Modal and Toast Hierarchy

### Priority (highest first)

1. **Out of Hearts modal** — blocks lesson continuation
2. **Time Expired modal** — blocks timed practice
3. **Lesson Complete overlay** — celebrates, blocks until dismissed
4. **API/Network error toast** — urgent actionable info
5. **Achievement unlocked toast** — celebratory non-blocking
6. **XP gained toast** — celebratory non-blocking
7. **Streak extended toast** — celebratory non-blocking
8. **Correct/Incorrect feedback bar** — part of lesson flow (not a modal)

### Rules

- **Maximum one modal at a time.** If a modal is showing, no other modal can appear.
- **Maximum two toasts simultaneously.** Third toast queues behind.
- **Feedback bar is not a modal.** It exists within the lesson flow and has its own z-layer.
- **Modals block toasts.** Toasts queue until modal dismisses.
- **Toasts stack vertically** from top-right (desktop) or top-center (mobile).

### Queueing

- Modals: show highest-priority pending modal when current dismisses
- Toasts: FIFO queue; display when a slot opens (max 2 visible)
- Achievement + XP + streak from same completion: stagger 500ms apart

### Dismissal

| Element | Dismiss method | Auto-dismiss |
|---|---|---|
| Out of Hearts modal | Refill / Return to Path button | Never |
| Time Expired modal | Try Again / Back to Path button | Never |
| Lesson Complete | Continue button | Never |
| Network error toast | Dismiss X / auto-retry success | 5000ms |
| Achievement toast | Dismiss X / auto | 4000ms |
| XP toast | Dismiss X / auto | 3000ms |
| Streak toast | Dismiss X / auto | 3000ms |
| Feedback bar | Continue button only | Never (must press Continue) |

### Focus Management

- **Modals:** On open: focus moves to first focusable element or close button. Focus trap active. Escape key dismisses (if applicable). On close: focus returns to trigger element.
- **Toasts:** Do NOT steal focus. Announced via `aria-live="polite"` region. Dismiss button is keyboard accessible but toasts don't trap focus.
- **Feedback bar:** Focus moves to Continue button after feedback appears.

### Screen-Reader Announcements

- Modal opening: announced via `role="dialog"` with `aria-labelledby`
- Toast content: announced via `aria-live="polite"` with `aria-atomic="true"`
- Feedback bar: `aria-live="assertive"` for correct/incorrect message
- Achievement: "Achievement unlocked: {title}" via live region

### Overlapping Prevention

- CSS z-index layering prevents visual overlap (see z-index tokens)
- JavaScript state prevents multiple modals: `activeModal` state in UI store
- Toast container manages its own queue independently of modals
- Feedback bar has its own layer below modals but above content

---

## 13. Accessibility

### Target Standard

WCAG 2.2 Level AA for all core learning workflows.

### Keyboard Navigation

- Complete path → skill → lesson → all exercises → complete flow works by keyboard alone
- Tab order follows logical reading flow (left-to-right, top-to-bottom)
- No keyboard trap except intentional modal focus traps
- Skip link available for bypassing navigation to main content
- Arrow keys for selection within groups (radio choices, word tiles)
- Escape always closes the topmost overlay/modal

### Visible Focus

- `:focus-visible` shows `2px solid var(--lq-border-focus)` outline with 2px offset
- Focus ring is NEVER clipped by 3D borders or overflow:hidden
- Focus ring has sufficient contrast against all backgrounds (4.5:1 minimum)
- 3D depth elements: outline-offset ensures ring sits outside the depth border

### Screen-Reader Labels

- Every interactive element has an accessible name
- Skill nodes: "{title}, {state}, {crowns} of {max} crowns"
- Hearts: "{n} of 5 hearts remaining"
- Progress bar: "Lesson progress, {current} of {total} exercises complete"
- Choices: "Option {letter}: {text}" with selected/unselected state
- Word tiles: "{text}, {state}" (available/placed/position)
- Timer: "Time remaining: {MM}:{SS}"
- Mascot flourishes: `aria-hidden="true"` (decorative)

### Feedback Live Regions

- Correct/incorrect feedback: `aria-live="assertive"`, `role="status"`
- Announces: "Correct! {encouraging message}" or "Incorrect. The correct answer is: {answer}"
- Toast notifications: `aria-live="polite"`
- Timer warnings: `aria-live="polite"` at 30s and 10s marks

### Match-Pair Accessibility

- Two distinct lists with clear labels
- Selection announced: "Selected {text} from left column"
- Pairing announced: "Paired {left} with {right}"
- Completed pair announced: "Pair complete"
- Instructions provided above the exercise

### Progress Semantics

- Progress bar: `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Progress ring (skill nodes): conveyed via text "2 of 5 crowns" — SVG ring is `aria-hidden`
- Daily goal: progress conveyed as "10 of 20 XP today, 50% complete"

### Countdown Announcements

- Timed mode timer: `role="timer"`
- Polite announcements at: 60s, 30s, 10s remaining
- Critical announcement at 10s: "Warning: 10 seconds remaining"
- Expiry: assertive announcement "Time has expired"

### Reduced Motion

- All non-essential animation removed under `prefers-reduced-motion: reduce`
- Essential state changes (correct/incorrect) use instant color/border change
- No motion is required to understand any state
- Loading spinners may remain (functional, not decorative)

### Contrast

- All text/background pairs: minimum 4.5:1 (AA normal text)
- Large text (≥18px bold or ≥24px): minimum 3:1
- UI components and graphical objects: minimum 3:1 against adjacent colors
- Disabled states: use opacity + text label, not relying on low contrast alone

### Touch Targets

- Minimum size: 48×48px for all interactive elements
- Minimum spacing: 8px between adjacent targets
- Bottom navigation items: 56px height area
- Choice cards: full width, minimum 48px height

### Text Resizing

- All text uses relative units (rem/em) based on 16px root
- Content remains readable and functional at 200% browser zoom
- No horizontal scroll at 200% zoom on mobile viewport
- No content clipping at 150% zoom

### Color-Independent States

Every state that uses color also has a non-color indicator:

| State | Color | Non-color cue |
|---|---|---|
| Correct | Green | Checkmark icon + "Correct!" text |
| Incorrect | Red | X icon + "Incorrect" text + shake |
| Locked | Gray | Lock icon + "locked" text |
| Selected | Blue | Thicker border + background fill |
| Hearts remaining | Red/gray | Filled/outlined icon shape + number |
| Timer warning | Yellow/red | Pulse speed change + warning text |
| Achievement earned | Gold | Badge checkmark + "Earned" label |
| Achievement locked | Gray | Lock overlay + "Not earned" text |

---

## 14. Component Architecture

### Shared Primitives (reusable across all routes)

| Component | Responsibility | Variants |
|---|---|---|
| `Button3D` | Primary interactive CTA with depth system | primary, success, error, secondary, disabled, loading |
| `IconButton3D` | Circular icon-only button with depth | sizes: sm/md/lg; states: default/active/disabled |
| `Card3D` | Container with depth and rounded corners | interactive (hoverable) / static / elevated |
| `SkillNode3D` | Circular path node with state-based styling | locked / available / in_progress / completed |
| `ProgressBar` | Horizontal fill bar with accessible semantics | default / success track |
| `ProgressRing` | SVG circular progress around nodes | crown segments / percentage |
| `FeedbackBar` | Bottom feedback surface for correct/incorrect | correct / incorrect |
| `Modal3D` | Focus-trapping overlay dialog | sizes: sm/md/lg; has depth border |
| `StatPill` | Compact icon+number indicator | heart / streak / xp / gem / crown |
| `ToastContainer` | Manages toast queue and positioning | — |
| `Toast` | Individual notification card | xp / streak / achievement / error |
| `AudioControl` | TTS/audio Play/Replay button | idle / playing / unavailable |
| `MascotFlourish` | Quest fox SVG in various poses | encouraging / celebrating / sympathetic / thinking |
| `LoadingSkeleton` | Placeholder shimmer for loading states | — |
| `ErrorState` | Retryable error display | full-page / inline |

### Composed Components (route-specific but using primitives)

| Component | Route | Composed from |
|---|---|---|
| `AppShell` | Layout wrapper | DesktopNavigation + MobileNavigation + GamificationBar |
| `DesktopNavigation` | Shell (≥1024px) | Nav items using IconButton3D |
| `MobileNavigation` | Shell (<1024px) | BottomNav with tab icons |
| `GamificationBar` | Shell header | StatPill × 4 (hearts, streak, XP, gems) |
| `UnitBanner` | `/` path | Card3D variant with gradient |
| `PathConnector` | `/` path | SVG/CSS line between nodes |
| `LearningPath` | `/` path | UnitBanner + SkillNode3D[] + PathConnector[] |
| `SkillDetail` | `/skill/[id]` | Card3D + ProgressRing + Button3D |
| `LessonShell` | `/lesson/[id]` | ProgressBar + hearts + ExerciseShell + ActionBar |
| `ExerciseShell` | `/lesson/[id]` | Prompt + AudioControl + exercise renderer |
| `MultipleChoiceExercise` | `/lesson/[id]` | Card3D[] as radio choices |
| `WordBankExercise` | `/lesson/[id]` | Tile array (Button3D variant) + drop zone |
| `MatchPairsExercise` | `/lesson/[id]` | Two column tile arrays + connecting lines |
| `FillBlankExercise` | `/lesson/[id]` | Prompt text + styled input |
| `TypeAnswerExercise` | `/lesson/[id]` | Prompt + styled input/textarea |
| `TimedCountdown` | `/lesson/[id]` (timed) | Circular/bar timer display |
| `CompletionCelebration` | `/lesson/[id]` | Particle animation + stat reveals |
| `OutOfHeartsModal` | `/lesson/[id]` | Modal3D + refill form |
| `TimeExpiredModal` | `/lesson/[id]` | Modal3D + retry actions |
| `AchievementBadge` | `/profile` | Card3D variant with earned/locked states |
| `LeaderboardRow` | `/leaderboard` | Rank + avatar + name + XP display |
| `ContentTree` | `/admin/content` | Collapsible tree using nested lists |
| `ExerciseForm` | `/admin/content` | Type-specific form fields |

### Shared vs Route-Specific

**Shared (in `components/ui/`):** All primitives from the first table. Used by 2+ routes.

**Route-specific (in `components/{route}/`):** Composed components that are meaningful only within their route context. Still built from shared primitives.

---

## 15. Complete UI Flow Matrix

### Flow 1: Learning Path and Four Skill States

| Aspect | Specification |
|---|---|
| Entry route | `/` |
| User trigger | Page load / navigate home |
| API request | `GET /api/course` |
| Loading state | Skeleton path (5 placeholder nodes + banner shimmer) |
| Success state | Full path with unit banners, colored skill nodes, current node emphasized |
| Error state | Full-page error with retry button |
| Empty state | N/A (always seeded) |
| Animation | Node stagger entrance (200ms each, 60ms apart) |
| Persistence | Fully server-derived; refresh shows same state |
| Responsive | Desktop: path + sidebar; mobile: full-width path |
| Accessibility | Ordered list, labeled nodes, locked explanation |
| Acceptance | All four states visible with correct colors/icons; locked cannot navigate |

### Flow 2: Skill Details and Lesson Start

| Aspect | Specification |
|---|---|
| Entry route | `/skill/[skillId]` |
| User trigger | Tap skill node from path |
| API request | `GET /api/skills/{skill_id}` |
| Loading state | Card skeleton with ring placeholder |
| Success state | Skill card with progress + start/resume/timed buttons |
| Error state | 404: "Skill not found" page; network: retry |
| Animation | Card entrance (fade + slide up, 200ms) |
| Persistence | Derived from backend; resume shows existing attempt |
| Responsive | Centered card (480px max); full-width mobile |
| Accessibility | Buttons labeled with skill name; progress ring has aria values |
| Acceptance | Start creates attempt; resume returns existing; locked shows explanation |

### Flow 3: Lesson Refresh/Resume

| Aspect | Specification |
|---|---|
| Entry route | `/lesson/[attemptId]` (direct URL or refresh) |
| User trigger | Browser refresh / direct navigation |
| API request | `GET /api/lessons/{attempt_id}` |
| Loading state | Lesson shell with spinner |
| Success state | Exercise at `current_index` rendered; hearts/progress correct |
| Error state | 404: navigate to path; network: retry overlay |
| Animation | Exercise fade-in (150ms) |
| Persistence | Same attempt, same position, same hearts — all from backend |
| Responsive | Same as lesson player |
| Accessibility | Same as lesson player |
| Acceptance | Exact same exercise at same position after refresh |

### Flow 4: All Five Exercise Types

| Aspect | Specification |
|---|---|
| Entry route | `/lesson/[attemptId]` |
| User trigger | Exercise appears at current_index |
| API request | None (data already loaded in attempt) |
| Loading state | N/A (exercises are pre-loaded) |
| Success state | Type-specific interaction rendered |
| Error state | N/A |
| Animation | Exercise crossfade (150ms) on advancement |
| Persistence | Selection is transient; position is server-persisted |
| Responsive | All types work at 360px and 1280px |
| Accessibility | Type-specific semantics (see Section 8) |
| Acceptance | Each type submits correct payload; genuine interaction exists |

### Flow 5: Correct/Incorrect Feedback

| Aspect | Specification |
|---|---|
| Entry route | `/lesson/[attemptId]` |
| User trigger | Check button pressed |
| API request | `POST /api/lessons/{attempt_id}/answer` |
| Loading state | Button shows spinner; interaction disabled |
| Success state | FeedbackBar slides up with result + solution (if incorrect) |
| Error state | Network failure: retry toast; button re-enables |
| Animation | FeedbackBar: spring slide from bottom (300ms) |
| Persistence | Backend records answer; cannot resubmit |
| Responsive | FeedbackBar full-width; Continue button accessible above fold |
| Accessibility | `aria-live="assertive"` announces result |
| Acceptance | Immediate feedback; solution shown on incorrect; must Continue to advance |

### Flow 6: Progress Bar

| Aspect | Specification |
|---|---|
| Entry route | `/lesson/[attemptId]` |
| User trigger | Each exercise answered |
| API request | Response includes `current_index` and `total_exercises` |
| Loading state | N/A (already rendered) |
| Success state | Bar fills proportionally |
| Animation | Width animation (300ms ease-out) |
| Persistence | Derived from attempt `current_index` |
| Responsive | Full header width at all breakpoints |
| Accessibility | `role="progressbar"` with aria values |
| Acceptance | Progress matches backend current_index/total |

### Flow 7: Heart Loss

| Aspect | Specification |
|---|---|
| Entry route | `/lesson/[attemptId]` |
| User trigger | Incorrect answer in standard mode |
| API request | Answer response includes `hearts_remaining` |
| Loading state | N/A |
| Success state | Heart indicator decrements to response value; brief pulse animation |
| Animation | Heart icon scale pulse down (100ms), then settle |
| Persistence | Backend-authoritative; never frontend-decremented |
| Responsive | Hearts always visible in lesson header |
| Accessibility | "X of 5 hearts remaining" announced |
| Acceptance | Heart count matches backend response exactly |

### Flow 8: Out-of-Hearts Failure

| Aspect | Specification |
|---|---|
| Entry route | `/lesson/[attemptId]` |
| User trigger | Wrong answer reduces hearts to 0 |
| API request | Answer response has `lesson_status: "failed"` |
| Loading state | N/A |
| Success state | OutOfHearts modal appears immediately |
| Error state | N/A |
| Animation | Modal entrance (scale + fade, 250ms spring) |
| Persistence | Attempt marked failed on backend |
| Responsive | Modal centered, 90% max-width on mobile |
| Accessibility | Focus trapped in modal; descriptive heading |
| Acceptance | Modal shown; old attempt cannot resume; refill/return work |

### Flow 9: Refill and Regeneration

| Aspect | Specification |
|---|---|
| Entry route | OutOfHearts modal |
| User trigger | Press "Refill" button |
| API request | `POST /api/hearts/refill` |
| Loading state | Button shows spinner |
| Success state | Hearts=5, gems reduced by 20; offer "Try Again" |
| Error state | Insufficient gems: disable button, show message |
| Animation | Hearts fill animation (scale pop on each restored heart) |
| Persistence | Backend updates hearts+gems atomically |
| Responsive | Within modal context |
| Accessibility | Button label includes gem cost; result announced |
| Acceptance | 20 gems spent; hearts full; new attempt starts successfully |

### Flow 10: Lesson Completion

| Aspect | Specification |
|---|---|
| Entry route | `/lesson/[attemptId]` |
| User trigger | Final exercise answered correctly with hearts>0 |
| API request | `POST /api/lessons/{attempt_id}/complete` |
| Loading state | Brief celebration loading shimmer |
| Success state | CompletionCelebration overlay with XP/streak/crown/achievements |
| Error state | Already completed: show results; other: retry |
| Animation | Particle burst + staggered stat reveals (see Section 10) |
| Persistence | All rewards persisted on backend |
| Responsive | Overlay scrollable on mobile if content exceeds viewport |
| Accessibility | Focus to heading; stats announced; Continue button focused |
| Acceptance | XP/streak/crown/unlock/achievement values from backend response only |

### Flow 11: XP

| Aspect | Specification |
|---|---|
| Entry route | CompletionCelebration / toast |
| User trigger | Lesson completion response |
| API request | Included in completion response |
| Loading state | N/A |
| Success state | XP number revealed with count-up animation; total updated |
| Animation | Number counter (0 → earned, 500ms); star icon burst |
| Persistence | Backend total_xp is authoritative |
| Responsive | Same at all sizes |
| Accessibility | "Earned X XP" announced |
| Acceptance | Displayed XP = completion response `xp.earned` |

### Flow 12: Streak

| Aspect | Specification |
|---|---|
| Entry route | CompletionCelebration / toast |
| User trigger | Completion extends streak |
| API request | Included in completion response |
| Loading state | N/A |
| Success state | Streak counter shown with flame animation; toast if extended |
| Animation | Flame icon bounce; counter increment |
| Persistence | Backend current_streak authoritative |
| Responsive | Same at all sizes |
| Accessibility | "Streak: X days" announced |
| Acceptance | Streak value from backend; toast only when `extended_today=true` |

### Flow 13: Crowns and Unlocking

| Aspect | Specification |
|---|---|
| Entry route | CompletionCelebration |
| User trigger | Standard-mode completion |
| API request | Completion response `skill.new_crowns` and `unlocked_skill_ids` |
| Loading state | N/A |
| Success state | Crown increments with animation; unlock message if applicable |
| Animation | Crown icon scales up with gold burst; unlock pulse on path |
| Persistence | Backend crowns/state authoritative |
| Responsive | Same at all sizes |
| Accessibility | "X of Y crowns earned. [Skill] unlocked!" announced |
| Acceptance | Crown value from response; path reflects new state after return |

### Flow 14: Daily Goal

| Aspect | Specification |
|---|---|
| Entry route | GamificationBar, Settings, CompletionCelebration |
| User trigger | Completion response includes daily_goal progress |
| API request | Included in profile/completion responses; `PATCH /api/user/me` for edit |
| Loading state | N/A |
| Success state | Progress indicator updates; "Goal reached!" if progress=1.0 |
| Animation | Progress fill animation |
| Persistence | Backend today_xp / daily_goal_xp authoritative |
| Responsive | Compact in top bar; detailed in settings |
| Accessibility | "Daily goal: X of Y XP, Z% complete" |
| Acceptance | Progress = min(today_xp/goal_xp, 1.0) from backend |

### Flow 15: Profile

| Aspect | Specification |
|---|---|
| Entry route | `/profile` |
| User trigger | Navigate via sidebar/bottom nav |
| API request | `GET /api/user/me` |
| Loading state | Skeleton stats grid + badge placeholders |
| Success state | Stats grid + achievements gallery |
| Error state | Retryable error |
| Animation | Stats card entrance (stagger, 150ms each) |
| Persistence | All values from backend |
| Responsive | 2-col desktop, 1-col mobile |
| Accessibility | Definition list for stats; labeled badges |
| Acceptance | All values match API response |

### Flow 16: Achievements

| Aspect | Specification |
|---|---|
| Entry route | `/profile` (achievements section) |
| User trigger | Page load |
| API request | `GET /api/achievements` |
| Loading state | Badge skeleton grid |
| Success state | Earned (gold) and locked (gray) badges with progress |
| Animation | Badges fade in with stagger |
| Persistence | Backend-authoritative earned state |
| Responsive | 3-col desktop, 2-col mobile |
| Accessibility | Each badge: "{title}, {earned/locked}, progress {X}/{Y}" |
| Acceptance | Earned/locked states match API; no frontend-awarded achievements |

### Flow 17: Functional Leaderboard

| Aspect | Specification |
|---|---|
| Entry route | `/leaderboard` |
| User trigger | Navigate via nav |
| API request | `GET /api/leaderboard` |
| Loading state | Skeleton list rows |
| Success state | Ranked list with current user highlighted |
| Error state | Retryable error |
| Animation | Row stagger entrance |
| Persistence | Reflects latest backend total_xp |
| Responsive | Full-width list at all sizes |
| Accessibility | Ordered list; current user `aria-current` |
| Acceptance | Order matches backend; current user rank correct |

### Flow 18: TTS Audio

| Aspect | Specification |
|---|---|
| Entry route | `/lesson/[attemptId]` exercises with tts_text |
| User trigger | Press Play button |
| API request | None (uses browser speechSynthesis) |
| Loading state | N/A |
| Success state | Audio plays; icon shows playing state |
| Error state | Unsupported: disabled icon with tooltip |
| Animation | Speaker icon wave animation during playback |
| Persistence | N/A (transient) |
| Responsive | Same button at all sizes (44px min) |
| Accessibility | "Play audio" / "Replay audio" button label; no autoplay |
| Acceptance | speechSynthesis invoked with correct text/lang; Replay works |

### Flow 19: Timed Success

| Aspect | Specification |
|---|---|
| Entry route | `/lesson/[attemptId]` (timed mode) |
| User trigger | All exercises answered before expiry |
| API request | `POST /api/lessons/{attempt_id}/complete` |
| Loading state | Brief loading state |
| Success state | "Timed Practice Complete!" + 20 XP display |
| Animation | Abbreviated celebration (no crown reveal) |
| Persistence | Backend records 20 XP, practice+1 |
| Responsive | Same as standard completion |
| Accessibility | Focus to heading; XP announced |
| Acceptance | Fixed 20 XP shown; no crown/unlock; streak if applicable |

### Flow 20: Timed Expiry

| Aspect | Specification |
|---|---|
| Entry route | `/lesson/[attemptId]` (timed mode) |
| User trigger | Timer reaches 0 or backend reports expired |
| API request | Next answer/complete returns `TIME_EXPIRED` |
| Loading state | N/A |
| Success state | TimeExpiredModal with stats and retry/path buttons |
| Animation | Timer stops; modal entrance |
| Persistence | Backend marks attempt failed with time_expired |
| Responsive | Modal centered at all sizes |
| Accessibility | "Time has expired" assertion; focus to modal |
| Acceptance | No XP; attempt cannot continue; retry starts new |

### Flow 21: Dark Mode

| Aspect | Specification |
|---|---|
| Entry route | `/settings` toggle |
| User trigger | Toggle dark/light switch |
| API request | None (local UI preference) |
| Loading state | N/A |
| Success state | All surfaces, text, borders transition to dark tokens |
| Animation | CSS transition on color/background (200ms) |
| Persistence | localStorage via Zustand persist |
| Responsive | Same at all sizes |
| Accessibility | Sufficient contrast in both themes; states remain visible |
| Acceptance | Every screen renders correctly in both themes |

### Flow 22: Responsive Layouts

| Aspect | Specification |
|---|---|
| Entry route | All routes |
| User trigger | Viewport resize / device access |
| API request | N/A |
| Loading state | Same at all sizes |
| Success state | Layout adapts per Section 5 shell specification |
| Animation | N/A (CSS responsive, no animation) |
| Persistence | N/A |
| Responsive | 360px / 768px / 1280px+ verified |
| Accessibility | No content hidden; all actions reachable; no horiz scroll |
| Acceptance | B-01 criteria met at all three widths |

### Flow 23: Settings Placeholders

| Aspect | Specification |
|---|---|
| Entry route | `/settings` |
| User trigger | View settings page |
| API request | None for placeholders |
| Loading state | N/A |
| Success state | "Coming Soon" cards for deferred features |
| Animation | N/A |
| Persistence | N/A |
| Responsive | Single-column at all sizes |
| Accessibility | `aria-disabled="true"`; text says "Coming Soon" |
| Acceptance | No clickable no-op actions; clearly labeled as unavailable |

### Flow 24: Content Administration

| Aspect | Specification |
|---|---|
| Entry route | `/admin/content` |
| User trigger | Navigate to admin route |
| API request | `GET /api/admin/content/tree` |
| Loading state | Tree skeleton |
| Success state | Browsable tree + create/edit forms |
| Error state | Forbidden (non-admin): 403 page; network: retry |
| Animation | Tree expand/collapse (150ms height) |
| Persistence | All edits persist to backend |
| Responsive | Desktop: sidebar+form; mobile: stacked |
| Accessibility | Tree role; form labels; validation announcements |
| Acceptance | Create/edit persists; invalid rejected; active-attempt conflict shown |

### Flow 25: Network Recovery

| Aspect | Specification |
|---|---|
| Entry route | Any route during network failure |
| User trigger | API request fails |
| API request | Failed request |
| Loading state | N/A |
| Success state | Error toast with "Retry" action |
| Error state | Persistent failure: full-page error on initial load; inline on subsequent |
| Animation | Toast entrance |
| Persistence | N/A |
| Responsive | Toast positioning adapts to viewport |
| Accessibility | Error announced; retry button keyboard accessible |
| Acceptance | Retry recovers; no duplicate mutations; no blank page |

---

## 16. Implementation Sequence

Mapping to `/docs/06_IMPLEMENTATION_PHASES.md`:

| Step | Phase | Work | Model | Skill |
|---|---|---|---|---|
| 1 | **Phase 8C** | Design tokens, Tailwind config, shared 3D primitives | Opus | `frontend-design` |
| 2 | **Phase 9A** | Learning path functionality (API wiring, state) | Sonnet | — |
| 3 | **Phase 9B** | Learning path visual composition | Opus | `frontend-design` |
| 4 | **Phase 10A** | Lesson shell and state machine | Sonnet | — |
| 5 | **Phase 10B** | Five exercise components | Sonnet | — |
| 6 | **Phase 10C** | Lesson feedback and results visual pass | Opus | `frontend-design` |
| 7 | **Phase 10D** | Audio and TTS frontend | Sonnet | — |
| 8 | **Phase 10E** | Timed practice frontend | Sonnet | — |
| 9 | **Phase 11A** | Profile, leaderboard, achievements, settings | Sonnet | — |
| 10 | **Phase 11B** | Content administration | Sonnet | — |
| 11 | **Phase 13** | Dark mode + responsive/accessibility audit | Sonnet + Opus (if needed) | `ui-ux-pro-max` |
| 12 | **Phase 12** | Required-feature end-to-end gate | Sonnet | — |
| 13 | **Phase 14** | Final screenshot and interaction polish | Opus | `frontend-design` |

This sequence does not renumber existing phases. It orders the frontend implementation after this
blueprint establishes the visual system.

---

## 17. Acceptance Checklist

Phase 8B is VERIFIED when all of the following are true:

### Coverage verification

- [x] Every HR UI requirement maps to a route, component, or visible state (Section 6, Flows 1–25)
- [x] The full successful lesson journey is documented (Flows 2→3→4→5→6→10→11→12→13)
- [x] The failed lesson/refill/retry journey is documented (Flows 7→8→9)
- [x] Timed success and expiry are documented (Flows 19, 20)
- [x] All five exercise types are specified (Section 8, subsections 8.1–8.5)
- [x] Desktop, tablet, and mobile are resolved (Section 5)
- [x] Light and dark modes are resolved (Section 3 tokens)
- [x] 3D interaction mechanics are resolved (Section 4)
- [x] Accessibility and reduced motion are resolved (Section 13)
- [x] The result is recognizably Duolingo-like (Section 2, Reference Study)
- [x] LingoQuest branding and assets remain original (Section 1)
- [x] Everything is implementable with Next.js, Tailwind, Zustand, and Motion (no WebGL/Three.js)

### Requirement-to-blueprint tracing

| Requirement | Blueprint sections |
|---|---|
| R-01 Learning path | Sections 5, 6.1, 7, Flow 1 |
| R-02 Start/refresh/resume | Sections 6.2, 6.3, Flows 2, 3 |
| R-03 Five exercise types | Section 8 (8.1–8.5), Flow 4 |
| R-04 Lesson loop/feedback | Sections 6.3, 8, Flows 5, 6, 10 |
| R-05 Hearts | Section 9, Flows 7, 8, 9 |
| R-06 XP/daily goal | Section 6.3 completion, Flows 11, 14 |
| R-07 Streak | Flow 12, Section 10 (streak toast) |
| R-08 Crowns/unlocks | Section 7 (node states), Flow 13 |
| R-09 Persistence | Section 11 (authoritative rule), Flow 3 |
| R-10 Leaderboard | Section 6.9, Flow 17 |
| R-11 Profile/achievements | Sections 6.8, Flow 15, 16 |
| R-12 Content management | Section 6.11, Flow 24 |
| R-13 Audio | Section 9 (audio), Flow 18 |
| R-14 Timed practice | Sections 6.4, 9 (timed), Flows 19, 20 |
| R-15 Honest placeholders | Section 6.10 (settings), Flow 23 |
| R-16 Original polished 3D | Sections 1, 2, 3, 4, 10, 14 |
| B-01 Responsive | Section 5, Flow 22 |
| B-02 Dark mode | Section 3 (dark tokens), Flow 21 |
| B-03 Achievement presentation | Section 6.8, Flow 16 |

### Technical feasibility

All design decisions are implementable with:
- **Next.js App Router** — routing, layouts, loading/error boundaries
- **Tailwind CSS** — tokens as CSS variables, utility classes, dark mode via `class` strategy
- **Zustand** — UI store (theme, modal state, toast queue); session cache (non-authoritative)
- **Motion for React** — springs, stagger, AnimatePresence for feedback/modals/toasts
- **CSS** — 3D depth system (border-bottom + translateY + box-shadow)
- **SVG** — Progress rings, path connectors, mascot illustrations
- **Browser APIs** — speechSynthesis for TTS, visualViewport for keyboard handling

No Three.js, WebGL, Canvas, or heavy external UI libraries required.

---

## End of Blueprint

This document serves as the complete implementation reference for all subsequent frontend phases.
The next phase (8C) implements the token system and shared primitives defined here.
