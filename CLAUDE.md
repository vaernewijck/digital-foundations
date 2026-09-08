# CLAUDE.md

Browser tools and self-check quizzes for the Digital Foundations course. See `README.md` for the folder layout and how to publish a tool.

## House style (default for every tool)

Every page in `public/` uses the same minimal ink-on-paper look. `public/tools/running-a-program/index.html` is the reference; the abacus, binary counter, binary bingo and binary animation follow it. New tools and self-checks must too.

- **Single file.** One `index.html` per tool with inline CSS and JS, no build step, no frameworks.
- **Two colours only.** `--ink: #161615` on `--paper: #f8f8f8`. Greys (`#dcdcda`, `#ececea`) are allowed for surfaces in illustrations. No accent colours, no gradients, no shadows. State is shown by inverting: filled ink vs outlined paper.
- **Typeface.** Space Grotesk from Google Fonts (weights 300, 400, 500, 700), `-webkit-font-smoothing: antialiased`, `font-feature-settings: "zero"`, tabular numerals where numbers change.
- **Square corners.** `* { border-radius: 0 }`. Borders and rules are 1px or 2px solid ink. Circles (beads, dots) are the only exception.
- **Spacing scale.** `--s1: .62667rem`, `--s2: .94rem`, `--s3: 1.41rem`.
- **Shell.** A `.top` header with the uppercase `h1`, a light-weight one-line subtitle, and the controls on the right, separated from the content by a 1px rule. Content sits in a centred stage below.
- **Buttons.** Transparent with a 2px ink border, uppercase, bold, letter-spaced. Hover inverts to ink on paper. Disabled fades to 35% opacity. Focus ring is a paper-then-ink double box-shadow.
- **Motion.** Short (≤ .3s) and respected by `prefers-reduced-motion`.
- **Copy.** English, short, no exclamation marks. Labels uppercase and letter-spaced; hints at 300 weight and reduced opacity.
- **Title.** `<title>Tool name - Digital Foundations</title>`.
