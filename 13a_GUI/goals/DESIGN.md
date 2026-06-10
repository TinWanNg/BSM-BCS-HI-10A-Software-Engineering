---
name: Vitality Pet
colors:
  surface: '#12131b'
  surface-dim: '#12131b'
  surface-bright: '#383842'
  surface-container-lowest: '#0d0d16'
  surface-container-low: '#1b1b24'
  surface-container: '#1f1f28'
  surface-container-high: '#292932'
  surface-container-highest: '#34343d'
  on-surface: '#e3e1ed'
  on-surface-variant: '#c5c5d8'
  inverse-surface: '#e3e1ed'
  inverse-on-surface: '#303039'
  outline: '#8f8fa1'
  outline-variant: '#454655'
  surface-tint: '#bdc2ff'
  primary: '#bdc2ff'
  on-primary: '#0010a2'
  primary-container: '#2c3bd4'
  on-primary-container: '#bcc1ff'
  inverse-primary: '#3b4ae1'
  secondary: '#bdc2ff'
  on-secondary: '#232a67'
  secondary-container: '#3a417f'
  on-secondary-container: '#a9b0f6'
  tertiary: '#ffb59e'
  on-tertiary: '#5d1800'
  tertiary-container: '#982c00'
  on-tertiary-container: '#ffb49d'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e0e0ff'
  primary-fixed-dim: '#bdc2ff'
  on-primary-fixed: '#000767'
  on-primary-fixed-variant: '#1c2bc9'
  secondary-fixed: '#dfe0ff'
  secondary-fixed-dim: '#bdc2ff'
  on-secondary-fixed: '#0b1352'
  on-secondary-fixed-variant: '#3a417f'
  tertiary-fixed: '#ffdbd0'
  tertiary-fixed-dim: '#ffb59e'
  on-tertiary-fixed: '#3a0b00'
  on-tertiary-fixed-variant: '#842500'
  background: '#12131b'
  on-background: '#e3e1ed'
  surface-variant: '#34343d'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  stat-numeric:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 40px
---

## Brand & Style
The brand personality is energetic, nurturing, and whimsical. It bridges the gap between high-performance fitness metrics and the emotional connection of a digital pet simulator. The target audience includes health-conscious individuals who find traditional fitness apps too clinical and gamers seeking real-world utility in their play.

The design style is a hybrid of **Modern Glassmorphism** and **Tactile Playfulness**, now optimized for a sleek **Dark Mode** environment. It utilizes frosted surfaces and deep indigo-violet tones to maintain a sense of premium technology, while incorporating soft, organic shapes and vibrant pops of neon color to ensure the experience remains friendly and accessible. The goal is to evoke a sense of "productive play"—where tracking a workout feels like leveling up a companion.

## Colors
This design system utilizes a "Vibrant-Balanced" palette specifically tuned for dark mode. 
- **Primary (Electric Blue):** Used for activity tracking, steps, and active states. It signals movement and health against the dark backdrop.
- **Secondary (Periwinkle):** Used for energy levels, general metrics, and supportive motivations.
- **Tertiary (Burnt Orange):** Reserved for sleep tracking, recovery metrics, or high-urgency notifications.
- **Neutral (Slate Gray):** Provides the foundational structural colors for surfaces and borders.

The background uses a deep, dark slate to reduce eye strain, while cards use semi-transparent dark fills with high backdrop blur to achieve a premium glass effect.

## Typography
The typography strategy focuses on a "Soft-Geometric" aesthetic. **Plus Jakarta Sans** is used for headings and numeric data to provide a modern, friendly, and slightly tech-forward feel. **Be Vietnam Pro** handles body copy and labels, offering exceptional readability with a warm, contemporary tone. 

Numbers are treated as hero elements. When displaying step counts or heart rates, use `stat-numeric` to emphasize progress. All headings use a slight negative letter spacing to feel more compact and "app-like." Legibility is maintained in dark mode through appropriate weight selection.

## Layout & Spacing
The layout follows a **Fluid-Safe** model. It prioritizes a single-column experience on mobile with card-based grouping.
- **Safe Margins:** A 20px horizontal margin is maintained on mobile to ensure content doesn't feel cramped against the screen edges.
- **Rhythm:** A 4px baseline grid is used. Spacing between related items within a card should be `sm` (8px), while spacing between major sections should be `xl` (32px).
- **Grid:** Use a 4-column grid for mobile and a 12-column grid for tablet/desktop. Content cards typically span the full width of the mobile grid.

## Elevation & Depth
Depth is achieved through **Glassmorphism** and light emission rather than traditional heavy shadows.
- **Base Layer:** The application background is a deep, dark solid color.
- **Mid Layer (Cards):** Uses a dark fill at 10-20% opacity with a `backdrop-filter: blur(12px)`. Borders are thin (1px) and use low-opacity neutral tones to simulate a glass edge.
- **High Layer (Buttons/Modals):** Elements that require immediate attention use a subtle ambient glow (Color: Primary, Opacity: 15%, Blur: 20px) to appear as if they are floating and emitting light above the dark glass.
- **The "Pet" Zone:** The area containing the character uses deeper background blurs and localized lighting effects to create a focused, immersive environment.

## Shapes
The shape language is "Squircle-centric."
- **Standard Cards:** Use `rounded-lg` (16px) to maintain a soft, approachable feel.
- **Interaction Elements:** Buttons and progress tracks use `rounded-xl` (24px) or full pill-shapes.
- **Icons:** Should have rounded terminals and a consistent 2px stroke width to match the typography's weight. Avoid sharp corners anywhere in the interface to keep the "cozy game" aesthetic consistent.

## Components
- **Buttons:** Primary buttons are pill-shaped with a vibrant Primary color fill and a subtle inner-glow. Secondary buttons are glass-morphic with a 1.5px colored border.
- **Glass Cards:** Every data container must have a background blur. For "Pet Health," cards can have a subtle colored glow (e.g., a faint primary or tertiary glow for specific status cards).
- **Progress Indicators:** Use thick, rounded tracks. The "filler" of the progress bar should use the Primary color with a subtle pulse animation.
- **Chips:** Small, highly rounded labels used for workout types. These use the secondary or tertiary colors with low-opacity backgrounds.
- **The Pet Avatar:** Centralized in a container with a platform "glow" beneath it to give it physical presence within the digital dark-mode UI.
- **Input Fields:** Softly rounded with a focus state that increases the backdrop blur intensity and adds a subtle Primary color outer glow.